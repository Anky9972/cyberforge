/**
 * Java VM Executor with Docker Sandbox
 * Executes Java code in isolated Docker containers with security policies
 */

// @ts-ignore - dockerode types
import Docker from 'dockerode';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const docker = new Docker();

interface ExecutionOptions {
  timeout?: number;
  memoryLimit?: number;
  cpuShares?: number;
  networkDisabled?: boolean;
}

interface ExecutionResult {
  output: string;
  error?: string;
  exitCode: number;
  crashed: boolean;
  executionTime: number;
  memoryUsed?: number;
}

class JavaVMExecutor extends EventEmitter {
  private readonly IMAGE = 'openjdk:11-jre-slim';
  private readonly DEFAULT_TIMEOUT = 10000; // Java needs more time for JVM startup
  private readonly DEFAULT_MEMORY = 1024 * 1024 * 1024; // 1GB
  private readonly TEMP_DIR = path.join(process.cwd(), 'temp-java-execution');

  constructor() {
    super();
    this.initializeTempDir();
  }

  private async initializeTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  /**
   * Ensure Docker image is pulled
   */
  async ensureImage(): Promise<void> {
    try {
      await docker.getImage(this.IMAGE).inspect();
      console.log(`✅ Java image ${this.IMAGE} already available`);
    } catch (error) {
      console.log(`📥 Pulling Java image ${this.IMAGE}...`);
      await new Promise((resolve, reject) => {
        docker.pull(this.IMAGE, (err: any, stream: any) => {
          if (err) return reject(err);
          
          docker.modem.followProgress(stream, (err: any) => {
            if (err) return reject(err);
            console.log(`✅ Image ${this.IMAGE} pulled successfully`);
            resolve(true);
          });
        });
      });
    }
  }

  /**
   * Extract class name from Java code
   */
  private extractClassName(code: string): string {
    const match = code.match(/public\s+class\s+(\w+)/);
    return match ? match[1] : 'Main';
  }

  /**
   * Execute Java code in Docker container
   */
  async execute(
    code: string,
    input: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = crypto.randomBytes(8).toString('hex');
    
    const timeout = options.timeout || this.DEFAULT_TIMEOUT;
    const memoryLimit = options.memoryLimit || this.DEFAULT_MEMORY;
    const networkDisabled = options.networkDisabled !== false;

    let container: Docker.Container | null = null;

    try {
      const className = this.extractClassName(code);
      const javaFile = path.join(this.TEMP_DIR, `${className}_${executionId}.java`);
      const inputFile = path.join(this.TEMP_DIR, `input_${executionId}.txt`);
      
      await fs.writeFile(javaFile, code, 'utf-8');
      await fs.writeFile(inputFile, input, 'utf-8');

      // Create container with Java security policy
      container = await docker.createContainer({
        Image: this.IMAGE,
        Cmd: [
          '/bin/sh',
          '-c',
          `cd /app && javac ${className}_${executionId}.java && java -Djava.security.manager -Djava.security.policy=/app/security.policy ${className}_${executionId} < /app/input.txt`
        ],
        AttachStdout: true,
        AttachStderr: true,
        NetworkDisabled: networkDisabled,
        HostConfig: {
          Memory: memoryLimit,
          MemorySwap: memoryLimit,
          CpuShares: options.cpuShares || 512,
          PidsLimit: 100,
          ReadonlyRootfs: false,
          Binds: [
            `${javaFile}:/app/${className}_${executionId}.java:ro`,
            `${inputFile}:/app/input.txt:ro`,
            `${this.getSecurityPolicyPath()}:/app/security.policy:ro`
          ],
          AutoRemove: true,
          SecurityOpt: ['no-new-privileges'],
          CapDrop: ['ALL']
        }
      });

      await container.start();

      const timeoutPromise = new Promise<ExecutionResult>((_, reject) => {
        setTimeout(() => reject(new Error('Execution timeout')), timeout);
      });

      const executionPromise = this.waitForExecution(container);
      const result = await Promise.race([executionPromise, timeoutPromise]);
      
      result.executionTime = Date.now() - startTime;

      await this.cleanup(javaFile, inputFile);

      return result;
    } catch (error: any) {
      if (container) {
        try {
          await container.kill();
          await container.remove();
        } catch (killError) {
          // Already stopped
        }
      }

      return {
        output: '',
        error: error.message,
        exitCode: -1,
        crashed: true,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get Java security policy file path
   */
  private getSecurityPolicyPath(): string {
    const policyPath = path.join(this.TEMP_DIR, 'java.policy');
    
    // Create restrictive security policy if it doesn't exist
    const policy = `
grant {
  permission java.io.FilePermission "/app/input.txt", "read";
  permission java.io.FilePermission "/tmp/-", "read,write,delete";
  permission java.lang.RuntimePermission "exitVM";
  permission java.util.PropertyPermission "*", "read";
};
    `;
    
    try {
      fs.writeFile(policyPath, policy, 'utf-8');
    } catch (error) {
      console.error('Error creating security policy:', error);
    }
    
    return policyPath;
  }

  private async waitForExecution(container: Docker.Container): Promise<ExecutionResult> {
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true
    });

    let output = '';
    let error = '';

    stream.on('data', (chunk: Buffer) => {
      const data = chunk.toString();
      if (data.includes('Exception') || data.includes('Error') || data.includes('error')) {
        error += data;
      } else {
        output += data;
      }
    });

    const exitData = await container.wait();
    const exitCode = exitData.StatusCode;

    const stats = await container.stats({ stream: false });
    const memoryUsed = (stats as any).memory_stats?.usage || 0;

    return {
      output: output.trim(),
      error: error.trim() || undefined,
      exitCode,
      crashed: exitCode !== 0,
      executionTime: 0,
      memoryUsed
    };
  }

  /**
   * Fuzz Java code with multiple inputs
   */
  async fuzz(
    code: string,
    inputs: string[],
    options: ExecutionOptions = {}
  ): Promise<{
    crashes: Array<{ input: string; result: ExecutionResult }>;
    totalExecutions: number;
    successRate: number;
  }> {
    await this.ensureImage();

    const crashes: Array<{ input: string; result: ExecutionResult }> = [];
    let successCount = 0;

    this.emit('fuzzStarted', { totalInputs: inputs.length });

    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      
      try {
        const result = await this.execute(code, input, options);
        
        if (result.crashed) {
          crashes.push({ input, result });
        } else {
          successCount++;
        }

        this.emit('fuzzProgress', {
          current: i + 1,
          total: inputs.length,
          crashes: crashes.length
        });
      } catch (error) {
        console.error(`Error fuzzing with input ${i}:`, error);
      }
    }

    this.emit('fuzzCompleted', {
      totalExecutions: inputs.length,
      crashes: crashes.length,
      successRate: (successCount / inputs.length) * 100
    });

    return {
      crashes,
      totalExecutions: inputs.length,
      successRate: (successCount / inputs.length) * 100
    };
  }

  private async cleanup(...files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // Ignore
      }
    }
  }

  async cleanupAll(): Promise<void> {
    try {
      const files = await fs.readdir(this.TEMP_DIR);
      for (const file of files) {
        await fs.unlink(path.join(this.TEMP_DIR, file));
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  async killAllContainers(): Promise<void> {
    const containers = await docker.listContainers({
      filters: { ancestor: [this.IMAGE] }
    });
    
    for (const containerInfo of containers) {
      try {
        const container = docker.getContainer(containerInfo.Id);
        await container.kill();
        await container.remove();
      } catch (error) {
        console.error(`Error killing container:`, error);
      }
    }
  }
}

export const javaVMExecutor = new JavaVMExecutor();
export default JavaVMExecutor;

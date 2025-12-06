/**
 * Python VM Executor with Docker Sandbox
 * Executes Python code in isolated Docker containers with resource limits
 */
import Docker from 'dockerode';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
const docker = new Docker();
class PythonVMExecutor extends EventEmitter {
    IMAGE = 'python:3.11-alpine';
    DEFAULT_TIMEOUT = 5000;
    DEFAULT_MEMORY = 512 * 1024 * 1024; // 512MB
    TEMP_DIR = path.join(process.cwd(), 'temp-execution');
    constructor() {
        super();
        this.initializeTempDir();
    }
    /**
     * Initialize temporary directory for code execution
     */
    async initializeTempDir() {
        try {
            await fs.mkdir(this.TEMP_DIR, { recursive: true });
        }
        catch (error) {
            console.error('Error creating temp directory:', error);
        }
    }
    /**
     * Ensure Docker image is pulled
     */
    async ensureImage() {
        try {
            await docker.getImage(this.IMAGE).inspect();
            console.log(`✅ Python image ${this.IMAGE} already available`);
        }
        catch (error) {
            console.log(`📥 Pulling Python image ${this.IMAGE}...`);
            await new Promise((resolve, reject) => {
                docker.pull(this.IMAGE, (err, stream) => {
                    if (err)
                        return reject(err);
                    docker.modem.followProgress(stream, (err) => {
                        if (err)
                            return reject(err);
                        console.log(`✅ Image ${this.IMAGE} pulled successfully`);
                        resolve(true);
                    });
                });
            });
        }
    }
    /**
     * Execute Python code in Docker container
     */
    async execute(code, input, options = {}) {
        const startTime = Date.now();
        const executionId = crypto.randomBytes(8).toString('hex');
        const timeout = options.timeout || this.DEFAULT_TIMEOUT;
        const memoryLimit = options.memoryLimit || this.DEFAULT_MEMORY;
        const networkDisabled = options.networkDisabled !== false;
        let container = null;
        try {
            // Create temporary file with code
            const codeFile = path.join(this.TEMP_DIR, `exec_${executionId}.py`);
            const inputFile = path.join(this.TEMP_DIR, `input_${executionId}.txt`);
            await fs.writeFile(codeFile, code, 'utf-8');
            await fs.writeFile(inputFile, input, 'utf-8');
            // Create container
            container = await docker.createContainer({
                Image: this.IMAGE,
                Cmd: ['python', `/app/exec_${executionId}.py`],
                Stdin: true,
                AttachStdin: true,
                AttachStdout: true,
                AttachStderr: true,
                NetworkDisabled: networkDisabled,
                HostConfig: {
                    Memory: memoryLimit,
                    MemorySwap: memoryLimit, // Prevent swap
                    CpuShares: options.cpuShares || 512,
                    PidsLimit: 50,
                    ReadonlyRootfs: false,
                    Binds: [
                        `${codeFile}:/app/exec_${executionId}.py:ro`,
                        `${inputFile}:/app/input.txt:ro`
                    ],
                    AutoRemove: true,
                    SecurityOpt: ['no-new-privileges'],
                    CapDrop: ['ALL']
                }
            });
            // Start container
            await container.start();
            // Set timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Execution timeout'));
                }, timeout);
            });
            // Wait for execution
            const executionPromise = this.waitForExecution(container);
            const result = await Promise.race([executionPromise, timeoutPromise]);
            result.executionTime = Date.now() - startTime;
            // Cleanup
            await this.cleanup(codeFile, inputFile);
            return result;
        }
        catch (error) {
            // Kill container if timeout
            if (container) {
                try {
                    await container.kill();
                    await container.remove();
                }
                catch (killError) {
                    // Container already stopped
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
     * Wait for container execution to complete
     */
    async waitForExecution(container) {
        const stream = await container.attach({
            stream: true,
            stdout: true,
            stderr: true
        });
        let output = '';
        let error = '';
        stream.on('data', (chunk) => {
            const data = chunk.toString();
            if (data.includes('error') || data.includes('Error') || data.includes('Traceback')) {
                error += data;
            }
            else {
                output += data;
            }
        });
        const exitData = await container.wait();
        const exitCode = exitData.StatusCode;
        // Get container stats
        const stats = await container.stats({ stream: false });
        const memoryUsed = stats.memory_stats?.usage || 0;
        return {
            output: output.trim(),
            error: error.trim() || undefined,
            exitCode,
            crashed: exitCode !== 0,
            executionTime: 0, // Will be set by caller
            memoryUsed
        };
    }
    /**
     * Fuzz Python code with multiple inputs
     */
    async fuzz(code, inputs, options = {}) {
        await this.ensureImage();
        const crashes = [];
        let successCount = 0;
        this.emit('fuzzStarted', { totalInputs: inputs.length });
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            try {
                const result = await this.execute(code, input, options);
                if (result.crashed) {
                    crashes.push({ input, result });
                }
                else {
                    successCount++;
                }
                this.emit('fuzzProgress', {
                    current: i + 1,
                    total: inputs.length,
                    crashes: crashes.length
                });
            }
            catch (error) {
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
    /**
     * Cleanup temporary files
     */
    async cleanup(...files) {
        for (const file of files) {
            try {
                await fs.unlink(file);
            }
            catch (error) {
                // Ignore cleanup errors
            }
        }
    }
    /**
     * Clean all temporary files
     */
    async cleanupAll() {
        try {
            const files = await fs.readdir(this.TEMP_DIR);
            for (const file of files) {
                await fs.unlink(path.join(this.TEMP_DIR, file));
            }
        }
        catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
    /**
     * List running containers
     */
    async listRunningContainers() {
        return await docker.listContainers({
            filters: { ancestor: [this.IMAGE] }
        });
    }
    /**
     * Kill all running execution containers
     */
    async killAllContainers() {
        const containers = await this.listRunningContainers();
        for (const containerInfo of containers) {
            try {
                const container = docker.getContainer(containerInfo.Id);
                await container.kill();
                await container.remove();
            }
            catch (error) {
                console.error(`Error killing container ${containerInfo.Id}:`, error);
            }
        }
    }
}
export const pythonVMExecutor = new PythonVMExecutor();
export default PythonVMExecutor;
//# sourceMappingURL=pythonVMExecutor.js.map
/**
 * Java VM Executor with Docker Sandbox
 * Executes Java code in isolated Docker containers with security policies
 */
import { EventEmitter } from 'events';
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
declare class JavaVMExecutor extends EventEmitter {
    private readonly IMAGE;
    private readonly DEFAULT_TIMEOUT;
    private readonly DEFAULT_MEMORY;
    private readonly TEMP_DIR;
    constructor();
    private initializeTempDir;
    /**
     * Ensure Docker image is pulled
     */
    ensureImage(): Promise<void>;
    /**
     * Extract class name from Java code
     */
    private extractClassName;
    /**
     * Execute Java code in Docker container
     */
    execute(code: string, input: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    /**
     * Get Java security policy file path
     */
    private getSecurityPolicyPath;
    private waitForExecution;
    /**
     * Fuzz Java code with multiple inputs
     */
    fuzz(code: string, inputs: string[], options?: ExecutionOptions): Promise<{
        crashes: Array<{
            input: string;
            result: ExecutionResult;
        }>;
        totalExecutions: number;
        successRate: number;
    }>;
    private cleanup;
    cleanupAll(): Promise<void>;
    killAllContainers(): Promise<void>;
}
export declare const javaVMExecutor: JavaVMExecutor;
export default JavaVMExecutor;
//# sourceMappingURL=javaVMExecutor.d.ts.map
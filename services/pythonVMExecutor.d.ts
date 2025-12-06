/**
 * Python VM Executor with Docker Sandbox
 * Executes Python code in isolated Docker containers with resource limits
 */
import Docker from 'dockerode';
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
declare class PythonVMExecutor extends EventEmitter {
    private readonly IMAGE;
    private readonly DEFAULT_TIMEOUT;
    private readonly DEFAULT_MEMORY;
    private readonly TEMP_DIR;
    constructor();
    /**
     * Initialize temporary directory for code execution
     */
    private initializeTempDir;
    /**
     * Ensure Docker image is pulled
     */
    ensureImage(): Promise<void>;
    /**
     * Execute Python code in Docker container
     */
    execute(code: string, input: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    /**
     * Wait for container execution to complete
     */
    private waitForExecution;
    /**
     * Fuzz Python code with multiple inputs
     */
    fuzz(code: string, inputs: string[], options?: ExecutionOptions): Promise<{
        crashes: Array<{
            input: string;
            result: ExecutionResult;
        }>;
        totalExecutions: number;
        successRate: number;
    }>;
    /**
     * Cleanup temporary files
     */
    private cleanup;
    /**
     * Clean all temporary files
     */
    cleanupAll(): Promise<void>;
    /**
     * List running containers
     */
    listRunningContainers(): Promise<Docker.ContainerInfo[]>;
    /**
     * Kill all running execution containers
     */
    killAllContainers(): Promise<void>;
}
export declare const pythonVMExecutor: PythonVMExecutor;
export default PythonVMExecutor;
//# sourceMappingURL=pythonVMExecutor.d.ts.map
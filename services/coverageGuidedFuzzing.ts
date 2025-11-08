/**
 * COVERAGE-GUIDED FUZZING ENGINE
 * Uses Istanbul for code instrumentation and coverage feedback
 * Implements AFL++-style coverage-guided fuzzing
 */

import * as vm from 'vm';
import { createInstrumenter } from 'istanbul-lib-instrument';
import type { CoverageMapData } from 'istanbul-lib-coverage';

export interface CoverageGuidedFuzzConfig {
    maxExecutions: number;
    timeout: number;
    coverageThreshold: number; // Percentage of code to cover
}

export interface CoverageFuzzResult {
    functionName: string;
    totalExecutions: number;
    crashes: FuzzCrash[];
    coverageData: CoverageMapData;
    coveragePercent: number;
    interestingInputs: any[][]; // Inputs that increased coverage
    duration: number;
}

export interface FuzzCrash {
    input: any[];
    error: string;
    stackTrace: string;
    crashType: 'exception' | 'timeout' | 'memory' | 'assertion';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

export class CoverageGuidedFuzzingEngine {
    private config: CoverageGuidedFuzzConfig;
    private instrumenter: any;
    private globalCoverage: Map<string, Set<string>> = new Map();

    constructor(config: Partial<CoverageGuidedFuzzConfig> = {}) {
        this.config = {
            maxExecutions: config.maxExecutions || 1000,
            timeout: config.timeout || 2000,
            coverageThreshold: config.coverageThreshold || 80
        };

        this.instrumenter = createInstrumenter({
            coverageVariable: '__coverage__',
            preserveComments: true,
            compact: false,
            esModules: true,
            produceSourceMap: false
        });
    }

    /**
     * Fuzz function with coverage-guided input generation
     * Uses feedback loop to maximize code coverage
     */
    async fuzzFunctionWithCoverage(
        code: string,
        functionName: string,
        paramTypes: string[]
    ): Promise<CoverageFuzzResult> {
        console.log(`📊 Starting COVERAGE-GUIDED fuzzing of ${functionName}`);
        
        const startTime = Date.now();
        const crashes: FuzzCrash[] = [];
        const interestingInputs: any[][] = [];
        
        // Instrument code for coverage tracking
        const instrumentedCode = this.instrumenter.instrumentSync(code, `${functionName}.js`);
        
        // Initialize coverage tracking
        const sandbox: any = {
            __coverage__: {},
            console: { log: () => {}, error: () => {} },
            setTimeout: undefined,
            setInterval: undefined,
            require: undefined,
            process: undefined,
            global: undefined
        };

        const context = vm.createContext(sandbox);
        
        try {
            // Load instrumented code
            vm.runInContext(instrumentedCode, context, { timeout: this.config.timeout });
        } catch (error) {
            console.error('Failed to instrument code:', error);
            throw new Error('Code instrumentation failed');
        }

        let previousCoverage = 0;
        let inputQueue: any[][] = [];
        
        // Seed initial inputs
        for (let i = 0; i < 10; i++) {
            inputQueue.push(this.generateInitialInput(paramTypes));
        }

        let executionCount = 0;

        while (executionCount < this.config.maxExecutions && inputQueue.length > 0) {
            const testInput = inputQueue.shift()!;
            executionCount++;

            try {
                // Reset coverage for this execution
                sandbox.__coverage__ = {};
                
                // Execute function
                const code = `${functionName}(${testInput.map(i => JSON.stringify(i)).join(', ')})`;
                vm.runInContext(code, context, { timeout: this.config.timeout });
                
                // Analyze coverage
                const currentCoverage = this.calculateCoverage(sandbox.__coverage__);
                
                // If this input increased coverage, it's interesting!
                if (currentCoverage > previousCoverage) {
                    interestingInputs.push(testInput);
                    previousCoverage = currentCoverage;
                    
                    console.log(`🎯 Coverage increased to ${currentCoverage.toFixed(2)}% with input: ${JSON.stringify(testInput).substring(0, 50)}`);
                    
                    // Generate mutations of this interesting input
                    const mutations = this.mutateInterestingInput(testInput, paramTypes);
                    inputQueue.push(...mutations);
                }
                
            } catch (error) {
                // Found a crash!
                const crash = this.analyzeCrash(functionName, testInput, error, 'exception');
                crashes.push(crash);
                
                console.log(`💥 Coverage-guided fuzzing found crash: ${crash.error.substring(0, 100)}`);
                
                // Mutate crashing input to find related bugs
                const mutations = this.mutateInterestingInput(testInput, paramTypes, 5);
                inputQueue.push(...mutations);
            }

            // Check if we hit coverage threshold
            if (previousCoverage >= this.config.coverageThreshold) {
                console.log(`✅ Reached coverage threshold of ${this.config.coverageThreshold}%`);
                break;
            }
        }

        const duration = Date.now() - startTime;
        
        return {
            functionName,
            totalExecutions: executionCount,
            crashes,
            coverageData: sandbox.__coverage__,
            coveragePercent: previousCoverage,
            interestingInputs,
            duration
        };
    }

    /**
     * Calculate code coverage percentage from Istanbul coverage data
     */
    private calculateCoverage(coverageData: any): number {
        if (!coverageData || Object.keys(coverageData).length === 0) {
            return 0;
        }

        let totalStatements = 0;
        let coveredStatements = 0;

        for (const filePath in coverageData) {
            const fileCoverage = coverageData[filePath];
            
            if (fileCoverage.s) {
                for (const stmtId in fileCoverage.s) {
                    totalStatements++;
                    if (fileCoverage.s[stmtId] > 0) {
                        coveredStatements++;
                    }
                }
            }
        }

        return totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
    }

    /**
     * Generate initial seed inputs for fuzzing
     */
    private generateInitialInput(paramTypes: string[]): any[] {
        return paramTypes.map(type => {
            switch (type.toLowerCase()) {
                case 'string':
                    return ['', 'test', 'a', 'A'.repeat(100)][Math.floor(Math.random() * 4)];
                case 'number':
                    return [0, 1, -1, 100, 0.5][Math.floor(Math.random() * 5)];
                case 'boolean':
                    return Math.random() > 0.5;
                case 'object':
                    return [{}, { key: 'value' }][Math.floor(Math.random() * 2)];
                case 'array':
                    return [[], [1, 2, 3], ['a', 'b']][Math.floor(Math.random() * 3)];
                default:
                    return null;
            }
        });
    }

    /**
     * Mutate an interesting input to explore nearby code paths
     * This is the core of AFL++-style fuzzing
     */
    private mutateInterestingInput(input: any[], paramTypes: string[], count: number = 10): any[][] {
        const mutations: any[][] = [];

        for (let i = 0; i < count; i++) {
            const mutated = [...input];
            const indexToMutate = Math.floor(Math.random() * input.length);
            
            mutated[indexToMutate] = this.mutateValue(
                mutated[indexToMutate],
                paramTypes[indexToMutate]
            );
            
            mutations.push(mutated);
        }

        return mutations;
    }

    /**
     * Mutate a single value using various strategies
     */
    private mutateValue(value: any, type: string): any {
        const strategy = Math.floor(Math.random() * 5);

        if (typeof value === 'string') {
            switch (strategy) {
                case 0: return value + 'X'; // Append
                case 1: return value.substring(0, value.length - 1); // Truncate
                case 2: return value.repeat(2); // Duplicate
                case 3: return value.replace(/./g, 'A'); // Replace chars
                case 4: return value + '\x00'; // Null byte injection
            }
        } else if (typeof value === 'number') {
            switch (strategy) {
                case 0: return value + 1;
                case 1: return value - 1;
                case 2: return value * 2;
                case 3: return value / 2;
                case 4: return -value;
            }
        } else if (Array.isArray(value)) {
            switch (strategy) {
                case 0: return [...value, 'X'];
                case 1: return value.slice(0, -1);
                case 2: return [...value, ...value];
                case 3: return [];
                case 4: return new Array(1000).fill('X');
            }
        }

        return value;
    }

    /**
     * Analyze crash to determine severity and type
     */
    private analyzeCrash(
        functionName: string,
        input: any[],
        error: any,
        crashType: FuzzCrash['crashType']
    ): FuzzCrash {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stackTrace = error instanceof Error ? error.stack || '' : '';
        
        let severity: FuzzCrash['severity'] = 'Medium';
        
        if (errorMessage.includes('TIMEOUT')) {
            severity = 'High';
            crashType = 'timeout';
        } else if (errorMessage.includes('Maximum call stack') || errorMessage.includes('out of memory')) {
            severity = 'Critical';
            crashType = 'memory';
        } else if (errorMessage.includes('RangeError') || errorMessage.includes('TypeError')) {
            severity = 'High';
        }
        
        return {
            input,
            error: errorMessage,
            stackTrace,
            crashType,
            severity
        };
    }

    /**
     * Generate detailed report from coverage-guided fuzzing results
     */
    generateReport(result: CoverageFuzzResult): string {
        return `
# Coverage-Guided Fuzzing Report

## Function: ${result.functionName}

### Execution Summary
- Total Executions: ${result.totalExecutions}
- Duration: ${(result.duration / 1000).toFixed(2)}s
- Code Coverage: ${result.coveragePercent.toFixed(2)}%
- Crashes Found: ${result.crashes.length}
- Interesting Inputs: ${result.interestingInputs.length}

### Crashes
${result.crashes.map((crash, i) => `
**Crash #${i + 1}** (${crash.severity})
- Input: \`${JSON.stringify(crash.input)}\`
- Error: ${crash.error}
- Type: ${crash.crashType}
`).join('\n')}

### Interesting Inputs (Coverage-Increasing)
${result.interestingInputs.slice(0, 10).map((input, i) => `
${i + 1}. \`${JSON.stringify(input)}\`
`).join('\n')}

### Coverage Analysis
This fuzzing session achieved ${result.coveragePercent.toFixed(2)}% code coverage using intelligent mutation strategies.
        `.trim();
    }
}

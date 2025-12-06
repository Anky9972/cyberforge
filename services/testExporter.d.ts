/**
 * Property-Based Test Export Service
 *
 * Features:
 * - Turn minimized crashing inputs into tests for Jest/pytest/JUnit
 * - One-click "Generate failing test" functionality
 * - Support for multiple testing frameworks
 * - Includes reproduction steps and assertions
 */
export interface TestCase {
    id: string;
    name: string;
    description: string;
    input: string | Buffer;
    expectedBehavior: string;
    actualBehavior: string;
    severity: string;
    crashInfo?: {
        signal: string;
        stackTrace: string;
        errorMessage: string;
    };
}
export interface GeneratedTest {
    framework: 'jest' | 'pytest' | 'junit' | 'mocha' | 'go';
    filename: string;
    content: string;
    language: string;
}
declare class PropertyBasedTestExportService {
    /**
     * Generate test from crash
     */
    generateTest(testCase: TestCase, framework: 'jest' | 'pytest' | 'junit' | 'mocha' | 'go', options?: {
        targetFunction?: string;
        importPath?: string;
        setupCode?: string;
        teardownCode?: string;
    }): GeneratedTest;
    /**
     * Generate Jest/JavaScript test
     */
    private generateJestTest;
    /**
     * Generate pytest/Python test
     */
    private generatePytestTest;
    /**
     * Generate JUnit/Java test
     */
    private generateJUnitTest;
    /**
     * Generate Mocha/JavaScript test
     */
    private generateMochaTest;
    /**
     * Generate Go test
     */
    private generateGoTest;
    /**
     * Format input based on language
     */
    private formatInput;
    /**
     * Generate assertion based on test case and framework
     */
    private generateAssertion;
    /**
     * Sanitize test name
     */
    private sanitizeTestName;
    /**
     * Convert to camelCase
     */
    private toCamelCase;
    /**
     * Generate multiple tests from crash cluster
     */
    generateTestSuite(crashes: TestCase[], framework: 'jest' | 'pytest' | 'junit' | 'mocha' | 'go', options?: any): GeneratedTest[];
    /**
     * Generate test configuration file
     */
    generateTestConfig(framework: 'jest' | 'pytest' | 'junit' | 'mocha' | 'go'): string;
}
export declare const testExporter: PropertyBasedTestExportService;
export {};
//# sourceMappingURL=testExporter.d.ts.map
/**
 * Property-Based Test Export Service
 *
 * Features:
 * - Turn minimized crashing inputs into tests for Jest/pytest/JUnit
 * - One-click "Generate failing test" functionality
 * - Support for multiple testing frameworks
 * - Includes reproduction steps and assertions
 */
class PropertyBasedTestExportService {
    /**
     * Generate test from crash
     */
    generateTest(testCase, framework, options = {}) {
        switch (framework) {
            case 'jest':
                return this.generateJestTest(testCase, options);
            case 'pytest':
                return this.generatePytestTest(testCase, options);
            case 'junit':
                return this.generateJUnitTest(testCase, options);
            case 'mocha':
                return this.generateMochaTest(testCase, options);
            case 'go':
                return this.generateGoTest(testCase, options);
            default:
                throw new Error(`Unsupported framework: ${framework}`);
        }
    }
    /**
     * Generate Jest/JavaScript test
     */
    generateJestTest(testCase, options) {
        const functionName = options.targetFunction || 'targetFunction';
        const importPath = options.importPath || './target';
        const inputStr = this.formatInput(testCase.input, 'javascript');
        const content = `/**
 * Auto-generated regression test from FuzzForge
 * Test ID: ${testCase.id}
 * Generated: ${new Date().toISOString()}
 * Severity: ${testCase.severity}
 */

const { ${functionName} } = require('${importPath}');

describe('FuzzForge Regression Tests', () => {
  ${options.setupCode ? `beforeEach(() => {\n    ${options.setupCode}\n  });\n\n` : ''}
  test('${this.sanitizeTestName(testCase.name)}', () => {
    // Description: ${testCase.description}
    // Expected: ${testCase.expectedBehavior}
    // Actual: ${testCase.actualBehavior}

    const input = ${inputStr};

    // This test captures a crash found during fuzzing
    // ${testCase.crashInfo ? `Signal: ${testCase.crashInfo.signal}` : ''}
    // ${testCase.crashInfo ? `Error: ${testCase.crashInfo.errorMessage}` : ''}

    expect(() => {
      ${functionName}(input);
    }).${this.generateAssertion(testCase, 'jest')};
  });
  ${options.teardownCode ? `\n  afterEach(() => {\n    ${options.teardownCode}\n  });` : ''}
});
`;
        return {
            framework: 'jest',
            filename: `fuzzforge-regression-${testCase.id}.test.js`,
            content,
            language: 'javascript'
        };
    }
    /**
     * Generate pytest/Python test
     */
    generatePytestTest(testCase, options) {
        const functionName = options.targetFunction || 'target_function';
        const importPath = options.importPath || 'target';
        const inputStr = this.formatInput(testCase.input, 'python');
        const content = `"""
Auto-generated regression test from FuzzForge
Test ID: ${testCase.id}
Generated: ${new Date().toISOString()}
Severity: ${testCase.severity}
"""

import pytest
from ${importPath} import ${functionName}

${options.setupCode ? `@pytest.fixture\ndef setup():\n    ${options.setupCode}\n    yield\n    ${options.teardownCode || ''}\n\n` : ''}
def test_${this.sanitizeTestName(testCase.name).replace(/-/g, '_')}(${options.setupCode ? 'setup' : ''}):
    """
    ${testCase.description}
    
    Expected: ${testCase.expectedBehavior}
    Actual: ${testCase.actualBehavior}
    ${testCase.crashInfo ? `\n    Signal: ${testCase.crashInfo.signal}` : ''}
    ${testCase.crashInfo ? `Error: ${testCase.crashInfo.errorMessage}` : ''}
    """
    
    input_data = ${inputStr}
    
    # This test captures a crash found during fuzzing
    ${this.generateAssertion(testCase, 'pytest')}
        ${functionName}(input_data)
`;
        return {
            framework: 'pytest',
            filename: `test_fuzzforge_regression_${testCase.id}.py`,
            content,
            language: 'python'
        };
    }
    /**
     * Generate JUnit/Java test
     */
    generateJUnitTest(testCase, options) {
        const functionName = options.targetFunction || 'targetFunction';
        const className = options.className || 'TargetClass';
        const inputStr = this.formatInput(testCase.input, 'java');
        const content = `/**
 * Auto-generated regression test from FuzzForge
 * Test ID: ${testCase.id}
 * Generated: ${new Date().toISOString()}
 * Severity: ${testCase.severity}
 */

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

public class FuzzForgeRegressionTest_${testCase.id.replace(/-/g, '_')} {
    
    ${options.setupCode ? `@BeforeEach\n    public void setup() {\n        ${options.setupCode}\n    }\n\n` : ''}
    @Test
    @DisplayName("${this.sanitizeTestName(testCase.name)}")
    public void test${this.toCamelCase(testCase.name)}() {
        // Description: ${testCase.description}
        // Expected: ${testCase.expectedBehavior}
        // Actual: ${testCase.actualBehavior}
        ${testCase.crashInfo ? `// Signal: ${testCase.crashInfo.signal}` : ''}
        ${testCase.crashInfo ? `// Error: ${testCase.crashInfo.errorMessage}` : ''}

        String input = ${inputStr};
        
        ${this.generateAssertion(testCase, 'junit')} {
            ${className}.${functionName}(input);
        });
    }
    ${options.teardownCode ? `\n    @AfterEach\n    public void teardown() {\n        ${options.teardownCode}\n    }` : ''}
}
`;
        return {
            framework: 'junit',
            filename: `FuzzForgeRegressionTest_${testCase.id.replace(/-/g, '_')}.java`,
            content,
            language: 'java'
        };
    }
    /**
     * Generate Mocha/JavaScript test
     */
    generateMochaTest(testCase, options) {
        const functionName = options.targetFunction || 'targetFunction';
        const importPath = options.importPath || './target';
        const inputStr = this.formatInput(testCase.input, 'javascript');
        const content = `/**
 * Auto-generated regression test from FuzzForge
 * Test ID: ${testCase.id}
 * Generated: ${new Date().toISOString()}
 * Severity: ${testCase.severity}
 */

const { expect } = require('chai');
const { ${functionName} } = require('${importPath}');

describe('FuzzForge Regression Tests', function() {
  ${options.setupCode ? `beforeEach(function() {\n    ${options.setupCode}\n  });\n\n` : ''}
  it('${this.sanitizeTestName(testCase.name)}', function() {
    // Description: ${testCase.description}
    // Expected: ${testCase.expectedBehavior}
    // Actual: ${testCase.actualBehavior}
    ${testCase.crashInfo ? `// Signal: ${testCase.crashInfo.signal}` : ''}
    ${testCase.crashInfo ? `// Error: ${testCase.crashInfo.errorMessage}` : ''}

    const input = ${inputStr};

    expect(() => {
      ${functionName}(input);
    }).${this.generateAssertion(testCase, 'mocha')};
  });
  ${options.teardownCode ? `\n  afterEach(function() {\n    ${options.teardownCode}\n  });` : ''}
});
`;
        return {
            framework: 'mocha',
            filename: `fuzzforge-regression-${testCase.id}.test.js`,
            content,
            language: 'javascript'
        };
    }
    /**
     * Generate Go test
     */
    generateGoTest(testCase, options) {
        const functionName = options.targetFunction || 'TargetFunction';
        const packageName = options.packageName || 'target';
        const inputStr = this.formatInput(testCase.input, 'go');
        const content = `// Auto-generated regression test from FuzzForge
// Test ID: ${testCase.id}
// Generated: ${new Date().toISOString()}
// Severity: ${testCase.severity}

package ${packageName}

import (
    "testing"
)

func TestFuzzForge_${this.toCamelCase(testCase.name)}(t *testing.T) {
    // Description: ${testCase.description}
    // Expected: ${testCase.expectedBehavior}
    // Actual: ${testCase.actualBehavior}
    ${testCase.crashInfo ? `// Signal: ${testCase.crashInfo.signal}` : ''}
    ${testCase.crashInfo ? `// Error: ${testCase.crashInfo.errorMessage}` : ''}

    input := ${inputStr}
    
    ${this.generateAssertion(testCase, 'go')}
        ${functionName}(input)
    }
}
`;
        return {
            framework: 'go',
            filename: `fuzzforge_regression_${testCase.id}_test.go`,
            content,
            language: 'go'
        };
    }
    /**
     * Format input based on language
     */
    formatInput(input, language) {
        const inputStr = typeof input === 'string' ? input : input.toString();
        switch (language) {
            case 'javascript':
                return JSON.stringify(inputStr);
            case 'python':
                // Escape for Python string
                return `"${inputStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
            case 'java':
                return `"${inputStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
            case 'go':
                return `\`${inputStr.replace(/`/g, '\\`')}\``;
            default:
                return JSON.stringify(inputStr);
        }
    }
    /**
     * Generate assertion based on test case and framework
     */
    generateAssertion(testCase, framework) {
        const hasError = testCase.crashInfo && testCase.crashInfo.signal;
        switch (framework) {
            case 'jest':
                return hasError ? 'toThrow()' : 'not.toThrow()';
            case 'pytest':
                return hasError ? 'with pytest.raises(Exception):' : 'try:';
            case 'junit':
                return hasError ? 'assertThrows(Exception.class, () ->' : 'assertDoesNotThrow(() ->';
            case 'mocha':
                return hasError ? 'to.throw()' : 'to.not.throw()';
            case 'go':
                return hasError
                    ? 'defer func() {\n        if r := recover(); r == nil {\n            t.Error("Expected panic but got none")\n        }\n    }()\n    '
                    : '';
            default:
                return '';
        }
    }
    /**
     * Sanitize test name
     */
    sanitizeTestName(name) {
        return name
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
    }
    /**
     * Convert to camelCase
     */
    toCamelCase(str) {
        return str
            .replace(/[^a-zA-Z0-9]/g, ' ')
            .split(' ')
            .map((word, index) => index === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('');
    }
    /**
     * Generate multiple tests from crash cluster
     */
    generateTestSuite(crashes, framework, options = {}) {
        return crashes.map(crash => this.generateTest(crash, framework, options));
    }
    /**
     * Generate test configuration file
     */
    generateTestConfig(framework) {
        switch (framework) {
            case 'jest':
                return `module.exports = {
  testMatch: ['**/fuzzforge-regression-*.test.js'],
  testTimeout: 10000,
  bail: false,
  verbose: true
};`;
            case 'pytest':
                return `[tool:pytest]
testpaths = .
python_files = test_fuzzforge_regression_*.py
python_functions = test_*
addopts = -v --tb=short`;
            case 'junit':
                return `<!-- Add to pom.xml -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/FuzzForgeRegressionTest_*.java</include>
        </includes>
    </configuration>
</plugin>`;
            case 'mocha':
                return `{
  "spec": "fuzzforge-regression-*.test.js",
  "timeout": 10000,
  "bail": false
}`;
            case 'go':
                return `// Run with: go test -v ./...`;
            default:
                return '';
        }
    }
}
// Singleton instance
export const testExporter = new PropertyBasedTestExportService();
//# sourceMappingURL=testExporter.js.map
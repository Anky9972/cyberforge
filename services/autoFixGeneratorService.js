/**
 * AI-Powered Auto-Fix Generator Service
 * Uses Gemini API to generate automated vulnerability patches with tests
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
class AutoFixGeneratorService {
    genAI = null;
    model = null;
    constructor() {
        this.initialize();
    }
    /**
     * Initialize Gemini AI
     */
    async initialize() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('⚠️  GEMINI_API_KEY not set. Auto-fix will use fallback mode.');
            return;
        }
        try {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            console.log('✅ Auto-Fix Generator initialized with Gemini API');
        }
        catch (error) {
            console.error('Failed to initialize Gemini AI:', error);
        }
    }
    /**
     * Generate fix for a vulnerability
     */
    async generateFix(vulnerability, fullCode) {
        if (!this.model) {
            return this.generateFallbackFix(vulnerability);
        }
        const prompt = this.buildFixPrompt(vulnerability, fullCode);
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            return this.parseFixResponse(text, vulnerability.codeSnippet);
        }
        catch (error) {
            console.error('Error generating fix:', error);
            return this.generateFallbackFix(vulnerability);
        }
    }
    /**
     * Build prompt for fix generation
     */
    buildFixPrompt(vulnerability, fullCode) {
        return `You are an expert security engineer. Analyze this security vulnerability and generate a complete fix.

**Vulnerability Details:**
- Type: ${vulnerability.type}
- Severity: ${vulnerability.severity}
- Description: ${vulnerability.description}
- File: ${vulnerability.fileName}
- Line: ${vulnerability.lineNumber}

**Vulnerable Code:**
\`\`\`
${vulnerability.codeSnippet}
\`\`\`

${fullCode ? `**Full File Context:**\n\`\`\`\n${fullCode}\n\`\`\`\n` : ''}

**Task:**
Generate a secure fix that:
1. Completely patches the vulnerability
2. Maintains all existing functionality
3. Adds proper input validation and error handling
4. Follows security best practices
5. Includes comprehensive unit tests

**Response Format:**
Provide your response in the following JSON format:
\`\`\`json
{
  "patchedCode": "... the fixed code ...",
  "tests": "... unit tests for the fix ...",
  "explanation": "... detailed explanation of the fix ...",
  "confidence": 0.95,
  "changes": [
    {
      "type": "modify",
      "lineNumber": 10,
      "content": "... what changed ..."
    }
  ]
}
\`\`\`

Generate the fix now:`;
    }
    /**
     * Parse AI response into structured result
     */
    parseFixResponse(response, originalCode) {
        try {
            // Extract JSON from response
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[1] || jsonMatch[0];
                const parsed = JSON.parse(jsonStr);
                return {
                    originalCode,
                    patchedCode: parsed.patchedCode || originalCode,
                    tests: parsed.tests || '',
                    explanation: parsed.explanation || 'Fix generated',
                    confidence: parsed.confidence || 0.8,
                    changes: parsed.changes || []
                };
            }
            // Fallback: try to extract code blocks
            const codeBlocks = response.match(/```[\s\S]*?```/g) || [];
            const patchedCode = codeBlocks[0]?.replace(/```\w*\n?/g, '').trim() || originalCode;
            const tests = codeBlocks[1]?.replace(/```\w*\n?/g, '').trim() || '';
            return {
                originalCode,
                patchedCode,
                tests,
                explanation: response,
                confidence: 0.7,
                changes: []
            };
        }
        catch (error) {
            console.error('Error parsing fix response:', error);
            return {
                originalCode,
                patchedCode: originalCode,
                tests: '',
                explanation: 'Failed to parse fix response',
                confidence: 0.3,
                changes: []
            };
        }
    }
    /**
     * Generate fallback fix (rule-based)
     */
    generateFallbackFix(vulnerability) {
        let patchedCode = vulnerability.codeSnippet;
        let tests = '';
        let explanation = '';
        const changes = [];
        switch (vulnerability.type) {
            case 'SQL_INJECTION':
                patchedCode = this.fixSQLInjection(vulnerability.codeSnippet);
                explanation = 'Replaced string concatenation with parameterized query';
                tests = this.generateSQLInjectionTests();
                changes.push({
                    type: 'modify',
                    lineNumber: vulnerability.lineNumber,
                    content: 'Changed to parameterized query'
                });
                break;
            case 'XSS':
                patchedCode = this.fixXSS(vulnerability.codeSnippet);
                explanation = 'Added output encoding to prevent XSS';
                tests = this.generateXSSTests();
                changes.push({
                    type: 'add',
                    lineNumber: vulnerability.lineNumber,
                    content: 'Added sanitization'
                });
                break;
            case 'COMMAND_INJECTION':
                patchedCode = this.fixCommandInjection(vulnerability.codeSnippet);
                explanation = 'Replaced shell command with safe API';
                tests = this.generateCommandInjectionTests();
                break;
            case 'PATH_TRAVERSAL':
                patchedCode = this.fixPathTraversal(vulnerability.codeSnippet);
                explanation = 'Added path validation and sanitization';
                tests = this.generatePathTraversalTests();
                break;
            default:
                explanation = 'Added input validation and error handling';
                patchedCode = this.addGenericSecurity(vulnerability.codeSnippet);
        }
        return {
            originalCode: vulnerability.codeSnippet,
            patchedCode,
            tests,
            explanation,
            confidence: 0.75,
            changes
        };
    }
    /**
     * Fix SQL Injection
     */
    fixSQLInjection(code) {
        // Replace string concatenation with parameterized query
        return code
            .replace(/query\s*\(\s*['"`].*?\$\{(\w+)\}.*?['"`]\s*\)/g, 'query("... WHERE id = ?", [$1])')
            .replace(/query\s*\(\s*['"`].*?\+\s*(\w+)\s*\+.*?['"`]\s*\)/g, 'query("... WHERE id = ?", [$1])');
    }
    /**
     * Fix XSS
     */
    fixXSS(code) {
        return code.replace(/innerHTML\s*=\s*(\w+)/g, 'textContent = $1 // or use DOMPurify.sanitize($1)');
    }
    /**
     * Fix Command Injection
     */
    fixCommandInjection(code) {
        return code.replace(/exec\s*\(\s*['"`].*?\$\{(\w+)\}.*?['"`]\s*\)/g, 'execFile("command", [$1], { shell: false })');
    }
    /**
     * Fix Path Traversal
     */
    fixPathTraversal(code) {
        return `// Validate and sanitize path
const sanitizedPath = path.normalize($1).replace(/^(\\.\\.\\/)+/, '');
if (sanitizedPath.includes('..')) {
  throw new Error('Invalid path');
}
${code}`;
    }
    /**
     * Add generic security
     */
    addGenericSecurity(code) {
        return `// Input validation
if (!input || typeof input !== 'string') {
  throw new Error('Invalid input');
}

// Sanitize input
const sanitized = input.replace(/[^a-zA-Z0-9]/g, '');

${code.replace(/input/g, 'sanitized')}`;
    }
    /**
     * Generate SQL Injection tests
     */
    generateSQLInjectionTests() {
        return `
describe('SQL Injection Fix', () => {
  it('should prevent SQL injection with single quote', async () => {
    const malicious = "' OR '1'='1";
    await expect(query(malicious)).rejects.toThrow();
  });

  it('should handle valid input correctly', async () => {
    const valid = "123";
    const result = await query(valid);
    expect(result).toBeDefined();
  });
});`;
    }
    /**
     * Generate XSS tests
     */
    generateXSSTests() {
        return `
describe('XSS Fix', () => {
  it('should prevent XSS with script tag', () => {
    const malicious = '<script>alert("XSS")</script>';
    const result = sanitize(malicious);
    expect(result).not.toContain('<script>');
  });

  it('should preserve safe content', () => {
    const safe = 'Hello World';
    const result = sanitize(safe);
    expect(result).toBe(safe);
  });
});`;
    }
    /**
     * Generate Command Injection tests
     */
    generateCommandInjectionTests() {
        return `
describe('Command Injection Fix', () => {
  it('should prevent command injection', async () => {
    const malicious = "; rm -rf /";
    await expect(executeCommand(malicious)).rejects.toThrow();
  });
});`;
    }
    /**
     * Generate Path Traversal tests
     */
    generatePathTraversalTests() {
        return `
describe('Path Traversal Fix', () => {
  it('should prevent directory traversal', () => {
    const malicious = '../../../etc/passwd';
    expect(() => readFile(malicious)).toThrow();
  });
});`;
    }
    /**
     * Batch generate fixes for multiple vulnerabilities
     */
    async generateBatchFixes(vulnerabilities) {
        const fixes = [];
        for (const vuln of vulnerabilities) {
            const fix = await this.generateFix(vuln);
            fixes.push(fix);
        }
        return fixes;
    }
}
export const autoFixGeneratorService = new AutoFixGeneratorService();
export default AutoFixGeneratorService;
//# sourceMappingURL=autoFixGeneratorService.js.map
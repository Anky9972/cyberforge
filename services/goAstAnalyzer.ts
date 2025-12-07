/**
 * Go AST Analyzer
 * Analyzes Go code for security vulnerabilities
 */

import type { CKGData, CKGNode, CKGEdge } from '../types';

interface GoSecurityPattern {
    type: string;
    pattern: RegExp;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
}

export class GoASTAnalyzer {
    private securityPatterns: GoSecurityPattern[] = [
        {
            type: 'SQL Injection',
            pattern: /db\.(?:Query|Exec)\s*\(\s*(?:fmt\.Sprintf|"[^"]*"\s*\+|\w+\s*\+)/,
            severity: 'Critical',
            description: 'Potential SQL injection via string concatenation'
        },
        {
            type: 'Command Injection',
            pattern: /exec\.Command\s*\([^,]+,\s*(?![\[\]])\w+/,
            severity: 'Critical',
            description: 'Command execution with unsanitized input'
        },
        {
            type: 'Path Traversal',
            pattern: /(?:os\.Open|ioutil\.ReadFile|os\.ReadFile)\s*\(\s*(?!\s*filepath\.Clean)\w+/,
            severity: 'High',
            description: 'File operation without path sanitization'
        },
        {
            type: 'Hardcoded Credentials',
            pattern: /(?:password|secret|token|apikey)\s*:=\s*"[^"]{8,}"/i,
            severity: 'High',
            description: 'Hardcoded credentials detected'
        },
        {
            type: 'Weak Crypto',
            pattern: /crypto\/(?:md5|sha1|des|rc4)/,
            severity: 'Medium',
            description: 'Use of weak cryptographic algorithm'
        },
        {
            type: 'Insecure Random',
            pattern: /math\/rand(?!\.Seed\(time\.Now)/,
            severity: 'Medium',
            description: 'Using math/rand instead of crypto/rand for security-sensitive operations'
        },
        {
            type: 'HTTP without TLS',
            pattern: /http\.ListenAndServe\s*\(\s*":\d+"/,
            severity: 'Medium',
            description: 'HTTP server without TLS'
        },
        {
            type: 'XML External Entity',
            pattern: /xml\.(?:Unmarshal|Decoder).*(?!DisallowUnknownFields)/,
            severity: 'High',
            description: 'XML parsing without XXE protection'
        },
        {
            type: 'Race Condition',
            pattern: /go\s+func\s*\([^)]*\)\s*{[^}]*(?:shared\w+|global\w+)/,
            severity: 'Medium',
            description: 'Potential race condition with shared data'
        },
        {
            type: 'Error Handling',
            pattern: /(?:err|error)\s*:?=\s*[^;]+;\s*(?!if|return)/,
            severity: 'Low',
            description: 'Error not checked'
        }
    ];

    /**
     * Analyze Go code
     */
    analyzeGoCode(code: string, filename: string): CKGData {
        const nodes: CKGNode[] = [];
        const edges: CKGEdge[] = [];
        const lines = code.split('\n');

        // Extract package and imports
        const packageMatch = code.match(/package\s+(\w+)/);
        const packageName = packageMatch ? packageMatch[1] : 'main';

        // Extract functions
        const functionRegex = /func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(([^)]*)\)/g;
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const funcName = match[1];
            const params = match[2];
            const startPos = match.index;
            const lineNumber = code.substring(0, startPos).split('\n').length;

            nodes.push({
                id: funcName,
                label: `${funcName}()`,
                type: 'Function'
            });
        }

        // Extract structs
        const structRegex = /type\s+(\w+)\s+struct\s*{/g;
        while ((match = structRegex.exec(code)) !== null) {
            const structName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: structName,
                label: structName,
                type: 'Class'
            });
        }

        // Extract interfaces
        const interfaceRegex = /type\s+(\w+)\s+interface\s*{/g;
        while ((match = interfaceRegex.exec(code)) !== null) {
            const interfaceName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: interfaceName,
                label: interfaceName,
                type: 'Class'
            });
        }

        // Detect security issues
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const pattern of this.securityPatterns) {
                if (pattern.pattern.test(line)) {
                    nodes.push({
                        id: `vuln_${i}_${pattern.type}`,
                        label: `${pattern.type}: ${pattern.description}`,
                        type: 'Dependency'
                    });
                }
            }
        }

        // Detect function calls and create edges
        for (const node of nodes.filter(n => n.type === 'Function')) {
            const funcName = node.id;
            const funcCallRegex = new RegExp(`\\b(\\w+)\\s*\\(`, 'g');
            
            // Find function body
            const funcDefRegex = new RegExp(`func\\s+(?:\\([^)]+\\)\\s+)?${funcName}\\s*\\([^)]*\\)\\s*(?:\\([^)]*\\))?\\s*{`);
            const funcMatch = funcDefRegex.exec(code);
            
            if (funcMatch) {
                const startIdx = funcMatch.index + funcMatch[0].length;
                let braceCount = 1;
                let endIdx = startIdx;
                
                for (let i = startIdx; i < code.length && braceCount > 0; i++) {
                    if (code[i] === '{') braceCount++;
                    if (code[i] === '}') braceCount--;
                    endIdx = i;
                }
                
                const funcBody = code.substring(startIdx, endIdx);
                let callMatch;
                
                while ((callMatch = funcCallRegex.exec(funcBody)) !== null) {
                    const calledFunc = callMatch[1];
                    
                    // Check if called function exists in our nodes
                    if (nodes.some(n => n.id === calledFunc)) {
                        edges.push({
                            source: funcName,
                            target: calledFunc
                        });
                    }
                }
            }
        }

        return {
            summary: `Go Analysis: Found ${nodes.length} code elements with ${edges.length} relationships`,
            nodes,
            edges
        };
    }

    /**
     * Detect Go-specific vulnerabilities
     */
    detectGoVulnerabilities(code: string, filename: string): Array<{
        type: string;
        severity: string;
        line: number;
        code: string;
        description: string;
    }> {
        const vulnerabilities: Array<any> = [];
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            for (const pattern of this.securityPatterns) {
                if (pattern.pattern.test(line)) {
                    vulnerabilities.push({
                        type: pattern.type,
                        severity: pattern.severity,
                        line: i + 1,
                        code: line.trim(),
                        description: pattern.description,
                        filename
                    });
                }
            }
        }

        return vulnerabilities;
    }
}

export const goAstAnalyzer = new GoASTAnalyzer();

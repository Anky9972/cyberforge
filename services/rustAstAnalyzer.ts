/**
 * Rust AST Analyzer
 * Analyzes Rust code for security vulnerabilities and unsafe patterns
 */

import type { CKGData, CKGNode, CKGEdge } from '../types';

interface RustSecurityPattern {
    type: string;
    pattern: RegExp;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
}

export class RustASTAnalyzer {
    private securityPatterns: RustSecurityPattern[] = [
        {
            type: 'Unsafe Block',
            pattern: /unsafe\s+{/,
            severity: 'High',
            description: 'Unsafe block detected - requires manual security review'
        },
        {
            type: 'Raw Pointer Dereference',
            pattern: /\*(?:const|mut)\s+\w+/,
            severity: 'High',
            description: 'Raw pointer usage - potential memory safety issue'
        },
        {
            type: 'Unwrap Without Check',
            pattern: /\.unwrap\(\)(?!\s*\/\/\s*safe)/,
            severity: 'Medium',
            description: 'Using unwrap() can cause panic - use expect() or proper error handling'
        },
        {
            type: 'Expect Without Context',
            pattern: /\.expect\(""\)/,
            severity: 'Low',
            description: 'Empty expect message - provide meaningful error context'
        },
        {
            type: 'SQL Injection',
            pattern: /(?:query|execute)\s*\([^)]*format!\s*\(/,
            severity: 'Critical',
            description: 'Potential SQL injection via format! macro'
        },
        {
            type: 'Command Injection',
            pattern: /Command::new\([^)]*format!\s*\(/,
            severity: 'Critical',
            description: 'Command execution with formatted string - potential injection'
        },
        {
            type: 'Panic in Production',
            pattern: /panic!\s*\(/,
            severity: 'Medium',
            description: 'Explicit panic - use Result/Error handling instead'
        },
        {
            type: 'Unvalidated Path',
            pattern: /(?:File::open|read_to_string|write)\s*\([^)]*(?!Path::new|PathBuf).*\)/,
            severity: 'High',
            description: 'File operation without path validation'
        },
        {
            type: 'Transmute Usage',
            pattern: /mem::transmute/,
            severity: 'Critical',
            description: 'mem::transmute is extremely unsafe - consider alternatives'
        },
        {
            type: 'Uninitialized Memory',
            pattern: /mem::(?:uninitialized|zeroed)/,
            severity: 'Critical',
            description: 'Reading uninitialized memory is undefined behavior'
        },
        {
            type: 'Integer Overflow',
            pattern: /(?:as\s+(?:u8|u16|u32|i8|i16|i32))(?!\s*\.checked_)/,
            severity: 'Medium',
            description: 'Type casting without overflow check'
        },
        {
            type: 'Weak Crypto',
            pattern: /use\s+(?:md5|sha1)::/,
            severity: 'Medium',
            description: 'Weak cryptographic algorithm'
        },
        {
            type: 'Insecure Random',
            pattern: /rand::thread_rng\(\)(?!.*StdRng)/,
            severity: 'Low',
            description: 'Using thread_rng for security-sensitive operations'
        },
        {
            type: 'Unsafe Trait Implementation',
            pattern: /unsafe\s+impl/,
            severity: 'High',
            description: 'Unsafe trait implementation - requires careful review'
        }
    ];

    /**
     * Analyze Rust code
     */
    analyzeRustCode(code: string, filename: string): CKGData {
        const nodes: CKGNode[] = [];
        const edges: CKGEdge[] = [];
        const lines = code.split('\n');

        // Extract module/crate info
        const crateMatch = code.match(/(?:mod|crate)\s+(\w+)/);
        const crateName = crateMatch ? crateMatch[1] : 'main';

        // Extract functions
        const functionRegex = /(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*(?:<[^>]+>)?\s*\(([^)]*)\)/g;
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
        const structRegex = /(?:pub\s+)?struct\s+(\w+)(?:<[^>]+>)?\s*{/g;
        while ((match = structRegex.exec(code)) !== null) {
            const structName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: structName,
                label: structName,
                type: 'Class'
            });
        }

        // Extract traits
        const traitRegex = /(?:pub\s+)?trait\s+(\w+)(?:<[^>]+>)?\s*{/g;
        while ((match = traitRegex.exec(code)) !== null) {
            const traitName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: traitName,
                label: traitName,
                type: 'Class'
            });
        }

        // Extract impl blocks
        const implRegex = /impl(?:<[^>]+>)?\s+(?:(\w+)\s+for\s+)?(\w+)\s*{/g;
        while ((match = implRegex.exec(code)) !== null) {
            const trait = match[1];
            const struct = match[2];

            if (trait && nodes.some(n => n.id === trait) && nodes.some(n => n.id === struct)) {
                edges.push({
                    source: struct,
                    target: trait
                });
            }
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

        // Detect function calls
        for (const node of nodes.filter(n => n.type === 'Function')) {
            const funcName = node.id;
            const funcCallRegex = new RegExp(`\\b(\\w+)\\s*\\(`, 'g');
            
            // Find function body (simplified)
            const funcDefRegex = new RegExp(`fn\\s+${funcName}\\s*(?:<[^>]+>)?\\s*\\([^)]*\\)\\s*(?:->\\s*[^{]+)?{`);
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
            summary: `Rust Analysis: Found ${nodes.length} code elements with ${edges.length} relationships`,
            nodes,
            edges
        };
    }

    /**
     * Detect Rust-specific vulnerabilities
     */
    detectRustVulnerabilities(code: string, filename: string): Array<{
        type: string;
        severity: string;
        line: number;
        code: string;
        description: string;
        recommendation?: string;
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
                        filename,
                        recommendation: this.getRecommendation(pattern.type)
                    });
                }
            }
        }

        return vulnerabilities;
    }

    /**
     * Get security recommendations for specific issue types
     */
    private getRecommendation(issueType: string): string {
        const recommendations: Record<string, string> = {
            'Unsafe Block': 'Minimize unsafe code. Consider using safe abstractions or well-tested crates.',
            'Unwrap Without Check': 'Replace .unwrap() with .expect("meaningful message") or use ? operator.',
            'SQL Injection': 'Use parameterized queries with sqlx or diesel crates.',
            'Command Injection': 'Validate and sanitize input before passing to Command::new().',
            'Transmute Usage': 'Use safer alternatives like From/Into traits or explicit type conversions.',
            'Integer Overflow': 'Use checked_*, saturating_*, or wrapping_* methods for arithmetic.',
            'Panic in Production': 'Return Result<T, E> instead of panicking.'
        };

        return recommendations[issueType] || 'Review this code for potential security issues.';
    }
}

export const rustAstAnalyzer = new RustASTAnalyzer();

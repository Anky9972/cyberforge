/**
 * PHP AST Analyzer
 * Analyzes PHP code for security vulnerabilities
 */

import type { CKGData, CKGNode, CKGEdge } from '../types';

interface PHPSecurityPattern {
    type: string;
    pattern: RegExp;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    description: string;
}

export class PHPASTAnalyzer {
    private securityPatterns: PHPSecurityPattern[] = [
        {
            type: 'SQL Injection',
            pattern: /(?:mysqli_query|mysql_query|pg_query)\s*\([^,]+,\s*["'].*\$\w+/,
            severity: 'Critical',
            description: 'SQL query with string concatenation - use prepared statements'
        },
        {
            type: 'SQL Injection via Concat',
            pattern: /\$(?:query|sql)\s*=\s*["'][^"']*["']\s*\.\s*\$\w+/,
            severity: 'Critical',
            description: 'SQL injection via string concatenation'
        },
        {
            type: 'Command Injection',
            pattern: /(?:exec|shell_exec|system|passthru|popen)\s*\([^)]*\$\w+/,
            severity: 'Critical',
            description: 'Command execution with unsanitized input'
        },
        {
            type: 'File Inclusion',
            pattern: /(?:include|require|include_once|require_once)\s*\([^)]*\$(?:_GET|_POST|_REQUEST)/,
            severity: 'Critical',
            description: 'File inclusion with user input - RCE vulnerability'
        },
        {
            type: 'Path Traversal',
            pattern: /(?:fopen|file_get_contents|readfile|file)\s*\([^)]*\$(?:_GET|_POST|_REQUEST)(?!.*realpath)/,
            severity: 'High',
            description: 'File operation with unsanitized user input'
        },
        {
            type: 'XSS',
            pattern: /echo\s+\$(?:_GET|_POST|_REQUEST)(?!.*(?:htmlspecialchars|htmlentities))/,
            severity: 'High',
            description: 'Direct output of user input without sanitization'
        },
        {
            type: 'Eval Usage',
            pattern: /eval\s*\(/,
            severity: 'Critical',
            description: 'eval() usage - severe security risk, avoid at all costs'
        },
        {
            type: 'Deserialization',
            pattern: /unserialize\s*\(\s*\$(?:_GET|_POST|_REQUEST|_COOKIE)/,
            severity: 'Critical',
            description: 'Unsafe deserialization - can lead to RCE'
        },
        {
            type: 'Weak Crypto',
            pattern: /(?:md5|sha1)\s*\([^)]*password/i,
            severity: 'High',
            description: 'Weak password hashing - use password_hash() with bcrypt'
        },
        {
            type: 'Hardcoded Credentials',
            pattern: /\$(?:password|pass|secret|api_?key)\s*=\s*["'][^"']{6,}["']/i,
            severity: 'High',
            description: 'Hardcoded credentials detected'
        },
        {
            type: 'Disabled Error Reporting',
            pattern: /error_reporting\s*\(\s*0\s*\)/,
            severity: 'Medium',
            description: 'Error reporting disabled - hides security issues'
        },
        {
            type: 'Register Globals',
            pattern: /ini_set\s*\(\s*["']register_globals["']\s*,\s*["']?(?:1|on|true)/i,
            severity: 'Critical',
            description: 'register_globals is extremely dangerous'
        },
        {
            type: 'Insecure Session',
            pattern: /session_start\(\)(?!.*session_regenerate_id)/,
            severity: 'Medium',
            description: 'Session without regeneration - session fixation vulnerability'
        },
        {
            type: 'CSRF Vulnerability',
            pattern: /\$_(?:POST|GET|REQUEST)\[["']action["']\](?!.*(?:csrf|token))/i,
            severity: 'High',
            description: 'State-changing operation without CSRF protection'
        },
        {
            type: 'Open Redirect',
            pattern: /header\s*\(\s*["']Location:\s*["']\s*\.\s*\$(?:_GET|_POST|_REQUEST)/,
            severity: 'Medium',
            description: 'Unvalidated redirect - open redirect vulnerability'
        },
        {
            type: 'LDAP Injection',
            pattern: /ldap_search\s*\([^)]*\$(?:_GET|_POST|_REQUEST)/,
            severity: 'High',
            description: 'LDAP query with unsanitized input'
        },
        {
            type: 'XXE Vulnerability',
            pattern: /(?:simplexml_load_(?:string|file)|DOMDocument::load)(?!.*(?:LIBXML_NOENT|libxml_disable_entity_loader))/,
            severity: 'High',
            description: 'XML parsing without XXE protection'
        }
    ];

    /**
     * Analyze PHP code
     */
    analyzePHPCode(code: string, filename: string): CKGData {
        const nodes: CKGNode[] = [];
        const edges: CKGEdge[] = [];
        const lines = code.split('\n');

        // Extract namespace
        const namespaceMatch = code.match(/namespace\s+([\w\\]+)/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'global';

        // Extract functions
        const functionRegex = /(?:public|private|protected|static)?\s*function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;

        while ((match = functionRegex.exec(code)) !== null) {
            const funcName = match[1];
            const params = match[2];
            const startPos = match.index;
            const lineNumber = code.substring(0, startPos).split('\n').length;
            const visibility = match[0].match(/(public|private|protected)/)?.[1] || 'public';

            nodes.push({
                id: funcName,
                label: `${funcName}()`,
                type: 'Function'
            });
        }

        // Extract classes
        const classRegex = /(?:abstract\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*{/g;
        while ((match = classRegex.exec(code)) !== null) {
            const className = match[1];
            const extendsClass = match[2];
            const implementsList = match[3];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: className,
                label: className,
                type: 'Class'
            });

            // Add inheritance edge
            if (extendsClass) {
                edges.push({
                    source: className,
                    target: extendsClass
                });
            }

            // Add implementation edges
            if (implementsList) {
                implementsList.split(',').forEach(iface => {
                    edges.push({
                        source: className,
                        target: iface.trim()
                    });
                });
            }
        }

        // Extract interfaces
        const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+([\w,\s]+))?\s*{/g;
        while ((match = interfaceRegex.exec(code)) !== null) {
            const interfaceName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: interfaceName,
                label: interfaceName,
                type: 'Class'
            });
        }

        // Extract traits
        const traitRegex = /trait\s+(\w+)\s*{/g;
        while ((match = traitRegex.exec(code)) !== null) {
            const traitName = match[1];
            const lineNumber = code.substring(0, match.index).split('\n').length;

            nodes.push({
                id: traitName,
                label: traitName,
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

        // Detect function calls and method calls
        for (const node of nodes.filter(n => n.type === 'Function')) {
            const funcName = node.id;
            // Simplified function call detection
            const callRegex = new RegExp(`(?:->|::)?(\\w+)\\s*\\(`, 'g');
            
            const funcDefRegex = new RegExp(`function\\s+${funcName}\\s*\\([^)]*\\)\\s*{`);
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
                
                while ((callMatch = callRegex.exec(funcBody)) !== null) {
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
            summary: `PHP Analysis: Found ${nodes.length} code elements with ${edges.length} relationships`,
            nodes,
            edges
        };
    }

    /**
     * Detect PHP-specific vulnerabilities
     */
    detectPHPVulnerabilities(code: string, filename: string): Array<{
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
     * Get security recommendations
     */
    private getRecommendation(issueType: string): string {
        const recommendations: Record<string, string> = {
            'SQL Injection': 'Use PDO with prepared statements: $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?"); $stmt->execute([$id]);',
            'Command Injection': 'Use escapeshellarg() or escapeshellcmd() to sanitize input, or avoid exec() entirely',
            'XSS': 'Use htmlspecialchars($input, ENT_QUOTES, \'UTF-8\') to escape output',
            'File Inclusion': 'Never include files based on user input. Use a whitelist of allowed files.',
            'Eval Usage': 'Remove eval() - it\'s almost never necessary and extremely dangerous',
            'Deserialization': 'Validate input before unserialize() or use JSON instead',
            'Weak Crypto': 'Use password_hash($password, PASSWORD_BCRYPT) for password hashing',
            'CSRF Vulnerability': 'Implement CSRF tokens for all state-changing operations',
            'Open Redirect': 'Validate redirect URLs against a whitelist of allowed domains'
        };

        return recommendations[issueType] || 'Review PHP security best practices for this issue.';
    }
}

export const phpAstAnalyzer = new PHPASTAnalyzer();

/**
 * Auto-Fix Service
 * Generates and applies security patches automatically
 */

interface VulnerabilityFix {
    vulnerabilityType: string;
    filePath: string;
    lineNumber: number;
    originalCode: string;
    fixedCode: string;
    explanation: string;
    confidence: 'high' | 'medium' | 'low';
}

interface GitPatch {
    filePath: string;
    diff: string;
    hunks: PatchHunk[];
}

interface PatchHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: string[];
}

export class AutoFixService {
    /**
     * Generate automatic fix for common vulnerabilities
     */
    static generateFix(vulnerability: {
        type: string;
        description: string;
        codeSnippet?: string;
        filePath?: string;
        lineNumber?: number;
    }): VulnerabilityFix | null {
        const { type, description, codeSnippet, filePath, lineNumber } = vulnerability;

        // SQL Injection Fix
        if (type.toLowerCase().includes('sql injection')) {
            return this.fixSQLInjection(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        // XSS Fix
        if (type.toLowerCase().includes('xss') || type.toLowerCase().includes('cross-site scripting')) {
            return this.fixXSS(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        // Hardcoded Secret Fix
        if (type.toLowerCase().includes('hardcoded') || type.toLowerCase().includes('secret')) {
            return this.fixHardcodedSecret(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        // Path Traversal Fix
        if (type.toLowerCase().includes('path traversal') || type.toLowerCase().includes('directory traversal')) {
            return this.fixPathTraversal(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        // Insecure Deserialization Fix
        if (type.toLowerCase().includes('deserialization')) {
            return this.fixInsecureDeserialization(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        // Command Injection Fix
        if (type.toLowerCase().includes('command injection')) {
            return this.fixCommandInjection(codeSnippet || '', filePath || '', lineNumber || 0);
        }

        return null;
    }

    /**
     * Fix SQL Injection vulnerabilities
     */
    private static fixSQLInjection(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        // Detect language and apply appropriate fix
        const isTypeScript = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
        const isPython = filePath.endsWith('.py');
        const isJava = filePath.endsWith('.java');

        let fixedCode = code;
        let explanation = '';

        if (isTypeScript || filePath.endsWith('.js')) {
            // Fix string concatenation with parameterized queries
            if (code.includes('SELECT') && code.includes('+')) {
                fixedCode = code.replace(
                    /['"`]SELECT.*?\+.*?\+.*?['"`]/g,
                    `db.query('SELECT * FROM users WHERE id = ?', [userId])`
                );
                explanation = 'Replaced string concatenation with parameterized query using placeholders (?)';
            }
        } else if (isPython) {
            if (code.includes('execute') && code.includes('%s')) {
                fixedCode = code.replace(
                    /execute\((.*?%s.*?)\)/g,
                    'execute($1, (user_input,))'
                );
                explanation = 'Added parameterized query with tuple to prevent SQL injection';
            }
        } else if (isJava) {
            if (code.includes('Statement')) {
                fixedCode = code.replace(
                    /Statement\s+stmt/g,
                    'PreparedStatement stmt'
                ).replace(
                    /stmt\.executeQuery\((.*?)\+/g,
                    'stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");\nstmt.setString(1, userId);\nstmt.executeQuery('
                );
                explanation = 'Replaced Statement with PreparedStatement for safe parameterized queries';
            }
        }

        return {
            vulnerabilityType: 'SQL Injection',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: fixedCode !== code ? 'high' : 'low'
        };
    }

    /**
     * Fix XSS vulnerabilities
     */
    private static fixXSS(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        let fixedCode = code;
        let explanation = '';

        // React: Use textContent or proper escaping
        if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
            if (code.includes('dangerouslySetInnerHTML')) {
                fixedCode = code.replace(
                    /dangerouslySetInnerHTML=\{\{__html:\s*(.*?)\}\}/g,
                    '{DOMPurify.sanitize($1)}'
                );
                explanation = 'Added DOMPurify.sanitize() to prevent XSS. Import: npm i dompurify @types/dompurify';
            } else if (code.includes('innerHTML')) {
                fixedCode = code.replace(
                    /\.innerHTML\s*=/g,
                    '.textContent ='
                );
                explanation = 'Replaced innerHTML with textContent to prevent XSS';
            }
        }

        // JavaScript: Add escaping
        if (code.includes('document.write') || code.includes('innerHTML')) {
            fixedCode = `// Add this helper function:
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

${code.replace(/userInput/g, 'escapeHtml(userInput)')}`;
            explanation = 'Added HTML escaping function to sanitize user input';
        }

        return {
            vulnerabilityType: 'Cross-Site Scripting (XSS)',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: fixedCode !== code ? 'high' : 'medium'
        };
    }

    /**
     * Fix Hardcoded Secrets
     */
    private static fixHardcodedSecret(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        let fixedCode = code;
        let explanation = '';

        // Detect hardcoded API keys, passwords, tokens
        const secretPatterns = [
            { pattern: /['"`]([A-Za-z0-9_-]{32,})['"`]/, name: 'API_KEY' },
            { pattern: /password\s*=\s*['"`]([^'"`]+)['"`]/i, name: 'PASSWORD' },
            { pattern: /token\s*=\s*['"`]([^'"`]+)['"`]/i, name: 'TOKEN' },
            { pattern: /secret\s*=\s*['"`]([^'"`]+)['"`]/i, name: 'SECRET' }
        ];

        for (const { pattern, name } of secretPatterns) {
            if (pattern.test(code)) {
                // Replace with environment variable
                fixedCode = code.replace(
                    pattern,
                    `process.env.${name} || ''`
                );
                
                explanation = `Moved ${name.toLowerCase()} to environment variable. 
Add to .env file: ${name}=your_${name.toLowerCase()}_here
Don't commit .env to git! Add to .gitignore.`;
                
                break;
            }
        }

        return {
            vulnerabilityType: 'Hardcoded Secret',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: 'high'
        };
    }

    /**
     * Fix Path Traversal vulnerabilities
     */
    private static fixPathTraversal(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        let fixedCode = code;
        let explanation = '';

        const isPython = filePath.endsWith('.py');
        const isNode = filePath.endsWith('.js') || filePath.endsWith('.ts');

        if (isNode) {
            // Add path.join and validation
            fixedCode = `import path from 'path';

// Validate and sanitize file path
function safePath(userPath: string, baseDir: string): string {
    const normalized = path.normalize(userPath).replace(/^(\\.\\.\\/)+/, '');
    const fullPath = path.join(baseDir, normalized);
    
    // Ensure path is within base directory
    if (!fullPath.startsWith(path.resolve(baseDir))) {
        throw new Error('Invalid path: Directory traversal detected');
    }
    
    return fullPath;
}

${code.replace(/userPath/g, 'safePath(userPath, __dirname)')}`;
            explanation = 'Added path normalization and validation to prevent directory traversal';
        } else if (isPython) {
            fixedCode = `import os
from pathlib import Path

def safe_path(user_path: str, base_dir: str) -> str:
    """Safely resolve path and prevent traversal"""
    normalized = os.path.normpath(user_path).lstrip('../')
    full_path = os.path.join(base_dir, normalized)
    
    # Ensure path is within base directory
    if not os.path.realpath(full_path).startswith(os.path.realpath(base_dir)):
        raise ValueError('Invalid path: Directory traversal detected')
    
    return full_path

${code.replace(/user_path/g, 'safe_path(user_path, base_dir)')}`;
            explanation = 'Added path validation to prevent directory traversal attacks';
        }

        return {
            vulnerabilityType: 'Path Traversal',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: 'high'
        };
    }

    /**
     * Fix Insecure Deserialization
     */
    private static fixInsecureDeserialization(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        let fixedCode = code;
        let explanation = '';

        if (code.includes('pickle.loads') || code.includes('pickle.load')) {
            fixedCode = code.replace(
                /pickle\.loads?\(/g,
                'json.loads('
            );
            explanation = 'Replaced pickle with JSON for safe deserialization. If pickle is required, implement signature verification.';
        } else if (code.includes('eval(')) {
            fixedCode = code.replace(
                /eval\(/g,
                'JSON.parse('
            );
            explanation = 'Replaced eval() with JSON.parse() to prevent code injection';
        } else if (code.includes('unserialize(')) {
            fixedCode = `// IMPORTANT: Validate data structure before unserializing
function safeUnserialize(data: string) {
    try {
        const parsed = JSON.parse(data);
        // Add schema validation here (e.g., using Zod or Joi)
        return parsed;
    } catch (e) {
        throw new Error('Invalid data format');
    }
}

${code.replace(/unserialize\(/g, 'safeUnserialize(')}`;
            explanation = 'Added safe deserialization with JSON parsing and validation';
        }

        return {
            vulnerabilityType: 'Insecure Deserialization',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: 'high'
        };
    }

    /**
     * Fix Command Injection
     */
    private static fixCommandInjection(code: string, filePath: string, lineNumber: number): VulnerabilityFix {
        let fixedCode = code;
        let explanation = '';

        if (code.includes('exec(') || code.includes('system(')) {
            // Replace with safe alternatives
            fixedCode = `import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Safe command execution with argument array
async function safeExec(command: string, args: string[]) {
    // Validate command is in whitelist
    const allowedCommands = ['ls', 'cat', 'grep'];
    if (!allowedCommands.includes(command)) {
        throw new Error('Command not allowed');
    }
    
    try {
        const { stdout } = await execFileAsync(command, args);
        return stdout;
    } catch (error) {
        throw new Error(\`Command failed: \${error}\`);
    }
}

${code.replace(/exec\((.*?)\)/, 'await safeExec(command, [arg1, arg2])')}`;
            explanation = 'Replaced exec() with execFile() using argument array to prevent command injection';
        }

        return {
            vulnerabilityType: 'Command Injection',
            filePath,
            lineNumber,
            originalCode: code,
            fixedCode,
            explanation,
            confidence: 'high'
        };
    }

    /**
     * Generate unified diff format
     */
    static generateDiff(original: string, fixed: string, filePath: string): string {
        const originalLines = original.split('\n');
        const fixedLines = fixed.split('\n');
        
        let diff = `--- a/${filePath}\n+++ b/${filePath}\n`;
        diff += `@@ -1,${originalLines.length} +1,${fixedLines.length} @@\n`;
        
        // Simple diff (can be enhanced with proper diff algorithm)
        const maxLines = Math.max(originalLines.length, fixedLines.length);
        for (let i = 0; i < maxLines; i++) {
            if (i < originalLines.length && originalLines[i] !== fixedLines[i]) {
                diff += `-${originalLines[i]}\n`;
            }
            if (i < fixedLines.length && originalLines[i] !== fixedLines[i]) {
                diff += `+${fixedLines[i]}\n`;
            }
            if (originalLines[i] === fixedLines[i]) {
                diff += ` ${originalLines[i]}\n`;
            }
        }
        
        return diff;
    }

    /**
     * Create Git patch file
     */
    static createGitPatch(fixes: VulnerabilityFix[]): GitPatch[] {
        return fixes.map(fix => ({
            filePath: fix.filePath,
            diff: this.generateDiff(fix.originalCode, fix.fixedCode, fix.filePath),
            hunks: [{
                oldStart: fix.lineNumber,
                oldLines: fix.originalCode.split('\n').length,
                newStart: fix.lineNumber,
                newLines: fix.fixedCode.split('\n').length,
                lines: fix.fixedCode.split('\n')
            }]
        }));
    }

    /**
     * Estimate confidence in auto-fix
     */
    static estimateFixConfidence(vulnerability: any): number {
        const confidenceMap: Record<string, number> = {
            'SQL Injection': 0.9,
            'XSS': 0.85,
            'Hardcoded Secret': 0.95,
            'Path Traversal': 0.9,
            'Command Injection': 0.88,
            'Insecure Deserialization': 0.8
        };

        return confidenceMap[vulnerability.type] || 0.5;
    }
}

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { CKGData, CKGNode, CKGEdge } from '../types';

// Dynamic imports for Node.js-only modules (tree-sitter has native bindings)
let PythonASTAnalyzer: any;
let JavaASTAnalyzer: any;
let GoASTAnalyzer: any;
let RustASTAnalyzer: any;
let PHPASTAnalyzer: any;

// Only import in Node.js environment (not browser)
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
        PythonASTAnalyzer = require('./pythonAstAnalyzer').PythonASTAnalyzer;
    } catch (e) {
        console.warn('⚠️ Python AST analyzer not available');
    }
    try {
        JavaASTAnalyzer = require('./javaAstAnalyzer').JavaASTAnalyzer;
    } catch (e) {
        console.warn('⚠️ Java AST analyzer not available');
    }
    try {
        GoASTAnalyzer = require('./goAstAnalyzer').GoASTAnalyzer;
    } catch (e) {
        console.warn('⚠️ Go AST analyzer not available');
    }
    try {
        RustASTAnalyzer = require('./rustAstAnalyzer').RustASTAnalyzer;
    } catch (e) {
        console.warn('⚠️ Rust AST analyzer not available');
    }
    try {
        PHPASTAnalyzer = require('./phpAstAnalyzer').PHPASTAnalyzer;
    } catch (e) {
        console.warn('⚠️ PHP AST analyzer not available');
    }
}

interface SecurityPattern {
    type: string;
    line: number;
    code: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    confidence: number;
    description: string;
}

interface FunctionInfo {
    name: string;
    startLine: number;
    endLine: number;
    params: string[];
    callsTo: string[];
    complexity: number;
}

export class ASTAnalyzer {
    private pythonAnalyzer?: any;
    private javaAnalyzer?: any;
    private goAnalyzer?: any;
    private rustAnalyzer?: any;
    private phpAnalyzer?: any;

    constructor() {
        // Lazy initialization to handle optional dependencies
        try {
            if (PythonASTAnalyzer) {
                this.pythonAnalyzer = new PythonASTAnalyzer();
                console.log('✅ Python AST analyzer initialized');
            }
        } catch (error) {
            console.warn('⚠️ Python AST analyzer unavailable (tree-sitter-python not installed)');
        }

        try {
            if (JavaASTAnalyzer) {
                this.javaAnalyzer = new JavaASTAnalyzer();
                console.log('✅ Java AST analyzer initialized');
            }
        } catch (error) {
            console.warn('⚠️ Java AST analyzer unavailable (java-parser not installed)');
        }

        try {
            if (GoASTAnalyzer) {
                this.goAnalyzer = new GoASTAnalyzer();
                console.log('✅ Go AST analyzer initialized');
            }
        } catch (error) {
            console.warn('⚠️ Go AST analyzer unavailable');
        }

        try {
            if (RustASTAnalyzer) {
                this.rustAnalyzer = new RustASTAnalyzer();
                console.log('✅ Rust AST analyzer initialized');
            }
        } catch (error) {
            console.warn('⚠️ Rust AST analyzer unavailable');
        }

        try {
            if (PHPASTAnalyzer) {
                this.phpAnalyzer = new PHPASTAnalyzer();
                console.log('✅ PHP AST analyzer initialized');
            }
        } catch (error) {
            console.warn('⚠️ PHP AST analyzer unavailable');
        }
    }

    /**
     * Analyze code with language detection and proper AST parser
     */
    analyzeCode(code: string, filename: string, language: string): CKGData {
        const lang = language.toLowerCase();

        if (lang.includes('javascript') || lang.includes('typescript')) {
            return this.analyzeJavaScriptCode(code, filename);
        } else if (lang.includes('python') && this.pythonAnalyzer) {
            return this.pythonAnalyzer.analyzePythonCode(code, filename);
        } else if (lang.includes('java') && this.javaAnalyzer) {
            return this.javaAnalyzer.analyzeJavaCode(code, filename);
        } else if (lang.includes('go') && this.goAnalyzer) {
            return this.goAnalyzer.analyzeGoCode(code, filename);
        } else if (lang.includes('rust') && this.rustAnalyzer) {
            return this.rustAnalyzer.analyzeRustCode(code, filename);
        } else if (lang.includes('php') && this.phpAnalyzer) {
            return this.phpAnalyzer.analyzePHPCode(code, filename);
        } else {
            // Fallback for unsupported languages
            return this.fallbackAnalysis(code, filename, language);
        }
    }

    /**
     * Fallback analysis using regex when AST parsers are unavailable
     */
    private fallbackAnalysis(code: string, filename: string, language: string): CKGData {
        const nodes: CKGNode[] = [];
        const edges: CKGEdge[] = [];

        // Generic function extraction
        const funcRegex = /(?:function|def|func|fn|public|private)\s+(\w+)\s*\(/g;
        let match;

        while ((match = funcRegex.exec(code)) !== null) {
            nodes.push({
                id: match[1],
                label: `${match[1]}()`,
                type: 'Function'
            });
        }

        return {
            summary: `⚠️ Fallback analysis for ${language}: Found ${nodes.length} potential functions (AST parser not available)`,
            nodes,
            edges
        };
    }

    // Helper methods
    private getClassName(path: any): string {
        let parentClass = path.findParent((p: any) => t.isClassDeclaration(p.node));
        if (parentClass && t.isClassDeclaration(parentClass.node) && parentClass.node.id) {
            return parentClass.node.id.name;
        }
        return 'UnknownClass';
    }

    private getCalleeName(callee: any): string | null {
        if (t.isIdentifier(callee)) {
            return callee.name;
        } else if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
            return callee.property.name;
        }
        return null;
    }

    private getFunctionName(node: any): string | null {
        if (t.isFunctionDeclaration(node) && node.id) {
            return node.id.name;
        } else if (t.isArrowFunctionExpression(node) || t.isFunctionExpression(node)) {
            // Try to find the parent variable declarator
            return 'anonymousFunction';
        } else if (t.isClassMethod(node) && t.isIdentifier(node.key)) {
            return node.key.name;
        }
        return null;
    }

    /**
     * Analyze JavaScript/TypeScript code using Babel parser
     * Extracts real code structure, not LLM guesses
     */
    analyzeJavaScriptCode(code: string, filename: string): CKGData {
        try {
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            });

            const functions: Map<string, FunctionInfo> = new Map();
            const nodes: CKGNode[] = [];
            const edges: CKGEdge[] = [];

            // Bind helper methods for use in traverse
            const getClassName = this.getClassName.bind(this);
            const getCalleeName = this.getCalleeName.bind(this);
            const getFunctionName = this.getFunctionName.bind(this);

            // Extract functions and their calls
            traverse(ast, {
                // Function declarations
                FunctionDeclaration(path) {
                    const funcName = path.node.id?.name || 'anonymous';
                    const info: FunctionInfo = {
                        name: funcName,
                        startLine: path.node.loc?.start.line || 0,
                        endLine: path.node.loc?.end.line || 0,
                        params: path.node.params.map(p => 
                            t.isIdentifier(p) ? p.name : 'param'
                        ),
                        callsTo: [],
                        complexity: 1
                    };
                    functions.set(funcName, info);
                    
                    nodes.push({
                        id: funcName,
                        label: `${funcName}(${info.params.join(', ')})`,
                        type: 'Function'
                    });
                },

                // Arrow functions and function expressions
                VariableDeclarator(path) {
                    if (t.isArrowFunctionExpression(path.node.init) || 
                        t.isFunctionExpression(path.node.init)) {
                        const funcName = t.isIdentifier(path.node.id) ? path.node.id.name : 'anonymous';
                        const func = path.node.init;
                        
                        const info: FunctionInfo = {
                            name: funcName,
                            startLine: path.node.loc?.start.line || 0,
                            endLine: path.node.loc?.end.line || 0,
                            params: func.params.map(p => 
                                t.isIdentifier(p) ? p.name : 'param'
                            ),
                            callsTo: [],
                            complexity: 1
                        };
                        functions.set(funcName, info);
                        
                        nodes.push({
                            id: funcName,
                            label: `${funcName}(${info.params.join(', ')})`,
                            type: 'Function'
                        });
                    }
                },

                // Class methods
                ClassMethod(path) {
                    const className = getClassName(path);
                    const methodName = t.isIdentifier(path.node.key) ? path.node.key.name : 'method';
                    const fullName = `${className}.${methodName}`;
                    
                    const info: FunctionInfo = {
                        name: fullName,
                        startLine: path.node.loc?.start.line || 0,
                        endLine: path.node.loc?.end.line || 0,
                        params: path.node.params.map(p => 
                            t.isIdentifier(p) ? p.name : 'param'
                        ),
                        callsTo: [],
                        complexity: 1
                    };
                    functions.set(fullName, info);
                    
                    nodes.push({
                        id: fullName,
                        label: `${fullName}(${info.params.join(', ')})`,
                        type: 'Function'
                    });
                },

                // Track function calls
                CallExpression(path) {
                    const calleeName = getCalleeName(path.node.callee);
                    if (calleeName) {
                        // Find parent function
                        let parentFunc = path.getFunctionParent();
                        if (parentFunc) {
                            const parentName = getFunctionName(parentFunc.node);
                            if (parentName && functions.has(parentName)) {
                                functions.get(parentName)!.callsTo.push(calleeName);
                                
                                // Only add edge if target function exists in our map
                                if (functions.has(calleeName)) {
                                    edges.push({
                                        source: parentName,
                                        target: calleeName
                                    });
                                }
                            }
                        }
                    }
                }
            });

            // Remove duplicate edges
            const uniqueEdges = Array.from(
                new Set(edges.map(e => JSON.stringify(e)))
            ).map(s => JSON.parse(s));

            return {
                summary: `AST Analysis of ${filename}: Found ${nodes.length} functions with ${uniqueEdges.length} call relationships. This is REAL code structure, not LLM guessing.`,
                nodes,
                edges: uniqueEdges
            };
        } catch (error) {
            console.error('AST parsing failed:', error);
            return {
                summary: `Failed to parse ${filename} - syntax error or unsupported language features`,
                nodes: [],
                edges: []
            };
        }
    }

    /**
     * Analyze Python code structure
     * Note: For full Python support, install tree-sitter-python
     * This is a simplified version using regex patterns
     */
    /**
     * DEPRECATED: Use pythonAnalyzer.analyzePythonCode() instead
     * Kept for backward compatibility
     */
    analyzePythonCode(code: string, filename: string): CKGData {
        if (this.pythonAnalyzer) {
            return this.pythonAnalyzer.analyzePythonCode(code, filename);
        }

        // Fallback regex-based analysis
        const nodes: CKGNode[] = [];
        const edges: CKGEdge[] = [];
        
        const funcRegex = /def\s+(\w+)\s*\((.*?)\):/g;
        let match;
        
        while ((match = funcRegex.exec(code)) !== null) {
            nodes.push({
                id: match[1],
                label: `${match[1]}(${match[2]})`,
                type: 'Function'
            });
        }

        return {
            summary: `⚠️ Python Analysis (Fallback Mode): Found ${nodes.length} functions. Install tree-sitter-python for real AST analysis.`,
            nodes,
            edges
        };
    }

    /**
     * Detect security patterns using AST analysis
     * This is MUCH more accurate than LLM pattern guessing
     */
    findSecurityPatterns(code: string, language: string): SecurityPattern[] {
        if (language.toLowerCase().includes('javascript') || 
            language.toLowerCase().includes('typescript')) {
            return this.findJavaScriptSecurityPatterns(code);
        } else if (language.toLowerCase().includes('python')) {
            return this.findPythonSecurityPatterns(code);
        }
        return [];
    }

    private findJavaScriptSecurityPatterns(code: string): SecurityPattern[] {
        const patterns: SecurityPattern[] = [];

        try {
            const ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx']
            });

            traverse(ast, {
                // Detect eval() usage
                CallExpression(path) {
                    if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'eval') {
                        patterns.push({
                            type: 'Code Injection',
                            line: path.node.loc?.start.line || 0,
                            code: code.split('\n')[path.node.loc?.start.line! - 1] || '',
                            severity: 'Critical',
                            confidence: 0.95,
                            description: 'Use of eval() allows arbitrary code execution'
                        });
                    }

                    // Detect dangerous functions
                    const dangerousFuncs = ['exec', 'execSync', 'execFile'];
                    if (t.isIdentifier(path.node.callee) && 
                        dangerousFuncs.includes(path.node.callee.name)) {
                        patterns.push({
                            type: 'Command Injection',
                            line: path.node.loc?.start.line || 0,
                            code: code.split('\n')[path.node.loc?.start.line! - 1] || '',
                            severity: 'Critical',
                            confidence: 0.9,
                            description: `Use of ${path.node.callee.name}() can lead to command injection`
                        });
                    }
                },

                // Detect innerHTML usage (XSS risk)
                AssignmentExpression(path) {
                    if (t.isMemberExpression(path.node.left)) {
                        const prop = path.node.left.property;
                        if (t.isIdentifier(prop) && prop.name === 'innerHTML') {
                            patterns.push({
                                type: 'Cross-Site Scripting (XSS)',
                                line: path.node.loc?.start.line || 0,
                                code: code.split('\n')[path.node.loc?.start.line! - 1] || '',
                                severity: 'High',
                                confidence: 0.8,
                                description: 'Direct innerHTML assignment can lead to XSS vulnerabilities'
                            });
                        }
                    }
                },

                // Detect hardcoded credentials
                VariableDeclarator(path) {
                    if (t.isIdentifier(path.node.id)) {
                        const varName = path.node.id.name.toLowerCase();
                        if (varName.includes('password') || 
                            varName.includes('apikey') || 
                            varName.includes('secret') ||
                            varName.includes('token')) {
                            
                            if (t.isStringLiteral(path.node.init) && 
                                path.node.init.value.length > 8) {
                                patterns.push({
                                    type: 'Hardcoded Secret',
                                    line: path.node.loc?.start.line || 0,
                                    code: code.split('\n')[path.node.loc?.start.line! - 1] || '',
                                    severity: 'High',
                                    confidence: 0.75,
                                    description: `Hardcoded credential in variable '${path.node.id.name}'`
                                });
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Security pattern scanning failed:', error);
        }

        return patterns;
    }

    private findPythonSecurityPatterns(code: string): SecurityPattern[] {
        const patterns: SecurityPattern[] = [];
        const lines = code.split('\n');

        lines.forEach((line, index) => {
            const lineNum = index + 1;

            // SQL Injection - string concatenation in queries
            if (line.includes('SELECT') && (line.includes('+') || line.includes('f"') || line.includes("f'"))) {
                patterns.push({
                    type: 'SQL Injection',
                    line: lineNum,
                    code: line.trim(),
                    severity: 'Critical',
                    confidence: 0.85,
                    description: 'SQL query constructed using string concatenation'
                });
            }

            // Command Injection
            if (/os\.(system|popen|exec)|subprocess\.(call|run)/.test(line)) {
                patterns.push({
                    type: 'Command Injection',
                    line: lineNum,
                    code: line.trim(),
                    severity: 'Critical',
                    confidence: 0.9,
                    description: 'Potentially unsafe system command execution'
                });
            }

            // Pickle deserialization
            if (line.includes('pickle.loads') || line.includes('pickle.load')) {
                patterns.push({
                    type: 'Insecure Deserialization',
                    line: lineNum,
                    code: line.trim(),
                    severity: 'High',
                    confidence: 0.8,
                    description: 'Pickle deserialization can execute arbitrary code'
                });
            }

            // Hardcoded credentials
            const credRegex = /(password|api_key|secret|token)\s*=\s*['"][^'"]{8,}['"]/i;
            if (credRegex.test(line)) {
                patterns.push({
                    type: 'Hardcoded Secret',
                    line: lineNum,
                    code: line.trim(),
                    severity: 'High',
                    confidence: 0.75,
                    description: 'Hardcoded credential detected'
                });
            }
        });

        return patterns;
    }
}

export type { SecurityPattern };

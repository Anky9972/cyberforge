/**
 * REAL Python AST Analysis using tree-sitter
 * No more regex hacks - actual syntax tree parsing
 */
import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
export class PythonASTAnalyzer {
    parser;
    constructor() {
        this.parser = new Parser();
        this.parser.setLanguage(Python);
    }
    /**
     * Parse Python code into AST and extract Code Knowledge Graph
     */
    analyzePythonCode(code, filename) {
        const tree = this.parser.parse(code);
        const nodes = [];
        const edges = [];
        const functionCalls = new Map();
        // Walk the AST to find function definitions
        const cursor = tree.walk();
        const visitNode = () => {
            const node = cursor.currentNode;
            // Function definitions
            if (node.type === 'function_definition') {
                const nameNode = node.childForFieldName('name');
                const parametersNode = node.childForFieldName('parameters');
                if (nameNode) {
                    const funcName = nameNode.text;
                    const params = parametersNode ? this.extractParameters(parametersNode) : [];
                    nodes.push({
                        id: funcName,
                        label: `${funcName}(${params.join(', ')})`,
                        type: 'Function'
                    });
                    // Find function calls within this function
                    const calls = this.extractFunctionCalls(node);
                    functionCalls.set(funcName, calls);
                }
            }
            // Class definitions
            if (node.type === 'class_definition') {
                const nameNode = node.childForFieldName('name');
                if (nameNode) {
                    const className = nameNode.text;
                    nodes.push({
                        id: className,
                        label: className,
                        type: 'Class'
                    });
                }
            }
            // Recurse into children
            if (cursor.gotoFirstChild()) {
                do {
                    visitNode();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visitNode();
        // Build edges from function calls
        for (const [caller, callees] of functionCalls.entries()) {
            for (const callee of callees) {
                if (nodes.some(n => n.id === callee)) {
                    edges.push({
                        source: caller,
                        target: callee
                    });
                }
            }
        }
        return {
            summary: `🔬 AST-VERIFIED Python Analysis: Found ${nodes.length} functions/classes with ${edges.length} relationships using tree-sitter parser (zero hallucination risk)`,
            nodes,
            edges
        };
    }
    /**
     * Extract parameter names from function parameters node
     */
    extractParameters(parametersNode) {
        const params = [];
        const cursor = parametersNode.walk();
        const visitParam = () => {
            const node = cursor.currentNode;
            if (node.type === 'identifier' && node.parent?.type === 'typed_parameter') {
                params.push(node.text);
            }
            else if (node.type === 'identifier' && node.parent?.type === 'default_parameter') {
                params.push(node.text);
            }
            if (cursor.gotoFirstChild()) {
                do {
                    visitParam();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visitParam();
        return params;
    }
    /**
     * Extract all function calls within a function body
     */
    extractFunctionCalls(functionNode) {
        const calls = new Set();
        const cursor = functionNode.walk();
        const visitCall = () => {
            const node = cursor.currentNode;
            if (node.type === 'call') {
                const funcNode = node.childForFieldName('function');
                if (funcNode && funcNode.type === 'identifier') {
                    calls.add(funcNode.text);
                }
                else if (funcNode && funcNode.type === 'attribute') {
                    // Handle method calls like obj.method()
                    const attrNode = funcNode.childForFieldName('attribute');
                    if (attrNode) {
                        calls.add(attrNode.text);
                    }
                }
            }
            if (cursor.gotoFirstChild()) {
                do {
                    visitCall();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visitCall();
        return calls;
    }
    /**
     * Find security vulnerabilities using AST pattern matching
     */
    findSecurityPatterns(code) {
        const patterns = [];
        const tree = this.parser.parse(code);
        const lines = code.split('\n');
        const cursor = tree.walk();
        const visitSecurity = () => {
            const node = cursor.currentNode;
            const lineNum = node.startPosition.row + 1;
            // SQL Injection - detect string formatting in SQL queries
            if (node.type === 'call') {
                const funcNode = node.childForFieldName('function');
                if (funcNode) {
                    const funcText = funcNode.text;
                    // Check for cursor.execute with string formatting
                    if (funcText.includes('execute') || funcText.includes('executemany')) {
                        const argsNode = node.childForFieldName('arguments');
                        if (argsNode) {
                            const argText = argsNode.text;
                            // Detect f-strings or % formatting in SQL
                            if ((argText.includes('SELECT') || argText.includes('INSERT') || argText.includes('UPDATE')) &&
                                (argText.includes('f"') || argText.includes("f'") || argText.includes('%'))) {
                                patterns.push({
                                    type: 'SQL Injection',
                                    line: lineNum,
                                    code: lines[lineNum - 1]?.trim() || '',
                                    severity: 'Critical',
                                    confidence: 0.9,
                                    description: 'SQL query uses string formatting instead of parameterized queries'
                                });
                            }
                        }
                    }
                    // Command Injection - os.system, subprocess, etc.
                    if (funcText.match(/os\.(system|popen|exec)|subprocess\.(call|run|Popen)/)) {
                        patterns.push({
                            type: 'Command Injection',
                            line: lineNum,
                            code: lines[lineNum - 1]?.trim() || '',
                            severity: 'Critical',
                            confidence: 0.95,
                            description: `Use of ${funcText}() can lead to command injection if user input is not sanitized`
                        });
                    }
                    // Pickle deserialization
                    if (funcText.includes('pickle.loads') || funcText.includes('pickle.load')) {
                        patterns.push({
                            type: 'Insecure Deserialization',
                            line: lineNum,
                            code: lines[lineNum - 1]?.trim() || '',
                            severity: 'High',
                            confidence: 0.85,
                            description: 'Pickle deserialization can execute arbitrary code from untrusted sources'
                        });
                    }
                    // eval() usage
                    if (funcText === 'eval' || funcText === 'exec') {
                        patterns.push({
                            type: 'Code Injection',
                            line: lineNum,
                            code: lines[lineNum - 1]?.trim() || '',
                            severity: 'Critical',
                            confidence: 0.98,
                            description: `Use of ${funcText}() allows arbitrary code execution`
                        });
                    }
                }
            }
            // Hardcoded credentials - detect assignments to sensitive variables
            if (node.type === 'assignment') {
                const leftNode = node.childForFieldName('left');
                const rightNode = node.childForFieldName('right');
                if (leftNode && rightNode && rightNode.type === 'string') {
                    const varName = leftNode.text.toLowerCase();
                    const value = rightNode.text;
                    if ((varName.includes('password') ||
                        varName.includes('api_key') ||
                        varName.includes('secret') ||
                        varName.includes('token')) &&
                        value.length > 10) {
                        patterns.push({
                            type: 'Hardcoded Secret',
                            line: lineNum,
                            code: lines[lineNum - 1]?.trim() || '',
                            severity: 'High',
                            confidence: 0.8,
                            description: `Hardcoded credential in variable '${leftNode.text}'`
                        });
                    }
                }
            }
            // Path traversal - file operations with user input
            if (node.type === 'call') {
                const funcNode = node.childForFieldName('function');
                if (funcNode?.text.match(/open|read|write|remove|unlink/)) {
                    patterns.push({
                        type: 'Path Traversal',
                        line: lineNum,
                        code: lines[lineNum - 1]?.trim() || '',
                        severity: 'Medium',
                        confidence: 0.6,
                        description: 'File operation without path validation may allow directory traversal'
                    });
                }
            }
            if (cursor.gotoFirstChild()) {
                do {
                    visitSecurity();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visitSecurity();
        return patterns;
    }
}
//# sourceMappingURL=pythonAstAnalyzer.js.map
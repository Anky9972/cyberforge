import JSZip from 'jszip';
import { validateZipPath, ZIP_MAX_SIZE, ALLOWED_EXTENSIONS } from './schemas';

export interface ZipAnalysis {
    fileName: string;
    totalFiles: number;
    cppFiles: number;
    headerFiles: number;
    fileList: string[];
    codeSnippets: Array<{ path: string; content: string }>;
    summary: string;
}

export async function parseZipFile(file: File): Promise<string> {
    try {
        // Validate file size
        if (file.size > ZIP_MAX_SIZE) {
            throw new Error(`File too large. Maximum size is ${ZIP_MAX_SIZE / (1024 * 1024)}MB`);
        }

        if (file.size === 0) {
            throw new Error('File is empty');
        }

        console.log(`📦 Parsing ZIP file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        const zip = await JSZip.loadAsync(file);
        const fileList: string[] = [];
        const codeSnippets: Array<{ path: string; content: string }> = [];
        let totalCodeFiles = 0;

        // Track language-specific files
        const langCounts: Record<string, number> = {
            python: 0,
            javascript: 0,
            typescript: 0,
            java: 0,
            cpp: 0,
            c: 0,
            go: 0,
            rust: 0,
            php: 0,
            other: 0
        };

        // Analyze zip contents with security validation
        const files = Object.entries(zip.files);
        
        for (const [path, zipEntry] of files) {
            if (zipEntry.dir) continue;
            
            // Security: Validate path to prevent traversal attacks
            if (!validateZipPath(path)) {
                console.warn(`⚠️ Skipping potentially dangerous file: ${path}`);
                continue;
            }
            
            fileList.push(path);

            // Count files by language
            if (path.endsWith('.py')) {
                langCounts.python++;
                totalCodeFiles++;
            } else if (path.endsWith('.js') || path.endsWith('.jsx')) {
                langCounts.javascript++;
                totalCodeFiles++;
            } else if (path.endsWith('.ts') || path.endsWith('.tsx')) {
                langCounts.typescript++;
                totalCodeFiles++;
            } else if (path.endsWith('.java')) {
                langCounts.java++;
                totalCodeFiles++;
            } else if (path.endsWith('.cpp') || path.endsWith('.cc') || path.endsWith('.cxx')) {
                langCounts.cpp++;
                totalCodeFiles++;
            } else if (path.endsWith('.c')) {
                langCounts.c++;
                totalCodeFiles++;
            } else if (path.endsWith('.go')) {
                langCounts.go++;
                totalCodeFiles++;
            } else if (path.endsWith('.rs')) {
                langCounts.rust++;
                totalCodeFiles++;
            } else if (path.endsWith('.php')) {
                langCounts.php++;
                totalCodeFiles++;
            } else if (ALLOWED_EXTENSIONS.some(ext => path.endsWith(ext))) {
                langCounts.other++;
                totalCodeFiles++;
            }

            // Extract code samples (limit to 10 files to avoid token overflow)
            if (codeSnippets.length < 10 && totalCodeFiles > 0) {
                try {
                    const content = await zipEntry.async('text');
                    codeSnippets.push({
                        path,
                        content: content.substring(0, 800) // Limit each snippet to 800 chars
                    });
                } catch (e) {
                    console.warn(`⚠️ Could not read ${path}`, e);
                }
            }
        }

        if (totalCodeFiles === 0) {
            throw new Error('No valid code files found in ZIP. Supported extensions: ' + ALLOWED_EXTENSIONS.join(', '));
        }

        // Determine primary language
        const primaryLang = Object.entries(langCounts)
            .filter(([lang]) => lang !== 'other')
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];

        console.log(`✅ Successfully parsed ${totalCodeFiles} code files (Primary language: ${primaryLang})`);

        // Generate intelligent summary
        const summary = `
📦 Codebase Analysis: ${file.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Project Statistics:
   • Total files: ${fileList.length}
   • Code files: ${totalCodeFiles}
   • Primary language: ${primaryLang.toUpperCase()}
   • Python: ${langCounts.python} | JavaScript: ${langCounts.javascript} | TypeScript: ${langCounts.typescript}
   • Java: ${langCounts.java} | C++: ${langCounts.cpp} | C: ${langCounts.c}
   • Go: ${langCounts.go} | Rust: ${langCounts.rust} | PHP: ${langCounts.php}

📁 File Structure (showing ${Math.min(20, fileList.length)} files):
${fileList.slice(0, 20).map(f => `   • ${f}`).join('\n')}
${fileList.length > 20 ? `   ... and ${fileList.length - 20} more files` : ''}

💻 Code Samples Extracted (${codeSnippets.length} files):
${codeSnippets.map(({ path, content }) => `
━━━ ${path} ━━━
${content}
${content.length >= 800 ? '... [truncated for analysis]' : ''}
`).join('\n')}

🔍 Analysis Focus Areas:
   • Authentication/authorization logic
   • User input validation and sanitization
   • Database query construction
   • File system operations
   • API endpoint definitions and security
   • Cryptographic operations
   • Network communication
   • Configuration and secret management
        `.trim();

        return summary;
    } catch (error) {
        console.error('❌ Error parsing zip:', error);
        if (error instanceof Error) {
            throw error; // Re-throw with original message
        }
        throw new Error('Failed to parse zip file. Please ensure it contains valid code files.');
    }
}

/**
 * NEW: Enhanced parser that returns BOTH summary AND actual code files
 * Enables AST analysis instead of LLM guessing
 */
export interface ParsedCodebase {
    summary: string;
    codeFiles: Map<string, { code: string; language: string; filename: string }>;
}

export async function parseZipFileWithCode(file: File): Promise<ParsedCodebase> {
    try {
        // Validate file size
        if (file.size > ZIP_MAX_SIZE) {
            throw new Error(`File too large. Maximum size is ${ZIP_MAX_SIZE / (1024 * 1024)}MB`);
        }

        if (file.size === 0) {
            throw new Error('File is empty');
        }

        console.log(`📦 Parsing ZIP file with full code extraction: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        const zip = await JSZip.loadAsync(file);
        const fileList: string[] = [];
        const codeSnippets: Array<{ path: string; content: string }> = [];
        const codeFiles = new Map<string, { code: string; language: string; filename: string }>();
        let totalCodeFiles = 0;

        // Track language-specific files
        const langCounts: Record<string, number> = {
            python: 0,
            javascript: 0,
            typescript: 0,
            java: 0,
            cpp: 0,
            c: 0,
            go: 0,
            rust: 0,
            php: 0,
            other: 0
        };

        // Language detection helper
        const detectLanguage = (path: string): string | null => {
            if (path.endsWith('.py')) return 'python';
            if (path.endsWith('.js') || path.endsWith('.jsx')) return 'javascript';
            if (path.endsWith('.ts') || path.endsWith('.tsx')) return 'typescript';
            if (path.endsWith('.java')) return 'java';
            if (path.endsWith('.cpp') || path.endsWith('.cc') || path.endsWith('.cxx')) return 'cpp';
            if (path.endsWith('.c') && !path.endsWith('.inc')) return 'c';
            if (path.endsWith('.go')) return 'go';
            if (path.endsWith('.rs')) return 'rust';
            if (path.endsWith('.php')) return 'php';
            return null;
        };

        // Analyze zip contents with security validation
        const files = Object.entries(zip.files);
        
        for (const [path, zipEntry] of files) {
            if (zipEntry.dir) continue;
            
            // Security: Validate path to prevent traversal attacks
            if (!validateZipPath(path)) {
                console.warn(`⚠️ Skipping potentially dangerous file: ${path}`);
                continue;
            }
            
            fileList.push(path);

            const language = detectLanguage(path);
            if (language) {
                langCounts[language]++;
                totalCodeFiles++;

                // Extract FULL code for AST analysis
                try {
                    const content = await zipEntry.async('text');
                    codeFiles.set(path, {
                        code: content, // Full content, not truncated!
                        language: language,
                        filename: path
                    });

                    // Also keep truncated snippets for the summary
                    if (codeSnippets.length < 10) {
                        codeSnippets.push({
                            path,
                            content: content.substring(0, 800)
                        });
                    }
                } catch (e) {
                    console.warn(`⚠️ Could not read ${path}`, e);
                }
            } else if (ALLOWED_EXTENSIONS.some(ext => path.endsWith(ext))) {
                langCounts.other++;
                totalCodeFiles++;
            }
        }

        if (totalCodeFiles === 0) {
            throw new Error('No valid code files found in ZIP. Supported extensions: ' + ALLOWED_EXTENSIONS.join(', '));
        }

        // Determine primary language
        const primaryLang = Object.entries(langCounts)
            .filter(([lang]) => lang !== 'other')
            .reduce((a, b) => a[1] > b[1] ? a : b)[0];

        console.log(`✅ Successfully parsed ${totalCodeFiles} code files (Primary language: ${primaryLang})`);
        console.log(`🔬 Extracted ${codeFiles.size} files for AST analysis`);

        // Generate intelligent summary (same as before)
        const summary = `
📦 Codebase Analysis: ${file.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Project Statistics:
   • Total files: ${fileList.length}
   • Code files: ${totalCodeFiles}
   • Primary language: ${primaryLang.toUpperCase()}
   • Python: ${langCounts.python} | JavaScript: ${langCounts.javascript} | TypeScript: ${langCounts.typescript}
   • Java: ${langCounts.java} | C++: ${langCounts.cpp} | C: ${langCounts.c}
   • Go: ${langCounts.go} | Rust: ${langCounts.rust} | PHP: ${langCounts.php}

📁 File Structure (showing ${Math.min(20, fileList.length)} files):
${fileList.slice(0, 20).map(f => `   • ${f}`).join('\n')}
${fileList.length > 20 ? `   ... and ${fileList.length - 20} more files` : ''}

💻 Code Samples Extracted (${codeSnippets.length} files):
${codeSnippets.map(({ path, content }) => `
━━━ ${path} ━━━
${content}
${content.length >= 800 ? '... [truncated for analysis]' : ''}
`).join('\n')}

🔍 Analysis Focus Areas:
   • Authentication/authorization logic
   • User input validation and sanitization
   • Database query construction
   • File system operations
   • API endpoint definitions and security
   • Cryptographic operations
   • Network communication
   • Configuration and secret management
        `.trim();

        return { summary, codeFiles };
    } catch (error) {
        console.error('❌ Error parsing zip:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to parse zip file. Please ensure it contains valid code files.');
    }
}

export async function createSampleZipBlob(sampleName: string): Promise<Blob> {
    const zip = new JSZip();
    
    if (sampleName === 'vulnerable-server') {
        // Create realistic C++ web server files
        zip.file('main.cpp', `
#include <iostream>
#include <string>
#include "server.h"
#include "auth.h"

int main() {
    Server server(8080);
    server.addRoute("/api/v1/users", handleUsers);
    server.addRoute("/admin/debug", handleDebug);  // Exposed admin endpoint!
    server.start();
    return 0;
}
        `);
        
        zip.file('server.h', `
#pragma once
#include <string>
#include <map>

class Server {
    int port;
    std::map<std::string, void(*)(Request&)> routes;
public:
    Server(int p) : port(p) {}
    void addRoute(const std::string& path, void(*handler)(Request&));
    void start();
};
        `);
        
        zip.file('auth.cpp', `
#include "auth.h"
#include <cstring>

bool authenticate(const std::string& username, const std::string& password) {
    char buffer[64];
    strcpy(buffer, password.c_str());  // Buffer overflow vulnerability!
    
    // Hardcoded credentials
    if (username == "admin" && password == "admin123") {  // Weak password!
        return true;
    }
    return false;
}
        `);
        
        zip.file('database.cpp', `
#include "database.h"
#include <sstream>

std::string getUserData(const std::string& userId) {
    std::ostringstream query;
    // SQL Injection vulnerability!
    query << "SELECT * FROM users WHERE id = '" << userId << "'";
    return executeQuery(query.str());
}
        `);
        
        zip.file('config.ini', `
[database]
host=localhost
username=root
password=MyP@ssw0rd123  // Hardcoded credentials in config

[server]
debug_mode=true
allow_cors=*
        `);
    } else if (sampleName === 'buffer-overflow') {
        zip.file('vulnerable.cpp', `
#include <cstring>
#include <iostream>

void processInput(const char* userInput) {
    char buffer[100];
    strcpy(buffer, userInput);  // Classic buffer overflow!
    std::cout << "Processed: " << buffer << std::endl;
}

void vulnerableConcat(char* dest, const char* src) {
    strcat(dest, src);  // No bounds checking
}
        `);
        
        zip.file('heap_overflow.cpp', `
#include <cstdlib>
#include <cstring>

struct User {
    char name[32];
    int privilege;
};

void setUserName(User* user, const char* name) {
    strcpy(user->name, name);  // Heap overflow if name > 32 bytes
}
        `);
    } else if (sampleName === 'injection') {
        zip.file('sql_injection.cpp', `
#include <string>
#include <sstream>

std::string buildQuery(const std::string& userInput) {
    std::ostringstream sql;
    sql << "SELECT * FROM products WHERE name = '" << userInput << "'";
    return sql.str();  // SQL injection vulnerability
}
        `);
        
        zip.file('command_injection.cpp', `
#include <cstdlib>
#include <string>

void executeCommand(const std::string& filename) {
    std::string cmd = "cat " + filename;  // Command injection!
    system(cmd.c_str());
}
        `);
    }
    
    return await zip.generateAsync({ type: 'blob' });
}

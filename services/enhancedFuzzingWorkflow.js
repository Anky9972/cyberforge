/**
 * ENHANCED FUZZING WORKFLOW
 * Integrates all new features:
 * - Python/Java AST Analysis
 * - Coverage-Guided Fuzzing
 * - Symbolic Execution
 * - Real CVE Database Integration
 */
import { ASTAnalyzer } from './astAnalyzer';
// Dynamic imports for Node.js-only modules (istanbul, z3-solver have native bindings)
let CoverageGuidedFuzzingEngine;
let SymbolicExecutionEngine;
let CVEDatabaseIntegration;
let CoverageFuzzResult;
let SymbolicResult;
// Only import in Node.js environment (not browser) - Check for import.meta to detect browser
const isBrowser = typeof window !== 'undefined' && typeof import.meta !== 'undefined';
if (!isBrowser && typeof process !== 'undefined' && process.versions && process.versions.node) {
    try {
        const coverageModule = require('./coverageGuidedFuzzing');
        CoverageGuidedFuzzingEngine = coverageModule.CoverageGuidedFuzzingEngine;
        CoverageFuzzResult = coverageModule.CoverageFuzzResult;
        console.log('✅ Coverage-guided fuzzing module loaded');
    }
    catch (e) {
        console.warn('⚠️ Coverage-guided fuzzing not available:', e);
    }
    try {
        const symbolicModule = require('./symbolicExecution');
        SymbolicExecutionEngine = symbolicModule.SymbolicExecutionEngine;
        SymbolicResult = symbolicModule.SymbolicResult;
        console.log('✅ Symbolic execution module loaded');
    }
    catch (e) {
        console.warn('⚠️ Symbolic execution not available:', e);
    }
    try {
        const cveModule = require('./cveIntegration');
        CVEDatabaseIntegration = cveModule.CVEDatabaseIntegration;
        console.log('✅ CVE integration module loaded');
    }
    catch (e) {
        console.warn('⚠️ CVE integration not available:', e);
    }
}
else {
    console.log('🌐 Running in browser mode - Enhanced features disabled');
}
export class EnhancedFuzzingWorkflow {
    astAnalyzer;
    coverageFuzzer;
    symbolicExecutor;
    cveIntegration;
    config;
    constructor(config = {}) {
        this.config = {
            enableCoverageGuidedFuzzing: config.enableCoverageGuidedFuzzing ?? true,
            enableSymbolicExecution: config.enableSymbolicExecution ?? true,
            enableCVEIntegration: config.enableCVEIntegration ?? true,
            maxFuzzingIterations: config.maxFuzzingIterations || 1000,
            maxSymbolicPaths: config.maxSymbolicPaths || 100
        };
        this.astAnalyzer = new ASTAnalyzer();
        // Initialize CVE integration (only in Node.js)
        if (CVEDatabaseIntegration) {
            this.cveIntegration = new CVEDatabaseIntegration();
        }
        if (this.config.enableCoverageGuidedFuzzing && CoverageGuidedFuzzingEngine) {
            try {
                this.coverageFuzzer = new CoverageGuidedFuzzingEngine({
                    maxExecutions: this.config.maxFuzzingIterations,
                    timeout: 2000,
                    coverageThreshold: 80
                });
                console.log('✅ Coverage-guided fuzzing enabled');
            }
            catch (error) {
                console.warn('⚠️ Coverage-guided fuzzing unavailable:', error);
            }
        }
        if (this.config.enableSymbolicExecution && SymbolicExecutionEngine) {
            try {
                this.symbolicExecutor = new SymbolicExecutionEngine({
                    maxPaths: this.config.maxSymbolicPaths,
                    maxDepth: 10,
                    timeout: 5000
                });
                console.log('✅ Symbolic execution enabled');
            }
            catch (error) {
                console.warn('⚠️ Symbolic execution unavailable:', error);
            }
        }
    }
    /**
     * Execute enhanced fuzzing workflow with all advanced features
     * NOW WITH TIMEOUT PROTECTION - Will never hang!
     */
    async executeEnhancedFuzzing(codeFiles, fuzzTargets) {
        console.log('🚀 Starting ENHANCED fuzzing workflow with:');
        console.log(`   - Coverage-guided fuzzing: ${this.config.enableCoverageGuidedFuzzing ? '✅' : '❌'}`);
        console.log(`   - Symbolic execution: ${this.config.enableSymbolicExecution ? '✅' : '❌'}`);
        console.log(`   - CVE integration: ${this.config.enableCVEIntegration ? '✅' : '❌'}`);
        // Wrap entire execution in 30-second timeout
        const executeWithTimeout = async () => {
            const results = {};
            return await this.executeEnhancedFuzzingInternal(codeFiles, fuzzTargets, results);
        };
        try {
            // Race between execution and timeout (30 seconds for browser mode, 90 for Node)
            const timeoutMs = isBrowser ? 30000 : 90000;
            console.log(`⏱️ Enhanced fuzzing timeout set to ${timeoutMs / 1000} seconds (browser mode: ${isBrowser})`);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(`Enhanced fuzzing timeout after ${timeoutMs / 1000} seconds`)), timeoutMs);
            });
            return await Promise.race([
                executeWithTimeout(),
                timeoutPromise
            ]);
        }
        catch (error) {
            console.error('⏱️ Enhanced fuzzing timed out or failed:', error);
            // Return minimal fallback result
            return this.generateFallbackResult(fuzzTargets);
        }
    }
    /**
     * Internal execution method (without timeout wrapper)
     */
    async executeEnhancedFuzzingInternal(codeFiles, fuzzTargets, results) {
        // Phase 1: Coverage-Guided Fuzzing
        if (this.coverageFuzzer && fuzzTargets.length > 0) {
            console.log('\n📊 Phase 1: Coverage-Guided Fuzzing');
            const target = fuzzTargets[0];
            const targetFile = this.findTargetFile(codeFiles, target.functionName);
            if (targetFile) {
                try {
                    const coverageResult = await this.coverageFuzzer.fuzzFunctionWithCoverage(targetFile.code, target.functionName, ['string', 'string', 'number'] // Default param types
                    );
                    results.coverageFuzzing = coverageResult;
                    console.log(`✅ Coverage: ${coverageResult.coveragePercent.toFixed(2)}%`);
                    console.log(`✅ Crashes: ${coverageResult.crashes.length}`);
                    console.log(`✅ Interesting inputs: ${coverageResult.interestingInputs.length}`);
                }
                catch (error) {
                    console.error('Coverage fuzzing failed:', error);
                }
            }
        }
        // Phase 2: Symbolic Execution
        if (this.symbolicExecutor && fuzzTargets.length > 0) {
            console.log('\n🔬 Phase 2: Symbolic Execution');
            const target = fuzzTargets[0];
            const targetFile = this.findTargetFile(codeFiles, target.functionName);
            if (targetFile) {
                try {
                    const symbolicResult = await this.symbolicExecutor.executeSymbolically(targetFile.code, target.functionName, ['string', 'string', 'number']);
                    results.symbolicExecution = symbolicResult;
                    console.log(`✅ Paths explored: ${symbolicResult.totalPaths}`);
                    console.log(`✅ Vulnerabilities: ${symbolicResult.vulnerabilities.length}`);
                }
                catch (error) {
                    console.error('Symbolic execution failed:', error);
                }
            }
        }
        // Phase 3: CVE Database Integration (with individual timeout per file)
        if (this.config.enableCVEIntegration) {
            console.log('\n🔍 Phase 3: CVE Database Check');
            const cveFindings = new Map();
            const cvePromises = [];
            // Check for known vulnerable patterns in code (with 2s timeout per file)
            for (const [filename, fileData] of codeFiles.entries()) {
                const cvePromise = (async () => {
                    try {
                        const timeoutPromise = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('CVE check timeout')), 2000);
                        });
                        const checkPromise = this.cveIntegration.searchCVEs(fileData.code.substring(0, 500), // Sample for pattern matching
                        `file:${filename}`);
                        const result = await Promise.race([checkPromise, timeoutPromise]);
                        if (result.found) {
                            cveFindings.set(filename, result);
                            console.log(`⚠️ Found ${result.cves.length} CVE(s) in ${filename}`);
                        }
                    }
                    catch (error) {
                        // Silently skip files that timeout
                        if (error instanceof Error && error.message.includes('timeout')) {
                            console.warn(`⏱️ CVE check timed out for ${filename}`);
                        }
                    }
                })();
                cvePromises.push(cvePromise);
            }
            // Wait for all CVE checks with overall 10s limit
            try {
                const allChecksTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('All CVE checks timeout')), 10000);
                });
                await Promise.race([
                    Promise.allSettled(cvePromises),
                    allChecksTimeout
                ]);
            }
            catch (error) {
                console.warn('⏱️ CVE checks stopped due to timeout');
            }
            results.cveFindings = cveFindings;
        }
        // Phase 4: Generate Enhanced Report
        const enhancedReport = this.generateEnhancedReport(results, fuzzTargets[0]);
        results.enhancedReport = enhancedReport;
        return results;
    }
    /**
     * Find the file containing a specific function
     */
    findTargetFile(codeFiles, functionName) {
        for (const [filename, fileData] of codeFiles.entries()) {
            if (fileData.code.includes(`function ${functionName}`) ||
                fileData.code.includes(`def ${functionName}`) ||
                fileData.code.includes(`${functionName}(`)) {
                return fileData;
            }
        }
        return null;
    }
    /**
     * Generate comprehensive vulnerability report from all analysis results
     */
    generateEnhancedReport(results, primaryTarget) {
        let severity = 'Medium';
        let title = 'Enhanced Security Analysis Report';
        let description = '';
        let vulnerableCode = '';
        let mitigation = '';
        // Prioritize findings by severity
        if (results.symbolicExecution?.vulnerabilities?.length > 0) {
            const criticalVuln = results.symbolicExecution.vulnerabilities.find((v) => v.severity === 'Critical') || results.symbolicExecution.vulnerabilities[0];
            severity = criticalVuln.severity;
            title = `${severity.toUpperCase()}: ${criticalVuln.type} in ${primaryTarget.functionName}()`;
            description = `**Discovered via Symbolic Execution**\n\n${criticalVuln.description}\n\n`;
            description += `**Execution Path**: Path #${criticalVuln.path.pathId} led to ${criticalVuln.type}`;
        }
        else if (results.coverageFuzzing?.crashes?.length > 0) {
            const worstCrash = results.coverageFuzzing.crashes.reduce((worst, crash) => crash.severity === 'Critical' ? crash : worst);
            severity = worstCrash.severity;
            title = `${severity.toUpperCase()}: ${worstCrash.crashType} in ${primaryTarget.functionName}()`;
            description = `**Discovered via Coverage-Guided Fuzzing**\n\n`;
            description += `The function ${primaryTarget.functionName}() crashes when provided with specific inputs. `;
            description += `After ${results.coverageFuzzing.totalExecutions} executions achieving ${results.coverageFuzzing.coveragePercent.toFixed(2)}% code coverage, `;
            description += `${results.coverageFuzzing.crashes.length} crash(es) were identified.\n\n`;
            description += `**Crash Details**: ${worstCrash.error}\n`;
            description += `**Input**: \`${JSON.stringify(worstCrash.input).substring(0, 200)}\``;
            vulnerableCode = worstCrash.stackTrace.substring(0, 500);
        }
        // Add CVE findings if any
        if (results.cveFindings && results.cveFindings.size > 0) {
            description += '\n\n**Known CVE Matches**:\n';
            for (const [filename, cveResult] of results.cveFindings.entries()) {
                for (const cve of cveResult.cves.slice(0, 3)) {
                    description += `- ${cve.cveId} (${cve.severity}): ${cve.description.substring(0, 100)}...\n`;
                }
            }
        }
        // Generate mitigation strategies
        mitigation = this.generateMitigationStrategies(results);
        return {
            vulnerabilityTitle: title,
            cveId: this.extractCVEId(results),
            severity,
            description: description || 'Enhanced security analysis completed. See detailed report.',
            vulnerableCode: vulnerableCode || `function ${primaryTarget.functionName}() { /* analysis target */ }`,
            language: primaryTarget.language,
            mitigation
        };
    }
    /**
     * Extract CVE ID from findings or generate internal ID
     */
    extractCVEId(results) {
        if (results.cveFindings && results.cveFindings.size > 0) {
            for (const [_, cveResult] of results.cveFindings.entries()) {
                if (cveResult.cves.length > 0) {
                    return cveResult.cves[0].cveId;
                }
            }
        }
        return `Internal-FZF-Enhanced-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }
    /**
     * Generate comprehensive mitigation strategies based on all findings
     */
    generateMitigationStrategies(results) {
        const strategies = [];
        strategies.push('## Immediate Actions\n');
        if (results.coverageFuzzing?.crashes?.length > 0) {
            strategies.push('1. **Fix Crash Vulnerabilities**:');
            strategies.push('   - Add input validation for all user-controllable parameters');
            strategies.push('   - Implement proper error handling with try-catch blocks');
            strategies.push('   - Add unit tests covering the crash-inducing inputs discovered by fuzzing\n');
        }
        if (results.symbolicExecution?.vulnerabilities?.length > 0) {
            strategies.push('2. **Address Path-Based Vulnerabilities**:');
            strategies.push('   - Review all execution paths identified by symbolic execution');
            strategies.push('   - Add assertions to prevent reaching vulnerable code paths');
            strategies.push('   - Implement defensive programming patterns\n');
        }
        if (results.cveFindings && results.cveFindings.size > 0) {
            strategies.push('3. **Update Vulnerable Dependencies**:');
            strategies.push('   - Upgrade all libraries with known CVEs to patched versions');
            strategies.push('   - Run `npm audit fix` or equivalent package manager command');
            strategies.push('   - Review security advisories for breaking changes\n');
        }
        strategies.push('## Long-Term Improvements\n');
        strategies.push('- Integrate continuous fuzzing into CI/CD pipeline');
        strategies.push('- Enable real-time CVE monitoring for dependencies');
        strategies.push('- Implement automated security testing with coverage thresholds');
        strategies.push('- Consider formal verification for critical security functions');
        return strategies.join('\n');
    }
    /**
     * Generate comprehensive markdown report
     */
    generateFullReport(results) {
        let report = '# FuzzForge Enhanced Security Analysis Report\n\n';
        report += `**Generated**: ${new Date().toISOString()}\n\n`;
        report += '---\n\n';
        if (results.coverageFuzzing) {
            report += '## Coverage-Guided Fuzzing Results\n\n';
            report += `- **Executions**: ${results.coverageFuzzing.totalExecutions}\n`;
            report += `- **Coverage**: ${results.coverageFuzzing.coveragePercent.toFixed(2)}%\n`;
            report += `- **Crashes Found**: ${results.coverageFuzzing.crashes.length}\n`;
            report += `- **Interesting Inputs**: ${results.coverageFuzzing.interestingInputs.length}\n\n`;
        }
        if (results.symbolicExecution) {
            report += '## Symbolic Execution Results\n\n';
            report += `- **Paths Explored**: ${results.symbolicExecution.totalPaths}\n`;
            report += `- **Vulnerabilities**: ${results.symbolicExecution.vulnerabilities.length}\n`;
            report += `- **Unreachable Code**: ${results.symbolicExecution.unreachableCode.length} lines\n\n`;
        }
        if (results.cveFindings && results.cveFindings.size > 0) {
            report += '## CVE Database Findings\n\n';
            for (const [filename, cveResult] of results.cveFindings.entries()) {
                report += `### ${filename}\n`;
                report += this.cveIntegration.generateCVEReport(cveResult);
                report += '\n\n';
            }
        }
        report += '## Final Vulnerability Report\n\n';
        report += `### ${results.enhancedReport.vulnerabilityTitle}\n\n`;
        report += `**Severity**: ${results.enhancedReport.severity}\n`;
        report += `**CVE ID**: ${results.enhancedReport.cveId}\n\n`;
        report += `${results.enhancedReport.description}\n\n`;
        report += `### Mitigation\n\n${results.enhancedReport.mitigation}\n`;
        return report;
    }
    /**
     * Generate fallback result when enhanced fuzzing times out or fails
     */
    generateFallbackResult(fuzzTargets) {
        console.log('🔄 Generating fallback result due to timeout/error...');
        const primaryTarget = fuzzTargets[0] || {
            functionName: 'unknown',
            language: 'javascript',
            params: [],
            attackSurface: 'medium'
        };
        return {
            enhancedReport: {
                vulnerabilityTitle: `Security Analysis: ${primaryTarget.functionName}()`,
                cveId: `Internal-FZF-Fallback-${Date.now()}`,
                severity: 'Medium',
                description: `Enhanced fuzzing analysis was initiated but completed with limited results. ` +
                    `Manual code review recommended for function: ${primaryTarget.functionName}()`,
                vulnerableCode: `function ${primaryTarget.functionName}() { /* Code analysis incomplete */ }`,
                language: primaryTarget.language,
                mitigation: `## Recommended Actions\n\n` +
                    `1. **Manual Code Review**: Perform thorough security review of ${primaryTarget.functionName}()\n` +
                    `2. **Input Validation**: Ensure all user inputs are validated and sanitized\n` +
                    `3. **Unit Testing**: Add comprehensive test coverage for edge cases\n` +
                    `4. **Static Analysis**: Run additional static analysis tools (ESLint, SonarQube)\n` +
                    `5. **Penetration Testing**: Consider professional security audit\n\n` +
                    `Note: Enhanced fuzzing timed out - results may be incomplete.`
            }
        };
    }
}
//# sourceMappingURL=enhancedFuzzingWorkflow.js.map
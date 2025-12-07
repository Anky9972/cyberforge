import React, { useState, useCallback } from 'react';
import type { AgentLog, APIFinding, CKGData, FuzzTarget, ReconFinding, VulnerabilityReportData, WorkflowStep } from '../types';
import { 
    generateCKG,
    generateCKGWithAST, 
    performReconnaissanceAnalysis,
    performAPISecurityAnalysis,
    identifyFuzzTargets, 
    generatePromptFuzzInputs, 
    simulateFuzzingAndGenerateReport,
    executeRealFuzzingAndGenerateReport
} from '../services/geminiService';
import { parseZipFile, parseZipFileWithCode } from '../services/zipParser';
import { EnhancedFuzzingWorkflow } from '../services/enhancedFuzzingWorkflow';
import { CVEDatabaseIntegration } from '../services/cveIntegration';
import { createProject, createScan, saveAnalysisResults } from '../services/databaseService';
import { LargeFileHandler, AnalysisCache } from '../services/largeFileHandler';
import { 
    GraphIcon, TargetIcon, CodeIcon, BugIcon, ReportIcon, ReconIcon, ShieldIcon,
    SecretIcon, PathIcon, ConfigIcon, AlertIcon
} from '../components/icons';
import CodeBlock from '../components/CodeBlock';
import CKGVisualizer from '../components/CKGVisualizer';

const initialSteps: WorkflowStep[] = [
    { id: 'recon', name: 'Static & Recon', icon: <ReconIcon /> },
    { id: 'api-security', name: 'API Security', icon: <ShieldIcon /> },
    { id: 'ckg', name: 'Code Knowledge Graph', icon: <GraphIcon /> },
    { id: 'targeting', name: 'Fuzz Target Analysis', icon: <TargetIcon /> },
    { id: 'promptfuzz', name: 'PromptFuzz Generation', icon: <CodeIcon /> },
    { id: 'fuzzing', name: 'Fuzzing Simulation', icon: <BugIcon /> },
    { id: 'reporting', name: 'Reporting', icon: <ReportIcon /> },
];

export const useFuzzingWorkflow = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
    const [report, setReport] = useState<VulnerabilityReportData | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
    const [analysisEndTime, setAnalysisEndTime] = useState<number>(0);
    const [fileName, setFileName] = useState<string>('');
    const [fileCount, setFileCount] = useState<number>(0);
    const [linesOfCode, setLinesOfCode] = useState<number>(0);
    const [viewingStep, setViewingStep] = useState<number | null>(null);

    const resetWorkflow = () => {
        setCurrentStepIndex(0);
        setAgentLogs([]);
        setReport(null);
        setIsProcessing(false);
        setError(null);
        setCompletedSteps([]);
        setAnalysisStartTime(0);
        setAnalysisEndTime(0);
        setFileName('');
        setFileCount(0);
        setLinesOfCode(0);
        setViewingStep(null);
    };

    const navigateToStep = (stepIndex: number) => {
        if (completedSteps.includes(stepIndex) || stepIndex <= currentStepIndex) {
            setViewingStep(stepIndex);
        }
    };

    const startFuzzing = useCallback(async (file: File) => {
        resetWorkflow();
        setIsProcessing(true);
        setAnalysisStartTime(Date.now());
        setFileName(file.name);
        let currentLogs: AgentLog[] = [];

        try {
            // Show initial parsing progress
            let parsingProgress = 0;
            const parsingLog: AgentLog = {
                agentName: 'File Parser',
                icon: <ReconIcon />,
                content: (
                    <div className="space-y-2">
                        <p>📦 Extracting and parsing codebase...</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300"
                                style={{ width: `${parsingProgress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400">{parsingProgress}% complete</p>
                    </div>
                ),
                isLoading: true,
            };
            currentLogs.push(parsingLog);
            setAgentLogs([...currentLogs]);

            // Parse the uploaded ZIP file with progress callback
            const { summary: fileContent, codeFiles } = await parseZipFileWithCode(file, (progress) => {
                parsingProgress = progress;
                parsingLog.content = (
                    <div className="space-y-2">
                        <p>📦 Extracting and parsing codebase...</p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-400">{progress}% complete</p>
                    </div>
                );
                currentLogs[0] = parsingLog;
                setAgentLogs([...currentLogs]);
            });
            
            // Check if this is a large file and apply optimizations
            const isLargeFile = LargeFileHandler.isLargeFile(file.size);
            let optimizedFiles = codeFiles;
            
            if (isLargeFile) {
                console.log(`📊 Large file detected (${(file.size/1024/1024).toFixed(1)}MB) - applying optimizations...`);
                
                // Filter out irrelevant files
                optimizedFiles = LargeFileHandler.filterRelevantFiles(codeFiles);
                
                // If still too large, use smart sampling
                if (optimizedFiles.size > 200) {
                    console.log(`🎯 Too many files (${optimizedFiles.size}) - applying smart sampling...`);
                    optimizedFiles = LargeFileHandler.smartSample(optimizedFiles);
                }
                
                // Estimate memory impact
                const memoryEstimate = LargeFileHandler.estimateMemoryImpact(optimizedFiles);
                console.log(`💾 Estimated memory: ${memoryEstimate.estimatedMB.toFixed(1)}MB`);
                if (memoryEstimate.warning) {
                    console.warn(`⚠️ ${memoryEstimate.warning}: ${memoryEstimate.recommendation}`);
                }
            }
            
            // Update parsing log as complete
            parsingLog.content = (
                <div>
                    <p className="text-green-400">✅ Codebase parsed successfully!</p>
                    <p className="text-sm text-gray-400 mt-1">
                        Extracted {codeFiles.size} files 
                        {isLargeFile && optimizedFiles.size < codeFiles.size && (
                            <span className="text-blue-400"> (optimized to {optimizedFiles.size} relevant files)</span>
                        )}
                    </p>
                    {isLargeFile && (
                        <p className="text-xs text-yellow-400 mt-1">
                            🚀 Large file optimizations applied for better performance
                        </p>
                    )}
                </div>
            );
            parsingLog.isLoading = false;
            currentLogs[0] = parsingLog;
            setAgentLogs([...currentLogs]);
            
            console.log(`🔬 Extracted ${optimizedFiles.size} files for AST analysis`);
            
            // Store file metrics
            setFileCount(codeFiles.size);
            const totalLines = Array.from(codeFiles.values())
                .reduce((sum, file) => sum + (file.code?.split('\n').length || 0), 0);
            setLinesOfCode(totalLines);

            // ========================================
            // PHASE 2: PARALLEL EXECUTION OF AGENTS (with fallback)
            // Try parallel execution, fall back to sequential if it fails
            // ========================================
            console.log('🚀 Attempting parallel agent execution (Recon + API Security)...');
            
            // Initialize both agent logs at once
            setCurrentStepIndex(0);
            let reconAgentLog: AgentLog = {
                agentName: 'Static & Reconnaissance Agent',
                icon: <ReconIcon />,
                content: <p>⚡ Running in parallel with API Security analysis...</p>,
                isLoading: true,
            };
            let apiAgentLog: AgentLog = {
                agentName: 'API Security Agent',
                icon: <ShieldIcon />,
                content: <p>⚡ Running in parallel with Reconnaissance analysis...</p>,
                isLoading: true,
            };
            currentLogs.push(reconAgentLog, apiAgentLog);
            setAgentLogs([...currentLogs]);

            let reconFindings: ReconFinding[] = [];
            let apiFindings: APIFinding[] = [];
            let usedParallelExecution = false;

            // Try parallel execution with Promise.all
            try {
                console.log("🚀 Attempting parallel agent execution (Recon + API Security)...");
                [reconFindings, apiFindings] = await Promise.all([
                    performReconnaissanceAnalysis(fileContent),
                    performAPISecurityAnalysis(fileContent)
                ]);
                usedParallelExecution = true;
                console.log(`✅ Parallel execution succeeded: Recon found ${reconFindings.length} issues, API Security found ${apiFindings.length} issues`);
            } catch (parallelError) {
                console.warn('⚠️ Parallel execution failed, falling back to sequential execution:', parallelError);
                
                // Fallback: Run sequentially with better error handling
                try {
                    console.log("🔄 Starting sequential execution - Reconnaissance first...");
                    reconFindings = await performReconnaissanceAnalysis(fileContent);
                    console.log(`✅ Sequential: Recon completed (${reconFindings.length} issues)`);
                    
                    console.log("🔄 Starting API Security analysis...");
                    apiFindings = await performAPISecurityAnalysis(fileContent);
                    console.log(`✅ Sequential: API Security completed (${apiFindings.length} issues)`);
                } catch (sequentialError) {
                    console.error('❌ Both parallel and sequential execution failed:', sequentialError);
                    
                    // If both fail, try to continue with empty results
                    console.log("🔄 Attempting partial recovery with empty analysis results...");
                    reconFindings = [];
                    apiFindings = [];
                    
                    // Show a warning to the user but don't completely fail
                    console.warn("⚠️ Analysis failed but continuing with empty results. The AI service may be overloaded.");
                }
            }
            
            const getCategoryIcon = (category: ReconFinding['category']) => {
                switch (category) {
                    case 'Hardcoded Secret': return <SecretIcon className="h-5 w-5 text-yellow-400" />;
                    case 'Exposed Path': return <PathIcon className="h-5 w-5 text-sky-400" />;
                    case 'Insecure Configuration': return <ConfigIcon className="h-5 w-5 text-orange-400" />;
                    case 'Vulnerable Pattern': return <BugIcon className="h-5 w-5 text-red-500" />;
                    case 'Threat Intel Match': return <AlertIcon className="h-5 w-5 text-red-600" />;
                    default: return <AlertIcon className="h-5 w-5 text-gray-400" />;
                }
            };

            const groupedReconFindings = reconFindings.reduce((acc, finding) => {
                (acc[finding.category] = acc[finding.category] || []).push(finding);
                return acc;
            }, {} as Record<ReconFinding['category'], ReconFinding[]>);

            const reconContent = (
                 <div>
                    {usedParallelExecution ? (
                        <div className="bg-blue-900/20 border border-blue-700 rounded p-2 mb-2">
                            <span className="text-blue-400 font-bold">⚡ PARALLEL EXECUTION</span>
                            <span className="text-gray-300 text-sm ml-2">
                                Completed concurrently with API Security analysis
                            </span>
                        </div>
                    ) : (
                        <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2 mb-2">
                            <span className="text-yellow-400 font-bold">⚠️ SEQUENTIAL FALLBACK</span>
                            <span className="text-gray-300 text-sm ml-2">
                                Parallel execution unavailable, ran sequentially
                            </span>
                        </div>
                    )}
                    <p>Static analysis complete. Found {reconFindings.length} potential issue(s).</p>
                    {Object.entries(groupedReconFindings).length > 0 ? (
                        <div className="mt-4 space-y-4">
                            {Object.entries(groupedReconFindings).map(([category, findings]) => (
                                <div key={category}>
                                    <h4 className="font-semibold text-gray-200 flex items-center gap-2 mb-2">
                                        {getCategoryIcon(category as ReconFinding['category'])}
                                        {category} ({findings.length})
                                    </h4>
                                    <ul className="list-disc pl-8 space-y-3 border-l border-gray-700 ml-2.5">
                                        {findings.map((finding, i) => (
                                            <li key={i} className="text-sm">
                                                {finding.threatIntelMatch && (
                                                    <span className="mr-2 bg-red-800 text-red-200 text-xs font-bold px-2 py-0.5 rounded-full border border-red-600">
                                                        Threat Intel: {finding.threatIntelMatch}
                                                    </span>
                                                )}
                                                <span>{finding.description}</span>
                                                <p className="text-xs text-gray-400 mt-1"><em><b>Recommendation:</b> {finding.recommendation}</em></p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-gray-400">No static vulnerabilities found.</p>}
                </div>
            );
            reconAgentLog = { ...reconAgentLog, isLoading: false, content: reconContent };
            currentLogs[0] = reconAgentLog;
            setAgentLogs([...currentLogs]);
            setCompletedSteps(prev => [...prev, 0]); // Mark step 0 as completed

            // Enhanced: Check CVE database for reconnaissance findings
            console.log('🔍 Checking CVE database for reconnaissance findings...');
            const cveDB = new CVEDatabaseIntegration();
            for (const finding of reconFindings) {
                try {
                    const cveResult = await cveDB.searchCVEs(finding.description, `recon:${finding.category}`);
                    if (cveResult.found && cveResult.cves.length > 0) {
                        finding.threatIntelMatch = cveResult.cves[0].cveId;
                        console.log(`✅ Found CVE match for ${finding.category}: ${finding.threatIntelMatch}`);
                    }
                } catch (cveError) {
                    console.warn('⚠️ CVE check failed for finding:', cveError);
                }
            }

            // Update API Security results
            setCurrentStepIndex(1);

            const getSeverityColor = (severity: APIFinding['severity']) => {
                switch (severity) {
                    case 'Critical': return 'text-red-400';
                    case 'High': return 'text-orange-400';
                    case 'Medium': return 'text-yellow-400';
                    default: return 'text-sky-400';
                }
            };

            const apiContent = (
                <div>
                    <div className="bg-blue-900/20 border border-blue-700 rounded p-2 mb-2">
                        <span className="text-blue-400 font-bold">⚡ PARALLEL EXECUTION</span>
                        <span className="text-gray-300 text-sm ml-2">
                            Completed concurrently with Reconnaissance analysis
                        </span>
                    </div>
                    <p>API security analysis complete. Found {apiFindings.length} potential issue(s).</p>
                    {apiFindings.length > 0 ? (
                        <div className="mt-4 space-y-3">
                            {apiFindings.map((finding, i) => (
                                <div key={i} className="border-l-4 border-gray-700 pl-4 py-1">
                                    <h4 className="font-semibold text-gray-200 flex justify-between items-center">
                                        <span>{finding.category.replace(/([A-Z])/g, ' $1').trim()}</span>
                                        <span className={`text-sm font-bold ${getSeverityColor(finding.severity)}`}>{finding.severity}</span>
                                    </h4>
                                    <p className="text-sm text-gray-300 mt-1">{finding.description}</p>
                                    <p className="text-xs text-gray-400 mt-1"><em><b>Recommendation:</b> {finding.recommendation}</em></p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="mt-2 text-gray-400">No specific API vulnerabilities found.</p>}
                </div>
            );
            apiAgentLog = { ...apiAgentLog, isLoading: false, content: apiContent };
            currentLogs[1] = apiAgentLog;
            setAgentLogs([...currentLogs]);
            setCompletedSteps(prev => [...prev, 1]); // Mark step 1 as completed


            // Step 3: Code Knowledge Graph (CKG) - NOW WITH REAL AST ANALYSIS!
            setCurrentStepIndex(2);
            let ckgAgentLog: AgentLog = {
                agentName: 'CKG Agent (AST-Powered)',
                icon: <GraphIcon />,
                content: <p>🔬 Parsing <code>{file.name}</code> with Abstract Syntax Tree analysis (REAL code parsing, not LLM guessing)...</p>,
                isLoading: true,
            };
            currentLogs.push(ckgAgentLog);
            setAgentLogs([...currentLogs]);
            
            console.log('🎯 Starting CKG generation with AST...');
            const ckgData = await generateCKGWithAST(fileContent, codeFiles);
            console.log('📊 CKG Data received:', {
                nodesCount: ckgData.nodes.length,
                edgesCount: ckgData.edges.length,
                summary: ckgData.summary
            });
            
            const ckgContent = (
                <div>
                    <div className="bg-green-900/20 border border-green-700 rounded p-2 mb-3">
                        <span className="text-green-400 font-bold">🔬 AST-VERIFIED</span>
                        <span className="text-gray-300 text-sm ml-2">
                            This graph is built from actual code structure, not LLM inference
                        </span>
                    </div>
                    <p>{ckgData.summary}</p>
                    <CKGVisualizer nodes={ckgData.nodes} edges={ckgData.edges} />
                </div>
            );
            ckgAgentLog = { ...ckgAgentLog, isLoading: false, content: ckgContent };
            currentLogs[2] = ckgAgentLog;
            setAgentLogs([...currentLogs]);
            setCompletedSteps(prev => [...prev, 2]); // Mark step 2 as completed


            // Step 4: Fuzz Target Analysis
            setCurrentStepIndex(3);
            let targetAgentLog: AgentLog = {
                agentName: 'Target Analysis Agent',
                icon: <TargetIcon />,
                content: <p>Analyzing CKG to identify high-value fuzz targets...</p>,
                isLoading: true,
            };
            currentLogs.push(targetAgentLog);
            setAgentLogs([...currentLogs]);

            const fuzzTargets = await identifyFuzzTargets(ckgData.summary);
            
            // Check if fallback targets were used
            const usedFallbackTargets = fuzzTargets.some(t => 
                t.reasoning.includes('heuristic') || 
                t.reasoning.includes('fallback') ||
                t.reasoning.includes('Default target')
            );
            
            const targetBadge = usedFallbackTargets ? (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2 mb-3">
                    <span className="text-yellow-400 font-bold">⚠️ HEURISTIC ANALYSIS</span>
                    <span className="text-gray-300 text-sm ml-2">
                        AI target identification unavailable - using pattern-based detection
                    </span>
                </div>
            ) : (
                <div className="bg-green-900/20 border border-green-700 rounded p-2 mb-3">
                    <span className="text-green-400 font-bold">🎯 AI-IDENTIFIED</span>
                    <span className="text-gray-300 text-sm ml-2">
                        Targets selected by AI security analysis
                    </span>
                </div>
            );
            
            const fuzzTargetsContent = (
                <div>
                    {targetBadge}
                    <p>Identified the following high-value fuzz targets:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        {fuzzTargets.map((target, i) => (
                            <li key={i}>
                                <strong className='font-mono bg-gray-900 px-1 rounded'>{target.functionName}</strong>: {target.reasoning}
                            </li>
                        ))}
                    </ul>
                </div>
            );
            targetAgentLog = { ...targetAgentLog, isLoading: false, content: fuzzTargetsContent };
            currentLogs[3] = targetAgentLog;
            setAgentLogs([...currentLogs]);

            // Step 5: PromptFuzz Generation
            setCurrentStepIndex(4);
            let promptFuzzAgentLog: AgentLog = {
                agentName: 'PromptFuzz Agent',
                icon: <CodeIcon />,
                content: <p>Generating intelligent fuzz inputs for identified targets...</p>,
                isLoading: true,
            };
            currentLogs.push(promptFuzzAgentLog);
            setAgentLogs([...currentLogs]);

            const fuzzInputs = await generatePromptFuzzInputs(fuzzTargets);
            promptFuzzAgentLog = { ...promptFuzzAgentLog, isLoading: false, content: <CodeBlock code={fuzzInputs} language="text" /> };
            currentLogs[4] = promptFuzzAgentLog;
            setAgentLogs([...currentLogs]);
            setCompletedSteps(prev => [...prev, 3, 4]); // Mark steps 3 and 4 as completed
            
            // ========================================
            // PHASE 3: ENHANCED FUZZING ENGINE
            // Try enhanced features first, fall back to basic if needed
            // ========================================
            setCurrentStepIndex(5);
            
            // Create progress state for fuzzing
            let fuzzingProgress = 0;
            let fuzzingPhase = 'Initializing...';
            
            const updateFuzzingProgress = (phase: string, progress: number) => {
                fuzzingPhase = phase;
                fuzzingProgress = progress;
                
                const progressBar = (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-cyan-400 font-semibold">{phase}</span>
                            <span className="text-gray-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-gray-300 text-sm mt-2">
                            🔬 Executing ENHANCED fuzzing (coverage-guided + symbolic execution + CVE checking)...
                        </p>
                    </div>
                );
                
                const updatedLog: AgentLog = {
                    agentName: 'Enhanced Fuzzing Engine',
                    icon: <BugIcon />,
                    content: progressBar,
                    isLoading: true,
                };
                
                currentLogs[currentLogs.length - 1] = updatedLog;
                setAgentLogs([...currentLogs]);
            };
            
            let fuzzingAgentLog: AgentLog = {
                agentName: 'Enhanced Fuzzing Engine',
                icon: <BugIcon />,
                content: (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-cyan-400 font-semibold">Initializing...</span>
                            <span className="text-gray-400">0%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: '0%' }}
                            />
                        </div>
                        <p className="text-gray-300 text-sm mt-2">
                            🔬 Executing ENHANCED fuzzing (coverage-guided + symbolic execution + CVE checking)...
                        </p>
                    </div>
                ),
                isLoading: true,
            };
            currentLogs.push(fuzzingAgentLog);
            setAgentLogs([...currentLogs]);

            console.log('🚀 Starting ENHANCED fuzzing engine...');
            
            // Update progress: Starting
            await new Promise(resolve => setTimeout(resolve, 300));
            updateFuzzingProgress('Starting Enhanced Fuzzing Engine...', 10);
            
            // Update progress: Starting
            await new Promise(resolve => setTimeout(resolve, 300));
            updateFuzzingProgress('Starting Enhanced Fuzzing Engine...', 10);
            
            let vulnerabilityReport: VulnerabilityReportData;
            let enhancedFeaturesUsed = false;
            
            // Check if enhanced features are available for this codebase
            const hasJavaScriptCode = Array.from(codeFiles.values()).some(file => 
                file.language === 'JavaScript' || file.language === 'TypeScript'
            );
            
            // Update progress: Checking compatibility
            await new Promise(resolve => setTimeout(resolve, 200));
            updateFuzzingProgress('Checking codebase compatibility...', 20);
            
            if (hasJavaScriptCode && fuzzTargets.length > 0) {
                try {
                    console.log('✅ Codebase compatible with enhanced features');
                    
                    // Update progress: Initializing workflow
                    updateFuzzingProgress('Initializing Enhanced Workflow...', 30);
                    
                    // Initialize Enhanced Fuzzing Workflow
                    const enhancedWorkflow = new EnhancedFuzzingWorkflow({
                        enableCoverageGuidedFuzzing: true,
                        enableSymbolicExecution: true,
                        enableCVEIntegration: true,
                        maxFuzzingIterations: 500,
                        maxSymbolicPaths: 50
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, 300));
                    updateFuzzingProgress('Phase 1: Coverage-Guided Fuzzing...', 40);
                    
                    // Execute enhanced fuzzing
                    const enhancedResult = await enhancedWorkflow.executeEnhancedFuzzing(
                        codeFiles,
                        fuzzTargets
                    );
                    
                    // Update progress: Completing phases
                    updateFuzzingProgress('Phase 2: Symbolic Execution...', 70);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    updateFuzzingProgress('Phase 3: CVE Database Check...', 85);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    updateFuzzingProgress('Generating Report...', 95);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    vulnerabilityReport = enhancedResult.enhancedReport;
                    enhancedFeaturesUsed = true;
                    
                    updateFuzzingProgress('Enhanced Fuzzing Complete! ✅', 100);
                    
                    console.log(`✅ Enhanced fuzzing complete:
                        - Coverage fuzzing: ${enhancedResult.coverageFuzzing ? '✅' : '❌'}
                        - Symbolic execution: ${enhancedResult.symbolicExecution ? '✅' : '❌'}
                        - CVE database: ${enhancedResult.cveFindings ? '✅' : '❌'}`);
                    
                } catch (enhancedError) {
                    console.warn('⚠️ Enhanced fuzzing unavailable, falling back to standard:', enhancedError);
                    updateFuzzingProgress('Falling back to standard fuzzing...', 50);
                    enhancedFeaturesUsed = false;
                }
            } else {
                updateFuzzingProgress('Using standard fuzzing (no JS/TS code)...', 50);
            }
            
            // Fallback to standard fuzzing if enhanced not available
            if (!enhancedFeaturesUsed) {
                console.log('⚠️ Using standard fuzzing engine');
                updateFuzzingProgress('Executing standard fuzzing...', 60);
                
                vulnerabilityReport = await executeRealFuzzingAndGenerateReport(
                    codeFiles,
                    ckgData.summary,
                    reconFindings,
                    apiFindings,
                    fuzzTargets
                );
                
                updateFuzzingProgress('Standard Fuzzing Complete! ✅', 100);
            }
            
            // Determine which features were actually used
            const usedRealFuzzing = vulnerabilityReport.description.includes('Real fuzzing') && 
                                   !vulnerabilityReport.description.includes('unavailable');
            
            const fuzzBadge = enhancedFeaturesUsed ? (
                <div className="bg-green-900/20 border border-green-700 rounded p-2 mb-2">
                    <span className="text-green-400 font-bold">🚀 ENHANCED FUZZING</span>
                    <span className="text-gray-300 text-sm ml-2">
                        Coverage-guided fuzzing + Symbolic execution + CVE database integration
                    </span>
                </div>
            ) : usedRealFuzzing ? (
                <div className="bg-purple-900/20 border border-purple-700 rounded p-2 mb-2">
                    <span className="text-purple-400 font-bold">🐛 REAL FUZZING</span>
                    <span className="text-gray-300 text-sm ml-2">
                        Vulnerability discovered through actual code execution and mutation testing
                    </span>
                </div>
            ) : (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2 mb-2">
                    <span className="text-yellow-400 font-bold">⚠️ LLM SIMULATION</span>
                    <span className="text-gray-300 text-sm ml-2">
                        Real fuzzing engine unavailable - using LLM-based analysis
                    </span>
                </div>
            );
            
            fuzzingAgentLog = { 
                ...fuzzingAgentLog, 
                isLoading: false, 
                content: (
                    <>
                        {fuzzBadge}
                        <p>Analysis complete! A potential <strong>{vulnerabilityReport.severity}</strong> severity vulnerability was identified: <strong>{vulnerabilityReport.vulnerabilityTitle}</strong>.</p>
                        <p>Generating final report...</p>
                    </>
                ) 
            };
            currentLogs[5] = fuzzingAgentLog;
            setAgentLogs([...currentLogs]);

            // Step 7: Final Report
            setCurrentStepIndex(6);
            setReport(vulnerabilityReport);
            setCompletedSteps(prev => [...prev, 5, 6]); // Mark steps 5 and 6 as completed
            setAnalysisEndTime(Date.now()); // Record end time
            
            // Save to localStorage for history
            try {
                const historyItem = {
                    id: Date.now().toString(),
                    fileName: fileName,
                    timestamp: Date.now(),
                    duration: (Date.now() - analysisStartTime) / 1000,
                    fileCount: fileCount,
                    linesOfCode: linesOfCode,
                    severity: vulnerabilityReport.severity,
                    vulnerabilityTitle: vulnerabilityReport.vulnerabilityTitle,
                    cveId: vulnerabilityReport.cveId,
                };
                
                const existingHistory = localStorage.getItem('cyberforge_analysis_history');
                const history = existingHistory ? JSON.parse(existingHistory) : [];
                history.unshift(historyItem); // Add to beginning
                
                // Keep only last 50 analyses
                if (history.length > 50) {
                    history.splice(50);
                }
                
                localStorage.setItem('cyberforge_analysis_history', JSON.stringify(history));
                console.log('✅ Analysis saved to history');
            } catch (historyError) {
                console.warn('⚠️ Failed to save analysis to history:', historyError);
            }
            
            // ========================================
            // PHASE 8: SAVE TO DATABASE (NEW!)
            // ========================================
            console.log('💾 Saving analysis results to database...');
            try {
                // Get primary language from codeFiles
                const languageCounts = new Map<string, number>();
                Array.from(codeFiles.values()).forEach(file => {
                    const count = languageCounts.get(file.language) || 0;
                    languageCounts.set(file.language, count + 1);
                });
                const primaryLanguage = Array.from(languageCounts.entries())
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

                // Calculate duration in seconds
                const duration = Math.floor((Date.now() - Date.now()) / 1000); // Will be calculated properly

                // Create project
                const projectId = await createProject(file.name, primaryLanguage);
                
                // Create scan
                const totalLines = Array.from(codeFiles.values())
                    .reduce((sum, file) => sum + (file.code?.split('\n').length || 0), 0);
                const scanId = await createScan(projectId, codeFiles.size, totalLines);
                
                // Save all analysis results
                await saveAnalysisResults(
                    projectId,
                    scanId,
                    reconFindings,
                    apiFindings,
                    vulnerabilityReport,
                    fuzzTargets,
                    ckgData,
                    duration
                );
                
                console.log('✅ Analysis results saved to database successfully');
            } catch (dbError) {
                console.warn('⚠️ Failed to save to database (continuing anyway):', dbError);
                // Don't fail the entire workflow if database save fails
            }
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    return {
        steps: initialSteps,
        currentStepIndex,
        agentLogs,
        report,
        isProcessing,
        error,
        startFuzzing,
        resetWorkflow,
        completedSteps,
        navigateToStep,
        viewingStep,
        analysisStartTime,
        analysisEndTime,
        fileName,
        fileCount,
        linesOfCode,
    };
};
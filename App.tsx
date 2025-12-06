import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import { DocumentationPage } from './components/DocumentationPage';
import { PricingPage } from './components/PricingPage';
import { AboutPage } from './components/AboutPage';
import FileUpload from './components/FileUpload';
import WorkflowStepper from './components/WorkflowStepper';
import AgentCard from './components/AgentCard';
import VulnerabilityReport from './components/VulnerabilityReport';
import EnhancedFuzzingDashboard from './components/EnhancedFuzzingDashboard';
import AnalysisOverview from './components/AnalysisOverview';
import { NavHeader } from './components/NavHeader';
import { AuthManager } from './components/auth/AuthManager';
import { useFuzzingWorkflow } from './hooks/useFuzzingWorkflow';
import GraphViewerPage from './components/GraphViewerPage';
import { ThemeProvider } from './contexts/ThemeContext';
import { OnboardingTour } from './components/OnboardingTour';

// Main Dashboard/Analysis Page Component
const AnalysisPage: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => {
    const {
        steps,
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
    } = useFuzzingWorkflow();

    const navigate = useNavigate();

    const handleFileUpload = (file: File) => {
        startFuzzing(file);
    };

    const handleExportReport = () => {
        if (report) {
            const reportData = JSON.stringify(report, null, 2);
            const blob = new Blob([reportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cyberforge-report-${fileName}-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // Determine which step content to show
    const displayStep = viewingStep !== null ? viewingStep : currentStepIndex;
    const relevantLogs = agentLogs.filter((_, index) => {
        if (viewingStep !== null) {
            return index <= viewingStep;
        }
        return true;
    });

    // Check if analysis is complete
    const isAnalysisComplete = report !== null && !isProcessing;

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans">
            <NavHeader onLogin={onLogin} />
            <div className="container mx-auto p-4 md:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
                        CyberForge Analysis
                    </h1>
                    <p className="text-lg text-gray-400">
                        Forging resilience through intelligent fuzzing.
                    </p>
                </header>

                <main className="space-y-8">
                    <section className="max-w-4xl mx-auto">
                        <WorkflowStepper
                            steps={steps}
                            currentStepIndex={currentStepIndex}
                            onStepClick={navigateToStep}
                            completedSteps={completedSteps}
                        />
                    </section>

                    {agentLogs.length === 0 && !report && (
                        <section className="max-w-3xl mx-auto animate-fade-in">
                            <FileUpload onFileUpload={handleFileUpload} disabled={isProcessing} />
                        </section>
                    )}

                    {error && (
                        <section className="max-w-3xl mx-auto bg-red-900 border border-red-700 p-4 rounded-lg text-red-200 animate-fade-in">
                            <h2 className="font-bold mb-2 text-xl">⚠️ Analysis Error</h2>
                            <p className="mb-3">{error}</p>

                            {error.includes('synthesize') && (
                                <div className="bg-red-800 p-3 rounded mt-2 text-sm">
                                    <p className="font-semibold mb-1">💡 Possible Causes:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Ollama might be starting up (takes 30-60 seconds)</li>
                                        <li>The AI model timed out processing complex code</li>
                                        <li>Network connection to Ollama interrupted</li>
                                    </ul>
                                    <p className="font-semibold mt-3 mb-1">✅ Solutions:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Check if Ollama is running: <code className="bg-gray-800 px-2 py-1 rounded">ollama serve</code></li>
                                        <li>Wait 60 seconds and click "Try Again"</li>
                                        <li>Try uploading a smaller code sample</li>
                                    </ul>
                                </div>
                            )}

                            {error.includes('rate limit') && (
                                <div className="bg-red-800 p-3 rounded mt-2 text-sm">
                                    <p className="font-semibold mb-1">💡 Quick Fixes:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>Wait 60 seconds and try again (automatic retry will occur)</li>
                                        <li>Check your Mistral API tier at <a href="https://console.mistral.ai" target="_blank" rel="noopener noreferrer" className="underline">console.mistral.ai</a></li>
                                        <li>Consider upgrading to a paid tier for higher rate limits</li>
                                        <li>Use a different Mistral API key if available</li>
                                    </ul>
                                </div>
                            )}

                            {error.includes('timeout') && (
                                <div className="bg-red-800 p-3 rounded mt-2 text-sm">
                                    <p className="font-semibold mb-1">⏱️ Timeout occurred:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li>The operation took longer than 60 seconds</li>
                                        <li>Try with a smaller codebase</li>
                                        <li>Check if Ollama is responding: <code className="bg-gray-800 px-2 py-1 rounded">curl http://localhost:11434</code></li>
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        resetWorkflow();
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-6 rounded transition-colors duration-300"
                                >
                                    🔄 Try Again
                                </button>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded transition-colors duration-300"
                                >
                                    🔃 Reload Page
                                </button>
                            </div>
                        </section>
                    )}

                    {agentLogs.length > 0 && !isAnalysisComplete && (
                        <section className="grid gap-8 md:grid-cols-2">
                            {relevantLogs.map((log, index) => (
                                <AgentCard key={index} agentName={log.agentName} icon={log.icon} isLoading={log.isLoading}>
                                    {log.content}
                                </AgentCard>
                            ))}
                        </section>
                    )}

                    {isAnalysisComplete && (
                        <section className="animate-fade-in">
                            <AnalysisOverview
                                agentLogs={agentLogs}
                                report={report}
                                fileName={fileName}
                                analysisStartTime={analysisStartTime}
                                analysisEndTime={analysisEndTime}
                                fileCount={fileCount}
                                linesOfCode={linesOfCode}
                                onNavigateToDashboard={() => navigate('/dashboard')}
                                onExportReport={handleExportReport}
                            />
                            <div className="mt-8 text-center">
                                <button
                                    onClick={resetWorkflow}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300 transform hover:scale-105"
                                >
                                    🔄 Analyze Another Project
                                </button>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </div>
    );
};

// Main App Component with Routing
const App: React.FC = () => {
    const navigate = useNavigate();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

    const handleGetStarted = () => {
        navigate('/analyze');
    };

    const handleLogin = () => {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
    };

    const handleSignup = () => {
        setAuthModalMode('signup');
        setIsAuthModalOpen(true);
    };

    const handleNavigation = (page: string) => {
        const routes: { [key: string]: string } = {
            'landing': '/',
            'dashboard': '/analyze',
            'docs': '/docs',
            'pricing': '/pricing',
            'about': '/about'
        };
        navigate(routes[page] || '/');
    };

    return (
        <ThemeProvider>
            <OnboardingTour />
            <Routes>
                {/* Home/Landing Page */}
                <Route
                    path="/"
                    element={
                        <EnhancedLandingPage
                            onGetStarted={handleGetStarted}
                            onLogin={handleLogin}
                            onNavigate={handleNavigation}
                        />
                    }
                />

                {/* Analysis/Dashboard Page */}
                <Route path="/analyze" element={<AnalysisPage onLogin={handleLogin} />} />

                {/* Graph Viewer Page */}
                <Route path="/graph-viewer" element={<GraphViewerPage />} />

                {/* Documentation Page */}
                <Route path="/docs" element={<DocumentationPage />} />

                {/* Pricing Page */}
                <Route path="/pricing" element={<PricingPage />} />

                {/* About Page */}
                <Route path="/about" element={<AboutPage />} />

                {/* Redirect any unknown routes to home */}
                <Route
                    path="*"
                    element={
                        <EnhancedLandingPage
                            onGetStarted={handleGetStarted}
                            onLogin={handleLogin}
                            onNavigate={handleNavigation}
                        />
                    }
                />
            </Routes>

            {/* Authentication Modal Manager */}
            <AuthManager
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
                onSuccess={() => {
                    setIsAuthModalOpen(false);
                    // Optionally navigate to dashboard after successful login
                    // navigate('/analyze');
                }}
            />
        </ThemeProvider>
    );
};

export default App;
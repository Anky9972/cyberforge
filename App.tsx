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
import { NavHeader } from './components/NavHeader';
import { AuthManager } from './components/auth/AuthManager';
import { useFuzzingWorkflow } from './hooks/useFuzzingWorkflow';

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
        resetWorkflow
    } = useFuzzingWorkflow();

    const handleFileUpload = (file: File) => {
        startFuzzing(file);
    };

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
                        <WorkflowStepper steps={steps} currentStepIndex={currentStepIndex} />
                    </section>

                    {agentLogs.length === 0 && !report && (
                        <section className="max-w-3xl mx-auto animate-fade-in">
                            <FileUpload onFileUpload={handleFileUpload} disabled={isProcessing} />
                        </section>
                    )}

                    {error && (
                        <section className="max-w-3xl mx-auto bg-red-900 border border-red-700 p-4 rounded-lg text-red-200">
                            <h2 className="font-bold mb-2">⚠️ Analysis Error</h2>
                            <p className="mb-3">{error}</p>
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
                            <button
                                onClick={resetWorkflow}
                                className="mt-3 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300"
                            >
                                Try Again
                            </button>
                        </section>
                    )}

                    {agentLogs.length > 0 && (
                        <section className="grid gap-8 md:grid-cols-2">
                            {agentLogs.map((log, index) => (
                                <AgentCard key={index} agentName={log.agentName} icon={log.icon} isLoading={log.isLoading}>
                                    {log.content}
                                </AgentCard>
                            ))}
                        </section>
                    )}
                    
                    {report && (
                        <section className="max-w-4xl mx-auto col-span-1 md:col-span-2">
                            <VulnerabilityReport report={report} />
                             <div className="mt-8 text-center">
                                <button
                                    onClick={resetWorkflow}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
                                >
                                    Analyze Another Project
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
        <>
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
        </>
    );
};

export default App;
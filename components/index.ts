/**
 * Dashboard Components Index
 * Centralized exports for all security analysis dashboards
 */

// Main Analysis Dashboards
export { default as EnhancedVulnerabilityReport } from './EnhancedVulnerabilityReport';
export { default as CrashDedupDashboard } from './CrashDedupDashboard';
export { default as CorpusManagerDashboard } from './CorpusManagerDashboard';
export { default as TestExporterDashboard } from './TestExporterDashboard';
export { default as APIReplayerDashboard } from './APIReplayerDashboard';
export { default as SARIFViewerDashboard } from './SARIFViewerDashboard';
export { default as LiveFuzzingDashboard } from './LiveFuzzingDashboard';

// Legacy/Alternative Dashboards
export { default as MetricsDashboard } from './MetricsDashboard';
export { default as EnhancedFuzzingDashboard } from './EnhancedFuzzingDashboard';
export { default as AnalysisHistoryDashboard } from './AnalysisHistoryDashboard';

// Utility Components
export { default as CodeBlock } from './CodeBlock';
export { default as CKGVisualizer } from './CKGVisualizer';
export { default as FileUpload } from './FileUpload';
export { default as VulnerabilityReport } from './VulnerabilityReport';
export { default as WorkflowStepper } from './WorkflowStepper';
export { default as LoadingScreen } from './LoadingScreen';

// Page Components
export { default as EnhancedLandingPage } from './EnhancedLandingPage';
export { default as LandingPage } from './LandingPage';
export { DocumentationPage } from './DocumentationPage';
export { PricingPage } from './PricingPage';
export { AboutPage } from './AboutPage';
export { NavHeader } from './NavHeader';

// Authentication
export { AuthManager } from './auth/AuthManager';
export { LoginModal } from './auth/LoginModal';
export { SignupModal } from './auth/SignupModal';
export { ForgotPasswordModal } from './auth/ForgotPasswordModal';

// Icons
export * from './icons';

// Type exports
export type { CrashCluster } from './CrashDedupDashboard';
export type { Seed } from './CorpusManagerDashboard';
export type { TestCase, GeneratedTest } from './TestExporterDashboard';
export type { HTTPRequest, HTTPResponse, ReplaySession, MutationResult } from './APIReplayerDashboard';
export type { SARIFResult, SARIFReport } from './SARIFViewerDashboard';
export type { FuzzingMetrics, LiveCrash } from './LiveFuzzingDashboard';

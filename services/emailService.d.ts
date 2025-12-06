interface VulnerabilityData {
    critical: number;
    high: number;
    medium: number;
    low: number;
    totalIssues: number;
    topVulnerabilities?: Array<{
        type: string;
        severity: string;
        count: number;
    }>;
}
export declare class EmailService {
    private transporter;
    private genAI;
    private fromEmail;
    private fromName;
    constructor();
    /**
     * Generate AI-powered personalized email content
     */
    private generateAIContent;
    /**
     * Send email
     */
    private sendEmail;
    /**
     * Send Welcome Email
     */
    sendWelcomeEmail(email: string, name: string, verificationToken?: string): Promise<void>;
    /**
     * Send Email Verification
     */
    sendVerificationEmail(email: string, token: string): Promise<void>;
    /**
     * Send Password Reset Email
     */
    sendPasswordResetEmail(email: string, token: string, name: string): Promise<void>;
    /**
     * Send Analysis Complete Email with AI insights
     */
    sendAnalysisCompleteEmail(email: string, name: string, vulnerabilityData: VulnerabilityData, reportLink: string): Promise<void>;
    /**
     * Send Critical Vulnerability Alert
     */
    sendCriticalVulnerabilityAlert(email: string, name: string, vulnerabilityData: VulnerabilityData): Promise<void>;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=emailService.d.ts.map
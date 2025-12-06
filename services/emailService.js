// Email Service with AI-Powered Dynamic Content
import nodemailer from 'nodemailer';
// @ts-ignore - GoogleGenerativeAI types may vary
import { GoogleGenerativeAI } from '@google/generative-ai';
export class EmailService {
    transporter;
    genAI = null;
    fromEmail;
    fromName;
    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@cyberforge.dev';
        this.fromName = process.env.FROM_NAME || 'CyberForge Security';
        // Configure email transporter
        const emailEnabled = process.env.EMAIL_ENABLED !== 'false';
        const smtpUser = process.env.SMTP_USERNAME;
        const smtpPass = process.env.SMTP_PASSWORD;
        if (!emailEnabled) {
            console.info('Email disabled via configuration; emails will not be sent.');
            this.transporter = null;
        }
        else if (!smtpUser || !smtpPass) {
            console.warn('SMTP credentials are missing; emails will be skipped.');
            this.transporter = null;
        }
        else {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
        }
        // Initialize Gemini AI for dynamic content
        if (process.env.GEMINI_API_KEY) {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }
    }
    /**
     * Generate AI-powered personalized email content
     */
    async generateAIContent(type, data) {
        if (!this.genAI) {
            return ''; // Fallback to static content
        }
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            let prompt = '';
            if (type === 'welcome') {
                prompt = `Create a warm, professional welcome message (2-3 sentences) for a new user named ${data.name} who just signed up for FuzzForge, an AI-powered security vulnerability detection platform. Keep it encouraging and mention they can start analyzing code immediately.`;
            }
            else if (type === 'vulnerability-alert') {
                prompt = `Create a brief, professional security alert (2-3 sentences) about critical vulnerabilities found. Stats: ${data.critical} critical, ${data.high} high severity issues in their codebase. Tone: urgent but reassuring, mention immediate action recommended.`;
            }
            else if (type === 'analysis-complete') {
                prompt = `Create a friendly completion message (2-3 sentences) for a security analysis that found ${data.totalIssues} total issues across ${data.filesScanned} files. Tone: professional, informative, encouraging to review the report.`;
            }
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        }
        catch (error) {
            console.error('AI content generation failed:', error);
            return ''; // Fallback to static
        }
    }
    /**
     * Send email
     */
    async sendEmail(options) {
        try {
            if (!this.transporter) {
                console.info(`Skipping email to ${options.to} (transporter not configured): ${options.subject}`);
                return;
            }
            await this.transporter.sendMail({
                from: `"${this.fromName}" <${this.fromEmail}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            console.log(`Email sent to ${options.to}: ${options.subject}`);
        }
        catch (error) {
            console.error('Email sending failed:', error);
            // Do not throw to avoid breaking user flows in development; log and continue
            return;
        }
    }
    /**
     * Send Welcome Email
     */
    async sendWelcomeEmail(email, name, verificationToken) {
        const aiMessage = await this.generateAIContent('welcome', { name });
        const verificationLink = verificationToken
            ? `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
            : null;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FuzzForge</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      border-radius: 20px 20px 0 0;
      box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      background: linear-gradient(135deg, #60a5fa 0%, #c7d2fe 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .content {
      background: rgba(30, 30, 45, 0.8);
      backdrop-filter: blur(10px);
      padding: 40px;
      border-radius: 0 0 20px 20px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .ai-message {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 30px 0;
      border-radius: 10px;
      font-style: italic;
      color: #c7d2fe;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin: 20px 0;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(59, 130, 246, 0.6);
    }
    .features {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 30px 0;
    }
    .feature {
      background: rgba(59, 130, 246, 0.05);
      padding: 15px;
      border-radius: 10px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #9ca3af;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️</div>
      <h1>Welcome to FuzzForge</h1>
      <p style="color: #c7d2fe; margin: 10px 0 0 0;">AI-Powered Security Analysis Platform</p>
    </div>
    
    <div class="content">
      <h2 style="color: #60a5fa; margin-top: 0;">Hi ${name}! 👋</h2>
      
      ${aiMessage ? `<div class="ai-message">✨ ${aiMessage}</div>` : `
        <p>Thank you for joining FuzzForge! We're excited to help you secure your codebase with cutting-edge AI-powered vulnerability detection.</p>
      `}
      
      <p>Your account has been successfully created. You now have access to:</p>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">🔍</div>
          <strong>AST Analysis</strong>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">Deep code structure analysis</p>
        </div>
        <div class="feature">
          <div class="feature-icon">⚡</div>
          <strong>AI Fuzzing</strong>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">Intelligent test generation</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🛡️</div>
          <strong>CVE Matching</strong>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">180K+ vulnerability database</p>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <strong>Live Dashboard</strong>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af;">Real-time monitoring</p>
        </div>
      </div>

      ${verificationLink ? `
        <div style="text-align: center; margin: 40px 0;">
          <p style="color: #fbbf24; margin-bottom: 20px;">⚠️ Please verify your email to unlock all features:</p>
          <a href="${verificationLink}" class="button">Verify Email Address</a>
          <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">This link expires in 24 hours</p>
        </div>
      ` : `
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Start Analyzing Code →</a>
        </div>
      `}

      <div style="background: rgba(59, 130, 246, 0.05); padding: 20px; border-radius: 10px; margin-top: 30px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <p style="margin: 0; font-size: 14px; color: #c7d2fe;">
          <strong>🎯 Quick Tip:</strong> Start with our sample vulnerable projects to see FuzzForge in action!
        </p>
      </div>
    </div>

    <div class="footer">
      <p>Need help? Contact us at <a href="mailto:support@fuzzforge.dev" style="color: #3b82f6;">support@fuzzforge.dev</a></p>
      <p style="margin-top: 10px;">© 2024 FuzzForge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
        await this.sendEmail({
            to: email,
            subject: '🛡️ Welcome to FuzzForge - Your Security Journey Begins!',
            html,
        });
    }
    /**
     * Send Email Verification
     */
    async sendVerificationEmail(email, token) {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .content {
      background: rgba(30, 30, 45, 0.9);
      padding: 40px;
      border-radius: 20px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      text-align: center;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 50px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="icon">📧</div>
      <h1 style="color: #60a5fa; margin: 0 0 20px 0;">Verify Your Email</h1>
      <p style="color: #c7d2fe; font-size: 16px;">Click the button below to verify your email address and activate your FuzzForge account.</p>
      <a href="${verificationLink}" class="button">Verify Email →</a>
      <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">This link expires in 24 hours</p>
      <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
    `;
        await this.sendEmail({
            to: email,
            subject: '📧 Verify Your FuzzForge Email',
            html,
        });
    }
    /**
     * Send Password Reset Email
     */
    async sendPasswordResetEmail(email, token, name) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .content {
      background: rgba(30, 30, 45, 0.9);
      padding: 40px;
      border-radius: 20px;
      border: 1px solid rgba(245, 158, 11, 0.3);
      text-align: center;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 50px;
      background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.4);
    }
    .warning {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 15px;
      border-radius: 10px;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <div class="icon">🔐</div>
      <h1 style="color: #fbbf24; margin: 0 0 20px 0;">Reset Your Password</h1>
      <p style="color: #c7d2fe; font-size: 16px;">Hi ${name}, we received a request to reset your password.</p>
      <a href="${resetLink}" class="button">Reset Password →</a>
      <p style="font-size: 13px; color: #9ca3af; margin-top: 30px;">This link expires in 1 hour</p>
      <div class="warning">
        <p style="margin: 0; font-size: 14px; color: #fbbf24;">
          <strong>⚠️ Security Notice:</strong> If you didn't request this, please ignore this email and your password will remain unchanged.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
        await this.sendEmail({
            to: email,
            subject: '🔐 Reset Your FuzzForge Password',
            html,
        });
    }
    /**
     * Send Analysis Complete Email with AI insights
     */
    async sendAnalysisCompleteEmail(email, name, vulnerabilityData, reportLink) {
        const aiMessage = await this.generateAIContent('analysis-complete', vulnerabilityData);
        const severityColor = (severity) => {
            switch (severity.toLowerCase()) {
                case 'critical': return '#ef4444';
                case 'high': return '#f97316';
                case 'medium': return '#eab308';
                case 'low': return '#3b82f6';
                default: return '#6b7280';
            }
        };
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Analysis Complete</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      border-radius: 20px 20px 0 0;
    }
    .content {
      background: rgba(30, 30, 45, 0.9);
      padding: 40px;
      border-radius: 0 0 20px 20px;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 30px 0;
    }
    .stat {
      background: rgba(59, 130, 246, 0.05);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .button {
      display: inline-block;
      padding: 16px 50px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
      <h1 style="margin: 0; color: white;">Analysis Complete!</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #10b981; margin-top: 0;">Hi ${name}! 👋</h2>
      
      ${aiMessage ? `
        <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%); border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 10px;">
          <p style="margin: 0; color: #c7d2fe; font-style: italic;">✨ ${aiMessage}</p>
        </div>
      ` : ''}

      <p style="color: #c7d2fe;">Your security analysis has been completed. Here's what we found:</p>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-number" style="color: #ef4444;">${vulnerabilityData.critical}</div>
          <div style="color: #9ca3af; font-size: 14px;">Critical</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #f97316;">${vulnerabilityData.high}</div>
          <div style="color: #9ca3af; font-size: 14px;">High</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #eab308;">${vulnerabilityData.medium}</div>
          <div style="color: #9ca3af; font-size: 14px;">Medium</div>
        </div>
        <div class="stat">
          <div class="stat-number" style="color: #3b82f6;">${vulnerabilityData.low}</div>
          <div style="color: #9ca3af; font-size: 14px;">Low</div>
        </div>
      </div>

      ${vulnerabilityData.topVulnerabilities && vulnerabilityData.topVulnerabilities.length > 0 ? `
        <div style="background: rgba(59, 130, 246, 0.05); padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid rgba(59, 130, 246, 0.2);">
          <h3 style="margin: 0 0 15px 0; color: #60a5fa; font-size: 16px;">🎯 Top Vulnerabilities Detected:</h3>
          ${vulnerabilityData.topVulnerabilities.map(vuln => `
            <div style="margin: 10px 0; padding: 10px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border-left: 3px solid ${severityColor(vuln.severity)};">
              <strong style="color: ${severityColor(vuln.severity)};">${vuln.type}</strong>
              <span style="color: #9ca3af; font-size: 13px;"> - ${vuln.count} instances</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${reportLink}" class="button">View Full Report →</a>
      </div>

      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 15px; border-radius: 10px; margin-top: 30px;">
        <p style="margin: 0; font-size: 14px; color: #fca5a5;">
          <strong>⚠️ Action Required:</strong> ${vulnerabilityData.critical > 0 ? 'Critical vulnerabilities need immediate attention!' : 'Review and fix identified issues to secure your codebase.'}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
        await this.sendEmail({
            to: email,
            subject: `🛡️ Security Analysis Complete - ${vulnerabilityData.totalIssues} Issues Found`,
            html,
        });
    }
    /**
     * Send Critical Vulnerability Alert
     */
    async sendCriticalVulnerabilityAlert(email, name, vulnerabilityData) {
        const aiMessage = await this.generateAIContent('vulnerability-alert', vulnerabilityData);
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Critical Security Alert</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      border-radius: 20px 20px 0 0;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 30px rgba(239, 68, 68, 0.5); }
      50% { box-shadow: 0 0 50px rgba(239, 68, 68, 0.8); }
    }
    .content {
      background: rgba(30, 30, 45, 0.9);
      padding: 40px;
      border-radius: 0 0 20px 20px;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .button {
      display: inline-block;
      padding: 16px 50px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      text-decoration: none;
      border-radius: 12px;
      font-weight: bold;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="font-size: 48px; margin-bottom: 10px;">🚨</div>
      <h1 style="margin: 0; color: white;">Critical Security Alert</h1>
    </div>
    
    <div class="content">
      <h2 style="color: #ef4444; margin-top: 0;">⚠️ Urgent: ${name}</h2>
      
      ${aiMessage ? `
        <div style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%); border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 10px;">
          <p style="margin: 0; color: #fca5a5; font-style: italic; font-weight: 500;">🚨 ${aiMessage}</p>
        </div>
      ` : ''}

      <p style="color: #fca5a5; font-size: 16px; font-weight: 500;">We've detected critical security vulnerabilities in your recent code analysis:</p>
      
      <div style="background: rgba(239, 68, 68, 0.1); border: 2px solid #ef4444; padding: 30px; border-radius: 15px; margin: 30px 0; text-align: center;">
        <div style="font-size: 64px; font-weight: bold; color: #ef4444; margin-bottom: 10px;">${vulnerabilityData.critical}</div>
        <div style="color: #fca5a5; font-size: 18px; font-weight: 600;">CRITICAL VULNERABILITIES</div>
        <div style="color: #9ca3af; font-size: 14px; margin-top: 15px;">+ ${vulnerabilityData.high} High Severity Issues</div>
      </div>

      <div style="background: rgba(239, 68, 68, 0.05); padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid rgba(239, 68, 68, 0.2);">
        <p style="margin: 0; font-size: 14px; color: #fca5a5;">
          <strong>📋 Recommended Actions:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #c7d2fe; font-size: 14px;">
          <li>Review all critical vulnerabilities immediately</li>
          <li>Prioritize patches for high-severity issues</li>
          <li>Consider rolling back recent changes if necessary</li>
          <li>Run follow-up scans after fixes</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Details Now →</a>
      </div>
    </div>
  </div>
</body>
</html>
    `;
        await this.sendEmail({
            to: email,
            subject: '🚨 URGENT: Critical Security Vulnerabilities Detected',
            html,
        });
    }
}
export const emailService = new EmailService();
//# sourceMappingURL=emailService.js.map
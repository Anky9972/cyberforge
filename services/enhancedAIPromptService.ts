/**
 * Enhanced AI Prompt Service
 * Context-aware prompts with severity assignment and explanation styles
 */

export type ExplanationStyle = 'junior' | 'senior' | 'security-engineer';
export type VulnerabilitySeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';

export interface VulnerabilityContext {
  code: string;
  surroundingCode?: string;
  fileName: string;
  lineNumber: number;
  language: string;
  framework?: string;
  projectType?: string;
}

export interface AIAnalysisRequest {
  context: VulnerabilityContext;
  explanationStyle?: ExplanationStyle;
  includeFixSuggestion?: boolean;
  includeCWEMapping?: boolean;
  includeOWASPCategory?: boolean;
}

export interface AIAnalysisResponse {
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  confidence: number; // 0-100
  category: string;
  cweId?: string;
  owaspCategory?: string;
  exploitability?: 'Confirmed' | 'Likely' | 'Possible' | 'Needs Review';
  impact: string;
  fixSuggestion?: string;
  codeExample?: string;
  references?: string[];
}

export class EnhancedAIPromptService {
  /**
   * Generate context-aware prompt for vulnerability analysis
   */
  generateVulnerabilityAnalysisPrompt(request: AIAnalysisRequest): string {
    const { context, explanationStyle = 'senior', includeFixSuggestion = true } = request;

    const styleInstructions = this.getStyleInstructions(explanationStyle);
    const contextSection = this.buildContextSection(context);
    const outputFormat = this.buildOutputFormat(request);

    return `You are a senior security analyst and code reviewer analyzing potential security vulnerabilities.

${styleInstructions}

## Code Context

${contextSection}

## Analysis Requirements

1. **Identify the Security Issue**: Determine if this code contains a security vulnerability
2. **Assess Severity**: Rate as Critical/High/Medium/Low based on:
   - Exploitability (how easy to exploit)
   - Impact (data exposure, system compromise, etc.)
   - Scope (local vs remote, authenticated vs unauthenticated)
3. **Assign Confidence**: Your confidence level (0-100%) this is a real vulnerability
4. **Categorize**: Map to CWE and OWASP Top 10 categories
5. **Determine Exploitability**: Is this Confirmed/Likely/Possible/Needs Review
${includeFixSuggestion ? '6. **Provide Fix**: Give specific, actionable remediation code' : ''}

## Severity Guidelines

- **Critical**: Remote code execution, authentication bypass, SQL injection in critical path
- **High**: XSS, CSRF, privilege escalation, sensitive data exposure
- **Medium**: Information disclosure, weak crypto, missing security headers
- **Low**: Verbose error messages, missing input validation in low-risk areas
- **Info**: Best practice violations, code quality issues

${outputFormat}

Analyze the code now.`;
  }

  /**
   * Generate prompt for grouping similar vulnerabilities
   */
  generateDeduplicationPrompt(vulnerabilities: any[]): string {
    const vulnSummaries = vulnerabilities.map((v, i) => 
      `${i + 1}. [${v.severity}] ${v.title} in ${v.filePath}:${v.lineNumber}`
    ).join('\n');

    return `You are analyzing a list of security vulnerabilities to group similar issues.

## Vulnerabilities

${vulnSummaries}

## Task

Group these vulnerabilities into clusters based on:
1. Root cause (same underlying security flaw)
2. Type/category (SQL injection, XSS, etc.)
3. Fix approach (same remediation strategy)

For each cluster, provide:
- Cluster ID (e.g., "CLUSTER_1")
- Issue IDs in this cluster
- Common root cause
- Suggested priority (Critical/High/Medium/Low)
- Single unified fix description

Respond with JSON array of clusters:

\`\`\`json
[
  {
    "clusterId": "CLUSTER_1",
    "issueIds": [1, 3, 5],
    "rootCause": "SQL Injection via unsanitized user input",
    "priority": "Critical",
    "unifiedFix": "Use parameterized queries for all database operations"
  }
]
\`\`\``;
  }

  /**
   * Generate prompt for "Top N" vulnerability summary
   */
  generateTopIssuesSummaryPrompt(vulnerabilities: any[], topN: number = 5): string {
    const vulnList = vulnerabilities.map((v, i) => 
      `${i + 1}. [${v.severity}] ${v.title} - ${v.description.substring(0, 100)}`
    ).join('\n');

    return `You are a security analyst creating an executive summary.

## All Vulnerabilities (${vulnerabilities.length} total)

${vulnList}

## Task

Identify the TOP ${topN} most critical vulnerabilities that should be fixed first.

Consider:
- Severity (Critical > High > Medium)
- Exploitability (how easy to exploit)
- Business impact
- How many times the issue appears

For each of the top ${topN}, provide:
1. Issue title
2. Why it's critical (brief explanation)
3. Estimated fix effort (Low/Medium/High)
4. Priority order (1 = most urgent)

Respond with JSON array:

\`\`\`json
[
  {
    "priority": 1,
    "title": "SQL Injection in login endpoint",
    "reasoning": "Allows full database access, easy to exploit, affects authentication",
    "fixEffort": "Medium"
  }
]
\`\`\``;
  }

  /**
   * Generate prompt for explaining vulnerability in different styles
   */
  private getStyleInstructions(style: ExplanationStyle): string {
    switch (style) {
      case 'junior':
        return `**Explanation Style**: Explain for a junior developer
- Use simple, clear language
- Explain WHY this is a security issue (not just WHAT)
- Include educational context about the vulnerability type
- Provide step-by-step remediation with code examples
- Link to learning resources`;

      case 'senior':
        return `**Explanation Style**: Explain for a senior developer
- Be concise and technical
- Focus on root cause and impact
- Assume knowledge of common security concepts
- Provide fix with minimal explanation
- Mention relevant standards (OWASP, CWE)`;

      case 'security-engineer':
        return `**Explanation Style**: Explain for a security engineer
- Highly technical and precise
- Include CVE/CWE references
- Discuss attack vectors and exploitation techniques
- Mention defense-in-depth considerations
- Reference security frameworks (OWASP, NIST, etc.)
- Include CVSS scoring rationale`;

      default:
        return '';
    }
  }

  /**
   * Build context section with code and metadata
   */
  private buildContextSection(context: VulnerabilityContext): string {
    let section = `**File**: \`${context.fileName}\`\n`;
    section += `**Line**: ${context.lineNumber}\n`;
    section += `**Language**: ${context.language}\n`;
    
    if (context.framework) {
      section += `**Framework**: ${context.framework}\n`;
    }
    
    if (context.projectType) {
      section += `**Project Type**: ${context.projectType}\n`;
    }

    section += `\n**Vulnerable Code**:\n\`\`\`${context.language}\n${context.code}\n\`\`\`\n`;

    if (context.surroundingCode) {
      section += `\n**Surrounding Context**:\n\`\`\`${context.language}\n${context.surroundingCode}\n\`\`\`\n`;
    }

    return section;
  }

  /**
   * Build output format specification
   */
  private buildOutputFormat(request: AIAnalysisRequest): string {
    const { includeCWEMapping = true, includeOWASPCategory = true, includeFixSuggestion = true } = request;

    let format = `## Output Format

Respond with JSON only (no markdown code blocks):

\`\`\`json
{
  "title": "Brief, clear title of the vulnerability",
  "description": "Detailed explanation of the security issue",
  "severity": "Critical|High|Medium|Low|Info",
  "confidence": 85,
  "category": "SQL Injection|XSS|Authentication|etc.",`;

    if (includeCWEMapping) {
      format += `
  "cweId": "CWE-89",`;
    }

    if (includeOWASPCategory) {
      format += `
  "owaspCategory": "A03:2021 - Injection",`;
    }

    format += `
  "exploitability": "Confirmed|Likely|Possible|Needs Review",
  "impact": "Description of what an attacker could do",`;

    if (includeFixSuggestion) {
      format += `
  "fixSuggestion": "Step-by-step remediation guidance",
  "codeExample": "Fixed version of the code",`;
    }

    format += `
  "references": ["URL1", "URL2"]
}
\`\`\``;

    return format;
  }

  /**
   * Generate prompt for batch severity assessment
   */
  generateBatchSeverityPrompt(issues: any[]): string {
    const issueList = issues.map((issue, i) => {
      return `## Issue ${i + 1}
**Type**: ${issue.type || 'Unknown'}
**File**: ${issue.filePath}:${issue.lineNumber}
**Code**: \`${issue.code?.substring(0, 100)}...\`
**Description**: ${issue.description}
`;
    }).join('\n');

    return `You are a security triage analyst assigning severity levels to multiple issues.

${issueList}

For each issue, assess:
1. **Severity** (Critical/High/Medium/Low/Info)
2. **Exploitability** (Confirmed/Likely/Possible/Needs Review)
3. **Priority Score** (1-100, higher = more urgent)

Respond with JSON array:

\`\`\`json
[
  {
    "issueNumber": 1,
    "severity": "High",
    "exploitability": "Likely",
    "priorityScore": 85,
    "reasoning": "Brief explanation"
  }
]
\`\`\``;
  }

  /**
   * Generate framework-specific analysis prompt
   */
  generateFrameworkSpecificPrompt(framework: string, code: string, fileName: string): string {
    const frameworkGuidance = this.getFrameworkSecurityGuidance(framework);

    return `You are analyzing ${framework} code for security vulnerabilities.

## Framework-Specific Context

${frameworkGuidance}

## Code to Analyze

**File**: ${fileName}

\`\`\`
${code}
\`\`\`

## Task

Identify ${framework}-specific security issues including:
- Misconfigurations
- Missing security middleware
- Framework-specific vulnerabilities
- Best practice violations

Respond with JSON array of issues found.`;
  }

  /**
   * Get framework-specific security guidance
   */
  private getFrameworkSecurityGuidance(framework: string): string {
    const guidance: Record<string, string> = {
      'Express': `- Check for helmet middleware (security headers)
- Verify CORS configuration
- Ensure rate limiting is implemented
- Check session configuration (secure cookies)
- Verify input validation middleware`,

      'Django': `- Check DEBUG setting (must be False in production)
- Verify SECRET_KEY strength
- Check ALLOWED_HOSTS configuration
- Ensure CSRF middleware is enabled
- Verify authentication/authorization decorators`,

      'Spring': `- Check for Spring Security configuration
- Verify CSRF protection is enabled
- Check Actuator endpoint exposure
- Ensure SQL injection prevention (use JPA/parameterized queries)
- Verify authentication configuration`,

      'Laravel': `- Check APP_DEBUG setting
- Verify APP_KEY strength
- Check CSRF middleware
- Verify authentication configuration
- Check for SQL injection (use Eloquent ORM)`,

      'Flask': `- Check debug mode (must be False)
- Verify SECRET_KEY configuration
- Check for CSRF protection
- Verify input validation
- Check session configuration`,

      'Rails': `- Check force_ssl setting
- Verify strong_parameters usage
- Check CSRF protection
- Verify authentication (Devise)
- Check for mass assignment vulnerabilities`
    };

    return guidance[framework] || 'General web framework security best practices apply.';
  }
}

export const enhancedAIPromptService = new EnhancedAIPromptService();

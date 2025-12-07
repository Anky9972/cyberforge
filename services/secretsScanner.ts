/**
 * Secrets Scanner Service
 * Detects hardcoded credentials, API keys, tokens, and other sensitive data
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface SecretMatch {
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  filePath: string;
  lineNumber: number;
  match: string;
  recommendation: string;
}

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  recommendation: string;
}

export class SecretsScanner {
  private patterns: SecretPattern[] = [
    // API Keys
    {
      name: 'Generic API Key',
      pattern: /(?:api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"]([a-zA-Z0-9_\-]{20,})['"]/gi,
      severity: 'High',
      description: 'Hardcoded API key detected',
      recommendation: 'Move API keys to environment variables or secure vault'
    },
    {
      name: 'AWS Access Key',
      pattern: /AKIA[0-9A-Z]{16}/g,
      severity: 'Critical',
      description: 'AWS Access Key ID detected',
      recommendation: 'Rotate AWS credentials immediately and use IAM roles'
    },
    {
      name: 'AWS Secret Key',
      pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*['"]([a-zA-Z0-9/+=]{40})['"]/gi,
      severity: 'Critical',
      description: 'AWS Secret Access Key detected',
      recommendation: 'Rotate AWS credentials immediately'
    },
    {
      name: 'GitHub Token',
      pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
      severity: 'Critical',
      description: 'GitHub Personal Access Token detected',
      recommendation: 'Revoke token and use GitHub Secrets'
    },
    {
      name: 'Google API Key',
      pattern: /AIza[0-9A-Za-z\-_]{35}/g,
      severity: 'High',
      description: 'Google API Key detected',
      recommendation: 'Rotate key and restrict API key usage'
    },
    {
      name: 'Stripe API Key',
      pattern: /(?:sk|pk)_live_[0-9a-zA-Z]{24,}/g,
      severity: 'Critical',
      description: 'Stripe API Key detected',
      recommendation: 'Rotate Stripe keys immediately'
    },
    {
      name: 'Slack Token',
      pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
      severity: 'High',
      description: 'Slack API Token detected',
      recommendation: 'Revoke token and use Slack App credentials properly'
    },
    {
      name: 'SendGrid API Key',
      pattern: /SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}/g,
      severity: 'High',
      description: 'SendGrid API Key detected',
      recommendation: 'Rotate SendGrid API key'
    },
    {
      name: 'Twilio API Key',
      pattern: /SK[a-z0-9]{32}/g,
      severity: 'High',
      description: 'Twilio API Key detected',
      recommendation: 'Rotate Twilio credentials'
    },

    // Database Credentials
    {
      name: 'Database URL',
      pattern: /(?:postgres|mysql|mongodb|redis):\/\/[^\s:]+:[^\s@]+@[^\s\/]+/gi,
      severity: 'Critical',
      description: 'Database connection string with credentials detected',
      recommendation: 'Use environment variables for database URLs'
    },
    {
      name: 'SQL Server Connection',
      pattern: /Server=.*;User Id=.*;Password=.*;/gi,
      severity: 'Critical',
      description: 'SQL Server connection string with credentials',
      recommendation: 'Use Windows Authentication or environment variables'
    },

    // Private Keys
    {
      name: 'RSA Private Key',
      pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
      severity: 'Critical',
      description: 'RSA Private Key detected',
      recommendation: 'Remove private keys from code immediately'
    },
    {
      name: 'SSH Private Key',
      pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
      severity: 'Critical',
      description: 'SSH Private Key detected',
      recommendation: 'Remove private keys from code immediately'
    },
    {
      name: 'PGP Private Key',
      pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/g,
      severity: 'Critical',
      description: 'PGP Private Key detected',
      recommendation: 'Remove private keys from code immediately'
    },

    // JWT Secrets
    {
      name: 'JWT Secret',
      pattern: /(?:jwt[_-]?secret|jwtSecret|JWT_SECRET)\s*[:=]\s*['"]([a-zA-Z0-9_\-+=\/]{20,})['"]/gi,
      severity: 'High',
      description: 'JWT secret key detected',
      recommendation: 'Move JWT secrets to environment variables'
    },

    // Generic Passwords
    {
      name: 'Hardcoded Password',
      pattern: /(?:password|passwd|pwd)\s*[:=]\s*['"](?!.*\$\{|.*process\.env)([^\s'"]{4,})['"]/gi,
      severity: 'High',
      description: 'Hardcoded password detected',
      recommendation: 'Use environment variables or secure vault for passwords'
    },

    // OAuth & Access Tokens
    {
      name: 'OAuth Token',
      pattern: /(?:oauth[_-]?token|access[_-]?token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{20,})['"]/gi,
      severity: 'High',
      description: 'OAuth or Access Token detected',
      recommendation: 'Use secure token storage and refresh mechanisms'
    },

    // Credit Card (PCI Compliance)
    {
      name: 'Credit Card Number',
      pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
      severity: 'Critical',
      description: 'Potential credit card number detected',
      recommendation: 'Never store credit card numbers in code'
    },

    // Encryption Keys
    {
      name: 'Encryption Key',
      pattern: /(?:encryption[_-]?key|encrypt[_-]?key)\s*[:=]\s*['"]([a-zA-Z0-9_\-+=\/]{16,})['"]/gi,
      severity: 'High',
      description: 'Encryption key detected',
      recommendation: 'Use KMS or secure key management system'
    }
  ];

  /**
   * Scan directory for secrets and sensitive data
   */
  async scanDirectory(directoryPath: string): Promise<SecretMatch[]> {
    const secrets: SecretMatch[] = [];
    const files = await this.getAllFiles(directoryPath);

    for (const file of files) {
      try {
        const fileSecrets = await this.scanFile(file);
        secrets.push(...fileSecrets);
      } catch (error) {
        console.error(`Failed to scan ${file}:`, error);
      }
    }

    return secrets;
  }

  /**
   * Scan a single file for secrets
   */
  async scanFile(filePath: string): Promise<SecretMatch[]> {
    const secrets: SecretMatch[] = [];
    
    // Skip binary files and large files
    const stats = await fs.stat(filePath);
    if (stats.size > 10 * 1024 * 1024) { // Skip files > 10MB
      return secrets;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        
        // Skip commented lines (rough heuristic)
        if (this.isCommentedLine(line)) continue;

        for (const pattern of this.patterns) {
          const matches = Array.from(line.matchAll(pattern.pattern));
          
          for (const match of matches) {
            // Verify it's not a placeholder or example
            if (this.isLikelyPlaceholder(match[0])) continue;

            secrets.push({
              type: pattern.name,
              severity: pattern.severity,
              description: pattern.description,
              filePath,
              lineNumber: lineNum + 1,
              match: this.maskSecret(match[0]),
              recommendation: pattern.recommendation
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read as text
    }

    return secrets;
  }

  /**
   * Get all files recursively
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    
    // Skip these directories
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', 'vendor', '.next', 'coverage'];
    // Skip these file types
    const skipExtensions = ['.jpg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !skipDirs.includes(entry.name) && !entry.name.startsWith('.')) {
          const subResults = await this.getAllFiles(fullPath);
          results.push(...subResults);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (!skipExtensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
    
    return results;
  }

  /**
   * Check if line is commented out
   */
  private isCommentedLine(line: string): boolean {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || 
           trimmed.startsWith('#') || 
           trimmed.startsWith('/*') || 
           trimmed.startsWith('*');
  }

  /**
   * Check if match is likely a placeholder/example
   */
  private isLikelyPlaceholder(match: string): boolean {
    const placeholderPatterns = [
      /xxx+/i,
      /example/i,
      /test/i,
      /dummy/i,
      /placeholder/i,
      /your[_-]?key/i,
      /your[_-]?secret/i,
      /change[_-]?me/i,
      /replace[_-]?me/i,
      /\$\{/,  // Template literal
      /process\.env/,  // Environment variable reference
      /\*\*\*\*+/,  // Masked value
      /<.*?>/,  // XML/HTML tag-like placeholder
    ];

    return placeholderPatterns.some(pattern => pattern.test(match));
  }

  /**
   * Mask secret for display (show first/last few chars)
   */
  private maskSecret(secret: string): string {
    if (secret.length <= 10) {
      return '*'.repeat(secret.length);
    }
    
    const visibleChars = 4;
    const start = secret.substring(0, visibleChars);
    const end = secret.substring(secret.length - visibleChars);
    const masked = '*'.repeat(Math.min(secret.length - visibleChars * 2, 20));
    
    return `${start}${masked}${end}`;
  }

  /**
   * Scan configuration files specifically (.env, yaml, json, etc.)
   */
  async scanConfigFiles(directoryPath: string): Promise<SecretMatch[]> {
    const secrets: SecretMatch[] = [];
    const configPatterns = ['.env', '.env.*', 'config.yml', 'config.yaml', 'secrets.yml', 'credentials.json'];
    
    for (const pattern of configPatterns) {
      const files = await this.findConfigFiles(directoryPath, pattern);
      
      for (const file of files) {
        const fileSecrets = await this.scanFile(file);
        secrets.push(...fileSecrets);
      }
    }
    
    return secrets;
  }

  /**
   * Find configuration files
   */
  private async findConfigFiles(dir: string, pattern: string): Promise<string[]> {
    const results: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) {
          const subResults = await this.findConfigFiles(fullPath, pattern);
          results.push(...subResults);
        } else if (entry.isFile() && this.matchesPattern(entry.name, pattern)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Silently skip
    }
    
    return results;
  }

  /**
   * Simple pattern matching
   */
  private matchesPattern(filename: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(filename);
    }
    return filename === pattern;
  }
}

export const secretsScanner = new SecretsScanner();

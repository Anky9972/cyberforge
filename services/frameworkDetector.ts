/**
 * Framework Detector Service
 * Identifies frameworks and their common misconfigurations
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface FrameworkInfo {
  name: string;
  version?: string;
  language: string;
  configFiles: string[];
  detectionConfidence: number; // 0-100
}

export interface FrameworkVulnerability {
  framework: string;
  type: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  filePath: string;
  lineNumber?: number;
  recommendation: string;
}

export class FrameworkDetector {
  /**
   * Detect frameworks in a directory
   */
  async detectFrameworks(directoryPath: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];

    // Check for Node.js frameworks
    const nodeFrameworks = await this.detectNodeFrameworks(directoryPath);
    frameworks.push(...nodeFrameworks);

    // Check for Python frameworks
    const pythonFrameworks = await this.detectPythonFrameworks(directoryPath);
    frameworks.push(...pythonFrameworks);

    // Check for Java frameworks
    const javaFrameworks = await this.detectJavaFrameworks(directoryPath);
    frameworks.push(...javaFrameworks);

    // Check for PHP frameworks
    const phpFrameworks = await this.detectPHPFrameworks(directoryPath);
    frameworks.push(...phpFrameworks);

    // Check for Ruby frameworks
    const rubyFrameworks = await this.detectRubyFrameworks(directoryPath);
    frameworks.push(...rubyFrameworks);

    return frameworks;
  }

  /**
   * Scan for framework-specific vulnerabilities
   */
  async scanFrameworkVulnerabilities(directoryPath: string, frameworks: FrameworkInfo[]): Promise<FrameworkVulnerability[]> {
    const vulnerabilities: FrameworkVulnerability[] = [];

    for (const framework of frameworks) {
      switch (framework.name.toLowerCase()) {
        case 'express':
          vulnerabilities.push(...await this.scanExpressVulnerabilities(directoryPath));
          break;
        case 'django':
          vulnerabilities.push(...await this.scanDjangoVulnerabilities(directoryPath));
          break;
        case 'spring':
        case 'spring boot':
          vulnerabilities.push(...await this.scanSpringVulnerabilities(directoryPath));
          break;
        case 'laravel':
          vulnerabilities.push(...await this.scanLaravelVulnerabilities(directoryPath));
          break;
        case 'flask':
          vulnerabilities.push(...await this.scanFlaskVulnerabilities(directoryPath));
          break;
        case 'rails':
        case 'ruby on rails':
          vulnerabilities.push(...await this.scanRailsVulnerabilities(directoryPath));
          break;
      }
    }

    return vulnerabilities;
  }

  /**
   * Detect Node.js frameworks
   */
  private async detectNodeFrameworks(dir: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    const packageJsonPath = path.join(dir, 'package.json');

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Express
      if (allDeps['express']) {
        frameworks.push({
          name: 'Express',
          version: allDeps['express'],
          language: 'JavaScript',
          configFiles: [packageJsonPath],
          detectionConfidence: 100
        });
      }

      // Next.js
      if (allDeps['next']) {
        frameworks.push({
          name: 'Next.js',
          version: allDeps['next'],
          language: 'JavaScript',
          configFiles: [packageJsonPath],
          detectionConfidence: 100
        });
      }

      // NestJS
      if (allDeps['@nestjs/core']) {
        frameworks.push({
          name: 'NestJS',
          version: allDeps['@nestjs/core'],
          language: 'TypeScript',
          configFiles: [packageJsonPath],
          detectionConfidence: 100
        });
      }

      // Fastify
      if (allDeps['fastify']) {
        frameworks.push({
          name: 'Fastify',
          version: allDeps['fastify'],
          language: 'JavaScript',
          configFiles: [packageJsonPath],
          detectionConfidence: 100
        });
      }
    } catch (error) {
      // No package.json or parse error
    }

    return frameworks;
  }

  /**
   * Detect Python frameworks
   */
  private async detectPythonFrameworks(dir: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    const requirementsPath = path.join(dir, 'requirements.txt');

    try {
      const content = await fs.readFile(requirementsPath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();

        if (trimmed.startsWith('django')) {
          const version = trimmed.match(/[=<>~!]+([0-9.]+)/)?.[1];
          frameworks.push({
            name: 'Django',
            version,
            language: 'Python',
            configFiles: [requirementsPath],
            detectionConfidence: 100
          });
        } else if (trimmed.startsWith('flask')) {
          const version = trimmed.match(/[=<>~!]+([0-9.]+)/)?.[1];
          frameworks.push({
            name: 'Flask',
            version,
            language: 'Python',
            configFiles: [requirementsPath],
            detectionConfidence: 100
          });
        } else if (trimmed.startsWith('fastapi')) {
          const version = trimmed.match(/[=<>~!]+([0-9.]+)/)?.[1];
          frameworks.push({
            name: 'FastAPI',
            version,
            language: 'Python',
            configFiles: [requirementsPath],
            detectionConfidence: 100
          });
        }
      }
    } catch (error) {
      // No requirements.txt
    }

    return frameworks;
  }

  /**
   * Detect Java frameworks
   */
  private async detectJavaFrameworks(dir: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    const pomPath = path.join(dir, 'pom.xml');

    try {
      const content = await fs.readFile(pomPath, 'utf-8');

      if (content.includes('spring-boot')) {
        const versionMatch = content.match(/<spring-boot\.version>(.*?)<\/spring-boot\.version>/);
        frameworks.push({
          name: 'Spring Boot',
          version: versionMatch?.[1],
          language: 'Java',
          configFiles: [pomPath],
          detectionConfidence: 100
        });
      } else if (content.includes('springframework')) {
        frameworks.push({
          name: 'Spring',
          language: 'Java',
          configFiles: [pomPath],
          detectionConfidence: 90
        });
      }
    } catch (error) {
      // No pom.xml
    }

    return frameworks;
  }

  /**
   * Detect PHP frameworks
   */
  private async detectPHPFrameworks(dir: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    const composerPath = path.join(dir, 'composer.json');

    try {
      const content = await fs.readFile(composerPath, 'utf-8');
      const composer = JSON.parse(content);
      const allDeps = { ...composer.require, ...composer['require-dev'] };

      if (allDeps['laravel/framework']) {
        frameworks.push({
          name: 'Laravel',
          version: allDeps['laravel/framework'],
          language: 'PHP',
          configFiles: [composerPath],
          detectionConfidence: 100
        });
      } else if (allDeps['symfony/symfony']) {
        frameworks.push({
          name: 'Symfony',
          version: allDeps['symfony/symfony'],
          language: 'PHP',
          configFiles: [composerPath],
          detectionConfidence: 100
        });
      }
    } catch (error) {
      // No composer.json
    }

    return frameworks;
  }

  /**
   * Detect Ruby frameworks
   */
  private async detectRubyFrameworks(dir: string): Promise<FrameworkInfo[]> {
    const frameworks: FrameworkInfo[] = [];
    const gemfilePath = path.join(dir, 'Gemfile');

    try {
      const content = await fs.readFile(gemfilePath, 'utf-8');

      if (content.includes("gem 'rails'")) {
        const versionMatch = content.match(/gem\s+['"]rails['"]\s*,\s*['"]([^'"]+)['"]/);
        frameworks.push({
          name: 'Ruby on Rails',
          version: versionMatch?.[1],
          language: 'Ruby',
          configFiles: [gemfilePath],
          detectionConfidence: 100
        });
      }
    } catch (error) {
      // No Gemfile
    }

    return frameworks;
  }

  /**
   * Scan for Express.js vulnerabilities
   */
  private async scanExpressVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    
    // Find all JS/TS files
    const files = await this.findFiles(dir, ['.js', '.ts']);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for missing CORS configuration
          if (line.includes('app.use(cors())') && !line.includes('origin:')) {
            vulns.push({
              framework: 'Express',
              type: 'Insecure CORS Configuration',
              severity: 'High',
              description: 'CORS is enabled for all origins without restrictions',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Configure CORS with specific allowed origins: cors({ origin: ["https://yourdomain.com"] })'
            });
          }

          // Check for missing helmet
          if (line.includes('express()') && !content.includes('helmet')) {
            vulns.push({
              framework: 'Express',
              type: 'Missing Security Headers',
              severity: 'Medium',
              description: 'Helmet middleware not detected - security headers may be missing',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Install and use helmet: npm install helmet && app.use(helmet())'
            });
          }

          // Check for missing rate limiting
          if (line.includes('express()') && !content.includes('rate-limit') && !content.includes('rateLimit')) {
            vulns.push({
              framework: 'Express',
              type: 'Missing Rate Limiting',
              severity: 'Medium',
              description: 'No rate limiting detected - vulnerable to DoS attacks',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Install express-rate-limit and apply to routes'
            });
          }

          // Check for weak session configuration
          if (line.includes('express-session') && content.includes('secret:') && !content.includes('secure: true')) {
            vulns.push({
              framework: 'Express',
              type: 'Insecure Session Configuration',
              severity: 'High',
              description: 'Session cookies not marked as secure',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Set secure: true and httpOnly: true in session configuration'
            });
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return vulns;
  }

  /**
   * Scan for Django vulnerabilities
   */
  private async scanDjangoVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    const settingsPath = path.join(dir, 'settings.py');

    try {
      const content = await fs.readFile(settingsPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for DEBUG = True in production
        if (line.includes('DEBUG') && line.includes('True') && !line.trim().startsWith('#')) {
          vulns.push({
            framework: 'Django',
            type: 'Debug Mode Enabled',
            severity: 'Critical',
            description: 'DEBUG is set to True - exposes sensitive information',
            filePath: settingsPath,
            lineNumber: i + 1,
            recommendation: 'Set DEBUG = False in production'
          });
        }

        // Check for weak SECRET_KEY
        if (line.includes('SECRET_KEY') && (line.includes('django-insecure') || line.length < 50)) {
          vulns.push({
            framework: 'Django',
            type: 'Weak Secret Key',
            severity: 'Critical',
            description: 'SECRET_KEY is weak or uses default insecure value',
            filePath: settingsPath,
            lineNumber: i + 1,
            recommendation: 'Generate a strong SECRET_KEY using environment variables'
          });
        }

        // Check for ALLOWED_HOSTS = []
        if (line.includes('ALLOWED_HOSTS') && line.includes('[]')) {
          vulns.push({
            framework: 'Django',
            type: 'Empty ALLOWED_HOSTS',
            severity: 'High',
            description: 'ALLOWED_HOSTS is empty - vulnerable to host header injection',
            filePath: settingsPath,
            lineNumber: i + 1,
            recommendation: 'Configure ALLOWED_HOSTS with your domain names'
          });
        }

        // Check for missing CSRF middleware
        if (line.includes('MIDDLEWARE') && !content.includes('CsrfViewMiddleware')) {
          vulns.push({
            framework: 'Django',
            type: 'Missing CSRF Protection',
            severity: 'Critical',
            description: 'CSRF middleware not enabled',
            filePath: settingsPath,
            lineNumber: i + 1,
            recommendation: 'Enable django.middleware.csrf.CsrfViewMiddleware'
          });
        }
      }
    } catch (error) {
      // No settings.py
    }

    return vulns;
  }

  /**
   * Scan for Spring vulnerabilities
   */
  private async scanSpringVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    const configPaths = [
      path.join(dir, 'application.properties'),
      path.join(dir, 'application.yml'),
      path.join(dir, 'src/main/resources/application.properties'),
      path.join(dir, 'src/main/resources/application.yml')
    ];

    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for actuator exposure
          if (line.includes('management.endpoints.web.exposure.include') && line.includes('*')) {
            vulns.push({
              framework: 'Spring',
              type: 'Actuator Endpoints Exposed',
              severity: 'High',
              description: 'All actuator endpoints are exposed without authentication',
              filePath: configPath,
              lineNumber: i + 1,
              recommendation: 'Limit exposed endpoints and add security'
            });
          }

          // Check for disabled CSRF
          if (line.includes('csrf().disable()')) {
            vulns.push({
              framework: 'Spring',
              type: 'CSRF Protection Disabled',
              severity: 'High',
              description: 'CSRF protection is disabled',
              filePath: configPath,
              lineNumber: i + 1,
              recommendation: 'Enable CSRF protection for state-changing operations'
            });
          }
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }

    return vulns;
  }

  /**
   * Scan for Laravel vulnerabilities
   */
  private async scanLaravelVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    const envPath = path.join(dir, '.env');

    try {
      const content = await fs.readFile(envPath, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for APP_DEBUG=true
        if (line.includes('APP_DEBUG=true')) {
          vulns.push({
            framework: 'Laravel',
            type: 'Debug Mode Enabled',
            severity: 'Critical',
            description: 'APP_DEBUG is enabled - exposes sensitive information',
            filePath: envPath,
            lineNumber: i + 1,
            recommendation: 'Set APP_DEBUG=false in production'
          });
        }

        // Check for default APP_KEY
        if (line.includes('APP_KEY=') && (line.includes('base64:') && line.length < 50)) {
          vulns.push({
            framework: 'Laravel',
            type: 'Weak Application Key',
            severity: 'Critical',
            description: 'APP_KEY appears to be weak or default',
            filePath: envPath,
            lineNumber: i + 1,
            recommendation: 'Generate new key with: php artisan key:generate'
          });
        }
      }
    } catch (error) {
      // No .env file
    }

    return vulns;
  }

  /**
   * Scan for Flask vulnerabilities
   */
  private async scanFlaskVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    const files = await this.findFiles(dir, ['.py']);

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for debug=True
          if (line.includes('app.run') && line.includes('debug=True')) {
            vulns.push({
              framework: 'Flask',
              type: 'Debug Mode Enabled',
              severity: 'Critical',
              description: 'Flask debug mode is enabled - allows code execution',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Set debug=False in production'
            });
          }

          // Check for weak secret key
          if (line.includes('SECRET_KEY') && (line.includes("'secret'") || line.includes('"secret"') || line.length < 40)) {
            vulns.push({
              framework: 'Flask',
              type: 'Weak Secret Key',
              severity: 'High',
              description: 'Flask SECRET_KEY is weak or hardcoded',
              filePath: file,
              lineNumber: i + 1,
              recommendation: 'Use a strong random SECRET_KEY from environment variables'
            });
          }
        }
      } catch (error) {
        // Skip files we can't read
      }
    }

    return vulns;
  }

  /**
   * Scan for Rails vulnerabilities
   */
  private async scanRailsVulnerabilities(dir: string): Promise<FrameworkVulnerability[]> {
    const vulns: FrameworkVulnerability[] = [];
    const configPaths = [
      path.join(dir, 'config/environments/production.rb'),
      path.join(dir, 'config/application.rb')
    ];

    for (const configPath of configPaths) {
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Check for force_ssl = false
          if (line.includes('force_ssl') && line.includes('false')) {
            vulns.push({
              framework: 'Rails',
              type: 'SSL Not Enforced',
              severity: 'High',
              description: 'SSL is not enforced in production',
              filePath: configPath,
              lineNumber: i + 1,
              recommendation: 'Set config.force_ssl = true'
            });
          }

          // Check for consider_all_requests_local = true
          if (line.includes('consider_all_requests_local') && line.includes('true')) {
            vulns.push({
              framework: 'Rails',
              type: 'Detailed Error Pages Enabled',
              severity: 'Medium',
              description: 'Detailed error pages exposed in production',
              filePath: configPath,
              lineNumber: i + 1,
              recommendation: 'Set config.consider_all_requests_local = false'
            });
          }
        }
      } catch (error) {
        // File doesn't exist
      }
    }

    return vulns;
  }

  /**
   * Find files with specific extensions
   */
  private async findFiles(dir: string, extensions: string[]): Promise<string[]> {
    const results: string[] = [];
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'target', 'vendor'];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !skipDirs.includes(entry.name)) {
          const subResults = await this.findFiles(fullPath, extensions);
          results.push(...subResults);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }

    return results;
  }
}

export const frameworkDetector = new FrameworkDetector();

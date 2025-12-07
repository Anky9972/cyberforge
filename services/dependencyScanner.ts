/**
 * Dependency Scanner Service
 * Scans package manifests and checks against vulnerability databases (OSV, GitHub Advisory DB)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface DependencyVulnerability {
  packageName: string;
  version: string;
  vulnerabilityId: string; // CVE or GHSA ID
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
  fixedVersion?: string;
  references: string[];
  manifestFile: string;
}

export interface PackageInfo {
  name: string;
  version: string;
  manifestFile: string;
  manifestType: 'package.json' | 'requirements.txt' | 'pom.xml' | 'go.mod' | 'Cargo.toml' | 'composer.json' | 'Gemfile';
}

export class DependencyScanner {
  private osvApiUrl = 'https://api.osv.dev/v1/query';
  private githubAdvisoryApiUrl = 'https://api.github.com/graphql';

  /**
   * Scan directory for dependency manifests and check for vulnerabilities
   */
  async scanDirectory(directoryPath: string): Promise<DependencyVulnerability[]> {
    const packages: PackageInfo[] = [];
    const vulnerabilities: DependencyVulnerability[] = [];

    // Find all manifest files
    const manifestPatterns = [
      { file: 'package.json', type: 'package.json' as const },
      { file: 'requirements.txt', type: 'requirements.txt' as const },
      { file: 'pom.xml', type: 'pom.xml' as const },
      { file: 'go.mod', type: 'go.mod' as const },
      { file: 'Cargo.toml', type: 'Cargo.toml' as const },
      { file: 'composer.json', type: 'composer.json' as const },
      { file: 'Gemfile', type: 'Gemfile' as const }
    ];

    for (const pattern of manifestPatterns) {
      const manifests = await this.findFiles(directoryPath, pattern.file);
      
      for (const manifestPath of manifests) {
        try {
          const extractedPackages = await this.extractDependencies(manifestPath, pattern.type);
          packages.push(...extractedPackages);
        } catch (error) {
          console.error(`Failed to parse ${manifestPath}:`, error);
        }
      }
    }

    // Check each package for vulnerabilities
    for (const pkg of packages) {
      const vulns = await this.checkPackageVulnerabilities(pkg);
      vulnerabilities.push(...vulns);
    }

    return vulnerabilities;
  }

  /**
   * Find files matching pattern recursively
   */
  private async findFiles(dir: string, filename: string): Promise<string[]> {
    const results: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        // Skip node_modules, .git, etc.
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', 'target', 'vendor'].includes(entry.name)) {
          const subResults = await this.findFiles(fullPath, filename);
          results.push(...subResults);
        } else if (entry.isFile() && entry.name === filename) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      // Silently skip directories we can't read
    }
    
    return results;
  }

  /**
   * Extract dependencies from manifest files
   */
  private async extractDependencies(manifestPath: string, type: PackageInfo['manifestType']): Promise<PackageInfo[]> {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const packages: PackageInfo[] = [];

    switch (type) {
      case 'package.json':
        packages.push(...this.parsePackageJson(content, manifestPath));
        break;
      case 'requirements.txt':
        packages.push(...this.parseRequirementsTxt(content, manifestPath));
        break;
      case 'pom.xml':
        packages.push(...this.parsePomXml(content, manifestPath));
        break;
      case 'go.mod':
        packages.push(...this.parseGoMod(content, manifestPath));
        break;
      case 'Cargo.toml':
        packages.push(...this.parseCargoToml(content, manifestPath));
        break;
      case 'composer.json':
        packages.push(...this.parseComposerJson(content, manifestPath));
        break;
      case 'Gemfile':
        packages.push(...this.parseGemfile(content, manifestPath));
        break;
    }

    return packages;
  }

  /**
   * Parse package.json (Node.js)
   */
  private parsePackageJson(content: string, manifestPath: string): PackageInfo[] {
    try {
      const data = JSON.parse(content);
      const packages: PackageInfo[] = [];
      
      const deps = { ...data.dependencies, ...data.devDependencies };
      
      for (const [name, version] of Object.entries(deps)) {
        packages.push({
          name,
          version: this.cleanVersion(version as string),
          manifestFile: manifestPath,
          manifestType: 'package.json'
        });
      }
      
      return packages;
    } catch (error) {
      console.error('Failed to parse package.json:', error);
      return [];
    }
  }

  /**
   * Parse requirements.txt (Python)
   */
  private parseRequirementsTxt(content: string, manifestPath: string): PackageInfo[] {
    const packages: PackageInfo[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Parse package==version or package>=version
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*([=<>~!]+)\s*([0-9.]+)/);
      
      if (match) {
        packages.push({
          name: match[1],
          version: match[3],
          manifestFile: manifestPath,
          manifestType: 'requirements.txt'
        });
      }
    }
    
    return packages;
  }

  /**
   * Parse pom.xml (Java/Maven)
   */
  private parsePomXml(content: string, manifestPath: string): PackageInfo[] {
    const packages: PackageInfo[] = [];
    
    // Simple regex-based parsing (for production, use proper XML parser)
    const dependencyRegex = /<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?<version>(.*?)<\/version>[\s\S]*?<\/dependency>/g;
    
    let match;
    while ((match = dependencyRegex.exec(content)) !== null) {
      packages.push({
        name: `${match[1]}:${match[2]}`,
        version: match[3],
        manifestFile: manifestPath,
        manifestType: 'pom.xml'
      });
    }
    
    return packages;
  }

  /**
   * Parse go.mod (Go)
   */
  private parseGoMod(content: string, manifestPath: string): PackageInfo[] {
    const packages: PackageInfo[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Match: require module-name v1.2.3
      const match = trimmed.match(/^require\s+([^\s]+)\s+v?([0-9.]+)/);
      
      if (match) {
        packages.push({
          name: match[1],
          version: match[2],
          manifestFile: manifestPath,
          manifestType: 'go.mod'
        });
      }
    }
    
    return packages;
  }

  /**
   * Parse Cargo.toml (Rust)
   */
  private parseCargoToml(content: string, manifestPath: string): PackageInfo[] {
    const packages: PackageInfo[] = [];
    
    // Simple regex for dependencies section
    const depRegex = /\[dependencies\]([\s\S]*?)(?:\[|$)/;
    const match = content.match(depRegex);
    
    if (match) {
      const depsSection = match[1];
      const lines = depsSection.split('\n');
      
      for (const line of lines) {
        const pkgMatch = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
        if (pkgMatch) {
          packages.push({
            name: pkgMatch[1],
            version: pkgMatch[2],
            manifestFile: manifestPath,
            manifestType: 'Cargo.toml'
          });
        }
      }
    }
    
    return packages;
  }

  /**
   * Parse composer.json (PHP)
   */
  private parseComposerJson(content: string, manifestPath: string): PackageInfo[] {
    try {
      const data = JSON.parse(content);
      const packages: PackageInfo[] = [];
      
      const deps = { ...data.require, ...data['require-dev'] };
      
      for (const [name, version] of Object.entries(deps)) {
        if (name !== 'php') { // Skip PHP version requirement
          packages.push({
            name,
            version: this.cleanVersion(version as string),
            manifestFile: manifestPath,
            manifestType: 'composer.json'
          });
        }
      }
      
      return packages;
    } catch (error) {
      console.error('Failed to parse composer.json:', error);
      return [];
    }
  }

  /**
   * Parse Gemfile (Ruby)
   */
  private parseGemfile(content: string, manifestPath: string): PackageInfo[] {
    const packages: PackageInfo[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Match: gem 'name', '~> 1.2.3'
      const match = line.match(/gem\s+['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
      
      if (match) {
        packages.push({
          name: match[1],
          version: this.cleanVersion(match[2]),
          manifestFile: manifestPath,
          manifestType: 'Gemfile'
        });
      }
    }
    
    return packages;
  }

  /**
   * Check package for known vulnerabilities using OSV API
   */
  private async checkPackageVulnerabilities(pkg: PackageInfo): Promise<DependencyVulnerability[]> {
    try {
      const ecosystem = this.getEcosystem(pkg.manifestType);
      
      const response = await fetch(this.osvApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: pkg.version,
          package: {
            name: pkg.name,
            ecosystem
          }
        })
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      if (!data.vulns || data.vulns.length === 0) {
        return [];
      }

      return data.vulns.map((vuln: any) => ({
        packageName: pkg.name,
        version: pkg.version,
        vulnerabilityId: vuln.id,
        severity: this.mapSeverity(vuln.severity),
        title: vuln.summary || `Vulnerability in ${pkg.name}`,
        description: vuln.details || 'No description available',
        fixedVersion: this.extractFixedVersion(vuln),
        references: vuln.references?.map((r: any) => r.url) || [],
        manifestFile: pkg.manifestFile
      }));
    } catch (error) {
      console.error(`Failed to check vulnerabilities for ${pkg.name}:`, error);
      return [];
    }
  }

  /**
   * Map manifest type to OSV ecosystem
   */
  private getEcosystem(manifestType: PackageInfo['manifestType']): string {
    const mapping = {
      'package.json': 'npm',
      'requirements.txt': 'PyPI',
      'pom.xml': 'Maven',
      'go.mod': 'Go',
      'Cargo.toml': 'crates.io',
      'composer.json': 'Packagist',
      'Gemfile': 'RubyGems'
    };
    
    return mapping[manifestType] || 'npm';
  }

  /**
   * Map OSV severity to our severity levels
   */
  private mapSeverity(severity: any): 'Critical' | 'High' | 'Medium' | 'Low' {
    if (!severity || !severity[0]) return 'Medium';
    
    const score = severity[0].score;
    
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    return 'Low';
  }

  /**
   * Extract fixed version from vulnerability data
   */
  private extractFixedVersion(vuln: any): string | undefined {
    if (vuln.affected && vuln.affected[0]?.ranges) {
      const range = vuln.affected[0].ranges[0];
      if (range.events) {
        const fixed = range.events.find((e: any) => e.fixed);
        return fixed?.fixed;
      }
    }
    return undefined;
  }

  /**
   * Clean version string (remove ^, ~, >=, etc.)
   */
  private cleanVersion(version: string): string {
    return version.replace(/^[\^~>=<]+/, '').split(/[\s,]/)[0];
  }
}

export const dependencyScanner = new DependencyScanner();

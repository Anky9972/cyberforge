/**
 * Crash Deduplication & Root-Cause Analysis Service
 * 
 * Features:
 * - Fingerprint crashes by stack-hash + signal + coverage bitmap
 * - Auto-minimize inputs using delta-debugging
 * - Attach cause suspects (tainted vars, mutated fields)
 */

import crypto from 'crypto';

export interface CrashInfo {
  id: string;
  timestamp: Date;
  signal?: string;
  stackTrace: string;
  input: string | Buffer;
  coverageBitmap?: number[];
  errorMessage?: string;
  taintedVars?: string[];
  mutatedFields?: string[];
}

export interface CrashFingerprint {
  hash: string;
  stackHash: string;
  signal: string;
  coverageHash: string;
}

export interface MinimizedCrash {
  original: CrashInfo;
  minimized: {
    input: string | Buffer;
    reductionPercent: number;
    iterations: number;
  };
  rootCause: {
    likelyCause: string;
    suspectVars: string[];
    mutatedFields: string[];
    confidence: number;
  };
}

export interface CrashCluster {
  fingerprint: CrashFingerprint;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  crashes: CrashInfo[];
  representative: CrashInfo; // Minimized representative crash
  severity: 'critical' | 'high' | 'medium' | 'low';
  exploitability?: number; // 0-100 score
}

class CrashDeduplicationService {
  private crashClusters: Map<string, CrashCluster> = new Map();

  /**
   * Generate a unique fingerprint for a crash
   */
  generateFingerprint(crash: CrashInfo): CrashFingerprint {
    // 1. Stack trace hash (normalized)
    const normalizedStack = this.normalizeStackTrace(crash.stackTrace);
    const stackHash = crypto.createHash('sha256').update(normalizedStack).digest('hex').substring(0, 16);

    // 2. Signal/error type
    const signal = crash.signal || this.extractSignalFromStack(crash.stackTrace);

    // 3. Coverage bitmap hash (if available)
    let coverageHash = 'no-coverage';
    if (crash.coverageBitmap && crash.coverageBitmap.length > 0) {
      const coverageStr = crash.coverageBitmap.join(',');
      coverageHash = crypto.createHash('sha256').update(coverageStr).digest('hex').substring(0, 8);
    }

    // Combined fingerprint
    const combined = `${stackHash}-${signal}-${coverageHash}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);

    return {
      hash,
      stackHash,
      signal,
      coverageHash
    };
  }

  /**
   * Normalize stack trace for consistent hashing
   */
  private normalizeStackTrace(stackTrace: string): string {
    return stackTrace
      // Remove memory addresses
      .replace(/0x[0-9a-fA-F]+/g, '0xXXXX')
      // Remove line numbers (keep function names)
      .replace(/:\d+:\d+/g, ':XX:XX')
      // Remove file paths, keep filenames
      .replace(/\/.*\//g, '')
      // Remove timestamps
      .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, 'TIMESTAMP')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract signal/error type from stack trace
   */
  private extractSignalFromStack(stackTrace: string): string {
    // Common error patterns
    const patterns = [
      /SIGSEGV/i,
      /SIGABRT/i,
      /SIGFPE/i,
      /SIGILL/i,
      /TypeError:/i,
      /ReferenceError:/i,
      /RangeError:/i,
      /SyntaxError:/i,
      /Error:/i
    ];

    for (const pattern of patterns) {
      const match = stackTrace.match(pattern);
      if (match) return match[0];
    }

    return 'UNKNOWN';
  }

  /**
   * Add a crash to the deduplication system
   */
  addCrash(crash: CrashInfo): CrashCluster {
    const fingerprint = this.generateFingerprint(crash);
    const existingCluster = this.crashClusters.get(fingerprint.hash);

    if (existingCluster) {
      // Update existing cluster
      existingCluster.count++;
      existingCluster.lastSeen = crash.timestamp;
      existingCluster.crashes.push(crash);

      // Update representative if this crash has shorter input
      if (this.getInputSize(crash.input) < this.getInputSize(existingCluster.representative.input)) {
        existingCluster.representative = crash;
      }

      return existingCluster;
    } else {
      // Create new cluster
      const newCluster: CrashCluster = {
        fingerprint,
        count: 1,
        firstSeen: crash.timestamp,
        lastSeen: crash.timestamp,
        crashes: [crash],
        representative: crash,
        severity: this.calculateSeverity(crash)
      };

      this.crashClusters.set(fingerprint.hash, newCluster);
      return newCluster;
    }
  }

  /**
   * Calculate crash severity based on signal and context
   */
  private calculateSeverity(crash: CrashInfo): 'critical' | 'high' | 'medium' | 'low' {
    const signal = crash.signal || this.extractSignalFromStack(crash.stackTrace);

    // Critical: Memory corruption, arbitrary code execution
    if (/SIGSEGV|SIGILL|heap|buffer overflow|use-after-free/i.test(signal + crash.stackTrace)) {
      return 'critical';
    }

    // High: Logic errors that can be exploited
    if (/SIGABRT|assertion|auth|permission|sql injection/i.test(signal + crash.stackTrace)) {
      return 'high';
    }

    // Medium: Potential security impact
    if (/TypeError|ReferenceError|sanitize|validate/i.test(signal + crash.stackTrace)) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get input size (string or buffer)
   */
  private getInputSize(input: string | Buffer): number {
    return typeof input === 'string' ? input.length : input.length;
  }

  /**
   * Delta-debugging input minimization
   * Finds the smallest input that still triggers the crash
   */
  async minimizeInput(
    crash: CrashInfo,
    testFunction: (input: string | Buffer) => Promise<boolean>
  ): Promise<MinimizedCrash> {
    let current = crash.input;
    let iterations = 0;
    const maxIterations = 100;

    const isBuffer = Buffer.isBuffer(crash.input);

    while (iterations < maxIterations) {
      iterations++;
      const currentSize = this.getInputSize(current);
      
      if (currentSize <= 1) break;

      // Try removing chunks of decreasing size
      const chunkSizes = [Math.floor(currentSize / 2), Math.floor(currentSize / 4), 1];
      let reduced = false;

      for (const chunkSize of chunkSizes) {
        if (chunkSize === 0) continue;

        for (let i = 0; i <= currentSize - chunkSize; i++) {
          // Create candidate by removing chunk
          let candidate: string | Buffer;
          
          if (isBuffer) {
            const buf = current as Buffer;
            candidate = Buffer.concat([buf.slice(0, i), buf.slice(i + chunkSize)]);
          } else {
            const str = current as string;
            candidate = str.slice(0, i) + str.slice(i + chunkSize);
          }

          // Test if crash still occurs
          if (await testFunction(candidate)) {
            current = candidate;
            reduced = true;
            break;
          }
        }

        if (reduced) break;
      }

      if (!reduced) break; // No further reduction possible
    }

    const originalSize = this.getInputSize(crash.input);
    const minimizedSize = this.getInputSize(current);
    const reductionPercent = Math.round(((originalSize - minimizedSize) / originalSize) * 100);

    // Analyze root cause
    const rootCause = this.analyzeRootCause(crash, current);

    return {
      original: crash,
      minimized: {
        input: current,
        reductionPercent,
        iterations
      },
      rootCause
    };
  }

  /**
   * Analyze root cause suspects
   */
  private analyzeRootCause(crash: CrashInfo, minimizedInput: string | Buffer): {
    likelyCause: string;
    suspectVars: string[];
    mutatedFields: string[];
    confidence: number;
  } {
    const stackTrace = crash.stackTrace;
    const inputStr = typeof minimizedInput === 'string' ? minimizedInput : minimizedInput.toString();

    // Extract function names from stack
    const functionPattern = /at\s+(\w+)|(\w+)@|in\s+(\w+)/g;
    const functions: string[] = [];
    let match;
    while ((match = functionPattern.exec(stackTrace)) !== null) {
      const func = match[1] || match[2] || match[3];
      if (func) functions.push(func);
    }

    // Identify suspect variables from taint analysis
    const suspectVars = crash.taintedVars || this.inferTaintedVars(stackTrace, inputStr);

    // Identify mutated fields
    const mutatedFields = crash.mutatedFields || this.inferMutatedFields(inputStr);

    // Determine likely cause
    let likelyCause = 'Unknown crash';
    let confidence = 50;

    if (/null|undefined/i.test(stackTrace)) {
      likelyCause = 'Null pointer dereference or undefined value access';
      confidence = 85;
    } else if (/index|bounds|length/i.test(stackTrace)) {
      likelyCause = 'Array index out of bounds';
      confidence = 90;
    } else if (/parse|json|xml/i.test(stackTrace)) {
      likelyCause = 'Input parsing failure with malformed data';
      confidence = 80;
    } else if (/type|cast|convert/i.test(stackTrace)) {
      likelyCause = 'Type confusion or invalid cast';
      confidence = 75;
    } else if (/overflow|buffer/i.test(stackTrace)) {
      likelyCause = 'Buffer overflow or memory corruption';
      confidence = 95;
    } else if (/auth|permission|access/i.test(stackTrace)) {
      likelyCause = 'Authentication or authorization bypass';
      confidence = 85;
    } else if (functions.length > 0) {
      likelyCause = `Crash in function: ${functions[0]}()`;
      confidence = 60;
    }

    return {
      likelyCause,
      suspectVars,
      mutatedFields,
      confidence
    };
  }

  /**
   * Infer tainted variables from stack trace and input
   */
  private inferTaintedVars(stackTrace: string, input: string): string[] {
    const vars: string[] = [];
    
    // Extract variable names from error messages
    const varPattern = /variable\s+'(\w+)'|'(\w+)'\s+is\s+undefined|cannot\s+read\s+property\s+'(\w+)'/gi;
    let match;
    while ((match = varPattern.exec(stackTrace)) !== null) {
      const varName = match[1] || match[2] || match[3];
      if (varName) vars.push(varName);
    }

    // Check for common tainted variables
    const commonTainted = ['user', 'input', 'data', 'payload', 'request', 'body', 'params', 'query'];
    for (const v of commonTainted) {
      if (stackTrace.toLowerCase().includes(v)) {
        vars.push(v);
      }
    }

    return [...new Set(vars)]; // Deduplicate
  }

  /**
   * Infer mutated fields from minimized input
   */
  private inferMutatedFields(input: string): string[] {
    const fields: string[] = [];

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed === 'object') {
        fields.push(...Object.keys(parsed));
      }
    } catch {
      // Not JSON, try to extract field-like patterns
      const fieldPattern = /["'](\w+)["']\s*:/g;
      let match;
      while ((match = fieldPattern.exec(input)) !== null) {
        fields.push(match[1]);
      }
    }

    return fields;
  }

  /**
   * Get all unique crash clusters
   */
  getClusters(): CrashCluster[] {
    return Array.from(this.crashClusters.values())
      .sort((a, b) => b.count - a.count); // Sort by frequency
  }

  /**
   * Get crash statistics
   */
  getStats() {
    const clusters = this.getClusters();
    const totalCrashes = clusters.reduce((sum, c) => sum + c.count, 0);
    const uniqueCrashes = clusters.length;

    const bySeverity = {
      critical: clusters.filter(c => c.severity === 'critical').length,
      high: clusters.filter(c => c.severity === 'high').length,
      medium: clusters.filter(c => c.severity === 'medium').length,
      low: clusters.filter(c => c.severity === 'low').length
    };

    return {
      totalCrashes,
      uniqueCrashes,
      deduplicationRate: uniqueCrashes > 0 ? Math.round((1 - uniqueCrashes / totalCrashes) * 100) : 0,
      bySeverity,
      clusters: clusters.slice(0, 10) // Top 10 most frequent
    };
  }

  /**
   * Export crash cluster for reporting
   */
  exportCluster(fingerprint: string) {
    const cluster = this.crashClusters.get(fingerprint);
    if (!cluster) return null;

    return {
      fingerprint: cluster.fingerprint,
      count: cluster.count,
      severity: cluster.severity,
      firstSeen: cluster.firstSeen.toISOString(),
      lastSeen: cluster.lastSeen.toISOString(),
      representative: {
        stackTrace: cluster.representative.stackTrace,
        input: cluster.representative.input,
        errorMessage: cluster.representative.errorMessage
      },
      allInputs: cluster.crashes.map(c => c.input)
    };
  }

  /**
   * Clear all clusters (for testing)
   */
  clear() {
    this.crashClusters.clear();
  }
}

// Singleton instance
export const crashDeduplicationService = new CrashDeduplicationService();

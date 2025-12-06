/**
 * Fuzzing Worker Thread
 * Executes fuzzing tasks in parallel
 */

import { parentPort, workerData } from 'worker_threads';

interface FuzzTarget {
  id: string;
  code: string;
  language: string;
  seeds: string[];
  options?: {
    timeout?: number;
    maxIterations?: number;
    coverage?: boolean;
  };
}

let isPaused = false;
const workerId = workerData?.workerId || 0;

/**
 * Simple fuzzing logic (placeholder - enhance with real fuzzing)
 */
async function executeFuzzing(target: FuzzTarget): Promise<any> {
  const startTime = Date.now();
  const crashes: any[] = [];
  const coverage: number[] = [];
  const newSeeds: string[] = [];
  const errors: string[] = [];
  let executionCount = 0;

  const maxIterations = target.options?.maxIterations || 1000;
  const timeout = target.options?.timeout || 5000;

  try {
    for (let i = 0; i < maxIterations; i++) {
      // Check if paused
      while (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        break;
      }

      const seed = target.seeds[i % target.seeds.length];
      
      try {
        // Execute code with mutated input
        const mutatedInput = mutateSeed(seed, i);
        const result = await executeCode(target.code, mutatedInput, target.language);
        
        executionCount++;

        // Check for crashes
        if (result.crashed) {
          crashes.push({
            input: mutatedInput,
            error: result.error,
            stackTrace: result.stackTrace
          });
        }

        // Track coverage
        if (result.coverage && result.coverage.length > 0) {
          for (const block of result.coverage) {
            if (!coverage.includes(block)) {
              coverage.push(block);
              newSeeds.push(mutatedInput);
            }
          }
        }

        // Report progress every 100 iterations
        if (i % 100 === 0 && parentPort) {
          parentPort.postMessage({
            type: 'progress',
            data: {
              iteration: i,
              crashes: crashes.length,
              coverage: coverage.length,
              executionCount
            }
          });
        }
      } catch (error: any) {
        errors.push(error.message);
      }
    }

    return {
      targetId: target.id,
      crashes,
      coverage,
      executionCount,
      duration: Date.now() - startTime,
      newSeeds,
      errors
    };
  } catch (error: any) {
    throw new Error(`Fuzzing failed: ${error.message}`);
  }
}

/**
 * Mutate seed for fuzzing
 */
function mutateSeed(seed: string, iteration: number): string {
  const mutations = [
    // Bit flip
    () => {
      const arr = seed.split('');
      const idx = Math.floor(Math.random() * arr.length);
      arr[idx] = String.fromCharCode(arr[idx].charCodeAt(0) ^ 1);
      return arr.join('');
    },
    // Insert random character
    () => {
      const idx = Math.floor(Math.random() * seed.length);
      const char = String.fromCharCode(Math.floor(Math.random() * 256));
      return seed.slice(0, idx) + char + seed.slice(idx);
    },
    // Delete character
    () => {
      if (seed.length <= 1) return seed;
      const idx = Math.floor(Math.random() * seed.length);
      return seed.slice(0, idx) + seed.slice(idx + 1);
    },
    // Replace with special characters
    () => {
      const special = ['\\0', '\\n', '\\r', '\\t', '<', '>', '&', '"', "'", '%', ';', '|', '`'];
      const idx = Math.floor(Math.random() * seed.length);
      const char = special[Math.floor(Math.random() * special.length)];
      return seed.slice(0, idx) + char + seed.slice(idx + 1);
    },
    // Repeat substring
    () => {
      if (seed.length < 2) return seed;
      const start = Math.floor(Math.random() * (seed.length - 1));
      const end = start + Math.floor(Math.random() * (seed.length - start));
      const substring = seed.slice(start, end);
      return seed + substring;
    }
  ];

  const mutation = mutations[iteration % mutations.length];
  return mutation();
}

/**
 * Execute code with input (simulated)
 */
async function executeCode(
  code: string,
  input: string,
  language: string
): Promise<{
  crashed: boolean;
  error?: string;
  stackTrace?: string;
  coverage?: number[];
}> {
  try {
    // This is a simplified simulation
    // In production, use proper sandboxed execution (Docker, VM, etc.)
    
    // Simulate execution
    const hasVulnerability = detectSimpleVulnerabilities(code, input);
    
    if (hasVulnerability) {
      return {
        crashed: true,
        error: hasVulnerability.type,
        stackTrace: hasVulnerability.details,
        coverage: []
      };
    }

    // Simulate coverage
    const coverage = Array.from(
      { length: Math.floor(Math.random() * 10) },
      (_, i) => i
    );

    return {
      crashed: false,
      coverage
    };
  } catch (error: any) {
    return {
      crashed: true,
      error: error.message,
      stackTrace: error.stack
    };
  }
}

/**
 * Detect simple vulnerabilities (placeholder logic)
 */
function detectSimpleVulnerabilities(
  code: string,
  input: string
): { type: string; details: string } | null {
  // SQL Injection patterns
  if (code.includes('SELECT') && (input.includes("'") || input.includes('OR 1=1'))) {
    return {
      type: 'SQL_INJECTION',
      details: 'Potential SQL injection with input: ' + input
    };
  }

  // Command Injection
  if (code.includes('exec') || code.includes('system')) {
    if (input.includes(';') || input.includes('|') || input.includes('&')) {
      return {
        type: 'COMMAND_INJECTION',
        details: 'Potential command injection with input: ' + input
      };
    }
  }

  // Buffer overflow (length-based)
  if (input.length > 10000) {
    return {
      type: 'BUFFER_OVERFLOW',
      details: 'Input length exceeds safe bounds'
    };
  }

  // XSS patterns
  if (input.includes('<script>') || input.includes('javascript:')) {
    return {
      type: 'XSS',
      details: 'Potential XSS with input: ' + input
    };
  }

  return null;
}

/**
 * Message handler
 */
if (parentPort) {
  parentPort.on('message', async (message) => {
    switch (message.type) {
      case 'fuzz':
        try {
          const result = await executeFuzzing(message.data);
          parentPort!.postMessage({
            type: 'result',
            data: result
          });
        } catch (error: any) {
          parentPort!.postMessage({
            type: 'error',
            error: error.message
          });
        }
        break;

      case 'pause':
        isPaused = true;
        break;

      case 'resume':
        isPaused = false;
        break;
    }
  });
}

console.log(`✅ Fuzzing worker ${workerId} initialized`);

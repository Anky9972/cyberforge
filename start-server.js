#!/usr/bin/env node
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure we're in the server directory
const serverDir = join(__dirname, 'server');
process.chdir(serverDir);

// Start the API server
const apiServer = spawn('node', ['api-enhanced.js'], {
    cwd: serverDir,
    stdio: 'inherit'
});

apiServer.on('error', (err) => {
    console.error('Failed to start API server:', err);
    process.exit(1);
});

apiServer.on('close', (code) => {
    console.log(`API server exited with code ${code}`);
    process.exit(code);
});

console.log('🚀 Starting CyberForge API server...');
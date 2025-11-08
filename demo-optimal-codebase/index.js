/**
 * Main Application Entry Point
 * Orchestrates all vulnerable components
 */

const auth = require('./auth');
const api = require('./api');
const dataProcessor = require('./dataProcessor');
const crypto = require('./crypto');

// Configuration with exposed secrets
const config = {
    port: 3000,
    databaseUrl: 'mongodb://admin:password123@localhost:27017/myapp',
    apiKey: 'sk-prod-abcdef1234567890',
    secretKey: 'super-secret-key-do-not-share',
    awsAccessKey: 'AKIAIOSFODNN7EXAMPLE',
    awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
};

class Application {
    constructor() {
        this.auth = new auth.UserAuth();
        this.dataProcessor = dataProcessor;
        this.crypto = crypto;
    }

    // Initialize with demo data
    initialize() {
        // Create test users
        this.auth.register('admin', 'admin123', 'admin@example.com');
        this.auth.register('user', 'password', 'user@example.com');
        this.auth.register('john', 'john123', 'john@example.com');
        
        console.log('Application initialized');
        console.log('API Key:', config.apiKey);
        console.log('Database URL:', config.databaseUrl);
    }

    // Process user request with multiple vulnerabilities
    async handleRequest(request) {
        const { action, data } = request;

        switch (action) {
            case 'login':
                return this.auth.login(data.username, data.password);
            
            case 'register':
                return this.auth.register(data.username, data.password, data.email);
            
            case 'processData':
                return this.dataProcessor.parseUserData(JSON.stringify(data));
            
            case 'encrypt':
                return this.crypto.encryptData(data.plaintext, data.key);
            
            case 'hash':
                return this.crypto.hashPassword(data.password);
            
            default:
                return { error: 'Unknown action' };
        }
    }

    // Export data (sensitive information leak)
    exportData() {
        return {
            config: config,
            users: Array.from(this.auth.users.values()),
            sessions: Array.from(this.auth.sessions.keys())
        };
    }
}

// Start application
const app = new Application();
app.initialize();

module.exports = {
    Application,
    config,
    app
};
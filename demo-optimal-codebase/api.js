/**
 * API Server - Vulnerable REST API Demo
 * Contains multiple OWASP API Security Top 10 vulnerabilities
 */

const express = require('express');
const { UserAuth } = require('./auth');

const app = express();
const auth = new UserAuth();

// VULNERABILITY 1: No CORS restrictions
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

// VULNERABILITY 2: No rate limiting
app.use(express.json({ limit: '100mb' })); // Excessive payload size

// VULNERABILITY 3: BOLA (Broken Object Level Authorization)
app.get('/api/users/:userId', (req, res) => {
    // No authorization check - API1:2023
    const user = auth.getUserById(req.params.userId);
    if (user) {
        res.json(user); // Exposes all user data including password!
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// VULNERABILITY 4: Broken Authentication - API2:2023
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // No input validation
    // No account lockout mechanism
    // No password complexity requirements
    const result = auth.login(username, password);
    if (result.success) {
        // Session ID in response body (should be in httpOnly cookie)
        res.json({ 
            message: 'Login successful',
            sessionId: result.sessionId,
            user: result.user 
        });
    } else {
        // Information disclosure in error message
        res.status(401).json({ error: 'Invalid username or password' });
    }
});

// VULNERABILITY 5: Broken Object Property Level Authorization - API3:2023
app.put('/api/users/:username', (req, res) => {
    // Allows updating ANY property including 'role' to 'admin'
    const updated = auth.updateUser(req.params.username, req.body);
    if (updated) {
        res.json({ message: 'User updated', user: updated });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// VULNERABILITY 6: Unrestricted Resource Consumption - API4:2023
app.post('/api/upload', (req, res) => {
    // No file size limit check
    // No file type validation
    // No rate limiting
    const { filename, data } = req.body;
    // Would allow DoS attacks
    res.json({ message: 'File uploaded', filename });
});

// VULNERABILITY 7: Broken Function Level Authorization - API5:2023
app.delete('/api/admin/users/:userId', (req, res) => {
    // No admin role check!
    const userId = req.params.userId;
    res.json({ message: `User ${userId} deleted` });
});

app.post('/api/admin/settings', (req, res) => {
    // Anyone can change system settings
    res.json({ message: 'Settings updated', settings: req.body });
});

// VULNERABILITY 8: Server Side Request Forgery - API7:2023
app.post('/api/fetch-url', (req, res) => {
    const { url } = req.body;
    // No URL validation - can access internal services
    // fetch(url).then(r => r.text()).then(data => res.send(data));
    res.json({ message: 'Would fetch: ' + url });
});

// VULNERABILITY 9: Security Misconfiguration - API8:2023
app.get('/api/debug', (req, res) => {
    // Debug endpoint in production!
    res.json({
        environment: process.env,
        config: {
            dbPassword: 'admin123',
            apiKey: 'sk-prod-xyz123'
        },
        stack: new Error().stack
    });
});

// VULNERABILITY 10: Improper Inventory Management - API9:2023
app.get('/v1/api/users', (req, res) => {
    // Old version still accessible
    res.json({ version: 'v1', message: 'Deprecated endpoint' });
});

app.get('/api/internal/metrics', (req, res) => {
    // Undocumented internal API exposed
    res.json({ 
        totalUsers: 1000,
        revenue: 50000,
        serverLoad: 0.75 
    });
});

// VULNERABILITY 11: Unsafe Consumption of APIs - API10:2023
app.post('/api/webhook', (req, res) => {
    // Blindly trusts external data
    const externalData = req.body;
    // No validation of external API response
    res.json({ processed: externalData });
});

// VULNERABILITY 12: Missing input validation (multiple endpoints)
app.post('/api/search', (req, res) => {
    const { query } = req.body;
    // No sanitization - NoSQL injection risk
    // db.users.find({ $where: query })
    res.json({ results: [], query });
});

// VULNERABILITY 13: Sensitive data exposure
app.get('/api/logs', (req, res) => {
    // Exposing application logs
    res.json({
        logs: [
            'User admin logged in from 192.168.1.1',
            'Payment processed: $5000 for user john@email.com',
            'API key accessed: sk-live-abc123',
            'Database query: SELECT * FROM credit_cards'
        ]
    });
});

// VULNERABILITY 14: Mass assignment
app.post('/api/register', (req, res) => {
    // Directly using all request body fields
    const user = auth.register(
        req.body.username,
        req.body.password,
        req.body.email
    );
    // If user sends 'role': 'admin', it would be set
    res.json({ message: 'User registered', user });
});

// VULNERABILITY 15: Insufficient logging
app.post('/api/transfer', (req, res) => {
    const { from, to, amount } = req.body;
    // Critical operation with no logging
    res.json({ message: 'Transfer completed' });
});

// Export for testing
module.exports = app;
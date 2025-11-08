/**
 * Authentication Service - Vulnerable Demo
 * This file contains intentional security vulnerabilities for testing
 */

// VULNERABILITY 1: Hardcoded API Key (Should be detected in Reconnaissance)
const API_KEY = "sk-live-1234567890abcdef1234567890abcdef";
const DB_PASSWORD = "SuperSecret123!";
const JWT_SECRET = "my-super-secret-jwt-key-12345";

// VULNERABILITY 2: Insecure Password Storage
class UserAuth {
    constructor() {
        this.users = new Map();
        this.sessions = new Map();
    }

    // VULNERABILITY 3: No input validation (Fuzz target)
    register(username, password, email) {
        // No sanitization of inputs
        const user = {
            id: Date.now(),
            username: username,
            password: password, // Storing password in plain text!
            email: email,
            role: 'user'
        };
        this.users.set(username, user);
        return user;
    }

    // VULNERABILITY 4: SQL Injection prone (Fuzz target)
    login(username, password) {
        // Simulated SQL injection vulnerability
        const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
        
        const user = this.users.get(username);
        if (user && user.password === password) {
            const sessionId = this.generateSessionId();
            this.sessions.set(sessionId, user);
            return { success: true, sessionId, user };
        }
        return { success: false };
    }

    // VULNERABILITY 5: Weak session ID generation (Fuzz target)
    generateSessionId() {
        // Predictable session ID
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    }

    // VULNERABILITY 6: No rate limiting on auth checks
    checkAuth(sessionId) {
        return this.sessions.has(sessionId);
    }

    // VULNERABILITY 7: IDOR vulnerability
    getUserById(userId) {
        // No authorization check - anyone can access any user data
        for (let user of this.users.values()) {
            if (user.id == userId) {
                return user;
            }
        }
        return null;
    }

    // VULNERABILITY 8: Mass assignment vulnerability
    updateUser(username, updates) {
        const user = this.users.get(username);
        if (user) {
            // Allows updating any field, including 'role'
            Object.assign(user, updates);
            return user;
        }
        return null;
    }
}

// VULNERABILITY 9: Exposed admin endpoint
function adminAccess(sessionId, action) {
    // No proper role check
    if (sessionId && sessionId.startsWith('session_')) {
        return { admin: true, action: action };
    }
    return { admin: false };
}

// VULNERABILITY 10: Insecure token validation (Fuzz target)
function validateToken(token) {
    try {
        // Weak validation logic
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            // No signature verification!
            return payload;
        }
    } catch (e) {
        return null;
    }
    return null;
}

// VULNERABILITY 11: Command injection risk (Fuzz target)
function processUserInput(input) {
    // Dangerous: directly using user input
    const result = eval(`(${input})`);
    return result;
}

// VULNERABILITY 12: XSS vulnerability
function renderUserProfile(userData) {
    // No HTML escaping
    return `<div class="profile">
        <h1>${userData.username}</h1>
        <p>${userData.bio}</p>
        <img src="${userData.avatar}" />
    </div>`;
}

// VULNERABILITY 13: Path traversal risk (Fuzz target)
function loadUserFile(filename) {
    const fs = require('fs');
    try {
        // No path sanitization
        const content = fs.readFileSync(`/uploads/${filename}`, 'utf8');
        return content;
    } catch (e) {
        return null;
    }
}

// VULNERABILITY 14: Race condition in payment processing
class PaymentProcessor {
    constructor() {
        this.balance = 1000;
    }

    // No transaction locking
    async processPayment(amount) {
        if (this.balance >= amount) {
            // Simulated async operation
            await new Promise(resolve => setTimeout(resolve, 10));
            this.balance -= amount;
            return { success: true, newBalance: this.balance };
        }
        return { success: false };
    }
}

// VULNERABILITY 15: Insecure random number generation (Fuzz target)
function generateResetToken() {
    // Weak randomness
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
}

module.exports = {
    UserAuth,
    adminAccess,
    validateToken,
    processUserInput,
    renderUserProfile,
    loadUserFile,
    PaymentProcessor,
    generateResetToken,
    API_KEY,
    DB_PASSWORD
};
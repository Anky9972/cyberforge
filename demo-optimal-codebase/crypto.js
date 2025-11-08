/**
 * Cryptographic Operations - Insecure implementations
 * Multiple cryptographic vulnerabilities
 */

const crypto = require('crypto');

// VULNERABILITY 1: Weak encryption algorithm
function encryptData(plaintext, key) {
    // Using deprecated DES algorithm
    const cipher = crypto.createCipher('des', key);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// VULNERABILITY 2: Weak hash function
function hashPassword(password) {
    // MD5 is cryptographically broken
    return crypto.createHash('md5').update(password).digest('hex');
}

// VULNERABILITY 3: No salt in password hashing
function hashPasswordSimple(password) {
    // SHA1 without salt
    return crypto.createHash('sha1').update(password).digest('hex');
}

// VULNERABILITY 4: Predictable IV (Initialization Vector)
function encryptWithWeakIV(plaintext, key) {
    // Using constant IV (should be random)
    const iv = Buffer.alloc(16, 0);
    const cipher = crypto.createCipheriv('aes-128-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// VULNERABILITY 5: Weak random number generation
function generateToken() {
    // Math.random() is not cryptographically secure
    return Math.random().toString(36).substring(2);
}

// VULNERABILITY 6: Insecure key derivation
function deriveKey(password) {
    // Simple hash as key derivation (should use PBKDF2)
    return crypto.createHash('sha256').update(password).digest('hex').substring(0, 32);
}

// VULNERABILITY 7: ECB mode encryption (deterministic)
function encryptECB(plaintext, key) {
    // ECB mode reveals patterns in plaintext
    const cipher = crypto.createCipher('aes-128-ecb', key);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// VULNERABILITY 8: Insufficient key length
function generateWeakKey() {
    // Only 64 bits (8 bytes) - too short
    return crypto.randomBytes(8).toString('hex');
}

// VULNERABILITY 9: No authentication in encryption (no MAC)
function encryptWithoutMAC(plaintext, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    // No HMAC for authentication
    return encrypted;
}

// VULNERABILITY 10: Time-based comparison (timing attack)
function verifyToken(provided, expected) {
    // Vulnerable to timing attacks
    return provided === expected;
}

// VULNERABILITY 11: Weak JWT implementation
function createJWT(payload) {
    const header = { alg: 'none', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
    // No signature!
    return `${encodedHeader}.${encodedPayload}.`;
}

// VULNERABILITY 12: Hardcoded encryption key
const HARDCODED_KEY = 'my-secret-key-12345678901234567890';

function encryptWithHardcodedKey(data) {
    const cipher = crypto.createCipher('aes-256-cbc', HARDCODED_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// VULNERABILITY 13: Insecure random for crypto operations
function generateSessionToken() {
    // Using Date.now() for randomness
    return crypto.createHash('sha256')
        .update(Date.now().toString())
        .digest('hex');
}

// VULNERABILITY 14: Weak signature verification
function verifySignature(message, signature, publicKey) {
    // Simplified verification (real implementation would be more complex)
    const hash = crypto.createHash('sha256').update(message).digest('hex');
    return hash === signature; // Oversimplified
}

// VULNERABILITY 15: Exposing encryption keys in logs
function debugEncryption(plaintext, key) {
    console.log('Encrypting:', plaintext);
    console.log('Using key:', key); // Never log keys!
    return encryptData(plaintext, key);
}

module.exports = {
    encryptData,
    hashPassword,
    hashPasswordSimple,
    encryptWithWeakIV,
    generateToken,
    deriveKey,
    encryptECB,
    generateWeakKey,
    encryptWithoutMAC,
    verifyToken,
    createJWT,
    encryptWithHardcodedKey,
    generateSessionToken,
    verifySignature,
    debugEncryption,
    HARDCODED_KEY
};
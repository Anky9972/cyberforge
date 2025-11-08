/**
 * Data Processing Service - Complex parsing and validation
 * Perfect for fuzzing with boundary values and injection attacks
 */

// VULNERABILITY 1: JSON parsing without validation (Fuzz target)
function parseUserData(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        // No schema validation
        return data;
    } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
    }
}

// VULNERABILITY 2: XML parsing (XXE vulnerability)
function parseXMLConfig(xmlString) {
    // Simulated XML parsing - vulnerable to XXE
    if (xmlString.includes('<!ENTITY')) {
        return { warning: 'Entity detected' };
    }
    return { parsed: true };
}

// VULNERABILITY 3: Buffer overflow risk (Fuzz target)
function processBuffer(input) {
    // Fixed-size buffer
    const buffer = Buffer.alloc(256);
    if (typeof input === 'string') {
        // No length check!
        buffer.write(input, 0);
    }
    return buffer.toString('utf8');
}

// VULNERABILITY 4: Integer overflow (Fuzz target)
function calculateTotal(quantity, price) {
    // No overflow check
    const total = quantity * price;
    if (total > Number.MAX_SAFE_INTEGER) {
        return Number.MAX_SAFE_INTEGER;
    }
    return total;
}

// VULNERABILITY 5: Array index out of bounds (Fuzz target)
function getArrayElement(array, index) {
    // No bounds checking
    return array[index];
}

// VULNERABILITY 6: Regex DoS (ReDoS) vulnerability (Fuzz target)
function validateEmail(email) {
    // Catastrophic backtracking regex
    const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return emailRegex.test(email);
}

// VULNERABILITY 7: Type confusion (Fuzz target)
function processPayment(amount) {
    // No type checking
    if (amount > 0) {
        return { success: true, charged: amount };
    }
    return { success: false };
}

// VULNERABILITY 8: Division by zero (Fuzz target)
function calculateAverage(total, count) {
    // No zero check
    return total / count;
}

// VULNERABILITY 9: Null pointer dereference (Fuzz target)
function getUserName(user) {
    // No null check
    return user.profile.name.toUpperCase();
}

// VULNERABILITY 10: String injection (Fuzz target)
function buildQuery(tableName, condition) {
    // No sanitization
    return `SELECT * FROM ${tableName} WHERE ${condition}`;
}

// VULNERABILITY 11: Path traversal in file operations (Fuzz target)
function readConfigFile(filename) {
    const path = require('path');
    // Insufficient sanitization
    const sanitized = filename.replace(/\\/g, '/');
    return `/config/${sanitized}`;
}

// VULNERABILITY 12: Prototype pollution (Fuzz target)
function mergeObjects(target, source) {
    for (let key in source) {
        // No prototype check
        target[key] = source[key];
    }
    return target;
}

// VULNERABILITY 13: Command injection in system calls (Fuzz target)
function execCommand(userInput) {
    // Simulated command execution
    const command = `process.sh ${userInput}`;
    return { command, executed: true };
}

// VULNERABILITY 14: LDAP injection (Fuzz target)
function ldapQuery(username) {
    // No escaping
    return `(&(objectClass=user)(uid=${username}))`;
}

// VULNERABILITY 15: XPath injection (Fuzz target)
function xpathQuery(searchTerm) {
    // No sanitization
    return `//users/user[username/text()='${searchTerm}']`;
}

// VULNERABILITY 16: Insecure deserialization (Fuzz target)
function deserializeData(serialized) {
    try {
        // Dangerous: executing arbitrary code
        return eval('(' + serialized + ')');
    } catch (e) {
        return null;
    }
}

// VULNERABILITY 17: Format string vulnerability (Fuzz target)
function formatString(template, ...args) {
    // No validation of format specifiers
    return template.replace(/%s/g, () => args.shift());
}

// VULNERABILITY 18: Memory exhaustion (Fuzz target)
function allocateMemory(size) {
    // No size limit
    const array = new Array(size);
    for (let i = 0; i < size; i++) {
        array[i] = { data: 'x'.repeat(1000) };
    }
    return array.length;
}

// VULNERABILITY 19: Infinite loop risk (Fuzz target)
function processLoop(iterations) {
    // No upper bound check
    let result = 0;
    for (let i = 0; i < iterations; i++) {
        result += i;
    }
    return result;
}

// VULNERABILITY 20: Stack overflow recursion (Fuzz target)
function factorial(n) {
    // No base case guard for negative numbers
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Complex nested object processing (Fuzz target)
function processNestedData(data) {
    if (typeof data === 'object' && data !== null) {
        for (let key in data) {
            if (typeof data[key] === 'object') {
                processNestedData(data[key]);
            }
        }
    }
    return data;
}

// Export all vulnerable functions for testing
module.exports = {
    parseUserData,
    parseXMLConfig,
    processBuffer,
    calculateTotal,
    getArrayElement,
    validateEmail,
    processPayment,
    calculateAverage,
    getUserName,
    buildQuery,
    readConfigFile,
    mergeObjects,
    execCommand,
    ldapQuery,
    xpathQuery,
    deserializeData,
    formatString,
    allocateMemory,
    processLoop,
    factorial,
    processNestedData
};
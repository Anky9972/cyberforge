/**
 * Grammar-Aware Fuzzing Engine
 * Generates structure-aware test inputs for APIs and data formats
 */

interface GrammarRule {
    type: string;
    pattern: string;
    constraints?: any;
}

interface FuzzInput {
    format: string;
    data: any;
    mutationType: string;
    expectedBehavior: 'crash' | 'exception' | 'timeout' | 'valid';
}

export class GrammarAwareFuzzer {
    /**
     * JSON Grammar Fuzzing
     */
    static fuzzJSON(schema?: any): FuzzInput[] {
        const mutations: FuzzInput[] = [];

        // 1. Deeply nested objects (stack overflow)
        mutations.push({
            format: 'json',
            data: this.generateDeeplyNested(100),
            mutationType: 'deep_nesting',
            expectedBehavior: 'crash'
        });

        // 2. Circular references
        const circular: any = { a: 1 };
        circular.self = circular;
        mutations.push({
            format: 'json',
            data: circular,
            mutationType: 'circular_reference',
            expectedBehavior: 'exception'
        });

        // 3. Large arrays (memory exhaustion)
        mutations.push({
            format: 'json',
            data: { items: new Array(1000000).fill('x') },
            mutationType: 'large_array',
            expectedBehavior: 'timeout'
        });

        // 4. Unicode edge cases
        mutations.push({
            format: 'json',
            data: { text: '\u0000\uFFFF\uD800\uDFFF' },
            mutationType: 'unicode_edge_cases',
            expectedBehavior: 'exception'
        });

        // 5. Type confusion
        mutations.push({
            format: 'json',
            data: { number: 'not_a_number', bool: 'not_a_bool' },
            mutationType: 'type_confusion',
            expectedBehavior: 'exception'
        });

        // 6. Injection payloads in strings
        const injectionPayloads = [
            '{"username": "<script>alert(1)</script>"}',
            '{"sql": "1\' OR \'1\'=\'1"}',
            '{"cmd": "; rm -rf /"}',
            '{"path": "../../../etc/passwd"}'
        ];
        injectionPayloads.forEach(payload => {
            mutations.push({
                format: 'json',
                data: JSON.parse(payload),
                mutationType: 'injection_attempt',
                expectedBehavior: 'exception'
            });
        });

        // 7. Extremely long strings (buffer overflow)
        mutations.push({
            format: 'json',
            data: { key: 'A'.repeat(1000000) },
            mutationType: 'long_string',
            expectedBehavior: 'crash'
        });

        // 8. Invalid numbers
        mutations.push({
            format: 'json',
            data: { num: Infinity, neg: -Infinity, nan: NaN },
            mutationType: 'invalid_numbers',
            expectedBehavior: 'exception'
        });

        return mutations;
    }

    /**
     * GraphQL Grammar Fuzzing
     */
    static fuzzGraphQL(): FuzzInput[] {
        const mutations: FuzzInput[] = [];

        // 1. Deeply nested queries (DOS)
        const deepQuery = this.generateDeepGraphQLQuery(50);
        mutations.push({
            format: 'graphql',
            data: deepQuery,
            mutationType: 'deep_nesting',
            expectedBehavior: 'timeout'
        });

        // 2. Circular query fragments
        mutations.push({
            format: 'graphql',
            data: `
                fragment UserFragment on User {
                    friends {
                        ...UserFragment
                    }
                }
                query { user { ...UserFragment } }
            `,
            mutationType: 'circular_fragment',
            expectedBehavior: 'crash'
        });

        // 3. Large batch queries (resource exhaustion)
        const batchQuery = Array(1000).fill('query { user { id name } }').join('\n');
        mutations.push({
            format: 'graphql',
            data: batchQuery,
            mutationType: 'batch_bombing',
            expectedBehavior: 'timeout'
        });

        // 4. Injection in variables
        mutations.push({
            format: 'graphql',
            data: {
                query: 'query($id: ID!) { user(id: $id) { name } }',
                variables: { id: '1; DROP TABLE users--' }
            },
            mutationType: 'sql_injection',
            expectedBehavior: 'exception'
        });

        // 5. Type mismatch
        mutations.push({
            format: 'graphql',
            data: {
                query: 'query($id: Int!) { user(id: $id) { name } }',
                variables: { id: 'not_an_int' }
            },
            mutationType: 'type_confusion',
            expectedBehavior: 'exception'
        });

        return mutations;
    }

    /**
     * XML Grammar Fuzzing
     */
    static fuzzXML(): FuzzInput[] {
        const mutations: FuzzInput[] = [];

        // 1. XXE (External Entity Injection)
        mutations.push({
            format: 'xml',
            data: `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<root>&xxe;</root>`,
            mutationType: 'xxe_attack',
            expectedBehavior: 'exception'
        });

        // 2. Billion Laughs (exponential entity expansion)
        mutations.push({
            format: 'xml',
            data: `<?xml version="1.0"?>
<!DOCTYPE lolz [
  <!ENTITY lol "lol">
  <!ENTITY lol2 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
  <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
]>
<root>&lol3;</root>`,
            mutationType: 'billion_laughs',
            expectedBehavior: 'crash'
        });

        // 3. Deeply nested tags
        let deepXML = '<root>';
        for (let i = 0; i < 10000; i++) {
            deepXML += `<level${i}>`;
        }
        deepXML += 'data';
        for (let i = 9999; i >= 0; i--) {
            deepXML += `</level${i}>`;
        }
        deepXML += '</root>';
        
        mutations.push({
            format: 'xml',
            data: deepXML,
            mutationType: 'deep_nesting',
            expectedBehavior: 'crash'
        });

        // 4. Invalid characters
        mutations.push({
            format: 'xml',
            data: '<root>\u0000\u0008\uFFFF</root>',
            mutationType: 'invalid_chars',
            expectedBehavior: 'exception'
        });

        return mutations;
    }

    /**
     * Protobuf Grammar Fuzzing
     */
    static fuzzProtobuf(): FuzzInput[] {
        const mutations: FuzzInput[] = [];

        // 1. Varint edge cases
        mutations.push({
            format: 'protobuf',
            data: Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x7F]),
            mutationType: 'varint_max',
            expectedBehavior: 'exception'
        });

        // 2. Wrong wire types
        mutations.push({
            format: 'protobuf',
            data: Buffer.from([0x08, 0xFF, 0xFF]), // field 1, wrong wire type
            mutationType: 'wrong_wire_type',
            expectedBehavior: 'exception'
        });

        // 3. Missing required fields
        mutations.push({
            format: 'protobuf',
            data: Buffer.from([0x12, 0x00]), // empty optional field
            mutationType: 'missing_required',
            expectedBehavior: 'exception'
        });

        // 4. Extremely large length prefixes
        mutations.push({
            format: 'protobuf',
            data: Buffer.from([0x0A, 0xFF, 0xFF, 0xFF, 0xFF, 0x0F]),
            mutationType: 'large_length',
            expectedBehavior: 'crash'
        });

        return mutations;
    }

    /**
     * API Endpoint Fuzzing
     */
    static fuzzRESTAPI(endpoint: string, method: string): FuzzInput[] {
        const mutations: FuzzInput[] = [];

        // 1. Header injection
        mutations.push({
            format: 'http',
            data: {
                url: endpoint,
                method,
                headers: {
                    'Host': 'evil.com\r\nX-Injected: true',
                    'X-Forwarded-For': '127.0.0.1, <?php system($_GET["cmd"]); ?>'
                }
            },
            mutationType: 'header_injection',
            expectedBehavior: 'exception'
        });

        // 2. Parameter pollution
        mutations.push({
            format: 'http',
            data: {
                url: `${endpoint}?id=1&id=2&id=3`,
                method: 'GET'
            },
            mutationType: 'param_pollution',
            expectedBehavior: 'exception'
        });

        // 3. Content-Type confusion
        mutations.push({
            format: 'http',
            data: {
                url: endpoint,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '<xml>not json</xml>'
            },
            mutationType: 'content_type_mismatch',
            expectedBehavior: 'exception'
        });

        // 4. Oversized payloads
        mutations.push({
            format: 'http',
            data: {
                url: endpoint,
                method: 'POST',
                body: 'A'.repeat(100 * 1024 * 1024) // 100MB
            },
            mutationType: 'oversized_body',
            expectedBehavior: 'crash'
        });

        return mutations;
    }

    /**
     * Helper: Generate deeply nested structure
     */
    private static generateDeeplyNested(depth: number): any {
        let obj: any = { value: 'end' };
        for (let i = 0; i < depth; i++) {
            obj = { nested: obj };
        }
        return obj;
    }

    /**
     * Helper: Generate deep GraphQL query
     */
    private static generateDeepGraphQLQuery(depth: number): string {
        let query = 'query {';
        for (let i = 0; i < depth; i++) {
            query += ` user { friends {`;
        }
        query += ' id ';
        for (let i = 0; i < depth; i++) {
            query += '}}';
        }
        query += '}';
        return query;
    }

    /**
     * Execute fuzz test and capture results
     */
    static async executeFuzzTest(
        target: Function,
        input: FuzzInput,
        timeout: number = 5000
    ): Promise<{
        crashed: boolean;
        exception?: Error;
        timedOut: boolean;
        duration: number;
    }> {
        const start = Date.now();
        let crashed = false;
        let exception: Error | undefined;
        let timedOut = false;

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), timeout);
            });

            const testPromise = Promise.resolve(target(input.data));

            await Promise.race([testPromise, timeoutPromise]);
        } catch (e) {
            if (e instanceof Error && e.message === 'Timeout') {
                timedOut = true;
            } else {
                exception = e as Error;
                crashed = true;
            }
        }

        return {
            crashed,
            exception,
            timedOut,
            duration: Date.now() - start
        };
    }

    /**
     * Generate comprehensive fuzz suite for a given format
     */
    static generateFuzzSuite(format: 'json' | 'graphql' | 'xml' | 'protobuf' | 'rest'): FuzzInput[] {
        switch (format) {
            case 'json':
                return this.fuzzJSON();
            case 'graphql':
                return this.fuzzGraphQL();
            case 'xml':
                return this.fuzzXML();
            case 'protobuf':
                return this.fuzzProtobuf();
            case 'rest':
                return this.fuzzRESTAPI('/api/endpoint', 'POST');
            default:
                return [];
        }
    }
}

/**
 * Adaptive Fuzzer - learns from successful crashes
 */
export class AdaptiveFuzzer {
    private crashingInputs: FuzzInput[] = [];
    private successfulMutations: string[] = [];

    recordCrash(input: FuzzInput): void {
        this.crashingInputs.push(input);
        this.successfulMutations.push(input.mutationType);
    }

    /**
     * Generate next batch focusing on successful mutation types
     */
    generateAdaptiveBatch(format: string, batchSize: number = 100): FuzzInput[] {
        const baseMutations = GrammarAwareFuzzer.generateFuzzSuite(format as any);
        
        // Prioritize mutation types that found crashes
        const mutationFrequency: Record<string, number> = {};
        this.successfulMutations.forEach(m => {
            mutationFrequency[m] = (mutationFrequency[m] || 0) + 1;
        });

        // Generate more of the successful types
        const adaptiveBatch: FuzzInput[] = [];
        Object.entries(mutationFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .forEach(([mutationType, frequency]) => {
                const template = baseMutations.find(m => m.mutationType === mutationType);
                if (template) {
                    // Generate variations
                    for (let i = 0; i < Math.min(frequency * 2, 20); i++) {
                        adaptiveBatch.push({ ...template, data: this.mutate(template.data) });
                    }
                }
            });

        return adaptiveBatch.slice(0, batchSize);
    }

    private mutate(data: any): any {
        // Simple mutation logic
        if (typeof data === 'string') {
            return data + String.fromCharCode(Math.random() * 256);
        }
        if (typeof data === 'number') {
            return data * (Math.random() * 2);
        }
        if (Array.isArray(data)) {
            return [...data, this.mutate(data[0])];
        }
        if (typeof data === 'object') {
            const mutated = { ...data };
            const keys = Object.keys(mutated);
            if (keys.length > 0) {
                const randomKey = keys[Math.floor(Math.random() * keys.length)];
                mutated[randomKey] = this.mutate(mutated[randomKey]);
            }
            return mutated;
        }
        return data;
    }
}

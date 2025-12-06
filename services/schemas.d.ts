import { z } from 'zod';
export declare const CKGNodeSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<["Function", "Class", "File", "Dependency", "Endpoint"]>;
}, "strip", z.ZodTypeAny, {
    type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
    id: string;
    label: string;
}, {
    type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
    id: string;
    label: string;
}>;
export declare const CKGEdgeSchema: z.ZodObject<{
    source: z.ZodString;
    target: z.ZodString;
}, "strip", z.ZodTypeAny, {
    source: string;
    target: string;
}, {
    source: string;
    target: string;
}>;
export declare const CKGDataSchema: z.ZodObject<{
    summary: z.ZodString;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["Function", "Class", "File", "Dependency", "Endpoint"]>;
    }, "strip", z.ZodTypeAny, {
        type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
        id: string;
        label: string;
    }, {
        type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
        id: string;
        label: string;
    }>, "many">;
    edges: z.ZodArray<z.ZodObject<{
        source: z.ZodString;
        target: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        source: string;
        target: string;
    }, {
        source: string;
        target: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    nodes: {
        type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
        id: string;
        label: string;
    }[];
    edges: {
        source: string;
        target: string;
    }[];
}, {
    summary: string;
    nodes: {
        type: "File" | "Function" | "Class" | "Dependency" | "Endpoint";
        id: string;
        label: string;
    }[];
    edges: {
        source: string;
        target: string;
    }[];
}>;
export declare const ReconFindingSchema: z.ZodObject<{
    category: z.ZodEffects<z.ZodString, string, string>;
    description: z.ZodString;
    recommendation: z.ZodString;
    threatIntelMatch: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | undefined, string | null | undefined>;
}, "strip", z.ZodTypeAny, {
    description: string;
    category: string;
    recommendation: string;
    threatIntelMatch?: string | undefined;
}, {
    description: string;
    category: string;
    recommendation: string;
    threatIntelMatch?: string | null | undefined;
}>;
export declare const ReconResponseSchema: z.ZodObject<{
    findings: z.ZodArray<z.ZodObject<{
        category: z.ZodEffects<z.ZodString, string, string>;
        description: z.ZodString;
        recommendation: z.ZodString;
        threatIntelMatch: z.ZodEffects<z.ZodOptional<z.ZodNullable<z.ZodString>>, string | undefined, string | null | undefined>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        category: string;
        recommendation: string;
        threatIntelMatch?: string | undefined;
    }, {
        description: string;
        category: string;
        recommendation: string;
        threatIntelMatch?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    findings: {
        description: string;
        category: string;
        recommendation: string;
        threatIntelMatch?: string | undefined;
    }[];
}, {
    findings: {
        description: string;
        category: string;
        recommendation: string;
        threatIntelMatch?: string | null | undefined;
    }[];
}>;
export declare const APIFindingSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>, undefined, string | number | undefined>;
    type: z.ZodEffects<z.ZodOptional<z.ZodString>, undefined, string | undefined>;
    file: z.ZodEffects<z.ZodOptional<z.ZodString>, undefined, string | undefined>;
    category: z.ZodEffects<z.ZodOptional<z.ZodString>, string, string | undefined>;
    description: z.ZodString;
    severity: z.ZodEffects<z.ZodString, "Critical" | "High" | "Medium" | "Low", string>;
    recommendation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    category: string;
    recommendation: string;
    type?: undefined;
    id?: undefined;
    file?: undefined;
}, {
    description: string;
    severity: string;
    type?: string | undefined;
    id?: string | number | undefined;
    category?: string | undefined;
    recommendation?: string | undefined;
    file?: string | undefined;
}>;
export declare const APIResponseSchema: z.ZodObject<{
    findings: z.ZodArray<z.ZodObject<{
        id: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>, undefined, string | number | undefined>;
        type: z.ZodEffects<z.ZodOptional<z.ZodString>, undefined, string | undefined>;
        file: z.ZodEffects<z.ZodOptional<z.ZodString>, undefined, string | undefined>;
        category: z.ZodEffects<z.ZodOptional<z.ZodString>, string, string | undefined>;
        description: z.ZodString;
        severity: z.ZodEffects<z.ZodString, "Critical" | "High" | "Medium" | "Low", string>;
        recommendation: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        severity: "Critical" | "High" | "Medium" | "Low";
        category: string;
        recommendation: string;
        type?: undefined;
        id?: undefined;
        file?: undefined;
    }, {
        description: string;
        severity: string;
        type?: string | undefined;
        id?: string | number | undefined;
        category?: string | undefined;
        recommendation?: string | undefined;
        file?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    findings: {
        description: string;
        severity: "Critical" | "High" | "Medium" | "Low";
        category: string;
        recommendation: string;
        type?: undefined;
        id?: undefined;
        file?: undefined;
    }[];
}, {
    findings: {
        description: string;
        severity: string;
        type?: string | undefined;
        id?: string | number | undefined;
        category?: string | undefined;
        recommendation?: string | undefined;
        file?: string | undefined;
    }[];
}>;
export declare const FuzzTargetSchema: z.ZodObject<{
    functionName: z.ZodString;
    reasoning: z.ZodString;
    language: z.ZodEffects<z.ZodEnum<["C", "C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP"]>, "TypeScript" | "C" | "C++" | "Python" | "JavaScript" | "Java" | "Go" | "Rust" | "PHP", unknown>;
}, "strip", z.ZodTypeAny, {
    language: "TypeScript" | "C" | "C++" | "Python" | "JavaScript" | "Java" | "Go" | "Rust" | "PHP";
    functionName: string;
    reasoning: string;
}, {
    functionName: string;
    reasoning: string;
    language?: unknown;
}>;
export declare const FuzzTargetResponseSchema: z.ZodObject<{
    targets: z.ZodArray<z.ZodObject<{
        functionName: z.ZodString;
        reasoning: z.ZodString;
        language: z.ZodEffects<z.ZodEnum<["C", "C++", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "PHP"]>, "TypeScript" | "C" | "C++" | "Python" | "JavaScript" | "Java" | "Go" | "Rust" | "PHP", unknown>;
    }, "strip", z.ZodTypeAny, {
        language: "TypeScript" | "C" | "C++" | "Python" | "JavaScript" | "Java" | "Go" | "Rust" | "PHP";
        functionName: string;
        reasoning: string;
    }, {
        functionName: string;
        reasoning: string;
        language?: unknown;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    targets: {
        language: "TypeScript" | "C" | "C++" | "Python" | "JavaScript" | "Java" | "Go" | "Rust" | "PHP";
        functionName: string;
        reasoning: string;
    }[];
}, {
    targets: {
        functionName: string;
        reasoning: string;
        language?: unknown;
    }[];
}>;
export declare const VulnerabilityReportSchema: z.ZodObject<{
    vulnerabilityTitle: z.ZodString;
    cveId: z.ZodString;
    severity: z.ZodEnum<["Critical", "High", "Medium", "Low", "Informational"]>;
    description: z.ZodString;
    vulnerableCode: z.ZodString;
    language: z.ZodString;
    mitigation: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    language: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
    cveId: string;
    vulnerableCode: string;
    mitigation: string;
    vulnerabilityTitle: string;
}, {
    description: string;
    language: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
    cveId: string;
    vulnerableCode: string;
    mitigation: string;
    vulnerabilityTitle: string;
}>;
export declare const ZIP_MAX_SIZE: number;
export declare const ALLOWED_EXTENSIONS: string[];
export declare function validateZipPath(path: string): boolean;
export declare const PII_PATTERNS: {
    name: string;
    pattern: RegExp;
}[];
export declare function detectPII(content: string): {
    found: boolean;
    matches: string[];
};
//# sourceMappingURL=schemas.d.ts.map
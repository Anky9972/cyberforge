export interface ZipAnalysis {
    fileName: string;
    totalFiles: number;
    cppFiles: number;
    headerFiles: number;
    fileList: string[];
    codeSnippets: Array<{
        path: string;
        content: string;
    }>;
    summary: string;
}
export declare function parseZipFile(file: File): Promise<string>;
/**
 * NEW: Enhanced parser that returns BOTH summary AND actual code files
 * Enables AST analysis instead of LLM guessing
 */
export interface ParsedCodebase {
    summary: string;
    codeFiles: Map<string, {
        code: string;
        language: string;
        filename: string;
    }>;
}
export declare function parseZipFileWithCode(file: File): Promise<ParsedCodebase>;
export declare function createSampleZipBlob(sampleName: string): Promise<Blob>;
//# sourceMappingURL=zipParser.d.ts.map
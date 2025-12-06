export interface DocSection {
    id: string;
    title: string;
    description: string;
    icon: string;
    items: DocItem[];
}
export interface DocItem {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    lastUpdated: string;
    readTime: string;
    code?: CodeExample[];
    relatedDocs?: string[];
}
export interface CodeExample {
    language: string;
    code: string;
    title?: string;
}
export declare class DocumentationService {
    private static instance;
    private constructor();
    static getInstance(): DocumentationService;
    getDocSections(): DocSection[];
    searchDocs(query: string): DocItem[];
    getDocById(id: string): DocItem | undefined;
    getRelatedDocs(docId: string): DocItem[];
}
export declare const documentationService: DocumentationService;
//# sourceMappingURL=documentationService.d.ts.map
export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface AIResponse {
    content: string;
    provider: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface AIConfig {
    provider: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
    responseFormat?: 'text' | 'json';
}
declare class AIProviderService {
    private primaryProvider;
    private fallbackEnabled;
    private fallbackProvider;
    constructor();
    /**
     * Main entry point for AI requests with automatic fallback
     */
    chat(messages: AIMessage[], config?: AIConfig): Promise<AIResponse>;
    /**
     * Route to the appropriate provider
     */
    private callProvider;
    /**
     * Mistral AI Implementation
     */
    private callMistral;
    /**
     * Ollama Local AI Implementation
     */
    private callOllama;
    /**
     * OpenAI Implementation
     */
    private callOpenAI;
    /**
     * Anthropic Claude Implementation
     */
    private callAnthropic;
    /**
     * Google Gemini Implementation
     */
    private callGoogle;
    /**
     * Local Model Implementation (Ollama)
     */
    private callLocal;
    /**
     * Get available providers
     */
    getAvailableProviders(): string[];
    /**
     * Health check for providers
     */
    healthCheck(provider: string): Promise<boolean>;
    /**
     * Check if Ollama server is running and has models available
     */
    checkOllamaStatus(): Promise<{
        running: boolean;
        models: string[];
        error?: string;
    }>;
}
export declare const aiService: AIProviderService;
export {};
//# sourceMappingURL=aiProviderService.d.ts.map
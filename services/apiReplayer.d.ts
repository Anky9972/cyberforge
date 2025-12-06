/**
 * API Traffic Replayer Service
 *
 * Features:
 * - Import Postman collections and HAR logs
 * - Replay then mutate requests for stateful bug detection
 * - OAuth2/JWT capture and refresh built-in
 * - Session management and state tracking
 */
export interface HTTPRequest {
    id: string;
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string | object;
    timestamp: number;
    auth?: {
        type: 'bearer' | 'basic' | 'oauth2' | 'api-key';
        token?: string;
        credentials?: {
            username: string;
            password: string;
        };
    };
}
export interface HTTPResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
}
export interface ReplaySession {
    id: string;
    name: string;
    requests: HTTPRequest[];
    baseUrl: string;
    auth?: AuthConfig;
    variables: Record<string, string>;
    createdAt: Date;
}
export interface AuthConfig {
    type: 'oauth2' | 'jwt' | 'bearer' | 'basic' | 'api-key';
    oauth2?: {
        clientId: string;
        clientSecret: string;
        tokenUrl: string;
        scope?: string;
        refreshToken?: string;
    };
    jwt?: {
        token: string;
        refreshUrl?: string;
        expiresAt?: number;
    };
    bearer?: {
        token: string;
    };
    basic?: {
        username: string;
        password: string;
    };
    apiKey?: {
        key: string;
        header: string;
    };
}
export interface MutationStrategy {
    type: 'headers' | 'body' | 'params' | 'method' | 'sequence';
    enabled: boolean;
    intensity: 'low' | 'medium' | 'high';
}
declare class APITrafficReplayerService {
    private sessions;
    private tokenCache;
    /**
     * Import Postman collection
     */
    importPostmanCollection(collection: any): Promise<ReplaySession>;
    /**
     * Parse Postman request
     */
    private parsePostmanRequest;
    /**
     * Parse Postman auth
     */
    private parsePostmanAuth;
    /**
     * Import HAR (HTTP Archive) file
     */
    importHAR(har: any): Promise<ReplaySession>;
    /**
     * Parse HAR request
     */
    private parseHARRequest;
    /**
     * Extract auth from headers
     */
    private extractAuthFromHeaders;
    /**
     * Replay requests
     */
    replaySession(sessionId: string, options?: {
        mutate?: boolean;
        mutations?: MutationStrategy[];
        captureResponses?: boolean;
    }): Promise<Array<{
        request: HTTPRequest;
        response: HTTPResponse;
        mutated?: boolean;
    }>>;
    /**
     * Execute HTTP request
     */
    private executeRequest;
    /**
     * Refresh authentication
     */
    private refreshAuth;
    /**
     * Refresh OAuth2 token
     */
    private refreshOAuth2Token;
    /**
     * Refresh JWT token
     */
    private refreshJWT;
    /**
     * Apply authentication to request
     */
    private applyAuth;
    /**
     * Resolve variables in request
     */
    private resolveVariables;
    /**
     * Replace variables in string
     */
    private replaceVariables;
    /**
     * Capture variables from response
     */
    private captureVariables;
    /**
     * Mutate request for fuzzing
     */
    private mutateRequest;
    /**
     * Mutate headers
     */
    private mutateHeaders;
    /**
     * Mutate body
     */
    private mutateBody;
    /**
     * Mutate URL parameters
     */
    private mutateParams;
    /**
     * Mutate HTTP method
     */
    private mutateMethod;
    /**
     * Extract base URL
     */
    private extractBaseUrl;
    /**
     * Generate ID
     */
    private generateId;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Get session
     */
    getSession(sessionId: string): ReplaySession | undefined;
    /**
     * List all sessions
     */
    listSessions(): ReplaySession[];
}
export declare const apiReplayer: APITrafficReplayerService;
export {};
//# sourceMappingURL=apiReplayer.d.ts.map
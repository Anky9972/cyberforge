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
    credentials?: { username: string; password: string };
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
  variables: Record<string, string>; // For dynamic values
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
    header: string; // e.g., 'X-API-Key'
  };
}

export interface MutationStrategy {
  type: 'headers' | 'body' | 'params' | 'method' | 'sequence';
  enabled: boolean;
  intensity: 'low' | 'medium' | 'high';
}

class APITrafficReplayerService {
  private sessions: Map<string, ReplaySession> = new Map();
  private tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Import Postman collection
   */
  async importPostmanCollection(collection: any): Promise<ReplaySession> {
    const requests: HTTPRequest[] = [];
    const variables: Record<string, string> = {};

    // Extract variables
    if (collection.variable) {
      for (const v of collection.variable) {
        variables[v.key] = v.value;
      }
    }

    // Parse requests from items
    const parseItems = (items: any[], parentName: string = '') => {
      for (const item of items) {
        if (item.request) {
          const request = this.parsePostmanRequest(item, parentName);
          requests.push(request);
        }
        if (item.item) {
          parseItems(item.item, item.name);
        }
      }
    };

    parseItems(collection.item || []);

    const session: ReplaySession = {
      id: this.generateId(),
      name: collection.info?.name || 'Imported Collection',
      requests,
      baseUrl: this.extractBaseUrl(requests),
      variables,
      createdAt: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Parse Postman request
   */
  private parsePostmanRequest(item: any, folder: string): HTTPRequest {
    const req = item.request;
    const url = typeof req.url === 'string' ? req.url : req.url?.raw || '';

    const headers: Record<string, string> = {};
    if (req.header) {
      for (const h of req.header) {
        if (!h.disabled) {
          headers[h.key] = h.value;
        }
      }
    }

    let body: any = undefined;
    if (req.body) {
      if (req.body.mode === 'raw') {
        try {
          body = JSON.parse(req.body.raw);
        } catch {
          body = req.body.raw;
        }
      } else if (req.body.mode === 'urlencoded') {
        body = req.body.urlencoded?.reduce((acc: any, item: any) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
      }
    }

    // Extract auth
    const auth = req.auth ? this.parsePostmanAuth(req.auth) : undefined;

    return {
      id: this.generateId(),
      method: req.method || 'GET',
      url,
      headers,
      body,
      timestamp: Date.now(),
      auth
    };
  }

  /**
   * Parse Postman auth
   */
  private parsePostmanAuth(auth: any): HTTPRequest['auth'] {
    if (auth.type === 'bearer') {
      return {
        type: 'bearer',
        token: auth.bearer?.[0]?.value
      };
    } else if (auth.type === 'basic') {
      return {
        type: 'basic',
        credentials: {
          username: auth.basic?.find((b: any) => b.key === 'username')?.value || '',
          password: auth.basic?.find((b: any) => b.key === 'password')?.value || ''
        }
      };
    } else if (auth.type === 'oauth2') {
      return {
        type: 'oauth2',
        token: auth.oauth2?.find((o: any) => o.key === 'accessToken')?.value
      };
    }
    return undefined;
  }

  /**
   * Import HAR (HTTP Archive) file
   */
  async importHAR(har: any): Promise<ReplaySession> {
    const requests: HTTPRequest[] = [];

    for (const entry of har.log?.entries || []) {
      const request = this.parseHARRequest(entry);
      requests.push(request);
    }

    const session: ReplaySession = {
      id: this.generateId(),
      name: 'HAR Import',
      requests,
      baseUrl: this.extractBaseUrl(requests),
      variables: {},
      createdAt: new Date()
    };

    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Parse HAR request
   */
  private parseHARRequest(entry: any): HTTPRequest {
    const req = entry.request;
    
    const headers: Record<string, string> = {};
    for (const h of req.headers || []) {
      headers[h.name] = h.value;
    }

    let body: any = undefined;
    if (req.postData) {
      if (req.postData.mimeType?.includes('json')) {
        try {
          body = JSON.parse(req.postData.text);
        } catch {
          body = req.postData.text;
        }
      } else {
        body = req.postData.text;
      }
    }

    // Extract auth from headers
    const auth = this.extractAuthFromHeaders(headers);

    return {
      id: this.generateId(),
      method: req.method,
      url: req.url,
      headers,
      body,
      timestamp: new Date(entry.startedDateTime).getTime(),
      auth
    };
  }

  /**
   * Extract auth from headers
   */
  private extractAuthFromHeaders(headers: Record<string, string>): HTTPRequest['auth'] {
    const authHeader = headers['Authorization'] || headers['authorization'];
    
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return {
          type: 'bearer',
          token: authHeader.substring(7)
        };
      } else if (authHeader.startsWith('Basic ')) {
        const decoded = Buffer.from(authHeader.substring(6), 'base64').toString();
        const [username, password] = decoded.split(':');
        return {
          type: 'basic',
          credentials: { username, password }
        };
      }
    }

    // Check for API key in custom headers
    const apiKeyHeaders = ['X-API-Key', 'X-Api-Key', 'API-Key', 'ApiKey'];
    for (const header of apiKeyHeaders) {
      if (headers[header]) {
        return {
          type: 'api-key',
          token: headers[header]
        };
      }
    }

    return undefined;
  }

  /**
   * Replay requests
   */
  async replaySession(
    sessionId: string,
    options: {
      mutate?: boolean;
      mutations?: MutationStrategy[];
      captureResponses?: boolean;
    } = {}
  ): Promise<Array<{ request: HTTPRequest; response: HTTPResponse; mutated?: boolean }>> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const results: Array<{ request: HTTPRequest; response: HTTPResponse; mutated?: boolean }> = [];

    // Refresh auth if needed
    if (session.auth) {
      await this.refreshAuth(session);
    }

    for (const request of session.requests) {
      // Apply variables
      const resolvedRequest = this.resolveVariables(request, session.variables);

      // Apply auth
      if (session.auth) {
        this.applyAuth(resolvedRequest, session.auth);
      }

      // Execute request
      try {
        const response = await this.executeRequest(resolvedRequest);
        results.push({ request: resolvedRequest, response, mutated: false });

        // Capture dynamic variables (e.g., IDs from response)
        this.captureVariables(response, session.variables);

        // Mutate and replay if enabled
        if (options.mutate && options.mutations) {
          for (const mutation of options.mutations) {
            if (mutation.enabled) {
              const mutatedRequests = this.mutateRequest(resolvedRequest, mutation);
              
              for (const mutReq of mutatedRequests) {
                try {
                  const mutResponse = await this.executeRequest(mutReq);
                  results.push({ request: mutReq, response: mutResponse, mutated: true });
                } catch (error) {
                  // Crash or error - log it
                  console.error('Mutation caused error:', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Request failed:', error);
      }

      // Delay between requests to avoid rate limiting
      await this.delay(100);
    }

    return results;
  }

  /**
   * Execute HTTP request
   */
  private async executeRequest(request: HTTPRequest): Promise<HTTPResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined
      });

      const duration = Date.now() - startTime;
      const body = await response.text();

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body,
        duration
      };
    } catch (error: any) {
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Refresh authentication
   */
  private async refreshAuth(session: ReplaySession): Promise<void> {
    if (!session.auth) return;

    if (session.auth.type === 'oauth2' && session.auth.oauth2) {
      const cached = this.tokenCache.get(session.id);
      if (cached && cached.expiresAt > Date.now()) {
        return; // Token still valid
      }

      // Refresh OAuth2 token
      const token = await this.refreshOAuth2Token(session.auth.oauth2);
      this.tokenCache.set(session.id, {
        token,
        expiresAt: Date.now() + 3600000 // 1 hour
      });
    } else if (session.auth.type === 'jwt' && session.auth.jwt) {
      if (session.auth.jwt.expiresAt && session.auth.jwt.expiresAt < Date.now()) {
        // Refresh JWT
        if (session.auth.jwt.refreshUrl) {
          const newToken = await this.refreshJWT(session.auth.jwt.refreshUrl, session.auth.jwt.token);
          session.auth.jwt.token = newToken;
        }
      }
    }
  }

  /**
   * Refresh OAuth2 token
   */
  private async refreshOAuth2Token(config: NonNullable<AuthConfig['oauth2']>): Promise<string> {
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: config.scope || ''
    });

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Refresh JWT token
   */
  private async refreshJWT(refreshUrl: string, currentToken: string): Promise<string> {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.token || data.access_token;
  }

  /**
   * Apply authentication to request
   */
  private applyAuth(request: HTTPRequest, auth: AuthConfig): void {
    if (auth.type === 'bearer' && auth.bearer) {
      request.headers['Authorization'] = `Bearer ${auth.bearer.token}`;
    } else if (auth.type === 'oauth2' && auth.oauth2) {
      const cached = this.tokenCache.get(request.id);
      if (cached) {
        request.headers['Authorization'] = `Bearer ${cached.token}`;
      }
    } else if (auth.type === 'jwt' && auth.jwt) {
      request.headers['Authorization'] = `Bearer ${auth.jwt.token}`;
    } else if (auth.type === 'basic' && auth.basic) {
      const encoded = Buffer.from(`${auth.basic.username}:${auth.basic.password}`).toString('base64');
      request.headers['Authorization'] = `Basic ${encoded}`;
    } else if (auth.type === 'api-key' && auth.apiKey) {
      request.headers[auth.apiKey.header] = auth.apiKey.key;
    }
  }

  /**
   * Resolve variables in request
   */
  private resolveVariables(request: HTTPRequest, variables: Record<string, string>): HTTPRequest {
    const resolved = { ...request };

    // Replace in URL
    resolved.url = this.replaceVariables(request.url, variables);

    // Replace in headers
    resolved.headers = Object.entries(request.headers).reduce((acc, [key, value]) => {
      acc[key] = this.replaceVariables(value, variables);
      return acc;
    }, {} as Record<string, string>);

    // Replace in body
    if (typeof request.body === 'string') {
      resolved.body = this.replaceVariables(request.body, variables);
    }

    return resolved;
  }

  /**
   * Replace variables in string
   */
  private replaceVariables(str: string, variables: Record<string, string>): string {
    return str.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
  }

  /**
   * Capture variables from response
   */
  private captureVariables(response: HTTPResponse, variables: Record<string, string>): void {
    try {
      const body = JSON.parse(response.body);
      
      // Capture common ID fields
      if (body.id) variables['lastId'] = body.id;
      if (body.token) variables['token'] = body.token;
      if (body.userId) variables['userId'] = body.userId;
    } catch {
      // Not JSON or parsing failed
    }
  }

  /**
   * Mutate request for fuzzing
   */
  private mutateRequest(request: HTTPRequest, strategy: MutationStrategy): HTTPRequest[] {
    const mutations: HTTPRequest[] = [];

    switch (strategy.type) {
      case 'headers':
        mutations.push(...this.mutateHeaders(request, strategy.intensity));
        break;
      case 'body':
        mutations.push(...this.mutateBody(request, strategy.intensity));
        break;
      case 'params':
        mutations.push(...this.mutateParams(request, strategy.intensity));
        break;
      case 'method':
        mutations.push(...this.mutateMethod(request));
        break;
    }

    return mutations;
  }

  /**
   * Mutate headers
   */
  private mutateHeaders(request: HTTPRequest, intensity: string): HTTPRequest[] {
    const mutations: HTTPRequest[] = [];
    const attacks = ['<script>alert(1)</script>', '../../etc/passwd', '${7*7}', '{{7*7}}'];

    for (const [key, value] of Object.entries(request.headers)) {
      for (const attack of attacks) {
        const mutated = { ...request };
        mutated.headers = { ...request.headers, [key]: attack };
        mutations.push(mutated);
      }
    }

    return mutations;
  }

  /**
   * Mutate body
   */
  private mutateBody(request: HTTPRequest, intensity: string): HTTPRequest[] {
    const mutations: HTTPRequest[] = [];
    
    if (typeof request.body === 'object') {
      const attacks = [null, undefined, '', '<script>alert(1)</script>', -1, 9999999, {}, []];
      
      for (const key of Object.keys(request.body)) {
        for (const attack of attacks) {
          const mutated = { ...request };
          mutated.body = { ...request.body as object, [key]: attack };
          mutations.push(mutated);
        }
      }
    }

    return mutations;
  }

  /**
   * Mutate URL parameters
   */
  private mutateParams(request: HTTPRequest, intensity: string): HTTPRequest[] {
    const mutations: HTTPRequest[] = [];
    const attacks = ['<script>alert(1)</script>', '../../etc/passwd', 'admin', '-1'];

    const url = new URL(request.url);
    for (const [key, value] of url.searchParams.entries()) {
      for (const attack of attacks) {
        const mutated = { ...request };
        const mutUrl = new URL(request.url);
        mutUrl.searchParams.set(key, attack);
        mutated.url = mutUrl.toString();
        mutations.push(mutated);
      }
    }

    return mutations;
  }

  /**
   * Mutate HTTP method
   */
  private mutateMethod(request: HTTPRequest): HTTPRequest[] {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
    return methods
      .filter(m => m !== request.method)
      .map(method => ({ ...request, method }));
  }

  /**
   * Extract base URL
   */
  private extractBaseUrl(requests: HTTPRequest[]): string {
    if (requests.length === 0) return '';
    
    const url = new URL(requests[0].url);
    return `${url.protocol}//${url.host}`;
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get session
   */
  getSession(sessionId: string): ReplaySession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * List all sessions
   */
  listSessions(): ReplaySession[] {
    return Array.from(this.sessions.values());
  }
}

// Singleton instance
export const apiReplayer = new APITrafficReplayerService();

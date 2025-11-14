// Multi-Provider AI Service
// Supports Mistral, OpenAI, Anthropic, Google Gemini, and local models

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

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

class AIProviderService {
  private primaryProvider: string;
  private fallbackEnabled: boolean;
  private fallbackProvider: string;

  constructor() {
    this.primaryProvider = process.env.AI_PROVIDER || 'mistral';
    this.fallbackEnabled = process.env.AI_FALLBACK_ENABLED === 'true';
    this.fallbackProvider = process.env.AI_FALLBACK_PROVIDER || 'openai';
  }

  /**
   * Main entry point for AI requests with automatic fallback
   */
  async chat(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const provider = config?.provider || this.primaryProvider;
    
    console.log(`[AI] Using provider: ${provider} (primary: ${this.primaryProvider}, fallback enabled: ${this.fallbackEnabled})`);

    try {
      return await this.callProvider(provider, messages, config);
    } catch (error: any) {
      console.error(`[AI] ${provider} failed:`, error.message);

      // Try fallback if enabled and not already using fallback
      if (this.fallbackEnabled && provider !== this.fallbackProvider) {
        console.log(`[AI] Attempting fallback to ${this.fallbackProvider}...`);
        try {
          return await this.callProvider(this.fallbackProvider, messages, config);
        } catch (fallbackError: any) {
          console.error(`[AI] Fallback ${this.fallbackProvider} failed:`, fallbackError.message);
          throw new Error(`All AI providers failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Route to the appropriate provider
   */
  private async callProvider(
    provider: string,
    messages: AIMessage[],
    config?: AIConfig
  ): Promise<AIResponse> {
    switch (provider.toLowerCase()) {
      case 'ollama':
        return await this.callOllama(messages, config);
      case 'mistral':
        return await this.callMistral(messages, config);
      case 'openai':
        return await this.callOpenAI(messages, config);
      case 'anthropic':
        return await this.callAnthropic(messages, config);
      case 'google':
      case 'gemini':
        return await this.callGoogle(messages, config);
      case 'local':
        return await this.callLocal(messages, config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Mistral AI Implementation
   */
  private async callMistral(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) {
      throw new Error('Mistral API key not configured');
    }

    const model = process.env.MISTRAL_MODEL || 'mistral-medium-2508';
    const url = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';

    const requestBody: any = {
      model,
      messages,
      temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      max_tokens: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
    };

    // Add JSON mode if requested
    if (config?.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
      // Ensure system message requests JSON
      if (messages[0]?.role === 'system') {
        messages[0].content += '\n\nYou MUST respond with ONLY valid JSON. Do NOT use markdown code blocks. Output raw JSON only.';
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config?.timeout || parseInt(process.env.AI_TIMEOUT_MS || '60000')),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Mistral API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      provider: 'mistral',
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Ollama Local AI Implementation
   */
  private async callOllama(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    const timeout = config?.timeout || parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000');

    // Convert chat format to Ollama's expected format
    let prompt = '';
    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    // Add JSON format instruction if needed
    if (config?.responseFormat === 'json') {
      prompt += 'Assistant: ⚠️ CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the raw JSON object.\n\n';
    } else {
      prompt += 'Assistant: ';
    }

    const requestBody = {
      model: model,
      prompt: prompt.trim(),
      stream: false,
      options: {
        temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        num_predict: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Invalid response format from Ollama');
      }

      return {
        content: data.response.trim(),
        provider: 'ollama',
        model: model,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Ollama request timed out');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Ollama server not accessible. Make sure Ollama is running on ' + ollamaUrl);
      }
      throw error;
    }
  }

  /**
   * OpenAI Implementation
   */
  private async callOpenAI(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    const url = 'https://api.openai.com/v1/chat/completions';

    const requestBody: any = {
      model,
      messages,
      temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      max_tokens: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
    };

    if (config?.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
      if (messages[0]?.role === 'system') {
        messages[0].content += '\n\nRespond with valid JSON only.';
      }
    }

    const headers: any = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    if (process.env.OPENAI_ORG_ID) {
      headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config?.timeout || parseInt(process.env.AI_TIMEOUT_MS || '60000')),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  /**
   * Anthropic Claude Implementation
   */
  private async callAnthropic(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const model = process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229';
    const url = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';

    // Convert messages format (Anthropic uses different format)
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const requestBody = {
      model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
      temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config?.timeout || parseInt(process.env.AI_TIMEOUT_MS || '60000')),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model,
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      },
    };
  }

  /**
   * Google Gemini Implementation
   */
  private async callGoogle(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google API key not configured');
    }

    const model = process.env.GOOGLE_MODEL || 'gemini-pro';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Convert messages to Gemini format
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const userPrompts = messages
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join('\n\n');

    const combinedPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompts}` : userPrompts;

    const requestBody = {
      contents: [{
        parts: [{
          text: combinedPrompt
        }]
      }],
      generationConfig: {
        temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        maxOutputTokens: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config?.timeout || parseInt(process.env.AI_TIMEOUT_MS || '60000')),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.candidates[0].content.parts[0].text,
      provider: 'google',
      model,
      usage: {
        promptTokens: 0, // Google doesn't provide token counts in the same way
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Local Model Implementation (Ollama)
   */
  private async callLocal(messages: AIMessage[], config?: AIConfig): Promise<AIResponse> {
    const url = process.env.LOCAL_MODEL_URL || 'http://localhost:11434';
    const model = process.env.LOCAL_MODEL_NAME || 'llama2';

    // Combine messages into a single prompt for Ollama
    const prompt = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const requestBody = {
      model,
      prompt,
      stream: false,
      options: {
        temperature: config?.temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        num_predict: config?.maxTokens || parseInt(process.env.AI_MAX_TOKENS || '4000'),
      },
    };

    const response = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(config?.timeout || parseInt(process.env.AI_TIMEOUT_MS || '60000')),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Local model error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.response,
      provider: 'local',
      model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];

    // Ollama is always available if URL is configured (default: localhost:11434)
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    if (ollamaUrl) providers.push('ollama');
    
    if (process.env.MISTRAL_API_KEY) providers.push('mistral');
    if (process.env.OPENAI_API_KEY) providers.push('openai');
    if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
    if (process.env.GOOGLE_API_KEY) providers.push('google');
    if (process.env.LOCAL_MODEL_URL) providers.push('local');

    return providers;
  }

  /**
   * Health check for providers
   */
  async healthCheck(provider: string): Promise<boolean> {
    try {
      const response = await this.chat(
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "OK" if you can read this.' }
        ],
        { provider, maxTokens: 10 }
      );
      return !!response.content;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Ollama server is running and has models available
   */
  async checkOllamaStatus(): Promise<{ running: boolean; models: string[]; error?: string }> {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    
    try {
      // Check if Ollama server is running
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        return { running: false, models: [], error: `Ollama server error: ${response.status}` };
      }

      const data = await response.json();
      const models = data.models?.map((model: any) => model.name) || [];

      return { running: true, models, error: undefined };
    } catch (error: any) {
      return { 
        running: false, 
        models: [], 
        error: error.message.includes('fetch') 
          ? 'Ollama server not accessible' 
          : error.message 
      };
    }
  }
}

// Export singleton instance
export const aiService = new AIProviderService();

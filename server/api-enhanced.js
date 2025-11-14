// Enhanced Backend API with Ollama Integration
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();

// Configure CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://shashwat-srivastav.github.io'
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// ===== AUTHENTICATION ROUTES =====

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, username, password, firstName, lastName } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ 
                error: 'Email, username, and password are required' 
            });
        }

        // For now, return success (you can integrate with Prisma later)
        res.status(201).json({
            message: 'User registration endpoint ready',
            note: 'Full authentication will be available when using app.ts server',
            user: {
                email,
                username,
                firstName,
                lastName
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        if (!emailOrUsername || !password) {
            return res.status(400).json({ 
                error: 'Email/username and password are required' 
            });
        }

        // For now, return success (you can integrate with Prisma later)
        res.json({
            message: 'Login endpoint ready',
            note: 'Full authentication will be available when using app.ts server',
            token: 'mock_jwt_token',
            user: {
                id: 'mock_user_id',
                email: emailOrUsername,
                username: emailOrUsername
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout endpoint
app.post('/api/auth/logout', async (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
    // Mock response for now
    res.json({
        user: null,
        authenticated: false,
        note: 'Full authentication will be available when using app.ts server'
    });
});

// ===== ANALYSIS ROUTES =====

// AI Provider Configuration
const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';
const OLLAMA_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:8b';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = process.env.MISTRAL_API_URL || 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = process.env.MISTRAL_MODEL || 'mistral-medium-2508';

// Ollama AI Function
async function callOllama(systemPrompt, userPrompt, responseFormat = 'text') {
    try {
        let prompt;
        if (responseFormat === 'json') {
            // Simplified prompt for faster processing
            prompt = `${systemPrompt}\n\n${userPrompt}\n\nRespond with ONLY valid JSON using straight quotes ("):`;
        } else {
            prompt = `${systemPrompt}\n\n${userPrompt}`;
        }

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                format: responseFormat === 'json' ? 'json' : undefined,
                stream: false,
                options: {
                    temperature: 0.1, // Very low temperature for consistent, fast responses
                    num_predict: 1024, // Reduced from 2048 for much faster processing
                    top_k: 20,
                    top_p: 0.8
                }
            }),
            signal: AbortSignal.timeout(600000) // Increased to 10 minutes for very complex analysis
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status}`);
        }

        const data = await response.json();
        return {
            content: data.response?.trim() || '',
            usage: {
                prompt_tokens: data.prompt_eval_count || 0,
                completion_tokens: data.eval_count || 0,
                total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            },
            provider: 'ollama',
            model: OLLAMA_MODEL
        };
    } catch (error) {
        if (error.message.includes('fetch') || error.name === 'AbortError') {
            throw new Error('Ollama server not accessible or request timed out');
        }
        throw error;
    }
}

// Mistral AI Function (Fallback)
async function callMistral(systemPrompt, userPrompt, responseFormat = 'text') {
    if (!MISTRAL_API_KEY || MISTRAL_API_KEY === 'ROTATE_THIS_KEY_IT_WAS_EXPOSED') {
        throw new Error('Mistral API key not configured or needs rotation');
    }

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    const requestBody = {
        model: MISTRAL_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
    };

    if (responseFormat === 'json') {
        requestBody.response_format = { type: "json_object" };
        messages[0].content += "\n\n⚠️ CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do NOT wrap the JSON in markdown code blocks (no ```json). Do NOT add any explanations or text before or after the JSON. Output ONLY the raw JSON object starting with { and ending with }.";
    }

    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
        content: data.choices[0].message.content,
        usage: data.usage || {},
        provider: 'mistral',
        model: MISTRAL_MODEL
    };
}

// Main AI Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
    const { systemPrompt, userPrompt, responseFormat } = req.body;

    if (!systemPrompt || !userPrompt) {
        return res.status(400).json({ error: 'Missing systemPrompt or userPrompt' });
    }

    try {
        let result;
        
        // Try Ollama first (if configured as primary)
        if (AI_PROVIDER === 'ollama') {
            try {
                console.log(`🦙 Using Ollama (${OLLAMA_MODEL}) for analysis...`);
                result = await callOllama(systemPrompt, userPrompt, responseFormat);
            } catch (ollamaError) {
                console.warn('🦙 Ollama failed, falling back to Mistral:', ollamaError.message);
                
                // Fallback to Mistral
                if (process.env.AI_FALLBACK_ENABLED === 'true') {
                    result = await callMistral(systemPrompt, userPrompt, responseFormat);
                } else {
                    throw ollamaError;
                }
            }
        } else {
            // Use Mistral as primary
            result = await callMistral(systemPrompt, userPrompt, responseFormat);
        }

        res.json({
            content: result.content,
            usage: result.usage,
            provider: result.provider,
            model: result.model
        });

    } catch (error) {
        console.error("🚨 AI Analysis failed:", error.message);
        res.status(500).json({ 
            error: error.message,
            provider: 'none'
        });
    }
});

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ai_provider: AI_PROVIDER,
        ollama_configured: !!OLLAMA_URL,
        mistral_configured: !!(MISTRAL_API_KEY && MISTRAL_API_KEY !== 'ROTATE_THIS_KEY_IT_WAS_EXPOSED'),
        fallback_enabled: process.env.AI_FALLBACK_ENABLED === 'true'
    });
});

// AI Provider Status Endpoint
app.get('/api/ai-status', async (req, res) => {
    const status = {
        primary_provider: AI_PROVIDER,
        fallback_enabled: process.env.AI_FALLBACK_ENABLED === 'true',
        providers: {}
    };

    // Check Ollama
    if (AI_PROVIDER === 'ollama' || process.env.AI_FALLBACK_ENABLED === 'true') {
        try {
            const ollamaResponse = await fetch(`${OLLAMA_URL}/api/tags`, {
                signal: AbortSignal.timeout(3000)
            });
            
            if (ollamaResponse.ok) {
                const data = await ollamaResponse.json();
                const models = data.models?.map(m => m.name) || [];
                
                status.providers.ollama = {
                    status: 'available',
                    model: OLLAMA_MODEL,
                    available_models: models,
                    model_ready: models.includes(OLLAMA_MODEL)
                };
            } else {
                status.providers.ollama = { status: 'error', error: `HTTP ${ollamaResponse.status}` };
            }
        } catch (error) {
            status.providers.ollama = { status: 'unavailable', error: error.message };
        }
    }

    // Check Mistral
    if (AI_PROVIDER === 'mistral' || process.env.AI_FALLBACK_ENABLED === 'true') {
        if (MISTRAL_API_KEY && MISTRAL_API_KEY !== 'ROTATE_THIS_KEY_IT_WAS_EXPOSED') {
            status.providers.mistral = { status: 'configured', model: MISTRAL_MODEL };
        } else {
            status.providers.mistral = { status: 'not_configured', error: 'API key missing or needs rotation' };
        }
    }

    res.json(status);
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        name: 'CyberForge API',
        version: '2.0.0',
        status: 'running',
        ai_provider: AI_PROVIDER,
        endpoints: [
            { path: '/api/auth/register', method: 'POST', description: 'User registration' },
            { path: '/api/auth/login', method: 'POST', description: 'User login' },
            { path: '/api/auth/logout', method: 'POST', description: 'User logout' },
            { path: '/api/auth/me', method: 'GET', description: 'Get current user' },
            { path: '/api/analyze', method: 'POST', description: 'AI-powered code analysis' },
            { path: '/api/ai-status', method: 'GET', description: 'AI provider status' },
            { path: '/health', method: 'GET', description: 'Health check' }
        ],
        note: 'For full authentication with database, use app.ts server'
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`🔒 CyberForge API running on port ${PORT}`);
    console.log(`🤖 Primary AI Provider: ${AI_PROVIDER}`);
    console.log(`🔄 Fallback enabled: ${process.env.AI_FALLBACK_ENABLED === 'true'}`);
    console.log(`📡 Listening at http://localhost:${PORT}`);
    
    if (AI_PROVIDER === 'ollama') {
        console.log(`🦙 Ollama: ${OLLAMA_URL} (${OLLAMA_MODEL})`);
    }
    
    console.log('\n✅ Ready for secure, local AI analysis!');
});
// Backend API Proxy - Secures API keys server-side
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
const MODEL = "mistral-medium-2508";

interface ChatRequest {
    systemPrompt: string;
    userPrompt: string;
    responseFormat?: 'json';
}

// Secure API endpoint - API key never exposed to client
app.post('/api/analyze', async (req, res) => {
    const { systemPrompt, userPrompt, responseFormat } = req.body as ChatRequest;

    if (!MISTRAL_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: API key not set' });
    }

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
    ];

    const requestBody: any = {
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000
    };

    if (responseFormat === 'json') {
        requestBody.response_format = { type: "json_object" };
        messages[0].content = systemPrompt + "\n\n⚠️ CRITICAL INSTRUCTION: You MUST respond with ONLY valid JSON. Do NOT wrap the JSON in markdown code blocks (no ```json). Do NOT add any explanations or text before or after the JSON. Output ONLY the raw JSON object starting with { and ending with }.";
    }

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MISTRAL_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (response.status === 429) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded. Please wait a moment and try again.' 
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                error: `API error: ${response.status} - ${errorText}` 
            });
        }

        const data = await response.json();
        
        if (!(data as any).choices || !(data as any).choices[0] || !(data as any).choices[0].message) {
            return res.status(500).json({ error: 'Invalid response structure from AI service' });
        }

        res.json({ 
            content: (data as any).choices[0].message.content,
            usage: (data as any).usage // Return token usage for cost tracking
        });
    } catch (error) {
        console.error("API call failed:", error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Unknown error occurred' 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', apiKeyConfigured: !!MISTRAL_API_KEY });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🔒 FuzzForge API Proxy running on port ${PORT}`);
    console.log(`🔑 API Key configured: ${MISTRAL_API_KEY ? 'YES' : 'NO'}`);
});

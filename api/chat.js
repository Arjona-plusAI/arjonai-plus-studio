/* ============================================================================
   ARJONA +AI STUDIO — /api/chat (Vercel Node Serverless Function)
   Mirrors the response contract of api/server.py (Flask) so the frontend
   (script.js / api-client.js) can treat both backends identically:
     Success -> { success: true, reply: "...", model: "..." }
     Failure -> { success: false, error: "...", ...optional detail }
   ============================================================================ */

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim();

const DEFAULT_SYSTEM_PROMPT =
    'You are Arjona AI, a concise professional design assistant inside ' +
    'Arjona AI Studio. Help with image editing, poster design, layer operations, ' +
    'style suggestions, and creative prompts. Keep replies short, useful, and friendly.';

function sanitizeReply(text) {
    const trimmed = (text || '').toString().trim();
    const low = trimmed.toLowerCase();
    const looksLikeMarkup =
        !trimmed ||
        low.indexOf('<html') !== -1 ||
        low.indexOf('<!doctype') !== -1 ||
        low.indexOf('<body') !== -1 ||
        low.indexOf('<script') !== -1 ||
        low.charAt(0) === '<';
    if (looksLikeMarkup) {
        return 'Hello boss! Main ready hoon — bolo kya design help chahiye?';
    }
    return trimmed.slice(0, 600);
}

function normalizeMessages(body) {
    const incomingMessages = Array.isArray(body.messages) ? body.messages : null;
    const prompt = (body.prompt || '').toString().trim();

    let messages = [];
    if (incomingMessages && incomingMessages.length) {
        messages = incomingMessages
            .filter((m) => m && typeof m === 'object')
            .map((m) => {
                const role = ['system', 'user', 'assistant'].indexOf(m.role) !== -1 ? m.role : 'user';
                const content = (m.content || '').toString().trim();
                return { role, content };
            })
            .filter((m) => m.content);
    } else if (prompt) {
        messages = [{ role: 'user', content: prompt }];
    }

    const hasSystem = messages.some((m) => m.role === 'system');
    if (!hasSystem && messages.length) {
        messages.unshift({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });
    }

    return messages;
}

module.exports = async function handler(req, res) {
    // Basic CORS support to mirror flask-cors behavior on the Python backend.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
    }
    body = body && typeof body === 'object' ? body : {};

    const messages = normalizeMessages(body);
    if (!messages.length) {
        return res.status(400).json({ success: false, error: 'Prompt required' });
    }

    const GROQ_KEY = (process.env.GROQ_API_KEY || '').trim();
    if (!GROQ_KEY) {
        return res.status(500).json({
            success: false,
            error: 'Missing GROQ_API_KEY environment variable on server'
        });
    }

    const model = (body.model || DEFAULT_MODEL).toString();
    const payload = {
        model,
        messages,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
        max_tokens: Number.isInteger(body.max_tokens) ? body.max_tokens : 220
    };

    try {
        const groqResponse = await fetch(GROQ_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!groqResponse.ok) {
            let detail;
            try { detail = await groqResponse.json(); }
            catch (e) { detail = (await groqResponse.text()).slice(0, 500); }
            return res.status(502).json({
                success: false,
                error: 'Groq API request failed',
                status_code: groqResponse.status,
                detail
            });
        }

        const groqData = await groqResponse.json();
        const rawReply = groqData &&
            groqData.choices &&
            groqData.choices[0] &&
            groqData.choices[0].message &&
            groqData.choices[0].message.content;

        const reply = sanitizeReply(rawReply);

        return res.status(200).json({
            success: true,
            reply,
            model
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: 'Backend Error' });
    }
};

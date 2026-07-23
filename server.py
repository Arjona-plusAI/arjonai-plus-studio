from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import requests

app = Flask(__name__)
CORS(app)

# ===== CONFIG =====
# Set this in Vercel Project Settings -> Environment Variables.
# Name: GROQ_API_KEY, Value: your Groq key, then redeploy.
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant").strip()
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"


# ===== SERVE WEBSITE =====
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')



# ===== AI IMAGE GENERATE =====
@app.route('/api/generate', methods=['POST'])
def generate_image():
    try:
        data = request.get_json(silent=True) or {}
        prompt = (data.get('prompt') or '').strip()
        width = int(data.get('width') or 1280)
        height = int(data.get('height') or 720)

        if not prompt:
            return jsonify({'success': False, 'error': 'Prompt required'}), 400

        url = (
            "https://image.pollinations.ai/prompt/"
            f"{requests.utils.quote(prompt)}"
            f"?width={width}&height={height}"
            f"&nologo=true"
            f"&seed={os.urandom(4).hex()}"
        )

        return jsonify({
            'success': True,
            'url': url,
            'prompt': prompt
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== AI CHAT: GROQ BACKEND PROXY =====
@app.route('/api/chat', methods=['POST'])
def ai_chat():
    try:
        data = request.get_json(silent=True) or {}

        # The frontend may send either { prompt: "..." } or OpenAI-style { messages: [...] }.
        incoming_messages = data.get('messages')
        prompt = (data.get('prompt') or '').strip()

        if isinstance(incoming_messages, list) and incoming_messages:
            messages = []
            for msg in incoming_messages:
                if not isinstance(msg, dict):
                    continue
                role = msg.get('role') if msg.get('role') in ('system', 'user', 'assistant') else 'user'
                content = str(msg.get('content') or '').strip()
                if content:
                    messages.append({'role': role, 'content': content})
        elif prompt:
            messages = [{'role': 'user', 'content': prompt}]
        else:
            messages = []

        if not messages:
            return jsonify({'success': False, 'error': 'Prompt required'}), 400

        # Ensure Arjona personality/context exists if frontend did not send a system message.
        has_system = any(m.get('role') == 'system' for m in messages)
        if not has_system:
            messages.insert(0, {
                'role': 'system',
                'content': (
                    'You are Arjona AI, a concise professional design assistant inside '
                    'Arjona AI Studio. Help with image editing, poster design, layer operations, '
                    'style suggestions, and creative prompts. Keep replies short, useful, and friendly.'
                )
            })

        if not GROQ_API_KEY:
            return jsonify({
                'success': False,
                'error': 'Missing GROQ_API_KEY environment variable on server'
            }), 500

        payload = {
            'model': data.get('model') or GROQ_MODEL,
            'messages': messages,
            'temperature': float(data.get('temperature', 0.7)),
            'max_tokens': int(data.get('max_tokens', 220))
        }

        groq_response = requests.post(
            GROQ_CHAT_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type': 'application/json'
            },
            json=payload,
            timeout=30
        )

        if groq_response.status_code >= 400:
            # Do not expose the API key; return Groq's useful error message only.
            try:
                detail = groq_response.json()
            except Exception:
                detail = groq_response.text[:500]
            return jsonify({
                'success': False,
                'error': 'Groq API request failed',
                'status_code': groq_response.status_code,
                'detail': detail
            }), 502

        groq_data = groq_response.json()
        reply = (
            groq_data.get('choices', [{}])[0]
            .get('message', {})
            .get('content', '')
            .strip()
        )

        low = reply.lower()
        if (
            not reply or
            '<html' in low or
            '<!doctype' in low or
            '<body' in low or
            '<script' in low or
            low.startswith('<')
        ):
            reply = 'Hello boss! Main ready hoon — bolo kya design help chahiye?'

        return jsonify({
            'success': True,
            'reply': reply[:600],
            'model': payload['model']
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== HEALTH CHECK =====
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Arjona AI Server Running!',
        'groq_configured': bool(GROQ_API_KEY),
        'groq_model': GROQ_MODEL
    })


# ===== SERVE STATIC FILES / SPA FALLBACK =====
# Keep this catch-all after /api routes so API endpoints are never shadowed.
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)


# ===== START SERVER: LOCAL ONLY =====
if __name__ == '__main__':
    print('=' * 40)
    print('🚀 ARJONA AI SERVER STARTING...')
    print('=' * 40)
    print('👉 Open: http://localhost:5000')
    print('=' * 40)
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )

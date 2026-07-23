from flask import Flask, jsonify, request
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

# NOTE: This file is an API-ONLY backend (Vercel Python Serverless Function).
# It intentionally does NOT serve index.html or any other frontend file.
# Vercel's own static builds + "handle: filesystem" routing in vercel.json
# already serve index.html, style.css, script.js, etc. directly. Having this
# Flask app also try to serve those same files (via send_from_directory,
# relative to a process working directory that may differ inside a
# serverless function) caused route ambiguity and could result in the raw
# HTML source being served with the wrong Content-Type instead of being
# rendered. Keep this file strictly to /api/* JSON endpoints.


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


# ===== HEALTH CHECK =====
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Arjona AI Server Running!',
        'groq_configured': bool(GROQ_API_KEY),
        'groq_model': GROQ_MODEL
    })


# ===== START SERVER: LOCAL ONLY =====
if __name__ == '__main__':
    print('=' * 40)
    print('ARJONA AI SERVER STARTING...')
    print('=' * 40)
    print('Open: http://localhost:5000')
    print('=' * 40)
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )

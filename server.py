from flask import Flask, send_from_directory, jsonify, request
from flask_cors import CORS
import os
import requests
import base64
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# ===== SERVE WEBSITE =====
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('.', path)

# ===== AI IMAGE GENERATE =====
@app.route('/api/generate', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '')
        width  = data.get('width',  1280)
        height = data.get('height', 720)
        
        if not prompt:
            return jsonify({'error': 'Prompt required'}), 400

        url = (
            f"https://image.pollinations.ai/prompt/"
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
        return jsonify({'error': str(e)}), 500

# ===== AI CHAT =====
@app.route('/api/chat', methods=['POST'])
def ai_chat():
    try:
        data   = request.get_json()
        prompt = data.get('prompt', '')

        if not prompt:
            return jsonify({'error': 'Prompt required'}), 400

        response = requests.get(
            'https://text.pollinations.ai/' +
            requests.utils.quote(prompt),
            timeout=15
        )

        return jsonify({
            'success': True,
            'reply': response.text.strip()[:200]
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===== HEALTH CHECK =====
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Arjona AI Server Running!'
    })

# ===== START SERVER =====
if __name__ == '__main__':
    print("=" * 40)
    print("🚀 ARJONA AI SERVER STARTING...")
    print("=" * 40)
    print("👉 Open: http://localhost:5000")
    print("=" * 40)
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
/* ============================================
   ARJONA +AI STUDIO — API CLIENT
   Professional API Handler v2.0
   ============================================ */

'use strict';

const ApiClient = (function () {

    /* ===== CONFIG ===== */
    const CONFIG = {
        POLLINATIONS_IMG: 'https://image.pollinations.ai/prompt/',
        POLLINATIONS_TEXT: 'https://text.pollinations.ai/',
        TIMEOUT: 45000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000
    };

    /* ===== REQUEST QUEUE ===== */
    const queue = [];
    let processing = false;
    let requestCount = 0;

    /* ===== CACHE ===== */
    const cache = new Map();
    const CACHE_TTL = 5 * 60 * 1000;

    function getCached(key) {
        const item = cache.get(key);
        if (!item) return null;
        if (Date.now() - item.time > CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return item.data;
    }

    function setCache(key, data) {
        cache.set(key, { data, time: Date.now() });
        if (cache.size > 50) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }
    }

    /* ===== FETCH WITH TIMEOUT ===== */
    function fetchWithTimeout(url, options = {}, timeout = CONFIG.TIMEOUT) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Request timeout after ' + timeout + 'ms'));
            }, timeout);

            fetch(url, options)
                .then(res => {
                    clearTimeout(timer);
                    resolve(res);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    /* ===== RETRY LOGIC ===== */
    async function fetchWithRetry(url, options = {}, attempts = CONFIG.RETRY_ATTEMPTS) {
        for (let i = 0; i < attempts; i++) {
            try {
                const res = await fetchWithTimeout(url, options);
                if (res.ok || res.status === 200) return res;
                if (res.status === 429) {
                    await delay(CONFIG.RETRY_DELAY * (i + 1) * 2);
                    continue;
                }
                throw new Error('HTTP ' + res.status);
            } catch (err) {
                if (i === attempts - 1) throw err;
                await delay(CONFIG.RETRY_DELAY * (i + 1));
                console.warn(`[API] Retry ${i + 1}/${attempts}:`, err.message);
            }
        }
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /* ===== EVENT EMITTER ===== */
    const events = {};

    function on(event, handler) {
        if (!events[event]) events[event] = [];
        events[event].push(handler);
    }

    function off(event, handler) {
        if (!events[event]) return;
        events[event] = events[event].filter(h => h !== handler);
    }

    function emit(event, data) {
        if (!events[event]) return;
        events[event].forEach(h => {
            try { h(data); } catch (e) { }
        });
    }

    /* ===== AI IMAGE GENERATION ===== */
    const ImageAPI = {

        generate(prompt, options = {}) {
            return new Promise((resolve, reject) => {

                if (!prompt || !prompt.trim()) {
                    reject(new Error('Prompt is required'));
                    return;
                }

                const width = options.width || 1280;
                const height = options.height || 720;
                const style = options.style || '';
                const seed = options.seed ||
                    Math.floor(Math.random() * 999999);

                const fullPrompt = prompt.trim() + style;
                const cacheKey = `img_${fullPrompt}_${width}_${height}`;

                /* Check cache */
                const cached = getCached(cacheKey);
                if (cached) {
                    resolve(cached);
                    return;
                }

                const url = CONFIG.POLLINATIONS_IMG +
                    encodeURIComponent(fullPrompt) +
                    `?width=${width}&height=${height}` +
                    `&nologo=true&seed=${seed}`;

                emit('image:start', { prompt, url });

                /* Track request */
                requestCount++;
                const reqId = requestCount;

                const img = new Image();
                img.crossOrigin = 'anonymous';

                const timer = setTimeout(() => {
                    img.src = '';
                    reject(new Error('Image generation timeout'));
                    emit('image:timeout', { reqId, prompt });
                }, CONFIG.TIMEOUT);

                img.onload = function () {
                    clearTimeout(timer);
                    const result = {
                        image: img,
                        url,
                        prompt: fullPrompt,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        reqId,
                        cached: false
                    };
                    setCache(cacheKey, result);
                    emit('image:success', result);
                    resolve(result);
                };

                img.onerror = function () {
                    clearTimeout(timer);
                    const err = new Error('Image generation failed');
                    emit('image:error', { reqId, prompt, error: err });
                    reject(err);
                };

                img.src = url;
            });
        },

        /* Generate multiple variations */
        generateVariations(prompt, count = 3, options = {}) {
            const promises = [];
            for (let i = 0; i < count; i++) {
                promises.push(
                    this.generate(prompt, {
                        ...options,
                        seed: Math.floor(Math.random() * 999999)
                    })
                );
            }
            return Promise.allSettled(promises);
        }
    };

    /* ===== AI TEXT / CHAT ===== */
    const TextAPI = {

        async ask(prompt, options = {}) {
            if (!prompt || !prompt.trim()) {
                throw new Error('Prompt is required');
            }

            const maxWords = options.maxWords || 30;
            const language = options.language || 'hinglish';
            const context = options.context || '';

            const systemPrompt = [
                'You are Arjona AI, a friendly design assistant.',
                language === 'hinglish'
                    ? 'Reply in fun Hinglish (mix Hindi+English).'
                    : '',
                `Keep reply under ${maxWords} words.`,
                context ? `Context: ${context}` : '',
                'Be helpful, fun and encouraging.',
                `User: ${prompt.trim()}`
            ].filter(Boolean).join(' ');

            const cacheKey = `text_${systemPrompt}`;
            const cached = getCached(cacheKey);
            if (cached) return cached;

            emit('text:start', { prompt });

            try {
                const res = await fetchWithRetry(
                    CONFIG.POLLINATIONS_TEXT +
                    encodeURIComponent(systemPrompt),
                    {},
                    2
                );

                let text = await res.text();
                text = (text || '').trim().substring(0, 300);

                if (!text || text.length < 2) {
                    text = this.getFallback();
                }

                const result = { text, prompt, cached: false };
                setCache(cacheKey, result);
                emit('text:success', result);
                return result;

            } catch (err) {
                emit('text:error', { prompt, error: err });
                return { text: this.getFallback(), prompt, error: true };
            }
        },

        /* Fallback responses */
        getFallback() {
            const responses = [
                'Mast kaam kar rahe ho! 🔥',
                'Ekdum zabardast! Keep going boss!',
                'Design solid lag raha hai! ✨',
                'Sahi direction mein ho! 💪',
                'AI ready hai tumhare liye! ✦',
                'Kya baat hai! Aage badho! 🚀'
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        },

        /* Stream response (word by word) */
        async askStream(prompt, onWord, options = {}) {
            const result = await this.ask(prompt, options);
            const words = result.text.split(' ');

            for (let i = 0; i < words.length; i++) {
                await delay(80);
                onWord(words.slice(0, i + 1).join(' '), i === words.length - 1);
            }

            return result;
        }
    };

    /* ===== STATUS CHECKER ===== */
    const StatusAPI = {
        async checkConnectivity() {
            try {
                const res = await fetchWithTimeout(
                    CONFIG.POLLINATIONS_TEXT +
                    encodeURIComponent('hi'),
                    {},
                    5000
                );
                return { online: true, latency: 0 };
            } catch (e) {
                return { online: false, error: e.message };
            }
        }
    };

    /* ===== VOICE API ===== */
    const VoiceAPI = {

        recognition: null,
        synthesis: window.speechSynthesis || null,
        isListening: false,

        /* Start voice input */
        startListening(options = {}) {
            return new Promise((resolve, reject) => {
                const SR = window.SpeechRecognition ||
                    window.webkitSpeechRecognition;

                if (!SR) {
                    reject(new Error('Speech recognition not supported'));
                    return;
                }

                const rec = new SR();
                rec.lang = options.lang || 'en-US';
                rec.continuous = false;
                rec.interimResults = options.interim || false;

                this.recognition = rec;
                this.isListening = true;
                emit('voice:start', {});

                rec.onresult = e => {
                    const transcript = e.results[0][0].transcript;
                    const confidence = e.results[0][0].confidence;
                    this.isListening = false;
                    emit('voice:result', { transcript, confidence });
                    resolve({ transcript, confidence });
                };

                rec.onerror = e => {
                    this.isListening = false;
                    emit('voice:error', { error: e.error });
                    reject(new Error('Voice error: ' + e.error));
                };

                rec.onend = () => {
                    this.isListening = false;
                    emit('voice:end', {});
                };

                rec.start();
            });
        },

        /* Stop listening */
        stopListening() {
            if (this.recognition) {
                this.recognition.stop();
                this.isListening = false;
            }
        },

        /* Text to speech */
        speak(text, options = {}) {
            if (!this.synthesis) return;
            try {
                this.synthesis.cancel();
                const u = new SpeechSynthesisUtterance(text);
                u.lang = options.lang || 'hi-IN';
                u.rate = options.rate || 1.1;
                u.pitch = options.pitch || 1;
                u.volume = options.volume || 1;
                this.synthesis.speak(u);
                emit('tts:speak', { text });
            } catch (e) {
                console.warn('[VoiceAPI] TTS error:', e);
            }
        },

        /* Stop speaking */
        stopSpeaking() {
            if (this.synthesis) this.synthesis.cancel();
        },

        get supported() {
            return !!(window.SpeechRecognition ||
                window.webkitSpeechRecognition);
        }
    };

    /* ===== ANALYTICS (LOCAL) ===== */
    const Analytics = {

        events: [],
        MAX_EVENTS: 200,

        track(name, data = {}) {
            const event = {
                name,
                data,
                time: Date.now(),
                timestamp: new Date().toISOString()
            };
            this.events.push(event);
            if (this.events.length > this.MAX_EVENTS) {
                this.events.shift();
            }
            emit('analytics:track', event);
        },

        getReport() {
            const counts = {};
            this.events.forEach(e => {
                counts[e.name] = (counts[e.name] || 0) + 1;
            });
            return {
                total: this.events.length,
                counts,
                recent: this.events.slice(-10)
            };
        },

        clear() { this.events = []; }
    };

    /* ===== PUBLIC API ===== */
    return {
        Image: ImageAPI,
        Text: TextAPI,
        Status: StatusAPI,
        Voice: VoiceAPI,
        Analytics,

        /* Event system */
        on,
        off,
        emit,

        /* Config */
        config: CONFIG,

        /* Stats */
        get stats() {
            return {
                requests: requestCount,
                cached: cache.size,
                queued: queue.length
            };
        }
    };

})();

/* ===== GLOBAL EXPORT ===== */
window.ApiClient = ApiClient;

/* ===== CONNECT TO EXISTING FUNCTIONS ===== */
document.addEventListener('DOMContentLoaded', function () {

    /* Listen to API events */
    ApiClient.on('image:start', function () {
        if (typeof updateLog === 'function') {
            updateLog('Generating AI image...');
        }
    });

    ApiClient.on('image:success', function (data) {
        if (typeof updateLog === 'function') {
            updateLog('AI image ready! ✓');
        }
        if (typeof toast === 'function') {
            toast('AI image generated!', 'success');
        }
    });

    ApiClient.on('image:error', function (data) {
        if (typeof toast === 'function') {
            toast('Image generation failed. Try again!', 'error');
        }
    });

    ApiClient.on('text:success', function (data) {
        if (typeof updateLog === 'function') {
            updateLog(data.text);
        }
    });

    ApiClient.on('voice:start', function () {
        if (typeof updateLog === 'function') {
            updateLog('Listening... 🎤');
        }
        if (typeof toast === 'function') {
            toast('Listening... speak now!', 'info', 2000);
        }
    });

    ApiClient.on('voice:result', function (data) {
        if (typeof toast === 'function') {
            toast('Got it: "' + data.transcript + '"', 'success', 2000);
        }
    });

    console.log('🔌 API Client Ready!');
});
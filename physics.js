/* ============================================
   ARJONA +AI STUDIO — PHYSICS ENGINE
   Particle System & Physics Effects
   ============================================ */

'use strict';

const PhysicsEngine = (function () {

    /* ===== PARTICLE SYSTEM ===== */
    const ParticleSystem = (function () {

        let canvas, ctx;
        let particles = [];
        let animId = null;
        let running = false;
        let W = 0, H = 0;

        /* Particle types */
        const TYPES = {
            SPARK: 'spark',
            DUST: 'dust',
            STAR: 'star',
            BUBBLE: 'bubble',
            CONFETTI: 'confetti'
        };

        function init(canvasEl) {
            canvas = canvasEl;
            ctx = canvas.getContext('2d');
            resize();
            window.addEventListener('resize', resize);
        }

        function resize() {
            if (!canvas) return;
            W = canvas.width = canvas.offsetWidth || window.innerWidth;
            H = canvas.height = canvas.offsetHeight || window.innerHeight;
        }

        /* Create single particle */
        function createParticle(options = {}) {
            return {
                x: options.x || Math.random() * W,
                y: options.y || Math.random() * H,
                vx: options.vx || (Math.random() - 0.5) * 3,
                vy: options.vy || (Math.random() - 0.5) * 3,
                size: options.size || Math.random() * 4 + 1,
                color: options.color || '#00d4ff',
                alpha: options.alpha || 1,
                decay: options.decay || 0.015,
                gravity: options.gravity || 0,
                type: options.type || TYPES.SPARK,
                rotation: options.rotation || 0,
                rotSpeed: options.rotSpeed || (Math.random() - 0.5) * 0.2,
                life: 1,
                maxLife: options.maxLife || 1,
                hue: options.hue || 190,
                bounce: options.bounce || false
            };
        }

        /* Emit burst of particles */
        function emit(x, y, count = 20, options = {}) {
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 +
                    Math.random() * 0.5;
                const speed = (options.speed || 3) +
                    Math.random() * (options.speedVar || 2);

                particles.push(createParticle({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: options.size || Math.random() * 4 + 2,
                    color: options.color || '#00d4ff',
                    decay: options.decay || 0.02,
                    gravity: options.gravity || 0.05,
                    type: options.type || TYPES.SPARK,
                    hue: options.hue || 190,
                    bounce: options.bounce || false
                }));
            }
            if (!running) start();
        }

        /* Confetti burst */
        function confetti(x, y, count = 40) {
            const colors = [
                '#00d4ff', '#7c3aed', '#00ff88',
                '#f59e0b', '#ef4444', '#ec4899'
            ];
            for (let i = 0; i < count; i++) {
                const angle = (Math.random() * Math.PI * 2);
                const speed = 4 + Math.random() * 5;
                particles.push(createParticle({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 3,
                    size: 4 + Math.random() * 6,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    decay: 0.012,
                    gravity: 0.15,
                    type: TYPES.CONFETTI,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.3
                }));
            }
            if (!running) start();
        }

        /* Draw single particle */
        function drawParticle(p) {
            ctx.save();
            ctx.globalAlpha = p.alpha * p.life;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);

            switch (p.type) {
                case TYPES.SPARK:
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case TYPES.CONFETTI:
                    ctx.fillStyle = p.color;
                    ctx.fillRect(
                        -p.size / 2, -p.size / 4,
                        p.size, p.size / 2
                    );
                    break;

                case TYPES.STAR:
                    ctx.fillStyle = p.color;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 12;
                    drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
                    break;

                case TYPES.DUST:
                    const grad = ctx.createRadialGradient(
                        0, 0, 0, 0, 0, p.size
                    );
                    grad.addColorStop(0, p.color);
                    grad.addColorStop(1, 'transparent');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    break;

                case TYPES.BUBBLE:
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                    ctx.stroke();
                    break;
            }

            ctx.restore();
        }

        function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            for (let i = 0; i < spikes; i++) {
                ctx.lineTo(
                    cx + Math.cos(rot) * outerR,
                    cy + Math.sin(rot) * outerR
                );
                rot += step;
                ctx.lineTo(
                    cx + Math.cos(rot) * innerR,
                    cy + Math.sin(rot) * innerR
                );
                rot += step;
            }
            ctx.lineTo(cx, cy - outerR);
            ctx.closePath();
            ctx.fill();
        }

        /* Update loop */
        function update() {
            if (!running) return;

            ctx.clearRect(0, 0, W, H);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];

                /* Physics */
                p.vx *= 0.98;
                p.vy += p.gravity;
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;
                p.rotation += p.rotSpeed;

                /* Bounce off walls */
                if (p.bounce) {
                    if (p.x < 0 || p.x > W) p.vx *= -0.7;
                    if (p.y > H) { p.y = H; p.vy *= -0.6; }
                }

                /* Remove dead particles */
                if (p.life <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                drawParticle(p);
            }

            /* Stop if no particles */
            if (particles.length === 0) {
                stop();
                return;
            }

            animId = requestAnimationFrame(update);
        }

        function start() {
            running = true;
            animId = requestAnimationFrame(update);
        }

        function stop() {
            running = false;
            if (animId) cancelAnimationFrame(animId);
            animId = null;
        }

        function clear() {
            particles = [];
            stop();
            if (ctx) ctx.clearRect(0, 0, W, H);
        }

        return {
            TYPES,
            init,
            emit,
            confetti,
            clear,
            stop,
            get count() { return particles.length; }
        };

    })();

    /* ===== GRAVITY SIMULATION ===== */
    const GravitySystem = (function () {

        let objects = [];
        let animId = null;
        let running = false;
        let canvas, ctx, W, H;

        function init(canvasEl) {
            canvas = canvasEl;
            ctx = canvas.getContext('2d');
            W = canvas.width;
            H = canvas.height;
        }

        function addObject(options = {}) {
            objects.push({
                x: options.x || W / 2,
                y: options.y || 0,
                vx: options.vx || (Math.random() - 0.5) * 3,
                vy: options.vy || 0,
                radius: options.radius || 8,
                mass: options.mass || 1,
                color: options.color || '#00d4ff',
                restitution: options.restitution || 0.7,
                friction: options.friction || 0.99
            });
            if (!running) start();
        }

        function update() {
            if (!running) return;
            ctx.clearRect(0, 0, W, H);

            const GRAVITY = 0.4;

            objects.forEach(obj => {
                /* Apply gravity */
                obj.vy += GRAVITY;

                /* Apply friction */
                obj.vx *= obj.friction;

                /* Move */
                obj.x += obj.vx;
                obj.y += obj.vy;

                /* Floor bounce */
                if (obj.y + obj.radius > H) {
                    obj.y = H - obj.radius;
                    obj.vy *= -obj.restitution;
                    obj.vx *= 0.85;
                }

                /* Wall bounce */
                if (obj.x - obj.radius < 0) {
                    obj.x = obj.radius;
                    obj.vx *= -obj.restitution;
                }
                if (obj.x + obj.radius > W) {
                    obj.x = W - obj.radius;
                    obj.vx *= -obj.restitution;
                }

                /* Draw */
                ctx.save();
                ctx.fillStyle = obj.color;
                ctx.shadowColor = obj.color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            animId = requestAnimationFrame(update);
        }

        function start() {
            running = true;
            animId = requestAnimationFrame(update);
        }

        function stop() {
            running = false;
            if (animId) cancelAnimationFrame(animId);
        }

        function clear() {
            objects = [];
            stop();
        }

        return { init, addObject, clear, stop };

    })();

    /* ===== MAGNETIC FIELD ===== */
    const MagneticField = (function () {

        let points = [];
        let mouseX = 0, mouseY = 0;
        let canvas, ctx, W, H;
        let animId = null;
        let running = false;

        function init(canvasEl) {
            canvas = canvasEl;
            ctx = canvas.getContext('2d');
            W = canvas.width;
            H = canvas.height;

            canvas.addEventListener('mousemove', e => {
                const r = canvas.getBoundingClientRect();
                mouseX = e.clientX - r.left;
                mouseY = e.clientY - r.top;
            });

            /* Create field points */
            for (let i = 0; i < 80; i++) {
                points.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    ox: 0, oy: 0,
                    size: Math.random() * 2 + 1,
                    hue: 190 + Math.random() * 60
                });
            }

            points.forEach(p => { p.ox = p.x; p.oy = p.y; });
        }

        function update() {
            if (!running) return;
            ctx.clearRect(0, 0, W, H);

            points.forEach(p => {
                const dx = mouseX - p.x;
                const dy = mouseY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const force = Math.min(80 / (dist + 1), 5);

                /* Attract to mouse */
                p.x += dx / dist * force * 0.3;
                p.y += dy / dist * force * 0.3;

                /* Spring back to origin */
                p.x += (p.ox - p.x) * 0.05;
                p.y += (p.oy - p.y) * 0.05;

                /* Draw point */
                const alpha = 0.3 + (force / 5) * 0.7;
                ctx.save();
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
                ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, 0.5)`;
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            animId = requestAnimationFrame(update);
        }

        function start() {
            running = true;
            update();
        }

        function stop() {
            running = false;
            if (animId) cancelAnimationFrame(animId);
        }

        return { init, start, stop };

    })();

    /* ===== WAVE PHYSICS ===== */
    const WaveSystem = (function () {

        let canvas, ctx, W, H;
        let animId = null;
        let running = false;
        let time = 0;
        let waves = [];

        function init(canvasEl) {
            canvas = canvasEl;
            ctx = canvas.getContext('2d');
            W = canvas.width;
            H = canvas.height;

            waves = [
                {
                    amp: 30, freq: 0.02, speed: 0.05,
                    color: 'rgba(0,212,255,0.15)', offset: 0
                },
                {
                    amp: 20, freq: 0.03, speed: 0.07,
                    color: 'rgba(124,58,237,0.1)', offset: 2
                },
                {
                    amp: 25, freq: 0.015, speed: 0.04,
                    color: 'rgba(0,255,136,0.08)', offset: 4
                }
            ];
        }

        function drawWave(wave) {
            ctx.beginPath();
            ctx.moveTo(0, H / 2);

            for (let x = 0; x <= W; x += 2) {
                const y = H / 2 +
                    wave.amp *
                    Math.sin(x * wave.freq +
                        time * wave.speed +
                        wave.offset);
                ctx.lineTo(x, y);
            }

            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.closePath();
            ctx.fillStyle = wave.color;
            ctx.fill();
        }

        function update() {
            if (!running) return;
            ctx.clearRect(0, 0, W, H);
            time++;
            waves.forEach(w => drawWave(w));
            animId = requestAnimationFrame(update);
        }

        function start() {
            running = true;
            update();
        }

        function stop() {
            running = false;
            if (animId) cancelAnimationFrame(animId);
        }

        return { init, start, stop };

    })();

    /* ===== SPRING SYSTEM ===== */
    const SpringSystem = (function () {

        const springs = new Map();

        function create(target, options = {}) {
            const spring = {
                target,
                current: options.initial || 0,
                velocity: 0,
                stiffness: options.stiffness || 0.15,
                damping: options.damping || 0.75,
                onUpdate: options.onUpdate || null,
                animId: null,
                running: false
            };

            function tick() {
                if (!spring.running) return;

                const force = (spring.target - spring.current) *
                    spring.stiffness;
                spring.velocity = (spring.velocity + force) *
                    spring.damping;
                spring.current += spring.velocity;

                if (spring.onUpdate) {
                    spring.onUpdate(spring.current);
                }

                /* Stop if settled */
                if (Math.abs(spring.velocity) < 0.001 &&
                    Math.abs(spring.target - spring.current) < 0.001) {
                    spring.current = spring.target;
                    if (spring.onUpdate) spring.onUpdate(spring.current);
                    spring.running = false;
                    return;
                }

                spring.animId = requestAnimationFrame(tick);
            }

            spring.setTarget = function (val) {
                spring.target = val;
                spring.running = true;
                tick();
            };

            spring.stop = function () {
                spring.running = false;
                if (spring.animId) cancelAnimationFrame(spring.animId);
            };

            const id = Symbol();
            springs.set(id, spring);
            return spring;
        }

        return { create };

    })();

    /* ===== CANVAS DRAG PHYSICS ===== */
    const DragPhysics = (function () {

        const elements = new Map();

        function attach(el, options = {}) {
            const state = {
                el,
                vx: 0, vy: 0,
                lastX: 0, lastY: 0,
                dragging: false,
                friction: options.friction || 0.88,
                animId: null
            };

            function onDown(e) {
                state.dragging = true;
                const t = e.touches ? e.touches[0] : e;
                state.lastX = t.clientX;
                state.lastY = t.clientY;
                state.vx = state.vy = 0;
                if (state.animId) cancelAnimationFrame(state.animId);
                if (e.preventDefault) e.preventDefault();
            }

            function onMove(e) {
                if (!state.dragging) return;
                const t = e.touches ? e.touches[0] : e;
                const dx = t.clientX - state.lastX;
                const dy = t.clientY - state.lastY;
                state.vx = dx;
                state.vy = dy;
                state.lastX = t.clientX;
                state.lastY = t.clientY;

                const rect = el.getBoundingClientRect();
                const newLeft = rect.left + dx;
                const newTop = rect.top + dy;

                el.style.left = Math.max(0, Math.min(
                    window.innerWidth - rect.width, newLeft)) + 'px';
                el.style.top = Math.max(0, Math.min(
                    window.innerHeight - rect.height, newTop)) + 'px';
            }

            function onUp() {
                if (!state.dragging) return;
                state.dragging = false;
                momentum();
            }

            function momentum() {
                state.vx *= state.friction;
                state.vy *= state.friction;

                if (Math.abs(state.vx) < 0.1 &&
                    Math.abs(state.vy) < 0.1) return;

                const rect = el.getBoundingClientRect();
                const newLeft = rect.left + state.vx;
                const newTop = rect.top + state.vy;

                el.style.left = Math.max(0, Math.min(
                    window.innerWidth - rect.width, newLeft)) + 'px';
                el.style.top = Math.max(0, Math.min(
                    window.innerHeight - rect.height, newTop)) + 'px';

                /* Wall bounce */
                if (newLeft <= 0 ||
                    newLeft >= window.innerWidth - rect.width)
                    state.vx *= -0.5;
                if (newTop <= 0 ||
                    newTop >= window.innerHeight - rect.height)
                    state.vy *= -0.5;

                state.animId = requestAnimationFrame(momentum);
            }

            el.addEventListener('mousedown', onDown);
            el.addEventListener('touchstart', onDown, { passive: false });
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('mouseup', onUp);
            document.addEventListener('touchend', onUp);

            elements.set(el, state);
            return state;
        }

        function detach(el) {
            elements.delete(el);
        }

        return { attach, detach };

    })();

    /* ===== INIT ===== */
    function init() {
        /* Create particle overlay canvas */
        const particleCanvas = document.createElement('canvas');
        particleCanvas.id = 'particleCanvas';
        particleCanvas.style.cssText = `
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(particleCanvas);
        ParticleSystem.init(particleCanvas);

        /* Export click → confetti */
        const exportBtn = document.querySelector('.btn-export');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                const rect = exportBtn.getBoundingClientRect();
                ParticleSystem.confetti(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2
                );
            });
        }

        /* Upload drop → spark burst */
        const mainCanvas = document.getElementById('mainCanvas');
        if (mainCanvas) {
            mainCanvas.addEventListener('drop', function (e) {
                const rect = mainCanvas.getBoundingClientRect();
                ParticleSystem.emit(
                    e.clientX, e.clientY, 25,
                    {
                        color: '#00d4ff',
                        speed: 4,
                        gravity: 0.1,
                        type: ParticleSystem.TYPES.SPARK
                    }
                );
            });
        }

        /* AI button → star burst */
        const aiToggle = document.getElementById('aiChatToggle');
        if (aiToggle) {
            aiToggle.addEventListener('click', function () {
                const rect = aiToggle.getBoundingClientRect();
                ParticleSystem.emit(
                    rect.left + rect.width / 2,
                    rect.top + rect.height / 2,
                    15,
                    {
                        color: '#7c3aed',
                        speed: 3,
                        gravity: 0.05,
                        type: ParticleSystem.TYPES.STAR
                    }
                );
            });
        }

        console.log('⚡ Physics Engine Ready!');
    }

    /* ===== PUBLIC API ===== */
    return {
        Particles: ParticleSystem,
        Gravity: GravitySystem,
        Magnetic: MagneticField,
        Waves: WaveSystem,
        Spring: SpringSystem,
        Drag: DragPhysics,
        init
    };

})();

/* ===== GLOBAL EXPORT ===== */
window.PhysicsEngine = PhysicsEngine;

/* ===== AUTO INIT ===== */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PhysicsEngine.init();
    });
} else {
    PhysicsEngine.init();
}
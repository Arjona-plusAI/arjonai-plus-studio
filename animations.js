/* ============================================
   ARJONA +AI STUDIO — ANIMATIONS ENGINE
   Professional Animation System v2.0
   ============================================ */

'use strict';

/* ===== ANIMATION MANAGER ===== */
const AnimationManager = (function () {

    /* --- Active animations registry --- */
    const activeAnims = new Map();
    let animIdCounter = 0;
    let rafId = null;
    let isRunning = false;

    /* --- Easing functions (like big studios use) --- */
    const Ease = {
        linear: t => t,
        easeIn: t => t * t,
        easeOut: t => t * (2 - t),
        easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        spring: t => 1 - Math.cos(t * Math.PI * 4) * Math.pow(1 - t, 2.5),
        bounce: t => {
            if (t < 1 / 2.75) return 7.5625 * t * t;
            if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        },
        elastic: t => {
            if (t === 0 || t === 1) return t;
            return -Math.pow(2, 10 * (t - 1)) *
                Math.sin((t - 1.075) * (2 * Math.PI) / 0.3);
        },
        back: t => {
            const s = 1.70158;
            return t * t * ((s + 1) * t - s);
        },
        backOut: t => {
            const s = 1.70158;
            return --t * t * ((s + 1) * t + s) + 1;
        },
        cubicBezier: (p1x, p1y, p2x, p2y) => {
            /* Returns easing function from cubic bezier */
            return function (t) {
                let x = 0, lo = 0, hi = 1;
                for (let i = 0; i < 8; i++) {
                    x = (lo + hi) / 2;
                    const cx = 3 * p1x * x * (1 - x) * (1 - x) +
                        3 * p2x * x * x * (1 - x) + x * x * x;
                    if (Math.abs(cx - t) < 0.001) break;
                    cx < t ? lo = x : hi = x;
                }
                return 3 * p1y * x * (1 - x) * (1 - x) +
                    3 * p2y * x * x * (1 - x) + x * x * x;
            };
        }
    };

    /* Standard CSS-like easings */
    Ease.standard = Ease.cubicBezier(0.4, 0, 0.2, 1);
    Ease.decelerate = Ease.cubicBezier(0, 0, 0.2, 1);
    Ease.accelerate = Ease.cubicBezier(0.4, 0, 1, 1);
    Ease.sharp = Ease.cubicBezier(0.4, 0, 0.6, 1);

    /* --- RAF loop --- */
    function tick(timestamp) {
        if (!isRunning) return;

        activeAnims.forEach((anim, id) => {
            if (anim.paused) return;

            /* First frame init */
            if (anim.startTime === null) {
                anim.startTime = timestamp;
            }

            const elapsed = timestamp - anim.startTime;
            const delay = anim.delay || 0;

            if (elapsed < delay) return;

            const progress = Math.min(
                (elapsed - delay) / anim.duration, 1
            );
            const eased = anim.easing(progress);

            /* Call update with eased progress */
            try {
                anim.onUpdate(eased, progress);
            } catch (e) {
                console.warn('[Anim] Update error:', e);
                activeAnims.delete(id);
                return;
            }

            /* Handle completion */
            if (progress >= 1) {
                if (anim.loop) {
                    anim.startTime = timestamp - delay;
                } else if (anim.yoyo && !anim._reversed) {
                    anim._reversed = true;
                    const origEasing = anim.easing;
                    anim.easing = t => origEasing(1 - t);
                    anim.startTime = timestamp - delay;
                } else {
                    try {
                        if (anim.onComplete) anim.onComplete();
                    } catch (e) { }
                    activeAnims.delete(id);
                }
            }
        });

        if (activeAnims.size > 0) {
            rafId = requestAnimationFrame(tick);
        } else {
            isRunning = false;
            rafId = null;
        }
    }

    function startLoop() {
        if (!isRunning) {
            isRunning = true;
            rafId = requestAnimationFrame(tick);
        }
    }

    /* ===== PUBLIC API ===== */
    return {

        Ease,

        /* --- Core animate function --- */
        animate(options) {
            const id = ++animIdCounter;
            const anim = {
                id,
                duration: options.duration || 400,
                delay: options.delay || 0,
                easing: options.easing || Ease.standard,
                onUpdate: options.onUpdate || (() => { }),
                onComplete: options.onComplete || null,
                loop: options.loop || false,
                yoyo: options.yoyo || false,
                paused: options.paused || false,
                startTime: null,
                _reversed: false
            };

            activeAnims.set(id, anim);
            startLoop();

            return {
                id,
                pause() { anim.paused = true; },
                resume() { anim.paused = false; startLoop(); },
                stop() {
                    activeAnims.delete(id);
                    if (anim.onComplete) anim.onComplete();
                },
                cancel() { activeAnims.delete(id); }
            };
        },

        /* --- Tween: animate numeric properties --- */
        tween(target, props, options = {}) {
            const startVals = {};
            const endVals = {};

            Object.keys(props).forEach(key => {
                startVals[key] = parseFloat(target[key]) || 0;
                endVals[key] = props[key];
            });

            return this.animate({
                ...options,
                onUpdate(t) {
                    Object.keys(props).forEach(key => {
                        target[key] = startVals[key] +
                            (endVals[key] - startVals[key]) * t;
                    });
                    if (options.onUpdate) options.onUpdate(t, target);
                }
            });
        },

        /* --- DOM element animations --- */
        fadeIn(el, duration = 300, delay = 0) {
            if (!el) return;
            el.style.opacity = '0';
            el.style.display = el._displayType || 'block';
            return this.animate({
                duration, delay,
                easing: this.Ease.decelerate,
                onUpdate: t => { el.style.opacity = t; }
            });
        },

        fadeOut(el, duration = 250, onDone) {
            if (!el) return;
            return this.animate({
                duration,
                easing: this.Ease.accelerate,
                onUpdate: t => { el.style.opacity = 1 - t; },
                onComplete: () => {
                    el.style.display = 'none';
                    el.style.opacity = '';
                    if (onDone) onDone();
                }
            });
        },

        slideUp(el, duration = 320) {
            if (!el) return;
            el.style.transform = 'translateY(30px)';
            el.style.opacity = '0';
            el.style.display = el._displayType || 'flex';
            return this.animate({
                duration,
                easing: this.Ease.decelerate,
                onUpdate: t => {
                    el.style.transform = `translateY(${30 * (1 - t)}px)`;
                    el.style.opacity = t;
                }
            });
        },

        slideDown(el, duration = 260, onDone) {
            if (!el) return;
            return this.animate({
                duration,
                easing: this.Ease.accelerate,
                onUpdate: t => {
                    el.style.transform = `translateY(${30 * t}px)`;
                    el.style.opacity = 1 - t;
                },
                onComplete: () => {
                    el.style.display = 'none';
                    el.style.transform = '';
                    el.style.opacity = '';
                    if (onDone) onDone();
                }
            });
        },

        /* --- Scale pop effect (button click feedback) --- */
        pop(el, scale = 1.12, duration = 280) {
            if (!el) return;
            return this.animate({
                duration,
                easing: this.Ease.spring,
                onUpdate: t => {
                    const s = 1 + (scale - 1) * Math.sin(t * Math.PI);
                    el.style.transform = `scale(${s})`;
                },
                onComplete: () => {
                    el.style.transform = '';
                }
            });
        },

        /* --- Shake (for errors) --- */
        shake(el, intensity = 8, duration = 400) {
            if (!el) return;
            return this.animate({
                duration,
                easing: this.Ease.linear,
                onUpdate: t => {
                    const osc = Math.sin(t * Math.PI * 7) *
                        intensity * (1 - t);
                    el.style.transform = `translateX(${osc}px)`;
                },
                onComplete: () => {
                    el.style.transform = '';
                }
            });
        },

        /* --- Pulse glow (for attention) --- */
        pulse(el, options = {}) {
            if (!el) return;
            const color = options.color || 'var(--ac)';
            const intensity = options.intensity || 20;
            return this.animate({
                duration: options.duration || 1200,
                loop: true,
                easing: this.Ease.easeInOut,
                onUpdate: t => {
                    const osc = Math.sin(t * Math.PI);
                    el.style.boxShadow =
                        `0 0 ${intensity * osc}px ${color}`;
                }
            });
        },

        /* --- Typewriter effect --- */
        typewriter(el, text, options = {}) {
            if (!el) return;
            const speed = options.speed || 40;
            const duration = text.length * speed;
            el.textContent = '';
            return this.animate({
                duration,
                easing: this.Ease.linear,
                onUpdate: t => {
                    const count = Math.floor(t * text.length);
                    el.textContent = text.substring(0, count) +
                        (t < 1 && options.cursor ? '|' : '');
                },
                onComplete: () => {
                    el.textContent = text;
                    if (options.onComplete) options.onComplete();
                }
            });
        },

        /* --- Number counter animation --- */
        countUp(el, from, to, options = {}) {
            if (!el) return;
            const decimals = options.decimals || 0;
            const suffix = options.suffix || '';
            const prefix = options.prefix || '';
            return this.animate({
                duration: options.duration || 1000,
                easing: options.easing || this.Ease.easeOut,
                onUpdate: t => {
                    const val = from + (to - from) * t;
                    el.textContent = prefix +
                        val.toFixed(decimals) + suffix;
                }
            });
        },

        /* --- Stagger: animate multiple elements with delay --- */
        stagger(elements, animFn, staggerDelay = 80) {
            const handles = [];
            Array.from(elements).forEach((el, i) => {
                const handle = animFn(el, i * staggerDelay);
                if (handle) handles.push(handle);
            });
            return {
                stop: () => handles.forEach(h => h.stop()),
                cancel: () => handles.forEach(h => h.cancel())
            };
        },

        /* --- Stop all animations --- */
        stopAll() {
            activeAnims.clear();
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            isRunning = false;
        },

        /* --- Stop specific animation --- */
        stop(id) {
            activeAnims.delete(id);
        },

        /* --- Get active count (for debug) --- */
        get activeCount() {
            return activeAnims.size;
        }
    };

})();

/* ============================================
   UI TRANSITION EFFECTS
   ============================================ */

const UIAnimations = (function () {

    const AM = AnimationManager;

    /* --- Toast notification system --- */
    let toastContainer = null;

    function getToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.style.cssText = `
                position: fixed;
                top: 54px;
                right: 16px;
                z-index: 999999;
                display: flex;
                flex-direction: column;
                gap: 8px;
                pointer-events: none;
                max-width: 320px;
            `;
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }

    function showToast(message, type = 'info', duration = 3000) {
        const container = getToastContainer();

        const colors = {
            info: { bg: 'var(--sf2)', bd: 'var(--ac)', ic: 'ℹ️' },
            success: { bg: 'var(--sf2)', bd: 'var(--ac3)', ic: '✅' },
            error: { bg: 'var(--dn-bg)', bd: 'var(--dn)', ic: '❌' },
            warning: { bg: 'var(--sf2)', bd: '#f59e0b', ic: '⚠️' },
            ai: { bg: 'var(--sf2)', bd: 'var(--ac2)', ic: '✦' }
        };

        const c = colors[type] || colors.info;
        const toast = document.createElement('div');
        toast.style.cssText = `
            background: ${c.bg};
            border: 1px solid ${c.bd};
            border-radius: 12px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 12px;
            font-weight: 600;
            color: var(--tx);
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            opacity: 0;
            transform: translateX(40px) scale(0.92);
            pointer-events: all;
            cursor: pointer;
            backdrop-filter: blur(10px);
            transition: transform 0.2s, opacity 0.2s;
            max-width: 100%;
            word-break: break-word;
        `;

        const icon = document.createElement('span');
        icon.style.cssText = 'font-size:16px;flex-shrink:0';
        icon.textContent = c.ic;

        const text = document.createElement('span');
        text.style.cssText = 'flex:1;line-height:1.4';
        text.textContent = message;

        const close = document.createElement('span');
        close.style.cssText = `
            flex-shrink:0;cursor:pointer;
            opacity:0.5;font-size:14px;
            padding: 2px 4px;
            transition: opacity 0.2s;
        `;
        close.textContent = '✕';
        close.onmouseenter = () => close.style.opacity = '1';
        close.onmouseleave = () => close.style.opacity = '0.5';

        toast.appendChild(icon);
        toast.appendChild(text);
        toast.appendChild(close);
        container.appendChild(toast);

        /* Animate in */
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0) scale(1)';
        });

        function dismiss() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px) scale(0.92)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 250);
        }

        toast.onclick = dismiss;
        close.onclick = dismiss;
        if (duration > 0) setTimeout(dismiss, duration);

        return { dismiss };
    }

    /* --- Progress bar animation --- */
    function showProgress(label = 'Processing...', color = 'var(--ac)') {
        let overlay = document.getElementById('progressOverlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'progressOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0; left: 0; right: 0;
                height: 3px;
                z-index: 999998;
                background: transparent;
                pointer-events: none;
            `;

            const bar = document.createElement('div');
            bar.id = 'progressBar';
            bar.style.cssText = `
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg,
                    ${color}, var(--ac2));
                border-radius: 0 3px 3px 0;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px ${color};
            `;

            overlay.appendChild(bar);
            document.body.appendChild(overlay);
        }

        const bar = document.getElementById('progressBar');
        let progress = 0;
        let done = false;

        /* Fake progress that slows near 90% */
        const interval = setInterval(() => {
            if (done) return;
            if (progress < 90) {
                progress += Math.random() * 12;
                if (progress > 90) progress = 90;
                bar.style.width = progress + '%';
            }
        }, 200);

        return {
            complete(delay = 300) {
                done = true;
                clearInterval(interval);
                bar.style.width = '100%';
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.4s';
                    setTimeout(() => {
                        bar.style.width = '0%';
                        overlay.style.opacity = '1';
                        overlay.style.transition = '';
                    }, 400);
                }, delay);
            },
            setProgress(val) {
                progress = Math.min(100, Math.max(0, val));
                bar.style.width = progress + '%';
            }
        };
    }

    /* --- Skeleton loader --- */
    function createSkeleton(width, height, radius = 8) {
        const el = document.createElement('div');
        el.style.cssText = `
            width: ${width};
            height: ${height};
            border-radius: ${radius}px;
            background: linear-gradient(
                90deg,
                var(--sf2) 25%,
                var(--sf3) 50%,
                var(--sf2) 75%
            );
            background-size: 200% 100%;
            animation: skeletonShimmer 1.5s infinite;
        `;
        el.className = 'skeleton-loader';
        return el;
    }

    /* Inject skeleton shimmer CSS once */
    if (!document.getElementById('skeletonCSS')) {
        const style = document.createElement('style');
        style.id = 'skeletonCSS';
        style.textContent = `
            @keyframes skeletonShimmer {
                0%   { background-position: -200% 0; }
                100% { background-position:  200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    /* --- Ripple effect on click --- */
    function addRipple(el, color = 'rgba(0,212,255,0.25)') {
        if (!el) return;
        el.style.position = 'relative';
        el.style.overflow = 'hidden';

        el.addEventListener('click', function (e) {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const size = Math.max(rect.width, rect.height) * 2;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: ${color};
                width: ${size}px;
                height: ${size}px;
                left: ${x - size / 2}px;
                top: ${y - size / 2}px;
                transform: scale(0);
                animation: rippleAnim 0.5s ease-out forwards;
                pointer-events: none;
                z-index: 0;
            `;
            el.appendChild(ripple);
            setTimeout(() => {
                if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
            }, 550);
        });

        /* Inject ripple CSS once */
        if (!document.getElementById('rippleCSS')) {
            const style = document.createElement('style');
            style.id = 'rippleCSS';
            style.textContent = `
                @keyframes rippleAnim {
                    to {
                        transform: scale(1);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /* --- Apply ripples to all buttons --- */
    function initRipples() {
        const selectors = [
            '.tb-btn', '.btn-export', '.btn-primary-full',
            '.btn-ghost-full', '.mob-gen-btn', '.sheet-action-btn',
            '.sheet-primary-btn', '.pixart-btn', '.gp', '.qt-btn',
            '.bg-rm-btn', '.grade-preset-btn', '.mode-btn'
        ];
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                addRipple(el);
            });
        });
    }

    /* --- Smooth panel transitions --- */
    function transitionPanel(fromEl, toEl, direction = 'left') {
        if (!fromEl || !toEl) return;

        const exitX = direction === 'left' ? '-20px' : '20px';
        const enterX = direction === 'left' ? '20px' : '-20px';

        fromEl.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        fromEl.style.opacity = '0';
        fromEl.style.transform = `translateX(${exitX})`;

        setTimeout(() => {
            fromEl.classList.remove('active');
            fromEl.style.cssText = '';

            toEl.style.opacity = '0';
            toEl.style.transform = `translateX(${enterX})`;
            toEl.classList.add('active');

            requestAnimationFrame(() => {
                toEl.style.transition = 'opacity 0.22s ease, transform 0.22s ease';
                toEl.style.opacity = '1';
                toEl.style.transform = 'translateX(0)';

                setTimeout(() => {
                    toEl.style.cssText = '';
                }, 240);
            });
        }, 180);
    }

    /* --- Canvas flash effect (on export/save) --- */
    function canvasFlash(canvas) {
        if (!canvas) return;
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            inset: 0;
            background: rgba(255,255,255,0.85);
            border-radius: 4px;
            pointer-events: none;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.1s ease;
        `;
        const parent = canvas.parentNode;
        if (!parent) return;
        parent.appendChild(flash);

        requestAnimationFrame(() => {
            flash.style.opacity = '1';
            setTimeout(() => {
                flash.style.opacity = '0';
                flash.style.transition = 'opacity 0.4s ease';
                setTimeout(() => {
                    if (flash.parentNode) flash.parentNode.removeChild(flash);
                }, 420);
            }, 80);
        });
    }

    /* --- Logo animation on load --- */
    function animateLogo() {
        const logo = document.querySelector('.logo');
        if (!logo) return;

        logo.style.transform = 'scale(0) rotate(-180deg)';
        logo.style.opacity = '0';

        AM.animate({
            duration: 700,
            delay: 200,
            easing: AM.Ease.backOut,
            onUpdate: t => {
                const scale = t;
                const rotate = -180 * (1 - t);
                logo.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
                logo.style.opacity = Math.min(1, t * 2);
            },
            onComplete: () => {
                logo.style.transform = '';
                logo.style.opacity = '';
            }
        });
    }

    /* --- Stagger toolbar buttons on load --- */
    function animateToolbar() {
        const buttons = document.querySelectorAll('.tb-btn, .btn-export');
        AM.stagger(buttons, (el, delay) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-10px)';
            return AM.animate({
                duration: 400,
                delay,
                easing: AM.Ease.backOut,
                onUpdate: t => {
                    el.style.opacity = t;
                    el.style.transform = `translateY(${-10 * (1 - t)}px)`;
                },
                onComplete: () => {
                    el.style.opacity = '';
                    el.style.transform = '';
                }
            });
        }, 60);
    }

    /* --- Sidebar slide in --- */
    function animateSidebar() {
        const sb = document.getElementById('leftSidebar');
        if (!sb) return;

        sb.style.transform = 'translateX(-100%)';
        sb.style.opacity = '0';

        AM.animate({
            duration: 500,
            delay: 100,
            easing: AM.Ease.decelerate,
            onUpdate: t => {
                sb.style.transform = `translateX(${-100 * (1 - t)}%)`;
                sb.style.opacity = t;
            },
            onComplete: () => {
                sb.style.transform = '';
                sb.style.opacity = '';
            }
        });
    }

    /* --- Canvas appear animation --- */
    function animateCanvas() {
        const canvas = document.getElementById('mainCanvas');
        if (!canvas) return;

        canvas.style.opacity = '0';
        canvas.style.transform = 'scale(0.94)';

        AM.animate({
            duration: 600,
            delay: 300,
            easing: AM.Ease.decelerate,
            onUpdate: t => {
                canvas.style.opacity = t;
                canvas.style.transform = `scale(${0.94 + 0.06 * t})`;
            },
            onComplete: () => {
                canvas.style.opacity = '';
                canvas.style.transform = '';
            }
        });
    }

    /* --- Bottom panel slide up --- */
    function animateBottomPanel() {
        const bp = document.getElementById('bottomPanel');
        if (!bp) return;

        const h = bp.offsetHeight || 180;
        bp.style.transform = `translateY(${h}px)`;
        bp.style.opacity = '0';

        AM.animate({
            duration: 450,
            delay: 200,
            easing: AM.Ease.decelerate,
            onUpdate: t => {
                bp.style.transform = `translateY(${h * (1 - t)}px)`;
                bp.style.opacity = t;
            },
            onComplete: () => {
                bp.style.transform = '';
                bp.style.opacity = '';
            }
        });
    }

    /* --- AI chat toggle pulse --- */
    function pulseAIToggle() {
        const btn = document.getElementById('aiChatToggle');
        if (!btn) return;
        AM.animate({
            duration: 2000,
            loop: true,
            easing: AM.Ease.easeInOut,
            onUpdate: t => {
                const osc = Math.sin(t * Math.PI * 2);
                const s = 1 + osc * 0.06;
                btn.style.transform =
                    `scale(${s})`;
                btn.style.boxShadow =
                    `0 0 ${10 + osc * 14}px var(--ac),
                     0 4px 18px var(--glo)`;
            }
        });
    }

    /* --- Loading dots animation --- */
    function animateLoadingDots(containerEl) {
        if (!containerEl) return;
        const dots = containerEl.querySelectorAll('.typing-dot');
        if (!dots.length) return;

        return AM.animate({
            duration: 1200,
            loop: true,
            easing: AM.Ease.linear,
            onUpdate: t => {
                dots.forEach((dot, i) => {
                    const phase = (t + i * 0.33) % 1;
                    const bounce = Math.sin(phase * Math.PI);
                    dot.style.transform =
                        `translateY(${-5 * bounce}px) scale(${0.8 + 0.4 * bounce})`;
                    dot.style.opacity = 0.4 + 0.6 * bounce;
                });
            }
        });
    }

    /* --- Success animation --- */
    function showSuccess(message = 'Done!') {
        showToast(message, 'success');
        const btn = document.querySelector('.btn-export');
        if (btn) AM.pop(btn, 1.15, 300);
    }

    /* --- Error animation --- */
    function showError(el, message = 'Error occurred') {
        showToast(message, 'error');
        if (el) AM.shake(el);
    }

    /* --- Init all UI animations --- */
    function initAll() {
        animateLogo();
        animateToolbar();
        animateSidebar();
        animateCanvas();
        animateBottomPanel();
        pulseAIToggle();
        initRipples();
    }

    return {
        /* Animation Manager */
        AM,

        /* Toast */
        toast: showToast,

        /* Progress */
        progress: showProgress,

        /* Skeleton */
        skeleton: createSkeleton,

        /* Ripple */
        ripple: addRipple,
        initRipples,

        /* Panel transitions */
        transitionPanel,

        /* Canvas */
        canvasFlash,

        /* Specific UI */
        animateLogo,
        animateToolbar,
        animateSidebar,
        animateCanvas,
        animateBottomPanel,
        pulseAIToggle,
        animateLoadingDots,

        /* Feedback */
        showSuccess,
        showError,

        /* Init everything */
        initAll
    };

})();

/* ============================================
   CANVAS ANIMATIONS — for visual effects
   ============================================ */

const CanvasAnimations = (function () {

    const AM = AnimationManager;

    /* --- Animated selection border --- */
    let selectionAnimId = null;
    let selectionPhase = 0;

    function startSelectionAnim(canvas, ctx, getSelEl) {
        if (selectionAnimId) cancelAnimationFrame(selectionAnimId);

        function drawSelection() {
            const el = getSelEl();
            if (!el) {
                selectionAnimId = requestAnimationFrame(drawSelection);
                return;
            }

            selectionPhase = (selectionPhase + 0.5) % 20;
            ctx.save();
            ctx.setLineDash([6, 3]);
            ctx.lineDashOffset = -selectionPhase;
            ctx.strokeStyle = '#00d4ff';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#00d4ff';
            ctx.shadowBlur = 12;

            if (el.type === 'image' && el.content && el.content.complete) {
                const w = el.content.width * (el.scale / 100);
                const h = el.content.height * (el.scale / 100);
                ctx.save();
                ctx.translate(el.x + w / 2, el.y + h / 2);
                ctx.rotate((el.rotate || 0) * Math.PI / 180);
                ctx.strokeRect(-w / 2 - 5, -h / 2 - 5, w + 10, h + 10);
                ctx.restore();
            } else if (el.type === 'text') {
                ctx.font = `bold ${Math.max(el.scale * .6, 8)}px "${el.font || 'Arial'}"`;
                const tw = ctx.measureText(el.text || '').width;
                const th = el.scale * 0.75;
                ctx.save();
                ctx.translate(el.x, el.y);
                ctx.rotate((el.rotate || 0) * Math.PI / 180);
                ctx.strokeRect(-tw / 2 - 10, -th / 2 - 8, tw + 20, th + 16);
                ctx.restore();
            }

            ctx.restore();
            selectionAnimId = requestAnimationFrame(drawSelection);
        }

        drawSelection();
    }

    function stopSelectionAnim() {
        if (selectionAnimId) {
            cancelAnimationFrame(selectionAnimId);
            selectionAnimId = null;
        }
    }

    /* --- Particle burst on image drop --- */
    function particleBurst(canvas, x, y, color = '#00d4ff') {
        const particles = [];
        const count = 18;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                life: 1
            });
        }

        return AM.animate({
            duration: 800,
            easing: AM.Ease.easeOut,
            onUpdate: t => {
                const ctx = canvas.getContext('2d');
                particles.forEach(p => {
                    p.x += p.vx * (1 - t);
                    p.y += p.vy * (1 - t);
                    p.life = 1 - t;

                    ctx.save();
                    ctx.globalAlpha = p.life * 0.8;
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
            }
        });
    }

    /* --- Smooth zoom to fit --- */
    function smoothZoomCanvas(canvasEl, fromScale, toScale, duration = 400) {
        return AM.animate({
            duration,
            easing: AM.Ease.spring,
            onUpdate: t => {
                const s = fromScale + (toScale - fromScale) * t;
                canvasEl.style.transform = `scale(${s})`;
            },
            onComplete: () => {
                canvasEl.style.transform = '';
            }
        });
    }

    return {
        startSelectionAnim,
        stopSelectionAnim,
        particleBurst,
        smoothZoomCanvas
    };

})();

/* ============================================
   MICRO INTERACTIONS
   ============================================ */

const MicroInteractions = (function () {

    /* --- Hover lift effect --- */
    function addHoverLift(el, amount = 3) {
        if (!el) return;
        el.addEventListener('mouseenter', () => {
            el.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            el.style.transform = `translateY(-${amount}px)`;
            el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
            el.style.boxShadow = '';
        });
    }

    /* --- Tilt effect (3D card feel) --- */
    function addTilt(el, intensity = 10) {
        if (!el) return;
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const rx = (e.clientY - cy) / (rect.height / 2);
            const ry = (e.clientX - cx) / (rect.width / 2);
            el.style.transform =
                `perspective(400px) rotateX(${-rx * intensity}deg) rotateY(${ry * intensity}deg)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.4s ease';
            el.style.transform = '';
            setTimeout(() => { el.style.transition = ''; }, 400);
        });
    }

    /* --- Magnetic button effect --- */
    function addMagnetic(el, strength = 0.35) {
        if (!el) return;
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            el.style.transition = 'transform 0.15s ease';
            el.style.transform =
                `translate(${dx * strength}px, ${dy * strength}px)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
            el.style.transform = '';
        });
    }

    /* --- Init all micro interactions --- */
    function initAll() {
        /* Hover lift on cards */
        document.querySelectorAll('.help-card, .hist-item').forEach(el => {
            addHoverLift(el, 2);
        });

        /* Magnetic effect on export button */
        const exportBtn = document.querySelector('.btn-export');
        if (exportBtn) addMagnetic(exportBtn, 0.25);

        /* Magnetic on AI toggle */
        const aiBtn = document.getElementById('aiChatToggle');
        if (aiBtn) addMagnetic(aiBtn, 0.3);
    }

    return {
        addHoverLift,
        addTilt,
        addMagnetic,
        initAll
    };

})();

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */

const ScrollAnimations = (function () {

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const anim = el.dataset.scrollAnim || 'fadeUp';
                el.classList.add('anim-' + anim + '-done');
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.15 });

    function observe(selector, animType = 'fadeUp') {
        document.querySelectorAll(selector).forEach(el => {
            el.dataset.scrollAnim = animType;
            el.classList.add('scroll-anim');
            observer.observe(el);
        });
    }

    /* Inject scroll animation CSS */
    if (!document.getElementById('scrollAnimCSS')) {
        const style = document.createElement('style');
        style.id = 'scrollAnimCSS';
        style.textContent = `
            .scroll-anim {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.5s ease, transform 0.5s ease;
            }
            .anim-fadeUp-done {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            .anim-fadeIn-done {
                opacity: 1 !important;
            }
            .anim-scaleIn-done {
                opacity: 1 !important;
                transform: scale(1) !important;
            }
        `;
        document.head.appendChild(style);
    }

    return { observe };

})();

/* ============================================
   GLOBAL EXPORT
   ============================================ */

window.AnimationManager = AnimationManager;
window.UIAnimations = UIAnimations;
window.CanvasAnimations = CanvasAnimations;
window.MicroInteractions = MicroInteractions;
window.ScrollAnimations = ScrollAnimations;

/* Quick helper shortcuts */
window.toast = UIAnimations.toast.bind(UIAnimations);
window.showOK = UIAnimations.showSuccess.bind(UIAnimations);
window.showERR = UIAnimations.showError.bind(UIAnimations);
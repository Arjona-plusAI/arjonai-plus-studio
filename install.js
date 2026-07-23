/* ============================================
   ARJONA +AI STUDIO — INSTALL MANAGER
   PWA Install Handler (Cleaned)
   ============================================ */

'use strict';

/* ===== APK DOWNLOAD FUNCTION ===== */
function downloadAPK() {
    var link = document.createElement('a');
    link.href = './ArjonaAI.apk';
    link.download = 'ArjonaAI.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(function () {
        if (window.showToastSafe) {
            showToastSafe('APK downloading! Install after download.', 'success', 5000);
        } else {
            alert('APK downloading! Open file to install.');
        }
    }, 500);
}
window.downloadAPK = downloadAPK;

/* ===== INSTALL MANAGER ===== */
const InstallManager = (function () {

    let deferredPrompt = null;
    let isInstalled = false;
    let bannerShown = false;

    /* ===== DETECT PLATFORM ===== */
    function detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        return {
            isIOS: /iphone|ipad|ipod/.test(ua),
            isAndroid: /android/.test(ua),
            isMac: /macintosh/.test(ua),
            isWindows: /windows/.test(ua),
            isChrome: /chrome/.test(ua),
            isSafari: /safari/.test(ua) && !/chrome/.test(ua),
            isFirefox: /firefox/.test(ua),
            isMobile: /mobile|tablet/.test(ua),
            isPWA: window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true
        };
    }

    /* ===== CHECK IF ALREADY INSTALLED ===== */
    function checkInstalled() {
        const platform = detectPlatform();
        if (platform.isPWA) {
            isInstalled = true;
            console.log('Running as PWA/App');
            return true;
        }
        return false;
    }

    /* ===== CREATE INSTALL BANNER ===== */
    function createInstallBanner() {
        const existing = document.getElementById('installBanner');
        if (existing) existing.remove();

        const platform = detectPlatform();
        const banner = document.createElement('div');
        banner.id = 'installBanner';
        banner.style.cssText = `
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%) translateY(100px);
            z-index: 999999; width: min(400px, calc(100vw - 32px));
            background: var(--sf); border: 1px solid var(--ac);
            border-radius: 20px; padding: 16px 18px;
            display: flex; align-items: center; gap: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(127,61,255,0.1);
            backdrop-filter: blur(20px);
            transition: transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease;
            opacity: 0;
        `;

        const icon = document.createElement('div');
        icon.style.cssText = `
            width: 52px; height: 52px; border-radius: 14px;
            background: linear-gradient(135deg, #00C6FF, #7F3DFF);
            display: flex; align-items: center; justify-content: center;
            font-size: 24px; font-weight: 900; color: #fff;
            flex-shrink: 0; box-shadow: 0 4px 14px rgba(127,61,255,0.3);
        `;
        icon.textContent = 'A';

        const content = document.createElement('div');
        content.style.cssText = 'flex: 1; min-width: 0;';

        const title = document.createElement('div');
        title.style.cssText = `font-size: 14px; font-weight: 800; color: var(--tx); margin-bottom: 3px;`;
        title.textContent = 'Install Arjona AI Studio';

        const subtitle = document.createElement('div');
        subtitle.style.cssText = `font-size: 11px; color: var(--tx2); line-height: 1.4;`;
        if (platform.isIOS) {
            subtitle.innerHTML = 'Tap <b>Share</b> then <b>"Add to Home Screen"</b>';
        } else if (platform.isAndroid) {
            subtitle.textContent = 'Install as app — No Play Store needed!';
        } else if (platform.isWindows || platform.isMac) {
            subtitle.textContent = 'Install as desktop app — Works offline!';
        } else {
            subtitle.textContent = 'Install for best experience!';
        }

        content.appendChild(title);
        content.appendChild(subtitle);

        const btnWrap = document.createElement('div');
        btnWrap.style.cssText = `display: flex; flex-direction: column; gap: 6px; flex-shrink: 0;`;

        const installBtn = document.createElement('button');
        installBtn.style.cssText = `
            min-height: 36px; padding: 0 16px; border-radius: 999px;
            background: linear-gradient(135deg, #00C6FF, #7F3DFF);
            border: none; color: #fff; font-size: 12px; font-weight: 800;
            cursor: pointer; white-space: nowrap;
            box-shadow: 0 3px 12px rgba(127,61,255,0.3);
            transition: transform 0.2s, box-shadow 0.2s;
        `;
        installBtn.textContent = '⬇ Install';

        const laterBtn = document.createElement('button');
        laterBtn.style.cssText = `
            min-height: 28px; padding: 0 10px; border-radius: 999px;
            background: transparent; border: 1px solid var(--bd2);
            color: var(--tx3); font-size: 10px; font-weight: 600;
            cursor: pointer; white-space: nowrap; transition: all 0.2s;
        `;
        laterBtn.textContent = 'Later';

        btnWrap.appendChild(installBtn);
        btnWrap.appendChild(laterBtn);

        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            position: absolute; top: 10px; right: 10px;
            width: 24px; height: 24px; border-radius: 50%;
            border: none; background: var(--glass); color: var(--tx3);
            font-size: 12px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
        `;
        closeBtn.textContent = '✕';
        banner.style.position = 'fixed';

        banner.appendChild(icon);
        banner.appendChild(content);
        banner.appendChild(btnWrap);
        banner.appendChild(closeBtn);
        document.body.appendChild(banner);

        requestAnimationFrame(() => {
            setTimeout(() => {
                banner.style.transform = 'translateX(-50%) translateY(0)';
                banner.style.opacity = '1';
            }, 100);
        });

        installBtn.addEventListener('click', async () => {
            if (platform.isIOS) {
                showIOSGuide();
                hideBanner(banner);
                return;
            }
            if (deferredPrompt) {
                try {
                    deferredPrompt.prompt();
                    const result = await deferredPrompt.userChoice;
                    if (result.outcome === 'accepted') {
                        console.log('PWA Installed!');
                        isInstalled = true;
                        hideBanner(banner);
                        showInstallSuccess();
                        try { localStorage.setItem('pwa_installed', 'true'); } catch (e) { }
                    }
                    deferredPrompt = null;
                } catch (e) {
                    console.warn('Install error:', e);
                }
            } else {
                showInstallGuide(platform);
            }
        });

        laterBtn.addEventListener('click', () => {
            hideBanner(banner);
            try { localStorage.setItem('install_dismissed', Date.now().toString()); } catch (e) { }
        });

        closeBtn.addEventListener('click', () => { hideBanner(banner); });

        installBtn.addEventListener('mouseenter', () => {
            installBtn.style.transform = 'scale(1.05)';
            installBtn.style.boxShadow = '0 6px 20px rgba(127,61,255,0.4)';
        });
        installBtn.addEventListener('mouseleave', () => {
            installBtn.style.transform = '';
            installBtn.style.boxShadow = '0 3px 12px rgba(127,61,255,0.3)';
        });

        bannerShown = true;
        return banner;
    }

    function hideBanner(banner) {
        if (!banner) return;
        banner.style.transform = 'translateX(-50%) translateY(100px)';
        banner.style.opacity = '0';
        setTimeout(() => {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
        }, 400);
    }

    /* ===== IOS GUIDE ===== */
    function showIOSGuide() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999999;
            background: rgba(0,0,0,0.8); backdrop-filter: blur(10px);
            display: flex; align-items: flex-end; justify-content: center;
            padding: 20px; animation: fadeIn 0.3s ease;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            width: 100%; max-width: 400px; background: var(--sf);
            border-radius: 24px; padding: 24px; text-align: center;
            margin-bottom: 40px;
        `;
        box.innerHTML = `
            <div style="font-size:40px;margin-bottom:12px">📱</div>
            <div style="font-size:18px;font-weight:900;color:var(--tx);margin-bottom:8px">
                Install on iPhone/iPad
            </div>
            <div style="font-size:13px;color:var(--tx2);line-height:1.6;margin-bottom:20px">
                Follow these steps to install Arjona AI Studio on your home screen:
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:20px;text-align:left">
                <div style="display:flex;align-items:center;gap:12px;background:var(--sf2);padding:12px;border-radius:12px">
                    <div style="font-size:24px">1️⃣</div>
                    <div>
                        <div style="font-size:12px;font-weight:700;color:var(--tx)">Tap Share Button</div>
                        <div style="font-size:11px;color:var(--tx2)">Bottom toolbar me Share <b>⬆</b> icon tap karo</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:var(--sf2);padding:12px;border-radius:12px">
                    <div style="font-size:24px">2️⃣</div>
                    <div>
                        <div style="font-size:12px;font-weight:700;color:var(--tx)">Add to Home Screen</div>
                        <div style="font-size:11px;color:var(--tx2)">Scroll down aur <b>"Add to Home Screen"</b> tap karo</div>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:12px;background:var(--sf2);padding:12px;border-radius:12px">
                    <div style="font-size:24px">3️⃣</div>
                    <div>
                        <div style="font-size:12px;font-weight:700;color:var(--tx)">Tap Add</div>
                        <div style="font-size:11px;color:var(--tx2)">Top right me <b>"Add"</b> tap karo</div>
                    </div>
                </div>
            </div>
            <button onclick="this.closest('[style]').remove()" style="width:100%;min-height:44px;border-radius:999px;background:linear-gradient(135deg,#00C6FF,#7F3DFF);border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer">
                Got it! ✓
            </button>
        `;
        overlay.appendChild(box);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);
    }

    /* ===== INSTALL GUIDE ===== */
    function showInstallGuide(platform) {
        if (window.toast) {
            window.toast('Chrome address bar me Install icon click karo!', 'info', 5000);
        }
    }

    /* ===== INSTALL SUCCESS ===== */
    function showInstallSuccess() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999999;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(10px);
            display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease;
        `;
        const box = document.createElement('div');
        box.style.cssText = `
            background: var(--sf); border: 1px solid var(--ac);
            border-radius: 24px; padding: 32px 28px; text-align: center;
            max-width: 320px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;
        box.innerHTML = `
            <div style="font-size:60px;margin-bottom:16px">🎉</div>
            <div style="font-size:20px;font-weight:900;color:var(--tx);margin-bottom:8px">App Installed!</div>
            <div style="font-size:13px;color:var(--tx2);line-height:1.5;margin-bottom:24px">
                Arjona AI Studio ab tumhare device pe install ho gayi hai!<br>
                Home screen pe icon dhundo! 🚀
            </div>
            <button onclick="this.closest('[style]').remove()" style="width:100%;min-height:44px;border-radius:999px;background:linear-gradient(135deg,#00C6FF,#7F3DFF);border:none;color:#fff;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 16px rgba(127,61,255,0.3)">
                Start Using App! ✦
            </button>
        `;
        overlay.appendChild(box);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        document.body.appendChild(overlay);

        setTimeout(() => {
            if (window.PhysicsEngine && window.PhysicsEngine.Particles) {
                PhysicsEngine.Particles.confetti(window.innerWidth / 2, window.innerHeight / 3);
            }
        }, 300);
    }

    /* ===== DOWNLOAD PAGE BUTTON ===== */
    function createDownloadPage() {
        const btn = document.createElement('button');
        btn.id = 'globalInstallBtn';
        btn.style.cssText = `
            display: none; position: fixed; top: 54px; left: 50%;
            transform: translateX(-50%); z-index: 9000;
            min-height: 36px; padding: 0 20px; border-radius: 999px;
            background: linear-gradient(135deg, #00C6FF, #7F3DFF);
            border: none; color: #fff; font-size: 12px; font-weight: 800;
            cursor: pointer; box-shadow: 0 4px 20px rgba(127,61,255,0.4);
            white-space: nowrap; gap: 8px; align-items: center;
            transition: all 0.3s ease;
        `;
        btn.innerHTML = '⬇ Install App';
        document.body.appendChild(btn);
        btn.addEventListener('click', () => {
            if (deferredPrompt) { deferredPrompt.prompt(); }
            else { createInstallBanner(); }
        });
        return btn;
    }

    /* ===== SHOULD SHOW BANNER ===== */
    function shouldShowBanner() {
        try {
            if (checkInstalled()) return false;
            const dismissed = localStorage.getItem('install_dismissed');
            if (dismissed) {
                const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24);
                if (daysSince < 3) return false;
            }
            if (localStorage.getItem('pwa_installed') === 'true') return false;
        } catch (e) { }
        return true;
    }

    /* ===== INIT ===== */
    function init() {
        const platform = detectPlatform();
        console.log('Platform:', platform);
        console.log('Is PWA:', platform.isPWA);

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js', { scope: './' })
                    .then(reg => {
                        console.log('SW Registered!', reg.scope);
                        reg.addEventListener('updatefound', () => {
                            const newWorker = reg.installing;
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    if (window.toast) {
                                        window.toast('Update available! Refresh karo.', 'info', 5000);
                                    }
                                }
                            });
                        });
                    })
                    .catch(err => { console.warn('SW Error:', err); });
            });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('Install prompt ready!');
            const globalBtn = document.getElementById('globalInstallBtn');
            if (globalBtn) globalBtn.style.display = 'flex';
            if (shouldShowBanner()) {
                setTimeout(() => { createInstallBanner(); }, 5000);
            }
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA Installed!');
            isInstalled = true;
            deferredPrompt = null;
            const globalBtn = document.getElementById('globalInstallBtn');
            if (globalBtn) globalBtn.style.display = 'none';
            showInstallSuccess();
        });

        if (platform.isIOS && !platform.isPWA) {
            if (shouldShowBanner()) {
                setTimeout(() => { createInstallBanner(); }, 4000);
            }
        }

        createDownloadPage();

        if (platform.isPWA) {
            console.log('Running as installed PWA!');
            document.documentElement.classList.add('is-pwa');
        }
    }

    return {
        init,
        install: () => {
            if (deferredPrompt) { deferredPrompt.prompt(); }
            else { createInstallBanner(); }
        },
        showIOSGuide,
        isInstalled: () => isInstalled,
        platform: detectPlatform
    };
})();

/* ===== AUTO INIT ===== */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { InstallManager.init(); });
} else {
    InstallManager.init();
}

/* ===== GLOBAL EXPORT ===== */
window.InstallManager = InstallManager;

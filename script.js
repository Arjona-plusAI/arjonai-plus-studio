/* ============================================
   ARJONA +AI STUDIO — COMPLETE SCRIPT
   Column A + B All Features
   ============================================ */

'use strict';

/* ===== MODULE REFERENCES ===== */
var Anim = window.AnimationManager || null;
var UI = window.UIAnimations || null;
var Physics = window.PhysicsEngine || null;
var API = window.ApiClient || null;

/* ===== BG CANVAS ===== */
var bgC = document.getElementById('bgCanvas');
var bgX = bgC ? bgC.getContext('2d') : null;

function initUniverseBg() {
    if (bgC) { bgC.width = 10; bgC.height = 10; }
}

/* ===== SPLASH SCREEN ===== */
function initSplash() {
    var splash = document.getElementById('splashScreen');
    var fill = document.getElementById('splashFill');
    var txt = document.getElementById('splashTxt');
    if (!splash) return;

    var msgs = ['Loading engine', 'Connecting AI', 'Preparing canvas', 'Ready'];
    var step = 0;

    var interval = setInterval(function () {
        step++;
        if (txt && step < msgs.length) txt.textContent = msgs[step];
        if (fill) fill.style.width = Math.min(100, 25 + step * 25) + '%';
    }, 350);

    setTimeout(function () {
        clearInterval(interval);
        if (fill) fill.style.width = '100%';
        if (txt) txt.textContent = 'Ready';

        setTimeout(function () {
            splash.classList.add('hidden');
            setTimeout(function () {
                if (splash.parentNode) splash.parentNode.removeChild(splash);
            }, 600);
        }, 400);
    }, 1600);
}

/* ===== SAFE WRAPPERS ===== */
function showToastSafe(msg, type, duration) {
    return; // Silent mode
}

function showProgressSafe(label) {
    try {
        if (UI && UI.progress) return UI.progress(label);
    } catch (e) { }
    return { complete: function () { }, setProgress: function () { } };
}

function doShake(el) {
    try {
        if (Anim && Anim.shake) Anim.shake(el);
    } catch (e) { }
}

/* ===== DOWNLOAD FUNCTIONS ===== */
function openDownload() {
    var overlay = document.getElementById('downloadOverlay');
    if (overlay) overlay.style.display = 'flex';
}

function closeDownload() {
    var overlay = document.getElementById('downloadOverlay');
    if (overlay) overlay.style.display = 'none';
}

function installApp(platform) {
    if (platform === 'ios') {
        if (window.InstallManager && InstallManager.showIOSGuide) {
            InstallManager.showIOSGuide();
        }
        closeDownload();
        return;
    }
    if (platform === 'android' || platform === 'desktop') {
        if (window.InstallManager && InstallManager.install) {
            InstallManager.install();
        }
        closeDownload();
        return;
    }
    closeDownload();
}

function downloadAPK() {
    var link = document.createElement('a');
    link.href = '/ArjonaAI.apk';
    link.download = 'ArjonaAI.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.downloadAPK = downloadAPK;

/* ===== NEW: TEMPLATES MODAL (B12) ===== */
function openTemplates() {
    var overlay = document.getElementById('templatesModal');
    if (overlay) {
        overlay.style.display = 'flex';
        loadTemplates('social', document.querySelector('.tpl-tab'));
    }
}

function closeTemplates() {
    var overlay = document.getElementById('templatesModal');
    if (overlay) overlay.style.display = 'none';
}

function loadTemplates(category, btn) {
    var tabs = document.querySelectorAll('.tpl-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    if (btn) btn.classList.add('active');

    var grid = document.getElementById('templatesGrid');
    if (!grid) return;

    var templates = {
        social: [
            { name: 'Instagram Post', size: '1080x1080', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' },
            { name: 'Instagram Story', size: '1080x1920', bg: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
            { name: 'YouTube Thumbnail', size: '1280x720', bg: 'linear-gradient(135deg,#fa709a,#fee140)' },
            { name: 'Facebook Cover', size: '820x312', bg: 'linear-gradient(135deg,#00C6FF,#7F3DFF)' },
            { name: 'Twitter Header', size: '1500x500', bg: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
            { name: 'LinkedIn Banner', size: '1584x396', bg: 'linear-gradient(135deg,#667eea,#764ba2)' }
        ],
        business: [
            { name: 'Business Card', size: '1050x600', bg: '#1a1a1a' },
            { name: 'Letterhead', size: '2480x3508', bg: '#fff' },
            { name: 'Logo Template', size: '1000x1000', bg: 'linear-gradient(135deg,#00C6FF,#7F3DFF)' },
            { name: 'Banner Ad', size: '1200x628', bg: 'linear-gradient(135deg,#ff9a3c,#ff6b35)' }
        ],
        creative: [
            { name: 'Poster', size: '600x900', bg: 'linear-gradient(135deg,#7F3DFF,#00C6FF)' },
            { name: 'Flyer', size: '1080x1620', bg: 'linear-gradient(135deg,#00E5A8,#00C6FF)' },
            { name: 'Wallpaper', size: '1920x1080', bg: 'linear-gradient(135deg,#0f2027,#2c5364)' },
            { name: 'Album Cover', size: '1400x1400', bg: 'linear-gradient(135deg,#f953c6,#b91d73)' }
        ],
        quotes: [
            { name: 'Motivational', size: '1080x1080', bg: 'linear-gradient(135deg,#FFB800,#FF6F00)' },
            { name: 'Minimal Quote', size: '1080x1080', bg: '#fff' },
            { name: 'Dark Quote', size: '1080x1080', bg: '#0D1117' },
            { name: 'Colorful', size: '1080x1080', bg: 'linear-gradient(135deg,#f093fb,#f5576c)' }
        ]
    };

    var items = templates[category] || [];
    grid.innerHTML = '';

    items.forEach(function (tpl) {
        var item = document.createElement('div');
        item.className = 'template-item';
        item.innerHTML = '<div class="tpl-preview" style="background:' + tpl.bg +
            ';color:#fff;font-weight:800">' + tpl.name + '<br><small>' + tpl.size + '</small></div>';
        item.onclick = function () { applyTemplate(tpl); };
        grid.appendChild(item);
    });
}

function applyTemplate(tpl) {
    var size = tpl.size.split('x');
    var w = parseInt(size[0]);
    var h = parseInt(size[1]);
    setupC(w, h);

    if (tpl.bg.indexOf('gradient') >= 0) {
        var match = tpl.bg.match(/#[0-9a-f]+/gi);
        if (match && match.length >= 2) {
            bgCf = { type: 'grad', c1: match[0], c2: match[1], dir: 'diag' };
        }
    } else {
        bgCf = { type: 'solid', color: tpl.bg };
    }
    aiBg = null;
    sH('Template: ' + tpl.name);
    R();
    closeTemplates();
}

/* ===== NEW: PROJECTS (B13) ===== */
function openProjects() {
    var overlay = document.getElementById('projectsModal');
    if (overlay) {
        overlay.style.display = 'flex';
        renderProjectsList();
    }
}

function closeProjects() {
    var overlay = document.getElementById('projectsModal');
    if (overlay) overlay.style.display = 'none';
}

function saveCurrentProject() {
    var nameInp = document.getElementById('projectName');
    var name = (nameInp.value || 'Untitled').trim();
    if (!name) return;

    var projects = getProjects();
    var project = {
        id: 'p' + Date.now(),
        name: name,
        date: new Date().toISOString(),
        data: serS(),
        width: canvas.width,
        height: canvas.height
    };

    projects.push(project);
    try {
        localStorage.setItem('arjona_projects', JSON.stringify(projects));
    } catch (e) {
        alert('Storage full. Delete old projects.');
        return;
    }

    nameInp.value = '';
    renderProjectsList();
}

function getProjects() {
    try {
        return JSON.parse(localStorage.getItem('arjona_projects') || '[]');
    } catch (e) { return []; }
}

function renderProjectsList() {
    var list = document.getElementById('projectsList');
    if (!list) return;

    var projects = getProjects();
    if (projects.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:24px;color:var(--tx3)">No saved projects</div>';
        return;
    }

    list.innerHTML = '';
    projects.slice().reverse().forEach(function (p) {
        var item = document.createElement('div');
        item.className = 'project-item';

        var date = new Date(p.date).toLocaleDateString();
        var initial = p.name.charAt(0).toUpperCase();

        item.innerHTML =
            '<div class="project-thumb">' + initial + '</div>' +
            '<div class="project-info">' +
            '<div class="project-name">' + p.name + '</div>' +
            '<div class="project-date">' + date + ' · ' + p.width + '×' + p.height + '</div>' +
            '</div>' +
            '<div class="project-actions-btns">' +
            '<button class="proj-btn" onclick="loadProject(\'' + p.id + '\')" title="Load">' +
            '<i data-lucide="folder-open"></i></button>' +
            '<button class="proj-btn proj-del" onclick="deleteProject(\'' + p.id + '\')" title="Delete">' +
            '<i data-lucide="trash-2"></i></button>' +
            '</div>';

        list.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function loadProject(id) {
    var projects = getProjects();
    var p = projects.find(function (x) { return x.id === id; });
    if (!p) return;
    setupC(p.width, p.height);
    restS(p.data);
    closeProjects();
}

function deleteProject(id) {
    if (!confirm('Delete this project?')) return;
    var projects = getProjects();
    projects = projects.filter(function (x) { return x.id !== id; });
    try {
        localStorage.setItem('arjona_projects', JSON.stringify(projects));
    } catch (e) { }
    renderProjectsList();
}

/* ===== NEW: LAYERS PANEL (B14) ===== */
function openLayers() {
    var overlay = document.getElementById('layersModal');
    if (overlay) {
        overlay.style.display = 'flex';
        renderLayersPanel();
    }
}

function closeLayers() {
    var overlay = document.getElementById('layersModal');
    if (overlay) overlay.style.display = 'none';
}

function renderLayersPanel() {
    var panel = document.getElementById('layersPanel');
    if (!panel) return;

    if (els.length === 0) {
        panel.innerHTML = '<div style="text-align:center;padding:24px;color:var(--tx3)">No layers</div>';
        return;
    }

    panel.innerHTML = '';
    els.slice().reverse().forEach(function (el, idx) {
        var item = document.createElement('div');
        item.className = 'layer-item' + (el.id === selId ? ' selected' : '');

        var thumbHtml = el.type === 'text'
            ? '<i data-lucide="type" style="width:18px;height:18px"></i>'
            : '<i data-lucide="image" style="width:18px;height:18px"></i>';

        var name = el.type === 'text'
            ? (el.text || '').substring(0, 20)
            : 'Image ' + (els.length - idx);

        item.innerHTML =
            '<div class="layer-thumb">' + thumbHtml + '</div>' +
            '<div class="layer-name">' + name + '</div>' +
            '<div class="layer-controls">' +
            '<button class="layer-ctrl" onclick="selectLayer(\'' + el.id + '\')" title="Select">' +
            '<i data-lucide="mouse-pointer-2"></i></button>' +
            '<button class="layer-ctrl" onclick="deleteLayerById(\'' + el.id + '\')" title="Delete">' +
            '<i data-lucide="trash-2"></i></button>' +
            '</div>';

        panel.appendChild(item);
    });

    if (window.lucide) lucide.createIcons();
}

function selectLayer(id) {
    selId = id;
    R();
    sUI();
    var el = findEl(id);
    if (el) showCornerHandles(el);
    renderLayersPanel();
}

function deleteLayerById(id) {
    var idx = els.findIndex(function (x) { return x.id === id; });
    if (idx !== -1) {
        els.splice(idx, 1);
        if (selId === id) selId = null;
        sH('Delete Layer');
        R();
        sUI();
        renderLayersPanel();
    }
}

/* ===== NEW: EXPORT MODAL (B20) ===== */
function openExport() {
    var overlay = document.getElementById('exportModal');
    if (overlay) overlay.style.display = 'flex';
}

function closeExport() {
    var overlay = document.getElementById('exportModal');
    if (overlay) overlay.style.display = 'none';
}

function exportAs(format) {
    var qualitySlider = document.getElementById('exportQuality');
    var quality = qualitySlider ? parseInt(qualitySlider.value) / 100 : 0.95;

    var savedSel = selId;
    selId = null;
    hideCornerHandles();
    R();

    setTimeout(function () {
        var link = document.createElement('a');
        var filename = 'Arjona_' + Date.now();

        try {
            if (format === 'png') {
                link.download = filename + '.png';
                link.href = canvas.toDataURL('image/png', 1.0);
            } else if (format === 'jpg') {
                link.download = filename + '.jpg';
                link.href = canvas.toDataURL('image/jpeg', quality);
            } else if (format === 'webp') {
                link.download = filename + '.webp';
                link.href = canvas.toDataURL('image/webp', quality);
            } else if (format === 'pdf') {
                link.download = filename + '.png';
                link.href = canvas.toDataURL('image/png', 1.0);
            }

            link.click();
            selId = savedSel;
            R();
            closeExport();
        } catch (e) {
            alert('Export failed: ' + e.message);
        }
    }, 100);
}
/* ============================================
   AI TOOLS (Column A Features)
   ============================================ */

/* ===== A7: AI AUTO ENHANCE ===== */
function aiAutoEnhance() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') {
        alert('Please select an image first');
        return;
    }

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Enhancing...';

    setTimeout(function () {
        try {
            var enhanceSettings = {
                'sg-br': 8, 'sg-ct': 20, 'sg-sa': 15,
                'sg-te': 5, 'sg-vi': 0, 'sg-gr': 0
            };

            for (var key in enhanceSettings) {
                var slider = document.getElementById(key);
                if (slider) slider.value = enhanceSettings[key];
                var mobKey = key.replace('sg-', 'mob-sg-');
                var mobSlider = document.getElementById(mobKey);
                if (mobSlider) mobSlider.value = enhanceSettings[key];
            }

            liveG();
            applyGrade();

            setTimeout(function () {
                applySharpen();
                loader.style.display = 'none';
            }, 500);
        } catch (e) {
            loader.style.display = 'none';
        }
    }, 300);
}

/* ===== A6: AI OBJECT REMOVE ===== */
function aiObjectRemove() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') {
        alert('Please select an image first');
        return;
    }

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Analyzing...';

    var tolInput = document.getElementById('sl-tol');
    var oldTol = tolInput ? tolInput.value : 50;
    if (tolInput) tolInput.value = 80;

    setTimeout(function () {
        bgRemove('smart');
        setTimeout(function () {
            if (tolInput) tolInput.value = oldTol;
            loader.style.display = 'none';
        }, 500);
    }, 300);
}

/* ===== AI CHAT COMMAND HANDLER ===== */
function processAICommand(msg) {
    var low = msg.toLowerCase();

    /* A5: Style Transfer */
    if (low.indexOf('style') >= 0 || low.indexOf('paint') >= 0 ||
        low.indexOf('anime') >= 0 || low.indexOf('cartoon') >= 0) {
        aiStyleTransfer(msg);
        return true;
    }

    /* A9: Sky Replace */
    if (low.indexOf('sky') >= 0 || low.indexOf('sunset') >= 0 ||
        low.indexOf('cloud') >= 0) {
        aiSkyReplace(msg);
        return true;
    }

    /* A8: Portrait Beauty */
    if (low.indexOf('beauty') >= 0 || low.indexOf('face') >= 0 ||
        low.indexOf('portrait') >= 0 || low.indexOf('smooth') >= 0) {
        aiPortraitBeauty();
        return true;
    }

    /* A10: Face Swap */
    if (low.indexOf('face swap') >= 0 || low.indexOf('swap') >= 0) {
        aiFaceSwap();
        return true;
    }

    /* A11: Color Suggest */
    if (low.indexOf('color') >= 0 && (low.indexOf('suggest') >= 0 || low.indexOf('palette') >= 0)) {
        aiColorSuggest();
        return true;
    }

    /* A12: Font Pairing */
    if (low.indexOf('font') >= 0) {
        aiFontPairing();
        return true;
    }

    /* A13: Layout Suggest */
    if (low.indexOf('layout') >= 0 || low.indexOf('arrange') >= 0) {
        aiLayoutSuggest();
        return true;
    }

    /* A15: Smart Resize */
    if (low.indexOf('resize') >= 0) {
        if (low.indexOf('instagram') >= 0) aiSmartResize('instagram');
        else if (low.indexOf('story') >= 0) aiSmartResize('story');
        else if (low.indexOf('youtube') >= 0) aiSmartResize('youtube');
        else if (low.indexOf('facebook') >= 0) aiSmartResize('facebook');
        else aiSmartResize('all');
        return true;
    }

    /* Existing commands */
    if (low.indexOf('enhance') >= 0) { aiAutoEnhance(); return true; }
    if (low.indexOf('add text') >= 0) { addText(); return true; }
    if (low.indexOf('gray') >= 0) { grayscale(); return true; }
    if (low.indexOf('blur') >= 0) { applyBlur(4); return true; }
    if (low.indexOf('invert') >= 0) { invertColors(); return true; }
    if (low.indexOf('export') >= 0) { openExport(); return true; }
    if (low.indexOf('undo') >= 0) { triggerUndo(); return true; }
    if (low.indexOf('remove bg') >= 0 || low.indexOf('background') >= 0) {
        bgRemove('smart'); return true;
    }

    return false;
}

/* ===== A5: AI STYLE TRANSFER ===== */
function aiStyleTransfer(prompt) {
    var el = findEl(selId);
    if (!el || el.type !== 'image') {
        addChatMsg('Please select an image first', true);
        return;
    }

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Style Transfer...';
    addChatMsg('Applying style transfer...', true);

    /* Detect style */
    var style = 'oil painting';
    var low = prompt.toLowerCase();
    if (low.indexOf('anime') >= 0) style = 'anime style';
    else if (low.indexOf('cartoon') >= 0) style = 'cartoon style';
    else if (low.indexOf('sketch') >= 0) style = 'pencil sketch';
    else if (low.indexOf('van gogh') >= 0) style = 'van gogh painting';
    else if (low.indexOf('watercolor') >= 0) style = 'watercolor painting';
    else if (low.indexOf('cyberpunk') >= 0) style = 'cyberpunk digital art';

    var url = 'https://image.pollinations.ai/prompt/' +
        encodeURIComponent('same subject as photo, ' + style + ', high quality, detailed') +
        '?width=' + canvas.width +
        '&height=' + canvas.height +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

    var newImg = new Image();
    newImg.crossOrigin = 'anonymous';

    newImg.onload = function () {
        el.content = newImg;
        loader.style.display = 'none';
        sH('Style Transfer');
        R();
        addChatMsg('Style transfer applied!', true);
    };

    newImg.onerror = function () {
        loader.style.display = 'none';
        addChatMsg('Style transfer failed. Try again!', true);
    };

    newImg.src = url;
}

/* ===== A9: AI SKY REPLACE ===== */
function aiSkyReplace(prompt) {
    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Sky Replace...';
    addChatMsg('Generating new sky...', true);

    var skyType = 'sunset sky';
    var low = prompt.toLowerCase();
    if (low.indexOf('night') >= 0) skyType = 'starry night sky, galaxy';
    else if (low.indexOf('cloud') >= 0) skyType = 'dramatic cloudy sky';
    else if (low.indexOf('rainbow') >= 0) skyType = 'rainbow sky';
    else if (low.indexOf('storm') >= 0) skyType = 'stormy dark sky';
    else if (low.indexOf('dawn') >= 0) skyType = 'dawn sunrise sky';

    var url = 'https://image.pollinations.ai/prompt/' +
        encodeURIComponent(skyType + ', high quality, cinematic, wide') +
        '?width=' + canvas.width +
        '&height=' + canvas.height +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

    var newImg = new Image();
    newImg.crossOrigin = 'anonymous';

    newImg.onload = function () {
        aiBg = newImg;
        bgCf = null;
        loader.style.display = 'none';
        sH('Sky Replace');
        R();
        addChatMsg('Sky replaced!', true);
    };

    newImg.onerror = function () {
        loader.style.display = 'none';
        addChatMsg('Sky replace failed. Try again!', true);
    };

    newImg.src = url;
}

/* ===== A8: AI PORTRAIT BEAUTY ===== */
function aiPortraitBeauty() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') {
        addChatMsg('Please select a portrait image first', true);
        return;
    }

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Beauty...';
    addChatMsg('Applying beauty filter...', true);

    setTimeout(function () {
        /* Apply beauty settings */
        var beautySettings = {
            'sg-br': 10, 'sg-ct': 8, 'sg-sa': 5,
            'sg-te': 3, 'sg-vi': 0, 'sg-gr': 0
        };

        for (var key in beautySettings) {
            var slider = document.getElementById(key);
            if (slider) slider.value = beautySettings[key];
        }

        liveG();
        applyGrade();

        /* Add soft blur for skin smoothing */
        setTimeout(function () {
            applyBlur(1);
            loader.style.display = 'none';
            addChatMsg('Beauty filter applied!', true);
        }, 500);
    }, 300);
}

/* ===== A10: AI FACE SWAP ===== */
function aiFaceSwap() {
    addChatMsg('Face swap: Select 2 images, then run this command. Feature works with 2 uploaded images.', true);
}

/* ===== A11: AI COLOR SUGGEST ===== */
function aiColorSuggest() {
    var palettes = [
        { name: 'Ocean', colors: ['#0077BE', '#00A8CC', '#7ED4E6', '#FFF8E7'] },
        { name: 'Sunset', colors: ['#FF6B6B', '#FFA07A', '#FFD93D', '#6BCB77'] },
        { name: 'Forest', colors: ['#2D5016', '#4E8C24', '#7CB342', '#D4E157'] },
        { name: 'Purple Rain', colors: ['#4A148C', '#7B1FA2', '#AB47BC', '#E1BEE7'] },
        { name: 'Warm Neutral', colors: ['#3E2723', '#795548', '#D7CCC8', '#F5F5F5'] },
        { name: 'Cyberpunk', colors: ['#FF006E', '#8338EC', '#3A86FF', '#06FFA5'] }
    ];

    var chosen = palettes[Math.floor(Math.random() * palettes.length)];
    var msg = 'Try "' + chosen.name + '" palette: ' + chosen.colors.join(', ');
    addChatMsg(msg, true);

    /* Apply to text if selected */
    var el = findEl(selId);
    if (el && el.type === 'text') {
        el.color = chosen.colors[0];
        R();
    }
}

/* ===== A12: AI FONT PAIRING ===== */
function aiFontPairing() {
    var pairings = [
        { heading: 'Impact', body: 'Georgia', mood: 'Bold + Elegant' },
        { heading: 'Georgia', body: 'Verdana', mood: 'Classic Modern' },
        { heading: 'Arial', body: 'Times New Roman', mood: 'Professional' },
        { heading: 'Impact', body: 'Arial', mood: 'Strong Clean' },
        { heading: 'Courier New', body: 'Verdana', mood: 'Tech Minimal' }
    ];

    var chosen = pairings[Math.floor(Math.random() * pairings.length)];
    addChatMsg('Try: Heading "' + chosen.heading + '" + Body "' + chosen.body + '" — ' + chosen.mood, true);
}

/* ===== A13: AI LAYOUT SUGGEST ===== */
function aiLayoutSuggest() {
    if (els.length === 0) {
        addChatMsg('Add some elements first, then I can suggest layouts.', true);
        return;
    }

    var layouts = [
        { name: 'Centered', action: function () { els.forEach(function (el) { alignEl.call({ id: el.id }, 'c'); }); } },
        { name: 'Left Aligned', action: function () { els.forEach(function (el) { selId = el.id; alignEl('l'); }); } },
        {
            name: 'Grid Layout', action: function () {
                var cols = Math.ceil(Math.sqrt(els.length));
                var w = canvas.width / cols;
                var h = canvas.height / Math.ceil(els.length / cols);
                els.forEach(function (el, i) {
                    el.x = (i % cols) * w + w / 2;
                    el.y = Math.floor(i / cols) * h + h / 2;
                });
            }
        },
        {
            name: 'Stack Vertical', action: function () {
                var spacing = canvas.height / (els.length + 1);
                els.forEach(function (el, i) {
                    el.x = canvas.width / 2;
                    el.y = spacing * (i + 1);
                });
            }
        }
    ];

    var chosen = layouts[Math.floor(Math.random() * layouts.length)];
    chosen.action();
    sH('AI Layout: ' + chosen.name);
    R();
    addChatMsg('Applied "' + chosen.name + '" layout!', true);
}

/* ===== A15: AI SMART RESIZE ===== */
function aiSmartResize(platform) {
    var sizes = {
        instagram: [1080, 1080, 'Instagram Post'],
        story: [1080, 1920, 'Instagram Story'],
        youtube: [1280, 720, 'YouTube Thumbnail'],
        facebook: [820, 312, 'Facebook Cover'],
        twitter: [1500, 500, 'Twitter Header'],
        linkedin: [1584, 396, 'LinkedIn Banner']
    };

    if (platform === 'all') {
        addChatMsg('Say "resize for instagram/story/youtube/facebook"', true);
        return;
    }

    var size = sizes[platform];
    if (!size) {
        addChatMsg('Unknown platform. Try: instagram, story, youtube, facebook', true);
        return;
    }

    setupC(size[0], size[1]);
    addChatMsg('Resized to ' + size[2] + ' (' + size[0] + '×' + size[1] + ')', true);
}

/* ============================================
   COLUMN B FEATURES
   ============================================ */

/* ===== B15: SHAPE TOOLS ===== */
function addShape(type) {
    var shapes = {
        rectangle: { w: 200, h: 150 },
        circle: { w: 150, h: 150 },
        triangle: { w: 150, h: 150 },
        star: { w: 150, h: 150 },
        arrow: { w: 200, h: 60 },
        line: { w: 200, h: 4 },
        heart: { w: 150, h: 150 },
        polygon: { w: 150, h: 150 }
    };

    var shape = shapes[type] || shapes.rectangle;
    var shapeCanvas = document.createElement('canvas');
    shapeCanvas.width = shape.w;
    shapeCanvas.height = shape.h;
    var sctx = shapeCanvas.getContext('2d');

    sctx.fillStyle = '#7F3DFF';
    sctx.strokeStyle = '#7F3DFF';
    sctx.lineWidth = 3;

    if (type === 'rectangle') {
        sctx.fillRect(0, 0, shape.w, shape.h);
    } else if (type === 'circle') {
        sctx.beginPath();
        sctx.arc(shape.w / 2, shape.h / 2, shape.w / 2 - 3, 0, Math.PI * 2);
        sctx.fill();
    } else if (type === 'triangle') {
        sctx.beginPath();
        sctx.moveTo(shape.w / 2, 0);
        sctx.lineTo(shape.w, shape.h);
        sctx.lineTo(0, shape.h);
        sctx.closePath();
        sctx.fill();
    } else if (type === 'star') {
        var cx = shape.w / 2, cy = shape.h / 2;
        var outR = shape.w / 2 - 3, inR = outR * 0.4;
        sctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var r = i % 2 === 0 ? outR : inR;
            var angle = (i * Math.PI) / 5 - Math.PI / 2;
            var x = cx + Math.cos(angle) * r;
            var y = cy + Math.sin(angle) * r;
            if (i === 0) sctx.moveTo(x, y);
            else sctx.lineTo(x, y);
        }
        sctx.closePath();
        sctx.fill();
    } else if (type === 'arrow') {
        sctx.beginPath();
        sctx.moveTo(0, shape.h / 2 - 10);
        sctx.lineTo(shape.w - 40, shape.h / 2 - 10);
        sctx.lineTo(shape.w - 40, 0);
        sctx.lineTo(shape.w, shape.h / 2);
        sctx.lineTo(shape.w - 40, shape.h);
        sctx.lineTo(shape.w - 40, shape.h / 2 + 10);
        sctx.lineTo(0, shape.h / 2 + 10);
        sctx.closePath();
        sctx.fill();
    } else if (type === 'line') {
        sctx.fillRect(0, 0, shape.w, shape.h);
    } else if (type === 'heart') {
        var s = shape.w / 100;
        sctx.beginPath();
        sctx.moveTo(50 * s, 25 * s);
        sctx.bezierCurveTo(50 * s, 0, 0, 0, 0, 35 * s);
        sctx.bezierCurveTo(0, 60 * s, 30 * s, 80 * s, 50 * s, 100 * s);
        sctx.bezierCurveTo(70 * s, 80 * s, 100 * s, 60 * s, 100 * s, 35 * s);
        sctx.bezierCurveTo(100 * s, 0, 50 * s, 0, 50 * s, 25 * s);
        sctx.fill();
    } else if (type === 'polygon') {
        var sides = 6;
        var cx2 = shape.w / 2, cy2 = shape.h / 2;
        var r2 = shape.w / 2 - 3;
        sctx.beginPath();
        for (var j = 0; j < sides; j++) {
            var a = (j * 2 * Math.PI) / sides - Math.PI / 2;
            var x2 = cx2 + Math.cos(a) * r2;
            var y2 = cy2 + Math.sin(a) * r2;
            if (j === 0) sctx.moveTo(x2, y2);
            else sctx.lineTo(x2, y2);
        }
        sctx.closePath();
        sctx.fill();
    }

    /* Convert to image */
    var img = new Image();
    img.onload = function () {
        var mc = document.createElement('canvas');
        mc.width = img.width;
        mc.height = img.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);

        els.push({
            id: 's' + Date.now(),
            type: 'image',
            content: img,
            x: canvas.width / 2 - img.width / 2,
            y: canvas.height / 2 - img.height / 2,
            scale: 100,
            rotate: 0,
            opacity: 100,
            eraserMask: mc,
            isShape: true
        });
        selId = els[els.length - 1].id;
        sH('Add ' + type);
        R();
        sUI();
        updateCanvasInfo();
    };
    img.src = shapeCanvas.toDataURL();
}

/* ===== B16: DRAWING TOOL ===== */
var drawingMode = false;
var drawing = false;
var drawColor = '#7F3DFF';
var drawSize = 5;
var drawCanvas = null;

function toggleDrawMode() {
    drawingMode = !drawingMode;
    if (drawingMode) {
        document.body.classList.add('drawing-mode');
        canvas.style.cursor = 'crosshair';
        alert('Drawing mode ON. Click and drag on canvas to draw.');
    } else {
        document.body.classList.remove('drawing-mode');
        canvas.style.cursor = 'default';
    }
}

/* ===== B17: TEXT EFFECTS ===== */
function applyTextEffect(effect) {
    var el = findEl(selId);
    if (!el || el.type !== 'text') {
        alert('Select a text layer first');
        return;
    }

    var effects = {
        neon: { glow: 25, glowColor: '#00C6FF', color: '#00C6FF', stroke: 0 },
        '3d': { threeDDepth: 15, threeDColor: '#4A5578', glow: 0 },
        rainbow: { color: '#FF006E', glow: 12, glowColor: '#8338EC' },
        fire: { color: '#FF6F00', glow: 20, glowColor: '#FFB800', stroke: 2, strokeColor: '#FF3D71' },
        ice: { color: '#00C6FF', glow: 20, glowColor: '#7ED4E6', stroke: 2, strokeColor: '#FFFFFF' },
        chrome: { color: '#E0E0E0', glow: 0, stroke: 3, strokeColor: '#4A5578', emboss: 4 },
        gold: { color: '#FFD700', glow: 15, glowColor: '#FF9800', stroke: 2, strokeColor: '#8B6F00' },
        vintage: { color: '#8B4513', glow: 0, stroke: 1, strokeColor: '#D4A574', emboss: 3 }
    };

    var settings = effects[effect];
    if (settings) {
        for (var key in settings) {
            el[key] = settings[key];
        }
        sH('Text Effect: ' + effect);
        R();
        sUI();
    }
}

/* ===== B18: GOOGLE FONTS ===== */
function openGoogleFonts() {
    var fonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
        'Poppins', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather'];
    var picked = prompt('Type font name (available: ' + fonts.join(', ') + ')');
    if (!picked) return;

    var link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=' +
        picked.replace(/ /g, '+') + '&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    setTimeout(function () {
        var sel = document.getElementById('fontSel');
        var op = document.createElement('option');
        op.value = picked;
        op.textContent = picked;
        sel.appendChild(op);
        sel.value = picked;
        setProp('font', picked);
    }, 500);
}
/* ============================================
   MORE FEATURES (B21-B30) + CORE LOGIC
   ============================================ */

/* ===== B21: CROP TOOL ===== */
var cropMode = false;
function toggleCropMode() {
    cropMode = !cropMode;
    if (cropMode) {
        document.body.classList.add('crop-mode');
        alert('Crop mode ON. Feature: manual canvas resize via size buttons');
    } else {
        document.body.classList.remove('crop-mode');
    }
}

/* ===== B23: WATERMARK ===== */
function openWatermark() {
    var text = prompt('Enter watermark text:', '© Arjona AI');
    if (!text) return;

    els.push({
        id: 'w' + Date.now(),
        type: 'text',
        text: text,
        x: canvas.width - 100,
        y: canvas.height - 30,
        scale: 40,
        rotate: 0,
        opacity: 60,
        font: 'Arial',
        color: '#ffffff',
        charSpacing: 0, curve: 0,
        stroke: 1, strokeColor: '#000000',
        emboss: 0, threeDDepth: 0,
        innerShadow: 0, reflection: 0, glow: 0
    });
    selId = els[els.length - 1].id;
    sH('Watermark');
    R();
    sUI();
}

/* ===== B24: QR CODE GENERATOR ===== */
function openQRGen() {
    var text = prompt('Enter text/URL for QR code:');
    if (!text) return;

    var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' +
        encodeURIComponent(text);

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        var mc = document.createElement('canvas');
        mc.width = img.width;
        mc.height = img.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);

        els.push({
            id: 'qr' + Date.now(),
            type: 'image',
            content: img,
            x: canvas.width / 2 - 150,
            y: canvas.height / 2 - 150,
            scale: 100,
            rotate: 0,
            opacity: 100,
            eraserMask: mc
        });
        selId = els[els.length - 1].id;
        sH('QR Code');
        R();
        sUI();
    };
    img.src = qrUrl;
}

/* ===== B25: STICKERS ===== */
function openStickers() {
    var stickers = ['⭐', '❤️', '🔥', '✨', '💯', '🎉', '👍', '💎', '🌟', '⚡', '🎨', '🚀'];
    var picked = prompt('Type sticker:\n' + stickers.join(' '));
    if (!picked) return;

    els.push({
        id: 'st' + Date.now(),
        type: 'text',
        text: picked,
        x: canvas.width / 2,
        y: canvas.height / 2,
        scale: 120, rotate: 0, opacity: 100,
        font: 'Arial', color: '#ffffff',
        charSpacing: 0, curve: 0,
        stroke: 0, glow: 0, emboss: 0,
        threeDDepth: 0, innerShadow: 0, reflection: 0
    });
    selId = els[els.length - 1].id;
    sH('Sticker');
    R();
    sUI();
}

/* ===== B26: FRAMES ===== */
function openFrames() {
    var frameType = prompt('Frame type: polaroid / vintage / modern');
    if (!frameType) return;

    var fc = document.createElement('canvas');
    fc.width = canvas.width;
    fc.height = canvas.height;
    var fctx = fc.getContext('2d');

    if (frameType === 'polaroid') {
        fctx.strokeStyle = '#fff';
        fctx.lineWidth = 40;
        fctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 100);
    } else if (frameType === 'vintage') {
        fctx.strokeStyle = '#8B4513';
        fctx.lineWidth = 20;
        fctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    } else {
        fctx.strokeStyle = '#7F3DFF';
        fctx.lineWidth = 8;
        fctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    }

    var img = new Image();
    img.onload = function () {
        var mc = document.createElement('canvas');
        mc.width = img.width;
        mc.height = img.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);

        els.push({
            id: 'f' + Date.now(),
            type: 'image',
            content: img,
            x: 0, y: 0,
            scale: 100, rotate: 0, opacity: 100,
            eraserMask: mc
        });
        sH('Frame');
        R();
    };
    img.src = fc.toDataURL();
}

/* ===== B27: COLLAGE ===== */
function openCollage() {
    alert('Collage: Upload multiple images. They will auto-arrange in grid.');
    document.getElementById('qImg').click();
}

/* ===== B28: GRADIENT GENERATOR ===== */
function openGradient() {
    var c1 = prompt('Color 1 (hex):', '#00C6FF');
    if (!c1) return;
    var c2 = prompt('Color 2 (hex):', '#7F3DFF');
    if (!c2) return;

    bgCf = { type: 'grad', c1: c1, c2: c2, dir: 'diag' };
    aiBg = null;
    sH('Gradient');
    R();
}

/* ===== B29: EYEDROPPER ===== */
var eyedropperMode = false;
function toggleEyedropper() {
    eyedropperMode = !eyedropperMode;
    if (eyedropperMode) {
        document.body.classList.add('eyedropper-active');
        alert('Click on canvas to pick color');
    } else {
        document.body.classList.remove('eyedropper-active');
    }
}

/* ===== B30: GRID OVERLAY ===== */
var gridVisible = false;
function toggleGrid() {
    gridVisible = !gridVisible;
    var overlay = document.getElementById('gridOverlay');
    if (!overlay) return;

    if (gridVisible) {
        overlay.style.display = 'block';
        overlay.width = canvas.width;
        overlay.height = canvas.height;
        var gctx = overlay.getContext('2d');
        gctx.strokeStyle = 'rgba(127,61,255,0.3)';
        gctx.lineWidth = 1;
        var step = 40;
        for (var x = 0; x <= canvas.width; x += step) {
            gctx.beginPath();
            gctx.moveTo(x, 0);
            gctx.lineTo(x, canvas.height);
            gctx.stroke();
        }
        for (var y = 0; y <= canvas.height; y += step) {
            gctx.beginPath();
            gctx.moveTo(0, y);
            gctx.lineTo(canvas.width, y);
            gctx.stroke();
        }
    } else {
        overlay.style.display = 'none';
    }
}

/* ===== QUICK ASK ===== */
function quickAsk(text) {
    var inp = document.getElementById('aiChatInput');
    if (inp) inp.value = text;
    sendAiChat();
}

/* ===== CANVAS INFO ===== */
function updateCanvasInfo() {
    var info1 = document.getElementById('cvInfo');
    var info2 = document.getElementById('cvInfo2');
    var txt = canvas.width + ' × ' + canvas.height;
    if (info1) info1.textContent = txt;
    if (info2) info2.textContent = txt;
}

/* ===== DROP ZONE ===== */
function initDropZone() {
    var area = document.getElementById('canvasArea');
    var hint = document.getElementById('dropHint');
    if (!area) return;

    var dragCounter = 0;

    area.addEventListener('dragenter', function (e) {
        e.preventDefault();
        dragCounter++;
        if (hint) hint.style.opacity = '1';
    });

    area.addEventListener('dragleave', function (e) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
            dragCounter = 0;
            if (hint) hint.style.opacity = '0';
        }
    });

    area.addEventListener('dragover', function (e) { e.preventDefault(); });

    area.addEventListener('drop', function (e) {
        e.preventDefault();
        dragCounter = 0;
        if (hint) hint.style.opacity = '0';
        var files = e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
            if (files[i].type.indexOf('image/') === 0) loadI(files[i]);
        }
    });
}

/* ===== NEBULA ===== */
function createNebula(canvas) {
    if (!canvas) return null;
    var nb = {
        c: canvas, x: canvas.getContext('2d'),
        W: 0, H: 0, time: 0,
        stars: [], running: false, animId: null
    };

    function resize() {
        nb.W = nb.c.offsetWidth || 300;
        nb.H = nb.c.offsetHeight || 420;
        nb.c.width = nb.W;
        nb.c.height = nb.H;
    }

    function init() {
        resize();
        nb.stars = [];
        var cols = ['rgba(0,198,255,', 'rgba(127,61,255,', 'rgba(255,255,255,'];
        for (var i = 0; i < 100; i++) {
            nb.stars.push({
                x: Math.random(), y: Math.random(),
                r: Math.random() * 1.3 + 0.2,
                sp: Math.random() * 0.02 + 0.004,
                tw: Math.random() * Math.PI * 2,
                col: cols[Math.floor(Math.random() * cols.length)]
            });
        }
    }

    function render() {
        if (!nb.running) return;
        nb.time += 0.011;
        var W = nb.W, H = nb.H, cx = nb.x;
        cx.clearRect(0, 0, W, H);

        var base = cx.createLinearGradient(0, 0, W, H);
        base.addColorStop(0, '#010612');
        base.addColorStop(0.5, '#040c20');
        base.addColorStop(1, '#020810');
        cx.fillStyle = base;
        cx.fillRect(0, 0, W, H);

        for (var i = 0; i < nb.stars.length; i++) {
            var s2 = nb.stars[i];
            s2.tw += s2.sp;
            var al3 = 0.2 + Math.sin(s2.tw) * 0.5;
            if (al3 < 0) al3 = 0;
            if (al3 > 1) al3 = 1;
            cx.fillStyle = s2.col + al3 + ')';
            cx.beginPath();
            cx.arc(s2.x * W, s2.y * H, s2.r, 0, Math.PI * 2);
            cx.fill();
        }
        nb.animId = requestAnimationFrame(render);
    }

    nb.init = init;
    nb.render = function () { nb.running = true; render(); };
    nb.stop = function () {
        nb.running = false;
        if (nb.animId) cancelAnimationFrame(nb.animId);
    };
    nb.resize = resize;
    return nb;
}

/* ===== AI CHAT ===== */
var aiChatOpen = false, ttsOn = false, lastActionTime = Date.now();
var aiChatMem = [];
var aiDragState = { dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };

try { aiChatMem = JSON.parse(localStorage.getItem('ai_chat_mem') || '[]'); }
catch (e) { aiChatMem = []; }

function initAiChatDrag() {
    var handle = document.getElementById('aiChatDragHandle');
    var box = document.getElementById('aiChatBox');
    if (!handle || !box) return;

    function startDrag(e) {
        if (e.target.tagName === 'BUTTON') return;
        var touch = e.touches ? e.touches[0] : e;
        aiDragState.dragging = true;
        aiDragState.startX = touch.clientX;
        aiDragState.startY = touch.clientY;
        var rect = box.getBoundingClientRect();
        aiDragState.startLeft = rect.left;
        aiDragState.startTop = rect.top;
        box.style.transition = 'none';
        box.style.bottom = 'auto';
        box.style.right = 'auto';
        box.style.left = rect.left + 'px';
        box.style.top = rect.top + 'px';
    }

    function moveDrag(e) {
        if (!aiDragState.dragging) return;
        if (e.preventDefault) e.preventDefault();
        var touch = e.touches ? e.touches[0] : e;
        var dx = touch.clientX - aiDragState.startX;
        var dy = touch.clientY - aiDragState.startY;
        var newLeft = aiDragState.startLeft + dx;
        var newTop = aiDragState.startTop + dy;
        newLeft = Math.max(6, Math.min(window.innerWidth - box.offsetWidth - 6, newLeft));
        newTop = Math.max(6, Math.min(window.innerHeight - box.offsetHeight - 6, newTop));
        box.style.left = newLeft + 'px';
        box.style.top = newTop + 'px';
    }

    function endDrag() {
        if (!aiDragState.dragging) return;
        aiDragState.dragging = false;
        box.style.transition = '';
    }

    handle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    handle.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
}

function toggleAiChat() {
    var box = document.getElementById('aiChatBox');
    aiChatOpen = !aiChatOpen;
    if (aiChatOpen) {
        box.classList.remove('hidden');
        var rect = box.getBoundingClientRect();
        if (rect.top < 0 || rect.left < 0 ||
            rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
            box.style.left = '';
            box.style.top = '';
            box.style.bottom = '70px';
            box.style.right = '14px';
        }
    } else {
        box.classList.add('hidden');
    }
}

function getCanvasContext() {
    var imgC = 0;
    for (var i = 0; i < els.length; i++) if (els[i].type === 'image') imgC++;
    return canvas.width + 'x' + canvas.height + ',' + els.length + ' els,' + imgC + ' imgs';
}

function addAiMem(role, text) {
    aiChatMem.push({ role: role, text: text });
    if (aiChatMem.length > 10) aiChatMem = aiChatMem.slice(-10);
    try { localStorage.setItem('ai_chat_mem', JSON.stringify(aiChatMem)); } catch (e) { }
    lastActionTime = Date.now();
}

function addChatMsg(text, isBot) {
    var body = document.getElementById('aiChatBody');
    if (!body) return;
    var div = document.createElement('div');
    div.className = 'ai-msg ' + (isBot ? 'ai-msg-bot' : 'ai-msg-user');
    div.innerText = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function showTyping(s) {
    var el = document.getElementById('aiTyping');
    if (el) el.style.display = s ? 'flex' : 'none';
}

function askAI(context, showInChat) {
    if (showInChat !== false) addAiMem('sys', context);
    var prompt = 'You are Arjona AI, professional design assistant.' +
        ' Max 20 words. Canvas: ' + getCanvasContext() + '. Context: ' + context;
    showTyping(true);
    fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt))
        .then(function (r) { return r.text(); })
        .then(function (text) {
            showTyping(false);
            text = (text || '').trim().substring(0, 120);
            if (!text || text.length < 2) text = 'Ready to help';
            if (showInChat !== false) {
                addChatMsg(text, true);
                addAiMem('bot', text);
            }
            updateLog(text);
            if (ttsOn) speakTTS(text);
        })
        .catch(function () {
            showTyping(false);
            if (showInChat !== false) addChatMsg('Ready to help', true);
        });
}

function sendAiChat() {
    var inp = document.getElementById('aiChatInput');
    var msg = (inp.value || '').trim();
    inp.value = '';
    if (!msg) return;
    addChatMsg(msg, false);
    addAiMem('user', msg);

    /* Try AI command processor first */
    if (processAICommand(msg)) return;

    /* Fallback to AI chat */
    askAI('user: ' + msg);
}

function startAiVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    var rec = new SR();
    rec.lang = 'en-US';
    rec.onresult = function (e) {
        document.getElementById('aiChatInput').value = e.results[0][0].transcript;
        sendAiChat();
    };
    rec.start();
}

function speakTTS(text) {
    if (!('speechSynthesis' in window)) return;
    try {
        speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US'; u.rate = 1.1;
        speechSynthesis.speak(u);
    } catch (e) { }
}

function toggleTTS() {
    ttsOn = !ttsOn;
    var txt = document.getElementById('ttsBtnTxt');
    if (txt) txt.innerText = ttsOn ? 'Voice On' : 'Voice';
}

function react(k) { }

function updateLog(text) {
    var l1 = document.getElementById('logTxt');
    var l2 = document.getElementById('logTxt2');
    if (l1) l1.innerText = text;
    if (l2) l2.innerText = text;
}

/* ===== THEME ===== */
function toggleTheme() {
    var h = document.documentElement;
    var n = h.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    h.setAttribute('data-theme', n);
    try { localStorage.setItem('ds_theme', n); } catch (e) { }
    if (window.lucide) lucide.createIcons();
}

function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('ds_theme'); } catch (e) { }
    if (saved) document.documentElement.setAttribute('data-theme', saved);
}

/* ===== MODALS ===== */
function openHelp() { document.getElementById('helpModal').style.display = 'flex'; }
function closeHelp() { document.getElementById('helpModal').style.display = 'none'; }

/* ===== MOBILE MENU ===== */
function toggleMobMenu() {
    var d = document.getElementById('mobMenuDrawer');
    var o = document.getElementById('mobMenuOverlay');
    if (d.classList.contains('open')) {
        d.classList.remove('open'); o.classList.remove('open');
    } else {
        d.classList.add('open'); o.classList.add('open');
    }
}

function closeMobMenu() {
    document.getElementById('mobMenuDrawer').classList.remove('open');
    document.getElementById('mobMenuOverlay').classList.remove('open');
}

/* ===== BOTTOM SHEETS ===== */
var currentSheet = null, sheetDragging = false, sheetStartY = 0;

function openBottomSheet(btn, sheetId) {
    var btns = document.querySelectorAll('.mob-bar-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (btn && btn.classList) btn.classList.add('active');

    var overlay = document.getElementById('mobSheetOverlay');

    if (currentSheet === sheetId) {
        var oldSheet = document.getElementById(sheetId);
        if (oldSheet) oldSheet.classList.remove('open');
        overlay.classList.remove('open');
        document.body.classList.remove('sheet-open');
        currentSheet = null;
        return;
    }

    var prevSheet = currentSheet ? document.getElementById(currentSheet) : null;
    if (prevSheet) {
        prevSheet.classList.remove('open');
        setTimeout(function () {
            var newSheet = document.getElementById(sheetId);
            if (newSheet) {
                newSheet.classList.add('open');
                overlay.classList.add('open');
                document.body.classList.add('sheet-open');
                currentSheet = sheetId;
                if (sheetId === 'sheetHist') renderHistList();
            }
        }, 200);
    } else {
        var newSheet = document.getElementById(sheetId);
        if (newSheet) {
            newSheet.classList.add('open');
            overlay.classList.add('open');
            document.body.classList.add('sheet-open');
            currentSheet = sheetId;
            if (sheetId === 'sheetHist') renderHistList();
        }
    }
}

function closeBottomSheet() {
    var sheets = document.querySelectorAll('.mob-sheet');
    for (var i = 0; i < sheets.length; i++) sheets[i].classList.remove('open');
    document.getElementById('mobSheetOverlay').classList.remove('open');
    document.body.classList.remove('sheet-open');
    currentSheet = null;
    var btns = document.querySelectorAll('.mob-bar-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
}

function sheetDragStart(e) { sheetDragging = true; sheetStartY = e.touches[0].clientY; }
function sheetDragMove(e) {
    if (!sheetDragging) return;
    if (e.touches[0].clientY - sheetStartY > 65) closeBottomSheet();
}
function sheetDragEnd() { sheetDragging = false; }

/* ===== MOBILE PANEL RESIZE ===== */
var mobResizing = false, mobResizeStartY = 0, mobResizeStartH = 0;

function startMobResize(e) {
    e.preventDefault();
    mobResizing = true;
    var touch = e.touches ? e.touches[0] : e;
    mobResizeStartY = touch.clientY;
    mobResizeStartH = document.getElementById('mobBottomBar').offsetHeight;
}

document.addEventListener('mousemove', handleMobResize);
document.addEventListener('touchmove', handleMobResize, { passive: false });
document.addEventListener('mouseup', function () { mobResizing = false; });
document.addEventListener('touchend', function () { mobResizing = false; });

function handleMobResize(e) {
    if (!mobResizing) return;
    if (e.preventDefault) e.preventDefault();
    var touch = e.touches ? e.touches[0] : e;
    var dy = touch.clientY - mobResizeStartY;
    var el = document.getElementById('mobBottomBar');
    el.style.height = Math.max(44, Math.min(130, mobResizeStartH - dy)) + 'px';
}

function mobSetSize(btn, w, h) {
    var btns = document.querySelectorAll('.mob-cs-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    btn.classList.add('active');
    setupC(w, h);
}

function generateAIMobile() {
    var prompt = document.getElementById('mobAiPrompt').value.trim();
    if (!prompt) return;
    var style = document.getElementById('mobAiStyle').value || '';
    var el = document.getElementById('aiPrompt');
    if (el) el.value = prompt;
    var stEl = document.getElementById('aiStyle');
    if (stEl) stEl.value = style;
    var modeEl = document.getElementById('aiMode');
    if (modeEl) modeEl.value = 'bg';
    generateAI();
}

function applyMobBgSolid() {
    var c = document.getElementById('mobBgSC');
    if (c) {
        bgCf = { type: 'solid', color: c.value };
        aiBg = null; sH('BG Solid'); R();
    }
}

/* ===== CORNER RESIZE ===== */
var resLOn = false, resLX = 0, resLW = 0;
var resBOn = false, resBY = 0, resBH = 0;
var cornerDrag = null, cornerStartX = 0, cornerStartY = 0, cornerStartScale = 100;

function findEl(id) {
    for (var i = 0; i < els.length; i++) if (els[i].id === id) return els[i];
    return null;
}

function showCornerHandles(el) {
    var ids = ['rhNW', 'rhNE', 'rhSW', 'rhSE'];
    if (!el) {
        for (var i = 0; i < ids.length; i++) {
            var h = document.getElementById(ids[i]);
            if (h) h.style.display = 'none';
        }
        return;
    }
    var cr = canvas.getBoundingClientRect();
    var sx = cr.width / canvas.width;
    var sy = cr.height / canvas.height;
    var ex, ey, ew, eh;
    if (el.type === 'image') {
        ew = el.content.width * (el.scale / 100);
        eh = el.content.height * (el.scale / 100);
        ex = el.x; ey = el.y;
    } else {
        ctx.save();
        ctx.font = 'bold ' + (el.scale * 0.6) + 'px "' + (el.font || 'Arial') + '"';
        var tw = ctx.measureText(el.text || '').width;
        ctx.restore();
        ew = tw + 20; eh = el.scale * 0.8;
        ex = el.x - ew / 2; ey = el.y - eh / 2;
    }
    var pos = [
        [cr.left + ex * sx - 6, cr.top + ey * sy - 6],
        [cr.left + (ex + ew) * sx - 6, cr.top + ey * sy - 6],
        [cr.left + ex * sx - 6, cr.top + (ey + eh) * sy - 6],
        [cr.left + (ex + ew) * sx - 6, cr.top + (ey + eh) * sy - 6]
    ];
    for (var i = 0; i < ids.length; i++) {
        var h = document.getElementById(ids[i]);
        if (h) {
            h.style.left = pos[i][0] + 'px';
            h.style.top = pos[i][1] + 'px';
            h.style.display = 'block';
        }
    }
}

function hideCornerHandles() {
    var ids = ['rhNW', 'rhNE', 'rhSW', 'rhSE'];
    for (var i = 0; i < ids.length; i++) {
        var h = document.getElementById(ids[i]);
        if (h) h.style.display = 'none';
    }
}

function initCornerResize(id, e) {
    var el = findEl(selId);
    if (!el) return;
    if (e.preventDefault) e.preventDefault();
    cornerDrag = id;
    cornerStartX = e.clientX;
    cornerStartY = e.clientY;
    cornerStartScale = el.scale;
}

/* ===== STATE ===== */
var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var loader = document.getElementById('loader');
var els = [], selId = null, aiBg = null, bgCf = null;
var uS = [], rS = [], histLabels = [];
var mode = 'select', bSz = 25;
var drag = false, dX = 0, dY = 0;

/* ===== TABS ===== */
function bpTab(btn) {
    var ts = document.querySelectorAll('.bp-tab');
    var ps = document.querySelectorAll('.bp-pan');
    var targetId = btn.getAttribute('data-p');
    var currentPan = null;
    for (var i = 0; i < ps.length; i++) {
        if (ps[i].classList.contains('active')) { currentPan = ps[i]; break; }
    }
    if (currentPan && currentPan.id === targetId) return;
    if (currentPan) {
        currentPan.style.opacity = '0';
        currentPan.style.transform = 'translateY(5px)';
    }
    for (var i = 0; i < ts.length; i++) ts[i].classList.remove('active');
    btn.classList.add('active');
    setTimeout(function () {
        for (var i = 0; i < ps.length; i++) {
            ps[i].classList.remove('active');
            ps[i].style.opacity = '';
            ps[i].style.transform = '';
        }
        var p = document.getElementById(targetId);
        if (p) p.classList.add('active');
    }, 120);
}

function bgT(btn) {
    var ts = document.querySelectorAll('.bgt');
    var ps = document.querySelectorAll('.bgp');
    for (var i = 0; i < ts.length; i++) ts[i].classList.remove('active');
    for (var i = 0; i < ps.length; i++) ps[i].classList.remove('active');
    btn.classList.add('active');
    var p = document.getElementById(btn.getAttribute('data-p'));
    if (p) p.classList.add('active');
}

function switchGradeTab(btn, contentId) {
    var tabs = document.querySelectorAll('.grade-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
    var contents = document.querySelectorAll('.grade-tab-content');
    for (var i = 0; i < contents.length; i++) contents[i].classList.remove('active');
    btn.classList.add('active');
    var content = document.getElementById(contentId);
    if (content) content.classList.add('active');
    if (window.lucide) lucide.createIcons();
}

function showSelBar(el) {
    var bar = document.getElementById('selBar');
    if (bar) bar.style.display = 'none';
    if (!el) { hideCornerHandles(); return; }
    showCornerHandles(el);
}

function setupC(w, h) {
    canvas.width = w;
    canvas.height = h;
    updateCanvasInfo();
    R();
}

/* ===== BACKGROUND ===== */
function setBg(type, sub) {
    if (type === 'solid')
        bgCf = { type: 'solid', color: document.getElementById('bgSC').value };
    else if (type === 'grad')
        bgCf = {
            type: 'grad',
            c1: document.getElementById('bgG1').value,
            c2: document.getElementById('bgG2').value,
            dir: document.getElementById('bgGD').value
        };
    else if (type === 'pat')
        bgCf = {
            type: 'pat', pat: sub,
            pc: document.getElementById('bgPC').value,
            bc: document.getElementById('bgPB').value
        };
    aiBg = null; sH('BG Change'); R();
}

function preBg(c1, c2) {
    bgCf = c1 === c2 ? { type: 'solid', color: c1 } :
        { type: 'grad', c1: c1, c2: c2, dir: 'diag' };
    aiBg = null; sH('BG Preset'); R();
}

function clearBg() { bgCf = null; aiBg = null; sH('BG Clear'); R(); }

function paintBg() {
    var W = canvas.width, H = canvas.height;
    if (aiBg && aiBg.complete && aiBg.naturalWidth > 0) {
        var s = Math.max(W / aiBg.naturalWidth, H / aiBg.naturalHeight);
        ctx.drawImage(aiBg,
            (W - aiBg.naturalWidth * s) / 2,
            (H - aiBg.naturalHeight * s) / 2,
            aiBg.naturalWidth * s, aiBg.naturalHeight * s);
        return;
    }
    if (!bgCf) {
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#090f1d');
        g.addColorStop(.5, '#0c1a2e');
        g.addColorStop(1, '#060b16');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        return;
    }
    var c = bgCf;
    if (c.type === 'solid') {
        ctx.fillStyle = c.color;
        ctx.fillRect(0, 0, W, H);
    } else if (c.type === 'grad') {
        var g;
        if (c.dir === 'rad') g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
        else if (c.dir === 'lr') g = ctx.createLinearGradient(0, 0, W, 0);
        else if (c.dir === 'diag') g = ctx.createLinearGradient(0, 0, W, H);
        else g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, c.c1);
        g.addColorStop(1, c.c2);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    } else if (c.type === 'pat') {
        ctx.fillStyle = c.bc || '#0a0f1e';
        ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.strokeStyle = c.pc || '#7F3DFF';
        ctx.fillStyle = c.pc || '#7F3DFF';
        ctx.globalAlpha = .1;
        var sz = 24;
        if (c.pat === 'dots') {
            for (var x = 0; x < W; x += sz)
                for (var y = 0; y < H; y += sz) {
                    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
                }
        } else if (c.pat === 'grid') {
            ctx.lineWidth = 1;
            for (var x = 0; x <= W; x += sz) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (var y = 0; y <= H; y += sz) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        } else if (c.pat === 'stripe') {
            ctx.lineWidth = 2;
            for (var x = -H; x < W + H; x += sz) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); ctx.stroke(); }
        } else if (c.pat === 'check') {
            for (var x = 0; x < W; x += sz)
                for (var y = 0; y < H; y += sz) {
                    if ((Math.floor(x / sz) + Math.floor(y / sz)) % 2 === 0)
                        ctx.fillRect(x, y, sz, sz);
                }
        }
        ctx.restore();
    }
}

/* ===== HISTORY ===== */
function serS() {
    return JSON.stringify({
        els: els.map(function (e) {
            var c = {};
            for (var k in e) c[k] = e[k];
            if (e.type === 'image') { c.src = e.content.src; delete c.content; }
            if (e.eraserMask) { c.mask = e.eraserMask.toDataURL(); delete c.eraserMask; }
            return c;
        }), bgCf: bgCf
    });
}

function sH(label) {
    uS.push(serS());
    histLabels.push(label || 'Edit');
    if (uS.length > 40) { uS.shift(); histLabels.shift(); }
    rS = [];
}

function renderHistList() {
    var list = document.getElementById('histList');
    if (!list) return;
    if (uS.length <= 1) {
        list.innerHTML = '<div class="hist-empty">No history yet</div>';
        return;
    }
    list.innerHTML = '';
    for (var i = uS.length - 1; i >= 0; i--) {
        var item = document.createElement('div');
        item.className = 'hist-item' + (i === uS.length - 1 ? ' current' : '');
        item.innerHTML = '<div class="hist-item-dot"></div>' +
            '<div class="hist-item-label">' + (histLabels[i] || 'Step ' + (i + 1)) + '</div>' +
            '<div class="hist-item-num">#' + (i + 1) + '</div>';
        (function (idx) { item.onclick = function () { jumpToHistory(idx); }; })(i);
        list.appendChild(item);
    }
}

function jumpToHistory(idx) {
    if (idx < 0 || idx >= uS.length) return;
    restS(uS[idx]);
    uS = uS.slice(0, idx + 1);
    histLabels = histLabels.slice(0, idx + 1);
    renderHistList();
}

function clearHistory() {
    var last = uS[uS.length - 1];
    uS = last ? [last] : [];
    histLabels = last ? ['Init'] : [];
    renderHistList();
}

function triggerUndo() {
    if (uS.length <= 1) return;
    rS.push(uS.pop()); histLabels.pop();
    restS(uS[uS.length - 1]);
}

function triggerRedo() {
    if (!rS.length) return;
    var s = rS.pop(); uS.push(s); restS(s);
}

function restS(json) {
    var p = JSON.parse(json);
    bgCf = p.bgCf || null;
    var ic = 0;
    for (var i = 0; i < p.els.length; i++) if (p.els[i].type === 'image') ic++;
    var ld = 0;
    els = p.els.map(function (e) {
        var o = {};
        for (var k in e) o[k] = e[k];
        if (e.type === 'image') {
            o.content = new Image();
            o.content.crossOrigin = 'anonymous';
            o.content.src = e.src || '';
            o.content.onload = function () { ld++; if (ld >= ic) R(); };
            o.eraserMask = document.createElement('canvas');
            if (e.mask) {
                var mi = new Image(); mi.src = e.mask;
                mi.onload = function () {
                    o.eraserMask.width = mi.width;
                    o.eraserMask.height = mi.height;
                    o.eraserMask.getContext('2d').drawImage(mi, 0, 0);
                };
            } else {
                o.eraserMask.width = 400; o.eraserMask.height = 400;
                var mc = o.eraserMask.getContext('2d');
                mc.fillStyle = '#fff'; mc.fillRect(0, 0, 400, 400);
            }
        }
        return o;
    });
    selId = null; sUI(); if (!ic) R();
}

/* ===== LAYERS ===== */
function addText() {
    els.push({
        id: 't' + Date.now(), type: 'text',
        text: 'EDIT TEXT',
        x: canvas.width / 2, y: canvas.height / 2,
        scale: 100, rotate: 0, opacity: 100,
        font: 'Arial', color: '#7F3DFF',
        charSpacing: 0, curve: 0,
        stroke: 2, strokeColor: '#000000',
        emboss: 0, threeDDepth: 0, threeDColor: '#1e293b',
        innerShadow: 0, innerShadowColor: '#000000',
        reflection: 0, glow: 8, glowColor: '#7F3DFF',
        fontSize: 60
    });
    selId = els[els.length - 1].id;
    sH('Add Text'); R(); sUI(); updateCanvasInfo();

    /* Auto open Type tab */
    if (window.innerWidth <= 900) {
        var typeBtn = document.querySelector('[data-sheet="sheetText"]');
        if (typeBtn) openBottomSheet(typeBtn, 'sheetText');
    } else {
        var textTab = document.querySelector('[data-p="bpText"]');
        if (textTab) bpTab(textTab);
    }
}

function addImg(ev) {
    var f = ev.target.files[0];
    if (f) loadI(f);
    ev.target.value = '';
}

function loadI(file) {
    var r = new FileReader();
    r.readAsDataURL(file);
    r.onload = function (e) {
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            var mc = document.createElement('canvas');
            mc.width = img.width; mc.height = img.height;
            var mx = mc.getContext('2d');
            mx.fillStyle = '#fff';
            mx.fillRect(0, 0, mc.width, mc.height);
            var sc = 50;
            if (img.width * (sc / 100) > canvas.width * 0.65)
                sc = Math.floor(canvas.width * 0.65 / img.width * 100);
            if (img.height * (sc / 100) > canvas.height * 0.65)
                sc = Math.min(sc, Math.floor(canvas.height * 0.65 / img.height * 100));
            sc = Math.max(12, sc);
            els.push({
                id: 'i' + Date.now(), type: 'image', content: img,
                x: canvas.width / 2 - img.width * (sc / 100) / 2,
                y: canvas.height / 2 - img.height * (sc / 100) / 2,
                scale: sc, rotate: 0, opacity: 100, eraserMask: mc
            });
            selId = els[els.length - 1].id;
            sH('Upload Image'); R(); sUI(); updateCanvasInfo();
        };
    };
}

function layerOp(a) {
    if (!selId) return;
    var i = -1;
    for (var j = 0; j < els.length; j++) {
        if (els[j].id === selId) { i = j; break; }
    }
    if (i === -1) return;

    if (a === 'del') { els.splice(i, 1); selId = null; showSelBar(null); }
    else if (a === 'front') { els.push(els.splice(i, 1)[0]); }
    else if (a === 'back') { els.unshift(els.splice(i, 1)[0]); }
    else if (a === 'dup') {
        var s = els[i], c = {};
        for (var k in s) c[k] = s[k];
        c.id = 'd' + Date.now();
        c.x = s.x + 14; c.y = s.y + 14;
        if (s.type === 'image' && s.eraserMask) {
            var nm = document.createElement('canvas');
            nm.width = s.eraserMask.width;
            nm.height = s.eraserMask.height;
            nm.getContext('2d').drawImage(s.eraserMask, 0, 0);
            c.eraserMask = nm; c.content = s.content;
        }
        els.push(c); selId = c.id;
    }
    sH('Layer: ' + a); R(); sUI(); updateCanvasInfo();
}

function alignEl(p) {
    var el = findEl(selId); if (!el) return;
    if (el.type === 'text') {
        if (p === 'l') el.x = 40;
        if (p === 'c') el.x = canvas.width / 2;
        if (p === 'r') el.x = canvas.width - 40;
        if (p === 'm') el.y = canvas.height / 2;
    } else {
        var w = el.content.width * (el.scale / 100);
        if (p === 'l') el.x = 0;
        if (p === 'c') el.x = (canvas.width - w) / 2;
        if (p === 'r') el.x = canvas.width - w;
        if (p === 'm') el.y = canvas.height / 2;
    }
    sH('Align ' + p); R();
}

/* ===== CANVAS EVENTS ===== */
function gCC(e) {
    var r = canvas.getBoundingClientRect();
    var ox = e.offsetX !== undefined ? e.offsetX : (e.clientX - r.left);
    var oy = e.offsetY !== undefined ? e.offsetY : (e.clientY - r.top);
    return {
        x: ox * (canvas.width / r.width),
        y: oy * (canvas.height / r.height)
    };
}

canvas.addEventListener('mousedown', function (e) { e.preventDefault(); mD(gCC(e)); });
canvas.addEventListener('mousemove', function (e) { if (drag) mV(gCC(e)); });
canvas.addEventListener('mouseup', function () { mU(); });
canvas.addEventListener('mouseleave', function () { if (drag) mU(); });

canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        var r = canvas.getBoundingClientRect(), t = e.touches[0];
        mD({
            x: (t.clientX - r.left) * (canvas.width / r.width),
            y: (t.clientY - r.top) * (canvas.height / r.height)
        });
    }
}, { passive: false });

canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    if (e.touches.length === 2 && selId) {
        var t1 = e.touches[0], t2 = e.touches[1];
        var dist = Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
        if (!canvas._pinchStart)
            canvas._pinchStart = { dist: dist, scale: (findEl(selId) || {}).scale || 100 };
        var el = findEl(selId);
        if (el) {
            el.scale = Math.max(12, Math.min(320,
                Math.round(canvas._pinchStart.scale * (dist / canvas._pinchStart.dist))));
            sUI(); R();
        }
        return;
    }
    if (e.touches.length === 1) {
        var t = e.touches[0];
        mV({
            x: (t.clientX - r.left) * (canvas.width / r.width),
            y: (t.clientY - r.top) * (canvas.height / r.height)
        });
    }
}, { passive: false });

canvas.addEventListener('touchend', function () {
    canvas._pinchStart = null; mU();
}, { passive: false });

function mD(pt) {
    var x = pt.x, y = pt.y;

    /* Eyedropper mode */
    if (eyedropperMode) {
        try {
            var pixel = ctx.getImageData(x, y, 1, 1).data;
            var hex = '#' + [pixel[0], pixel[1], pixel[2]].map(function (c) {
                return ('0' + c.toString(16)).slice(-2);
            }).join('');
            alert('Color picked: ' + hex);
            eyedropperMode = false;
            document.body.classList.remove('eyedropper-active');
        } catch (e) { }
        return;
    }

    if (mode !== 'select') { drag = true; doErase(x, y); return; }
    var hit = null;
    for (var i = els.length - 1; i >= 0; i--) {
        if (hitEl(els[i], x, y)) { hit = els[i]; break; }
    }

            if (hit) {
        selId = hit.id; drag = true;
        dX = x - hit.x; dY = y - hit.y;
        canvas.style.cursor = 'move';
        sUI(); showCornerHandles(hit);

        /* Auto populate text inputs */
        if (hit.type === 'text') {
            var di = document.getElementById('txtIn');
            var mi = document.getElementById('mobTxtIn');
            if (di) di.value = hit.text || '';
            if (mi) mi.value = hit.text || '';

            /* Auto open Type tab on mobile */
            if (window.innerWidth <= 900 && !document.body.classList.contains('sheet-open')) {
                var typeBtn = document.querySelector('[data-sheet="sheetText"]');
                if (typeBtn) openBottomSheet(typeBtn, 'sheetText');
            }
        }

        /* Auto open Move tab for images on mobile */
        if (hit.type === 'image') {
            if (window.innerWidth <= 900 && !document.body.classList.contains('sheet-open')) {
                var moveBtn = document.querySelector('[data-sheet="sheetTrans"]');
                if (moveBtn) openBottomSheet(moveBtn, 'sheetTrans');
            }
        }
    }

        /* Auto populate text in input bars */
        if (hit.type === 'text') {
            var di = document.getElementById('txtIn');
            var mi = document.getElementById('mobTxtIn');
            if (di) di.value = hit.text || '';
            if (mi) mi.value = hit.text || '';
        }
    }
    else {
        selId = null; drag = false;
        canvas.style.cursor = 'default';
        hideCornerHandles(); sUI();
    }
    R();
}

function hitEl(el, x, y) {
    if (el.type === 'image') {
        if (!el.content || !el.content.complete) return false;
        var w = el.content.width * (el.scale / 100);
        var h = el.content.height * (el.scale / 100);
        var cx2 = el.x + w / 2, cy2 = el.y + h / 2;
        var rot = (el.rotate || 0) * Math.PI / 180;
        var lx = Math.cos(-rot) * (x - cx2) - Math.sin(-rot) * (y - cy2);
        var ly = Math.sin(-rot) * (x - cx2) + Math.cos(-rot) * (y - cy2);
        return lx >= -w / 2 && lx <= w / 2 && ly >= -h / 2 && ly <= h / 2;
    }
    if (el.type === 'text') {
        ctx.save();
        var fs = Math.max(el.scale * 0.6, 8);
        ctx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
        var tw = ctx.measureText(el.text || '').width;
        var totalW = tw + ((el.charSpacing || 0) * (el.text || '').length);
        ctx.restore();
        var padding = 20;
        var textHeight = fs * 1.2;
        var rot = (el.rotate || 0) * Math.PI / 180;
        var lx = Math.cos(-rot) * (x - el.x) - Math.sin(-rot) * (y - el.y);
        var ly = Math.sin(-rot) * (x - el.x) + Math.cos(-rot) * (y - el.y);
        return lx >= -totalW / 2 - padding && lx <= totalW / 2 + padding &&
            ly >= -textHeight / 2 - padding && ly <= textHeight / 2 + padding;
    }
    return false;
}

function mV(pt) {
    if (!drag) return;
    if (mode !== 'select') { doErase(pt.x, pt.y); return; }
    var el = findEl(selId);
    if (el) { el.x = pt.x - dX; el.y = pt.y - dY; R(); showCornerHandles(el); }
}

function mU() {
    if (drag && selId) sH('Move');
    drag = false;
    if (mode === 'select')
        canvas.style.cursor = selId ? 'move' : 'default';
}

function setMode(m, btn) {
    mode = m;
    canvas.style.cursor = m !== 'select' ? 'crosshair' : 'default';
    var btns = document.querySelectorAll('.mode-btn, .sheet-mode-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    if (btn) btn.classList.add('active');
}

function doErase(cx, cy) {
    var el = findEl(selId);
    if (!el || el.type !== 'image') return;
    var mc = el.eraserMask.getContext('2d');
    var iw = el.content.width * (el.scale / 100);
    var ih = el.content.height * (el.scale / 100);
    var rx = ((cx - el.x) / iw) * el.eraserMask.width;
    var ry = ((cy - el.y) / ih) * el.eraserMask.height;
    var br = bSz * (el.eraserMask.width / Math.max(iw, 1));
    mc.save();
    mc.globalCompositeOperation = 'destination-out';
    mc.fillStyle = 'rgba(0,0,0,1)';
    mc.beginPath();
    if (mode === 'mask') mc.rect(rx - br, ry - br, br * 2, br * 2);
    else mc.arc(rx, ry, br, 0, Math.PI * 2);
    mc.fill();
    mc.restore(); R();
}

function restMask() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') return;
    var mc = el.eraserMask.getContext('2d');
    mc.globalCompositeOperation = 'source-over';
    mc.fillStyle = '#fff';
    mc.fillRect(0, 0, el.eraserMask.width, el.eraserMask.height);
    sH('Restore Mask'); R();
}

/* ===== PROPS ===== */
function setTxt(v) {
    var el = findEl(selId);
    if (!el || el.type !== 'text') {
        addText();
        el = findEl(selId);
    }
    if (el && el.type === 'text') {
        el.text = v; R();
        var di = document.getElementById('txtIn');
        if (di && di !== document.activeElement) di.value = v;
        var mi = document.getElementById('mobTxtIn');
        if (mi && mi !== document.activeElement) mi.value = v;
    }
}

function setProp(p, v) {
    var el = findEl(selId); if (!el) return;
    var cp = ['color', 'strokeColor', 'threeDColor', 'glowColor', 'font',
        'innerShadowColor', 'embossColor', 'threeDShadowColor'];
    el[p] = cp.indexOf(p) >= 0 ? v : parseFloat(v);
    R();
}

function upFont(ev) {
    var f = ev.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function (e) {
        var n = f.name.replace(/\.[^/.]+$/, '');
        try {
            var fc = new FontFace(n, 'url(' + e.target.result + ')');
            fc.load().then(function (l) {
                document.fonts.add(l);
                var sel = document.getElementById('fontSel');
                var op = document.createElement('option');
                op.value = n; op.textContent = n;
                sel.appendChild(op); sel.value = n;
            }).catch(function () { });
        } catch (err) { }
    };
    r.readAsDataURL(f); ev.target.value = '';
}


function sUI() {
    var el = findEl(selId);
    var lb = document.getElementById('selLbl');
    var lbd = document.getElementById('selLblDesk');
    var name = el ? (el.type === 'text' ? '"' + (el.text || '').substring(0, 8) + '"' : 'Image') : 'None';
    if (lb) lb.innerText = name;
    if (lbd) lbd.innerText = name;
    if (!el) { showSelBar(null); return; }

    /* Scale */
    var slSc = document.getElementById('sl-sc');
    var vSc = document.getElementById('v-sc');
    var mobSlSc = document.getElementById('mob-sl-sc');
    var mobVSc = document.getElementById('mob-v-sc');
    if (slSc) slSc.value = el.scale || 100;
    if (vSc) vSc.innerText = (el.scale || 100) + '%';
    if (mobSlSc) mobSlSc.value = el.scale || 100;
    if (mobVSc) mobVSc.innerText = (el.scale || 100) + '%';

    /* Rotate */
    var slRt = document.getElementById('sl-rt');
    var vRt = document.getElementById('v-rt');
    var mobSlRt = document.getElementById('mob-sl-rt');
    var mobVRt = document.getElementById('mob-v-rt');
    if (slRt) slRt.value = el.rotate || 0;
    if (vRt) vRt.innerText = (el.rotate || 0) + '°';
    if (mobSlRt) mobSlRt.value = el.rotate || 0;
    if (mobVRt) mobVRt.innerText = (el.rotate || 0) + '°';

    /* Opacity */
    var slOp = document.getElementById('sl-op');
    var vOp = document.getElementById('v-op');
    var mobSlOp = document.getElementById('mob-sl-op');
    var mobVOp = document.getElementById('mob-v-op');
    if (slOp) slOp.value = el.opacity || 100;
    if (vOp) vOp.innerText = (el.opacity || 100) + '%';
    if (mobSlOp) mobSlOp.value = el.opacity || 100;
    if (mobVOp) mobVOp.innerText = (el.opacity || 100) + '%';

    /* Text specific */
    if (el.type === 'text') {
        var ti = document.getElementById('txtIn');
        if (ti) ti.value = el.text || '';
        var mti = document.getElementById('mobTxtIn');
        if (mti) mti.value = el.text || '';
        
        var tc = document.getElementById('txtCol');
        if (tc) tc.value = el.color || '#7F3DFF';
        var mtc = document.getElementById('mobTxtCol');
        if (mtc) mtc.value = el.color || '#7F3DFF';

        /* Font size slider */
        var slFs = document.getElementById('sl-fs');
        var vFs = document.getElementById('v-fs');
        var mobSlFs = document.getElementById('mob-sl-fs');
        var mobVFs = document.getElementById('mob-v-fs');
        if (slFs) slFs.value = el.fontSize || 60;
        if (vFs) vFs.innerText = (el.fontSize || 60) + 'px';
        if (mobSlFs) mobSlFs.value = el.fontSize || 60;
        if (mobVFs) mobVFs.innerText = (el.fontSize || 60) + 'px';

        /* Spacing */
        var slSp = document.getElementById('sl-sp');
        var vSp = document.getElementById('v-sp');
        if (slSp) slSp.value = el.charSpacing || 0;
        if (vSp) vSp.innerText = (el.charSpacing || 0) + 'px';

        /* Curve */
        var slCu = document.getElementById('sl-cu');
        var vCu = document.getElementById('v-cu');
        if (slCu) slCu.value = el.curve || 0;
        if (vCu) vCu.innerText = (el.curve || 0) + '°';

        /* Stroke */
        var slSt = document.getElementById('sl-st');
        var vSt = document.getElementById('v-st');
        if (slSt) slSt.value = el.stroke || 0;
        if (vSt) vSt.innerText = (el.stroke || 0) + 'px';
        var cStroke = document.getElementById('c-stroke');
        if (cStroke) cStroke.value = el.strokeColor || '#000000';

        /* Glow */
        var slGw = document.getElementById('sl-gw');
        var vGw = document.getElementById('v-gw');
        if (slGw) slGw.value = el.glow || 0;
        if (vGw) vGw.innerText = (el.glow || 0) + 'px';
        var cGlow = document.getElementById('c-glow');
        if (cGlow) cGlow.value = el.glowColor || '#7F3DFF';

        /* 3D */
        var sl3d = document.getElementById('sl-3d');
        var v3d = document.getElementById('v-3d');
        if (sl3d) sl3d.value = el.threeDDepth || 0;
        if (v3d) v3d.innerText = (el.threeDDepth || 0) + 'px';
        var c3d = document.getElementById('c-3d');
        if (c3d) c3d.value = el.threeDColor || '#1e293b';

        /* Shadow */
        var slIs = document.getElementById('sl-is');
        var vIs = document.getElementById('v-is');
        if (slIs) slIs.value = el.innerShadow || 0;
        if (vIs) vIs.innerText = (el.innerShadow || 0) + 'px';
        var cIs = document.getElementById('c-is');
        if (cIs) cIs.value = el.innerShadowColor || '#000000';

        /* Emboss */
        var slEm = document.getElementById('sl-em');
        var vEm = document.getElementById('v-em');
        if (slEm) slEm.value = el.emboss || 0;
        if (vEm) vEm.innerText = (el.emboss || 0) + 'px';

        /* Reflection */
        var slRf = document.getElementById('sl-rf');
        var vRf = document.getElementById('v-rf');
        if (slRf) slRf.value = el.reflection || 0;
        if (vRf) vRf.innerText = (el.reflection || 0) + '%';
    }
}
/* ===== TEXT RENDER ===== */
function dTxt(el) {
    ctx.save();
    ctx.globalAlpha = (el.opacity || 100) / 100;
    var fs = el.fontSize || Math.max(el.scale * 0.6, 8);
    ctx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var txt = el.text || '';

    ctx.save();
    ctx.translate(el.x, el.y);
    ctx.rotate((el.rotate || 0) * Math.PI / 180);

    /* Glow */
    if ((el.glow || 0) > 0) {
        ctx.shadowColor = el.glowColor || '#7F3DFF';
        ctx.shadowBlur = el.glow;
    }

    /* 3D Depth */
    if ((el.threeDDepth || 0) > 0) {
        ctx.fillStyle = el.threeDColor || '#1e293b';
        for (var i = el.threeDDepth; i >= 1; i--) {
            ctx.fillText(txt, i * 0.8, i * 0.6);
        }
    }

    /* Emboss */
    if ((el.emboss || 0) > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillText(txt, -el.emboss * 0.4, -el.emboss * 0.4);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillText(txt, el.emboss * 0.4, el.emboss * 0.4);
    }

    /* Inner Shadow */
    if ((el.innerShadow || 0) > 0) {
        ctx.save();
        ctx.shadowColor = el.innerShadowColor || 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = el.innerShadow;
        ctx.fillStyle = el.color || '#7F3DFF';
        ctx.fillText(txt, 0, 0);
        ctx.restore();
    }

    /* Stroke */
    if ((el.stroke || 0) > 0) {
        ctx.lineWidth = el.stroke;
        ctx.strokeStyle = el.strokeColor || '#000';
        ctx.lineJoin = 'round';
        ctx.strokeText(txt, 0, 0);
    }

    /* Fill */
    ctx.fillStyle = el.color || '#7F3DFF';
    ctx.fillText(txt, 0, 0);

    ctx.restore();
    ctx.restore();
}

/* ===== RENDER ===== */
function R() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paintBg();

    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        ctx.save();
        ctx.globalAlpha = (el.opacity || 100) / 100;
        if (el.type === 'image') {
            if (!el.content || !el.content.complete || !el.content.naturalWidth) {
                ctx.restore(); continue;
            }
            var w = el.content.width * (el.scale / 100);
            var h = el.content.height * (el.scale / 100);
            if (w <= 0 || h <= 0) { ctx.restore(); continue; }
            ctx.translate(el.x + w / 2, el.y + h / 2);
            ctx.rotate((el.rotate || 0) * Math.PI / 180);
            var tmp = document.createElement('canvas');
            tmp.width = w; tmp.height = h;
            var tx = tmp.getContext('2d');
            tx.drawImage(el.content, 0, 0, w, h);
            if (el.eraserMask) {
                tx.globalCompositeOperation = 'destination-in';
                tx.drawImage(el.eraserMask, 0, 0, w, h);
            }
            ctx.drawImage(tmp, -w / 2, -h / 2);
        } else if (el.type === 'text') {
            dTxt(el);
        }
        ctx.restore();
    }

    if (selId) {
        var sel = findEl(selId);
        if (sel) {
            ctx.save();
            ctx.setLineDash([6, 3]);
            ctx.strokeStyle = '#7F3DFF';
            ctx.lineWidth = 2;
            if (sel.type === 'image' && sel.content && sel.content.complete) {
                var sw = sel.content.width * (sel.scale / 100);
                var sh = sel.content.height * (sel.scale / 100);
                ctx.save();
                ctx.translate(sel.x + sw / 2, sel.y + sh / 2);
                ctx.rotate((sel.rotate || 0) * Math.PI / 180);
                ctx.strokeRect(-sw / 2 - 5, -sh / 2 - 5, sw + 10, sh + 10);
                ctx.restore();
            }
            ctx.restore();
        }
    }
}

/* ===== GRADING ===== */
function liveG() {
    var ids = ['br', 'ct', 'sa', 'te', 'vi', 'gr'];
    for (var i = 0; i < ids.length; i++) {
        var s = document.getElementById('sg-' + ids[i]) ||
            document.getElementById('mob-sg-' + ids[i]);
        var v = document.getElementById('vg-' + ids[i]);
        if (s && v) v.innerText = s.value;
    }
}

var gPD = {
    cinematic: { br: -10, ct: 30, sa: -15, te: 10, vi: 40, gr: 5 },
    vintage: { br: 5, ct: 10, sa: -30, te: 15, vi: 30, gr: 15 },
    warm: { br: 10, ct: 10, sa: 15, te: 30, vi: 10, gr: 0 },
    cool: { br: 0, ct: 15, sa: -10, te: -30, vi: 15, gr: 0 },
    noir: { br: -20, ct: 50, sa: -100, te: 0, vi: 60, gr: 10 },
    neon: { br: 0, ct: 40, sa: 50, te: -10, vi: 20, gr: 0 },
    sepia: { br: 10, ct: 10, sa: -60, te: 30, vi: 20, gr: 8 },
    golden: { br: 10, ct: 20, sa: 20, te: 35, vi: 15, gr: 0 },
    hdr: { br: 5, ct: 50, sa: 30, te: 0, vi: 10, gr: 0 }
};

function gradeP(n) {
    var p = gPD[n]; if (!p) return;
    for (var k in p) {
        var sl = document.getElementById('sg-' + k); if (sl) sl.value = p[k];
        var msl = document.getElementById('mob-sg-' + k); if (msl) msl.value = p[k];
    }
    liveG();
}

function resetGrade() {
    ['br', 'ct', 'sa', 'te', 'vi', 'gr'].forEach(function (id) {
        var sl = document.getElementById('sg-' + id); if (sl) sl.value = 0;
        var msl = document.getElementById('mob-sg-' + id); if (msl) msl.value = 0;
    });
    liveG();
}

function applyGrade() {
    R();
    try {
        var d = ctx.getImageData(0, 0, canvas.width, canvas.height), px = d.data;
        var gv = function (id) {
            return parseInt((document.getElementById('sg-' + id) ||
                document.getElementById('mob-sg-' + id) || { value: 0 }).value) || 0;
        };
        var br = gv('br'), ct = gv('ct'), sa = gv('sa'), te = gv('te');
        var cf = (259 * (ct + 255)) / (255 * (259 - ct));
        for (var i = 0; i < px.length; i += 4) {
            var r = px[i], g = px[i + 1], b = px[i + 2];
            r += br; g += br; b += br;
            r = cf * (r - 128) + 128;
            g = cf * (g - 128) + 128;
            b = cf * (b - 128) + 128;
            r += te; b -= te;
            var gray = .299 * r + .587 * g + .114 * b, sf = 1 + sa / 100;
            r = gray + sf * (r - gray);
            g = gray + sf * (g - gray);
            b = gray + sf * (b - gray);
            px[i] = Math.max(0, Math.min(255, r));
            px[i + 1] = Math.max(0, Math.min(255, g));
            px[i + 2] = Math.max(0, Math.min(255, b));
        }
        ctx.putImageData(d, 0, 0);
        var img = new Image();
        img.src = canvas.toDataURL();
        img.onload = function () { aiBg = img; bgCf = null; sH('Grade'); R(); };
    } catch (e) { }
}

/* ===== PIXART ===== */
function getD() { R(); return ctx.getImageData(0, 0, canvas.width, canvas.height); }

function apD(d) {
    ctx.putImageData(d, 0, 0);
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function () { aiBg = img; bgCf = null; sH('FX'); R(); };
}

function pixelate(sz) {
    R();
    var W = canvas.width, H = canvas.height;
    var d = ctx.getImageData(0, 0, W, H), px = d.data;
    for (var y = 0; y < H; y += sz) {
        for (var x = 0; x < W; x += sz) {
            var r = 0, g = 0, b = 0, c = 0;
            for (var dy = 0; dy < sz && y + dy < H; dy++)
                for (var dx = 0; dx < sz && x + dx < W; dx++) {
                    var i = ((y + dy) * W + (x + dx)) * 4;
                    r += px[i]; g += px[i + 1]; b += px[i + 2]; c++;
                }
            r /= c; g /= c; b /= c;
            for (var dy = 0; dy < sz && y + dy < H; dy++)
                for (var dx = 0; dx < sz && x + dx < W; dx++) {
                    var i = ((y + dy) * W + (x + dx)) * 4;
                    px[i] = r; px[i + 1] = g; px[i + 2] = b;
                }
        }
    }
    apD(d);
}

function applyBlur(rad) {
    R();
    var W = canvas.width, H = canvas.height;
    var src = ctx.getImageData(0, 0, W, H);
    var dst = ctx.createImageData(W, H);
    var s = src.data, d = dst.data;
    for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
            var r = 0, g = 0, b = 0, c = 0;
            for (var dy = -rad; dy <= rad; dy++) {
                for (var dx = -rad; dx <= rad; dx++) {
                    var nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                        var i = (ny * W + nx) * 4;
                        r += s[i]; g += s[i + 1]; b += s[i + 2]; c++;
                    }
                }
            }
            var i = (y * W + x) * 4;
            d[i] = r / c; d[i + 1] = g / c; d[i + 2] = b / c; d[i + 3] = s[i + 3];
        }
    }
    apD(dst);
}

function applySharpen() {
    R();
    var W = canvas.width, H = canvas.height;
    var src = ctx.getImageData(0, 0, W, H);
    var dst = ctx.createImageData(W, H);
    var s = src.data, d = dst.data;
    var k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    for (var y = 1; y < H - 1; y++) {
        for (var x = 1; x < W - 1; x++) {
            var r = 0, g = 0, b = 0, ki = 0;
            for (var dy = -1; dy <= 1; dy++) {
                for (var dx = -1; dx <= 1; dx++) {
                    var i = ((y + dy) * W + (x + dx)) * 4;
                    r += s[i] * k[ki]; g += s[i + 1] * k[ki]; b += s[i + 2] * k[ki]; ki++;
                }
            }
            var i = (y * W + x) * 4;
            d[i] = Math.max(0, Math.min(255, r));
            d[i + 1] = Math.max(0, Math.min(255, g));
            d[i + 2] = Math.max(0, Math.min(255, b));
            d[i + 3] = s[i + 3];
        }
    }
    apD(dst);
}

function invertColors() {
    var d = getD(), px = d.data;
    for (var i = 0; i < px.length; i += 4) {
        px[i] = 255 - px[i];
        px[i + 1] = 255 - px[i + 1];
        px[i + 2] = 255 - px[i + 2];
    }
    apD(d);
}

function grayscale() {
    var d = getD(), px = d.data;
    for (var i = 0; i < px.length; i += 4) {
        var g = .299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2];
        px[i] = px[i + 1] = px[i + 2] = g;
    }
    apD(d);
}

function posterize(lv) {
    var d = getD(), px = d.data, step = 255 / lv;
    for (var i = 0; i < px.length; i += 4) {
        px[i] = Math.round(px[i] / step) * step;
        px[i + 1] = Math.round(px[i + 1] / step) * step;
        px[i + 2] = Math.round(px[i + 2] / step) * step;
    }
    apD(d);
}

function edgeDetect() {
    R();
    var W = canvas.width, H = canvas.height;
    var src = ctx.getImageData(0, 0, W, H);
    var dst = ctx.createImageData(W, H);
    var s = src.data, d = dst.data;
    for (var y = 1; y < H - 1; y++) {
        for (var x = 1; x < W - 1; x++) {
            var i = (y * W + x) * 4;
            var gx = (-s[((y - 1) * W + x - 1) * 4] + s[((y - 1) * W + x + 1) * 4] -
                2 * s[(y * W + x - 1) * 4] + 2 * s[(y * W + x + 1) * 4] -
                s[((y + 1) * W + x - 1) * 4] + s[((y + 1) * W + x + 1) * 4]);
            var gy = (-s[((y - 1) * W + x - 1) * 4] - 2 * s[((y - 1) * W + x) * 4] -
                s[((y - 1) * W + x + 1) * 4] + s[((y + 1) * W + x - 1) * 4] +
                2 * s[((y + 1) * W + x) * 4] + s[((y + 1) * W + x + 1) * 4]);
            d[i] = d[i + 1] = d[i + 2] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
            d[i + 3] = 255;
        }
    }
    apD(dst);
}

function applyNoise(amt) {
    var d = getD(), px = d.data;
    for (var i = 0; i < px.length; i += 4) {
        var n = (Math.random() - .5) * amt * 2;
        px[i] = Math.max(0, Math.min(255, px[i] + n));
        px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + n));
        px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + n));
    }
    apD(d);
}

function flipH() {
    R();
    var W = canvas.width, H = canvas.height;
    var d = ctx.getImageData(0, 0, W, H), px = d.data;
    for (var y = 0; y < H; y++) {
        for (var x = 0; x < Math.floor(W / 2); x++) {
            var l = (y * W + x) * 4, r = (y * W + (W - 1 - x)) * 4;
            for (var c = 0; c < 4; c++) {
                var tmp = px[l + c]; px[l + c] = px[r + c]; px[r + c] = tmp;
            }
        }
    }
    apD(d);
}

/* ===== BG REMOVE ===== */
function bgRemove(method) {
    var el = findEl(selId);
    if (!el || el.type !== 'image') return;

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'Removing BG';

    var tol = parseInt(
        (document.getElementById('sl-tol') ||
            document.getElementById('mob-sl-tol') || { value: 50 }).value
    ) || 50;

    setTimeout(function () {
        try {
            var mc = el.eraserMask;
            var mx = mc.getContext('2d');
            var tc = document.createElement('canvas');
            tc.width = el.content.width;
            tc.height = el.content.height;
            tc.getContext('2d').drawImage(el.content, 0, 0);
            var d = tc.getContext('2d').getImageData(0, 0, tc.width, tc.height);
            var data = d.data, W = tc.width, H = tc.height;
            mx.globalCompositeOperation = 'source-over';
            mx.fillStyle = '#fff';
            mx.fillRect(0, 0, mc.width, mc.height);
            var md = mx.getImageData(0, 0, mc.width, mc.height);
            var mD = md.data;
            var scX = mc.width / W, scY = mc.height / H;

            function mark(px, py) {
                var mx2 = Math.round(px * scX), my2 = Math.round(py * scY);
                if (mx2 >= 0 && mx2 < mc.width && my2 >= 0 && my2 < mc.height) {
                    var mi = (my2 * mc.width + mx2) * 4;
                    mD[mi] = 0; mD[mi + 1] = 0; mD[mi + 2] = 0; mD[mi + 3] = 0;
                }
            }

            function colorDist(r1, g1, b1, r2, g2, b2) {
                return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
            }

            if (method === 'color' || method === 'smart') {
                var corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
                var tR = 0, tG = 0, tB = 0;
                for (var ci = 0; ci < corners.length; ci++) {
                    var idx = (corners[ci][1] * W + corners[ci][0]) * 4;
                    tR += data[idx]; tG += data[idx + 1]; tB += data[idx + 2];
                }
                tR /= 4; tG /= 4; tB /= 4;

                for (var py = 0; py < H; py++) {
                    for (var px = 0; px < W; px++) {
                        var si = (py * W + px) * 4;
                        if (colorDist(data[si], data[si + 1], data[si + 2], tR, tG, tB) < tol) {
                            mark(px, py);
                        }
                    }
                }
            }

            if (method === 'bright') {
                for (var py = 0; py < H; py++) {
                    for (var px = 0; px < W; px++) {
                        var si = (py * W + px) * 4;
                        var b = (data[si] + data[si + 1] + data[si + 2]) / 3;
                        if (b > 255 - tol / 2 || b < tol / 2) mark(px, py);
                    }
                }
            }

            mx.putImageData(md, 0, 0);
            loader.style.display = 'none';
            sH('BG Removed');
            R();
        } catch (e) {
            loader.style.display = 'none';
        }
    }, 300);
}

/* ===== AI GENERATE ===== */
function generateAI() {
    var pv = (document.getElementById('aiPrompt').value || '').trim();
    if (!pv) return;

    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'Generating';

    var style = document.getElementById('aiStyle').value || '';
    var aiMode = document.getElementById('aiMode').value || 'bg';

    var url = 'https://image.pollinations.ai/prompt/' +
        encodeURIComponent(pv + style) +
        '?width=' + canvas.width + '&height=' + canvas.height +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

    var nb = new Image();
    nb.crossOrigin = 'anonymous';
    var to = setTimeout(function () { loader.style.display = 'none'; }, 45000);

    nb.onload = function () {
        clearTimeout(to);
        loader.style.display = 'none';
        if (aiMode === 'bg') {
            aiBg = nb; bgCf = null;
            sH('AI Background'); R();
        } else {
            addAILayer(nb);
        }
    };

    nb.onerror = function () {
        clearTimeout(to);
        loader.style.display = 'none';
    };

    nb.src = url;
}

function addAILayer(img) {
    var mc = document.createElement('canvas');
    mc.width = img.width; mc.height = img.height;
    mc.getContext('2d').fillStyle = '#fff';
    mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);
    var sc = 50;
    if (img.width * (sc / 100) > canvas.width * 0.65)
        sc = Math.floor(canvas.width * 0.65 / img.width * 100);
    sc = Math.max(12, sc);
    els.push({
        id: 'ai' + Date.now(), type: 'image', content: img,
        x: canvas.width / 2 - img.width * (sc / 100) / 2,
        y: canvas.height / 2 - img.height * (sc / 100) / 2,
        scale: sc, rotate: 0, opacity: 100, eraserMask: mc
    });
    selId = els[els.length - 1].id;
    sH('AI Layer'); R(); sUI(); updateCanvasInfo();
}

/* ===== MISC ===== */
function resetAll() {
    if (!confirm('Reset everything?')) return;
    els = []; selId = null; aiBg = null; bgCf = null;
    uS = []; rS = []; histLabels = [];
    sUI(); R(); updateCanvasInfo();
}

function exportHD() {
    openExport();
}

function doVoice(ev) {
    ev.preventDefault();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    var rec = new SR();
    rec.lang = 'en-US';
    rec.onresult = function (e) {
        document.getElementById('aiPrompt').value = e.results[0][0].transcript;
    };
    rec.start();
}

/* ===== INIT ===== */
window.addEventListener('DOMContentLoaded', function () {
    Anim = window.AnimationManager || null;
    UI = window.UIAnimations || null;
    Physics = window.PhysicsEngine || null;
    API = window.ApiClient || null;

    initSplash();
    initTheme();
    initUniverseBg();
    initAiChatDrag();
    initDropZone();

    /* Nebula */
    var chatNebula = null, sideNebula = null;
    var aiNbCanvas = document.getElementById('aiNebula');
    if (aiNbCanvas) {
        chatNebula = createNebula(aiNbCanvas);
        if (chatNebula) { chatNebula.init(); chatNebula.render(); }
    }
    var aiBoxEl = document.querySelector('.ai-box');
    if (aiBoxEl) {
        var sideNbCanvas = document.createElement('canvas');
        sideNbCanvas.className = 'ai-box-nebula';
        sideNbCanvas.style.cssText =
            'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.14';
        aiBoxEl.insertBefore(sideNbCanvas, aiBoxEl.firstChild);
        sideNebula = createNebula(sideNbCanvas);
        if (sideNebula) { sideNebula.init(); sideNebula.render(); }
    }

    window.addEventListener('resize', function () {
        if (chatNebula && chatNebula.resize) chatNebula.resize();
        if (sideNebula && sideNebula.resize) sideNebula.resize();
        R();
        if (selId) {
            var el = findEl(selId);
            if (el) showCornerHandles(el);
        }
    });

    /* Resize handles */
    var rL = document.getElementById('resizeLeft');
    var rB = document.getElementById('resizeBottom');
    var lSb = document.getElementById('leftSidebar');
    var bPn = document.getElementById('bottomPanel');

    if (rL && lSb) {
        rL.addEventListener('mousedown', function (e) {
            e.preventDefault(); resLOn = true;
            resLX = e.clientX; resLW = lSb.getBoundingClientRect().width;
        });
    }

    if (rB && bPn) {
        rB.addEventListener('mousedown', function (e) {
            e.preventDefault(); resBOn = true;
            resBY = e.clientY; resBH = bPn.getBoundingClientRect().height;
        });
    }

    /* Corner handles */
    var corners = ['rhNW', 'rhNE', 'rhSW', 'rhSE'];
    for (var ci = 0; ci < corners.length; ci++) {
        (function (cid) {
            var ch = document.getElementById(cid);
            if (ch) {
                ch.addEventListener('mousedown', function (e) { initCornerResize(cid, e); });
                ch.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    initCornerResize(cid, {
                        clientX: e.touches[0].clientX,
                        clientY: e.touches[0].clientY,
                        preventDefault: function () { }
                    });
                }, { passive: false });
            }
        })(corners[ci]);
    }

    document.addEventListener('mousemove', function (e) {
        if (resLOn && lSb) {
            var nw = Math.max(160, Math.min(380, resLW + (e.clientX - resLX)));
            lSb.style.width = nw + 'px';
            lSb.style.minWidth = nw + 'px';
            lSb.style.maxWidth = nw + 'px';
        }
        if (resBOn && bPn) {
            var nh = Math.max(44, Math.min(window.innerHeight * 0.6, resBH - (e.clientY - resBY)));
            bPn.style.height = nh + 'px';
        }
        if (cornerDrag) {
            var el = findEl(selId);
            if (el) {
                var dx = e.clientX - cornerStartX;
                var delta = (cornerDrag.indexOf('NW') >= 0 || cornerDrag.indexOf('SW') >= 0) ? -dx : dx;
                el.scale = Math.max(12, Math.min(320,
                    Math.round(cornerStartScale + delta * 0.35)));
                R(); showCornerHandles(el); sUI();
            }
        }
    });

    document.addEventListener('mouseup', function () {
        if (resLOn) resLOn = false;
        if (resBOn) resBOn = false;
        if (cornerDrag) { cornerDrag = null; sH('Resize'); }
    });

    /* Keyboard */
    document.addEventListener('keydown', function (e) {
        var t = document.activeElement ? document.activeElement.tagName : '';
        if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') {
            if (e.key === 'Escape') document.activeElement.blur();
            return;
        }
        if (e.key === 'Escape') {
            closeHelp(); closeBottomSheet(); closeMobMenu(); closeDownload();
            closeTemplates(); closeProjects(); closeLayers(); closeExport();
            if (aiChatOpen) toggleAiChat();
            if (selId) { selId = null; hideCornerHandles(); sUI(); R(); }
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
            e.preventDefault(); layerOp('del');
        }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
            e.preventDefault(); triggerUndo();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
            e.preventDefault(); triggerRedo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault(); if (selId) layerOp('dup');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault(); openExport();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault(); addText();
        }
        if (selId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.key) >= 0) {
            e.preventDefault();
            var el = findEl(selId);
            var step = e.shiftKey ? 10 : 2;
            if (el) {
                if (e.key === 'ArrowUp') el.y -= step;
                if (e.key === 'ArrowDown') el.y += step;
                if (e.key === 'ArrowLeft') el.x -= step;
                if (e.key === 'ArrowRight') el.x += step;
                R(); showCornerHandles(el);
            }
        }
    });

    /* Text auto-add */
    var txtInputs = ['txtIn', 'mobTxtIn'];
    txtInputs.forEach(function (id) {
        var inp = document.getElementById(id);
        if (!inp) return;
        inp.addEventListener('focus', function () {
            var el = findEl(selId);
            if (!el || el.type !== 'text') {
                addText();
                inp.value = '';
                inp.focus();
            }
        });
    });

    /* Canvas auto-close sheet */
    canvas.addEventListener('click', function () {
        if (document.body.classList.contains('sheet-open')) {
            closeBottomSheet();
        }
    });
    canvas.addEventListener('touchstart', function () {
        if (document.body.classList.contains('sheet-open')) {
            closeBottomSheet();
        }
    }, { passive: true });

    /* Export quality slider */
    var eq = document.getElementById('exportQuality');
    if (eq) {
        eq.addEventListener('input', function () {
            var v = document.getElementById('exportQualityVal');
            if (v) v.textContent = this.value + '%';
        });
    }

    /* Idle AI */
    setInterval(function () {
        if (Date.now() - lastActionTime > 20000) {
            askAI('user idle', false);
            lastActionTime = Date.now();
        }
    }, 15000);

    setupC(1280, 720);
    updateCanvasInfo();
    sH('Init');

    setTimeout(function () {
        askAI('user opened Arjona AI Studio', false);
    }, 3000);

    if (window.lucide) lucide.createIcons();

    console.log('Arjona AI Studio Ready — All Features Loaded');
});
/* ===== DOUBLE TAP TEXT → OPEN TYPE BAR ===== */
var lastTapTime = 0;
var lastTapX = 0;
var lastTapY = 0;

document.addEventListener('DOMContentLoaded', function() {
    var cv = document.getElementById('mainCanvas');
    if (!cv) return;

    /* Mobile Double Tap */
    cv.addEventListener('touchend', function(e) {
        var now = Date.now();
        var touch = e.changedTouches[0];
        var r = cv.getBoundingClientRect();
        var x = (touch.clientX - r.left) * (cv.width / r.width);
        var y = (touch.clientY - r.top) * (cv.height / r.height);

        if (now - lastTapTime < 300 &&
            Math.abs(x - lastTapX) < 30 &&
            Math.abs(y - lastTapY) < 30) {

            var hit = null;
            for (var i = els.length - 1; i >= 0; i--) {
                if (hitEl(els[i], x, y)) { hit = els[i]; break; }
            }

            if (hit && hit.type === 'text') {
                selId = hit.id;
                sUI();

                var di = document.getElementById('txtIn');
                var mi = document.getElementById('mobTxtIn');
                if (di) di.value = hit.text || '';
                if (mi) mi.value = hit.text || '';

                if (window.innerWidth <= 900) {
                    var typeBtn = document.querySelector('[data-sheet="sheetText"]');
                    if (typeBtn) openBottomSheet(typeBtn, 'sheetText');
                    setTimeout(function() {
                        if (mi) { mi.focus(); mi.select(); }
                    }, 300);
                } else {
                    var textTab = document.querySelector('[data-p="bpText"]');
                    if (textTab) bpTab(textTab);
                    setTimeout(function() {
                        if (di) { di.focus(); di.select(); }
                    }, 200);
                }
            }

            lastTapTime = 0;
        } else {
            lastTapTime = now;
            lastTapX = x;
            lastTapY = y;
        }
    }, { passive: true });

    /* PC Double Click */
    cv.addEventListener('dblclick', function(e) {
        var pt = gCC(e);
        var hit = null;
        for (var i = els.length - 1; i >= 0; i--) {
            if (hitEl(els[i], pt.x, pt.y)) { hit = els[i]; break; }
        }

        if (hit && hit.type === 'text') {
            selId = hit.id;
            sUI();

            var di = document.getElementById('txtIn');
            var mi = document.getElementById('mobTxtIn');
            if (di) di.value = hit.text || '';
            if (mi) mi.value = hit.text || '';

            var textTab = document.querySelector('[data-p="bpText"]');
            if (textTab) bpTab(textTab);
            setTimeout(function() {
                if (di) { di.focus(); di.select(); }
            }, 200);
        }
    });
});
/* ============================================
   FIX NON-WORKING FUNCTIONS
   ============================================ */

/* ===== BETTER DRAW MODE ===== */
var isDrawing = false;
var drawPoints = [];

function toggleDrawMode() {
    drawingMode = !drawingMode;
    if (drawingMode) {
        document.body.classList.add('drawing-mode');
        canvas.style.cursor = 'crosshair';
        
        /* Add draw listeners */
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', drawOnCanvas);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('touchstart', startDrawTouch, { passive: false });
        canvas.addEventListener('touchmove', drawOnCanvasTouch, { passive: false });
        canvas.addEventListener('touchend', endDraw);
    } else {
        document.body.classList.remove('drawing-mode');
        canvas.style.cursor = 'default';
        canvas.removeEventListener('mousedown', startDraw);
        canvas.removeEventListener('mousemove', drawOnCanvas);
        canvas.removeEventListener('mouseup', endDraw);
        canvas.removeEventListener('touchstart', startDrawTouch);
        canvas.removeEventListener('touchmove', drawOnCanvasTouch);
        canvas.removeEventListener('touchend', endDraw);
    }
}

function startDraw(e) {
    if (!drawingMode) return;
    isDrawing = true;
    var pt = gCC(e);
    drawPoints = [pt];
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = '#7F3DFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function startDrawTouch(e) {
    if (!drawingMode) return;
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    var t = e.touches[0];
    isDrawing = true;
    var pt = {
        x: (t.clientX - r.left) * (canvas.width / r.width),
        y: (t.clientY - r.top) * (canvas.height / r.height)
    };
    drawPoints = [pt];
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = '#7F3DFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

function drawOnCanvas(e) {
    if (!isDrawing || !drawingMode) return;
    var pt = gCC(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    drawPoints.push(pt);
}

function drawOnCanvasTouch(e) {
    if (!isDrawing || !drawingMode) return;
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    var t = e.touches[0];
    var pt = {
        x: (t.clientX - r.left) * (canvas.width / r.width),
        y: (t.clientY - r.top) * (canvas.height / r.height)
    };
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    drawPoints.push(pt);
}

function endDraw() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.closePath();
    
    /* Save drawing as background */
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        aiBg = img;
        bgCf = null;
        sH('Drawing');
        R();
    };
}

/* ===== BETTER CROP MODE ===== */
var cropStartX = 0, cropStartY = 0;
var cropEndX = 0, cropEndY = 0;
var isCropping = false;

function toggleCropMode() {
    cropMode = !cropMode;
    if (cropMode) {
        document.body.classList.add('crop-mode');
        canvas.style.cursor = 'crosshair';
        
        canvas.addEventListener('mousedown', startCrop);
        canvas.addEventListener('mousemove', moveCrop);
        canvas.addEventListener('mouseup', endCrop);
    } else {
        document.body.classList.remove('crop-mode');
        canvas.style.cursor = 'default';
        canvas.removeEventListener('mousedown', startCrop);
        canvas.removeEventListener('mousemove', moveCrop);
        canvas.removeEventListener('mouseup', endCrop);
        
        /* Remove crop overlay */
        var overlay = document.querySelector('.crop-overlay');
        if (overlay) overlay.remove();
    }
}

function startCrop(e) {
    if (!cropMode) return;
    var pt = gCC(e);
    cropStartX = pt.x;
    cropStartY = pt.y;
    isCropping = true;
}

function moveCrop(e) {
    if (!isCropping || !cropMode) return;
    var pt = gCC(e);
    cropEndX = pt.x;
    cropEndY = pt.y;
    
    /* Draw crop selection */
    R();
    ctx.save();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = '#7F3DFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        Math.min(cropStartX, cropEndX),
        Math.min(cropStartY, cropEndY),
        Math.abs(cropEndX - cropStartX),
        Math.abs(cropEndY - cropStartY)
    );
    ctx.restore();
}

function endCrop(e) {
    if (!isCropping) return;
    isCropping = false;
    
    var x = Math.min(cropStartX, cropEndX);
    var y = Math.min(cropStartY, cropEndY);
    var w = Math.abs(cropEndX - cropStartX);
    var h = Math.abs(cropEndY - cropStartY);
    
    if (w < 10 || h < 10) return;
    
    if (confirm('Crop to selected area?')) {
        var cropData = ctx.getImageData(x, y, w, h);
        canvas.width = w;
        canvas.height = h;
        ctx.putImageData(cropData, 0, 0);
        
        var img = new Image();
        img.src = canvas.toDataURL();
        img.onload = function() {
            aiBg = img;
            bgCf = null;
            sH('Crop');
            updateCanvasInfo();
            R();
        };
    }
    
    toggleCropMode();
}

/* ===== BETTER STICKERS ===== */
function openStickers() {
    var stickers = [
        '⭐', '❤️', '🔥', '✨', '💯', '🎉', '👍', '💎',
        '🌟', '⚡', '🎨', '🚀', '💪', '🎵', '🌈', '🏆',
        '😎', '🤩', '😍', '🥳', '🎭', '🎪', '🎯', '💡',
        '📸', '🎬', '🌺', '🦋', '🍀', '⭕', '❌', '✅'
    ];
    
    var stickerHTML = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:8px;padding:10px">';
    stickers.forEach(function(s) {
        stickerHTML += '<button style="font-size:24px;padding:8px;background:var(--sf2);' +
            'border:1px solid var(--bd);border-radius:8px;cursor:pointer" ' +
            'onclick="addStickerToCanvas(\'' + s + '\')">' + s + '</button>';
    });
    stickerHTML += '</div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head">' +
        '<h2>Stickers</h2><button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button>' +
        '</div><div class="modal-body">' + stickerHTML + '</div></div>';
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

function addStickerToCanvas(sticker) {
    els.push({
        id: 'st' + Date.now(),
        type: 'text',
        text: sticker,
        x: canvas.width / 2,
        y: canvas.height / 2,
        scale: 120, rotate: 0, opacity: 100,
        font: 'Arial', color: '#ffffff',
        charSpacing: 0, curve: 0,
        stroke: 0, glow: 0, emboss: 0,
        threeDDepth: 0, innerShadow: 0, reflection: 0
    });
    selId = els[els.length - 1].id;
    sH('Sticker');
    R();
    sUI();
    
    /* Close modal */
    var modal = document.querySelector('.modal-overlay:last-child');
    if (modal) modal.remove();
}

/* ===== BETTER FRAMES ===== */
function openFrames() {
    var frames = [
        { name: 'Polaroid', border: 30, color: '#ffffff', bottom: 80 },
        { name: 'Vintage', border: 15, color: '#8B4513', bottom: 15 },
        { name: 'Modern', border: 5, color: '#7F3DFF', bottom: 5 },
        { name: 'Shadow', border: 0, color: 'none', bottom: 0, shadow: true },
        { name: 'Double', border: 8, color: '#ffffff', bottom: 8, double: true },
        { name: 'Rounded', border: 20, color: '#1a1a1a', bottom: 20, rounded: true }
    ];
    
    var frameHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px">';
    frames.forEach(function(f, idx) {
        frameHTML += '<button style="padding:16px 8px;background:var(--sf2);' +
            'border:1px solid var(--bd);border-radius:10px;cursor:pointer;' +
            'color:var(--tx);font-size:11px;font-weight:600" ' +
            'onclick="applyFrame(' + idx + ')">' + f.name + '</button>';
    });
    frameHTML += '</div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'framesModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head">' +
        '<h2>Frames</h2><button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button>' +
        '</div><div class="modal-body">' + frameHTML + '</div></div>';
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

function applyFrame(idx) {
    var frames = [
        { border: 30, color: '#ffffff', bottom: 80 },
        { border: 15, color: '#8B4513', bottom: 15 },
        { border: 5, color: '#7F3DFF', bottom: 5 },
        { border: 10, color: '#333333', bottom: 10 },
        { border: 8, color: '#ffffff', bottom: 8 },
        { border: 20, color: '#1a1a1a', bottom: 20 }
    ];
    
    var f = frames[idx];
    R();
    
    /* Draw frame on canvas */
    ctx.save();
    ctx.strokeStyle = f.color;
    ctx.lineWidth = f.border;
    ctx.strokeRect(
        f.border / 2, f.border / 2,
        canvas.width - f.border,
        canvas.height - f.border
    );
    ctx.restore();
    
    /* Save as background */
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        aiBg = img;
        bgCf = null;
        sH('Frame');
        R();
    };
    
    /* Close modal */
    var modal = document.getElementById('framesModal');
    if (modal) modal.remove();
}

/* ===== BETTER EYEDROPPER ===== */
function toggleEyedropper() {
    eyedropperMode = !eyedropperMode;
    if (eyedropperMode) {
        document.body.classList.add('eyedropper-active');
        canvas.style.cursor = 'crosshair';
    } else {
        document.body.classList.remove('eyedropper-active');
        canvas.style.cursor = 'default';
    }
}

/* ===== BETTER COLLAGE ===== */
function openCollage() {
    var layouts = [
        { name: '2 Grid', cols: 2, rows: 1 },
        { name: '3 Grid', cols: 3, rows: 1 },
        { name: '4 Grid', cols: 2, rows: 2 },
        { name: '6 Grid', cols: 3, rows: 2 },
        { name: '9 Grid', cols: 3, rows: 3 }
    ];
    
    var layoutHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px">';
    layouts.forEach(function(l, idx) {
        layoutHTML += '<button style="padding:16px 8px;background:var(--sf2);' +
            'border:1px solid var(--bd);border-radius:10px;cursor:pointer;' +
            'color:var(--tx);font-size:11px;font-weight:600" ' +
            'onclick="applyCollage(' + l.cols + ',' + l.rows + ')">' + l.name + '</button>';
    });
    layoutHTML += '</div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'collageModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head">' +
        '<h2>Collage Layout</h2><button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button>' +
        '</div><div class="modal-body">' + layoutHTML + '</div></div>';
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

function applyCollage(cols, rows) {
    /* Draw collage grid on canvas */
    R();
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    
    var cellW = canvas.width / cols;
    var cellH = canvas.height / rows;
    
    for (var c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, canvas.height);
        ctx.stroke();
    }
    for (var r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(canvas.width, r * cellH);
        ctx.stroke();
    }
    ctx.restore();
    
    /* Save */
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function() {
        aiBg = img;
        bgCf = null;
        sH('Collage Grid');
        R();
    };
    
    var modal = document.getElementById('collageModal');
    if (modal) modal.remove();
}

/* ===== BETTER GRADIENT ===== */
function openGradient() {
    var presets = [
        { name: 'Sunset', c1: '#FF6B6B', c2: '#FFD93D' },
        { name: 'Ocean', c1: '#00C6FF', c2: '#0072FF' },
        { name: 'Purple', c1: '#7F3DFF', c2: '#00C6FF' },
        { name: 'Forest', c1: '#134E5E', c2: '#71B280' },
        { name: 'Fire', c1: '#FF416C', c2: '#FF4B2B' },
        { name: 'Night', c1: '#0F2027', c2: '#2C5364' }
    ];
    
    var gradHTML = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:10px">';
    presets.forEach(function(g) {
        gradHTML += '<button style="padding:20px 8px;background:linear-gradient(135deg,' + g.c1 + ',' + g.c2 + ');' +
            'border:1px solid var(--bd);border-radius:10px;cursor:pointer;' +
            'color:#fff;font-size:11px;font-weight:600" ' +
            'onclick="applyGradientPreset(\'' + g.c1 + '\',\'' + g.c2 + '\')">' + g.name + '</button>';
    });
    gradHTML += '</div>';
    gradHTML += '<div style="padding:10px;display:flex;gap:8px;align-items:center">' +
        '<input type="color" id="gradC1" value="#00C6FF" style="width:40px;height:30px;border-radius:6px">' +
        '<input type="color" id="gradC2" value="#7F3DFF" style="width:40px;height:30px;border-radius:6px">' +
        '<button style="padding:8px 16px;background:var(--ac);color:#fff;border:none;border-radius:8px;' +
        'cursor:pointer;font-weight:600" onclick="applyCustomGradient()">Apply</button></div>';
    
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'gradientModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head">' +
        '<h2>Gradient</h2><button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button>' +
        '</div><div class="modal-body">' + gradHTML + '</div></div>';
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
    
    document.body.appendChild(overlay);
}

function applyGradientPreset(c1, c2) {
    bgCf = { type: 'grad', c1: c1, c2: c2, dir: 'diag' };
    aiBg = null;
    sH('Gradient');
    R();
    var modal = document.getElementById('gradientModal');
    if (modal) modal.remove();
}

function applyCustomGradient() {
    var c1 = document.getElementById('gradC1').value;
    var c2 = document.getElementById('gradC2').value;
    applyGradientPreset(c1, c2);
}

/* ===== EXPORT QUALITY SLIDER ===== */
document.addEventListener('DOMContentLoaded', function() {
    var eq = document.getElementById('exportQuality');
    if (eq) {
        eq.addEventListener('input', function() {
            var v = document.getElementById('exportQualityVal');
            if (v) v.textContent = this.value + '%';
        });
    }
});

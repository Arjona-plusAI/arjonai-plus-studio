/* ============================================
   ARJONA +AI STUDIO — CLEAN SCRIPT
   All duplicate functions merged into single versions
   ============================================ */

/* ===== MODULE REFERENCES ===== */

var Anim = window.AnimationManager || null;
var UI = window.UIAnimations || null;
var Physics = window.PhysicsEngine || null;
var API = window.ApiClient || null;

/* ===== GROQ AI KEY =====
   WARNING: Yeh key PUBLIC hai. Koi bhi page source me dekh sakta hai.
   Sahi tarika: ek backend proxy banao jo key ko chupaye.
   Abhi production ke liye yahan apni nayi key daalo, ya empty rakho. */

var GROQ_KEY = ''; // <-- yahan apni key daalo (temporary), ya backend proxy use karo
window.GROQ_KEY = GROQ_KEY;

/* ===== BG CANVAS ===== */

var bgC = document.getElementById('bgCanvas');
var bgX = bgC ? bgC.getContext('2d') : null;
function initUniverseBg() {
    if (bgC) { bgC.width = 10; bgC.height = 10; }
}

/* ===== SPLASH SCREEN ===== */

function initSplash() {
    try {
        var splash = document.getElementById('splashScreen');
        var fill = document.getElementById('splashFill');
        var txt = document.getElementById('splashTxt');
        if (!splash) return;
        var msgs = ['Loading engine', 'Connecting AI', 'Preparing canvas', 'Ready'];
        var step = 0;
        var interval = setInterval(function () {
            try {
                step++;
                if (txt && step < msgs.length) txt.textContent = msgs[step];
                if (fill) fill.style.width = Math.min(100, 25 + step * 25) + '%';
            } catch(e) {}
        }, 350);
        setTimeout(function () {
            try {
                clearInterval(interval);
                if (fill) fill.style.width = '100%';
                if (txt) txt.textContent = 'Ready';
                setTimeout(function () {
                    try {
                        if (splash) splash.classList.add('hidden');
                        setTimeout(function () {
                            try { if (splash && splash.parentNode) splash.parentNode.removeChild(splash); } catch(e) {}
                        }, 500);
                    } catch(e) {}
                }, 300);
            } catch(e) {}
        }, 1500);

        // Failsafe timer: guarantees splash screen dismissal even if Live Server websocket reload or network delay throttles timers
        setTimeout(function () {
            try {
                if (typeof interval !== 'undefined') clearInterval(interval);
                var sp = document.getElementById('splashScreen');
                if (sp) {
                    sp.classList.add('hidden');
                    if (sp.parentNode) sp.parentNode.removeChild(sp);
                }
            } catch(e) {}
        }, 2200);
    } catch(err) {
        console.warn('Splash screen warning:', err);
    }
}

/* ===== SAFE WRAPPERS ===== */

function showToastSafe(msg, type, duration) { return; }
function showProgressSafe(label) {
    try { if (UI && UI.progress) return UI.progress(label); } catch (e) { }
    return { complete: function () { }, setProgress: function () { } };
}
function doShake(el) { try { if (Anim && Anim.shake) Anim.shake(el); } catch (e) { } }

/* ===== DOWNLOAD FUNCTIONS ===== */

function openDownload() {
    var o = document.getElementById('downloadOverlay');
    if (o) o.style.display = 'flex';
}
function closeDownload() {
    var o = document.getElementById('downloadOverlay');
    if (o) o.style.display = 'none';
}
function installApp(platform) {
    if (platform === 'ios') {
        if (window.InstallManager && InstallManager.showIOSGuide) InstallManager.showIOSGuide();
        closeDownload();
        return;
    }
    if (platform === 'android' || platform === 'desktop') {
        if (window.InstallManager && InstallManager.install) InstallManager.install();
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

/* ============================================
   STATE (ek hi jagah, upar)
   ============================================ */

var canvas = document.getElementById('mainCanvas');
var ctx = canvas.getContext('2d');
var loader = document.getElementById('loader');
var els = [], selId = null, aiBg = null, bgCf = null;
var uS = [], rS = [], histLabels = [];
var mode = 'select', bSz = 25;
var drag = false, dX = 0, dY = 0;
var resLOn = false, resLX = 0, resLW = 0;
var resBOn = false, resBY = 0, resBH = 0;
var cornerDrag = null, cornerStartX = 0, cornerStartY = 0, cornerStartScale = 100, cornerStartFontSize = 60;
var drawingMode = false, isDrawing = false;
var cropMode = false, cropRatio = '1', cropRotation = 0;
var cropEl = null, cropSrcImg = null, cropDispW = 0, cropDispH = 0;
var cropBox = { x: 0, y: 0, w: 0, h: 0 };
var cropDrag = null, cropSX = 0, cropSY = 0, cropSBX = 0, cropSBY = 0, cropSBW = 0, cropSBH = 0;
var cropFlipH = false, cropFlipV = false, cropZoom = 1, cropCircle = false, cropLocked = false;
var eyedropperMode = false, gridVisible = false;
var drawColor = '#7F3DFF', drawSize = 5;

function findEl(id) {
    for (var i = 0; i < els.length; i++) if (els[i].id === id) return els[i];
    return null;
}

/* ============================================
   TEMPLATES (B12)
   ============================================ */

function openTemplates() {
    var o = document.getElementById('templatesModal');
    if (o) { o.style.display = 'flex'; loadTemplates('social', document.querySelector('.tpl-tab')); }
}
function closeTemplates() {
    var o = document.getElementById('templatesModal');
    if (o) o.style.display = 'none';
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
    setupC(parseInt(size[0]), parseInt(size[1]));
    if (tpl.bg.indexOf('gradient') >= 0) {
        var match = tpl.bg.match(/#[0-9a-f]+/gi);
        if (match && match.length >= 2) bgCf = { type: 'grad', c1: match[0], c2: match[1], dir: 'diag' };
    } else {
        bgCf = { type: 'solid', color: tpl.bg };
    }
    aiBg = null;
    sH('Template: ' + tpl.name);
    R();
    closeTemplates();
}

/* ============================================
   PROJECTS (B13)
   ============================================ */

function openProjects() {
    var o = document.getElementById('projectsModal');
    if (o) { o.style.display = 'flex'; renderProjectsList(); }
}
function closeProjects() {
    var o = document.getElementById('projectsModal');
    if (o) o.style.display = 'none';
}
function getProjects() {
    try { return JSON.parse(localStorage.getItem('arjona_projects') || '[]'); } catch (e) { return []; }
}
function saveCurrentProject() {
    var nameInp = document.getElementById('projectName');
    var name = (nameInp.value || 'Untitled').trim();
    if (!name) return;
    var projects = getProjects();
    projects.push({
        id: 'p' + Date.now(), name: name, date: new Date().toISOString(),
        data: serS(), width: canvas.width, height: canvas.height
    });
    try { localStorage.setItem('arjona_projects', JSON.stringify(projects)); }
    catch (e) { alert('Storage full. Purani projects delete karo.'); return; }
    nameInp.value = '';
    renderProjectsList();
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
            '<div class="project-info"><div class="project-name">' + p.name + '</div>' +
            '<div class="project-date">' + date + ' · ' + p.width + '×' + p.height + '</div></div>' +
            '<div class="project-actions-btns">' +
            '<button class="proj-btn" onclick="loadProject(\'' + p.id + '\')" title="Load"><i data-lucide="folder-open"></i></button>' +
            '<button class="proj-btn proj-del" onclick="deleteProject(\'' + p.id + '\')" title="Delete"><i data-lucide="trash-2"></i></button>' +
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
    var projects = getProjects().filter(function (x) { return x.id !== id; });
    try { localStorage.setItem('arjona_projects', JSON.stringify(projects)); } catch (e) { }
    renderProjectsList();
}

/* ============================================
   LAYERS PANEL (B14)
   ============================================ */

function openLayers() {
    var o = document.getElementById('layersModal');
    if (o) { o.style.display = 'flex'; renderLayersPanel(); }
}
function closeLayers() {
    var o = document.getElementById('layersModal');
    if (o) o.style.display = 'none';
}
function renderLayersPanel() {
    var panel = document.getElementById('layersPanel');
    if (!panel) {
        // Check if our mobToolEditor is showing layers panel
        panel = document.getElementById('mobEditorBody');
        if (!panel || currentMobEditorOption?.id !== 'panel') return;
    }
    if (els.length === 0) {
        panel.innerHTML = '<div style="text-align:center;padding:24px;color:var(--tx3)">No layers</div>';
        return;
    }
    panel.innerHTML = `
        <div class="layers-merge-bar" style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 12px; background:var(--bd); border-radius:8px; margin-bottom:10px; border:1px solid var(--bd2); flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:6px;">
                <input type="checkbox" id="selectAllMergeCb" onchange="toggleSelectAllMerge(this)" style="width:16px; height:16px; cursor:pointer;">
                <label for="selectAllMergeCb" style="font-size:11px; font-weight:700; color:var(--tx1); cursor:pointer;">Select All (<span id="mergeSelectedCount">0</span>)</label>
            </div>
            <button class="btn-action-primary" id="mergeActionBtn" onclick="mergeCheckedLayers()" disabled style="background:var(--ac); color:#fff; font-size:11px; font-weight:700; padding:6px 12px; border-radius:6px; border:none; opacity:0.5; cursor:not-allowed;">🔀 Merge Selected</button>
        </div>
    `;
    els.slice().reverse().forEach(function (el, idx) {
        var item = document.createElement('div');
        item.className = 'layer-item' + (el.id === selId ? ' selected' : '');
        item.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:8px; border:1px solid var(--bd2); background:var(--bg); margin-bottom:6px;";
        
        // Visual Preview of Content (thumb)
        var thumbHtml = '';
        if (el.type === 'image' && el.content) {
            var imgSrc = el.content.src;
            if (!imgSrc || !imgSrc.startsWith('data:')) {
                try { imgSrc = serializeImg(el.content); } catch(err) { imgSrc = ''; }
            }
            if (imgSrc) {
                thumbHtml = '<img src="' + imgSrc + '" style="width:34px; height:34px; border-radius:6px; object-fit:cover; border:1px solid var(--bd3); background:#000;">';
            } else {
                thumbHtml = '<i data-lucide="image" style="width:18px;height:18px"></i>';
            }
        } else if (el.type === 'text') {
            var txtCol = el.color || '#ffffff';
            var shortTxt = (el.text || 'T').substring(0, 3);
            thumbHtml = '<div style="width:34px; height:34px; border-radius:6px; display:flex; align-items:center; justify-content:center; background:var(--bd); border:1px solid var(--bd3); color:' + txtCol + '; font-size:12px; font-weight:800; overflow:hidden;">' + shortTxt + '</div>';
        }

        var name = el.type === 'text' ? '"' + (el.text || '').substring(0, 18) + '"' : 'Image Layer ' + (els.length - idx);
        
        item.innerHTML = `
            <input type="checkbox" class="layer-merge-cb" value="${el.id}" onchange="updateMergeButtonState()" style="width:16px; height:16px; cursor:pointer; flex-shrink:0;" title="Select for merge">
            <div class="layer-thumb" style="flex-shrink:0; display:flex; align-items:center; justify-content:center;">${thumbHtml}</div>
            <div class="layer-name" style="flex:1; min-width:0; cursor:pointer;" onclick="selectLayer('${el.id}')">
                <div style="font-size:12px; font-weight:700; color:var(--tx1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${name}</div>
                <div style="font-size:10px; color:var(--tx3);">${el.type.toUpperCase()} · ${Math.round(el.scale||100)}%</div>
            </div>
            <div class="layer-controls" style="display:flex; align-items:center; gap:4px; flex-shrink:0;">
                <button class="layer-ctrl ${el.locked ? 'locked' : ''}" onclick="toggleLayerLock('${el.id}')" title="${el.locked ? 'Unlock Layer' : 'Lock Layer'}" style="width:30px; height:28px; border-radius:6px; border:1px solid var(--bd2); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px;">${el.locked ? '🔒' : '🔓'}</button>
                <button class="layer-ctrl" onclick="editLayerById('${el.id}')" title="Edit Layer" style="width:30px; height:28px; border-radius:6px; border:1px solid var(--bd2); background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px;">✏️</button>
                <button class="layer-ctrl" onclick="selectLayer('${el.id}')" title="Select Layer" style="width:30px; height:28px; border-radius:6px; border:1px solid var(--bd2); background:${el.id === selId ? 'var(--ac)' : 'transparent'}; color:${el.id === selId ? '#fff' : 'inherit'}; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                </button>
                <button class="layer-ctrl" onclick="deleteLayerById('${el.id}')" title="Delete Layer" style="width:30px; height:28px; border-radius:6px; border:1px solid var(--bd2); background:transparent; color:var(--dn); cursor:pointer; display:flex; align-items:center; justify-content:center;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;
        panel.appendChild(item);
    });
    if (window.lucide) lucide.createIcons();
}

function toggleLayerLock(id) {
    var el = findEl(id);
    if (!el) return;
    el.locked = !el.locked;
    if (typeof sH === 'function') sH(el.locked ? 'Lock Layer' : 'Unlock Layer');
    if (typeof R === 'function') R();
    if (typeof sUI === 'function') sUI();
    renderLayersPanel();
}

function editLayerById(id) {
    var el = findEl(id);
    if (!el) return;
    selId = id;
    if (typeof sUI === 'function') sUI();
    if (typeof showCornerHandles === 'function') showCornerHandles(el);
    if (window.innerWidth <= 900) {
        if (el.type === 'text') {
            if (typeof selectBottomTab === 'function') selectBottomTab('type');
            if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'typography', label: 'Typography', requiresSelection: false }, 'Type');
            setTimeout(function() {
                var inp = document.querySelector('.mob-tool-editor .text-input-field');
                if (inp) { inp.value = el.text || ''; inp.focus(); inp.select(); }
            }, 150);
        } else {
            if (typeof selectBottomTab === 'function') selectBottomTab('move');
            if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'scale', label: 'Scale', requiresSelection: false }, 'Move');
        }
    } else {
        if (typeof closeLayers === 'function') closeLayers();
        if (el.type === 'text') {
            var textTab = document.querySelector('[data-p="bpText"]');
            if (textTab && typeof bpTab === 'function') bpTab(textTab);
            setTimeout(function() { var di = document.getElementById('txtIn'); if (di) { di.focus(); di.select(); } }, 200);
        } else {
            var transTab = document.querySelector('[data-p="bpTrans"]');
            if (transTab && typeof bpTab === 'function') bpTab(transTab);
        }
    }
}

function updateMergeButtonState() {
    var checked = document.querySelectorAll('.layer-merge-cb:checked');
    var count = checked.length;
    var countEl = document.getElementById('mergeSelectedCount');
    if (countEl) countEl.innerText = count;
    var btn = document.getElementById('mergeActionBtn');
    if (btn) {
        if (count >= 2) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }
}

function toggleSelectAllMerge(masterCb) {
    var cbs = document.querySelectorAll('.layer-merge-cb');
    for (var i = 0; i < cbs.length; i++) {
        cbs[i].checked = masterCb.checked;
    }
    updateMergeButtonState();
}

function mergeCheckedLayers() {
    var checked = document.querySelectorAll('.layer-merge-cb:checked');
    if (checked.length < 2) {
        alert('Please select at least 2 layers to merge.');
        return;
    }
    var idsToMerge = [];
    for (var i = 0; i < checked.length; i++) idsToMerge.push(checked[i].value);

    var layersToMerge = [];
    for (var j = 0; j < els.length; j++) {
        if (idsToMerge.indexOf(els[j].id) >= 0) {
            layersToMerge.push(els[j]);
        }
    }
    if (layersToMerge.length < 2) return;

    var oc = document.createElement('canvas');
    oc.width = canvas.width;
    oc.height = canvas.height;
    var octx = oc.getContext('2d');

    layersToMerge.forEach(function (el) {
        if (el.type === 'image' && el.content && el.content.complete) {
            octx.save();
            var iw = el.content.width * (el.scale / 100);
            var ih = el.content.height * (el.scale / 100);
            octx.translate(el.x + iw / 2, el.y + ih / 2);
            octx.rotate((el.rotate || 0) * Math.PI / 180);
            octx.globalAlpha = (el.opacity !== undefined ? el.opacity : 100) / 100;
            octx.drawImage(el.content, -iw / 2, -ih / 2, iw, ih);
            octx.restore();
        } else if (el.type === 'text') {
            octx.save();
            var fs = el.fontSize || Math.max(el.scale * 0.6, 8);
            octx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
            var tw = octx.measureText(el.text || '').width;
            var th = fs;
            octx.translate(el.x + tw / 2, el.y + th / 2);
            octx.rotate((el.rotate || 0) * Math.PI / 180);
            octx.globalAlpha = (el.opacity !== undefined ? el.opacity : 100) / 100;
            octx.fillStyle = el.color || '#ffffff';
            octx.fillText(el.text || '', -tw / 2, th / 4);
            octx.restore();
        }
    });

    var mergedImg = new Image();
    mergedImg.crossOrigin = 'anonymous';
    mergedImg.onload = function () {
        els = els.filter(function (e) { return idsToMerge.indexOf(e.id) < 0; });
        els.push({
            id: 'm' + Date.now(), type: 'image', content: mergedImg,
            x: 0, y: 0, scale: 100, rotate: 0, opacity: 100
        });
        selId = els[els.length - 1].id;
        if (typeof sH === 'function') sH('Merge Layers (' + idsToMerge.length + ')');
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
        renderLayersPanel();
        if (typeof showStatusBadge === 'function') showStatusBadge('🔀 Merged ' + idsToMerge.length + ' layers!');
    };
    mergedImg.src = oc.toDataURL();
}
function selectLayer(id) {
    selId = id; R(); sUI();
    var el = findEl(id);
    if (el) showCornerHandles(el);
    renderLayersPanel();
}
function deleteLayerById(id) {
    var idx = els.findIndex(function (x) { return x.id === id; });
    if (idx !== -1) {
        els.splice(idx, 1);
        if (selId === id) selId = null;
        sH('Delete Layer'); R(); sUI(); renderLayersPanel();
    }
}

/* ============================================
   EXPORT MODAL (B20)
   ============================================ */

function openExport() {
    var o = document.getElementById('exportModal');
    if (o) o.style.display = 'flex';
}
function closeExport() {
    var o = document.getElementById('exportModal');
    if (o) o.style.display = 'none';
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
                exportAsPDF(filename);
                selId = savedSel; R();
                return;
            }
            link.click();
            selId = savedSel; R(); closeExport();
        } catch (e) {
            alert('Export failed (maybe CORS-tainted image): ' + e.message);
            selId = savedSel; R();
        }
    }, 100);
}
function exportAsPDF(filename) {
    try {
        var dataUrl = canvas.toDataURL('image/png', 1.0);
        var w = window.open('', '_blank');
        if (!w) { alert('Popup block ho gaya. PDF ke liye allow karo.'); return; }
        w.document.write(
            '<html><head><title>' + filename + '</title>' +
            '<style>*{margin:0}html,body{width:100%;height:100%}img{max-width:100%;max-height:100%}</style>' +
            '</head><body><img src="' + dataUrl + '" onload="window.print()"></body></html>'
        );
        w.document.close();
    } catch (e) {
        alert('PDF export failed: ' + e.message);
    }
}

/* ============================================
   AI TOOLS
   ============================================ */

function aiAutoEnhance() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') { alert('Please select an image first'); return; }
    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Enhancing...';
    setTimeout(function () {
        try {
            var enhanceSettings = { 'sg-br': 8, 'sg-ct': 20, 'sg-sa': 15, 'sg-te': 5, 'sg-vi': 0, 'sg-gr': 0 };
            for (var key in enhanceSettings) {
                var slider = document.getElementById(key);
                if (slider) slider.value = enhanceSettings[key];
                var mobSlider = document.getElementById(key.replace('sg-', 'mob-sg-'));
                if (mobSlider) mobSlider.value = enhanceSettings[key];
            }
            liveG(); applyGrade();
            setTimeout(function () { applySharpen(); loader.style.display = 'none'; }, 500);
        } catch (e) { loader.style.display = 'none'; }
    }, 300);
}

function aiObjectRemove() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') { alert('Please select an image first'); return; }
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

function processAICommand(msg) {
    var low = msg.toLowerCase();
    if (low.indexOf('style') >= 0 || low.indexOf('paint') >= 0 || low.indexOf('anime') >= 0 || low.indexOf('cartoon') >= 0) { aiStyleTransfer(msg); return true; }
    if (low.indexOf('sky') >= 0 || low.indexOf('sunset') >= 0 || low.indexOf('cloud') >= 0) { aiSkyReplace(msg); return true; }
    if (low.indexOf('beauty') >= 0 || low.indexOf('face') >= 0 || low.indexOf('portrait') >= 0 || low.indexOf('smooth') >= 0) { aiPortraitBeauty(); return true; }
    if (low.indexOf('face swap') >= 0 || low.indexOf('swap') >= 0) { aiFaceSwap(); return true; }
    if (low.indexOf('color') >= 0 && (low.indexOf('suggest') >= 0 || low.indexOf('palette') >= 0)) { aiColorSuggest(); return true; }
    if (low.indexOf('font') >= 0) { aiFontPairing(); return true; }
    if (low.indexOf('layout') >= 0 || low.indexOf('arrange') >= 0) { aiLayoutSuggest(); return true; }
    if (low.indexOf('resize') >= 0) {
        if (low.indexOf('instagram') >= 0) aiSmartResize('instagram');
        else if (low.indexOf('story') >= 0) aiSmartResize('story');
        else if (low.indexOf('youtube') >= 0) aiSmartResize('youtube');
        else if (low.indexOf('facebook') >= 0) aiSmartResize('facebook');
        else aiSmartResize('all');
        return true;
    }
    if (low.indexOf('enhance') >= 0) { aiAutoEnhance(); return true; }
    if (low.indexOf('add text') >= 0) { addText(); return true; }
    if (low.indexOf('gray') >= 0) { grayscale(); return true; }
    if (low.indexOf('blur') >= 0) { applyBlur(4); return true; }
    if (low.indexOf('invert') >= 0) { invertColors(); return true; }
    if (low.indexOf('export') >= 0) { openExport(); return true; }
    if (low.indexOf('undo') >= 0) { triggerUndo(); return true; }
    if (low.indexOf('remove bg') >= 0 || low.indexOf('background') >= 0) { bgRemove('smart'); return true; }
    return false;
}

function aiStyleTransfer(prompt) {
    var el = findEl(selId);
    if (!el || el.type !== 'image') { addChatMsg('Please select an image first', true); return; }
    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Style Transfer...';
    addChatMsg('Applying style transfer...', true);
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
        '?width=' + canvas.width + '&height=' + canvas.height +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);
    var newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = function () {
        el.content = newImg;
        loader.style.display = 'none';
        sH('Style Transfer'); R();
        addChatMsg('Style transfer applied!', true);
    };
    newImg.onerror = function () { loader.style.display = 'none'; addChatMsg('Style transfer failed. Try again!', true); };
    newImg.src = url;
}

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
        '?width=' + canvas.width + '&height=' + canvas.height +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);
    var newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = function () {
        aiBg = newImg; bgCf = null;
        loader.style.display = 'none';
        sH('Sky Replace'); R();
        addChatMsg('Sky replaced!', true);
    };
    newImg.onerror = function () { loader.style.display = 'none'; addChatMsg('Sky replace failed. Try again!', true); };
    newImg.src = url;
}

function aiPortraitBeauty() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') { addChatMsg('Please select a portrait image first', true); return; }
    loader.style.display = 'flex';
    document.getElementById('ldrMsg').innerText = 'AI Beauty...';
    addChatMsg('Applying beauty filter...', true);
    setTimeout(function () {
        var beautySettings = { 'sg-br': 10, 'sg-ct': 8, 'sg-sa': 5, 'sg-te': 3, 'sg-vi': 0, 'sg-gr': 0 };
        for (var key in beautySettings) {
            var slider = document.getElementById(key);
            if (slider) slider.value = beautySettings[key];
        }
        liveG(); applyGrade();
        setTimeout(function () { applyBlur(1); loader.style.display = 'none'; addChatMsg('Beauty filter applied!', true); }, 500);
    }, 300);
}

function aiFaceSwap() {
    addChatMsg('Face swap: 2 images select karo, phir ye command run karo. (Needs 2 uploaded images)', true);
}

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
    addChatMsg('Try "' + chosen.name + '" palette: ' + chosen.colors.join(', '), true);
    var el = findEl(selId);
    if (el && el.type === 'text') { el.color = chosen.colors[0]; R(); }
}

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

function aiLayoutSuggest() {
    if (els.length === 0) { addChatMsg('Pehle elements add karo, fir layout suggest karunga.', true); return; }
    var layouts = [
        { name: 'Centered', action: function () { els.forEach(function (el) { alignEl('c'); }); } },
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
                els.forEach(function (el, i) { el.x = canvas.width / 2; el.y = spacing * (i + 1); });
            }
        }
    ];
    var chosen = layouts[Math.floor(Math.random() * layouts.length)];
    chosen.action();
    sH('AI Layout: ' + chosen.name); R();
    addChatMsg('Applied "' + chosen.name + '" layout!', true);
}

function aiSmartResize(platform) {
    var sizes = {
        instagram: [1080, 1080, 'Instagram Post'],
        story: [1080, 1920, 'Instagram Story'],
        youtube: [1280, 720, 'YouTube Thumbnail'],
        facebook: [820, 312, 'Facebook Cover'],
        twitter: [1500, 500, 'Twitter Header'],
        linkedin: [1584, 396, 'LinkedIn Banner']
    };
    if (platform === 'all') { addChatMsg('Try: "resize for instagram/story/youtube/facebook"', true); return; }
    var size = sizes[platform];
    if (!size) { addChatMsg('Unknown platform. Try: instagram, story, youtube, facebook', true); return; }
    setupC(size[0], size[1]);
    addChatMsg('Resized to ' + size[2] + ' (' + size[0] + '×' + size[1] + ')', true);
}

/* ============================================
   SHAPES (B15)
   ============================================ */

function addShape(type) {
    var shapes = {
        rectangle: { w: 200, h: 150 }, circle: { w: 150, h: 150 },
        triangle: { w: 150, h: 150 }, star: { w: 150, h: 150 },
        arrow: { w: 200, h: 60 }, line: { w: 200, h: 4 },
        heart: { w: 150, h: 150 }, polygon: { w: 150, h: 150 }
    };
    var shape = shapes[type] || shapes.rectangle;
    var shapeCanvas = document.createElement('canvas');
    shapeCanvas.width = shape.w; shapeCanvas.height = shape.h;
    var sctx = shapeCanvas.getContext('2d');
    sctx.fillStyle = '#7F3DFF'; sctx.strokeStyle = '#7F3DFF'; sctx.lineWidth = 3;
    if (type === 'rectangle') {
        sctx.fillRect(0, 0, shape.w, shape.h);
    } else if (type === 'circle') {
        sctx.beginPath(); sctx.arc(shape.w / 2, shape.h / 2, shape.w / 2 - 3, 0, Math.PI * 2); sctx.fill();
    } else if (type === 'triangle') {
        sctx.beginPath(); sctx.moveTo(shape.w / 2, 0); sctx.lineTo(shape.w, shape.h); sctx.lineTo(0, shape.h); sctx.closePath(); sctx.fill();
    } else if (type === 'star') {
        var cx = shape.w / 2, cy = shape.h / 2, outR = shape.w / 2 - 3, inR = outR * 0.4;
        sctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var r = i % 2 === 0 ? outR : inR;
            var angle = (i * Math.PI) / 5 - Math.PI / 2;
            var x = cx + Math.cos(angle)  *r, y = cy + Math.sin(angle)*  r;
            if (i === 0) sctx.moveTo(x, y); else sctx.lineTo(x, y);
        }
        sctx.closePath(); sctx.fill();
    } else if (type === 'arrow') {
        sctx.beginPath();
        sctx.moveTo(0, shape.h / 2 - 10); sctx.lineTo(shape.w - 40, shape.h / 2 - 10);
        sctx.lineTo(shape.w - 40, 0); sctx.lineTo(shape.w, shape.h / 2);
        sctx.lineTo(shape.w - 40, shape.h); sctx.lineTo(shape.w - 40, shape.h / 2 + 10);
        sctx.lineTo(0, shape.h / 2 + 10);
        sctx.closePath(); sctx.fill();
    } else if (type === 'line') {
        sctx.fillRect(0, 0, shape.w, shape.h);
    } else if (type === 'heart') {
        var s = shape.w / 100;
        sctx.beginPath();
        sctx.moveTo(50  *s, 25*  s);
        sctx.bezierCurveTo(50  *s, 0, 0, 0, 0, 35*  s);
        sctx.bezierCurveTo(0, 60  *s, 30*  s, 80  *s, 50*  s, 100 * s);
        sctx.bezierCurveTo(70  *s, 80*  s, 100  *s, 60*  s, 100  *s, 35*  s);
        sctx.bezierCurveTo(100  *s, 0, 50*  s, 0, 50  *s, 25*  s);
        sctx.fill();
    } else if (type === 'polygon') {
        var sides = 6, cx2 = shape.w / 2, cy2 = shape.h / 2, r2 = shape.w / 2 - 3;
        sctx.beginPath();
        for (var j = 0; j < sides; j++) {
            var a = (j  *2*  Math.PI) / sides - Math.PI / 2;
            var x2 = cx2 + Math.cos(a)  *r2, y2 = cy2 + Math.sin(a)*  r2;
            if (j === 0) sctx.moveTo(x2, y2); else sctx.lineTo(x2, y2);
        }
        sctx.closePath(); sctx.fill();
    }
    var img = new Image();
    img.onload = function () {
        var mc = document.createElement('canvas');
        mc.width = img.width; mc.height = img.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);
        els.push({
            id: 's' + Date.now(), type: 'image', content: img,
            x: canvas.width / 2 - img.width / 2, y: canvas.height / 2 - img.height / 2,
            scale: 100, rotate: 0, opacity: 100, eraserMask: mc, isShape: true
        });
        selId = els[els.length - 1].id;
        sH('Add ' + type); R(); sUI(); updateCanvasInfo();
    };
    img.src = shapeCanvas.toDataURL();
}

/* ============================================
   TEXT EFFECTS (B17) + GOOGLE FONTS (B18)
   ============================================ */

function applyTextEffect(effect) {
    var el = findEl(selId);
    if (!el || el.type !== 'text') { alert('Select a text layer first'); return; }
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
        for (var key in settings) el[key] = settings[key];
        sH('Text Effect: ' + effect); R(); sUI();
    }
}

function openGoogleFonts() {
    var fonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Poppins', 'Raleway', 'Nunito', 'Playfair Display', 'Merriweather'];
    var picked = prompt('Type font name (available: ' + fonts.join(', ') + ')');
    if (!picked) return;
    var link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=' + picked.replace(/ /g, '+') + '&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    setTimeout(function () {
        var sel = document.getElementById('fontSel');
        if (sel) {
            var op = document.createElement('option');
            op.value = picked; op.textContent = picked;
            sel.appendChild(op); sel.value = picked;
        }
        setProp('font', picked);
    }, 500);
}

/* ============================================
   SINGLE CLEAN VERSION: DRAW MODE
   ============================================ */

function toggleDrawMode() {
    drawingMode = !drawingMode;
    if (drawingMode) {
        document.body.classList.add('drawing-mode');
        canvas.style.cursor = 'crosshair';
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
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = drawColor; ctx.lineWidth = drawSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}

function startDrawTouch(e) {
    if (!drawingMode) return;
    e.preventDefault(); isDrawing = true;
    var pt = touchToCanvas(e.touches[0]);
    ctx.beginPath(); ctx.moveTo(pt.x, pt.y);
    ctx.strokeStyle = drawColor; ctx.lineWidth = drawSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}

function drawOnCanvas(e) {
    if (!isDrawing || !drawingMode) return;
    var pt = gCC(e);
    ctx.lineTo(pt.x, pt.y); ctx.stroke();
}

function drawOnCanvasTouch(e) {
    if (!isDrawing || !drawingMode) return;
    e.preventDefault();
    var pt = touchToCanvas(e.touches[0]);
    ctx.lineTo(pt.x, pt.y); ctx.stroke();
}

function endDraw() {
    if (!isDrawing) return;
    isDrawing = false; ctx.closePath();
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function () { aiBg = img; bgCf = null; sH('Drawing'); R(); };
}

/* ============================================
   PRO STYLE CROP SYSTEM (Popup)
   ============================================ */

function toggleCropMode() {
    var el = findEl(selId);
    if (!el || el.type !== 'image') {
        alert('Crop karne ke liye pehle ek image select karo!');
        return;
    }
    cropEl = el;
    cropSrcImg = el.content;
    cropMode = true;
    cropRatio = '1';
    cropRotation = 0;
    cropFlipH = false;
    cropFlipV = false;
    cropZoom = 1;
    cropCircle = false;
    cropLocked = false;
    var overlay = document.getElementById('cropOverlay');
    if (!overlay) return;
    drawCropImage();
    overlay.classList.add('active');
    overlay.querySelectorAll('.crop-ratio-ic').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-r') === '1');
    });
    var lockBtn = document.getElementById('cropLockBtn');
    if (lockBtn) lockBtn.classList.remove('active');
    var area = document.getElementById('cropArea');
    if (area) area.classList.remove('circle-mode');
    var circleBtn = document.getElementById('cropCircleBtn');
    if (circleBtn) circleBtn.classList.remove('active');
    if (window.lucide) lucide.createIcons();
    setTimeout(initCropBox, 60);
}

function drawCropImage() {
    if (!cropSrcImg) return;
    var src = cropSrcImg;
    var w = cropRotation % 180 === 0 ? src.width : src.height;
    var h = cropRotation % 180 === 0 ? src.height : src.width;
    var cropImgEl = document.getElementById('cropImgEl');
    if (!cropImgEl) return;
    cropImgEl.width = w;
    cropImgEl.height = h;
    var x = cropImgEl.getContext('2d');
    x.save();
    x.clearRect(0, 0, w, h);
    x.translate(w / 2, h / 2);
    x.rotate(cropRotation * Math.PI / 180);
    x.scale(cropFlipH ? -1 : 1, cropFlipV ? -1 : 1);
    x.drawImage(src, -src.width / 2, -src.height / 2);
    x.restore();
}

function initCropBox() {
    var cropImgEl = document.getElementById('cropImgEl');
    if (!cropImgEl) return;
    var r = cropImgEl.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    cropDispW = r.width;
    cropDispH = r.height;
    var pad = Math.min(cropDispW, cropDispH) * 0.08;
    cropBox = { x: pad, y: pad, w: cropDispW - pad  *2, h: cropDispH - pad*  2 };
    applyCropRatioToBox();
    updateCropBox();
}

function updateCropBox() {
    cropBox.w = Math.max(30, Math.min(cropBox.w, cropDispW));
    cropBox.h = Math.max(30, Math.min(cropBox.h, cropDispH));
    cropBox.x = Math.max(0, Math.min(cropBox.x, cropDispW - cropBox.w));
    cropBox.y = Math.max(0, Math.min(cropBox.y, cropDispH - cropBox.h));
    var area = document.getElementById('cropArea');
    if (area) {
        area.style.left = cropBox.x + 'px';
        area.style.top = cropBox.y + 'px';
        area.style.width = cropBox.w + 'px';
        area.style.height = cropBox.h + 'px';
    }
}

function setCropRatio(r) {
    cropRatio = r;
    var pad = Math.min(cropDispW, cropDispH) * 0.08;
    cropBox = { x: pad, y: pad, w: cropDispW - pad  *2, h: cropDispH - pad*  2 };
    applyCropRatioToBox();
    updateCropBox();
}

function applyCropRatioToBox() {
    if (cropRatio === 'free') return;
    var target = parseFloat(cropRatio);
    var cur = cropBox.w / cropBox.h;
    if (cur > target) {
        var nw = cropBox.h * target;
        cropBox.x += (cropBox.w - nw) / 2;
        cropBox.w = nw;
    } else {
        var nh = cropBox.w / target;
        cropBox.y += (cropBox.h - nh) / 2;
        cropBox.h = nh;
    }
}

function rotateCropImage() {
    cropRotation = (cropRotation + 90) % 360;
    drawCropImage();
    setTimeout(initCropBox, 60);
}

function rotateCropLeft() {
    cropRotation = (cropRotation + 270) % 360;
    drawCropImage();
    setTimeout(initCropBox, 60);
}

function flipCropHorizontal() {
    cropFlipH = !cropFlipH;
    drawCropImage();
    setTimeout(initCropBox, 60);
}

function flipCropVertical() {
    cropFlipV = !cropFlipV;
    drawCropImage();
    setTimeout(initCropBox, 60);
}

function zoomCropImage() {
    cropZoom = cropZoom === 1 ? 1.5 : 1;
    var cropImgEl = document.getElementById('cropImgEl');
    if (cropImgEl) {
        cropImgEl.style.transform = 'scale(' + cropZoom + ')';
        cropImgEl.style.transformOrigin = 'center center';
    }
    setTimeout(initCropBox, 60);
}

function toggleFullscreenCrop() {
    var overlay = document.getElementById('cropOverlay');
    if (overlay) {
        if (!document.fullscreenElement) {
            overlay.requestFullscreen && overlay.requestFullscreen();
        } else {
            document.exitFullscreen && document.exitFullscreen();
        }
    }
}

function toggleLockRatio() {
    cropLocked = !cropLocked;
    var lockBtn = document.getElementById('cropLockBtn');
    if (lockBtn) {
        lockBtn.classList.toggle('active', cropLocked);
        var icon = lockBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', cropLocked ? 'lock' : 'unlock');
            if (window.lucide) lucide.createIcons();
        }
    }
    if (cropLocked && cropRatio === 'free') {
        cropRatio = String(cropBox.w / cropBox.h);
    }
}

function toggleCircularCrop() {
    cropCircle = !cropCircle;
    var area = document.getElementById('cropArea');
    var circleBtn = document.getElementById('cropCircleBtn');
    if (area) area.classList.toggle('circle-mode', cropCircle);
    if (circleBtn) circleBtn.classList.toggle('active', cropCircle);
}

/* Drag helpers */
function getCropPos(e) {
    return e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
}
function startCropDrag(e, type) {
    e.preventDefault(); e.stopPropagation();
    cropDrag = type;
    var p = getCropPos(e);
    cropSX = p.x; cropSY = p.y;
    cropSBX = cropBox.x; cropSBY = cropBox.y;
    cropSBW = cropBox.w; cropSBH = cropBox.h;
}
function onCropMove(e) {
    if (!cropDrag) return;
    e.preventDefault();
    var p = getCropPos(e);
    var dx = p.x - cropSX, dy = p.y - cropSY;
    if (cropDrag === 'move') {
        cropBox.x = cropSBX + dx;
        cropBox.y = cropSBY + dy;
    } else {
        resizeCropBox(cropDrag, dx, dy);
    }
    updateCropBox();
}
function resizeCropBox(h, dx, dy) {
    var effectiveRatio = cropLocked ? cropRatio : cropRatio;
    if (cropLocked && cropRatio === 'free') effectiveRatio = String(cropSBW / cropSBH);
    var b = { x: cropSBX, y: cropSBY, w: cropSBW, h: cropSBH };
    if (h.indexOf('w') >= 0) {
        var nx = Math.max(0, cropSBX + dx);
        b.x = nx; b.w = cropSBW - (nx - cropSBX);
        if (b.w < 30) { b.w = 30; b.x = cropSBX + cropSBW - 30; }
    }
    if (h.indexOf('e') >= 0) { b.w = Math.max(30, Math.min(cropDispW - b.x, cropSBW + dx)); }
    if (h.indexOf('n') >= 0) {
        var ny = Math.max(0, cropSBY + dy);
        b.y = ny; b.h = cropSBH - (ny - cropSBY);
        if (b.h < 30) { b.h = 30; b.y = cropSBY + cropSBH - 30; }
    }
    if (h.indexOf('s') >= 0) { b.h = Math.max(30, Math.min(cropDispH - b.y, cropSBH + dy)); }
    if (effectiveRatio !== 'free') {
        var tgt = parseFloat(effectiveRatio);
        var cr = b.w / b.h;
        if (Math.abs(cr - tgt) > 0.005) {
            if (h.length === 2) {
                if (cr > tgt) { var nh = b.w / tgt; if (h.indexOf('n') >= 0) b.y = cropSBY + (cropSBH - nh); b.h = nh; }
                else { var nw = b.h * tgt; if (h.indexOf('w') >= 0) b.x = cropSBX + (cropSBW - nw); b.w = nw; }
            } else if (h === 'e' || h === 'w') { var nh2 = b.w / tgt; if (h === 'w') b.y = cropSBY + (cropSBH - nh2); b.h = nh2; }
            else { var nw2 = b.h * tgt; if (h === 'n') b.x = cropSBX + (cropSBW - nw2); b.w = nw2; }
        }
    }
    cropBox.x = b.x; cropBox.y = b.y; cropBox.w = b.w; cropBox.h = b.h;
}
function endCropDrag() { cropDrag = null; }
function initCropListeners() {
    var area = document.getElementById('cropArea');
    var overlay = document.getElementById('cropOverlay');
    if (!area || !overlay) return;
    area.addEventListener('mousedown', function (e) { if (!e.target.classList.contains('crop-handle')) startCropDrag(e, 'move'); });
    area.addEventListener('touchstart', function (e) { if (!e.target.classList.contains('crop-handle')) startCropDrag(e, 'move'); }, { passive: false });
    overlay.querySelectorAll('.crop-handle').forEach(function (h) {
        h.addEventListener('mousedown', function (e) { startCropDrag(e, h.getAttribute('data-h')); });
        h.addEventListener('touchstart', function (e) { startCropDrag(e, h.getAttribute('data-h')); }, { passive: false });
    });
    overlay.querySelectorAll('.crop-ratio-ic').forEach(function (btn) {
        btn.addEventListener('click', function () {
            overlay.querySelectorAll('.crop-ratio-ic').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            setCropRatio(btn.getAttribute('data-r'));
        });
    });
    document.addEventListener('mousemove', onCropMove);
    document.addEventListener('touchmove', onCropMove, { passive: false });
    document.addEventListener('mouseup', endCropDrag);
    document.addEventListener('touchend', endCropDrag);
}

function applyCropResult() {
    var cropImgEl = document.getElementById('cropImgEl');
    var localEl = cropEl;
    if (!cropImgEl || !localEl) { closeCropOverlay(); return; }
    var sx = (cropBox.x / cropDispW) * cropImgEl.width;
    var sy = (cropBox.y / cropDispH) * cropImgEl.height;
    var sw = (cropBox.w / cropDispW) * cropImgEl.width;
    var sh = (cropBox.h / cropDispH) * cropImgEl.height;
    if (sw < 5 || sh < 5) { closeCropOverlay(); return; }
    var nc = document.createElement('canvas');
    nc.width = sw; nc.height = sh;
    var nctx = nc.getContext('2d');
    if (cropCircle) {
        var radius = Math.min(sw, sh) / 2;
        nctx.save();
        nctx.beginPath();
        nctx.arc(sw / 2, sh / 2, radius, 0, Math.PI * 2);
        nctx.clip();
    }
    nctx.drawImage(cropImgEl, sx, sy, sw, sh, 0, 0, sw, sh);
    if (cropCircle) nctx.restore();
    var newImg = new Image();
    newImg.onload = function () {
        localEl.content = newImg;
        var mc = document.createElement('canvas');
        mc.width = newImg.width; mc.height = newImg.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);
        localEl.eraserMask = mc;
        sH('Crop Image'); R(); sUI(); showCornerHandles(localEl);
    };
    newImg.src = nc.toDataURL();
    closeCropOverlay();
}

function closeCropOverlay() {
    var overlay = document.getElementById('cropOverlay');
    if (overlay) overlay.classList.remove('active');
    cropMode = false;
    cropDrag = null;
    cropEl = null;
    cropZoom = 1;
}

/* ============================================
   SINGLE CLEAN VERSION: STICKERS
   ============================================ */

function openStickers(tabName) {
    var overlay = document.getElementById('stickersAssetsModal');
    if (overlay) overlay.remove();

    window.arjonaCustomAssets = window.arjonaCustomAssets || [];
    window.arjonaCustomTemplates = window.arjonaCustomTemplates || [];
    try {
        var sa = localStorage.getItem('arjona_custom_assets');
        if (sa) window.arjonaCustomAssets = JSON.parse(sa);
        var st = localStorage.getItem('arjona_custom_templates');
        if (st) window.arjonaCustomTemplates = JSON.parse(st);
    } catch(e) {}

    var activeTab = typeof tabName === 'string' ? tabName : 'default';
    var stickers = [
        '⭐', '❤️', '🔥', '✨', '💯', '🎉', '👍', '💎', '🌟', '⚡', '🎨', '🚀',
        '💪', '🎵', '🌈', '🏆', '😎', '🤩', '😍', '🥳', '🎭', '🎪', '🎯', '💡',
        '📸', '🎬', '🌺', '🦋', '🍀', '⭕', '❌', '✅'
    ];

    var defaultHtml = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px;padding:4px;">';
    stickers.forEach(function (s) {
        defaultHtml += '<button style="font-size:26px;padding:8px;background:var(--sf2);border:1px solid var(--bd);' +
            'border-radius:8px;cursor:pointer;transition:transform 0.2s" ' +
            'onmouseover="this.style.transform=\'scale(1.2)\'" ' +
            'onmouseout="this.style.transform=\'scale(1)\'" ' +
            'onclick="addStickerToCanvas(\''+s+'\')">' + s + '</button>';
    });
    defaultHtml += '</div>';

    var assetsGrid = '';
    if (window.arjonaCustomAssets.length === 0) {
        assetsGrid = '<div style="text-align:center; padding:24px; color:var(--tx3); font-size:12px;">No custom assets saved yet. Click "Save Selected Item" or upload an image!</div>';
    } else {
        assetsGrid = '<div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px;">';
        window.arjonaCustomAssets.forEach(function(ast, idx) {
            assetsGrid += '<div class="option-card" style="display:flex; flex-direction:column; gap:4px; padding:6px; background:var(--bg); border:1px solid var(--bd2); border-radius:8px;">' +
                '<div style="width:100%; height:60px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:var(--bd); border-radius:4px;">' +
                '<img src="' + ast.src + '" style="max-width:100%; max-height:100%; object-fit:contain;"></div>' +
                '<span style="font-size:10px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">' + ast.name + '</span>' +
                '<div style="display:flex; gap:4px; width:100%;">' +
                '<button class="editor-back-btn" style="flex:1; width:auto; height:26px; padding:0; background:var(--ac); color:#fff; font-size:10px; font-weight:700; border:none;" onclick="applyCustomAssetToCanvas(' + idx + ')">➕ Add</button>' +
                '<button class="editor-back-btn" style="width:26px; height:26px; padding:0; background:transparent; color:var(--dn); font-size:12px;" onclick="deleteCustomAsset(' + idx + ')" title="Delete asset">🗑️</button>' +
                '</div></div>';
        });
        assetsGrid += '</div>';
    }

    var assetsHtml = '<div style="display:flex; flex-direction:column; gap:8px;">' +
        '<div style="display:flex; gap:6px; background:var(--bd); padding:8px; border-radius:8px; border:1px solid var(--bd2);">' +
        '<button class="editor-back-btn" style="flex:1; width:auto; height:32px; background:var(--ac); color:#fff; font-weight:700; border:none; font-size:11px;" onclick="saveSelectedItemAsCustomAsset()">➕ Save Selected Item as Asset</button>' +
        '<button class="editor-back-btn" style="flex:1; width:auto; height:32px; background:var(--bd2); color:var(--tx1); font-size:11px;" onclick="triggerCustomAssetUpload()">📁 Upload Custom Sticker/Image</button>' +
        '</div>' +
        '<div style="font-size:11px; font-weight:700; color:var(--tx1); margin-top:2px;">Your Saved Custom Assets (' + window.arjonaCustomAssets.length + '):</div>' +
        assetsGrid + '</div>';

    var templatesGrid = '';
    if (window.arjonaCustomTemplates.length === 0) {
        templatesGrid = '<div style="text-align:center; padding:24px; color:var(--tx3); font-size:12px;">No custom design templates saved yet. Design something &amp; save!</div>';
    } else {
        templatesGrid = '<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:8px;">';
        window.arjonaCustomTemplates.forEach(function(tpl, idx) {
            templatesGrid += '<div class="option-card" style="display:flex; flex-direction:column; gap:4px; padding:8px; background:var(--bg); border:1px solid var(--bd2); border-radius:8px;">' +
                '<div style="width:100%; height:80px; display:flex; align-items:center; justify-content:center; overflow:hidden; background:var(--bd); border-radius:4px;">' +
                '<img src="' + tpl.thumb + '" style="width:100%; height:100%; object-fit:cover;"></div>' +
                '<span style="font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">' + tpl.name + '</span>' +
                '<div style="display:flex; gap:4px; width:100%;">' +
                '<button class="editor-back-btn" style="flex:1; width:auto; height:28px; padding:0; background:var(--ac); color:#fff; font-size:11px; font-weight:700; border:none;" onclick="loadCustomTemplate(' + idx + ')">🚀 Load Template</button>' +
                '<button class="editor-back-btn" style="width:28px; height:28px; padding:0; background:transparent; color:var(--dn); font-size:12px;" onclick="deleteCustomTemplate(' + idx + ')" title="Delete template">🗑️</button>' +
                '</div></div>';
        });
        templatesGrid += '</div>';
    }

    var templatesHtml = '<div style="display:flex; flex-direction:column; gap:8px;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; background:var(--bd); padding:8px 10px; border-radius:8px; border:1px solid var(--bd2);">' +
        '<div><div style="font-size:11px; font-weight:700; color:var(--tx1);">Save Current Canvas as Template</div>' +
        '<div style="font-size:9px; color:var(--tx2);">Stores exact layer setup &amp; styles in your library</div></div>' +
        '<button class="editor-back-btn" style="width:auto; height:32px; padding:0 12px; background:linear-gradient(135deg, #58A6FF, #A371F7); color:#fff; font-weight:700; border:none; font-size:11px;" onclick="saveCurrentCanvasAsTemplate()">💾 Save Template</button>' +
        '</div>' +
        '<div style="font-size:11px; font-weight:700; color:var(--tx1); margin-top:2px;">Your Saved Design Templates (' + window.arjonaCustomTemplates.length + '):</div>' +
        templatesGrid + '</div>';

    var bodyContent = activeTab === 'default' ? defaultHtml : (activeTab === 'assets' ? assetsHtml : templatesHtml);

    var overlay = document.createElement('div');
    overlay.id = 'stickersAssetsModal';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'display:flex; z-index:999999;';
    overlay.innerHTML = '<div class="modal-box" style="max-width:540px; width:95%; max-height:85vh; display:flex; flex-direction:column; overflow:hidden; border-radius:12px; border:1px solid var(--bd2); background:var(--bg);">' +
        '<div class="modal-head" style="background:#10141C; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bd); flex-shrink:0;">' +
        '<h2 style="font-size:14px; font-weight:800; color:var(--tx1); display:flex; align-items:center; gap:6px;">🎨 Creative Stickers &amp; Custom Assets Library</h2>' +
        '<button class="modal-x" onclick="document.getElementById(\'stickersAssetsModal\').remove()" style="background:transparent; border:none; color:var(--tx2); font-size:16px; cursor:pointer;">✕</button></div>' +
        '<div style="display:flex; background:var(--bd); border-bottom:1px solid var(--bd2); flex-shrink:0;">' +
        '<button class="editor-back-btn" style="flex:1; height:38px; border-radius:0; border:none; border-bottom:' + (activeTab === 'default' ? '3px solid var(--ac)' : 'none') + '; background:' + (activeTab === 'default' ? 'var(--sf)' : 'transparent') + '; font-weight:' + (activeTab === 'default' ? '800' : '500') + '; color:' + (activeTab === 'default' ? 'var(--ac)' : 'var(--tx2)') + ';" onclick="openStickers(\'default\')">⭐ Default Stickers</button>' +
        '<button class="editor-back-btn" style="flex:1; height:38px; border-radius:0; border:none; border-bottom:' + (activeTab === 'assets' ? '3px solid var(--ac)' : 'none') + '; background:' + (activeTab === 'assets' ? 'var(--sf)' : 'transparent') + '; font-weight:' + (activeTab === 'assets' ? '800' : '500') + '; color:' + (activeTab === 'assets' ? 'var(--ac)' : 'var(--tx2)') + ';" onclick="openStickers(\'assets\')">🎒 My Assets (' + window.arjonaCustomAssets.length + ')</button>' +
        '<button class="editor-back-btn" style="flex:1; height:38px; border-radius:0; border:none; border-bottom:' + (activeTab === 'templates' ? '3px solid var(--ac)' : 'none') + '; background:' + (activeTab === 'templates' ? 'var(--sf)' : 'transparent') + '; font-weight:' + (activeTab === 'templates' ? '800' : '500') + '; color:' + (activeTab === 'templates' ? 'var(--ac)' : 'var(--tx2)') + ';" onclick="openStickers(\'templates\')">📐 Design Templates (' + window.arjonaCustomTemplates.length + ')</button>' +
        '</div>' +
        '<div class="modal-body" style="padding:14px; overflow-y:auto; flex:1;">' + bodyContent + '</div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    if (window.lucide) lucide.createIcons();
}

function addStickerToCanvas(sticker) {
    els.push({
        id: 'st' + Date.now(), type: 'text', text: sticker,
        x: canvas.width / 2, y: canvas.height / 2,
        scale: 100, rotate: 0, opacity: 100,
        font: 'Arial', color: '#ffffff', fontSize: 80,
        charSpacing: 0, curve: 0, stroke: 0, glow: 0, emboss: 0,
        threeDDepth: 0, innerShadow: 0, reflection: 0
    });
    selId = els[els.length - 1].id;
    sH('Sticker'); R(); sUI();
    var modal = document.querySelector('.modal-overlay:last-child');
    if (modal) modal.remove();
}

/* ============================================
   SINGLE CLEAN VERSION: FRAMES
   ============================================ */

function openFrames() {
    var frames = [
        { name: 'Polaroid', color: '#ffffff', width: 30 },
        { name: 'Vintage', color: '#8B4513', width: 15 },
        { name: 'Modern', color: '#7F3DFF', width: 5 },
        { name: 'Gold', color: '#FFD700', width: 10 },
        { name: 'Silver', color: '#C0C0C0', width: 8 },
        { name: 'Black', color: '#000000', width: 12 }
    ];
    var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px">';
    frames.forEach(function (f, idx) {
        html += '<button style="padding:20px 8px;background:var(--sf2);border:3px solid ' + f.color + ';' +
            'border-radius:10px;cursor:pointer;color:var(--tx);font-size:12px;font-weight:600;transition:transform 0.2s" ' +
            'onmouseover="this.style.transform=\'scale(1.05)\'" ' +
            'onmouseout="this.style.transform=\'scale(1)\'" ' +
            'onclick="applyFrame(' + idx + ')">' + f.name + '</button>';
    });
    html += '</div>';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'framesModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head"><h2>Frames</h2>' +
        '<button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>' +
        '<div class="modal-body">' + html + '</div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function applyFrame(idx) {
    var frames = [
        { color: '#ffffff', width: 30 }, { color: '#8B4513', width: 15 },
        { color: '#7F3DFF', width: 5 }, { color: '#FFD700', width: 10 },
        { color: '#C0C0C0', width: 8 }, { color: '#000000', width: 12 }
    ];
    var f = frames[idx];
    R();
    ctx.save();
    ctx.strokeStyle = f.color; ctx.lineWidth = f.width;
    ctx.strokeRect(f.width / 2, f.width / 2, canvas.width - f.width, canvas.height - f.width);
    ctx.restore();
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function () { aiBg = img; bgCf = null; sH('Frame'); R(); };
    var modal = document.getElementById('framesModal');
    if (modal) modal.remove();
}

/* ============================================
   SINGLE CLEAN VERSION: GRADIENT
   ============================================ */

function openGradient() {
    var presets = [
        { name: 'Sunset', c1: '#FF6B6B', c2: '#FFD93D' },
        { name: 'Ocean', c1: '#00C6FF', c2: '#0072FF' },
        { name: 'Purple', c1: '#7F3DFF', c2: '#00C6FF' },
        { name: 'Forest', c1: '#134E5E', c2: '#71B280' },
        { name: 'Fire', c1: '#FF416C', c2: '#FF4B2B' },
        { name: 'Night', c1: '#0F2027', c2: '#2C5364' },
        { name: 'Pink', c1: '#f953c6', c2: '#b91d73' },
        { name: 'Gold', c1: '#f7971e', c2: '#ffd200' },
        { name: 'Mint', c1: '#43e97b', c2: '#38f9d7' }
    ];
    var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px">';
    presets.forEach(function (g) {
        html += '<button style="padding:24px 8px;background:linear-gradient(135deg,' + g.c1 + ',' + g.c2 + ');' +
            'border:none;border-radius:10px;cursor:pointer;color:#fff;font-size:11px;font-weight:700;transition:transform 0.2s" ' +
            'onmouseover="this.style.transform=\'scale(1.05)\'" ' +
            'onmouseout="this.style.transform=\'scale(1)\'" ' +
            'onclick="applyGradientPreset(\'' + g.c1 + '\',\'' + g.c2 + '\')">' + g.name + '</button>';
    });
    html += '</div>';
    html += '<div style="padding:10px;display:flex;gap:8px;align-items:center;border-top:1px solid var(--bd);margin-top:8px">' +
        '<label style="font-size:11px;color:var(--tx2)">Custom:</label>' +
        '<input type="color" id="gradC1" value="#00C6FF" style="width:36px;height:30px;border-radius:6px;border:1px solid var(--bd)">' +
        '<input type="color" id="gradC2" value="#7F3DFF" style="width:36px;height:30px;border-radius:6px;border:1px solid var(--bd)">' +
        '<button style="padding:8px 16px;background:linear-gradient(135deg,#00C6FF,#7F3DFF);color:#fff;border:none;' +
        'border-radius:8px;cursor:pointer;font-weight:700;font-size:11px" onclick="applyCustomGradient()">Apply</button></div>';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'gradientModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head"><h2>Gradient</h2>' +
        '<button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>' +
        '<div class="modal-body">' + html + '</div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function applyGradientPreset(c1, c2) {
    bgCf = { type: 'grad', c1: c1, c2: c2, dir: 'diag' };
    aiBg = null; sH('Gradient'); R();
    var modal = document.getElementById('gradientModal');
    if (modal) modal.remove();
}
function applyCustomGradient() {
    var c1 = document.getElementById('gradC1').value;
    var c2 = document.getElementById('gradC2').value;
    applyGradientPreset(c1, c2);
}

/* ============================================
   SINGLE CLEAN VERSION: COLLAGE
   ============================================ */

function openCollage() {
    var layouts = [
        { name: '2 Split', cols: 2, rows: 1 }, { name: '3 Column', cols: 3, rows: 1 },
        { name: '4 Grid', cols: 2, rows: 2 }, { name: '6 Grid', cols: 3, rows: 2 },
        { name: '9 Grid', cols: 3, rows: 3 }, { name: '2 Stack', cols: 1, rows: 2 }
    ];
    var html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:8px">';
    layouts.forEach(function (l) {
        var preview = '<div style="display:grid;grid-template-columns:repeat(' + l.cols + ',1fr);' +
            'grid-template-rows:repeat(' + l.rows + ',1fr);gap:2px;width:50px;height:40px;margin:0 auto 6px">';
        for (var i = 0; i < l.cols * l.rows; i++) {
            preview += '<div style="background:var(--ac);opacity:0.3;border-radius:2px"></div>';
        }
        preview += '</div>';
        html += '<button style="padding:12px 8px;background:var(--sf2);border:1px solid var(--bd);' +
            'border-radius:10px;cursor:pointer;color:var(--tx);font-size:11px;font-weight:600" ' +
            'onclick="applyCollage(' + l.cols + ',' + l.rows + ')">' + preview + l.name + '</button>';
    });
    html += '</div>';
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'collageModal';
    overlay.style.display = 'flex';
    overlay.innerHTML = '<div class="modal-box"><div class="modal-head"><h2>Collage</h2>' +
        '<button class="modal-x" onclick="this.closest(\'.modal-overlay\').remove()">✕</button></div>' +
        '<div class="modal-body">' + html + '</div></div>';
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

function applyCollage(cols, rows) {
    R();
    ctx.save();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    var cellW = canvas.width / cols;
    var cellH = canvas.height / rows;
    for (var c = 1; c < cols; c++) {
        ctx.beginPath(); ctx.moveTo(c  *cellW, 0); ctx.lineTo(c*  cellW, canvas.height); ctx.stroke();
    }
    for (var r = 1; r < rows; r++) {
        ctx.beginPath(); ctx.moveTo(0, r  *cellH); ctx.lineTo(canvas.width, r*  cellH); ctx.stroke();
    }
    ctx.restore();
    var img = new Image();
    img.src = canvas.toDataURL();
    img.onload = function () { aiBg = img; bgCf = null; sH('Collage'); R(); };
    var modal = document.getElementById('collageModal');
    if (modal) modal.remove();
}

/* ============================================
   SINGLE CLEAN VERSION: EYEDROPPER
   ============================================ */

function toggleEyedropper() {
    eyedropperMode = !eyedropperMode;
    var loupe = document.getElementById('eyedropperLoupe');
    if (eyedropperMode) {
        document.body.classList.add('eyedropper-active');
        var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#58A6FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6"/><path d="m4 20 6-6"/><path d="M19.1 8.9 15.1 4.9a2 2 0 0 0-2.8 0L9.5 7.7a2 2 0 0 0 0 2.8l4 4a2 2 0 0 0 2.8 0l2.8-2.8a2 2 0 0 0 0-2.8Z"/><path d="m4 20 2-2"/></svg>';
        var cursorUrl = 'data:image/svg+xml;base64,' + btoa(svgStr);
        canvas.style.cursor = 'url("' + cursorUrl + '") 0 26, crosshair';
        canvas.style.setProperty('cursor', 'url("' + cursorUrl + '") 0 26, crosshair', 'important');
        if (typeof showStatusBadge === 'function') showStatusBadge("👁️ Eyedropper Active: Click any pixel to pick color");
    } else {
        document.body.classList.remove('eyedropper-active');
        canvas.style.cursor = mode !== 'select' ? 'crosshair' : 'default';
        if (loupe) loupe.style.display = 'none';
        if (typeof showStatusBadge === 'function') showStatusBadge("👁️ Eyedropper Off");
    }
}

/* ============================================
   SINGLE CLEAN VERSION: GRID OVERLAY
   ============================================ */

function toggleGrid() {
    gridVisible = !gridVisible;
    var overlay = document.getElementById('gridOverlay');
    if (!overlay) return;
    if (gridVisible) {
        overlay.style.display = 'block';
        overlay.width = canvas.width; overlay.height = canvas.height;
        var gctx = overlay.getContext('2d');
        gctx.clearRect(0, 0, overlay.width, overlay.height);
        gctx.strokeStyle = 'rgba(127,61,255,0.25)'; gctx.lineWidth = 1;
        var step = 50;
        for (var x = 0; x <= canvas.width; x += step) {
            gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, canvas.height); gctx.stroke();
        }
        for (var y = 0; y <= canvas.height; y += step) {
            gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(canvas.width, y); gctx.stroke();
        }
        gctx.strokeStyle = 'rgba(127,61,255,0.5)';
        gctx.beginPath(); gctx.moveTo(canvas.width / 2, 0); gctx.lineTo(canvas.width / 2, canvas.height); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, canvas.height / 2); gctx.lineTo(canvas.width, canvas.height / 2); gctx.stroke();
    } else {
        overlay.style.display = 'none';
    }
}

/* ============================================
   SINGLE CLEAN VERSION: WATERMARK + QR
   ============================================ */

function openWatermark() {
    var text = prompt('Watermark text:', '© Arjona AI');
    if (!text) return;
    els.push({
        id: 'w' + Date.now(), type: 'text', text: text,
        x: canvas.width - 100, y: canvas.height - 30,
        scale: 40, rotate: 0, opacity: 50,
        font: 'Arial', color: '#ffffff', fontSize: 20,
        charSpacing: 0, curve: 0, stroke: 1, strokeColor: '#000000',
        emboss: 0, threeDDepth: 0, innerShadow: 0, reflection: 0, glow: 0
    });
    selId = els[els.length - 1].id;
    sH('Watermark'); R(); sUI();
}

function openQRGen() {
    var text = prompt('Enter URL or text:');
    if (!text) return;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        var mc = document.createElement('canvas');
        mc.width = img.width; mc.height = img.height;
        mc.getContext('2d').fillStyle = '#fff';
        mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);
        els.push({
            id: 'qr' + Date.now(), type: 'image', content: img,
            x: canvas.width / 2 - 100, y: canvas.height / 2 - 100,
            scale: 70, rotate: 0, opacity: 100, eraserMask: mc
        });
        selId = els[els.length - 1].id;
        sH('QR Code'); R(); sUI();
    };
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(text);
}

/* ============================================
   CANVAS HELPERS + INFO
   ============================================ */

function quickAsk(text) {
    var inp = document.getElementById('aiChatInput');
    if (inp) inp.value = text;
    sendAiChat();
}

function updateCanvasInfo() {
    var txt = canvas.width + ' × ' + canvas.height;
    var info1 = document.getElementById('cvInfo');
    var info2 = document.getElementById('cvInfo2');
    if (info1) info1.textContent = txt;
    if (info2) info2.textContent = txt;
}

function touchToCanvas(t) {
    var r = canvas.getBoundingClientRect();
    return {
        x: (t.clientX - r.left) * (canvas.width / r.width),
        y: (t.clientY - r.top) * (canvas.height / r.height)
    };
}

/* ===== DROP ZONE ===== */

function initDropZone() {
    var area = document.getElementById('canvasArea');
    var hint = document.getElementById('dropHint');
    if (!area) return;
    var dragCounter = 0;
    area.addEventListener('dragenter', function (e) { e.preventDefault(); dragCounter++; if (hint) hint.style.opacity = '1'; });
    area.addEventListener('dragleave', function (e) {
        e.preventDefault(); dragCounter--;
        if (dragCounter <= 0) { dragCounter = 0; if (hint) hint.style.opacity = '0'; }
    });
    area.addEventListener('dragover', function (e) { e.preventDefault(); });
    area.addEventListener('drop', function (e) {
        e.preventDefault(); dragCounter = 0;
        if (hint) hint.style.opacity = '0';
        var files = e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
            if (files[i].type.indexOf('image/') === 0) loadI(files[i]);
        }
    });
}

/* ===== NEBULA ===== */

function createNebula(c) {
    if (!c) return null;
    var nb = { c: c, x: c.getContext('2d'), W: 0, H: 0, time: 0, stars: [], running: false, animId: null };
    function resize() {
        nb.W = nb.c.offsetWidth || 300; nb.H = nb.c.offsetHeight || 420;
        nb.c.width = nb.W; nb.c.height = nb.H;
    }
    function init() {
        resize(); nb.stars = [];
        var cols = ['rgba(0,198,255,', 'rgba(127,61,255,', 'rgba(255,255,255,'];
        for (var i = 0; i < 100; i++) {
            nb.stars.push({
                x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.2,
                sp: Math.random()  *0.02 + 0.004, tw: Math.random()*  Math.PI * 2,
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
        base.addColorStop(0, '#010612'); base.addColorStop(0.5, '#040c20'); base.addColorStop(1, '#020810');
        cx.fillStyle = base; cx.fillRect(0, 0, W, H);
        for (var i = 0; i < nb.stars.length; i++) {
            var s2 = nb.stars[i];
            s2.tw += s2.sp;
            var al3 = 0.2 + Math.sin(s2.tw) * 0.5;
            if (al3 < 0) al3 = 0; if (al3 > 1) al3 = 1;
            cx.fillStyle = s2.col + al3 + ')';
            cx.beginPath(); cx.arc(s2.x  *W, s2.y*  H, s2.r, 0, Math.PI * 2); cx.fill();
        }
        nb.animId = requestAnimationFrame(render);
    }
    nb.init = init;
    nb.render = function () { nb.running = true; render(); };
    nb.stop = function () { nb.running = false; if (nb.animId) cancelAnimationFrame(nb.animId); };
    nb.resize = resize;
    return nb;
}

/* ============================================
   AI CHAT
   ============================================ */

var aiChatOpen = false, ttsOn = false, lastActionTime = Date.now();
var aiChatMem = [];
var aiDragState = { dragging: false, startX: 0, startY: 0, startLeft: 0, startTop: 0 };
try { aiChatMem = JSON.parse(localStorage.getItem('ai_chat_mem') || '[]'); } catch (e) { aiChatMem = []; }

function initAiChatDrag() {
    var handle = document.getElementById('aiChatDragHandle');
    var box = document.getElementById('aiChatBox');
    if (!handle || !box) return;
    function startDrag(e) {
        if (e.target.tagName === 'BUTTON') return;
        var touch = e.touches ? e.touches[0] : e;
        aiDragState.dragging = true;
        aiDragState.startX = touch.clientX; aiDragState.startY = touch.clientY;
        var rect = box.getBoundingClientRect();
        aiDragState.startLeft = rect.left; aiDragState.startTop = rect.top;
        box.style.transition = 'none';
        box.style.bottom = 'auto'; box.style.right = 'auto';
        box.style.left = rect.left + 'px'; box.style.top = rect.top + 'px';
    }
    function moveDrag(e) {
        if (!aiDragState.dragging) return;
        if (e.preventDefault) e.preventDefault();
        var touch = e.touches ? e.touches[0] : e;
        var dx = touch.clientX - aiDragState.startX;
        var dy = touch.clientY - aiDragState.startY;
        var newLeft = Math.max(6, Math.min(window.innerWidth - box.offsetWidth - 6, aiDragState.startLeft + dx));
        var newTop = Math.max(6, Math.min(window.innerHeight - box.offsetHeight - 6, aiDragState.startTop + dy));
        box.style.left = newLeft + 'px'; box.style.top = newTop + 'px';
    }
    function endDrag() { if (!aiDragState.dragging) return; aiDragState.dragging = false; box.style.transition = ''; }
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
        if (rect.top < 0 || rect.left < 0 || rect.bottom > window.innerHeight || rect.right > window.innerWidth) {
            box.style.left = ''; box.style.top = '';
            box.style.bottom = '70px'; box.style.right = '14px';
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

/* ===== GROQ SMART AI ===== */

function askAI(context, showInChat) {
    if (showInChat !== false) addAiMem('sys', context);
    if (!GROQ_KEY) { askAIFallback(context, showInChat); return; }
    var canvasInfo = getCanvasContext();
    var selectedInfo = '';
    var el = findEl(selId);
    if (el) {
        if (el.type === 'text') {
            selectedInfo = 'Selected text: "' + el.text + '" color:' + el.color + ' size:' + (el.fontSize || 60);
        } else {
            selectedInfo = 'Selected image, scale:' + el.scale;
        }
    }
    var messages = [{
        role: 'system',
        content: 'You are Arjona AI, a smart creative design assistant built into Arjona AI Studio app. ' +
            'You speak casual Hinglish (mix Hindi + English naturally). ' +
            'You are friendly, funny, supportive like a best friend. ' +
            'You help users design thumbnails, posters, social media graphics. ' +
            'Keep replies short (max 40 words). ' +
            'Current canvas: ' + canvasInfo + '. ' + selectedInfo + '. ' +
            'Give practical creative suggestions. Always be encouraging and positive.'
    }];
    aiChatMem.forEach(function (m) {
        if (m.role === 'user') messages.push({ role: 'user', content: m.text });
        else if (m.role === 'bot') messages.push({ role: 'assistant', content: m.text });
    });
    messages.push({ role: 'user', content: context });
    showTyping(true);
    fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GROQ_KEY },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: messages, max_tokens: 150, temperature: 0.8 })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            showTyping(false);
            var text = '';
            if (data && data.reply) text = String(data.reply).trim();
            else if (data && data.choices && data.choices[0] && data.choices[0].message) text = String(data.choices[0].message.content || '').trim();
            else if (typeof data === 'string') text = data.trim();
            var low = text.toLowerCase();
            if (!text || text.length < 2 || low.indexOf('<html') !== -1 || low.indexOf('<!doctype') !== -1 || low.indexOf('<body') !== -1 || low.indexOf('<script') !== -1 || low.charAt(0) === '<') {
                text = 'Hello boss! Main ready hoon — bolo kya design help chahiye?';
            }
            text = text.substring(0, 250);
            if (showInChat !== false) { addChatMsg(text, true); addAiMem('bot', text); }
            updateLog(text);
            if (ttsOn) speakTTS(text);
        })
        .catch(function (err) {
            showTyping(false);
            console.warn('Groq error:', err);
            askAIFallback(context, showInChat);
        });
}

function askAIFallback(context, showInChat) {
    var prompt = 'You are Arjona AI, friendly Hinglish design assistant. Max 30 words. Context: ' + context;
    fetch('https://text.pollinations.ai/' + encodeURIComponent(prompt))
        .then(function (r) { return r.text(); })
        .then(function (text) {
            text = (text || '').trim();
            var low = text.toLowerCase();
            if (!text || low.indexOf('<html') !== -1 || low.indexOf('<!doctype') !== -1 || low.indexOf('<body') !== -1 || low.indexOf('<script') !== -1 || low.charAt(0) === '<') {
                text = 'Hello boss! Main ready hoon — bolo kya design help chahiye?';
            }
            text = text.substring(0, 150);
            if (showInChat !== false) { addChatMsg(text, true); addAiMem('bot', text); }
            updateLog(text);
        })
        .catch(function () { if (showInChat !== false) addChatMsg('Network issue hai, retry karo!', true); });
}

function sendAiChat() {
    var inp = document.getElementById('aiChatInput');
    var msg = (inp.value || '').trim();
    inp.value = '';
    if (!msg) return;

    addChatMsg(msg, false);
    addAiMem('user', msg);

    var low = msg.toLowerCase();
    var executed = false;
    var el;

    if (low.match(/\b(bada|bigger|large|increase|badhao)\b/)) {
        el = findEl(selId);
        if (el) {
            if (el.type === 'text' && el.fontSize) el.fontSize = Math.min(300, el.fontSize + 20);
            el.scale = Math.min(320, el.scale + 20);
            R(); sUI(); addChatMsg('Made it bigger', true); executed = true;
        }
    }

    if (low.match(/\b(chota|smaller|decrease|reduce|ghata)\b/)) {
        el = findEl(selId);
        if (el) {
            if (el.type === 'text' && el.fontSize) el.fontSize = Math.max(12, el.fontSize - 20);
            el.scale = Math.max(12, el.scale - 20);
            R(); sUI(); addChatMsg('Made it smaller', true); executed = true;
        }
    }

    if (low.match(/\b(rotate|ghuma|turn)\b/)) {
        el = findEl(selId);
        if (el) {
            var angle = 45;
            if (low.match(/\b(left|ulta|anti)\b/)) angle = -45;
            if (low.match(/\b90\b/)) angle = low.match(/left/) ? -90 : 90;
            if (low.match(/\b180\b/)) angle = 180;
            el.rotate = (el.rotate + angle + 360) % 360;
            R(); sUI(); addChatMsg('Rotated ' + angle + '°', true); executed = true;
        }
    }

    if (low.match(/\b(color|rang|colour)\b/)) {
        el = findEl(selId);
        if (el && el.type === 'text') {
            var colorMap = {
                'red': '#FF0000', 'lal': '#FF0000', 'blue': '#0066FF', 'neela': '#0066FF',
                'green': '#00CC00', 'hara': '#00CC00', 'yellow': '#FFD700', 'peela': '#FFD700',
                'white': '#FFFFFF', 'safed': '#FFFFFF', 'black': '#000000', 'kala': '#000000',
                'purple': '#7F3DFF', 'pink': '#FF69B4', 'orange': '#FF6F00', 'cyan': '#00C6FF',
                'gold': '#FFD700', 'silver': '#C0C0C0'
            };
            var found = false;
            for (var c in colorMap) {
                if (low.indexOf(c) >= 0) {
                    el.color = colorMap[c]; R(); sUI();
                    addChatMsg('Color changed to ' + c, true); found = true; executed = true; break;
                }
            }
            if (!found) {
                addChatMsg('Colors: red, blue, green, yellow, white, black, purple, pink, orange, cyan, gold', true);
                executed = true;
            }
        }
    }

    if (low.match(/\b(transparent|opacity|see through|halka)\b/)) {
        el = findEl(selId);
        if (el) { el.opacity = Math.max(10, el.opacity - 20); R(); sUI(); addChatMsg('Opacity: ' + el.opacity + '%', true); executed = true; }
    }

    if (low.match(/\b(opaque|solid|full|dark|pakka)\b/) && !executed) {
        el = findEl(selId);
        if (el) { el.opacity = 100; R(); sUI(); addChatMsg('Full opacity restored', true); executed = true; }
    }

    if (low.match(/\bfont\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') {
            var fontMap = { 'impact': 'Impact', 'arial': 'Arial', 'georgia': 'Georgia', 'courier': 'Courier New', 'verdana': 'Verdana', 'times': 'Times New Roman' };
            var ffound = false;
            for (var f in fontMap) {
                if (low.indexOf(f) >= 0) {
                    el.font = fontMap[f]; R(); sUI();
                    addChatMsg('Font changed to ' + fontMap[f], true); ffound = true; executed = true; break;
                }
            }
            if (!ffound) { addChatMsg('Available: Impact, Arial, Georgia, Courier, Verdana, Times', true); executed = true; }
        }
    }

    if (low.match(/\b(center|beech|middle)\b/) && !executed) {
        el = findEl(selId);
        if (el) { el.x = canvas.width / 2; el.y = canvas.height / 2; R(); showCornerHandles(el); addChatMsg('Centered', true); executed = true; }
    }

    if (low.match(/\bleft\b/) && !low.match(/rotate/) && !executed) {
        el = findEl(selId);
        if (el) { el.x = Math.max(40, el.x - 50); R(); showCornerHandles(el); addChatMsg('Moved left', true); executed = true; }
    }

    if (low.match(/\bright\b/) && !low.match(/rotate/) && !executed) {
        el = findEl(selId);
        if (el) { el.x = Math.min(canvas.width - 40, el.x + 50); R(); showCornerHandles(el); addChatMsg('Moved right', true); executed = true; }
    }

    if (low.match(/\b(up|upar|top)\b/) && !executed) {
        el = findEl(selId);
        if (el) { el.y = Math.max(40, el.y - 50); R(); showCornerHandles(el); addChatMsg('Moved up', true); executed = true; }
    }

    if (low.match(/\b(down|niche|bottom)\b/) && !executed) {
        el = findEl(selId);
        if (el) { el.y = Math.min(canvas.height - 40, el.y + 50); R(); showCornerHandles(el); addChatMsg('Moved down', true); executed = true; }
    }

    if (low.match(/\b(neon|glow)\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') { el.glow = 25; el.glowColor = '#00C6FF'; R(); sUI(); addChatMsg('Neon glow added', true); executed = true; }
    }

    if (low.match(/\b(3d|three d|depth)\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') { el.threeDDepth = 15; el.threeDColor = '#4A5578'; R(); sUI(); addChatMsg('3D effect added', true); executed = true; }
    }

    if (low.match(/\b(shadow|chaya)\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') { el.innerShadow = 10; el.innerShadowColor = '#000000'; R(); sUI(); addChatMsg('Shadow added', true); executed = true; }
    }

    if (low.match(/\b(outline|stroke|border)\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') { el.stroke = 4; el.strokeColor = '#000000'; R(); sUI(); addChatMsg('Outline added', true); executed = true; }
    }

    if (low.match(/\b(clear|hatao|remove effect|reset effect|saaf)\b/) && !executed) {
        el = findEl(selId);
        if (el && el.type === 'text') {
            el.glow = 0; el.threeDDepth = 0; el.innerShadow = 0; el.emboss = 0; el.stroke = 0; el.reflection = 0;
            R(); sUI(); addChatMsg('All effects cleared', true); executed = true;
        }
    }

    if (low.match(/\b(copy|duplicate|clone|naqal)\b/) && !executed) {
        if (selId) { layerOp('dup'); addChatMsg('Layer duplicated', true); executed = true; }
    }

    if (low.match(/\b(delete|remove|hatao|mita)\b/) && !low.match(/background|bg|effect/) && !executed) {
        if (selId) { layerOp('del'); addChatMsg('Layer deleted', true); executed = true; }
    }

    if (low.match(/\b(flip|mirror)\b/) && !executed) {
        flipH(); addChatMsg('Flipped horizontally', true); executed = true;
    }

    if (low.match(/\b(add text|text add|text likh|likho)\b/) && !executed) {
        addText(); addChatMsg('Text layer added', true); executed = true;
    }

    if (low.match(/\b(upload|image add|photo)\b/) && !executed) {
        document.getElementById('qImg').click(); addChatMsg('Upload dialog opened', true); executed = true;
    }

    if (!executed) executed = processAICommand(msg);

    if (!executed && (
        low.match(/\b(add|lagao|daal|put|place|rakh)\b/) ||
        low.match(/\b(generate|bana|create)\b/) ||
        low.match(/\b(background|bg|scene)\b/))) {

        loader.style.display = 'flex';
        document.getElementById('ldrMsg').innerText = 'AI Working...';
        addChatMsg('Generating: ' + msg, true);

        var aiUrl = 'https://image.pollinations.ai/prompt/' +
            encodeURIComponent(msg + ', high quality, detailed, professional') +
            '?width=' + canvas.width + '&height=' + canvas.height +
            '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

        var aiImg = new Image();
        aiImg.crossOrigin = 'anonymous';
        aiImg.onload = function () {
            loader.style.display = 'none';
            addAILayer(aiImg);
            addChatMsg('Done! Layer added. Drag to position it.', true);
        };
        aiImg.onerror = function () { loader.style.display = 'none'; addChatMsg('Generation failed, try again!', true); };
        aiImg.src = aiUrl;
        executed = true;
    }

    if (!executed && low.match(/\b(background|bg|wallpaper|scene)\b/) && low.match(/\b(change|set|make|bana|laga|dal)\b/)) {
        loader.style.display = 'flex';
        document.getElementById('ldrMsg').innerText = 'Generating BG...';
        addChatMsg('Generating background: ' + msg, true);

        var bgUrl = 'https://image.pollinations.ai/prompt/' +
            encodeURIComponent(msg + ', wide angle, background, high quality') +
            '?width=' + canvas.width + '&height=' + canvas.height +
            '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

        var bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        bgImg.onload = function () {
            loader.style.display = 'none'; aiBg = bgImg; bgCf = null;
            sH('AI BG: ' + msg); R(); addChatMsg('Background updated!', true);
        };
        bgImg.onerror = function () { loader.style.display = 'none'; addChatMsg('BG generation failed!', true); };
        bgImg.src = bgUrl;
        executed = true;
    }

    if (!executed) askAI('user: ' + msg);
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
    var ic = document.getElementById('themeIcon');
    if (ic) ic.setAttribute('data-lucide', n === 'dark' ? 'moon' : 'sun');
    if (window.lucide) lucide.createIcons();
    if (typeof sUI === 'function') sUI();
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
    if (d.classList.contains('open')) { d.classList.remove('open'); o.classList.remove('open'); }
    else { d.classList.add('open'); o.classList.add('open'); }
}

function closeMobMenu() {
    document.getElementById('mobMenuDrawer').classList.remove('open');
    document.getElementById('mobMenuOverlay').classList.remove('open');
}

/* ===== BOTTOM SHEETS ===== */
var currentSheet = null, sheetDragging = false, sheetStartY = 0, sheetSwitching = false;
var sheetOrder = ['sheetTrans', 'sheetText', 'sheetFx', 'sheetMask', 'sheetGrade', 'sheetLib', 'sheetMore', 'sheetHist'];
var pendingSheetId = null, pendingSheetBtn = null;

function moveCanvasForSheet(sheet) {
    return; // Neutralized to keep canvas completely still and exactly centered
}

function resetCanvasPosition() {
    return; // Neutralized to keep canvas completely still and exactly centered
}

function getSheetDirection(fromId, toId) {
    var fromIndex = sheetOrder.indexOf(fromId);
    var toIndex = sheetOrder.indexOf(toId);
    if (fromIndex === -1 || toIndex === -1) return 'right';
    return toIndex > fromIndex ? 'right' : 'left';
}

function clearSheetAnimClasses(el) {
    if (!el) return;
    el.classList.remove('sheet-enter-left', 'sheet-enter-right', 'sheet-exit-left', 'sheet-exit-right');
}

function setActiveBottomBtn(sheetId, btn) {
    var btns = document.querySelectorAll('.mob-bar-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle('active', btns[i].getAttribute('data-sheet') === sheetId);
    }
    if (btn && btn.classList) btn.classList.add('active');
}

function flushPendingSheet() {
    if (!pendingSheetId) return;
    var nextId = pendingSheetId;
    var nextBtn = pendingSheetBtn;
    pendingSheetId = null;
    pendingSheetBtn = null;
    if (nextId !== currentSheet) openBottomSheet(nextBtn, nextId);
}

function openBottomSheet(btn, sheetId) {
    if (sheetSwitching) {
        pendingSheetId = sheetId;
        pendingSheetBtn = btn || null;
        setActiveBottomBtn(sheetId, btn);
        return;
    }

    var overlay = document.getElementById('mobSheetOverlay');
    var newSheet = document.getElementById(sheetId);
    if (!overlay || !newSheet) return;

    if (currentSheet === sheetId) {
        closeBottomSheet();
        return;
    }

    setActiveBottomBtn(sheetId, btn);

    if (!currentSheet) {
        clearSheetAnimClasses(newSheet);
        newSheet.classList.add('open');
        overlay.classList.add('open');
        document.body.classList.add('sheet-open');
        if (typeof hideCornerHandles === 'function') hideCornerHandles();
        if (typeof R === 'function') R();
        currentSheet = sheetId;
        if (sheetId === 'sheetHist' && typeof renderHistList === 'function') renderHistList();
        setTimeout(function () { moveCanvasForSheet(newSheet); }, 10);
        return;
    }

    var prevSheet = document.getElementById(currentSheet);
    if (!prevSheet) {
        currentSheet = null;
        openBottomSheet(btn, sheetId);
        return;
    }

    sheetSwitching = true;
    var dir = getSheetDirection(currentSheet, sheetId);

    clearSheetAnimClasses(prevSheet);
    clearSheetAnimClasses(newSheet);

    overlay.classList.add('open');
    document.body.classList.add('sheet-open');
    if (typeof hideCornerHandles === 'function') hideCornerHandles();
    if (typeof R === 'function') R();

    newSheet.classList.add('open', dir === 'right' ? 'sheet-enter-right' : 'sheet-enter-left');
    prevSheet.classList.add(dir === 'right' ? 'sheet-exit-left' : 'sheet-exit-right');

    if (sheetId === 'sheetHist' && typeof renderHistList === 'function') renderHistList();
    setTimeout(function () { moveCanvasForSheet(newSheet); }, 10);

    requestAnimationFrame(function () {
        newSheet.classList.remove('sheet-enter-right', 'sheet-enter-left');
    });

    currentSheet = sheetId;

    setTimeout(function () {
        clearSheetAnimClasses(prevSheet);
        prevSheet.classList.remove('open');
        clearSheetAnimClasses(newSheet);
        sheetSwitching = false;
        flushPendingSheet();
    }, 240);
}

function closeBottomSheet() {
    if (sheetSwitching) {
        pendingSheetId = null;
        pendingSheetBtn = null;
        return;
    }
    var sheets = document.querySelectorAll('.mob-sheet');
    for (var i = 0; i < sheets.length; i++) {
        clearSheetAnimClasses(sheets[i]);
        sheets[i].classList.remove('open');
    }
    document.getElementById('mobSheetOverlay').classList.remove('open');
    document.body.classList.remove('sheet-open');
    currentSheet = null;
    var btns = document.querySelectorAll('.mob-bar-btn');
    for (var j = 0; j < btns.length; j++) btns[j].classList.remove('active');
    resetCanvasPosition();
    if (typeof R === 'function') R();
    if (typeof showCornerHandles === 'function' && selId) {
        var selectedEl = findEl(selId);
        if (selectedEl) setTimeout(function () { showCornerHandles(selectedEl); }, 10);
    }
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
    e.preventDefault(); mobResizing = true;
    var touch = e.touches ? e.touches[0] : e;
    mobResizeStartY = touch.clientY;
    mobResizeStartH = document.getElementById('mobBottomBar').offsetHeight;
}
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

/* ===== CORNER RESIZE ===== */
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
        if (h) { h.style.left = pos[i][0] + 'px'; h.style.top = pos[i][1] + 'px'; h.style.display = 'block'; }
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
    cornerStartX = e.clientX; cornerStartY = e.clientY;
    cornerStartScale = el.scale;
    if (el.fontSize) cornerStartFontSize = el.fontSize;
    document.body.style.userSelect = 'none';
}

/* ===== TABS ===== */
function bpTab(btn) {
    var ts = document.querySelectorAll('.bp-tab');
    var ps = document.querySelectorAll('.bp-pan');
    var targetId = btn.getAttribute('data-p');
    var currentPan = null;
    for (var i = 0; i < ps.length; i++) { if (ps[i].classList.contains('active')) { currentPan = ps[i]; break; } }
    if (currentPan && currentPan.id === targetId) return;
    if (currentPan) { currentPan.style.opacity = '0'; currentPan.style.transform = 'translateY(5px)'; }
    for (var i = 0; i < ts.length; i++) ts[i].classList.remove('active');
    btn.classList.add('active');
    setTimeout(function () {
        for (var i = 0; i < ps.length; i++) { ps[i].classList.remove('active'); ps[i].style.opacity = ''; ps[i].style.transform = ''; }
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
    canvas.width = w; canvas.height = h;
    updateCanvasInfo(); R();
}

/* ===== BACKGROUND ===== */
function setBg(type, sub) {
    if (type === 'solid') bgCf = { type: 'solid', color: document.getElementById('bgSC').value };
    else if (type === 'grad') bgCf = {
        type: 'grad', c1: document.getElementById('bgG1').value,
        c2: document.getElementById('bgG2').value, dir: document.getElementById('bgGD').value
    };
    else if (type === 'pat') bgCf = {
        type: 'pat', pat: sub, pc: document.getElementById('bgPC').value, bc: document.getElementById('bgPB').value
    };
    aiBg = null; sH('BG Change'); R();
}

function preBg(c1, c2) {
    bgCf = c1 === c2 ? { type: 'solid', color: c1 } : { type: 'grad', c1: c1, c2: c2, dir: 'diag' };
    aiBg = null; sH('BG Preset'); R();
}
function clearBg() { bgCf = null; aiBg = null; sH('BG Clear'); R(); }

function paintBg() {
    var W = canvas.width, H = canvas.height;
    if (aiBg && aiBg.complete && aiBg.naturalWidth > 0) {
        var s = Math.max(W / aiBg.naturalWidth, H / aiBg.naturalHeight);
        ctx.drawImage(aiBg, (W - aiBg.naturalWidth * s) / 2, (H - aiBg.naturalHeight * s) / 2, aiBg.naturalWidth * s, aiBg.naturalHeight * s);
        return;
    }
    if (!bgCf) {
        var g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#090f1d'); g.addColorStop(.5, '#0c1a2e'); g.addColorStop(1, '#060b16');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        return;
    }
    var c = bgCf;
    if (c.type === 'solid') { ctx.fillStyle = c.color; ctx.fillRect(0, 0, W, H); }
    else if (c.type === 'grad') {
        var g2;
        if (c.dir === 'rad') g2 = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
        else if (c.dir === 'lr') g2 = ctx.createLinearGradient(0, 0, W, 0);
        else if (c.dir === 'diag') g2 = ctx.createLinearGradient(0, 0, W, H);
        else g2 = ctx.createLinearGradient(0, 0, 0, H);
        g2.addColorStop(0, c.c1); g2.addColorStop(1, c.c2);
        ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    } else if (c.type === 'pat') {
        ctx.fillStyle = c.bc || '#0a0f1e'; ctx.fillRect(0, 0, W, H);
        ctx.save();
        ctx.strokeStyle = c.pc || '#7F3DFF'; ctx.fillStyle = c.pc || '#7F3DFF'; ctx.globalAlpha = .1;
        var sz = 24;
        if (c.pat === 'dots') {
            for (var x = 0; x < W; x += sz) for (var y = 0; y < H; y += sz) { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); }
        } else if (c.pat === 'grid') {
            ctx.lineWidth = 1;
            for (var x2 = 0; x2 <= W; x2 += sz) { ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, H); ctx.stroke(); }
            for (var y2 = 0; y2 <= H; y2 += sz) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(W, y2); ctx.stroke(); }
        } else if (c.pat === 'stripe') {
            ctx.lineWidth = 2;
            for (var x3 = -H; x3 < W + H; x3 += sz) { ctx.beginPath(); ctx.moveTo(x3, 0); ctx.lineTo(x3 - H, H); ctx.stroke(); }
        } else if (c.pat === 'check') {
            for (var x4 = 0; x4 < W; x4 += sz) for (var y4 = 0; y4 < H; y4 += sz) {
                if ((Math.floor(x4 / sz) + Math.floor(y4 / sz)) % 2 === 0) ctx.fillRect(x4, y4, sz, sz);
            }
        }
        ctx.restore();
    }
}

/* ===== PRO HISTORY SYSTEM ===== */
function serializeImg(img) {
    if (!img) return null;
    try {
        if (img.src && img.src.startsWith('data:')) return img.src;
        var tc = document.createElement('canvas');
        tc.width = img.naturalWidth || img.width;
        tc.height = img.naturalHeight || img.height;
        tc.getContext('2d').drawImage(img, 0, 0);
        return tc.toDataURL();
    } catch (e) { return null; }
}

function serS() {
    return JSON.stringify({
        els: els.map(function (e) {
            var c = {};
            for (var k in e) {
                if (k === 'content' || k === 'eraserMask') continue;
                c[k] = e[k];
            }
            if (e.type === 'image' && e.content) c.src = serializeImg(e.content);
            if (e.eraserMask) {
                try { c.mask = e.eraserMask.toDataURL(); } catch (er) { }
            }
            return c;
        }),
        aiBg: serializeImg(aiBg),
        bgCf: bgCf
    });
}

function sH(label) {
    uS.push(serS()); histLabels.push(label || 'Edit');
    if (uS.length > 50) { uS.shift(); histLabels.shift(); }
    rS = [];
    renderHistList();
}

function renderHistList() {
    var list = document.getElementById('histList');
    if (!list) return;
    if (uS.length <= 1) { list.innerHTML = '<div class="hist-empty">No history yet</div>'; return; }
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
    if (idx > uS.length - 1 - rS.length) {
        var stepsForward = idx - (uS.length - 1 - rS.length);
        for (var i = 0; i < stepsForward; i++) triggerRedo();
    } else {
        var stepsBack = (uS.length - 1 - rS.length) - idx;
        for (var j = 0; j < stepsBack; j++) triggerUndo();
    }
}

function clearHistory() {
    var last = uS[uS.length - 1];
    uS = last ? [last] : []; histLabels = last ? ['Init'] : [];
    rS = [];
    renderHistList();
}

function triggerUndo() {
    if (uS.length <= 1) return;
    rS.push(uS.pop());
    var prev = uS[uS.length - 1];
    restS(prev, function () {
        R();
        if (selId) { var el = findEl(selId); if (el) showCornerHandles(el); }
        renderHistList();
    });
}

function triggerRedo() {
    if (!rS.length) return;
    var next = rS.pop();
    uS.push(next);
    restS(next, function () {
        R();
        if (selId) { var el = findEl(selId); if (el) showCornerHandles(el); }
        renderHistList();
    });
}

function restS(json, callback) {
    var p = JSON.parse(json);
    bgCf = p.bgCf || null;
    var imgCount = 0;
    var loaded = 0;
    p.els.forEach(function (e) { if (e.type === 'image') imgCount++; });
    if (p.aiBg) imgCount++;

    var doneCalled = false;
    function checkDone() {
        if (doneCalled) return;
        loaded++;
        if (loaded >= imgCount) {
            doneCalled = true;
            selId = null;
            if (typeof sUI === 'function') sUI();
            if (typeof hideCornerHandles === 'function') hideCornerHandles();
            if (typeof R === 'function') R();
            if (callback) callback();
        }
    }

    // Safety timeout in case image loading hangs offline or in sandboxed preview
    if (imgCount > 0) {
        setTimeout(function () {
            if (!doneCalled) {
                doneCalled = true;
                selId = null;
                if (typeof sUI === 'function') sUI();
                if (typeof hideCornerHandles === 'function') hideCornerHandles();
                if (typeof R === 'function') R();
                if (callback) callback();
            }
        }, 350);
    }

    els = p.els.map(function (e) {
        var o = {};
        for (var k in e) {
            if (k === 'src' || k === 'mask') continue;
            o[k] = e[k];
        }
        if (e.type === 'image') {
            o.content = new Image();
            o.content.crossOrigin = 'anonymous';
            o.content.onload = checkDone;
            o.content.onerror = checkDone;
            o.content.src = e.src || '';
            o.eraserMask = document.createElement('canvas');
            if (e.mask) {
                var mi = new Image();
                mi.onload = function () {
                    o.eraserMask.width = mi.width; o.eraserMask.height = mi.height;
                    o.eraserMask.getContext('2d').drawImage(mi, 0, 0);
                };
                mi.onerror = function() {};
                mi.src = e.mask;
            } else {
                o.eraserMask.width = 400; o.eraserMask.height = 400;
                var mc = o.eraserMask.getContext('2d');
                mc.fillStyle = '#fff'; mc.fillRect(0, 0, 400, 400);
            }
        }
        return o;
    });

    if (p.aiBg) {
        var bgImg = new Image();
        bgImg.onload = function () { aiBg = bgImg; checkDone(); };
        bgImg.onerror = function () { aiBg = null; checkDone(); };
        bgImg.src = p.aiBg;
    } else {
        aiBg = null;
    }

    if (imgCount === 0 && !doneCalled) {
        doneCalled = true;
        selId = null;
        if (typeof sUI === 'function') sUI();
        if (typeof hideCornerHandles === 'function') hideCornerHandles();
        if (typeof R === 'function') R();
        if (callback) callback();
    }
}

/* ===== LAYERS ===== */
function addText() {
    els.push({
        id: 't' + Date.now(), type: 'text', text: 'EDIT TEXT',
        x: canvas.width / 2, y: canvas.height / 2,
        scale: 100, rotate: 0, opacity: 100,
        font: 'Arial', color: '#7F3DFF',
        charSpacing: 0, curve: 0, stroke: 2, strokeColor: '#000000',
        emboss: 0, threeDDepth: 0, threeDColor: '#1e293b',
        innerShadow: 0, innerShadowColor: '#000000',
        reflection: 0, glow: 8, glowColor: '#7F3DFF', fontSize: 60
    });
    selId = els[els.length - 1].id;
    sH('Add Text'); R(); sUI(); updateCanvasInfo();
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
            mx.fillStyle = '#fff'; mx.fillRect(0, 0, mc.width, mc.height);
            var sc = 50;
            if (img.width * (sc / 100) > canvas.width * 0.65) sc = Math.floor(canvas.width * 0.65 / img.width * 100);
            if (img.height * (sc / 100) > canvas.height * 0.65) sc = Math.min(sc, Math.floor(canvas.height * 0.65 / img.height * 100));
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
    for (var j = 0; j < els.length; j++) { if (els[j].id === selId) { i = j; break; } }
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
            nm.width = s.eraserMask.width; nm.height = s.eraserMask.height;
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
    return { x: ox * (canvas.width / r.width), y: oy * (canvas.height / r.height) };
}

canvas.addEventListener('mousedown', function (e) { e.preventDefault(); mD(gCC(e)); });
canvas.addEventListener('mousemove', function (e) { if (drag) mV(gCC(e)); });
canvas.addEventListener('mouseup', function () { mU(); });
canvas.addEventListener('mouseleave', function () { if (drag) mU(); });
canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    if (e.touches.length === 1) { mD(touchToCanvas(e.touches[0])); }
}, { passive: false });
canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    if (e.touches.length === 2 && selId) {
        var t1 = e.touches[0], t2 = e.touches[1];
        var dist = Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
        if (!canvas._pinchStart) canvas._pinchStart = { dist: dist, scale: (findEl(selId) || {}).scale || 100 };
        var el = findEl(selId);
        if (el) {
            el.scale = Math.max(12, Math.min(320, Math.round(canvas._pinchStart.scale * (dist / canvas._pinchStart.dist))));
            sUI(); R();
        }
        return;
    }
    if (e.touches.length === 1) { mV(touchToCanvas(e.touches[0])); }
}, { passive: false });
canvas.addEventListener('touchend', function () { canvas._pinchStart = null; mU(); }, { passive: false });

function mD(pt) {
    var x = pt.x, y = pt.y;
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
    for (var i = els.length - 1; i >= 0; i--) { if (hitEl(els[i], x, y)) { hit = els[i]; break; } }
    if (hit) {
        if (hit.locked) {
            if (typeof showStatusBadge === 'function') showStatusBadge("🔒 Layer is locked");
            return;
        }
        selId = hit.id; drag = true;
        dX = x - hit.x; dY = y - hit.y;
        canvas.style.cursor = 'move';
        sUI(); showCornerHandles(hit);
        if (hit.type === 'text') {
            var di = document.getElementById('txtIn');
            var mi = document.getElementById('mobTxtIn');
            if (di) di.value = hit.text || '';
            if (mi) mi.value = hit.text || '';
        }
    } else {
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
        var fs = el.fontSize || Math.max(el.scale * 0.6, 8);
        ctx.save();
        ctx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
        var tw = ctx.measureText(el.text || '').width;
        var sp = el.charSpacing || 0;
        var totalW = tw + (sp * Math.max(0, (el.text || '').length - 1));
        ctx.restore();
        var padding = 15;
        var textH = fs * 1.2;
        var rot2 = (el.rotate || 0) * Math.PI / 180;
        var lx2 = Math.cos(-rot2) * (x - el.x) - Math.sin(-rot2) * (y - el.y);
        var ly2 = Math.sin(-rot2) * (x - el.x) + Math.cos(-rot2) * (y - el.y);
        return lx2 >= -totalW / 2 - padding && lx2 <= totalW / 2 + padding && ly2 >= -textH / 2 - padding && ly2 <= textH / 2 + padding;
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
    if (mode === 'select') canvas.style.cursor = selId ? 'move' : 'default';
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
    if (!el || el.type !== 'text') { addText(); el = findEl(selId); }
    if (el && el.type === 'text') {
        el.text = v; R();
        var di = document.getElementById('txtIn');
        if (di && di !== document.activeElement) di.value = v;
        var mi = document.getElementById('mobTxtIn');
        if (mi && mi !== document.activeElement) mi.value = v;
    }
}

function setProp(p, v) {
    var el = findEl(selId);
    if (!el) return;
    var strProps = ['color', 'strokeColor', 'threeDColor', 'glowColor', 'font', 'innerShadowColor', 'embossColor', 'threeDShadowColor'];
    el[p] = strProps.indexOf(p) >= 0 ? v : parseFloat(v);
    var displays = {
        scale: ['v-sc', '%', 'mob-v-sc'], rotate: ['v-rt', '°', 'mob-v-rt'],
        opacity: ['v-op', '%', 'mob-v-op'], fontSize: ['v-fs', 'px', 'mob-v-fs'],
        charSpacing: ['v-sp', 'px'], curve: ['v-cu', '°'], stroke: ['v-st', 'px'],
        glow: ['v-gw', 'px'], threeDDepth: ['v-3d', 'px'], innerShadow: ['v-is', 'px'],
        emboss: ['v-em', 'px'], reflection: ['v-rf', '%']
    };
    if (displays[p]) {
        var d = displays[p];
        var el1 = document.getElementById(d[0]);
        if (el1) el1.innerText = v + d[1];
        if (d[2]) { var el2 = document.getElementById(d[2]); if (el2) el2.innerText = v + d[1]; }
    }
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
                if (sel) {
                    var op = document.createElement('option');
                    op.value = n; op.textContent = n;
                    sel.appendChild(op); sel.value = n;
                }
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
    if (!el) {
        showSelBar(null);
        if (window._lastDynamicSelId !== null) {
            window._lastDynamicSelId = null;
        }
        if (typeof syncDynamicToolbarVisibility === 'function') syncDynamicToolbarVisibility();
        return;
    }

    if (window._lastDynamicSelId !== selId && window.innerWidth <= 900) {
        window._lastDynamicSelId = selId;
        if (el.type === 'text') {
            if (typeof selectBottomTab === 'function') selectBottomTab('type', null, true);
        } else if (el.type === 'image') {
            if (typeof selectBottomTab === 'function') selectBottomTab('image', null, true);
        }
    }
    if (typeof syncDynamicToolbarVisibility === 'function') syncDynamicToolbarVisibility();

    var setVal = function (id, val) { var e = document.getElementById(id); if (e) e.value = val; };
    var setTxt_ = function (id, val) { var e = document.getElementById(id); if (e) e.innerText = val; };

    setVal('sl-sc', el.scale || 100); setTxt_('v-sc', (el.scale || 100) + '%');
    setVal('mob-sl-sc', el.scale || 100); setTxt_('mob-v-sc', (el.scale || 100) + '%');
    setVal('sl-rt', el.rotate || 0); setTxt_('v-rt', (el.rotate || 0) + '°');
    setVal('mob-sl-rt', el.rotate || 0); setTxt_('mob-v-rt', (el.rotate || 0) + '°');
    setVal('sl-op', el.opacity || 100); setTxt_('v-op', (el.opacity || 100) + '%');
    setVal('mob-sl-op', el.opacity || 100); setTxt_('mob-v-op', (el.opacity || 100) + '%');

    if (el.type === 'text') {
        setVal('txtIn', el.text || ''); setVal('mobTxtIn', el.text || '');
        setVal('txtCol', el.color || '#7F3DFF'); setVal('mobTxtCol', el.color || '#7F3DFF');
        setVal('sl-fs', el.fontSize || 60); setTxt_('v-fs', (el.fontSize || 60) + 'px');
        setVal('mob-sl-fs', el.fontSize || 60); setTxt_('mob-v-fs', (el.fontSize || 60) + 'px');
        setVal('sl-sp', el.charSpacing || 0); setTxt_('v-sp', (el.charSpacing || 0) + 'px');
        setVal('sl-cu', el.curve || 0); setTxt_('v-cu', (el.curve || 0) + '°');
        setVal('sl-st', el.stroke || 0); setTxt_('v-st', (el.stroke || 0) + 'px');
        setVal('c-stroke', el.strokeColor || '#000000');
        setVal('sl-gw', el.glow || 0); setTxt_('v-gw', (el.glow || 0) + 'px');
        setVal('c-glow', el.glowColor || '#7F3DFF');
        setVal('sl-3d', el.threeDDepth || 0); setTxt_('v-3d', (el.threeDDepth || 0) + 'px');
        setVal('c-3d', el.threeDColor || '#1e293b');
        setVal('sl-is', el.innerShadow || 0); setTxt_('v-is', (el.innerShadow || 0) + 'px');
        setVal('c-is', el.innerShadowColor || '#000000');
        setVal('sl-em', el.emboss || 0); setTxt_('v-em', (el.emboss || 0) + 'px');
        setVal('sl-rf', el.reflection || 0); setTxt_('v-rf', (el.reflection || 0) + '%');
    }

    if (typeof currentMobEditorOption !== 'undefined' && currentMobEditorOption && document.getElementById('mobToolEditor') && document.getElementById('mobToolEditor').classList.contains('open')) {
        var bodyEl = document.getElementById('mobEditorBody');
        if (bodyEl) {
            bodyEl.innerHTML = '';
            renderMobEditorControls(currentMobEditorOption, bodyEl);
        }
    }
}

/* ===== TEXT RENDERING ===== */
function dTxt(el) {
    ctx.save();
    ctx.globalAlpha = (el.opacity || 100) / 100;
    var fs = el.fontSize || Math.max(el.scale * 0.6, 8);
    ctx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var txt = el.text || '';
    var sp = el.charSpacing || 0;

    function measureTotal(s) {
        var w = 0;
        for (var i = 0; i < s.length; i++) w += ctx.measureText(s[i]).width + sp;
        return Math.max(w - sp, 1);
    }

    ctx.save();
    ctx.translate(el.x, el.y);
    ctx.rotate((el.rotate || 0) * Math.PI / 180);

    if (el.curve && el.curve !== 0) {
        var ang = el.curve / 180 * Math.PI;
        var totalW = measureTotal(txt);
        var rad = totalW / Math.abs(ang) || 300;
        var startAngle = -Math.PI / 2 - ang / 2;
        for (var i = 0; i < txt.length; i++) {
            var ch = txt[i];
            var cw = ctx.measureText(ch).width + sp;
            var dA = cw / rad;
            ctx.save();
            ctx.translate(Math.cos(startAngle + dA / 2) * rad, Math.sin(startAngle + dA / 2) * rad + (el.curve > 0 ? rad : -rad));
            ctx.rotate(startAngle + dA / 2 + Math.PI / 2 + (el.curve > 0 ? 0 : Math.PI));
            renderChar(el, ch, 0, 0);
            ctx.restore();
            startAngle += dA;
        }
    } else {
        var total = measureTotal(txt);
        var xOffset = -total / 2;
        for (var i = 0; i < txt.length; i++) {
            var ch2 = txt[i];
            var cw2 = ctx.measureText(ch2).width;
            renderChar(el, ch2, xOffset + cw2 / 2, 0);
            xOffset += cw2 + sp;
        }
        if ((el.reflection || 0) > 0) {
            ctx.save();
            ctx.scale(1, -1);
            ctx.globalAlpha = el.reflection / 100 * 0.28;
            var rg = ctx.createLinearGradient(0, 0, 0, fs);
            rg.addColorStop(0, el.color || '#7F3DFF');
            rg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = rg;
            var x2 = -total / 2;
            for (var j = 0; j < txt.length; j++) {
                var ch3 = txt[j];
                var cw3 = ctx.measureText(ch3).width;
                ctx.fillText(ch3, x2 + cw3 / 2, -fs * 0.15);
                x2 += cw3 + sp;
            }
            ctx.restore();
        }
    }

    ctx.restore();
    ctx.restore();
}

function renderChar(el, ch, x, y) {
    if ((el.glow || 0) > 0) {
        ctx.save();
        ctx.shadowColor = el.glowColor || '#7F3DFF'; ctx.shadowBlur = el.glow;
        ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);
        ctx.restore();
    }
    if ((el.threeDDepth || 0) > 0) {
        ctx.fillStyle = el.threeDColor || '#1e293b';
        for (var i = el.threeDDepth; i >= 1; i--) ctx.fillText(ch, x + i * 0.8, y + i * 0.6);
    }
    if ((el.emboss || 0) > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillText(ch, x - el.emboss * 0.4, y - el.emboss * 0.4);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillText(ch, x + el.emboss * 0.4, y + el.emboss * 0.4);
        ctx.restore();
    }
    if ((el.innerShadow || 0) > 0) {
        ctx.save();
        ctx.shadowColor = el.innerShadowColor || 'rgba(0,0,0,0.7)'; ctx.shadowBlur = el.innerShadow;
        ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);
        ctx.restore();
    }
    if ((el.stroke || 0) > 0) {
        ctx.save();
        ctx.lineWidth = el.stroke; ctx.strokeStyle = el.strokeColor || '#000';
        ctx.lineJoin = 'round'; ctx.strokeText(ch, x, y);
        ctx.restore();
    }
    ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);
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
            if (!el.content || !el.content.complete || !el.content.naturalWidth) { ctx.restore(); continue; }
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

    var hideSelectionWhileSheetOpen = window.innerWidth <= 900 && document.body.classList.contains('sheet-open');
    if (selId && !hideSelectionWhileSheetOpen) {
        var sel = findEl(selId);
        if (sel) {
            ctx.save();
            ctx.setLineDash([6, 3]); ctx.strokeStyle = '#7F3DFF'; ctx.lineWidth = 2;
            if (sel.type === 'image' && sel.content && sel.content.complete) {
                var sw = sel.content.width * (sel.scale / 100);
                var sh = sel.content.height * (sel.scale / 100);
                ctx.save();
                ctx.translate(sel.x + sw / 2, sel.y + sh / 2);
                ctx.rotate((sel.rotate || 0) * Math.PI / 180);
                ctx.strokeRect(-sw / 2 - 4, -sh / 2 - 4, sw + 8, sh + 8);
                ctx.restore();
            } else if (sel.type === 'text') {
                var fs2 = sel.fontSize || Math.max(sel.scale * 0.6, 8);
                ctx.font = 'bold ' + fs2 + 'px "' + (sel.font || 'Arial') + '"';
                var tw2 = ctx.measureText(sel.text || '').width;
                var th2 = fs2 * 1.2;
                ctx.save();
                ctx.translate(sel.x, sel.y);
                ctx.rotate((sel.rotate || 0) * Math.PI / 180);
                ctx.strokeRect(-tw2 / 2 - 8, -th2 / 2 - 6, tw2 + 16, th2 + 12);
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
        var s = document.getElementById('sg-' + ids[i]) || document.getElementById('mob-sg-' + ids[i]);
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
    ['br', 'ct', 'sa', 'te', 'vi', 'gr'].forEach(function (id2) {
        var sl = document.getElementById('sg-' + id2); if (sl) sl.value = 0;
        var msl = document.getElementById('mob-sg-' + id2); if (msl) msl.value = 0;
    });
    liveG();
}

function applyGrade() {
    R();
    try {
        var d = ctx.getImageData(0, 0, canvas.width, canvas.height), px = d.data;
        var gv = function (id3) {
            return parseInt((document.getElementById('sg-' + id3) || document.getElementById('mob-sg-' + id3) || { value: 0 }).value) || 0;
        };
        var br = gv('br'), ct = gv('ct'), sa = gv('sa'), te = gv('te');
        var cf = (259 * (ct + 255)) / (255 * (259 - ct));
        for (var i = 0; i < px.length; i += 4) {
            var r = px[i], g = px[i + 1], b = px[i + 2];
            r += br; g += br; b += br;
            r = cf * (r - 128) + 128; g = cf * (g - 128) + 128; b = cf * (b - 128) + 128;
            r += te; b -= te;
            var gray = .299 * r + .587 * g + .114 * b, sf = 1 + sa / 100;
            r = gray + sf * (r - gray); g = gray + sf * (g - gray); b = gray + sf * (b - gray);
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
            for (var dy2 = 0; dy2 < sz && y + dy2 < H; dy2++)
                for (var dx2 = 0; dx2 < sz && x + dx2 < W; dx2++) {
                    var i2 = ((y + dy2) * W + (x + dx2)) * 4;
                    px[i2] = r; px[i2 + 1] = g; px[i2 + 2] = b;
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
            var i3 = (y * W + x) * 4;
            d[i3] = r / c; d[i3 + 1] = g / c; d[i3 + 2] = b / c; d[i3 + 3] = s[i3 + 3];
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
            var i4 = (y * W + x) * 4;
            d[i4] = Math.max(0, Math.min(255, r));
            d[i4 + 1] = Math.max(0, Math.min(255, g));
            d[i4 + 2] = Math.max(0, Math.min(255, b));
            d[i4 + 3] = s[i4 + 3];
        }
    }
    apD(dst);
}

function invertColors() {
    var d = getD(), px = d.data;
    for (var i = 0; i < px.length; i += 4) { px[i] = 255 - px[i]; px[i + 1] = 255 - px[i + 1]; px[i + 2] = 255 - px[i + 2]; }
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
            for (var c = 0; c < 4; c++) { var tmp = px[l + c]; px[l + c] = px[r + c]; px[r + c] = tmp; }
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
    var tol = parseInt((document.getElementById('sl-tol') || document.getElementById('mob-sl-tol') || { value: 50 }).value) || 50;
    setTimeout(function () {
        try {
            var mc = el.eraserMask;
            var mx = mc.getContext('2d');
            var tc = document.createElement('canvas');
            tc.width = el.content.width; tc.height = el.content.height;
            tc.getContext('2d').drawImage(el.content, 0, 0);
            var d = tc.getContext('2d').getImageData(0, 0, tc.width, tc.height);
            var data = d.data, W = tc.width, H = tc.height;
            mx.globalCompositeOperation = 'source-over';
            mx.fillStyle = '#fff'; mx.fillRect(0, 0, mc.width, mc.height);
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
                        if (colorDist(data[si], data[si + 1], data[si + 2], tR, tG, tB) < tol) mark(px, py);
                    }
                }
            }

            if (method === 'bright') {
                for (var py2 = 0; py2 < H; py2++) {
                    for (var px2 = 0; px2 < W; px2++) {
                        var si2 = (py2 * W + px2) * 4;
                        var b = (data[si2] + data[si2 + 1] + data[si2 + 2]) / 3;
                        if (b > 255 - tol / 2 || b < tol / 2) mark(px2, py2);
                    }
                }
            }

            mx.putImageData(md, 0, 0);
            loader.style.display = 'none';
            sH('BG Removed'); R();
        } catch (e) { loader.style.display = 'none'; }
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
        if (aiMode === 'bg') { aiBg = nb; bgCf = null; sH('AI Background'); R(); }
        else { addAILayer(nb); }
    };
    nb.onerror = function () { clearTimeout(to); loader.style.display = 'none'; };
    nb.src = url;
}

function addAILayer(img) {
    var mc = document.createElement('canvas');
    mc.width = img.width; mc.height = img.height;
    mc.getContext('2d').fillStyle = '#fff';
    mc.getContext('2d').fillRect(0, 0, mc.width, mc.height);
    var sc = 50;
    if (img.width * (sc / 100) > canvas.width * 0.65) sc = Math.floor(canvas.width * 0.65 / img.width * 100);
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
    var modal = document.getElementById('resetConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'resetConfirmModal';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'display:flex; z-index:9999999;';
        modal.innerHTML = `
            <div class="modal-box" style="max-width:400px; width:90%; background:var(--bg); border:1px solid var(--bd2); border-radius:14px; overflow:hidden; box-shadow:0 12px 36px rgba(0,0,0,0.65);">
                <div class="modal-head" style="background:#10141C; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bd);">
                    <h2 style="font-size:15px; font-weight:800; color:var(--tx1); display:flex; align-items:center; gap:8px;">
                        <span style="font-size:18px;">⚠️</span> Reset Everything?
                    </h2>
                    <button class="modal-x" onclick="closeResetConfirmModal()" style="background:transparent; border:none; color:var(--tx2); font-size:16px; cursor:pointer;">✕</button>
                </div>
                <div class="modal-body" style="padding:18px; display:flex; flex-direction:column; gap:16px;">
                    <p style="font-size:13px; color:var(--tx2); line-height:1.5; margin:0;">
                        Are you sure you want to reset the entire canvas? This will remove all current image layers, text elements, background colors, and history steps. This action cannot be undone.
                    </p>
                    <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:4px;">
                        <button class="editor-back-btn" style="width:auto; height:36px; padding:0 18px; background:var(--bd); color:var(--tx1); font-size:13px; font-weight:600; border-radius:8px; cursor:pointer;" onclick="closeResetConfirmModal()">No, Cancel</button>
                        <button class="btn-action-primary" style="width:auto; height:36px; padding:0 20px; background:var(--dn); color:#fff; font-size:13px; font-weight:700; border-radius:8px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(255,61,113,0.3);" onclick="executeResetAllConfirmed()">Yes, Reset All</button>
                    </div>
                </div>
            </div>
        `;
        modal.addEventListener('click', function(e) { if (e.target === modal) closeResetConfirmModal(); });
        document.body.appendChild(modal);
    } else {
        modal.style.display = 'flex';
    }
}

function closeResetConfirmModal() {
    var modal = document.getElementById('resetConfirmModal');
    if (modal) modal.style.display = 'none';
}

function executeResetAllConfirmed() {
    closeResetConfirmModal();
    els = []; selId = null; aiBg = null; bgCf = null;
    uS = []; rS = []; histLabels = [];
    if (typeof sUI === 'function') sUI();
    if (typeof hideCornerHandles === 'function') hideCornerHandles();
    if (typeof R === 'function') R();
    if (typeof updateCanvasInfo === 'function') updateCanvasInfo();
    if (typeof renderHistList === 'function') renderHistList();
    if (typeof renderLayersPanel === 'function') renderLayersPanel();
    if (typeof showStatusBadge === 'function') showStatusBadge('🔄 Canvas successfully reset to defaults.');
}
function exportHD() { openExport(); }
function doVoice(ev) {
    ev.preventDefault();
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    var rec = new SR();
    rec.lang = 'en-US';
    rec.onresult = function (e) { document.getElementById('aiPrompt').value = e.results[0][0].transcript; };
    rec.start();
}

/* ============================================
   INIT
   ============================================ */
window.addEventListener('DOMContentLoaded', function () {
    try { Anim = window.AnimationManager || null; } catch(e) {}
    try { UI = window.UIAnimations || null; } catch(e) {}
    try { Physics = window.PhysicsEngine || null; } catch(e) {}
    try { API = window.ApiClient || null; } catch(e) {}

    try { initSplash(); } catch(e) { console.warn('initSplash err:', e); }
    try { initTheme(); } catch(e) { console.warn('initTheme err:', e); }
    try { initUniverseBg(); } catch(e) { console.warn('initUniverseBg err:', e); }
    try { initAiChatDrag(); } catch(e) { console.warn('initAiChatDrag err:', e); }
    try { initDropZone(); } catch(e) { console.warn('initDropZone err:', e); }
    try { initCropListeners(); } catch(e) { console.warn('initCropListeners err:', e); }

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
        sideNbCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.14';
        aiBoxEl.insertBefore(sideNbCanvas, aiBoxEl.firstChild);
        sideNebula = createNebula(sideNbCanvas);
        if (sideNebula) { sideNebula.init(); sideNebula.render(); }
    }

    window.addEventListener('resize', function () {
        if (chatNebula && chatNebula.resize) chatNebula.resize();
        if (sideNebula && sideNebula.resize) sideNebula.resize();
        R();
        if (selId) { var el = findEl(selId); if (el) showCornerHandles(el); }
        if (cropMode) initCropBox();
    });

    window.addEventListener('orientationchange', function () {
        setTimeout(function () { if (cropMode) initCropBox(); }, 200);
    });

    var rL = document.getElementById('resizeLeft');
    var rB = document.getElementById('resizeBottom');
    var lSb = document.getElementById('leftSidebar');
    var bPn = document.getElementById('bottomPanel');
    if (rL && lSb) {
        rL.addEventListener('mousedown', function (e) { e.preventDefault(); resLOn = true; resLX = e.clientX; resLW = lSb.getBoundingClientRect().width; });
    }
    if (rB && bPn) {
        rB.addEventListener('mousedown', function (e) { e.preventDefault(); resBOn = true; resBY = e.clientY; resBH = bPn.getBoundingClientRect().height; });
    }

    var corners = ['rhNW', 'rhNE', 'rhSW', 'rhSE'];
    for (var ci = 0; ci < corners.length; ci++) {
        (function (cid) {
            var ch = document.getElementById(cid);
            if (ch) {
                ch.addEventListener('mousedown', function (e) { initCornerResize(cid, e); });
                ch.addEventListener('touchstart', function (e) {
                    e.preventDefault();
                    initCornerResize(cid, { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, preventDefault: function () { } });
                }, { passive: false });
            }
        })(corners[ci]);
    }

    document.addEventListener('mousemove', function (e) {
        if (resLOn && lSb) {
            var nw = Math.max(160, Math.min(380, resLW + (e.clientX - resLX)));
            lSb.style.width = nw + 'px'; lSb.style.minWidth = nw + 'px'; lSb.style.maxWidth = nw + 'px';
        }
        if (resBOn && bPn) {
            var nh = Math.max(44, Math.min(window.innerHeight * 0.6, resBH - (e.clientY - resBY)));
            bPn.style.height = nh + 'px';
        }
        if (cornerDrag) handleCornerDrag(e.clientX, e.clientY);
    });

    document.addEventListener('mousemove', handleMobResize);
    document.addEventListener('touchmove', handleMobResize, { passive: false });
    document.addEventListener('touchmove', function (e) {
        if (cornerDrag) { e.preventDefault(); handleCornerDrag(e.touches[0].clientX, e.touches[0].clientY); }
    }, { passive: false });

    document.addEventListener('mouseup', function () {
        if (resLOn) resLOn = false;
        if (resBOn) resBOn = false;
        if (cornerDrag) { cornerDrag = null; sH('Resize'); }
        mobResizing = false;
    });
    document.addEventListener('touchend', function () {
        if (cornerDrag) { cornerDrag = null; sH('Resize'); }
        mobResizing = false;
    });

    function handleCornerDrag(cx, cy) {
        var el = findEl(selId);
        if (!el) return;
        var dx = cx - cornerStartX, dy = cy - cornerStartY;
        var delta = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDrag.indexOf('NW') >= 0 || cornerDrag.indexOf('SW') >= 0) delta = dx < 0 ? delta : -delta;
        else delta = dx > 0 ? delta : -delta;
        if (el.type === 'text' && el.fontSize) el.fontSize = Math.max(12, Math.min(300, Math.round(cornerStartFontSize + delta * 0.5)));
        el.scale = Math.max(12, Math.min(320, Math.round(cornerStartScale + delta * 0.35)));
        R(); showCornerHandles(el); sUI();
    }

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
        if ((e.key === 'Delete' || e.key === 'Backspace') && selId) { e.preventDefault(); layerOp('del'); }
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); triggerUndo(); }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') { e.preventDefault(); triggerRedo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); if (selId) layerOp('dup'); }
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); openExport(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); addText(); }
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

    ['txtIn', 'mobTxtIn'].forEach(function (id4) {
        var inp = document.getElementById(id4);
        if (!inp) return;
        inp.addEventListener('focus', function () {
            var el = findEl(selId);
            if (!el || el.type !== 'text') { addText(); inp.value = ''; inp.focus(); }
        });
    });

    canvas.addEventListener('click', function () { if (document.body.classList.contains('sheet-open')) closeBottomSheet(); });
    canvas.addEventListener('touchstart', function () { if (document.body.classList.contains('sheet-open')) closeBottomSheet(); }, { passive: true });

    var eq = document.getElementById('exportQuality');
    if (eq) {
        eq.addEventListener('input', function () {
            var v = document.getElementById('exportQualityVal');
            if (v) v.textContent = this.value + '%';
        });
    }

    try { setupC(1280, 720); } catch(e) { console.warn('setupC err:', e); }
    try { updateCanvasInfo(); } catch(e) { console.warn('updateCanvasInfo err:', e); }
    try { sH('Init'); } catch(e) { console.warn('sH Init err:', e); }
    try { if (window.lucide) lucide.createIcons(); } catch(e) { console.warn('Lucide createIcons err:', e); }
    console.log('Arjona AI Studio Ready — All Features Loaded (Cleaned & Live Server Bulletproof)');
});

/* ===== DOUBLE TAP TEXT / ELEMENT → OPEN TYPE OR MOVE BAR ===== */
var lastTapTime = 0, lastTapX = 0, lastTapY = 0;
document.addEventListener('DOMContentLoaded', function () {
    var cv = document.getElementById('mainCanvas');
    if (!cv) return;
    cv.addEventListener('touchend', function (e) {
        var now = Date.now();
        var touch = e.changedTouches[0];
        var pt = touchToCanvas(touch);
        if (now - lastTapTime < 300 && Math.abs(pt.x - lastTapX) < 35 && Math.abs(pt.y - lastTapY) < 35) {
            var hit = null;
            for (var i = els.length - 1; i >= 0; i--) { if (hitEl(els[i], pt.x, pt.y)) { hit = els[i]; break; } }
            if (hit && hit.type === 'text') {
                selId = hit.id; if(typeof sUI === 'function') sUI();
                var di = document.getElementById('txtIn');
                if (di) di.value = hit.text || '';
                if (window.innerWidth <= 900) {
                    if (typeof selectBottomTab === 'function') selectBottomTab('type');
                    if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'typography', label: 'Typography', requiresSelection: false }, 'Type');
                    setTimeout(function () {
                        var inp = document.querySelector('.mob-tool-editor .text-input-field');
                        if (inp) { inp.value = hit.text || ''; inp.focus(); inp.select(); }
                    }, 150);
                } else {
                    var textTab = document.querySelector('[data-p="bpText"]');
                    if (textTab) bpTab(textTab);
                    setTimeout(function () { if (di) { di.focus(); di.select(); } }, 200);
                }
            } else if (hit && hit.type === 'image') {
                selId = hit.id; if(typeof sUI === 'function') sUI(); if(typeof showCornerHandles === 'function') showCornerHandles(hit);
                if (window.innerWidth <= 900) {
                    if (typeof selectBottomTab === 'function') selectBottomTab('move');
                    if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'scale', label: 'Scale', requiresSelection: false }, 'Move');
                } else {
                    var transTab = document.querySelector('[data-p="bpTrans"]');
                    if (transTab) bpTab(transTab);
                }
            }
            lastTapTime = 0;
        } else {
            lastTapTime = now; lastTapX = pt.x; lastTapY = pt.y;
        }
    }, { passive: true });

    cv.addEventListener('dblclick', function (e) {
        var pt = gCC(e);
        var hit = null;
        for (var i = els.length - 1; i >= 0; i--) { if (hitEl(els[i], pt.x, pt.y)) { hit = els[i]; break; } }
        if (hit && hit.type === 'text') {
            selId = hit.id; if(typeof sUI === 'function') sUI();
            var di = document.getElementById('txtIn');
            if (di) di.value = hit.text || '';
            if (window.innerWidth <= 900) {
                if (typeof selectBottomTab === 'function') selectBottomTab('type');
                if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'typography', label: 'Typography', requiresSelection: false }, 'Type');
                setTimeout(function () {
                    var inp = document.querySelector('.mob-tool-editor .text-input-field');
                    if (inp) { inp.value = hit.text || ''; inp.focus(); inp.select(); }
                }, 150);
            } else {
                var textTab = document.querySelector('[data-p="bpText"]');
                if (textTab) bpTab(textTab);
                setTimeout(function () { if (di) { di.focus(); di.select(); } }, 200);
            }
        } else if (hit && hit.type === 'image') {
            selId = hit.id; if(typeof sUI === 'function') sUI(); if(typeof showCornerHandles === 'function') showCornerHandles(hit);
            if (window.innerWidth <= 900) {
                if (typeof selectBottomTab === 'function') selectBottomTab('move');
                if (typeof openMobToolEditor === 'function') openMobToolEditor({ id: 'scale', label: 'Scale', requiresSelection: false }, 'Move');
            } else {
                var transTab = document.querySelector('[data-p="bpTrans"]');
                if (transTab) bpTab(transTab);
            }
        }
    });
});
/* ===== SERVICE WORKER UPDATE CHECK ===== */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (confirm('New update available! Reload to update?')) window.location.reload();
    });
}

/* ============================================================================
   NEW MOBILE BOTTOM PANEL SYSTEM CONTROLLER
   Replaces old sliding sheets while preserving 100% of underlying app functions
   ============================================================================ */

var currentMobTab = "move";
var currentMobSubCategory = null;
var currentMobEditorOption = null;
var currentMobCategoryTitle = "Settings";

var mobTabDefinitions = {
    type: {
        title: "Type",
        options: [
            { id: "move_position", label: "Position" },
            { id: "pos_abs_rel", label: "Abs/Rel Pos" },
            { id: "advanced_align", label: "Align", isDirectAction: false },
            { id: "typography", label: "Typography" },
            { id: "color_style", label: "Colour" },
            { id: "text_bg_style", label: "BG & Shadow" },
            { id: "text_effects", label: "Text effects" },
            { id: "effects", label: "Effects" },
            { id: "opacity", label: "Opacity" },
            { id: "reflection", label: "Reflection" },
            { id: "emboss", label: "Emboss" }
        ]
    },
    image: {
        title: "Image",
        options: [
            { id: "move_position", label: "Position" },
            { id: "pos_abs_rel", label: "Abs/Rel Pos" },
            { id: "advanced_align", label: "Align", isDirectAction: false },
            { id: "img_manual_bg_remove", label: "BG Remove & Cut" },
            { id: "grading", label: "Grading", requiresSelection: true },
            { id: "effects", label: "Effects" },
            { id: "pixart", label: "PIXART", requiresSelection: true },
            { id: "presets", label: "Presets", requiresSelection: true },
            { id: "scale_rotate", label: "Scale & Rotate" },
            { id: "opacity", label: "Opacity" },
            { id: "reflection", label: "Reflection" },
            { id: "emboss", label: "Emboss" },
            { id: "crop", label: "Crop", isDirectAction: false, excludeConfirm: true, requiresSelection: true }
        ]
    },
    mask: {
        title: "Mask",
        options: [
            { id: "mask_brush", label: "Mask & Erase" },
            { id: "restore_mask", label: "Restore Mask", isDirectAction: false },
            { id: "ai_remove", label: "AI Remove", isDirectAction: false }
        ]
    },
    library: {
        title: "Library",
        isHierarchical: true,
        primaryCategories: [
            { id: "lib_layers", label: "Layers" },
            { id: "lib_align", label: "Align" },
            { id: "lib_bg", label: "Background" }
        ],
        secondaryOptions: {
            lib_layers: [
                { id: "upload", label: "Upload", isDirectAction: true },
                { id: "front", label: "Front", isDirectAction: true },
                { id: "back", label: "Back", isDirectAction: true },
                { id: "dup", label: "Dup", isDirectAction: true },
                { id: "panel", label: "Panel", isDirectAction: false }
            ],
            lib_align: [
                { id: "left", label: "Left", isDirectAction: true },
                { id: "center", label: "Center", isDirectAction: true },
                { id: "right", label: "Right", isDirectAction: true },
                { id: "middle", label: "Middle", isDirectAction: true }
            ],
            lib_bg: [
                { id: "gradient", label: "Gradiant", isDirectAction: false },
                { id: "grid", label: "Grid", isDirectAction: false },
                { id: "templates", label: "Templates", isDirectAction: false, excludeConfirm: true },
                { id: "projects", label: "Projects", isDirectAction: true }
            ]
        }
    },
    more: {
        title: "More",
        isHierarchical: true,
        primaryCategories: [
            { id: "more_quick", label: "Quick tools" },
            { id: "more_creative", label: "Creative" },
            { id: "more_shapes", label: "Shapes" },
            { id: "more_ai", label: "AI & Utility" }
        ],
        secondaryOptions: {
            more_quick: [
                { id: "crop", label: "Crop", isDirectAction: false, excludeConfirm: true, requiresSelection: true },
                { id: "draw", label: "Draw", isDirectAction: false },
                { id: "flip", label: "Flip", isDirectAction: true },
                { id: "more_text", label: "Text", isDirectAction: true },
                { id: "upload", label: "Upload", isDirectAction: true },
                { id: "export", label: "Export", isDirectAction: true }
            ],
            more_creative: [
                { id: "stickers", label: "Stickers", isDirectAction: false },
                { id: "frames", label: "Frames", isDirectAction: false },
                { id: "gradient", label: "Gradiant", isDirectAction: false },
                { id: "collage", label: "Collage", isDirectAction: false },
                { id: "mark", label: "Mark", isDirectAction: false },
                { id: "qr", label: "QR Code", isDirectAction: false }
            ],
            more_shapes: [
                { id: "shape_rect", label: "Rectangle", isDirectAction: false },
                { id: "shape_circle", label: "Circle", isDirectAction: false },
                { id: "shape_tri", label: "Triangle", isDirectAction: false },
                { id: "shape_star", label: "Star", isDirectAction: false },
                { id: "shape_arrow", label: "Arrow", isDirectAction: false },
                { id: "shape_heart", label: "Heart", isDirectAction: false }
            ],
            more_ai: [
                { id: "enhance", label: "Enhance", isDirectAction: false },
                { id: "remove", label: "Remove", isDirectAction: false },
                { id: "templates_lib", label: "Tpits", isDirectAction: false, excludeConfirm: true },
                { id: "layers_lib", label: "Layers", isDirectAction: false },
                { id: "pick", label: "Pick Color", isDirectAction: false },
                { id: "grid_lib", label: "Grid", isDirectAction: false },
                { id: "smart_bg", label: "Smart BG", isDirectAction: false },
                { id: "color_bg", label: "Color BG", isDirectAction: false }
            ]
        }
    }
};

window.addEventListener("DOMContentLoaded", function() {
    selectBottomTab("move");
});

function selectBottomTab(tabId, btnElement, isAutoDynamic) {
    currentMobTab = tabId;
    if (!isAutoDynamic) {
        currentMobSubCategory = null;
        closeMobToolEditor();
    }

    var btns = document.querySelectorAll(".mob-bar-btn");
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].getAttribute("data-tab") === tabId) {
            btns[i].classList.add("active");
        } else {
            btns[i].classList.remove("active");
        }
    }
    renderToolRowBar();
}

function getMobToolSign(id, label) {
    var s = 'viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none" style="flex-shrink:0; margin-bottom:1px;"';
    if (id === 'image' || id === 'Image') return `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    if (id === 'advanced_align' || id === 'Align') return `<svg ${s}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
    if (id === 'pos_abs_rel') return `<svg ${s}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="12"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`;
    if (id === 'text_bg_style') return `<svg ${s}><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 15h10M12 9v6"/></svg>`;
    if (id === 'img_manual_bg_remove') return `<svg ${s}><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h4"/><path d="M18 12h4"/><circle cx="8" cy="10" r="2"/></svg>`;
    if (id === 'scale_rotate') return `<svg ${s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><path d="M21 12a9 9 0 1 1-9-9"/></svg>`;
    if (id === 'move_position' || id === 'Position') return `<svg ${s}><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="19 9 22 12 19 15"/><polyline points="9 19 12 22 15 19"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`;
    if (id === 'color_style' || id === 'Colour') return `<svg ${s}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    if (id === 'scale') return `<svg ${s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/></svg>`;
    if (id === 'rotate') return `<svg ${s}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    if (id === 'opacity') return `<svg ${s}><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" fill-opacity="0.3"/></svg>`;
    if (id === 'typography' || id === 'more_text') return `<svg ${s}><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`;
    if (id === 'text_effects') return `<svg ${s}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M12 3v13"/><path d="m8 12 4 4 4-4"/><circle cx="18" cy="5" r="1"/><circle cx="6" cy="5" r="1"/></svg>`;
    if (id === 'effects') return `<svg ${s}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="m17.8 11.8 1.4 1.4"/><path d="m10.6 4.6 1.4 1.4"/><path d="M11 11 3 19"/></svg>`;
    if (id === 'emboss') return `<svg ${s}><rect x="4" y="4" width="16" height="16" rx="2" stroke-width="2"/><path d="M8 8h8v8H8z" fill="currentColor" fill-opacity="0.2"/><path d="M4 20l4-4"/><path d="M20 4l-4 4"/></svg>`;
    if (id === 'reflection') return `<svg ${s}><path d="M12 3v18"/><path d="M16 7l-4-4-4 4"/><path d="M8 17l4 4 4-4"/><path d="M3 12h18" stroke-dasharray="2 2"/></svg>`;
    if (id === 'mask_brush') return `<svg ${s}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`;
    if (id === 'restore_mask') return `<svg ${s}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
    if (id === 'ai_remove' || id === 'remove') return `<svg ${s}><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>`;
    if (id === 'grading') return `<svg ${s}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>`;
    if (id === 'pixart') return `<svg ${s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
    if (id === 'presets') return `<svg ${s}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`;
    if (id === 'lib_layers' || id === 'layers_lib' || id === 'panel') return `<svg ${s}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`;
    if (id === 'lib_align') return `<svg ${s}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>`;
    if (id === 'lib_bg' || id === 'color_bg' || id === 'gradient') return `<svg ${s}><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z"/></svg>`;
    if (id === 'upload') return `<svg ${s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    if (id === 'front') return `<svg ${s}><polyline points="18 15 12 9 6 15"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`;
    if (id === 'back') return `<svg ${s}><polyline points="6 9 12 15 18 9"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
    if (id === 'dup') return `<svg ${s}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    if (id === 'left') return `<svg ${s}><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>`;
    if (id === 'center') return `<svg ${s}><line x1="18" y1="6" x2="6" y2="6"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="18" y1="18" x2="6" y2="18"/></svg>`;
    if (id === 'right') return `<svg ${s}><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>`;
    if (id === 'middle') return `<svg ${s}><line x1="12" y1="2" x2="12" y2="22"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
    if (id === 'grid' || id === 'grid_lib') return `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>`;
    if (id === 'templates' || id === 'templates_lib' || id === 'tpits') return `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`;
    if (id === 'projects') return `<svg ${s}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    if (id === 'more_quick') return `<svg ${s}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    if (id === 'more_creative') return `<svg ${s}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
    if (id === 'more_shapes') return `<svg ${s}><path d="M3 12h6v6H3z"/><circle cx="18" cy="6" r="3"/><polygon points="15,20 21,20 18,14"/></svg>`;
    if (id === 'more_ai') return `<svg ${s}><path d="m12 3-1.91 5.82A2 2 0 0 1 8.82 10.09L3 12l5.82 1.91a2 2 0 0 1 1.27 1.27L12 21l1.91-5.82a2 2 0 0 1 1.27-1.27L21 12l-5.82-1.91a2 2 0 0 1-1.27-1.27Z"/></svg>`;
    if (id === 'crop') return `<svg ${s}><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>`;
    if (id === 'draw') return `<svg ${s}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
    if (id === 'flip') return `<svg ${s}><path d="M17 4l4 4-4 4"/><path d="M7 20l-4-4 4-4"/><line x1="12" y1="2" x2="12" y2="22" stroke-dasharray="2 2"/></svg>`;
    if (id === 'export') return `<svg ${s}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
    if (id === 'stickers') return `<svg ${s}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
    if (id === 'frames') return `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10"/></svg>`;
    if (id === 'collage') return `<svg ${s}><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="12" y1="12" x2="21" y2="12"/></svg>`;
    if (id === 'mark') return `<svg ${s}><path d="M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><circle cx="12" cy="12" r="10"/></svg>`;
    if (id === 'qr') return `<svg ${s}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="5" y="5" width="3" height="3" fill="currentColor"/><rect x="16" y="5" width="3" height="3" fill="currentColor"/><rect x="16" y="16" width="3" height="3" fill="currentColor"/><rect x="3" y="14" width="3" height="3"/><rect x="8" y="18" width="3" height="3"/><rect x="8" y="14" width="2" height="2"/></svg>`;
    if (id === 'shape_rect') return `<svg ${s}><rect x="3" y="5" width="18" height="14" rx="2"/></svg>`;
    if (id === 'shape_circle') return `<svg ${s}><circle cx="12" cy="12" r="9"/></svg>`;
    if (id === 'shape_tri') return `<svg ${s}><polygon points="12,3 2,20 22,20"/></svg>`;
    if (id === 'shape_star') return `<svg ${s}><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;
    if (id === 'shape_arrow' || label === 'Arrow') return `<svg ${s}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    if (id === 'shape_heart') return `<svg ${s}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    if (id === 'enhance') return `<svg ${s}><path d="m13 2-2 10h9L7 22l2-10H0L13 2Z"/></svg>`;
    if (id === 'pick' || label === 'Pick Color') return `<svg ${s}><path d="m14 4 6 6"/><path d="m4 20 6-6"/><path d="M19.1 8.9 15.1 4.9a2 2 0 0 0-2.8 0L9.5 7.7a2 2 0 0 0 0 2.8l4 4a2 2 0 0 0 2.8 0l2.8-2.8a2 2 0 0 0 0-2.8Z"/><path d="m4 20 2-2"/></svg>`;
    if (id === 'smart_bg') return `<svg ${s}><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h4"/><path d="M18 12h4"/><path d="M18 16h4"/><circle cx="8" cy="10" r="2"/><path d="M4 17c0-2.2 1.8-4 4-4s4 1.8 4 4"/></svg>`;
    return `<svg ${s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`;
}

function renderToolRowBar() {
    var rowEl = document.getElementById("toolRowBar");
    if (!rowEl) return;
    rowEl.innerHTML = "";
    var def = mobTabDefinitions[currentMobTab];
    if (!def) return;

    if (def.isHierarchical) {
        if (!currentMobSubCategory) {
            def.primaryCategories.forEach(function(cat) {
                var btn = document.createElement("button");
                btn.className = "tool-raw-btn";
                btn.innerHTML = getMobToolSign(cat.id, cat.label) + '<span style="font-size:10px; font-weight:600; line-height:1.1; white-space:nowrap;">' + cat.label + '</span>';
                btn.onclick = function() {
                    currentMobSubCategory = cat.id;
                    renderToolRowBar();
                };
                rowEl.appendChild(btn);
            });
        } else {
            var subList = def.secondaryOptions[currentMobSubCategory] || [];
            var primaryObj = def.primaryCategories.find(function(c) { return c.id === currentMobSubCategory; });
            var primaryLabel = primaryObj ? primaryObj.label : "Back";

            var backBtn = document.createElement("button");
            backBtn.className = "tool-raw-btn secondary-back";
            backBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2.2" fill="none" style="flex-shrink:0; margin-bottom:1px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg><span style="font-size:10px; font-weight:700; line-height:1.1; white-space:nowrap;">' + primaryLabel + '</span>';
            backBtn.onclick = function() {
                currentMobSubCategory = null;
                closeMobToolEditor();
                renderToolRowBar();
            };
            rowEl.appendChild(backBtn);

            subList.forEach(function(opt) {
                var btn = document.createElement("button");
                btn.className = "tool-raw-btn";
                btn.innerHTML = getMobToolSign(opt.id, opt.label) + '<span style="font-size:10px; font-weight:600; line-height:1.1; white-space:nowrap;">' + opt.label + '</span>';
                if (currentMobEditorOption && currentMobEditorOption.id === opt.id) btn.classList.add("active");
                btn.onclick = function() {
                    var allRowBtns = rowEl.querySelectorAll(".tool-raw-btn");
                    for(var j=0; j<allRowBtns.length; j++) allRowBtns[j].classList.remove("active");
                    btn.classList.add("active");

                    if (opt.isDirectAction) {
                        handleDirectMobAction(opt.id);
                    } else {
                        openMobToolEditor(opt, primaryLabel);
                    }
                };
                rowEl.appendChild(btn);
            });
        }
    } else {
        def.options.forEach(function(opt) {
            var btn = document.createElement("button");
            btn.className = "tool-raw-btn";
            btn.innerHTML = getMobToolSign(opt.id, opt.label) + '<span style="font-size:10px; font-weight:600; line-height:1.1; white-space:nowrap;">' + opt.label + '</span>';
            if (currentMobEditorOption && currentMobEditorOption.id === opt.id) btn.classList.add("active");
            btn.onclick = function() {
                var allRowBtns = rowEl.querySelectorAll(".tool-raw-btn");
                for(var j=0; j<allRowBtns.length; j++) allRowBtns[j].classList.remove("active");
                btn.classList.add("active");

                if (opt.isDirectAction) {
                    handleDirectMobAction(opt.id);
                } else {
                    openMobToolEditor(opt, def.title);
                }
            };
            rowEl.appendChild(btn);
        });
    }
}
function handleDirectMobAction(actionId) {
    if (actionId === "upload") { var f = document.getElementById('qImg'); if (f) f.click(); }
    else if (actionId === "front") { if (typeof layerOp === 'function') layerOp('front'); }
    else if (actionId === "back") { if (typeof layerOp === 'function') layerOp('back'); }
    else if (actionId === "dup") { if (typeof layerOp === 'function') layerOp('dup'); }
    else if (actionId === "left") { if (typeof alignEl === 'function') alignEl('l'); }
    else if (actionId === "center") { if (typeof alignEl === 'function') alignEl('c'); }
    else if (actionId === "right") { if (typeof alignEl === 'function') alignEl('r'); }
    else if (actionId === "middle") { if (typeof alignEl === 'function') alignEl('m'); }
    else if (actionId === "flip") { if (typeof flipH === 'function') flipH(); }
    else if (actionId === "more_text") { if (typeof addText === 'function') addText(); }
    else if (actionId === "export") { if (typeof openExport === 'function') openExport(); }
    else if (actionId === "projects") { if (typeof openProjects === 'function') openProjects(); }
}

function openMobToolEditor(optionObj, categoryTitle) {
    currentMobEditorOption = optionObj;
    currentMobCategoryTitle = categoryTitle || "Settings";
    var panel = document.getElementById("mobToolEditor");
    var confirmGroup = document.getElementById("mobEditorConfirmGroup");
    var bodyEl = document.getElementById("mobEditorBody");
    if (!panel || !bodyEl) return;

    if (optionObj.id === "crop" || optionObj.id === "templates" || optionObj.id === "templates_lib" || optionObj.excludeConfirm) {
        if (confirmGroup) confirmGroup.style.display = "none";
    } else {
        if (confirmGroup) confirmGroup.style.display = "flex";
    }

    bodyEl.innerHTML = "";
    renderMobEditorControls(optionObj, bodyEl);

    panel.classList.add("open");
}

function closeMobToolEditor() {
    var panel = document.getElementById("mobToolEditor");
    if (panel) panel.classList.remove("open");
    currentMobEditorOption = null;

    var rowBtns = document.querySelectorAll(".tool-raw-btn");
    for(var j=0; j<rowBtns.length; j++) rowBtns[j].classList.remove("active");
}

function confirmMobToolEditor() {
    closeMobToolEditor();
}

function cancelMobToolEditor() {
    closeMobToolEditor();
}

function checkMobSelectionOrBanner(opt, container) {
    if (!opt.requiresSelection) return true;
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el && typeof els !== 'undefined' && els.length > 0 && typeof selId !== 'undefined' && selId) {
        for (var i=0; i<els.length; i++) { if (els[i].id === selId) { el = els[i]; break; } }
    }
    if (!el) {
        var hasItems = typeof els !== 'undefined' && els.length > 0;
        var banner = document.createElement("div");
        banner.id = "mobUnselectedBanner";
        banner.style.cssText = "background:rgba(255,61,113,0.15); border:1px solid rgba(255,61,113,0.4); border-radius:8px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0; margin-bottom:4px;";
        banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:16px;">⚠️</span>
                <div>
                    <div style="font-size:11px; font-weight:700; color:#FF3D71;">Things are not selected.</div>
                    <div style="font-size:9px; color:var(--tx2);">Please select an item on canvas or add one.</div>
                </div>
            </div>
            <button class="editor-back-btn" style="width:auto; height:26px; padding:0 8px; background:var(--ac); color:#fff; font-size:10px; font-weight:700; border:none; flex-shrink:0;" onclick="if(typeof els !== 'undefined' && els.length > 0) { selId = els[els.length-1].id; if(typeof sUI==='function') sUI(); if(typeof R==='function') R(); openMobToolEditor(currentMobEditorOption, currentMobCategoryTitle); } else { var f = document.getElementById('qImg'); if (f) f.click(); else if(typeof addText==='function') { addText(); openMobToolEditor(currentMobEditorOption, currentMobCategoryTitle); } }">${hasItems ? 'Select Top Item' : '+ Add Item'}</button>
        `;
        container.appendChild(banner);
        return false;
    }
    return true;
}

function renderMobEditorControls(opt, container) {
    var hasSelection = checkMobSelectionOrBanner(opt, container);

    if (opt.id === "advanced_align" || opt.id === "lib_align") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:var(--bd); border:1px solid var(--bd2); border-radius:8px; padding:6px 10px; font-size:11px; font-weight:700; color:var(--tx1); display:flex; justify-content:space-between; align-items:center;">
                <span>Advanced Alignment &amp; Distribution</span>
                <span style="font-size:9px; color:var(--ac);">Tap to align</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:6px;">
                <button class="editor-back-btn" style="height:32px; font-size:11px; justify-content:center;" onclick="if(typeof alignEl==='function') alignEl('l');">⬅️ Left</button>
                <button class="editor-back-btn" style="height:32px; font-size:11px; justify-content:center;" onclick="if(typeof alignEl==='function') alignEl('c');">🎯 Center</button>
                <button class="editor-back-btn" style="height:32px; font-size:11px; justify-content:center;" onclick="if(typeof alignEl==='function') alignEl('r');">➡️ Right</button>
                <button class="editor-back-btn" style="height:32px; font-size:11px; justify-content:center;" onclick="if(typeof alignEl==='function') alignEl('m');">🔂 Middle</button>
            </div>
            <div style="display:flex; gap:6px; margin-top:2px;">
                <button class="btn-action-primary" style="flex:1; background:var(--bd2); color:var(--tx1); font-size:11px; padding:6px;" onclick="if(typeof alignEl==='function') alignEl('t');">⬆️ Top</button>
                <button class="btn-action-primary" style="flex:1; background:var(--bd2); color:var(--tx1); font-size:11px; padding:6px;" onclick="if(typeof alignEl==='function') alignEl('b');">⬇️ Bottom</button>
                <button class="btn-action-primary" style="flex:1; background:var(--ac); color:#fff; font-size:11px; padding:6px;" onclick="if(typeof alignBetweenLayers === 'function') alignBetweenLayers('h');" title="Distribute horizontal gap evenly between layers">↔️ Between (H)</button>
                <button class="btn-action-primary" style="flex:1; background:var(--ac); color:#fff; font-size:11px; padding:6px;" onclick="if(typeof alignBetweenLayers === 'function') alignBetweenLayers('v');" title="Distribute vertical gap evenly between layers">↕️ Between (V)</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "pos_abs_rel") {
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        var curX = el ? Math.round(el.x) : 0, curY = el ? Math.round(el.y) : 0;
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; gap:6px; background:var(--bd); padding:4px; border-radius:8px; border:1px solid var(--bd2);">
                <button class="editor-back-btn active-pos-tab" id="posTabAbsBtn" style="flex:1; height:28px; background:var(--ac); color:#fff; font-weight:700;" onclick="switchPosAbsRelTab('abs')">📍 Absolute Coordinates</button>
                <button class="editor-back-btn" id="posTabRelBtn" style="flex:1; height:28px; background:transparent; color:var(--tx2); font-weight:600;" onclick="switchPosAbsRelTab('rel')">📐 Relative Nudge &amp; Jump</button>
            </div>
            
            <!-- Absolute Section -->
            <div id="posAbsSection" style="display:flex; flex-direction:column; gap:6px;">
                <div style="display:flex; gap:8px;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:10px; font-weight:700; color:var(--tx1);">Absolute X (px):</label>
                        <input type="number" class="text-input-field" value="${curX}" oninput="if(typeof setAbsolutePos === 'function') setAbsolutePos('x', this.value);">
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:10px; font-weight:700; color:var(--tx1);">Absolute Y (px):</label>
                        <input type="number" class="text-input-field" value="${curY}" oninput="if(typeof setAbsolutePos === 'function') setAbsolutePos('y', this.value);">
                    </div>
                </div>
                <div class="sheet-sld">
                    <div class="sheet-sld-head"><label>Scale &amp; Rotation</label><span>${Math.round(el?.scale||100)}% · ${Math.round(el?.rotate||0)}°</span></div>
                    <div style="display:flex; gap:6px;">
                        <input type="range" min="10" max="300" value="${Math.round(el?.scale||100)}" oninput="if(typeof setProp==='function') setProp('scale', this.value);" title="Scale">
                        <input type="range" min="0" max="360" value="${Math.round(el?.rotate||0)}" oninput="if(typeof setProp==='function') setProp('rotate', this.value);" title="Rotate">
                    </div>
                </div>
            </div>

            <!-- Relative Section -->
            <div id="posRelSection" style="display:none; flex-direction:column; gap:6px;">
                <div style="display:flex; gap:6px; justify-content:space-between; align-items:center; font-size:11px;">
                    <span style="font-weight:700;">Relative Jump Presets:</span>
                </div>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;">
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('nw')">↖️ Top-Left</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px; background:var(--ac); color:#fff; font-weight:700;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('center')">🎯 Exact Center</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('ne')">↗️ Top-Right</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('sw')">↙️ Bottom-Left</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('mid_y')">↕️ Center Y</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="if(typeof jumpRelativePos==='function') jumpRelativePos('se')">↘️ Bottom-Right</button>
                </div>
                <div style="display:flex; gap:6px; margin-top:2px;">
                    <button class="editor-back-btn" style="flex:1; height:28px; font-size:10px;" onclick="nudgeSelectedPos(-10, 0)">⬅️ -10px X</button>
                    <button class="editor-back-btn" style="flex:1; height:28px; font-size:10px;" onclick="nudgeSelectedPos(10, 0)">➡️ +10px X</button>
                    <button class="editor-back-btn" style="flex:1; height:28px; font-size:10px;" onclick="nudgeSelectedPos(0, -10)">⬆️ -10px Y</button>
                    <button class="editor-back-btn" style="flex:1; height:28px; font-size:10px;" onclick="nudgeSelectedPos(0, 10)">⬇️ +10px Y</button>
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "text_bg_style") {
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        var hasBox = el && el.hasBgBox ? true : false;
        var boxCol = el && el.bgBoxColor ? el.bgBoxColor : "#161B22";
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bd); padding:8px 10px; border-radius:8px; border:1px solid var(--bd2);">
                <span style="font-size:11px; font-weight:700; color:var(--tx1);">🏷️ Text Background Card / Box</span>
                <button class="btn-action-primary" style="width:auto; padding:4px 12px; font-size:11px; background:${hasBox ? 'var(--ac)' : 'var(--bd2)'}; color:${hasBox ? '#fff' : 'var(--tx1)'};" onclick="if(typeof toggleTextBoxBg === 'function') toggleTextBoxBg(this)">${hasBox ? 'BOX ON' : 'BOX OFF'}</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Box Color &amp; Opacity</label><span>Style</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="${boxCol}" onchange="if(typeof setTextBoxProp==='function') setTextBoxProp('bgBoxColor', this.value);" style="width:32px; height:24px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="100" value="${el?.bgBoxOpacity || 80}" oninput="if(typeof setTextBoxProp==='function') setTextBoxProp('bgBoxOpacity', parseInt(this.value));" style="flex:1;" title="Box Opacity">
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Corner Radius &amp; Padding</label><span>${el?.bgBoxRadius || 10}px</span></div>
                <div style="display:flex; gap:6px;">
                    <input type="range" min="0" max="50" value="${el?.bgBoxRadius || 10}" oninput="if(typeof setTextBoxProp==='function') setTextBoxProp('bgBoxRadius', parseInt(this.value));" title="Radius">
                    <input type="range" min="4" max="40" value="${el?.bgBoxPadding || 16}" oninput="if(typeof setTextBoxProp==='function') setTextBoxProp('bgBoxPadding', parseInt(this.value));" title="Padding">
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Text &amp; Box Shadow Blur &amp; Offset</label><span>Shadow</span></div>
                <div style="display:flex; gap:6px;">
                    <input type="color" value="${el?.shadowColor || '#000000'}" onchange="if(typeof setTextBoxProp==='function') setTextBoxProp('shadowColor', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="40" value="${el?.shadowBlur || 0}" oninput="if(typeof setTextBoxProp==='function') setTextBoxProp('shadowBlur', parseInt(this.value));" title="Shadow Blur">
                    <input type="range" min="-30" max="30" value="${el?.shadowOffsetX || 0}" oninput="if(typeof setTextBoxProp==='function') setTextBoxProp('shadowOffsetX', parseInt(this.value));" title="Shadow Offset X">
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "img_manual_bg_remove") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:linear-gradient(135deg, rgba(35,134,54,0.2), rgba(88,166,255,0.2)); border:1px solid #48BB78; border-radius:8px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:#48BB78;">Automatic AI &amp; Manual BG Remover</div>
                    <div style="font-size:9px; color:var(--tx2);">Smooth anti-aliased edge cutout</div>
                </div>
                <button class="btn-action-primary" style="width:auto; padding:6px 12px; font-size:11px; background:#238636; color:#fff; border:none;" onclick="if(typeof aiSmartBG==='function') aiSmartBG();">✨ One-Click Cutout</button>
            </div>
            <div style="background:var(--bd); border:1px solid var(--bd2); border-radius:8px; padding:8px 10px; display:flex; flex-direction:column; gap:6px;">
                <div style="font-size:11px; font-weight:700; color:var(--tx1); display:flex; justify-content:space-between; align-items:center;">
                    <span>🎨 Manual Color-Key Cutter (Chroma Key)</span>
                    <button class="btn-action-primary" style="width:auto; padding:4px 10px; font-size:10px; background:var(--ac); color:#fff; border:none;" onclick="if(typeof executeManualColorKeyCutout === 'function') executeManualColorKeyCutout()">✂️ Cut Target Color</button>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <label style="font-size:10px;">Target:</label><input type="color" id="manBgKeyColor" value="#00FF00" style="width:32px; height:24px; border:none; background:transparent; cursor:pointer;">
                    <button class="editor-back-btn" style="height:24px; font-size:10px; padding:0 8px;" onclick="if(typeof toggleEyedropper==='function') toggleEyedropper()">👁️ Pick from image</button>
                </div>
                <div style="display:flex; gap:6px;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:9px; color:var(--tx2);">Tolerance: <span id="val-mk-tol">40%</span></label>
                        <input type="range" id="manBgKeyTol" min="5" max="100" value="40" oninput="document.getElementById('val-mk-tol').innerText=this.value+'%'">
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:9px; color:var(--tx2);">Smooth Edge: <span id="val-mk-sm">15px</span></label>
                        <input type="range" id="manBgKeySmooth" min="0" max="30" value="15" oninput="document.getElementById('val-mk-sm').innerText=this.value+'px'">
                    </div>
                </div>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="editor-back-btn" style="flex:1; height:30px; font-size:11px; background:var(--ac); color:#fff; font-weight:700;" onclick="if(typeof setMode==='function') setMode('eraser', this)">🧹 Brush Erase</button>
                <button class="editor-back-btn" style="flex:1; height:30px; font-size:11px; background:#A371F7; color:#fff; font-weight:700;" onclick="if(typeof setMode==='function') setMode('mask', this)">🟣 Brush Restore</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "scale_rotate") {
        var curSc = 100, curRt = 0;
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        if (el && el.scale) curSc = Math.round(el.scale);
        if (el && el.rotate) curRt = Math.round(el.rotate);
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Scale Amount</label><span id="val-sr-sc">${curSc}%</span></div>
                <input type="range" min="10" max="300" value="${curSc}" oninput="if(typeof setProp==='function') setProp('scale', this.value); var el=document.getElementById('val-sr-sc'); if(el) el.innerText=this.value+'%';">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Rotation Angle</label><span id="val-sr-rt">${curRt}°</span></div>
                <input type="range" min="0" max="360" value="${curRt}" oninput="if(typeof setProp==='function') setProp('rotate', this.value); var el=document.getElementById('val-sr-rt'); if(el) el.innerText=this.value+'°';">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "move_position") {
        var curSc = 100, curRt = 0;
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        if (el && el.scale) curSc = Math.round(el.scale);
        if (el && el.rotate) curRt = Math.round(el.rotate);
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Scale Amount</label><span id="val-mp-sc">${curSc}%</span></div>
                <input type="range" min="10" max="300" value="${curSc}" oninput="if(typeof setProp==='function') setProp('scale', this.value); var el=document.getElementById('val-mp-sc'); if(el) el.innerText=this.value+'%';">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Rotation Angle</label><span id="val-mp-rt">${curRt}°</span></div>
                <input type="range" min="0" max="360" value="${curRt}" oninput="if(typeof setProp==='function') setProp('rotate', this.value); var el=document.getElementById('val-mp-rt'); if(el) el.innerText=this.value+'°';">
            </div>
            <div style="background:var(--bd); border:1px solid var(--bd2); border-radius:8px; padding:6px 10px;">
                <div style="font-size:11px; font-weight:700; color:var(--tx1); margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                    <span>📍 Exact Position Nudge (X: ${Math.round(el ? el.x : 0)}, Y: ${Math.round(el ? el.y : 0)})</span>
                    <span style="font-size:9px; color:var(--ac);">Tap arrows to move</span>
                </div>
                <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                    <button class="editor-back-btn" style="flex:1; width:auto; height:32px; font-size:13px;" onclick="nudgeSelectedPos(-6, 0)" title="Move Left">⬅️ Left</button>
                    <button class="editor-back-btn" style="flex:1; width:auto; height:32px; font-size:13px;" onclick="nudgeSelectedPos(0, -6)" title="Move Up">⬆️ Up</button>
                    <button class="editor-back-btn" style="flex:1; width:auto; height:32px; font-size:13px;" onclick="nudgeSelectedPos(0, 6)" title="Move Down">⬇️ Down</button>
                    <button class="editor-back-btn" style="flex:1; width:auto; height:32px; font-size:13px;" onclick="nudgeSelectedPos(6, 0)" title="Move Right">➡️ Right</button>
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "color_style" || opt.id === "color" || opt.id === "colour") {
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        var curCol = el && el.color ? el.color : "#FFFFFF";
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; background:var(--bd); padding:8px 10px; border-radius:8px; border:1px solid var(--bd2);">
                <div id="mobTxtColorPreview" style="width:36px; height:36px; border-radius:8px; background:${curCol}; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.5);"></div>
                <input type="color" value="${curCol}" onchange="if(typeof setProp==='function') setProp('color', this.value); var el=document.getElementById('mobTxtColorPreview'); if(el) el.style.background=this.value;" style="width:36px; height:36px; border:none; background:transparent; cursor:pointer;" title="Pick Text Color">
                <input type="text" class="text-input-field" value="${curCol}" oninput="if(typeof setProp==='function') setProp('color', this.value); var el=document.getElementById('mobTxtColorPreview'); if(el) el.style.background=this.value;" style="flex:1;">
                <button class="editor-back-btn" style="width:auto; height:32px; padding:0 10px; background:var(--ac); color:#fff; font-weight:700;" onclick="if(typeof toggleEyedropper==='function') toggleEyedropper(); closeMobToolEditor();">👁️ Eyedropper</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Quick Color Swatches</label><span>Tap to apply</span></div>
                <div style="display:flex; gap:8px; align-items:center; overflow-x:auto; padding:4px 0;">
                    <div class="color-swatch" style="background:#FFFFFF; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#FFFFFF'); document.getElementById('mobTxtColorPreview').style.background='#FFFFFF';"></div>
                    <div class="color-swatch" style="background:#58A6FF; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#58A6FF'); document.getElementById('mobTxtColorPreview').style.background='#58A6FF';"></div>
                    <div class="color-swatch" style="background:#A371F7; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#A371F7'); document.getElementById('mobTxtColorPreview').style.background='#A371F7';"></div>
                    <div class="color-swatch" style="background:#238636; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#238636'); document.getElementById('mobTxtColorPreview').style.background='#238636';"></div>
                    <div class="color-swatch" style="background:#FF3D71; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#FF3D71'); document.getElementById('mobTxtColorPreview').style.background='#FF3D71';"></div>
                    <div class="color-swatch" style="background:#D29922; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#D29922'); document.getElementById('mobTxtColorPreview').style.background='#D29922';"></div>
                    <div class="color-swatch" style="background:#00E5A8; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#00E5A8'); document.getElementById('mobTxtColorPreview').style.background='#00E5A8';"></div>
                    <div class="color-swatch" style="background:#000000; width:26px; height:26px;" onclick="if(typeof setProp==='function') setProp('color', '#000000'); document.getElementById('mobTxtColorPreview').style.background='#000000';"></div>
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "scale") {
        var curSc = 100;
        if (hasSelection && typeof findEl === 'function' && selId && findEl(selId) && findEl(selId).scale) curSc = Math.round(findEl(selId).scale);
        var sld = document.createElement("div");
        sld.className = "sheet-sld";
        sld.innerHTML = `
            <div class="sheet-sld-head"><label>Scale</label><span id="val-sc">${curSc}%</span></div>
            <input type="range" min="10" max="300" value="${curSc}" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('scale', this.value); var el=document.getElementById('val-sc'); if(el) el.innerText=this.value+'%';">
        `;
        container.appendChild(sld);
    } else if (opt.id === "rotate") {
        var curRt = 0;
        if (hasSelection && typeof findEl === 'function' && selId && findEl(selId) && findEl(selId).rotate) curRt = Math.round(findEl(selId).rotate);
        var sld = document.createElement("div");
        sld.className = "sheet-sld";
        sld.innerHTML = `
            <div class="sheet-sld-head"><label>Rotate</label><span id="val-rt">${curRt}°</span></div>
            <input type="range" min="0" max="360" value="${curRt}" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('rotate', this.value); var el=document.getElementById('val-rt'); if(el) el.innerText=this.value+'°';">
        `;
        container.appendChild(sld);
    } else if (opt.id === "opacity") {
        var curOp = 100;
        if (hasSelection && typeof findEl === 'function' && selId && findEl(selId) && findEl(selId).opacity !== undefined) curOp = Math.round(findEl(selId).opacity);
        var sld = document.createElement("div");
        sld.className = "sheet-sld";
        sld.innerHTML = `
            <div class="sheet-sld-head"><label>Opacity</label><span id="val-op">${curOp}%</span></div>
            <input type="range" min="0" max="100" value="${curOp}" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('opacity', this.value); var el=document.getElementById('val-op'); if(el) el.innerText=this.value+'%';">
        `;
        container.appendChild(sld);
    } else if (opt.id === "typography") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <input type="text" class="text-input-field" placeholder="Click to add or edit text..." ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setTxt==='function') setTxt(this.value);">
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Font Size</label><span id="val-fs">60px</span></div>
                <input type="range" min="12" max="300" value="60" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('fontSize', this.value); var el=document.getElementById('val-fs'); if(el) el.innerText=this.value+'px';">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Color &amp; Font Style</label><span>Pick</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="#FFFFFF" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} onchange="if(typeof setProp==='function') setProp('color', this.value);" style="width:36px; height:24px; border:none; background:transparent; cursor:pointer;">
                    <select onchange="if(typeof setProp==='function') setProp('font', this.value);" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} class="text-input-field" style="flex:1; padding:4px 8px;">
                        <option value="Arial">Arial</option>
                        <option value="Impact">Impact</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier</option>
                        <option value="Times New Roman">Times</option>
                    </select>
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Spacing &amp; Curve</label><span>0</span></div>
                <div style="display:flex; gap:6px;">
                    <input type="range" min="-5" max="30" value="0" oninput="if(typeof setProp==='function') setProp('charSpacing', this.value);" title="Spacing">
                    <input type="range" min="-180" max="180" value="0" oninput="if(typeof setProp==='function') setProp('curve', this.value);" title="Curve">
                </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:6px; background:var(--bd); padding:8px 10px; border-radius:8px; border:1px solid var(--bd2);">
                <div style="font-size:11px; font-weight:700; color:var(--tx1); display:flex; justify-content:space-between; align-items:center;">
                    <span>✍️ Handwriting &amp; Custom Fonts</span>
                    <span style="font-size:9px; color:var(--ac);">Full System</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button class="editor-back-btn" style="flex:1; width:auto; height:30px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof openHandwritingFontModal==='function') openHandwritingFontModal();">✍️ Signature to Font</button>
                    <button class="editor-back-btn" style="flex:1; width:auto; height:30px; background:var(--bd2); color:var(--tx1);" onclick="var inp = document.getElementById('customFontFileInp'); if (inp) inp.click(); else if(typeof triggerCustomFontUpload === 'function') triggerCustomFontUpload();">📁 Upload external font</button>
                    <button class="editor-back-btn" style="width:34px; height:30px; background:var(--bd2); color:var(--tx1);" onclick="if(typeof downloadCurrentFontFile==='function') downloadCurrentFontFile();" title="Download / Export font file">💾</button>
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "text_effects") {
        var effects = ["Neon", "3D", "Rainbow", "Fire", "Ice", "Chrome", "Gold", "Vintage"];
        var wrap = document.createElement("div");
        wrap.className = "options-grid-compact";
        effects.forEach(function(fx) {
            wrap.innerHTML += `<div class="option-card" ${!hasSelection ? 'style="opacity:0.4; pointer-events:none;"' : ''} onclick="if(typeof applyTextEffect==='function') applyTextEffect('${fx.toLowerCase()}'); selectMobOptionCard(this);"><span>${fx}</span></div>`;
        });
        container.appendChild(wrap);
    } else if (opt.id === "effects") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Stroke</label><span>Color Box</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="#000000" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} onchange="if(typeof setProp==='function') setProp('strokeColor', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="15" value="2" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('stroke', this.value);" style="flex:1;">
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Glow</label><span>Color Box</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="#58A6FF" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} onchange="if(typeof setProp==='function') setProp('glowColor', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="40" value="8" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('glow', this.value);" style="flex:1;">
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>3D Depth</label><span>Color Box</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="#1e293b" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} onchange="if(typeof setProp==='function') setProp('threeDColor', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="25" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('threeDDepth', this.value);" style="flex:1;">
                </div>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Shadow</label><span>Color Box</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="color" value="#000000" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} onchange="if(typeof setProp==='function') setProp('innerShadowColor', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                    <input type="range" min="0" max="20" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('innerShadow', this.value);" style="flex:1;">
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "emboss" || opt.id === "reflection") {
        var propName = opt.id === "emboss" ? "emboss" : "reflection";
        var sld = document.createElement("div");
        sld.className = "sheet-sld";
        sld.innerHTML = `
            <div class="sheet-sld-head"><label>${opt.label} Intensity</label><span>50%</span></div>
            <input type="range" min="0" max="100" value="50" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof setProp==='function') setProp('${propName}', this.value);">
        `;
        container.appendChild(sld);
    } else if (opt.id === "mask_brush") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        var curBSz = typeof bSz !== 'undefined' ? bSz : 25;
        wrap.innerHTML = `
            <div id="activeMaskModeBadge" style="background:var(--bd); border:1px solid var(--bd2); border-radius:6px; padding:6px 10px; font-size:10px; font-weight:700; color:var(--tx1); text-align:center;">
                ${mode === 'eraser' ? '🔵 ACTIVE TOOL: ERASER (Drag on image to erase · Brush: ' + curBSz + 'px)' : (mode === 'mask' ? '🟣 ACTIVE TOOL: MASK (Drag on image to restore · Brush: ' + curBSz + 'px)' : '🟢 ACTIVE TOOL: SELECT (Move & Scale Layers)')}
            </div>
            <div style="display:flex; gap:6px;">
                <button class="editor-back-btn mask-mode-ctrl-btn ${mode === 'select' ? 'active' : ''}" data-mode="select" style="flex:1; width:auto; height:32px; font-weight:700;" onclick="if(typeof setMode==='function') setMode('select', this);">🟢 Select</button>
                <button class="editor-back-btn mask-mode-ctrl-btn ${mode === 'eraser' ? 'active' : ''}" data-mode="eraser" style="flex:1; width:auto; height:32px; font-weight:700; ${mode === 'eraser' ? 'background:var(--ac); color:#fff;' : ''}" onclick="if(typeof setMode==='function') setMode('eraser', this);">🔵 Erase</button>
                <button class="editor-back-btn mask-mode-ctrl-btn ${mode === 'mask' ? 'active' : ''}" data-mode="mask" style="flex:1; width:auto; height:32px; font-weight:700; ${mode === 'mask' ? 'background:#A371F7; color:#fff;' : ''}" onclick="if(typeof setMode==='function') setMode('mask', this);">🟣 Mask / Restore</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Brush Size Ring Preview</label><span id="val-bsz">${curBSz}px</span></div>
                <input type="range" min="5" max="100" value="${curBSz}" oninput="bSz=parseInt(this.value); var el=document.getElementById('val-bsz'); if(el) el.innerText=this.value+'px'; if(typeof updateActiveMaskModeBadge==='function') updateActiveMaskModeBadge();">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "restore_mask") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:var(--bd); border-radius:6px; padding:6px 10px; font-size:11px; color:var(--tx1); display:flex; justify-content:space-between; align-items:center;">
                <span>Restore original image mask</span>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--ac); color:#fff; font-weight:700; border:none; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof restMask==='function') restMask(); closeMobToolEditor();">Restore Mask</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "ai_remove" || opt.id === "remove") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:rgba(255,61,113,0.12); border:1px solid rgba(255,61,113,0.4); border-radius:6px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:var(--dn);">AI Object Remove</div>
                    <div style="font-size:9px; color:var(--tx2);">Erase unwanted objects from selected layer</div>
                </div>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--dn); color:#fff; font-weight:700; border:none; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof aiObjectRemove==='function') aiObjectRemove(); closeMobToolEditor();">🧹 Erase Object</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Eraser Brush Size</label><span>25px</span></div>
                <input type="range" min="5" max="100" value="25" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="if(typeof bSz !== 'undefined') bSz=parseInt(this.value)">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "enhance") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:linear-gradient(135deg, rgba(88,166,255,0.2), rgba(163,113,247,0.2)); border:1px solid var(--ac); border-radius:6px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:var(--tx1);">AI Image Auto Enhance</div>
                    <div style="font-size:9px; color:var(--tx2);">Instantly boosts sharpness, contrast &amp; clarity</div>
                </div>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:linear-gradient(135deg, #58A6FF, #A371F7); color:#fff; font-weight:700; border:none; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof aiAutoEnhance==='function') aiAutoEnhance(); closeMobToolEditor();">⚡ Run Enhance</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Clarity Boost</label><span>80%</span></div>
                <input type="range" min="0" max="100" value="80" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''}>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "smart_bg") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:linear-gradient(135deg, rgba(35,134,54,0.2), rgba(88,166,255,0.2)); border:1px solid #48BB78; border-radius:6px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:#48BB78;">AI Smart Background Remover</div>
                    <div style="font-size:9px; color:var(--tx2);">One-click smart subject extraction &amp; BG cut</div>
                </div>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:#238636; color:#fff; font-weight:700; border:none; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof aiSmartBG==='function') aiSmartBG(); else if(typeof removeBg==='function') removeBg(); closeMobToolEditor();">✨ Cut Background</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Edge Smoothing</label><span>15%</span></div>
                <input type="range" min="0" max="50" value="15" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''}>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "grading") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Brightness</label><span>0</span></div>
                <input type="range" id="mob-sg-br" min="-100" max="100" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="var el=document.getElementById('sg-br'); if(el){el.value=this.value;} if(typeof liveG==='function') liveG();">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Contrast</label><span>0</span></div>
                <input type="range" id="mob-sg-ct" min="-100" max="100" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="var el=document.getElementById('sg-ct'); if(el){el.value=this.value;} if(typeof liveG==='function') liveG();">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Saturation</label><span>0</span></div>
                <input type="range" id="mob-sg-sa" min="-100" max="100" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="var el=document.getElementById('sg-sa'); if(el){el.value=this.value;} if(typeof liveG==='function') liveG();">
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Temperature</label><span>0</span></div>
                <input type="range" id="mob-sg-te" min="-50" max="50" value="0" ${!hasSelection ? 'disabled style="opacity:0.4;"' : ''} oninput="var el=document.getElementById('sg-te'); if(el){el.value=this.value;} if(typeof liveG==='function') liveG();">
            </div>
            <div style="display:flex; gap:6px;">
                <button class="editor-back-btn" style="flex:1; width:auto; height:28px; background:var(--ac); color:#fff; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof applyGrade==='function') applyGrade(); closeMobToolEditor();">Apply Grade</button>
                <button class="editor-back-btn" style="flex:1; width:auto; height:28px; ${!hasSelection ? 'opacity:0.4; pointer-events:none;' : ''}" onclick="if(typeof resetGrade==='function') resetGrade();">Reset</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "pixart") {
        var items = ["Pixel", "Blur", "Sharp", "Gray", "Poster", "Edge", "Noise", "Invert"];
        var wrap = document.createElement("div");
        wrap.className = "options-grid-compact";
        items.forEach(function(item) {
            wrap.innerHTML += `<div class="option-card" ${!hasSelection ? 'style="opacity:0.4; pointer-events:none;"' : ''} onclick="if(typeof selectMobOptionCard==='function') selectMobOptionCard(this); if('${item}'==='Pixel') {if(typeof pixelate==='function') pixelate(10);} else if('${item}'==='Blur') {if(typeof applyBlur==='function') applyBlur(4);} else if('${item}'==='Sharp') {if(typeof applySharpen==='function') applySharpen();} else if('${item}'==='Gray') {if(typeof grayscale==='function') grayscale();} else if('${item}'==='Poster') {if(typeof posterize==='function') posterize(4);} else if('${item}'==='Edge') {if(typeof edgeDetect==='function') edgeDetect();} else if('${item}'==='Noise') {if(typeof applyNoise==='function') applyNoise(25);} else if('${item}'==='Invert') {if(typeof invertColors==='function') invertColors();}"><span>${item}</span></div>`;
        });
        container.appendChild(wrap);
    } else if (opt.id === "presets") {
        var presets = ["cinematic", "vintage", "warm", "cool", "noir", "neon", "golden", "hdr"];
        var wrap = document.createElement("div");
        wrap.className = "options-grid-compact";
        presets.forEach(function(p) {
            wrap.innerHTML += `<div class="option-card" ${!hasSelection ? 'style="opacity:0.4; pointer-events:none;"' : ''} onclick="if(typeof gradeP==='function') gradeP('${p}'); if(typeof selectMobOptionCard==='function') selectMobOptionCard(this);"><span>${p.toUpperCase()}</span></div>`;
        });
        container.appendChild(wrap);
    } else if (opt.id === "qr") {
        // QR Code generator: works regardless of selection!
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" id="mobQrInput" class="text-input-field" placeholder="Enter URL or text for QR code..." value="https://arjona.ai" style="flex:1;">
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="generateMobQRCode()">Generate QR</button>
            </div>
            <div style="display:flex; gap:12px; align-items:center; font-size:11px; color:var(--tx2);">
                <div style="display:flex; align-items:center; gap:4px;"><label>FG:</label><input type="color" id="mobQrFg" value="#000000" style="width:24px; height:22px; border:none; background:transparent; cursor:pointer;"></div>
                <div style="display:flex; align-items:center; gap:4px;"><label>BG:</label><input type="color" id="mobQrBg" value="#ffffff" style="width:24px; height:22px; border:none; background:transparent; cursor:pointer;"></div>
                <span style="font-size:10px; color:var(--tx3);">Creates &amp; adds QR directly to canvas</span>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "mark") {
        // Watermark / Mark generator: works regardless of selection!
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; gap:6px; align-items:center;">
                <input type="text" id="mobMarkInput" class="text-input-field" placeholder="Watermark text (e.g. © Arjona AI)..." value="© Arjona AI" style="flex:1;">
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="addMobWatermark()">Add Mark</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Opacity &amp; Color</label><span id="val-mop">50%</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="range" id="mobMarkOp" min="10" max="100" value="50" oninput="var el=document.getElementById('val-mop'); if(el) el.innerText=this.value+'%';" style="flex:1;">
                    <input type="color" id="mobMarkCol" value="#ffffff" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "pick") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div id="mobPickPreview" style="width:32px; height:32px; border-radius:6px; background:#58A6FF; border:2px solid #fff;"></div>
                <input type="text" id="mobPickHex" class="text-input-field" value="#58A6FF" oninput="var el=document.getElementById('mobPickPreview'); if(el) el.style.background=this.value; if(typeof setProp==='function') setProp('color', this.value);" style="flex:1;">
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 10px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof toggleEyedropper==='function') toggleEyedropper(); closeMobToolEditor();">👁️ Eyedropper</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Hue &amp; Saturation</label><span>210°</span></div>
                <input type="range" min="0" max="360" value="210" oninput="var hex='#58A6FF'; var inp=document.getElementById('mobPickHex'); if(inp) inp.value=hex; var pr=document.getElementById('mobPickPreview'); if(pr) pr.style.background=hex;">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "templates" || opt.id === "templates_lib") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:4px;";
        wrap.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--ac);">
                <span>Templates Library (tpits)</span>
                <span style="color:var(--dn); font-weight:700;">✓/✕ Excluded</span>
            </div>
            <div class="options-grid-compact" style="grid-template-columns: repeat(3, 1fr);">
                <div class="option-card" style="height:46px;" onclick="if(typeof openTemplates==='function') openTemplates(); closeMobToolEditor();"><span>📱 Social Cards</span></div>
                <div class="option-card" style="height:46px;" onclick="if(typeof openTemplates==='function') openTemplates(); closeMobToolEditor();"><span>💼 Business</span></div>
                <div class="option-card" style="height:46px;" onclick="if(typeof openTemplates==='function') openTemplates(); closeMobToolEditor();"><span>🎨 Creative</span></div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "layers_lib" || opt.id === "panel") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bd); padding:6px 10px; border-radius:6px; font-size:11px;">
                <span>Active Layer Count: <b style="color:var(--ac);">${typeof els !== 'undefined' ? els.length : 1}</b></span>
                <button class="editor-back-btn" style="width:auto; height:26px; padding:0 10px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof openLayers==='function') openLayers(); closeMobToolEditor();">Full Layers Panel</button>
            </div>
            <div style="display:flex; gap:6px;">
                <button class="editor-back-btn" style="flex:1; width:auto; height:30px;" onclick="if(typeof layerOp==='function') layerOp('front');">⬆️ Front</button>
                <button class="editor-back-btn" style="flex:1; width:auto; height:30px;" onclick="if(typeof layerOp==='function') layerOp('back');">⬇️ Back</button>
                <button class="editor-back-btn" style="flex:1; width:auto; height:30px;" onclick="if(typeof layerOp==='function') layerOp('dup');">📋 Duplicate</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "grid_lib" || opt.id === "grid") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bd); padding:6px 10px; border-radius:6px; font-size:11px;">
                <span>Canvas Alignment Grid System</span>
                <button class="editor-back-btn" style="width:auto; height:26px; padding:0 10px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof toggleGrid==='function') toggleGrid();">Turn Grid On/Off</button>
            </div>
            <div style="display:flex; gap:4px; overflow-x:auto; padding:2px 0; -webkit-overflow-scrolling:touch;">
                <button class="editor-back-btn" style="height:26px; font-size:10px; padding:0 8px; flex-shrink:0;" onclick="if(typeof setGridSetting==='function') setGridSetting('layout', 'square');">📐 Square</button>
                <button class="editor-back-btn" style="height:26px; font-size:10px; padding:0 8px; flex-shrink:0;" onclick="if(typeof setGridSetting==='function') setGridSetting('layout', 'thirds');">📏 Rule of Thirds</button>
                <button class="editor-back-btn" style="height:26px; font-size:10px; padding:0 8px; flex-shrink:0;" onclick="if(typeof setGridSetting==='function') setGridSetting('layout', 'golden');">✨ Golden Ratio</button>
                <button class="editor-back-btn" style="height:26px; font-size:10px; padding:0 8px; flex-shrink:0;" onclick="if(typeof setGridSetting==='function') setGridSetting('layout', 'center');">🎯 Center Cross</button>
                <button class="editor-back-btn" style="height:26px; font-size:10px; padding:0 8px; flex-shrink:0;" onclick="if(typeof setGridSetting==='function') setGridSetting('layout', 'diagonal');">📊 Isometric</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Grid Spacing</label><span id="val-gsz">${window.arjonaGridSettings?.spacing || 50}px</span></div>
                <input type="range" min="10" max="150" value="${window.arjonaGridSettings?.spacing || 50}" oninput="if(typeof setGridSetting==='function') setGridSetting('spacing', parseInt(this.value)); var el=document.getElementById('val-gsz'); if(el) el.innerText=this.value+'px';">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "color_bg" || opt.id === "gradient") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bd); padding:6px 10px; border-radius:6px; font-size:11px;">
                <span>Background Color &amp; Gradient</span>
                <button class="editor-back-btn" style="width:auto; height:26px; padding:0 10px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof openGradient==='function') openGradient(); closeMobToolEditor();">Full BG Editor</button>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <label style="font-size:11px;">Solid:</label><input type="color" value="#0D1117" onchange="if(typeof setBg==='function') setBg('solid', this.value); else if(typeof canvas!=='undefined' && typeof ctx!=='undefined') { ctx.fillStyle=this.value; ctx.fillRect(0,0,canvas.width,canvas.height); if(typeof R==='function') R(); }" style="width:32px; height:24px; border:none; background:transparent; cursor:pointer;">
                <label style="font-size:11px;">Grad 1:</label><input type="color" value="#00C6FF" style="width:32px; height:24px; border:none; background:transparent; cursor:pointer;">
                <label style="font-size:11px;">Grad 2:</label><input type="color" value="#7F3DFF" style="width:32px; height:24px; border:none; background:transparent; cursor:pointer;">
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "crop") {
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:4px;";
        wrap.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--ac);">
                <span>Aspect Ratio Selection</span>
                <span style="color:var(--dn); font-weight:700;">✓/✕ Excluded</span>
            </div>
            <div class="options-grid-compact">
                <div class="option-card active" onclick="if(typeof toggleCropMode==='function') toggleCropMode(); closeMobToolEditor();"><span>Free / Launch</span></div>
                <div class="option-card" onclick="if(typeof toggleCropMode==='function') toggleCropMode(); closeMobToolEditor();"><span>1:1 Square</span></div>
                <div class="option-card" onclick="if(typeof toggleCropMode==='function') toggleCropMode(); closeMobToolEditor();"><span>4:5 Story</span></div>
                <div class="option-card" onclick="if(typeof toggleCropMode==='function') toggleCropMode(); closeMobToolEditor();"><span>16:9 Wide</span></div>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id === "stickers" || opt.id === "frames" || opt.id === "collage" || opt.id === "draw") {
        var titleName = opt.label;
        var funcCall = opt.id === "stickers" ? "openStickers()" : (opt.id === "frames" ? "openFrames()" : (opt.id === "collage" ? "openCollage()" : "toggleDrawMode()"));
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:var(--bd); border-radius:6px; padding:8px 10px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <div style="font-size:11px; font-weight:700; color:var(--tx1);">${titleName} Workspace</div>
                    <div style="font-size:9px; color:var(--tx2);">Add &amp; customize ${titleName.toLowerCase()} directly on canvas</div>
                </div>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof ${funcCall.split('()')[0]} === 'function') ${funcCall}; closeMobToolEditor();">Launch ${titleName}</button>
            </div>
        `;
        container.appendChild(wrap);
    } else if (opt.id.indexOf("shape_") === 0) {
        var shapeType = opt.id.replace("shape_", "");
        if (shapeType === "rect") shapeType = "rectangle";
        if (shapeType === "tri") shapeType = "triangle";
        var wrap = document.createElement("div");
        wrap.style.cssText = "display:flex; flex-direction:column; gap:6px;";
        wrap.innerHTML = `
            <div style="background:var(--bd); border-radius:6px; padding:6px 10px; display:flex; align-items:center; justify-content:space-between;">
                <span>Add ${shapeType.toUpperCase()} shape to canvas</span>
                <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; background:var(--ac); color:#fff; font-weight:700; border:none;" onclick="if(typeof addShape === 'function') addShape('${shapeType}');">Add Shape</button>
            </div>
            <div class="sheet-sld">
                <div class="sheet-sld-head"><label>Shape Opacity &amp; Color</label><span>100%</span></div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="range" min="10" max="100" value="100" oninput="if(typeof setProp==='function') setProp('opacity', this.value);" style="flex:1;">
                    <input type="color" value="#58A6FF" onchange="if(typeof setProp==='function') setProp('color', this.value);" style="width:28px; height:22px; border:none; background:transparent; cursor:pointer;">
                </div>
            </div>
        `;
        container.appendChild(wrap);
    } else {
        var sld = document.createElement("div");
        sld.className = "sheet-sld";
        sld.innerHTML = `
            <div class="sheet-sld-head"><label>${opt.label} Adjustment</label><span>80%</span></div>
            <input type="range" min="0" max="100" value="80">
        `;
        container.appendChild(sld);
    }
}

function generateMobQRCode() {
    var inp = document.getElementById('mobQrInput');
    var text = inp ? inp.value.trim() : 'https://arjona.ai';
    if (!text) text = 'https://arjona.ai';

    var fgInp = document.getElementById('mobQrFg');
    var bgInp = document.getElementById('mobQrBg');
    var fgCol = fgInp ? fgInp.value : '#000000';
    var bgCol = bgInp ? bgInp.value : '#ffffff';

    var created = false;
    function applyQRCodeCanvas(imageContent) {
        if (created) return;
        created = true;
        if (typeof els !== 'undefined' && typeof canvas !== 'undefined') {
            els.push({
                id: 'qr' + Date.now(), type: 'image', content: imageContent,
                x: canvas.width / 2 - 120, y: canvas.height / 2 - 120,
                scale: 60, rotate: 0, opacity: 100
            });
            if (typeof selEl === 'function') selEl(els[els.length - 1].id);
            else { selId = els[els.length - 1].id; if (typeof sUI === 'function') sUI(); if (typeof R === 'function') R(); }
            if (typeof sH === 'function') sH('QR Code Added');
        }
        closeMobToolEditor();
    }

    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
        applyQRCodeCanvas(img);
    };
    img.onerror = function () {
        var mc = document.createElement('canvas');
        mc.width = 240; mc.height = 240;
        var ctx2 = mc.getContext('2d');
        ctx2.fillStyle = bgCol;
        ctx2.fillRect(0, 0, 240, 240);
        ctx2.fillStyle = fgCol;
        ctx2.fillRect(20, 20, 60, 60); ctx2.fillStyle = bgCol; ctx2.fillRect(30, 30, 40, 40); ctx2.fillStyle = fgCol; ctx2.fillRect(40, 40, 20, 20);
        ctx2.fillRect(160, 20, 60, 60); ctx2.fillStyle = bgCol; ctx2.fillRect(170, 30, 40, 40); ctx2.fillStyle = fgCol; ctx2.fillRect(180, 40, 20, 20);
        ctx2.fillRect(20, 160, 60, 60); ctx2.fillStyle = bgCol; ctx2.fillRect(30, 170, 40, 40); ctx2.fillStyle = fgCol; ctx2.fillRect(40, 180, 20, 20);
        var hash = 0;
        for (var i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
        for (var r = 90; r < 150; r += 15) {
            for (var c = 90; c < 150; c += 15) {
                if (((hash + r * c) % 3) === 0) ctx2.fillRect(c, r, 12, 12);
            }
        }
        ctx2.fillRect(100, 100, 40, 40);
        var localImg = new Image();
        localImg.onload = function() { applyQRCodeCanvas(localImg); };
        localImg.src = mc.toDataURL();
    };
    img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=' + fgCol.replace('#','') + '&bgcolor=' + bgCol.replace('#','') + '&data=' + encodeURIComponent(text);
}

function addMobWatermark() {
    var inp = document.getElementById('mobMarkInput');
    var text = inp ? inp.value.trim() : '© Arjona AI';
    if (!text) text = '© Arjona AI';

    var opInp = document.getElementById('mobMarkOp');
    var opVal = opInp ? parseInt(opInp.value) : 50;

    var colInp = document.getElementById('mobMarkCol');
    var colVal = colInp ? colInp.value : '#ffffff';

    if (typeof els !== 'undefined' && typeof canvas !== 'undefined') {
        els.push({
            id: 'w' + Date.now(), type: 'text', text: text,
            x: canvas.width - 160, y: canvas.height - 40,
            scale: 45, rotate: 0, opacity: opVal,
            font: 'Arial', color: colVal, fontSize: 24,
            charSpacing: 1, curve: 0, stroke: 1, strokeColor: '#000000',
            emboss: 0, threeDDepth: 0, innerShadow: 0, reflection: 0, glow: 0
        });
        if (typeof selEl === 'function') selEl(els[els.length - 1].id);
        else { selId = els[els.length - 1].id; if (typeof sUI === 'function') sUI(); if (typeof R === 'function') R(); }
        if (typeof sH === 'function') sH('Watermark Added');
    }
    closeMobToolEditor();
}


/* ============================================================================
   TYPOGRAPHY: HANDWRITING / SIGNATURE TO FONT CONVERTER + EXTERNAL UPLOAD/DOWNLOAD
   ============================================================================ */

var hwIsDrawing = false, hwLastX = 0, hwLastY = 0;
function openHandwritingFontModal() {
    var modal = document.getElementById('handwritingFontModal');
    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = 'handwritingFontModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex; z-index:9999999;';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:440px; width:95%; background:var(--bg); border:1px solid var(--bd2); border-radius:12px; overflow:hidden;">
            <div class="modal-head" style="background:#10141C; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bd);">
                <h2 style="font-size:14px; font-weight:800; color:var(--tx1); display:flex; align-items:center; gap:6px;">✍️ Convert Handwriting / Signature to Font</h2>
                <button class="modal-x" onclick="document.getElementById('handwritingFontModal').remove()" style="background:transparent; border:none; color:var(--tx2); font-size:16px; cursor:pointer;">✕</button>
            </div>
            <div class="modal-body" style="padding:14px 16px; display:flex; flex-direction:column; gap:10px;">
                <div style="font-size:11px; color:var(--tx2);">Draw your signature or alphabet character cleanly below. The system converts your stroke into a high-res custom scalable font glyph!</div>
                
                <div style="position:relative; width:100%; height:180px; background:#FFFFFF; border:2px dashed var(--ac); border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                    <canvas id="hwFontCanvas" width="400" height="180" style="width:100%; height:100%; cursor:crosshair;"></canvas>
                    <div style="position:absolute; bottom:36px; left:20px; right:20px; height:1px; border-bottom:1px dotted #A0AEC0; pointer-events:none;"></div>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <label style="font-size:11px; font-weight:600; color:var(--tx1);">Pen Size:</label>
                        <input type="range" id="hwPenSize" min="2" max="16" value="5" style="width:80px;">
                        <input type="color" id="hwPenColor" value="#000000" style="width:28px; height:24px; border:none; background:transparent; cursor:pointer;" title="Pen Color">
                    </div>
                    <button class="editor-back-btn" style="width:auto; height:28px; padding:0 10px; font-size:11px;" onclick="clearHandwritingCanvas()">🧹 Clear Canvas</button>
                </div>

                <div style="display:flex; flex-direction:column; gap:4px;">
                    <label style="font-size:11px; font-weight:700; color:var(--tx1);">Custom Font Name:</label>
                    <input type="text" id="hwFontNameInp" class="text-input-field" placeholder="e.g. My Signature Font, Arjona Script..." value="MySignatureFont">
                </div>

                <div style="display:flex; gap:8px; margin-top:4px;">
                    <button class="btn-action-primary" style="flex:1; background:linear-gradient(135deg, #58A6FF, #A371F7);" onclick="convertAndApplyHandwritingFont()">⚡ Convert &amp; Apply to Canvas</button>
                </div>
            </div>
        </div>
    `;
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);

    var hwc = document.getElementById('hwFontCanvas');
    var hwctx = hwc.getContext('2d');
    hwctx.lineCap = 'round'; hwctx.lineJoin = 'round';

    function getHwPt(e) {
        var rect = hwc.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * (hwc.width / rect.width), y: (clientY - rect.top) * (hwc.height / rect.height) };
    }

    hwc.addEventListener('mousedown', function(e) { hwIsDrawing = true; var pt = getHwPt(e); hwLastX = pt.x; hwLastY = pt.y; });
    hwc.addEventListener('mousemove', function(e) {
        if (!hwIsDrawing) return;
        var pt = getHwPt(e);
        hwctx.lineWidth = parseInt(document.getElementById('hwPenSize').value || 5);
        hwctx.strokeStyle = document.getElementById('hwPenColor').value || '#000000';
        hwctx.beginPath(); hwctx.moveTo(hwLastX, hwLastY); hwctx.lineTo(pt.x, pt.y); hwctx.stroke();
        hwLastX = pt.x; hwLastY = pt.y;
    });
    hwc.addEventListener('mouseup', function() { hwIsDrawing = false; });
    hwc.addEventListener('mouseleave', function() { hwIsDrawing = false; });

    hwc.addEventListener('touchstart', function(e) { e.preventDefault(); hwIsDrawing = true; var pt = getHwPt(e); hwLastX = pt.x; hwLastY = pt.y; }, { passive: false });
    hwc.addEventListener('touchmove', function(e) {
        e.preventDefault(); if (!hwIsDrawing) return;
        var pt = getHwPt(e);
        hwctx.lineWidth = parseInt(document.getElementById('hwPenSize').value || 5);
        hwctx.strokeStyle = document.getElementById('hwPenColor').value || '#000000';
        hwctx.beginPath(); hwctx.moveTo(hwLastX, hwLastY); hwctx.lineTo(pt.x, pt.y); hwctx.stroke();
        hwLastX = pt.x; hwLastY = pt.y;
    }, { passive: false });
    hwc.addEventListener('touchend', function() { hwIsDrawing = false; });
}

function clearHandwritingCanvas() {
    var hwc = document.getElementById('hwFontCanvas');
    if (!hwc) return;
    var hwctx = hwc.getContext('2d');
    hwctx.clearRect(0, 0, hwc.width, hwc.height);
}

function convertAndApplyHandwritingFont() {
    var hwc = document.getElementById('hwFontCanvas');
    var nameInp = document.getElementById('hwFontNameInp');
    if (!hwc || !nameInp) return;
    var fontName = nameInp.value.trim() || 'MySignatureFont';
    var glyphDataUrl = hwc.toDataURL('image/png');

    window.arjonaCustomFonts = window.arjonaCustomFonts || {};
    window.arjonaCustomFonts[fontName] = { name: fontName, glyphUrl: glyphDataUrl, created: Date.now() };
    try { localStorage.setItem('arjona_custom_fonts', JSON.stringify(window.arjonaCustomFonts)); } catch(e) {}

    ['fontSel', 'mobFontSel'].forEach(function(sid) {
        var sel = document.getElementById(sid);
        if (sel) {
            var exists = false;
            for (var i=0; i<sel.options.length; i++) { if (sel.options[i].value === fontName) { exists = true; break; } }
            if (!exists) {
                var op = document.createElement('option');
                op.value = fontName; op.textContent = '✍️ ' + fontName;
                sel.appendChild(op);
            }
            sel.value = fontName;
        }
    });

    var el = (typeof findEl === 'function' && selId) ? findEl(selId) : null;
    if (!el || el.type !== 'text') {
        if (typeof addText === 'function') addText();
        el = (typeof findEl === 'function' && selId) ? findEl(selId) : null;
    }
    if (el && el.type === 'text') {
        el.font = fontName;
        el.customGlyphUrl = glyphDataUrl;
        el.text = fontName;
        if (typeof sH === 'function') sH('Handwriting Font: ' + fontName);
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
    }
    var modal = document.getElementById('handwritingFontModal');
    if (modal) modal.remove();
    if (typeof showStatusBadge === 'function') showStatusBadge('✍️ Converted & applied font: ' + fontName);
}

function triggerCustomFontUpload() {
    var inp = document.getElementById('customFontFileInp');
    if (!inp) {
        inp = document.createElement('input');
        inp.type = 'file'; inp.id = 'customFontFileInp';
        inp.accept = '.ttf,.otf,.woff,.woff2';
        inp.style.display = 'none';
        inp.onchange = function(e) { if(typeof uploadAndRegisterCustomFont === 'function') uploadAndRegisterCustomFont(e); else if(typeof upFont === 'function') upFont(e); };
        document.body.appendChild(inp);
    }
    inp.click();
}

function downloadCurrentFontFile() {
    var el = (typeof findEl === 'function' && selId) ? findEl(selId) : null;
    var fontName = el ? (el.font || 'Arial') : 'CustomFont';
    window.arjonaCustomFonts = window.arjonaCustomFonts || {};
    var fontMeta = window.arjonaCustomFonts[fontName] || { name: fontName, exportedAt: new Date().toISOString() };

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fontMeta, null, 2));
    var downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fontName + "_ArjonaFontPack.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (typeof showStatusBadge === 'function') showStatusBadge('💾 Exported font pack: ' + fontName);
}

function uploadAndRegisterCustomFont(ev) {
    var f = ev.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function (e) {
        var n = f.name.replace('/\.[^/.]+$/', '');
        try {
            var fc = new FontFace(n, 'url(' + e.target.result + ')');
            fc.load().then(function (l) {
                document.fonts.add(l);
                ['fontSel', 'mobFontSel'].forEach(function(sid) {
                    var sel = document.getElementById(sid);
                    if (sel) {
                        var op = document.createElement('option');
                        op.value = n; op.textContent = '📁 ' + n;
                        sel.appendChild(op); sel.value = n;
                    }
                });
                var el = (typeof findEl === 'function' && selId) ? findEl(selId) : null;
                if (!el || el.type !== 'text') { if (typeof addText === 'function') addText(); el = findEl(selId); }
                if (el && el.type === 'text') {
                    el.font = n;
                    if (typeof sH === 'function') sH('Uploaded Font: ' + n);
                    if (typeof R === 'function') R();
                    if (typeof sUI === 'function') sUI();
                }
                if (typeof showStatusBadge === 'function') showStatusBadge('📁 Uploaded & applied font: ' + n);
            }).catch(function () {
                alert('Could not parse font file.');
            });
        } catch (err) { }
    };
    r.readAsDataURL(f); ev.target.value = '';
}

/* ============================================================================
   CREATIVE STICKERS: CUSTOM ASSETS LIBRARY & DESIGN TEMPLATES ENGINE
   ============================================================================ */

function saveSelectedItemAsCustomAsset() {
    var el = (typeof findEl === 'function' && selId) ? findEl(selId) : null;
    if (!el && typeof els !== 'undefined' && els.length > 0) el = els[els.length - 1];
    if (!el) {
        alert('Please select an item on the canvas first to save as a custom asset!');
        return;
    }
    var assetName = prompt('Enter a name for your custom asset:', el.type === 'text' ? (el.text || 'Custom Text') : 'Custom Image / Sticker');
    if (!assetName) return;

    var assetSrc = '';
    if (el.type === 'image' && el.content) {
        assetSrc = el.content.src || serializeImg(el.content);
    } else {
        var oc = document.createElement('canvas');
        oc.width = 200; oc.height = 200;
        var octx = oc.getContext('2d');
        var fs = el.fontSize || 60;
        octx.font = 'bold ' + fs + 'px "' + (el.font || 'Arial') + '"';
        octx.fillStyle = el.color || '#7F3DFF';
        octx.textAlign = 'center'; octx.textBaseline = 'middle';
        octx.fillText(el.text || 'T', 100, 100);
        assetSrc = oc.toDataURL();
    }

    window.arjonaCustomAssets = window.arjonaCustomAssets || [];
    window.arjonaCustomAssets.push({
        id: 'ast_' + Date.now(),
        name: assetName,
        src: assetSrc,
        type: el.type,
        text: el.text || '',
        color: el.color || '#ffffff',
        font: el.font || 'Arial'
    });
    try { localStorage.setItem('arjona_custom_assets', JSON.stringify(window.arjonaCustomAssets)); } catch(e) {}
    openStickers('assets');
    if (typeof showStatusBadge === 'function') showStatusBadge('🎒 Saved "' + assetName + '" to Custom Assets!');
}

function triggerCustomAssetUpload() {
    var inp = document.getElementById('customAssetUploadInp');
    if (!inp) {
        inp = document.createElement('input');
        inp.type = 'file'; inp.id = 'customAssetUploadInp';
        inp.accept = 'image/*';
        inp.style.display = 'none';
        inp.onchange = uploadCustomAssetFile;
        document.body.appendChild(inp);
    }
    inp.click();
}

function uploadCustomAssetFile(ev) {
    var f = ev.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
        var assetName = f.name.replace('/\.[^/.]+$/', '');
        window.arjonaCustomAssets = window.arjonaCustomAssets || [];
        window.arjonaCustomAssets.push({
            id: 'ast_' + Date.now(),
            name: assetName,
            src: e.target.result,
            type: 'image'
        });
        try { localStorage.setItem('arjona_custom_assets', JSON.stringify(window.arjonaCustomAssets)); } catch(err) {}
        openStickers('assets');
        if (typeof showStatusBadge === 'function') showStatusBadge('🎒 Uploaded asset: ' + assetName);
    };
    r.readAsDataURL(f); ev.target.value = '';
}

function applyCustomAssetToCanvas(idx) {
    window.arjonaCustomAssets = window.arjonaCustomAssets || [];
    var ast = window.arjonaCustomAssets[idx];
    if (!ast) return;
    if (ast.type === 'text') {
        els.push({
            id: 't' + Date.now(), type: 'text', text: ast.text || ast.name,
            x: canvas.width / 2, y: canvas.height / 2,
            scale: 100, rotate: 0, opacity: 100,
            font: ast.font || 'Arial', color: ast.color || '#ffffff', fontSize: 60
        });
        selId = els[els.length - 1].id;
        if (typeof sH === 'function') sH('Custom Asset Text');
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
    } else {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            els.push({
                id: 'i' + Date.now(), type: 'image', content: img,
                x: canvas.width / 2 - img.width / 2, y: canvas.height / 2 - img.height / 2,
                scale: 100, rotate: 0, opacity: 100
            });
            selId = els[els.length - 1].id;
            if (typeof sH === 'function') sH('Custom Asset Image');
            if (typeof R === 'function') R();
            if (typeof sUI === 'function') sUI();
            if (typeof showCornerHandles === 'function') showCornerHandles(els[els.length - 1]);
        };
        img.src = ast.src;
    }
    var m = document.getElementById('stickersAssetsModal');
    if (m) m.remove();
}

function deleteCustomAsset(idx) {
    if (!confirm('Delete this custom asset?')) return;
    window.arjonaCustomAssets.splice(idx, 1);
    try { localStorage.setItem('arjona_custom_assets', JSON.stringify(window.arjonaCustomAssets)); } catch(e) {}
    openStickers('assets');
}

function saveCurrentCanvasAsTemplate() {
    var tplName = prompt('Enter a name for your new Design Template:', 'My Custom Template');
    if (!tplName) return;
    var stateJson = serS();
    var thumb = canvas.toDataURL('image/jpeg', 0.8);
    window.arjonaCustomTemplates = window.arjonaCustomTemplates || [];
    window.arjonaCustomTemplates.push({
        id: 'tpl_' + Date.now(),
        name: tplName,
        state: stateJson,
        thumb: thumb,
        created: Date.now()
    });
    try { localStorage.setItem('arjona_custom_templates', JSON.stringify(window.arjonaCustomTemplates)); } catch(e) {}
    openStickers('templates');
    if (typeof showStatusBadge === 'function') showStatusBadge('📐 Saved template: ' + tplName);
}

function loadCustomTemplate(idx) {
    window.arjonaCustomTemplates = window.arjonaCustomTemplates || [];
    var tpl = window.arjonaCustomTemplates[idx];
    if (!tpl) return;
    if (!confirm('Load template "' + tpl.name + '"? This will replace current canvas content.')) return;
    restS(tpl.state, function() {
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
        if (typeof sH === 'function') sH('Load Template: ' + tpl.name);
        var m = document.getElementById('stickersAssetsModal');
        if (m) m.remove();
        if (typeof showStatusBadge === 'function') showStatusBadge('🚀 Loaded template: ' + tpl.name);
    });
}

function deleteCustomTemplate(idx) {
    if (!confirm('Delete this design template?')) return;
    window.arjonaCustomTemplates.splice(idx, 1);
    try { localStorage.setItem('arjona_custom_templates', JSON.stringify(window.arjonaCustomTemplates)); } catch(e) {}
    openStickers('templates');
}


/* ============================================================================
   1. VISIBLE EYEDROPPER CURSOR + LIVE MAGNIFYING COLOR LOUPE ENGINE
   ============================================================================ */

function setupEyedropperLoupe() {
    var loupe = document.getElementById('eyedropperLoupe');
    if (!loupe) {
        loupe = document.createElement('div');
        loupe.id = 'eyedropperLoupe';
        loupe.style.cssText = 'position:fixed; width:84px; height:96px; pointer-events:none; z-index:9999999; display:none; flex-direction:column; align-items:center; filter:drop-shadow(0 6px 16px rgba(0,0,0,0.6));';
        loupe.innerHTML = `
            <div style="width:72px; height:72px; border-radius:50%; border:3px solid #fff; overflow:hidden; position:relative; background:#000;">
                <canvas id="loupeCanvas" width="72" height="72" style="width:100%; height:100%; image-rendering:pixelated;"></canvas>
                <div style="position:absolute; top:32px; left:32px; width:8px; height:8px; border:1px solid #FF3D71; pointer-events:none; box-sizing:border-box;"></div>
            </div>
            <div id="loupeHexLabel" style="background:#10141C; color:#fff; font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px; margin-top:-6px; border:1px solid rgba(255,255,255,0.3); white-space:nowrap;">#000000</div>
        `;
        document.body.appendChild(loupe);
    }
}

function updateEyedropperLoupe(e) {
    if (!eyedropperMode) {
        var l = document.getElementById('eyedropperLoupe');
        if (l) l.style.display = 'none';
        return;
    }
    setupEyedropperLoupe();
    var loupe = document.getElementById('eyedropperLoupe');
    var lCanvas = document.getElementById('loupeCanvas');
    var lLabel = document.getElementById('loupeHexLabel');
    if (!loupe || !lCanvas || !lLabel) return;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    loupe.style.display = 'flex';
    loupe.style.left = (clientX + 16) + 'px';
    loupe.style.top = (clientY - 80) + 'px';

    var pt = typeof touchToCanvas === 'function' && e.touches ? touchToCanvas(e.touches[0]) : (typeof gCC === 'function' ? gCC(e) : { x: clientX, y: clientY });
    try {
        var lctx = lCanvas.getContext('2d');
        lctx.imageSmoothingEnabled = false;
        var sampleSize = 9;
        var half = Math.floor(sampleSize / 2);
        var imgData = ctx.getImageData(Math.max(0, pt.x - half), Math.max(0, pt.y - half), sampleSize, sampleSize);
        var tempCanvas = document.createElement('canvas');
        tempCanvas.width = sampleSize; tempCanvas.height = sampleSize;
        tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
        lctx.clearRect(0, 0, 72, 72);
        lctx.drawImage(tempCanvas, 0, 0, 72, 72);

        var centerPixel = ctx.getImageData(pt.x, pt.y, 1, 1).data;
        var hex = '#' + [centerPixel[0], centerPixel[1], centerPixel[2]].map(function (c) {
            return ('0' + c.toString(16)).slice(-2);
        }).join('').toUpperCase();
        lLabel.innerText = hex;
        lLabel.style.borderColor = hex;
    } catch (err) {}
}

function toggleEyedropper() {
    eyedropperMode = !eyedropperMode;
    var loupe = document.getElementById('eyedropperLoupe');
    if (eyedropperMode) {
        document.body.classList.add('eyedropper-active');
        var svgStr = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#58A6FF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6"/><path d="m4 20 6-6"/><path d="M19.1 8.9 15.1 4.9a2 2 0 0 0-2.8 0L9.5 7.7a2 2 0 0 0 0 2.8l4 4a2 2 0 0 0 2.8 0l2.8-2.8a2 2 0 0 0 0-2.8Z"/><path d="m4 20 2-2"/></svg>';
        var cursorUrl = 'data:image/svg+xml;base64,' + btoa(svgStr);
        canvas.style.cursor = 'url("' + cursorUrl + '") 0 26, crosshair';
        canvas.style.setProperty('cursor', 'url("' + cursorUrl + '") 0 26, crosshair', 'important');
        if (typeof showStatusBadge === 'function') showStatusBadge("👁️ Eyedropper Active: Click any pixel to pick color");
    } else {
        document.body.classList.remove('eyedropper-active');
        canvas.style.cursor = mode !== 'select' ? 'crosshair' : 'default';
        if (loupe) loupe.style.display = 'none';
        if (typeof showStatusBadge === 'function') showStatusBadge("👁️ Eyedropper Off");
    }
}

var old_mD_eyedrop = "if (eyedropperMode) {";
var new_mD_eyedrop_engine = `
if (eyedropperMode) {
    try {
        var pixel = ctx.getImageData(x, y, 1, 1).data;
        var hex = '#' + [pixel[0], pixel[1], pixel[2]].map(function (c) {
            return ('0' + c.toString(16)).slice(-2);
        }).join('').toUpperCase();
        eyedropperMode = false;
        document.body.classList.remove('eyedropper-active');
        canvas.style.cursor = mode !== 'select' ? 'crosshair' : 'default';
        var loupe = document.getElementById('eyedropperLoupe');
        if (loupe) loupe.style.display = 'none';
        
        // Apply hex directly
        if (typeof setProp === 'function') setProp('color', hex);
        var pickInp = document.getElementById('mobPickHex');
        if (pickInp) pickInp.value = hex;
        var pickPrev = document.getElementById('mobPickPreview');
        if (pickPrev) pickPrev.style.background = hex;
        var deskCol = document.getElementById('txtCol');
        if (deskCol) deskCol.value = hex;
        if (typeof showStatusBadge === 'function') showStatusBadge('🎨 Color Picked & Applied: ' + hex);
    } catch (e) {}
    return;
}
`;


/* ============================================================================
   2. FLAWLESS SMART BACKGROUND REMOVER & CUTTER ENGINE
   ============================================================================ */

function runFlawlessSmartBackgroundCutout(el, smoothingRatio) {
    if (!el || el.type !== 'image' || !el.content || !el.content.complete) return;
    if (typeof loader !== 'undefined' && loader) loader.style.display = 'flex';
    var ldrMsg = document.getElementById('ldrMsg');
    if (ldrMsg) ldrMsg.innerText = 'AI Smart Cutting BG...';

    setTimeout(function () {
        try {
            var W = el.content.width, H = el.content.height;
            var tc = document.createElement('canvas');
            tc.width = W; tc.height = H;
            var tctx = tc.getContext('2d');
            tctx.drawImage(el.content, 0, 0);
            var imgData = tctx.getImageData(0, 0, W, H);
            var data = imgData.data;

            // Analyze multi-edge perimeter color clusters
            var edgeR = 0, edgeG = 0, edgeB = 0, count = 0;
            for (var x = 0; x < W; x += Math.max(1, Math.floor(W / 40))) {
                var iTop = (x) * 4;
                var iBot = ((H - 1) * W + x) * 4;
                edgeR += data[iTop] + data[iBot]; edgeG += data[iTop + 1] + data[iBot + 1]; edgeB += data[iTop + 2] + data[iBot + 2];
                count += 2;
            }
            for (var y = 0; y < H; y += Math.max(1, Math.floor(H / 40))) {
                var iLeft = (y * W) * 4;
                var iRight = (y * W + (W - 1)) * 4;
                edgeR += data[iLeft] + data[iRight]; edgeG += data[iLeft + 1] + data[iRight + 1]; edgeB += data[iLeft + 2] + data[iRight + 2];
                count += 2;
            }
            edgeR /= count; edgeG /= count; edgeB /= count;

            var tolerance = 48 + (smoothingRatio || 15);
            var smoothRange = Math.max(10, tolerance * 0.4);

            for (var py = 0; py < H; py++) {
                for (var px = 0; px < W; px++) {
                    var idx = (py * W + px) * 4;
                    var dr = data[idx] - edgeR, dg = data[idx + 1] - edgeG, db = data[idx + 2] - edgeB;
                    var dist = Math.sqrt(dr * dr + dg * dg + db * db);
                    if (dist < tolerance) {
                        data[idx + 3] = 0; // Cut out background
                    } else if (dist < tolerance + smoothRange) {
                        var alphaRatio = (dist - tolerance) / smoothRange;
                        data[idx + 3] = Math.round(data[idx + 3] * alphaRatio); // Smooth anti-aliased edge
                    }
                }
            }

            tctx.putImageData(imgData, 0, 0);
            var cutImg = new Image();
            cutImg.crossOrigin = 'anonymous';
            cutImg.onload = function () {
                el.content = cutImg;
                if (el.eraserMask) {
                    var mctx = el.eraserMask.getContext('2d');
                    mctx.fillStyle = '#fff';
                    mctx.fillRect(0, 0, el.eraserMask.width, el.eraserMask.height);
                }
                if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
                if (typeof sH === 'function') sH('Smart BG Cutout');
                if (typeof R === 'function') R();
                if (typeof sUI === 'function') sUI();
                if (typeof showStatusBadge === 'function') showStatusBadge("✨ Automatic Smart BG Cutout Complete!");
            };
            cutImg.src = tc.toDataURL('image/png');
        } catch (err) {
            if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
        }
    }, 60);
}

function aiSmartBG() {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el && typeof els !== 'undefined' && els.length > 0) {
        for (var i = els.length - 1; i >= 0; i--) { if (els[i].type === 'image') { el = els[i]; break; } }
    }
    if (!el) { alert('Please select or add an image layer first.'); return; }
    runFlawlessSmartBackgroundCutout(el, 15);
}

function removeBg() {
    aiSmartBG();
}


/* ============================================================================
   3. GRID OVERLAY SYNCED STRICTLY TO CANVAS + EXPANDED CUSTOM LAYOUTS
   ============================================================================ */

window.arjonaGridSettings = window.arjonaGridSettings || { layout: 'square', spacing: 50, opacity: 0.35, color: '#58A6FF' };

function syncGridOverlayToCanvas() {
    var overlay = document.getElementById('gridOverlay');
    var mainCv = document.getElementById('mainCanvas');
    if (!overlay || !mainCv || !gridVisible) return;

    overlay.width = mainCv.width;
    overlay.height = mainCv.height;

    var rect = mainCv.getBoundingClientRect();
    var frame = mainCv.parentElement ? mainCv.parentElement.getBoundingClientRect() : rect;
    overlay.style.position = 'absolute';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.left = (rect.left - frame.left) + 'px';
    overlay.style.top = (rect.top - frame.top) + 'px';
    overlay.style.borderRadius = mainCv.style.borderRadius || '4px';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '15';
    overlay.style.display = 'block';
}

function drawGridOverlay() {
    var overlay = document.getElementById('gridOverlay');
    if (!overlay || !gridVisible) {
        if (overlay) overlay.style.display = 'none';
        return;
    }
    syncGridOverlayToCanvas();
    var gctx = overlay.getContext('2d');
    var W = overlay.width, H = overlay.height;
    gctx.clearRect(0, 0, W, H);

    var st = window.arjonaGridSettings || { layout: 'square', spacing: 50, opacity: 0.35, color: '#58A6FF' };
    gctx.strokeStyle = st.color || '#58A6FF';
    gctx.globalAlpha = st.opacity !== undefined ? st.opacity : 0.35;
    gctx.lineWidth = 1.5;

    if (st.layout === 'square' || !st.layout) {
        var step = st.spacing || 50;
        for (var x = step; x < W; x += step) {
            gctx.beginPath(); gctx.moveTo(x, 0); gctx.lineTo(x, H); gctx.stroke();
        }
        for (var y = step; y < H; y += step) {
            gctx.beginPath(); gctx.moveTo(0, y); gctx.lineTo(W, y); gctx.stroke();
        }
    } else if (st.layout === 'thirds') {
        var w3 = W / 3, h3 = H / 3;
        gctx.beginPath(); gctx.moveTo(w3, 0); gctx.lineTo(w3, H); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(w3 * 2, 0); gctx.lineTo(w3 * 2, H); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, h3); gctx.lineTo(W, h3); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, h3 * 2); gctx.lineTo(W, h3 * 2); gctx.stroke();
    } else if (st.layout === 'golden') {
        var gx1 = W * 0.382, gx2 = W * 0.618;
        var gy1 = H * 0.382, gy2 = H * 0.618;
        gctx.beginPath(); gctx.moveTo(gx1, 0); gctx.lineTo(gx1, H); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(gx2, 0); gctx.lineTo(gx2, H); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, gy1); gctx.lineTo(W, gy1); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, gy2); gctx.lineTo(W, gy2); gctx.stroke();
    } else if (st.layout === 'center') {
        gctx.beginPath(); gctx.moveTo(W / 2, 0); gctx.lineTo(W / 2, H); gctx.stroke();
        gctx.beginPath(); gctx.moveTo(0, H / 2); gctx.lineTo(W, H / 2); gctx.stroke();
        gctx.beginPath(); gctx.arc(W / 2, H / 2, Math.min(W, H) * 0.25, 0, Math.PI * 2); gctx.stroke();
    } else if (st.layout === 'diagonal') {
        var stepD = st.spacing || 60;
        for (var d = -H; d < W + H; d += stepD) {
            gctx.beginPath(); gctx.moveTo(d, 0); gctx.lineTo(d + H, H); gctx.stroke();
            gctx.beginPath(); gctx.moveTo(d, H); gctx.lineTo(d + H, 0); gctx.stroke();
        }
    }
    gctx.globalAlpha = 1;
}

function toggleGrid() {
    gridVisible = !gridVisible;
    var overlay = document.getElementById('gridOverlay');
    if (gridVisible) {
        if (overlay) overlay.style.display = 'block';
        drawGridOverlay();
        if (typeof showStatusBadge === 'function') showStatusBadge("📐 Grid ON: " + (window.arjonaGridSettings.layout || 'square').toUpperCase());
    } else {
        if (overlay) overlay.style.display = 'none';
        if (typeof showStatusBadge === 'function') showStatusBadge("📐 Grid OFF");
    }
}

function setGridSetting(key, val) {
    window.arjonaGridSettings = window.arjonaGridSettings || { layout: 'square', spacing: 50, opacity: 0.35, color: '#58A6FF' };
    window.arjonaGridSettings[key] = val;
    if (gridVisible) drawGridOverlay();
}


/* ============================================================================
   4. OVERHAULED MASK & ERASE ENGINE + CLEAR ACTIVE TOOL FEEDBACK & RING
   ============================================================================ */

function updateActiveMaskModeBadge() {
    var badge = document.getElementById('activeMaskModeBadge');
    var topBadge = document.getElementById('statusTxt');
    var txt = "";
    if (mode === 'select') txt = "🟢 ACTIVE TOOL: SELECT (Move & Scale Layers)";
    else if (mode === 'eraser') txt = "🔵 ACTIVE TOOL: ERASER (Drag on image to erase · Brush: " + (typeof bSz !== 'undefined' ? bSz : 25) + "px)";
    else if (mode === 'mask') txt = "🟣 ACTIVE TOOL: MASK (Drag on image to restore · Brush: " + (typeof bSz !== 'undefined' ? bSz : 25) + "px)";

    if (badge) badge.innerHTML = txt;
    if (topBadge && (mode === 'eraser' || mode === 'mask')) topBadge.innerText = txt;
}

function setMode(m, btn) {
    mode = m;
    canvas.style.cursor = m !== 'select' ? 'crosshair' : 'default';
    var btns = document.querySelectorAll('.mode-btn, .sheet-mode-btn, .mask-mode-ctrl-btn');
    for (var i = 0; i < btns.length; i++) {
        btns[i].classList.remove('active');
        if (btns[i].getAttribute('data-mode') === m) btns[i].classList.add('active');
    }
    if (btn && btn.classList) btn.classList.add('active');
    updateActiveMaskModeBadge();
    if (typeof showStatusBadge === 'function') showStatusBadge(mode === 'eraser' ? "🔵 Eraser Tool Active" : (mode === 'mask' ? "🟣 Mask Restore Tool Active" : "🟢 Select Tool Active"));
}

function setupBrushSizeRing() {
    var ring = document.getElementById('brushSizePreviewRing');
    if (!ring) {
        ring = document.createElement('div');
        ring.id = 'brushSizePreviewRing';
        ring.style.cssText = 'position:fixed; pointer-events:none; z-index:999999; border:2px solid #58A6FF; border-radius:50%; display:none; transform:translate(-50%, -50%); box-shadow:0 0 4px rgba(0,0,0,0.8);';
        document.body.appendChild(ring);
    }
}

function updateBrushRingPosition(e) {
    if (mode !== 'eraser' && mode !== 'mask') {
        var r = document.getElementById('brushSizePreviewRing');
        if (r) r.style.display = 'none';
        return;
    }
    setupBrushSizeRing();
    var ring = document.getElementById('brushSizePreviewRing');
    if (!ring) return;

    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    var scaleRatio = (el && el.scale ? el.scale : 100) / 100;
    var ringSize = Math.max(8, (typeof bSz !== 'undefined' ? bSz : 25) * scaleRatio * 0.8);

    ring.style.display = 'block';
    ring.style.width = ringSize + 'px';
    ring.style.height = ringSize + 'px';
    ring.style.left = clientX + 'px';
    ring.style.top = clientY + 'px';
    ring.style.borderColor = mode === 'eraser' ? '#58A6FF' : '#A371F7';
}

function doErase(cx, cy) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el || el.type !== 'image') return;
    if (!el.eraserMask) {
        el.eraserMask = document.createElement('canvas');
        el.eraserMask.width = el.content ? el.content.width : 400;
        el.eraserMask.height = el.content ? el.content.height : 400;
        var mctx = el.eraserMask.getContext('2d');
        mctx.fillStyle = '#fff'; mctx.fillRect(0, 0, el.eraserMask.width, el.eraserMask.height);
    }
    var mc = el.eraserMask.getContext('2d');
    var iw = el.content ? el.content.width * (el.scale / 100) : 400;
    var ih = el.content ? el.content.height * (el.scale / 100) : 400;
    
    // Accurate coordinate transform accounting for rotation
    var rot = -(el.rotate || 0) * Math.PI / 180;
    var dx = cx - (el.x + iw / 2);
    var dy = cy - (el.y + ih / 2);
    var rx = (Math.cos(rot) * dx - Math.sin(rot) * dy) + iw / 2;
    var ry = (Math.sin(rot) * dx + Math.cos(rot) * dy) + ih / 2;

    var px = (rx / iw) * el.eraserMask.width;
    var py = (ry / ih) * el.eraserMask.height;
    var br = (typeof bSz !== 'undefined' ? bSz : 25) * (el.eraserMask.width / Math.max(iw, 1));

    mc.save();
    if (mode === 'eraser') {
        mc.globalCompositeOperation = 'destination-out';
        mc.fillStyle = 'rgba(0,0,0,1)';
        mc.beginPath(); mc.arc(px, py, br, 0, Math.PI * 2); mc.fill();
    } else if (mode === 'mask') {
        mc.globalCompositeOperation = 'source-over';
        mc.fillStyle = '#ffffff';
        mc.beginPath(); mc.arc(px, py, br, 0, Math.PI * 2); mc.fill();
    }
    mc.restore();
    if (typeof R === 'function') R();
}

function nudgeSelectedPos(dx, dy) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el) return;
    el.x += dx;
    el.y += dy;
    if (typeof sH === 'function') sH('Position Nudge');
    if (typeof R === 'function') R();
    if (typeof showCornerHandles === 'function') showCornerHandles(el);
    if (typeof sUI === 'function') sUI();
}


/* ============================================================================
   ADVANCED ALIGNMENT & COMPREHENSIVE ABSOLUTE/RELATIVE POSITION ENGINE
   ============================================================================ */

function alignBetweenLayers(dir) {
    var checked = document.querySelectorAll('.layer-merge-cb:checked');
    var targetLayers = [];
    if (checked.length >= 3) {
        for (var i = 0; i < checked.length; i++) {
            var l = findEl(checked[i].value);
            if (l) targetLayers.push(l);
        }
    } else {
        targetLayers = els.slice();
    }
    if (targetLayers.length < 2) return;

    if (dir === 'h') {
        targetLayers.sort(function(a, b) { return (a.x || 0) - (b.x || 0); });
        if (targetLayers.length === 2) {
            targetLayers[0].x = canvas.width * 0.1;
            targetLayers[1].x = canvas.width * 0.9 - (targetLayers[1].content?.width || 200) * ((targetLayers[1].scale||100)/100);
        } else {
            var firstX = targetLayers[0].x || 0;
            var lastEl = targetLayers[targetLayers.length - 1];
            var lastX = lastEl.x || canvas.width - 100;
            var totalGap = lastX - firstX;
            var step = totalGap / (targetLayers.length - 1);
            for (var k = 1; k < targetLayers.length - 1; k++) {
                targetLayers[k].x = firstX + k * step;
            }
        }
    } else if (dir === 'v') {
        targetLayers.sort(function(a, b) { return (a.y || 0) - (b.y || 0); });
        if (targetLayers.length === 2) {
            targetLayers[0].y = canvas.height * 0.1;
            targetLayers[1].y = canvas.height * 0.9 - (targetLayers[1].content?.height || 200) * ((targetLayers[1].scale||100)/100);
        } else {
            var firstY = targetLayers[0].y || 0;
            var lastElV = targetLayers[targetLayers.length - 1];
            var lastY = lastElV.y || canvas.height - 100;
            var totalGapV = lastY - firstY;
            var stepV = totalGapV / (targetLayers.length - 1);
            for (var kv = 1; kv < targetLayers.length - 1; kv++) {
                targetLayers[kv].y = firstY + kv * stepV;
            }
        }
    }
    if (typeof sH === 'function') sH('Distribute Between (' + dir.toUpperCase() + ')');
    if (typeof R === 'function') R();
    if (typeof sUI === 'function') sUI();
    if (typeof showStatusBadge === 'function') showStatusBadge('↔️ Distributed space evenly between ' + targetLayers.length + ' layers!');
}

function switchPosAbsRelTab(mode) {
    var absSec = document.getElementById('posAbsSection');
    var relSec = document.getElementById('posRelSection');
    var absBtn = document.getElementById('posTabAbsBtn');
    var relBtn = document.getElementById('posTabRelBtn');
    if (!absSec || !relSec || !absBtn || !relBtn) return;
    if (mode === 'abs') {
        absSec.style.display = 'flex'; relSec.style.display = 'none';
        absBtn.style.background = 'var(--ac)'; absBtn.style.color = '#fff';
        relBtn.style.background = 'transparent'; relBtn.style.color = 'var(--tx2)';
    } else {
        absSec.style.display = 'none'; relSec.style.display = 'flex';
        relBtn.style.background = 'var(--ac)'; relBtn.style.color = '#fff';
        absBtn.style.background = 'transparent'; absBtn.style.color = 'var(--tx2)';
    }
}

function setAbsolutePos(coord, val) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el) return;
    var num = parseInt(val) || 0;
    if (coord === 'x') el.x = num;
    else if (coord === 'y') el.y = num;
    if (typeof R === 'function') R();
    if (typeof showCornerHandles === 'function') showCornerHandles(el);
}

function jumpRelativePos(preset) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el) return;
    var W = canvas.width, H = canvas.height;
    var iw = el.content ? el.content.width * ((el.scale||100)/100) : (el.fontSize ? el.fontSize * 3 : 200);
    var ih = el.content ? el.content.height * ((el.scale||100)/100) : (el.fontSize || 60);

    if (preset === 'center') { el.x = (W - iw)/2; el.y = (H - ih)/2; }
    else if (preset === 'nw') { el.x = W * 0.05; el.y = H * 0.05; }
    else if (preset === 'ne') { el.x = W * 0.95 - iw; el.y = H * 0.05; }
    else if (preset === 'sw') { el.x = W * 0.05; el.y = H * 0.95 - ih; }
    else if (preset === 'se') { el.x = W * 0.95 - iw; el.y = H * 0.95 - ih; }
    else if (preset === 'mid_y') { el.y = (H - ih)/2; }
    
    if (typeof sH === 'function') sH('Relative Jump');
    if (typeof R === 'function') R();
    if (typeof showCornerHandles === 'function') showCornerHandles(el);
    if (typeof sUI === 'function') sUI();
}


/* ============================================================================
   TEXT BACKGROUND CARDS / SHADOWS & MANUAL COLOR-KEY CUTOUT ENGINE
   ============================================================================ */

function toggleTextBoxBg(btn) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el) return;
    el.hasBgBox = !el.hasBgBox;
    if (el.hasBgBox && !el.bgBoxColor) { el.bgBoxColor = '#161B22'; el.bgBoxOpacity = 85; el.bgBoxRadius = 12; el.bgBoxPadding = 16; }
    if (btn) {
        btn.style.background = el.hasBgBox ? 'var(--ac)' : 'var(--bd2)';
        btn.style.color = el.hasBgBox ? '#fff' : 'var(--tx1)';
        btn.innerText = el.hasBgBox ? 'BOX ON' : 'BOX OFF';
    }
    if (typeof sH === 'function') sH('Toggle Text Box BG');
    if (typeof R === 'function') R();
}

function setTextBoxProp(prop, val) {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el) return;
    el[prop] = val;
    if (typeof R === 'function') R();
}

var old_render_text_draw = "ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);";
var new_render_text_draw = `
        if (el.hasBgBox) {
            ctx.save();
            var boxPad = el.bgBoxPadding || 16;
            var boxRad = el.bgBoxRadius || 12;
            ctx.globalAlpha = (el.bgBoxOpacity !== undefined ? el.bgBoxOpacity : 85) / 100 * ((el.opacity||100)/100);
            ctx.fillStyle = el.bgBoxColor || '#161B22';
            if (typeof ctx.roundRect === 'function') {
                ctx.beginPath();
                ctx.roundRect(x - boxPad, y - boxPad, tw + boxPad * 2, fs + boxPad * 2, boxRad);
                ctx.fill();
            } else {
                ctx.fillRect(x - boxPad, y - boxPad, tw + boxPad * 2, fs + boxPad * 2);
            }
            ctx.restore();
        }
        if (el.shadowBlur || el.shadowOffsetX || el.shadowOffsetY) {
            ctx.save();
            ctx.shadowColor = el.shadowColor || '#000000';
            ctx.shadowBlur = el.shadowBlur || 0;
            ctx.shadowOffsetX = el.shadowOffsetX || 0;
            ctx.shadowOffsetY = el.shadowOffsetY || 0;
            ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);
            ctx.restore();
        } else {
            ctx.fillStyle = el.color || '#7F3DFF'; ctx.fillText(ch, x, y);
        }
`;

function executeManualColorKeyCutout() {
    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
    if (!el || el.type !== 'image' || !el.content || !el.content.complete) return;
    var targetCol = document.getElementById('manBgKeyColor')?.value || '#00FF00';
    var tol = parseInt(document.getElementById('manBgKeyTol')?.value || 40);
    var smooth = parseInt(document.getElementById('manBgKeySmooth')?.value || 15);

    var rKey = parseInt(targetCol.substr(1,2), 16), gKey = parseInt(targetCol.substr(3,2), 16), bKey = parseInt(targetCol.substr(5,2), 16);
    var W = el.content.width, H = el.content.height;
    var tc = document.createElement('canvas');
    tc.width = W; tc.height = H;
    var tctx = tc.getContext('2d');
    tctx.drawImage(el.content, 0, 0);
    var imgData = tctx.getImageData(0, 0, W, H);
    var data = imgData.data;

    var distTol = tol * 2.5;
    var smoothRange = smooth * 1.5;

    for (var i = 0; i < data.length; i += 4) {
        var dr = data[i] - rKey, dg = data[i + 1] - gKey, db = data[i + 2] - bKey;
        var dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < distTol) {
            data[i + 3] = 0;
        } else if (dist < distTol + smoothRange) {
            var alphaRatio = (dist - distTol) / smoothRange;
            data[i + 3] = Math.round(data[i + 3] * alphaRatio);
        }
    }

    tctx.putImageData(imgData, 0, 0);
    var cutImg = new Image();
    cutImg.crossOrigin = 'anonymous';
    cutImg.onload = function () {
        el.content = cutImg;
        if (typeof sH === 'function') sH('Manual Chroma Cutout');
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
        if (typeof showStatusBadge === 'function') showStatusBadge("✂️ Targeted Color Key Cutout Complete!");
    };
    cutImg.src = tc.toDataURL('image/png');
}


/* ============================================================================
   ARJONA AI BOX: IDEAS DRAWER & GHIBLI / ART STYLE IMAGE TRANSFORMER
   ============================================================================ */

function toggleAiIdeasDrawer() {
    var d = document.getElementById('aiIdeasDrawer');
    if (!d) return;
    d.style.display = d.style.display === 'none' ? 'flex' : 'none';
}

function triggerAiIdeaPrompt(promptTxt) {
    var inp = document.getElementById('aiChatInput');
    if (inp) inp.value = promptTxt;
    var d = document.getElementById('aiIdeasDrawer');
    if (d) d.style.display = 'none';
    if (typeof sendAiChat === 'function') sendAiChat();
}

window.arjonaStagedAiImg = window.arjonaStagedAiImg || null;
window.arjonaStagedAiImgSrc = window.arjonaStagedAiImgSrc || null;
window.arjonaStagedAiImgTransformed = false;

function uploadImageForAiArtStyle(ev) {
    var f = ev.target.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function(e) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            window.arjonaStagedAiImg = img;
            window.arjonaStagedAiImgSrc = e.target.result;
            window.arjonaStagedAiImgTransformed = false;
            renderAiStagedImageCard();
            if (typeof showStatusBadge === 'function') showStatusBadge("🖼️ Image loaded into Ask AI staging area. Provide a prompt or tap a style below!");
        };
        img.src = e.target.result;
    };
    r.readAsDataURL(f); ev.target.value = '';
}

function renderAiStagedImageCard() {
    var chatBody = document.getElementById('aiChatBody');
    if (!chatBody || !window.arjonaStagedAiImg) return;
    var oldCard = document.getElementById('aiStagedImageCard');
    if (oldCard) oldCard.remove();

    var card = document.createElement('div');
    card.id = 'aiStagedImageCard';
    card.className = 'ai-msg ai-msg-bot';
    card.style.cssText = 'border-left: 3px solid var(--ac); background:var(--sf2); border-radius:8px; padding:10px 12px; margin:6px 0; display:flex; flex-direction:column; gap:8px;';
    card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                <img id="aiStagedImgPreview" src="${window.arjonaStagedAiImg.src || window.arjonaStagedAiImgSrc}" style="width:48px; height:48px; border-radius:6px; object-fit:cover; border:1px solid var(--bd2); flex-shrink:0;">
                <div style="min-width:0;">
                    <div style="font-size:11px; font-weight:800; color:var(--tx1);">Staged in Ask AI (${window.arjonaStagedAiImgTransformed ? 'Transformed Style' : 'Original Upload'})</div>
                    <div style="font-size:10px; color:var(--tx2); line-height:1.3;">Transform using prompt below or tap a style! Only the final processed image will be added to canvas.</div>
                </div>
            </div>
            <button onclick="clearStagedAiImage()" style="background:transparent; border:none; color:var(--tx2); font-size:14px; cursor:pointer; padding:2px 6px;" title="Remove staged image">✕</button>
        </div>
        <div style="display:flex; gap:6px; justify-content:flex-end; border-top:1px solid var(--bd); padding-top:6px;">
            <button class="editor-back-btn" style="width:auto; height:28px; padding:0 12px; font-size:11px; background:transparent; color:var(--tx1);" onclick="clearStagedAiImage()">Discard</button>
            <button class="editor-back-btn" style="width:auto; height:28px; padding:0 14px; font-size:11px; background:linear-gradient(135deg, #58A6FF, #A371F7); color:#fff; font-weight:800; border:none;" onclick="placeStagedImageToCanvas()">➕ Place onto Canvas</button>
        </div>
    `;
    chatBody.appendChild(card);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function clearStagedAiImage() {
    window.arjonaStagedAiImg = null;
    window.arjonaStagedAiImgSrc = null;
    window.arjonaStagedAiImgTransformed = false;
    var card = document.getElementById('aiStagedImageCard');
    if (card) card.remove();
    if (typeof showStatusBadge === 'function') showStatusBadge("Staged image discarded.");
}

function placeStagedImageToCanvas() {
    if (!window.arjonaStagedAiImg) return;
    var img = window.arjonaStagedAiImg;
    if (typeof els !== 'undefined' && typeof canvas !== 'undefined') {
        els.push({
            id: 'i' + Date.now(), type: 'image', content: img,
            x: canvas.width / 2 - img.width / 2, y: canvas.height / 2 - img.height / 2,
            scale: 100, rotate: 0, opacity: 100
        });
        selId = els[els.length - 1].id;
        if (typeof selectBottomTab === 'function') selectBottomTab('image');
        if (typeof sH === 'function') sH('Placed Staged Image');
        if (typeof R === 'function') R();
        if (typeof sUI === 'function') sUI();
        if (typeof showCornerHandles === 'function') showCornerHandles(els[els.length - 1]);
        if (typeof showStatusBadge === 'function') showStatusBadge("✨ Final processed image placed onto canvas!");
    }
    clearStagedAiImage();
}

function applyAiArtStyle(styleName) {
    var targetImg = window.arjonaStagedAiImg;
    var isStaged = true;
    if (!targetImg) {
        var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
        if (!el && typeof els !== 'undefined' && els.length > 0) {
            for (var i = els.length - 1; i >= 0; i--) { if (els[i].type === 'image') { el = els[i]; break; } }
        }
        if (el && el.type === 'image' && el.content && el.content.complete) {
            targetImg = el.content;
            isStaged = false;
        }
    }

    if (!targetImg || !targetImg.complete) {
        alert('Please upload an image into Ask AI (`Upload Image` button) or select an image layer on canvas first to apply ' + styleName.toUpperCase() + ' style!');
        return;
    }

    if (typeof loader !== 'undefined' && loader) loader.style.display = 'flex';
    var ldrMsg = document.getElementById('ldrMsg');
    if (ldrMsg) ldrMsg.innerText = 'AI Art: ' + styleName.toUpperCase() + '...';

    setTimeout(function() {
        try {
            var W = targetImg.width || 600, H = targetImg.height || 400;
            var tc = document.createElement('canvas');
            tc.width = W; tc.height = H;
            var tctx = tc.getContext('2d');
            tctx.drawImage(targetImg, 0, 0, W, H);
            var imgData = tctx.getImageData(0, 0, W, H);
            var px = imgData.data;

            if (styleName === 'ghibli') {
                for (var j = 0; j < px.length; j += 4) {
                    px[j] = Math.min(255, Math.round(px[j] * 1.15 + 10));
                    px[j+1] = Math.min(255, Math.round(px[j+1] * 1.12 + 8));
                    px[j+2] = Math.min(255, Math.round(px[j+2] * 0.98));
                    px[j] = Math.round(px[j] / 32) * 32;
                    px[j+1] = Math.round(px[j+1] / 32) * 32;
                    px[j+2] = Math.round(px[j+2] / 32) * 32;
                }
            } else if (styleName === 'cyberpunk') {
                for (var j = 0; j < px.length; j += 4) {
                    px[j] = Math.min(255, Math.max(0, (px[j] - 128) * 1.4 + 128 + 35));
                    px[j+1] = Math.min(255, Math.max(0, (px[j+1] - 128) * 1.1 + 128 - 15));
                    px[j+2] = Math.min(255, Math.max(0, (px[j+2] - 128) * 1.5 + 128 + 50));
                }
            } else if (styleName === 'watercolor') {
                for (var j = 0; j < px.length; j += 4) {
                    px[j] = Math.min(255, Math.round(px[j] * 1.08));
                    px[j+1] = Math.min(255, Math.round(px[j+1] * 1.08));
                    px[j+2] = Math.min(255, Math.round(px[j+2] * 1.12));
                    px[j] = Math.round(px[j] / 40) * 40;
                    px[j+1] = Math.round(px[j+1] / 40) * 40;
                    px[j+2] = Math.round(px[j+2] / 40) * 40;
                }
            } else if (styleName === 'oilpaint' || styleName === 'sketch' || styleName === 'comic') {
                var stepQ = styleName === 'comic' ? 64 : 48;
                for (var j = 0; j < px.length; j += 4) {
                    px[j] = Math.min(255, Math.round(px[j] / stepQ) * stepQ);
                    px[j+1] = Math.min(255, Math.round(px[j+1] / stepQ) * stepQ);
                    px[j+2] = Math.min(255, Math.round(px[j+2] / stepQ) * stepQ);
                }
            }

            tctx.putImageData(imgData, 0, 0);
            var artImg = new Image();
            artImg.crossOrigin = 'anonymous';
            artImg.onload = function() {
                if (isStaged) {
                    window.arjonaStagedAiImg = artImg;
                    window.arjonaStagedAiImgSrc = artImg.src;
                    window.arjonaStagedAiImgTransformed = true;
                    renderAiStagedImageCard();
                    var chatBody = document.getElementById('aiChatBody');
                    if (chatBody) {
                        var msgEl = document.createElement('div');
                        msgEl.className = 'ai-msg ai-msg-bot';
                        msgEl.style.borderLeft = '3px solid var(--ac)';
                        msgEl.innerHTML = `✨ Processed your uploaded image with <b>${styleName.toUpperCase()}</b> style! Check the staged preview card above. Click <b>[➕ Place onto Canvas]</b> when you are ready to add only this final processed image right onto your canvas.`;
                        chatBody.appendChild(msgEl);
                        chatBody.scrollTop = chatBody.scrollHeight;
                    }
                } else {
                    var el = (typeof findEl === 'function' && typeof selId !== 'undefined' && selId) ? findEl(selId) : null;
                    if (el) {
                        el.content = artImg;
                        if (typeof sH === 'function') sH('AI Art Style: ' + styleName);
                        if (typeof R === 'function') R();
                        if (typeof sUI === 'function') sUI();
                    }
                }
                if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
                if (typeof showStatusBadge === 'function') showStatusBadge("🎨 Applied AI Art Style: " + styleName.toUpperCase());
            };
            artImg.src = tc.toDataURL('image/png');
        } catch(err) {
            if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
        }
    }, 70);
}

/* ============================================================================
   COMPREHENSIVE SAVING & EXPORTING ENGINE (`More -> Export`)
   ============================================================================ */

function openExport() {
    var modal = document.getElementById('comprehensiveExportModal');
    if (modal) modal.remove();

    var curW = canvas ? canvas.width : 1280;
    var curH = canvas ? canvas.height : 720;

    modal = document.createElement('div');
    modal.id = 'comprehensiveExportModal';
    modal.className = 'modal-overlay';
    modal.style.cssText = 'display:flex; z-index:9999999;';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:500px; width:95%; background:var(--bg); border:1px solid var(--bd2); border-radius:14px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.7);">
            <div class="modal-head" style="background:#10141C; padding:14px 18px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--bd);">
                <h2 style="font-size:15px; font-weight:800; color:var(--tx1); display:flex; align-items:center; gap:8px;">🚀 Comprehensive Save &amp; Export Engine</h2>
                <button class="modal-x" onclick="document.getElementById('comprehensiveExportModal').remove()" style="background:transparent; border:none; color:var(--tx2); font-size:16px; cursor:pointer;">✕</button>
            </div>
            <div class="modal-body" style="padding:16px; display:flex; flex-direction:column; gap:12px; max-height:80vh; overflow-y:auto;">
                <div style="font-size:11px; font-weight:700; color:var(--tx1);">1. Choose Image Format:</div>
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
                    <div class="option-card active" id="expFmtPng" onclick="selectExportFormatCard('png')" style="padding:8px;"><span>PNG<br><small style="font-weight:400;color:var(--tx3)">Transparent</small></span></div>
                    <div class="option-card" id="expFmtJpg" onclick="selectExportFormatCard('jpeg')" style="padding:8px;"><span>JPG<br><small style="font-weight:400;color:var(--tx3)">Standard</small></span></div>
                    <div class="option-card" id="expFmtWebp" onclick="selectExportFormatCard('webp')" style="padding:8px;"><span>WEBP<br><small style="font-weight:400;color:var(--tx3)">Optimized</small></span></div>
                    <div class="option-card" id="expFmtHd" onclick="selectExportFormatCard('hd')" style="padding:8px;"><span>HD / 4K<br><small style="font-weight:400;color:var(--tx3)">Ultra-Res</small></span></div>
                </div>

                <div class="sheet-sld">
                    <div class="sheet-sld-head"><label>Export Quality &amp; Compression</label><span id="val-exp-qual">95%</span></div>
                    <input type="range" id="expQualSld" min="10" max="100" value="95" oninput="document.getElementById('val-exp-qual').innerText=this.value+'%'">
                </div>

                <div style="font-size:11px; font-weight:700; color:var(--tx1); margin-top:4px;">2. Adjust Output Dimensions &amp; Size upon Export:</div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:10px; color:var(--tx2);">Width (px):</label>
                        <input type="number" id="expWidthInp" class="text-input-field" value="${curW}" oninput="syncExportDimensions('w', this.value)">
                    </div>
                    <button id="expLockRatioBtn" onclick="toggleExportLockRatio()" style="margin-top:14px; background:var(--bd); border:1px solid var(--bd2); border-radius:6px; padding:6px 10px; font-size:14px; cursor:pointer;" title="Lock Aspect Ratio">🔒</button>
                    <div style="flex:1; display:flex; flex-direction:column; gap:2px;">
                        <label style="font-size:10px; color:var(--tx2);">Height (px):</label>
                        <input type="number" id="expHeightInp" class="text-input-field" value="${curH}" oninput="syncExportDimensions('h', this.value)">
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; margin-top:2px;">
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(${curW}, ${curH})">📱 Original (${curW}×${curH})</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(1280, 720)">💎 HD (1280×720)</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(1920, 1080)">🔥 Full HD (1920×1080)</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(3840, 2160)">🚀 4K Ultra (3840×2160)</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(1080, 1080)">📸 Insta Square (1:1)</button>
                    <button class="editor-back-btn" style="height:28px; font-size:10px;" onclick="applyExportSizePreset(1080, 1920)">📱 Story / Reel (9:16)</button>
                </div>

                <div style="display:flex; gap:8px; margin-top:6px;">
                    <button class="btn-action-primary" style="flex:1; padding:12px; font-size:13px; background:linear-gradient(135deg, #58A6FF, #A371F7); box-shadow:0 6px 20px rgba(88,166,255,0.4);" onclick="executeCustomImageExport()">📥 Download &amp; Save Image Now</button>
                </div>
            </div>
        </div>
    `;
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
    document.body.appendChild(modal);
}

var activeExportFormat = 'png';
var exportRatioLocked = true;
function selectExportFormatCard(fmt) {
    activeExportFormat = fmt;
    ['expFmtPng', 'expFmtJpg', 'expFmtWebp', 'expFmtHd'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    if (fmt === 'png') document.getElementById('expFmtPng')?.classList.add('active');
    else if (fmt === 'jpeg') document.getElementById('expFmtJpg')?.classList.add('active');
    else if (fmt === 'webp') document.getElementById('expFmtWebp')?.classList.add('active');
    else if (fmt === 'hd') { document.getElementById('expFmtHd')?.classList.add('active'); applyExportSizePreset(3840, 2160); }
}

function toggleExportLockRatio() {
    exportRatioLocked = !exportRatioLocked;
    var btn = document.getElementById('expLockRatioBtn');
    if (btn) btn.innerText = exportRatioLocked ? '🔒' : '🔓';
}

function syncExportDimensions(changed, val) {
    if (!exportRatioLocked || !canvas) return;
    var num = parseInt(val) || 1;
    var origRatio = canvas.width / Math.max(1, canvas.height);
    if (changed === 'w') {
        var hInp = document.getElementById('expHeightInp');
        if (hInp) hInp.value = Math.round(num / origRatio);
    } else {
        var wInp = document.getElementById('expWidthInp');
        if (wInp) wInp.value = Math.round(num * origRatio);
    }
}

function applyExportSizePreset(w, h) {
    var wInp = document.getElementById('expWidthInp');
    var hInp = document.getElementById('expHeightInp');
    if (wInp) wInp.value = w;
    if (hInp) hInp.value = h;
}

function executeCustomImageExport() {
    var wInp = document.getElementById('expWidthInp');
    var hInp = document.getElementById('expHeightInp');
    var qualInp = document.getElementById('expQualSld');
    var targetW = wInp ? parseInt(wInp.value) : canvas.width;
    var targetH = hInp ? parseInt(hInp.value) : canvas.height;
    var qual = qualInp ? (parseInt(qualInp.value) / 100) : 0.95;
    var fmt = activeExportFormat === 'hd' ? 'png' : activeExportFormat;

    var expCanvas = document.createElement('canvas');
    expCanvas.width = targetW;
    expCanvas.height = targetH;
    var ectx = expCanvas.getContext('2d');

    ectx.drawImage(canvas, 0, 0, targetW, targetH);

    var mime = 'image/' + fmt;
    var dataUrl = expCanvas.toDataURL(mime, qual);
    var link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'ArjonaStudio_' + targetW + 'x' + targetH + '_' + Date.now() + '.' + (fmt === 'jpeg' ? 'jpg' : fmt);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    var modal = document.getElementById('comprehensiveExportModal');
    if (modal) modal.remove();
    if (typeof showStatusBadge === 'function') showStatusBadge("📥 Image Exported: " + targetW + "×" + targetH + " (" + fmt.toUpperCase() + ")");
}





/* ============================================================================
   DYNAMIC CONTEXT-SENSITIVE TOOLBAR VISIBILITY ENGINE
   Toolbars for text and images appear only after type has been added or an image dragged/uploaded
   ============================================================================ */

function syncDynamicToolbarVisibility() {
    var rowBar = document.getElementById('toolRowBar');
    if (!rowBar) return;
    // Restore .tool-raw-bar (Row Bar) to visual layout permanently (`The .tool-raw-bar (Row Bar) disappeared while updating the responsive layouts. Please fix this bug and restore it to the visual layout.`)
    rowBar.style.display = 'flex';
}

/* ============================================================================
   INTELLIGENT BI-DIRECTIONAL TOP / BOTTOM AI CONNECTION ENGINE
   Connects 'Describe your AI scene' prompt box with lower 'Arjona AI' box
   ============================================================================ */

window.arjonaGenerationHistory = window.arjonaGenerationHistory || [];
window.arjonaActiveGeneratedImg = window.arjonaActiveGeneratedImg || null;

var _orig_generateAI = typeof generateAI === 'function' ? generateAI : null;
function generateAI() {
    var pv = (document.getElementById('aiPrompt')?.value || document.getElementById('mobAiPrompt')?.value || '').trim();
    if (!pv && _orig_generateAI) return _orig_generateAI();

    var style = document.getElementById('aiStyle')?.value || document.getElementById('mobAiStyle')?.value || '';
    var aiMode = document.getElementById('aiMode')?.value || 'bg';
    var url = 'https://image.pollinations.ai/prompt/' +
        encodeURIComponent(pv + (style ? ' ' + style : '')) +
        '?width=' + (canvas?.width || 1280) + '&height=' + (canvas?.height || 720) +
        '&nologo=true&seed=' + Math.floor(Math.random() * 99999);

    if (typeof loader !== 'undefined' && loader) loader.style.display = 'flex';
    var ldrMsg = document.getElementById('ldrMsg');
    if (ldrMsg) ldrMsg.innerText = 'AI Scene Connecting...';

    var nb = new Image();
    nb.crossOrigin = 'anonymous';
    var to = setTimeout(function () { if (typeof loader !== 'undefined' && loader) loader.style.display = 'none'; }, 45000);

    nb.onload = function () {
        clearTimeout(to);
        if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
        
        window.arjonaActiveGeneratedImg = nb;
        window.arjonaGenerationHistory.push({ prompt: pv, style: style, img: nb, mode: aiMode, time: Date.now() });

        if (aiMode === 'bg') {
            aiBg = nb; bgCf = null;
            if (typeof sH === 'function') sH('Top AI Background: ' + pv.substring(0, 15));
            if (typeof R === 'function') R();
        } else {
            if (typeof addAILayer === 'function') addAILayer(nb);
        }

        var chatBody = document.getElementById('aiChatBody');
        if (chatBody) {
            var msgEl = document.createElement('div');
            msgEl.className = 'ai-msg ai-msg-bot';
            msgEl.style.borderLeft = '3px solid var(--ac)';
            msgEl.innerHTML = `✨ <b>Top Scene Linked:</b> Generated "${pv}". This image is now synced to our lower assistant session. Ask me to restyle, cut background, or apply Ghibli/Cyberpunk filters directly on it!`;
            chatBody.appendChild(msgEl);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
        if (typeof showStatusBadge === 'function') showStatusBadge('✨ Top & Bottom AI Synced: Scene Generated!');
        if (typeof syncDynamicToolbarVisibility === 'function') syncDynamicToolbarVisibility();
    };

    nb.onerror = function () {
        clearTimeout(to);
        if (typeof loader !== 'undefined' && loader) loader.style.display = 'none';
        if (typeof showStatusBadge === 'function') showStatusBadge('⚠️ Could not generate image. Check connection.');
    };
    nb.src = url;
}

function generateAIMobile() {
    var mobP = document.getElementById('mobAiPrompt');
    var topP = document.getElementById('aiPrompt');
    if (mobP && topP) topP.value = mobP.value;
    generateAI();
}

var _orig_sendAiChat = typeof sendAiChat === 'function' ? sendAiChat : null;
function sendAiChat() {
    var inp = document.getElementById('aiChatInput');
    if (!inp) return;
    var txt = inp.value.trim();
    if (!txt) return;

    var low = txt.toLowerCase();
    if (low.indexOf('generate') === 0 || low.indexOf('create') === 0 || low.indexOf('draw') === 0 || low.indexOf('make a') === 0) {
        var cleanPrompt = txt.replace(/^(generate|create|draw|make a|make an)\s+/i, '').trim();
        var topP = document.getElementById('aiPrompt');
        var mobP = document.getElementById('mobAiPrompt');
        if (topP) topP.value = cleanPrompt;
        if (mobP) mobP.value = cleanPrompt;

        var chatBody = document.getElementById('aiChatBody');
        if (chatBody) {
            var uMsg = document.createElement('div');
            uMsg.className = 'ai-msg ai-msg-user';
            uMsg.innerText = txt;
            chatBody.appendChild(uMsg);
        }
        inp.value = '';
        generateAI();
        return;
    } else if (low.indexOf('ghibli') >= 0 || low.indexOf('cyberpunk') >= 0 || low.indexOf('watercolor') >= 0 || low.indexOf('oil') >= 0 || low.indexOf('sketch') >= 0 || low.indexOf('comic') >= 0) {
        var styleToApply = 'ghibli';
        if (low.indexOf('cyberpunk') >= 0) styleToApply = 'cyberpunk';
        else if (low.indexOf('watercolor') >= 0) styleToApply = 'watercolor';
        else if (low.indexOf('oil') >= 0) styleToApply = 'oilpaint';
        else if (low.indexOf('sketch') >= 0) styleToApply = 'sketch';
        else if (low.indexOf('comic') >= 0) styleToApply = 'comic';

        var chatBody2 = document.getElementById('aiChatBody');
        if (chatBody2) {
            var uMsg2 = document.createElement('div');
            uMsg2.className = 'ai-msg ai-msg-user';
            uMsg2.innerText = txt;
            chatBody2.appendChild(uMsg2);
        }
        inp.value = '';
        if (typeof applyAiArtStyle === 'function') applyAiArtStyle(styleToApply);
        return;
    }

    if (_orig_sendAiChat) _orig_sendAiChat();
}


/*
 * Robo-LaEle - content script.
 * Varre a pagina, destaca as palavras "lá ele" com animacao sequencial,
 * mostra o HUD (Shadow DOM) e reporta o resultado ao service worker.
 *
 * Depende de LaEle.engine (analyze, rank, setCustomEntries) e LaEle.storage (getSettings).
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Guarda contra execucao dupla (o popup pode injetar o script de novo).
  // ---------------------------------------------------------------------------

  function extAlive() {
    try {
      return !!(chrome && chrome.runtime && chrome.runtime.id);
    } catch (e) {
      return false;
    }
  }

  try {
    var previous = window.__laeleRobo;
    if (previous) {
      var previousAlive = false;
      try { previousAlive = !!previous.alive(); } catch (e) { previousAlive = false; }
      if (previousAlive) return;
      // Instancia orfa (extensao recarregada): limpa o que ela deixou e assume.
      try { previous.destroy(); } catch (e) { /* ignora */ }
    }
  } catch (e) { /* ignora */ }

  // ---------------------------------------------------------------------------
  // Constantes
  // ---------------------------------------------------------------------------

  var HOST_ID = 'laele-hud-host';
  var DEFAULT_SETTINGS = { autoScan: true, animations: true, speed: 'normal', showHud: true, customWords: [] };
  var TOTAL_MS = { lento: 10000, normal: 6000, rapido: 3000 };
  var STEP_MS = { lento: 420, normal: 260, rapido: 130 };
  var MIN_TICK_MS = 50;
  var MAX_CHARS = 2000000;
  var MAX_FLOATS = 36;
  var IGNORE_SELECTOR = [
    'script', 'style', 'noscript', 'textarea', 'input', 'select', 'option', 'code', 'pre', 'svg',
    'canvas', 'iframe', 'object', 'embed', 'audio', 'video', 'template', 'head', 'title',
    '[contenteditable]:not([contenteditable="false"])', 'mark.laele-hit', '[data-laele-ignore]'
  ].join(',');

  var GRADE_COLORS = { S: '#ffd23f', A: '#ff2e88', B: '#a855f7', C: '#60a5fa', D: '#a79bbf' };

  // ---------------------------------------------------------------------------
  // Utilitarios
  // ---------------------------------------------------------------------------

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function reducedMotion() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function fmtInt(n) {
    try {
      return Math.round(n).toLocaleString('pt-BR');
    } catch (e) {
      return String(Math.round(n));
    }
  }

  function fmtMult(m) {
    return 'x' + String(Math.round(m * 10) / 10);
  }

  function yieldToMain() {
    return new Promise(function (resolve) {
      try {
        var ch = new MessageChannel();
        ch.port1.onmessage = function () { ch.port1.close(); resolve(); };
        ch.port2.postMessage(0);
      } catch (e) {
        setTimeout(resolve, 0);
      }
    });
  }

  function getLaEle() {
    return (typeof globalThis !== 'undefined' ? globalThis : window).LaEle || null;
  }

  function safeSend(message, callback) {
    try {
      if (!extAlive()) {
        if (callback) callback(null);
        return;
      }
      chrome.runtime.sendMessage(message, function (response) {
        try {
          void chrome.runtime.lastError; // consome o erro para nao poluir o console
        } catch (e) { /* ignora */ }
        if (callback) callback(response || null);
      });
    } catch (e) {
      if (callback) callback(null);
    }
  }

  function loadSettings() {
    var fallback = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      var L = getLaEle();
      if (L && L.storage && typeof L.storage.getSettings === 'function' && extAlive()) {
        return Promise.resolve(L.storage.getSettings()).then(function (s) {
          var out = Object.assign({}, fallback, s || {});
          if (!TOTAL_MS[out.speed]) out.speed = 'normal';
          if (!Array.isArray(out.customWords)) out.customWords = [];
          return out;
        }, function () { return fallback; });
      }
    } catch (e) { /* cai no padrao */ }
    return Promise.resolve(fallback);
  }

  // ---------------------------------------------------------------------------
  // Estado da varredura
  // ---------------------------------------------------------------------------

  var state = {
    id: 0,
    tickTimer: 0,
    finishNow: null,
    floats: [],
    hud: null,
    lastProgress: 0
  };

  function cancelAnimation() {
    if (state.tickTimer) {
      clearTimeout(state.tickTimer);
      state.tickTimer = 0;
    }
    state.finishNow = null;
  }

  // ---------------------------------------------------------------------------
  // Limpeza de destaques
  // ---------------------------------------------------------------------------

  function removeFloats() {
    var list = state.floats.splice(0);
    for (var i = 0; i < list.length; i++) {
      try { if (list[i].parentNode) list[i].parentNode.removeChild(list[i]); } catch (e) { /* ignora */ }
    }
    try {
      var rest = document.querySelectorAll('span.laele-float');
      for (var j = 0; j < rest.length; j++) rest[j].remove();
    } catch (e) { /* ignora */ }
  }

  function clearHighlights() {
    removeFloats();
    var marks;
    try {
      marks = document.querySelectorAll('mark.laele-hit');
    } catch (e) {
      return;
    }
    var parents = new Set();
    for (var i = 0; i < marks.length; i++) {
      var mark = marks[i];
      var parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parents.add(parent);
    }
    parents.forEach(function (p) {
      try { p.normalize(); } catch (e) { /* ignora */ }
    });
  }

  // ---------------------------------------------------------------------------
  // Coleta de blocos de texto
  // ---------------------------------------------------------------------------

  function createCollector() {
    var visCache = new Map();
    var blockCache = new Map();

    function isVisible(el) {
      var cached = visCache.get(el);
      if (cached !== undefined) return cached;
      var v = true;
      try {
        if (typeof el.checkVisibility === 'function') {
          v = el.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true });
          if (!v) {
            // display: contents nao tem caixa propria; sobe ate um ancestral com caixa.
            var up = el;
            while (up && window.getComputedStyle(up).display === 'contents') up = up.parentElement;
            v = up ? up.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true }) : false;
          }
        } else {
          v = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
        }
      } catch (e) {
        v = true;
      }
      visCache.set(el, v);
      return v;
    }

    function blockOf(el) {
      var chain = [];
      var cur = el;
      var result = null;
      while (cur) {
        var cached = blockCache.get(cur);
        if (cached) { result = cached; break; }
        chain.push(cur);
        if (cur === document.body || cur === document.documentElement) { result = cur; break; }
        var d = '';
        try { d = window.getComputedStyle(cur).display; } catch (e) { d = 'block'; }
        // inline-block/inline-flex etc. sao fronteiras: o texto dentro vira outro bloco.
        if (!(d === 'inline' || d === 'contents' || d.indexOf('ruby') === 0)) { result = cur; break; }
        cur = cur.parentElement;
      }
      if (!result) result = document.body;
      for (var i = 0; i < chain.length; i++) blockCache.set(chain[i], result);
      return result;
    }

    return function collect() {
      var body = document.body;
      if (!body) return [];
      var walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          if (n.nodeType === 1) {
            if (n.id === HOST_ID) return NodeFilter.FILTER_REJECT;
            var matched = false;
            try { matched = n.matches(IGNORE_SELECTOR); } catch (e) { matched = false; }
            if (matched) return NodeFilter.FILTER_REJECT;
            // <br> vira separador; os demais elementos so deixam a descida continuar.
            return n.tagName === 'BR' ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      var blocks = [];
      var byEl = new Map();
      var lastBlock = null;
      var pendingBreak = false;
      var chars = 0;
      var node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === 1) { pendingBreak = true; continue; }
        var value = node.nodeValue;
        if (!value) continue;
        var parent = node.parentElement;
        if (!parent || !isVisible(parent)) continue;
        var blockEl = blockOf(parent);
        var block = byEl.get(blockEl);
        if (!block) {
          block = { el: blockEl, items: [], index: blocks.length };
          byEl.set(blockEl, block);
          blocks.push(block);
        }
        var sep = block.items.length > 0 && (pendingBreak || lastBlock !== block);
        block.items.push({ node: node, sep: sep });
        lastBlock = block;
        pendingBreak = false;
        chars += value.length;
        if (chars > MAX_CHARS) break;
      }
      return blocks;
    };
  }

  // ---------------------------------------------------------------------------
  // Analise de um bloco + envolvimento dos matches em <mark>
  // ---------------------------------------------------------------------------

  function findSegment(segs, pos) {
    // primeiro segmento cujo fim ultrapassa pos
    var lo = 0;
    var hi = segs.length;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (segs[mid].end > pos) hi = mid; else lo = mid + 1;
    }
    return lo;
  }

  function processBlock(block, engine, acc) {
    var segs = [];
    var text = '';
    for (var i = 0; i < block.items.length; i++) {
      var item = block.items[i];
      var node = item.node;
      if (!node.isConnected) continue;
      var v = node.nodeValue;
      if (!v) continue;
      if (item.sep && text.length > 0) text += ' ';
      segs.push({ node: node, start: text.length, end: text.length + v.length });
      text += v;
    }
    if (text.length < 2 || !/\S/.test(text)) return;

    var result = engine.analyze(text);
    var matches = result && result.matches;
    if (!matches || !matches.length) return;
    matches = matches.slice().sort(function (a, b) { return a.start - b.start; });

    var perNode = new Map();
    var hits = [];
    var lastEnd = 0;
    var blockMax = 0;

    for (var k = 0; k < matches.length; k++) {
      var m = matches[k];
      if (!(m.end > m.start) || m.start < lastEnd || m.end > text.length) continue;
      lastEnd = m.end;

      acc.total += m.points || 0;
      acc.count += 1;
      if ((m.multiplier || 1) > acc.peakMult) acc.peakMult = m.multiplier;
      if ((m.combo || 0) > blockMax) blockMax = m.combo;
      var term = acc.terms.get(m.entryId);
      if (!term) {
        term = { entryId: m.entryId, label: m.label, count: 0, points: 0 };
        acc.terms.set(m.entryId, term);
      }
      term.count += 1;
      term.points += m.points || 0;
      acc.entryIds.push(m.entryId);

      var hit = { m: m, marks: [], pieces: 0, block: block.index };
      var s = findSegment(segs, m.start);
      for (; s < segs.length && segs[s].start < m.end; s++) {
        var seg = segs[s];
        var from = Math.max(m.start, seg.start) - seg.start;
        var to = Math.min(m.end, seg.end) - seg.start;
        if (to <= from) continue;
        var list = perNode.get(seg.node);
        if (!list) { list = []; perNode.set(seg.node, list); }
        list.push({ hit: hit, idx: hit.pieces++, from: from, to: to });
      }
      if (hit.pieces) hits.push(hit);
    }

    var rankMax = result.maxCombo || blockMax;
    if (rankMax > acc.maxCombo) acc.maxCombo = rankMax;

    perNode.forEach(function (pieces, textNode) {
      // do fim para o comeco, assim os offsets anteriores continuam validos
      pieces.sort(function (a, b) { return b.from - a.from; });
      for (var p = 0; p < pieces.length; p++) {
        var piece = pieces[p];
        try {
          if (piece.to > textNode.nodeValue.length) continue;
          if (piece.to < textNode.nodeValue.length) textNode.splitText(piece.to);
          var mid = piece.from > 0 ? textNode.splitText(piece.from) : textNode;
          var parentNode = mid.parentNode;
          if (!parentNode) continue;
          var mark = document.createElement('mark');
          mark.className = 'laele-hit';
          mark.setAttribute('data-laele-points', String(piece.hit.m.points));
          mark.setAttribute('data-laele-mult', String(piece.hit.m.multiplier));
          mark.setAttribute('data-laele-tier', String(piece.hit.m.tier || 'comum'));
          mark.setAttribute('data-laele-entry', String(piece.hit.m.entryId));
          parentNode.insertBefore(mark, mid);
          mark.appendChild(mid);
          piece.hit.marks[piece.idx] = mark;
        } catch (e) { /* um trecho que falha nao derruba a varredura */ }
      }
    });

    for (var h = 0; h < hits.length; h++) {
      hits[h].marks = hits[h].marks.filter(Boolean);
      if (hits[h].marks.length) acc.hits.push(hits[h]);
    }
  }

  // ---------------------------------------------------------------------------
  // HUD (Shadow DOM)
  // ---------------------------------------------------------------------------

  var HUD_CSS = [
    ':host { all: initial; }',
    '*, *::before, *::after { box-sizing: border-box; }',
    '.hud {',
    '  --bg: #0f0b1a; --card: #1a1428; --card2: #231a36; --border: #2f2445;',
    '  --text: #f4efff; --muted: #a79bbf; --pink: #ff2e88; --purple: #a855f7; --yellow: #ffd23f; --green: #34d399;',
    '  --grad: linear-gradient(135deg, #ff2e88, #a855f7);',
    '  position: relative; width: 290px; overflow: hidden; color: var(--text);',
    '  font: 500 13px/1.35 Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;',
    '  background: linear-gradient(180deg, rgba(35,26,54,.97), rgba(15,11,26,.97));',
    '  border: 1px solid var(--border); border-radius: 16px;',
    '  box-shadow: 0 18px 50px rgba(0,0,0,.55), 0 0 40px rgba(168,85,247,.2), 0 0 0 1px rgba(255,46,136,.08);',
    '  transform-origin: 100% 100%; animation: hud-in .38s cubic-bezier(.2,.9,.3,1.15) both;',
    '  -webkit-font-smoothing: antialiased; user-select: none;',
    '}',
    '.hud::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: var(--grad); }',
    '.head { display: flex; align-items: center; gap: 8px; padding: 12px 8px 4px 14px; }',
    '.logo { font-weight: 800; font-size: 12px; letter-spacing: .12em; text-transform: uppercase;',
    '  background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }',
    '.status { flex: 1; min-width: 0; color: var(--muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }',
    '.mini { display: none; font-weight: 800; font-size: 14px; font-variant-numeric: tabular-nums; color: var(--text); }',
    '.btns { display: flex; gap: 2px; }',
    '.btn { all: unset; box-sizing: border-box; width: 26px; height: 26px; display: grid; place-items: center; cursor: pointer;',
    '  color: var(--muted); font-size: 15px; line-height: 1; border-radius: 8px; transition: background .15s, color .15s, transform .15s; }',
    '.btn:hover { background: var(--card2); color: var(--text); }',
    '.btn:focus-visible { outline: 2px solid var(--purple); outline-offset: 1px; }',
    '.btn:active { transform: scale(.92); }',
    '.btn[disabled] { opacity: .35; cursor: default; pointer-events: none; }',
    '.body { padding: 2px 14px 14px; }',
    '.score-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; min-height: 62px; }',
    '.score-box { min-width: 0; }',
    '.score { font-size: 42px; line-height: 1.05; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.02em;',
    '  background: var(--grad); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;',
    '  filter: drop-shadow(0 0 14px rgba(255,46,136,.35)); transform-origin: 0 100%; display: inline-block; }',
    '.score.bump { animation: bump .22s ease-out; }',
    '.sub { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }',
    '.sub b { color: var(--text); font-weight: 700; }',
    '.stamp-wrap { width: 76px; height: 62px; display: grid; place-items: center; flex: none; }',
    '.stamp { display: none; flex-direction: column; align-items: center; justify-content: center; width: 56px; height: 56px;',
    '  border: 3px solid var(--sc, #ffd23f); color: var(--sc, #ffd23f); border-radius: 12px; font-weight: 900; font-size: 34px; line-height: 1;',
    '  text-shadow: 0 0 14px var(--sc, #ffd23f); box-shadow: 0 0 18px rgba(255,255,255,.04), inset 0 0 12px rgba(255,255,255,.04);',
    '  transform: rotate(-10deg); }',
    '.stamp.show { display: flex; animation: stamp .55s cubic-bezier(.2,1.4,.4,1) both; }',
    '.rank-label { margin-top: 2px; text-align: right; color: var(--muted); font-size: 11px; min-height: 14px; }',
    '.combo { margin-top: 10px; padding: 9px 11px 10px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; }',
    '.combo-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }',
    '.combo-label { color: var(--muted); font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }',
    '.combo-n { font-weight: 800; font-size: 15px; font-variant-numeric: tabular-nums; margin-left: 6px; color: var(--text); }',
    '.mult { font-weight: 900; font-size: 24px; line-height: 1; font-variant-numeric: tabular-nums; color: var(--muted); display: inline-block; transform-origin: 100% 60%; }',
    '.mult.hot { color: var(--yellow); text-shadow: 0 0 14px rgba(255,210,63,.55); }',
    '.mult.hotter { color: var(--pink); text-shadow: 0 0 16px rgba(255,46,136,.7); }',
    '.mult.pulse { animation: pulse .32s ease-out; }',
    '.bar { margin-top: 8px; height: 6px; border-radius: 99px; background: var(--border); overflow: hidden; }',
    '.bar > i { display: block; height: 100%; width: 100%; background: var(--grad); border-radius: 99px; transform-origin: 0 50%; transform: scaleX(0); }',
    '.banner { display: none; margin-top: 10px; padding: 8px 10px; text-align: center; font-weight: 900; font-size: 14px; letter-spacing: .1em; text-transform: uppercase;',
    '  color: #1a1428; border-radius: 10px; background: linear-gradient(90deg, #ffd23f, #ff9f43, #ff2e88, #ffd23f); background-size: 200% 100%; }',
    '.banner.show { display: block; animation: banner-in .5s cubic-bezier(.2,1.3,.4,1) both, shimmer 2.2s linear infinite; }',
    '.hud.min .body, .hud.min .status { display: none; }',
    '.hud.min .mini { display: block; flex: 1; }',
    '.hud.min .head { padding-bottom: 12px; }',
    '.hud.closing { animation: hud-out .25s ease-in both; }',
    '@keyframes hud-in { from { opacity: 0; transform: translateY(14px) scale(.94); } to { opacity: 1; transform: none; } }',
    '@keyframes hud-out { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(10px) scale(.96); } }',
    '@keyframes bump { 0% { transform: scale(1); } 40% { transform: scale(1.07); } 100% { transform: scale(1); } }',
    '@keyframes pulse { 0% { transform: scale(1); } 35% { transform: scale(1.35); } 100% { transform: scale(1); } }',
    '@keyframes stamp { 0% { opacity: 0; transform: rotate(-26deg) scale(3.2); } 55% { opacity: 1; transform: rotate(-8deg) scale(.9); } 75% { transform: rotate(-11deg) scale(1.08); } 100% { opacity: 1; transform: rotate(-10deg) scale(1); } }',
    '@keyframes banner-in { from { opacity: 0; transform: translateY(-8px) scale(.9); } to { opacity: 1; transform: none; } }',
    '@keyframes shimmer { from { background-position: 0 0; } to { background-position: -200% 0; } }',
    '@media (prefers-reduced-motion: reduce) {',
    '  .hud, .hud.closing, .score.bump, .mult.pulse, .stamp.show, .banner.show { animation: none !important; }',
    '  .stamp.show { opacity: 1; transform: rotate(-10deg); }',
    '  .bar > i { transition: none !important; }',
    '}'
  ].join('\n');

  function h(tag, cls, text, parent) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined && text !== null) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }

  function createHud(callbacks) {
    var host = null;
    var root = null;
    var els = {};
    var shown = 0;
    var target = 0;
    var raf = 0;
    var hover = false;
    var visible = false;
    var autoCloseTimer = 0;
    var comboTimer = 0;
    var closeTimer = 0;
    var finished = false;
    var minimized = false;

    function build() {
      host = document.createElement('div');
      host.id = HOST_ID;
      host.setAttribute('data-laele-ignore', '');
      host.style.cssText = 'all: initial !important; position: fixed !important; right: 16px !important; bottom: 16px !important;' +
        'z-index: 2147483647 !important; display: none !important; margin: 0 !important; padding: 0 !important;';
      root = host.attachShadow({ mode: 'closed' });

      var style = document.createElement('style');
      style.textContent = HUD_CSS;
      root.appendChild(style);

      var hud = h('div', 'hud', null, root);
      hud.setAttribute('role', 'status');
      hud.setAttribute('aria-live', 'polite');
      els.hud = hud;

      var head = h('div', 'head', null, hud);
      h('span', 'logo', 'Lá Ele', head);
      els.status = h('span', 'status', '', head);
      els.mini = h('span', 'mini', '0', head);

      var btns = h('div', 'btns', null, head);
      els.btnMin = h('button', 'btn', '−', btns);
      els.btnMin.type = 'button';
      els.btnMin.title = 'Minimizar';
      els.btnMin.setAttribute('aria-label', 'Minimizar');
      els.btnRescan = h('button', 'btn', '↻', btns);
      els.btnRescan.type = 'button';
      els.btnRescan.title = 'Varrer de novo';
      els.btnRescan.setAttribute('aria-label', 'Varrer de novo');
      els.btnClose = h('button', 'btn', '✕', btns);
      els.btnClose.type = 'button';
      els.btnClose.title = 'Fechar';
      els.btnClose.setAttribute('aria-label', 'Fechar');

      var body = h('div', 'body', null, hud);
      var row = h('div', 'score-row', null, body);
      var box = h('div', 'score-box', null, row);
      els.score = h('div', 'score', '0', box);
      var sub = h('div', 'sub', null, box);
      els.count = h('b', null, '0', sub);
      els.countLabel = h('span', null, ' palavras', sub);

      var stampWrap = h('div', 'stamp-wrap', null, row);
      els.stamp = h('div', 'stamp', '', stampWrap);
      els.rankLabel = h('div', 'rank-label', '', body);

      var combo = h('div', 'combo', null, body);
      var crow = h('div', 'combo-row', null, combo);
      var left = h('div', null, null, crow);
      els.comboLabel = h('span', 'combo-label', 'Combo', left);
      els.comboN = h('span', 'combo-n', '—', left);
      els.mult = h('span', 'mult', 'x1', crow);
      var bar = h('div', 'bar', null, combo);
      els.barFill = h('i', null, null, bar);

      els.banner = h('div', 'banner', 'Novo recorde!', body);

      hud.addEventListener('mouseenter', function () {
        hover = true;
        clearAutoClose();
      });
      hud.addEventListener('mouseleave', function () {
        hover = false;
        if (finished && visible) scheduleAutoClose(3500);
      });
      els.btnClose.addEventListener('click', function () { hide(true); });
      els.btnMin.addEventListener('click', function () {
        minimized = !minimized;
        hud.classList.toggle('min', minimized);
        els.btnMin.textContent = minimized ? '+' : '−';
        els.btnMin.title = minimized ? 'Expandir' : 'Minimizar';
        els.btnMin.setAttribute('aria-label', els.btnMin.title);
      });
      els.btnRescan.addEventListener('click', function () {
        if (callbacks && callbacks.onRescan) callbacks.onRescan();
      });
    }

    function attach() {
      if (!host) build();
      var parent = document.documentElement || document.body;
      if (parent && host.parentNode !== parent) parent.appendChild(host);
    }

    function render() {
      var t = fmtInt(shown);
      els.score.textContent = t;
      els.mini.textContent = t;
    }

    function loop() {
      raf = 0;
      var diff = target - shown;
      if (Math.abs(diff) < 1) {
        shown = target;
        render();
        return;
      }
      shown += diff * 0.2 + (diff > 0 ? 0.5 : -0.5);
      if ((diff > 0 && shown > target) || (diff < 0 && shown < target)) shown = target;
      render();
      raf = requestAnimationFrame(loop);
    }

    function setScore(value, instant) {
      target = value;
      if (instant || reducedMotion() || document.hidden) {
        shown = value;
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        render();
        return;
      }
      if (!raf) raf = requestAnimationFrame(loop);
      bump(els.score);
    }

    function restartAnim(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    function bump(el) {
      if (reducedMotion()) return;
      restartAnim(el, 'bump');
    }

    function clearAutoClose() {
      if (autoCloseTimer) { clearTimeout(autoCloseTimer); autoCloseTimer = 0; }
    }

    function scheduleAutoClose(ms) {
      clearAutoClose();
      autoCloseTimer = setTimeout(function () {
        autoCloseTimer = 0;
        if (hover) return; // reagenda no mouseleave
        hide(false);
      }, ms);
    }

    function show() {
      attach();
      if (!visible) {
        host.style.setProperty('display', 'block', 'important');
        els.hud.classList.remove('closing');
        visible = true;
      }
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = 0; }
    }

    function hide(immediate) {
      clearAutoClose();
      if (!visible || !host) return;
      visible = false;
      if (immediate || reducedMotion()) {
        host.style.setProperty('display', 'none', 'important');
        return;
      }
      els.hud.classList.add('closing');
      closeTimer = setTimeout(function () {
        closeTimer = 0;
        if (!visible && host) host.style.setProperty('display', 'none', 'important');
      }, 260);
    }

    function reset() {
      attach();
      finished = false;
      clearAutoClose();
      if (comboTimer) { clearTimeout(comboTimer); comboTimer = 0; }
      shown = 0;
      target = 0;
      render();
      els.count.textContent = '0';
      els.countLabel.textContent = ' palavras';
      els.stamp.classList.remove('show');
      els.stamp.textContent = '';
      els.rankLabel.textContent = '';
      els.banner.classList.remove('show');
      els.comboLabel.textContent = 'Combo';
      els.comboN.textContent = '—';
      els.mult.textContent = 'x1';
      els.mult.className = 'mult';
      els.barFill.style.transition = 'none';
      els.barFill.style.transform = 'scaleX(0)';
    }

    function setBusy(busy) {
      els.btnRescan.disabled = !!busy;
    }

    function setStatus(text) {
      els.status.textContent = text;
    }

    function setCount(n) {
      els.count.textContent = fmtInt(n);
      els.countLabel.textContent = n === 1 ? ' palavra' : ' palavras';
    }

    function setCombo(combo, mult, drainMs) {
      els.comboLabel.textContent = 'Combo';
      els.comboN.textContent = combo + 'x';
      els.mult.textContent = fmtMult(mult);
      els.mult.className = 'mult' + (mult >= 4 ? ' hotter' : (mult > 1 ? ' hot' : ''));
      if (mult > 1 && !reducedMotion()) restartAnim(els.mult, 'pulse');
      var fill = els.barFill;
      fill.style.transition = 'none';
      fill.style.transform = 'scaleX(1)';
      void fill.offsetWidth;
      if (drainMs > 0) {
        fill.style.transition = 'transform ' + drainMs + 'ms linear';
        fill.style.transform = 'scaleX(0)';
        if (comboTimer) clearTimeout(comboTimer);
        comboTimer = setTimeout(function () {
          comboTimer = 0;
          els.comboN.textContent = '—';
          els.mult.textContent = 'x1';
          els.mult.className = 'mult';
        }, drainMs + 60);
      }
    }

    function done(info) {
      finished = true;
      if (comboTimer) { clearTimeout(comboTimer); comboTimer = 0; }
      setScore(info.total, true);
      setCount(info.count);
      setBusy(false);
      els.barFill.style.transition = 'none';
      els.barFill.style.transform = 'scaleX(0)';
      if (info.count > 0) {
        els.comboLabel.textContent = 'Melhor combo';
        els.comboN.textContent = info.maxCombo + 'x';
        els.mult.textContent = fmtMult(info.peakMult || 1);
        els.mult.className = 'mult' + ((info.peakMult || 1) >= 4 ? ' hotter' : ((info.peakMult || 1) > 1 ? ' hot' : ''));
        setStatus('Concluído');
        if (info.grade && info.grade !== '-') {
          els.stamp.textContent = info.grade;
          els.stamp.style.setProperty('--sc', GRADE_COLORS[info.grade] || '#ffd23f');
          els.rankLabel.textContent = info.gradeLabel || '';
          restartAnim(els.stamp, 'show');
        }
      } else {
        els.comboLabel.textContent = 'Combo';
        els.comboN.textContent = '—';
        els.mult.textContent = 'x1';
        els.mult.className = 'mult';
        setStatus('Nada de lá ele por aqui... ainda');
        els.rankLabel.textContent = 'Nada de lá ele por aqui... ainda';
      }
      if (!hover) scheduleAutoClose(info.count > 0 ? 8000 : 4000);
    }

    function banner(text) {
      els.banner.textContent = text;
      restartAnim(els.banner, 'show');
      if (!hover) scheduleAutoClose(12000);
    }

    function destroy() {
      clearAutoClose();
      if (raf) cancelAnimationFrame(raf);
      if (comboTimer) clearTimeout(comboTimer);
      if (closeTimer) clearTimeout(closeTimer);
      if (host && host.parentNode) host.parentNode.removeChild(host);
    }

    return {
      show: show,
      hide: hide,
      reset: reset,
      setBusy: setBusy,
      setStatus: setStatus,
      setScore: setScore,
      setCount: setCount,
      setCombo: setCombo,
      done: done,
      banner: banner,
      destroy: destroy,
      isVisible: function () { return visible; }
    };
  }

  function getHud() {
    if (!state.hud) {
      state.hud = createHud({ onRescan: function () { runScan({ manual: true }); } });
    }
    return state.hud;
  }

  // ---------------------------------------------------------------------------
  // Animacao
  // ---------------------------------------------------------------------------

  function removeClassLater(els, cls, ms) {
    setTimeout(function () {
      for (var i = 0; i < els.length; i++) {
        try { els[i].classList.remove(cls); } catch (e) { /* ignora */ }
      }
    }, ms);
  }

  function lightHit(hit, fx) {
    var marks = hit.marks;
    for (var i = 0; i < marks.length; i++) marks[i].classList.add('laele-on');
    if (!fx) return;
    var scale = fx.scale && marks.length === 1;
    if (scale) {
      try { scale = marks[0].getClientRects().length === 1; } catch (e) { scale = false; }
    }
    for (var j = 0; j < marks.length; j++) marks[j].classList.add('laele-pop');
    if (scale) marks[0].classList.add('laele-pop-scale');
    removeClassLater(marks, 'laele-pop', 700);
    if (scale) removeClassLater(marks, 'laele-pop-scale', 700);
  }

  function spawnFloat(hit, points, mult) {
    var mark = hit.marks[0];
    if (!mark) return;
    var rect;
    try { rect = mark.getClientRects()[0]; } catch (e) { return; }
    if (!rect || (!rect.width && !rect.height)) return;
    if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) return;

    var el = document.createElement('span');
    el.className = 'laele-float';
    el.setAttribute('data-laele-tier', String(hit.m.tier || 'comum'));
    el.appendChild(document.createTextNode('+' + fmtInt(points)));
    if (mult > 1) {
      var sub = document.createElement('span');
      sub.className = 'laele-float-mult';
      sub.textContent = fmtMult(mult);
      el.appendChild(sub);
    }
    el.style.setProperty('left', Math.round(rect.left + rect.width / 2 + window.pageXOffset) + 'px', 'important');
    el.style.setProperty('top', Math.round(rect.top + window.pageYOffset) + 'px', 'important');
    (document.documentElement || document.body).appendChild(el);

    state.floats.push(el);
    if (state.floats.length > MAX_FLOATS) {
      var old = state.floats.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      var i = state.floats.indexOf(el);
      if (i !== -1) state.floats.splice(i, 1);
    }, 1400);
  }

  function prioritize(hits) {
    // Blocos visiveis no viewport vao primeiro; dentro de cada grupo vale a ordem do documento.
    var visibleBlocks = new Set();
    var vh = window.innerHeight || 800;
    var vw = window.innerWidth || 1200;
    for (var i = 0; i < hits.length; i++) {
      if (visibleBlocks.has(hits[i].block)) continue;
      try {
        var r = hits[i].marks[0].getBoundingClientRect();
        if ((r.width || r.height) && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw) {
          visibleBlocks.add(hits[i].block);
        }
      } catch (e) { /* ignora */ }
    }
    var first = [];
    var rest = [];
    for (var j = 0; j < hits.length; j++) {
      (visibleBlocks.has(hits[j].block) ? first : rest).push(hits[j]);
    }
    return first.concat(rest);
  }

  function sendProgress(total, count, force) {
    var t = now();
    if (!force && t - state.lastProgress < 200) return;
    state.lastProgress = t;
    safeSend({ type: 'LAELE_PROGRESS', total: total, count: count });
  }

  /**
   * Acende os destaques em ordem. Resolve true ao terminar, false se foi cancelada.
   */
  function playAnimation(order, ctx) {
    return new Promise(function (resolve) {
      var n = order.length;
      var hud = ctx.hud;
      var running = 0;
      var runningCount = 0;
      var idx = 0;

      var instant = !ctx.settings.animations || reducedMotion() || document.hidden || n === 0;

      function lightRest() {
        for (var i = idx; i < n; i++) {
          lightHit(order[i], null);
          running += order[i].m.points || 0;
          runningCount++;
        }
        idx = n;
      }

      if (instant) {
        lightRest();
        if (hud) { hud.setScore(running, true); hud.setCount(runningCount); }
        sendProgress(running, runningCount, true);
        resolve(true);
        return;
      }

      var total = TOTAL_MS[ctx.settings.speed] || TOTAL_MS.normal;
      var interval = STEP_MS[ctx.settings.speed] || STEP_MS.normal;
      if (n * interval > total) interval = total / n;
      var batch = 1;
      if (interval < MIN_TICK_MS) {
        interval = MIN_TICK_MS;
        batch = Math.ceil((n * MIN_TICK_MS) / total);
      }
      var drain = Math.min(1800, Math.max(700, interval * 3));
      var t0 = now();
      var tick = 0;

      function finish(completed) {
        state.finishNow = null;
        if (state.tickTimer) { clearTimeout(state.tickTimer); state.tickTimer = 0; }
        resolve(completed);
      }

      state.finishNow = function () {
        if (ctx.id !== state.id) return;
        lightRest();
        if (hud) { hud.setScore(running, true); hud.setCount(runningCount); }
        sendProgress(running, runningCount, true);
        finish(true);
      };

      function step() {
        state.tickTimer = 0;
        if (ctx.id !== state.id) { finish(false); return; }
        var end = Math.min(n, idx + batch);
        var best = null;
        var groupPoints = 0;
        var last = null;
        for (var i = idx; i < end; i++) {
          var hit = order[i];
          lightHit(hit, { scale: batch === 1 });
          groupPoints += hit.m.points || 0;
          if (!best || (hit.m.points || 0) > (best.m.points || 0)) best = hit;
          last = hit;
        }
        runningCount += end - idx;
        running += groupPoints;
        idx = end;

        if (best) spawnFloat(best, batch === 1 ? best.m.points : groupPoints, best.m.multiplier || 1);
        if (hud && last) {
          hud.setScore(running, false);
          hud.setCount(runningCount);
          hud.setCombo(last.m.combo || 1, last.m.multiplier || 1, drain);
        }
        sendProgress(running, runningCount, false);

        if (idx >= n) { finish(true); return; }
        tick++;
        var delay = Math.max(0, t0 + tick * interval - now());
        state.tickTimer = setTimeout(step, delay);
      }

      step();
    });
  }

  // ---------------------------------------------------------------------------
  // Varredura
  // ---------------------------------------------------------------------------

  function buildSummary(acc, engine) {
    var rank = { grade: '-', label: '' };
    try {
      var r = engine.rank(acc.total);
      if (r) rank = r;
    } catch (e) { /* mantem padrao */ }

    var terms = [];
    acc.terms.forEach(function (t) { terms.push(t); });
    terms.sort(function (a, b) { return b.points - a.points; });

    return {
      url: location.href,
      host: location.hostname,
      title: document.title || location.hostname,
      total: acc.total,
      count: acc.count,
      maxCombo: acc.maxCombo,
      grade: rank.grade,
      gradeLabel: rank.label,
      topTerms: terms.slice(0, 10),
      at: Date.now()
    };
  }

  async function runScan(opts) {
    opts = opts || {};
    var myId = ++state.id;
    cancelAnimation();
    try {
      var settings = await loadSettings();
      if (myId !== state.id) return;

      var L = getLaEle();
      var engine = L && L.engine;
      if (!engine || typeof engine.analyze !== 'function') return;

      if (typeof engine.setCustomEntries === 'function') {
        try { engine.setCustomEntries(settings.customWords || []); } catch (e) { /* palavras proprias invalidas */ }
      }

      clearHighlights();

      var hud = null;
      var wantHud = settings.showHud !== false;
      if (wantHud && opts.manual) {
        hud = getHud();
        hud.reset();
        hud.setBusy(true);
        hud.setStatus('Varrendo a página...');
        hud.show();
      } else if (!wantHud && state.hud) {
        state.hud.hide(true);
      }

      var blocks = createCollector()();
      var acc = {
        total: 0, count: 0, maxCombo: 0, peakMult: 1,
        terms: new Map(), entryIds: [], hits: []
      };

      var sliceStart = now();
      for (var i = 0; i < blocks.length; i++) {
        try {
          processBlock(blocks[i], engine, acc);
        } catch (e) { /* um bloco problematico nao derruba os demais */ }
        if (now() - sliceStart > 12) {
          await yieldToMain();
          if (myId !== state.id) return;
          sliceStart = now();
        }
      }
      if (myId !== state.id) return;

      var summary = buildSummary(acc, engine);

      if (wantHud && (opts.manual || acc.count > 0)) {
        hud = getHud();
        if (!opts.manual) {
          hud.reset();
          hud.setBusy(true);
          hud.show();
        }
        hud.setStatus(acc.count > 0 ? 'Contabilizando...' : 'Varrendo a página...');
      } else {
        hud = null;
      }

      var order = acc.hits.length ? prioritize(acc.hits) : [];
      var ctx = { id: myId, settings: settings, hud: hud };
      var completed = await playAnimation(order, ctx);
      if (!completed || myId !== state.id) return;

      if (hud) {
        hud.done({
          total: summary.total,
          count: summary.count,
          maxCombo: summary.maxCombo,
          peakMult: acc.peakMult,
          grade: summary.grade,
          gradeLabel: summary.gradeLabel
        });
      }
      sendProgress(summary.total, summary.count, true);

      safeSend({ type: 'LAELE_RESULT', summary: summary, entryIds: acc.entryIds }, function (response) {
        if (myId !== state.id || !hud || !response || summary.total <= 0) return;
        try {
          if (response.newGlobalBest) hud.banner('NOVO RECORDE!');
          else if (response.newSiteBest) hud.banner('Recorde do site!');
        } catch (e) { /* ignora */ }
      });
    } catch (e) {
      // Nunca quebrar o site.
      try { if (state.hud) state.hud.setBusy(false); } catch (e2) { /* ignora */ }
    }
  }

  // ---------------------------------------------------------------------------
  // Mensagens e inicializacao
  // ---------------------------------------------------------------------------

  function onMessage(message, sender, sendResponse) {
    try {
      if (message && message.type === 'LAELE_SCAN') {
        runScan({ manual: true });
        sendResponse({ ok: true });
      }
    } catch (e) {
      try { sendResponse({ ok: false }); } catch (e2) { /* ignora */ }
    }
    return false;
  }

  function onVisibility() {
    try {
      if (document.hidden && typeof state.finishNow === 'function') state.finishNow();
    } catch (e) { /* ignora */ }
  }

  function destroy() {
    state.id++;
    cancelAnimation();
    removeFloats();
    if (state.hud) { try { state.hud.destroy(); } catch (e) { /* ignora */ } state.hud = null; }
    try { document.removeEventListener('visibilitychange', onVisibility); } catch (e) { /* ignora */ }
  }

  window.__laeleRobo = { version: 1, alive: extAlive, destroy: destroy };

  try {
    document.addEventListener('visibilitychange', onVisibility);
    if (extAlive() && chrome.runtime.onMessage) chrome.runtime.onMessage.addListener(onMessage);
  } catch (e) { /* ignora */ }

  try {
    loadSettings().then(function (settings) {
      if (settings && settings.autoScan) {
        setTimeout(function () {
          if (!extAlive()) return;
          runScan({ manual: false });
        }, 600);
      }
    });
  } catch (e) { /* ignora */ }
})();

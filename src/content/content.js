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
  var DEFAULT_SETTINGS = { autoScan: true, animations: true, speed: 'normal', showHud: true, theme: 'dark', customWords: [] };
  var TOTAL_MS = { lento: 10000, normal: 6000, rapido: 3000 };
  var STEP_MS = { lento: 900, normal: 520, rapido: 200 };
  var WIPE_MS = { lento: 420, normal: 240, rapido: 120 };
  var MIN_TICK_MS = 50;
  var MAX_CHARS = 2000000;
  var MAX_FLOATS = 36;
  var IGNORE_SELECTOR = [
    'script', 'style', 'noscript', 'textarea', 'input', 'select', 'option', 'code', 'pre', 'svg',
    'canvas', 'iframe', 'object', 'embed', 'audio', 'video', 'template', 'head', 'title',
    '[contenteditable]:not([contenteditable="false"])', 'mark.laele-hit', '[data-laele-ignore]'
  ].join(',');

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
    return '×' + String(Math.round(m * 10) / 10).replace('.', ',');
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

  // Pele do HUD: 'dark' (Tinta, padrao) ou 'light' (Papel).
  function normTheme(t) {
    return t === 'light' ? 'light' : 'dark';
  }

  function loadSettings() {
    var fallback = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      var L = getLaEle();
      if (L && L.storage && typeof L.storage.getSettings === 'function' && extAlive()) {
        return Promise.resolve(L.storage.getSettings()).then(function (s) {
          var out = Object.assign({}, fallback, s || {});
          if (!TOTAL_MS[out.speed]) out.speed = 'normal';
          out.theme = normTheme(out.theme);
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
    lastProgress: 0,
    theme: 'dark',
    floatSeq: 0
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

  var TOP_PHRASES = 10;

  // Junta os trechos da pagina e mantem so os melhores (por points) para nao crescer sem limite.
  function collectPhrases(acc, list) {
    if (!list || !list.length) return;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (p && typeof p.text === 'string' && p.text) acc.phrases.push(p);
    }
    if (acc.phrases.length > TOP_PHRASES * 8) trimPhrases(acc);
  }

  function trimPhrases(acc) {
    acc.phrases.sort(function (a, b) { return (b.points || 0) - (a.points || 0); });
    acc.phrases.length = Math.min(acc.phrases.length, TOP_PHRASES);
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

    // Top lá ele: trechos com combo de 2+ palavras neste bloco (guardado: o engine pode nao ter phrases).
    if (acc.phrases && typeof engine.phrases === 'function') {
      try {
        collectPhrases(acc, engine.phrases(text, matches));
      } catch (e) { /* sem trechos neste bloco */ }
    }

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
      if (hit.pieces) {
        hit.v = (acc.seq++ % 3) + 1; // forma do traco (1-3) alterna pela ordem global
        hits.push(hit);
      }
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
          mark.setAttribute('data-laele-v', String(piece.hit.v || 1));
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

  // Traco de marca-texto em SVG de cor unica (viewBox 100x20): tres formas por raridade.
  var TRACE_PATHS = [
    'M2 5C22 2 64 6 98 3L99 17C70 19 32 15 1 18Z',
    'M1 4C30 6 60 1 99 5L98 16C66 18 36 14 2 17Z',
    'M3 3C34 5 70 2 97 4L99 18C62 16 30 19 1 16Z'
  ];
  var PENS = { leve: 'B8F27C', comum: 'FFE45C', pesado: 'FF9BD2', lendario: 'FFB054' };

  // Variaveis --mt-<raridade>-<1|2|3> declaradas dentro do Shadow DOM: nao vazam nem colidem com o site.
  function traceVars() {
    var out = [];
    for (var tier in PENS) {
      for (var n = 1; n <= 3; n++) {
        out.push('--mt-' + tier + '-' + n + ': url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 20\'' +
          ' preserveAspectRatio=\'none\'%3E%3Cpath d=\'' + TRACE_PATHS[n - 1] + '\' fill=\'%23' + PENS[tier] + '\'/%3E%3C/svg%3E");');
      }
    }
    return out.join('\n  ');
  }

  var HUD_CSS = [
    ':host { all: initial; }',
    '*, *::before, *::after { box-sizing: border-box; }',
    '.hud {',
    '  ' + traceVars(),
    '  --mt-leve: #B8F27C; --mt-comum: #FFE45C; --mt-pesado: #FF9BD2; --mt-lendario: #FFB054; --mt-tinta: #17141f;',
    '  --bg: #17141f; --panel: #201c2b; --raised: #2b2639; --line: #363046; --text: #f6f2ea; --soft: #cdc6da; --muted: #a29bb5;',
    '  --nota-d: #4a4359; --nota-d-txt: #f6f2ea; --foco: #FFE45C;',
    '  --f-ui: "LaEle Inter", "Helvetica Neue", Arial, sans-serif;',
    '  --f-voz: "LaEle Bricolage", "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif;',
    '  --ease: cubic-bezier(.2,.8,.2,1); --mola: cubic-bezier(.34,1.56,.64,1);',
    '  position: relative; width: 248px; padding: 12px 14px 14px; color: var(--text);',
    '  font: 400 12px/1.35 var(--f-ui);',
    '  background: var(--bg); border-radius: 16px;',
    '  box-shadow: 0 0 0 1px var(--line), 0 16px 40px rgba(23,20,31,.28);',
    '  transition: opacity .2s, transform .2s var(--ease), background .24s var(--ease), color .24s var(--ease);',
    '  -webkit-font-smoothing: antialiased; user-select: none;',
    '}',
    '.hud[data-theme="light"] {',
    '  --bg: #fbf8f1; --panel: #f3eee3; --raised: #e9e2d4; --line: #ddd4c2; --text: #1b1822; --soft: #4a4556; --muted: #696374;',
    '  --nota-d: #ddd4c2; --nota-d-txt: #1b1822; --foco: #17141f;',
    '}',
    '.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }',
    '.brand { display: flex; align-items: center; gap: 8px; font: 800 17px/1 var(--f-voz); letter-spacing: -.03em; }',
    '.logo { display: block; flex: none; width: 24px; height: 24px; }',
    '.pupil { transition: transform .22s var(--ease); }',
    '.mini-box { display: none; flex: 1; min-width: 0; text-align: right; padding-right: 6px; }',
    '.mini { font: 800 20px/1 var(--f-voz); letter-spacing: -.025em; font-variant-numeric: tabular-nums; }',
    '.btns { display: flex; gap: 2px; }',
    '.btn { all: unset; box-sizing: border-box; width: 26px; height: 26px; display: grid; place-items: center; cursor: pointer;',
    '  color: var(--muted); border-radius: 8px; transition: background .16s var(--ease), color .16s var(--ease); }',
    '.btn svg { width: 14px; height: 14px; display: block; }',
    '.btn:hover { background: var(--raised); color: var(--text); }',
    '.btn:focus-visible { outline: 2px solid var(--foco); outline-offset: 3px; }',
    '.btn[disabled] { opacity: .35; cursor: default; pointer-events: none; }',
    '.main { display: flex; align-items: center; justify-content: space-between; gap: 10px; }',
    '.score-box { min-width: 0; }',
    '.score-box .score-wrap { display: block; width: fit-content; }',
    '.score-wrap { position: relative; display: inline-block; isolation: isolate; }',
    '.score-wrap::after { content: ""; position: absolute; left: -4px; right: -6px; bottom: 1px; height: 13px; z-index: -1;',
    '  background: var(--mt-comum-2) no-repeat 0 0 / 100% 100%; opacity: .9; transform-origin: 0 50%; }',
    '.mini-wrap::after { left: -3px; right: -4px; height: 8px; }',
    '.score-wrap.risca::after { animation: risca .38s var(--ease); }',
    '.score { display: inline-block; font: 800 40px/1 var(--f-voz); letter-spacing: -.025em; font-variant-numeric: tabular-nums; }',
    '.sub { margin-top: 4px; color: var(--muted); font-variant-numeric: tabular-nums; }',
    '.stamp { flex: none; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 10px;',
    '  background: var(--nota-d); color: var(--nota-d-txt); transform: rotate(-6deg);',
    '  font: 800 26px/1 var(--f-voz); letter-spacing: -.025em; transition: background .2s var(--ease); }',
    '.stamp[data-g="C"] { background: var(--mt-leve); color: var(--mt-tinta); }',
    '.stamp[data-g="B"] { background: var(--mt-comum); color: var(--mt-tinta); }',
    '.stamp[data-g="A"] { background: var(--mt-pesado); color: var(--mt-tinta); }',
    '.stamp[data-g="S"] { background: var(--mt-lendario); color: var(--mt-tinta); }',
    '.stamp.pula { animation: carimbo .42s var(--mola); }',
    '.rank-label { margin: 8px 0 10px; min-height: 18px; font-size: 13px; font-weight: 500; }',
    '.combo { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 10px; align-items: center; color: var(--muted); }',
    '.combo-n { font-variant-numeric: tabular-nums; margin-left: 3px; }',
    '.bar { position: relative; height: 8px; }',
    '.bar::before { content: ""; position: absolute; inset: 2px 0; background: var(--raised); border-radius: 3px; }',
    '.bar > i { position: absolute; inset: 0; display: block; background: var(--mt-lendario-1) no-repeat 0 0 / 100% 100%;',
    '  transform-origin: 0 50%; transform: scaleX(0); }',
    '.mult { font: 800 15px/1 var(--f-voz); letter-spacing: -.025em; color: var(--text); font-variant-numeric: tabular-nums; }',
    '.banner { display: none; margin-top: 10px; font-size: 13px; font-weight: 600; }',
    '.banner.show { display: block; }',
    '.mt { display: inline; color: var(--mt-tinta); padding: .08em .3em .1em; background: var(--mt-pesado-2) no-repeat 50% 55% / 100% 100%;',
    '  -webkit-box-decoration-break: clone; box-decoration-break: clone; }',
    '.banner.show .mt { animation: tracar .32s var(--ease) both; }',
    '.hud.min .body { display: none; }',
    '.hud.min .mini-box { display: block; }',
    '.hud.min .head { margin-bottom: 0; }',
    '.hud.min .nome { display: none; }', // sem o nome, o placar cabe entre o logo e os botoes
    '.hud.closing { opacity: 0; transform: translateY(6px); pointer-events: none; }',
    '@keyframes risca { from { transform: scaleX(0); } to { transform: scaleX(1); } }',
    '@keyframes tracar { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }',
    '@keyframes carimbo {',
    '  0% { transform: rotate(-6deg) scale(1.45); }',
    '  60% { transform: rotate(3deg) scale(.94); }',
    '  100% { transform: rotate(-6deg) scale(1); }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  .hud, .hud.closing, .stamp.pula, .score-wrap.risca::after, .banner.show .mt { animation: none !important; transition: none !important; }',
    '  .pupil, .btn, .stamp, .bar > i { transition: none !important; }',
    '}'
  ].join('\n');

  function h(tag, cls, text, parent) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined && text !== null) el.textContent = text;
    if (parent) parent.appendChild(el);
    return el;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PUPIL_REACH = 8; // unidades (de 128) que a pupila anda na direcao da palavra
  var ICON_MIN = 'M6 12h12';
  var ICON_PLUS = 'M12 5v14M5 12h14';
  var ICON_RESCAN = 'M19 12a7 7 0 1 1-2.1-5M19 4v4h-4';
  var ICON_CLOSE = 'M6 6l12 12M18 6L6 18';

  function svgEl(tag, attrs, parent) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, String(attrs[k]));
    if (parent) parent.appendChild(el);
    return el;
  }

  // Icone de traco 2 px; devolve o <path> para poder trocar o desenho (minimizar/expandir).
  function iconButton(btn, d) {
    var s = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, btn);
    return svgEl('path', { d: d, fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, s);
  }

  // Logo de olhos do cabecalho; as pupilas viram para a palavra marcada.
  function buildLogo(parent) {
    var s = svgEl('svg', { viewBox: '0 0 128 128', 'class': 'logo', 'aria-hidden': 'true', focusable: 'false' }, parent);
    svgEl('rect', { width: 128, height: 128, rx: 30, fill: '#FFE45C' }, s);
    svgEl('ellipse', { cx: 41, cy: 70, rx: 20, ry: 25, fill: '#ffffff', stroke: '#17141f', 'stroke-width': 7 }, s);
    svgEl('ellipse', { cx: 89, cy: 70, rx: 20, ry: 25, fill: '#ffffff', stroke: '#17141f', 'stroke-width': 7 }, s);
    var pupils = [
      svgEl('circle', { 'class': 'pupil', cx: 41, cy: 72, r: 10, fill: '#17141f' }, s),
      svgEl('circle', { 'class': 'pupil', cx: 89, cy: 72, r: 10, fill: '#17141f' }, s)
    ];
    svgEl('path', { d: 'M72 35Q89 25 107 31', fill: 'none', stroke: '#17141f', 'stroke-width': 7, 'stroke-linecap': 'round' }, s);
    return { el: s, pupils: pupils };
  }

  function createHud(callbacks) {
    var host = null;
    var root = null;
    var els = {};
    var shown = 0;
    var target = 0;
    var from = 0;
    var t0 = 0;
    var raf = 0;
    var hover = false;
    var visible = false;
    var autoCloseTimer = 0;
    var comboTimer = 0;
    var closeTimer = 0;
    var finished = false;
    var minimized = false;
    var theme = 'dark';

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
      hud.setAttribute('data-theme', theme);
      els.hud = hud;

      var head = h('div', 'head', null, hud);
      var brand = h('span', 'brand', null, head);
      var logo = buildLogo(brand);
      els.logo = logo.el;
      els.pupils = logo.pupils;
      // pupilas nascem de lado, como no icone
      for (var pi = 0; pi < els.pupils.length; pi++) els.pupils[pi].style.transform = 'translate(' + PUPIL_REACH + 'px,0px)';
      h('span', 'nome', 'Lá ele', brand);
      var miniBox = h('span', 'mini-box', null, head);
      els.miniWrap = h('span', 'score-wrap mini-wrap', null, miniBox);
      els.mini = h('span', 'mini', '0', els.miniWrap);

      var btns = h('div', 'btns', null, head);
      els.btnMin = h('button', 'btn', null, btns);
      els.btnMin.type = 'button';
      els.btnMin.title = 'Minimizar';
      els.btnMin.setAttribute('aria-label', 'Minimizar');
      els.minPath = iconButton(els.btnMin, ICON_MIN);
      els.btnRescan = h('button', 'btn', null, btns);
      els.btnRescan.type = 'button';
      els.btnRescan.title = 'Varrer de novo';
      els.btnRescan.setAttribute('aria-label', 'Varrer de novo');
      iconButton(els.btnRescan, ICON_RESCAN);
      els.btnClose = h('button', 'btn', null, btns);
      els.btnClose.type = 'button';
      els.btnClose.title = 'Fechar';
      els.btnClose.setAttribute('aria-label', 'Fechar');
      iconButton(els.btnClose, ICON_CLOSE);

      var body = h('div', 'body', null, hud);
      var row = h('div', 'main', null, body);
      var box = h('div', 'score-box', null, row);
      els.scoreWrap = h('span', 'score-wrap', null, box);
      els.score = h('span', 'score', '0', els.scoreWrap);
      var sub = h('div', 'sub', null, box);
      els.count = h('span', null, '0', sub);
      els.countLabel = h('span', null, ' palavras', sub);
      els.stamp = h('div', 'stamp', '–', row);
      els.stamp.setAttribute('role', 'img');
      els.stamp.setAttribute('data-g', '-');
      els.stamp.setAttribute('aria-label', 'Sem nota');
      els.rankLabel = h('div', 'rank-label', '', body);

      var combo = h('div', 'combo', null, body);
      var comboText = h('span', null, null, combo);
      els.comboLabel = h('span', null, 'Combo', comboText);
      els.comboN = h('span', 'combo-n', '0', comboText);
      var bar = h('div', 'bar', null, combo);
      els.barFill = h('i', null, null, bar);
      els.mult = h('span', 'mult', '×1', combo);

      els.banner = h('div', 'banner', null, body);
      els.bannerTxt = h('span', 'mt', 'Novo recorde', els.banner);

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
        els.minPath.setAttribute('d', minimized ? ICON_PLUS : ICON_MIN);
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

    function restartAnim(el, cls) {
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
    }

    // Nota no quadrado: troca a letra e pula 1,3x -> 1 quando a faixa muda.
    function setGrade(grade, pop) {
      var g = grade && grade !== '-' ? grade : '-';
      if (els.stamp.getAttribute('data-g') === g) return;
      els.stamp.setAttribute('data-g', g);
      els.stamp.textContent = g === '-' ? '–' : g;
      els.stamp.setAttribute('aria-label', g === '-' ? 'Sem nota' : 'Nota ' + g);
      if (pop && !reducedMotion()) restartAnim(els.stamp, 'pula');
    }

    // Pele do HUD: 'dark' (Tinta) ou 'light' (Papel); troca ao vivo.
    function setTheme(t) {
      theme = t === 'light' ? 'light' : 'dark';
      if (els.hud) els.hud.setAttribute('data-theme', theme);
    }

    function render(pop) {
      var t = fmtInt(shown);
      els.score.textContent = t;
      els.mini.textContent = t;
      try {
        var L = getLaEle();
        if (L && L.engine && typeof L.engine.rank === 'function') {
          var r = L.engine.rank(shown);
          if (r) setGrade(r.grade, pop);
        }
      } catch (e) { /* a nota final vem do done() */ }
    }

    // Contagem dos pontos: 320 ms, ease-out.
    function loop() {
      raf = 0;
      var k = Math.min(1, (now() - t0) / 320);
      shown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      render(true);
      if (k < 1) raf = requestAnimationFrame(loop);
    }

    // O traco sob o placar se redesenha da esquerda (380 ms) quando a pontuacao muda.
    function redraw() {
      if (reducedMotion()) return;
      restartAnim(els.scoreWrap, 'risca');
      restartAnim(els.miniWrap, 'risca');
    }

    function setScore(value, instant) {
      if (value !== target) redraw();
      target = value;
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (instant || reducedMotion() || document.hidden) {
        shown = value;
        render(false);
        return;
      }
      from = shown;
      t0 = now();
      raf = requestAnimationFrame(loop);
    }

    // Olhar: pupilas andam ate 8/128 na direcao da palavra; sem alvo, ficam de lado como no icone.
    function look(el) {
      if (!els.pupils) return;
      var dx = PUPIL_REACH;
      var dy = 0;
      if (el && !reducedMotion()) {
        try {
          var a = el.getBoundingClientRect();
          var b = els.logo.getBoundingClientRect();
          var vx = a.left + a.width / 2 - (b.left + b.width / 2);
          var vy = a.top + a.height / 2 - (b.top + b.height / 2);
          var m = Math.sqrt(vx * vx + vy * vy);
          if (m > 0) { dx = vx / m * PUPIL_REACH; dy = vy / m * PUPIL_REACH; }
        } catch (e) { /* sem alvo, de lado */ }
      }
      var tf = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      for (var i = 0; i < els.pupils.length; i++) els.pupils[i].style.transform = tf;
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
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      shown = 0;
      target = 0;
      render(false);
      setGrade('-', false);
      look(null);
      els.count.textContent = '0';
      els.countLabel.textContent = ' palavras';
      els.rankLabel.textContent = '';
      els.banner.classList.remove('show');
      els.comboLabel.textContent = 'Combo';
      els.comboN.textContent = '0';
      els.mult.textContent = '×1';
      els.barFill.style.transition = 'none';
      els.barFill.style.transform = 'scaleX(0)';
    }

    function setBusy(busy) {
      els.btnRescan.disabled = !!busy;
    }

    // O texto de estado ocupa a linha da nota ate a varredura terminar.
    function setStatus(text) {
      els.rankLabel.textContent = text;
    }

    function setCount(n) {
      els.count.textContent = fmtInt(n);
      els.countLabel.textContent = n === 1 ? ' palavra' : ' palavras';
    }

    function setCombo(combo, mult, drainMs) {
      els.comboLabel.textContent = 'Combo';
      els.comboN.textContent = String(combo);
      els.mult.textContent = fmtMult(mult);
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
          els.comboN.textContent = '0';
          els.mult.textContent = '×1';
        }, drainMs + 60);
      }
    }

    function done(info) {
      finished = true;
      if (comboTimer) { clearTimeout(comboTimer); comboTimer = 0; }
      setScore(info.total, true);
      setCount(info.count);
      setBusy(false);
      look(null);
      els.barFill.style.transition = 'none';
      // no fim, a barra mostra o pico do multiplicador (×10 enche)
      var pico = info.count > 0 ? Math.min(1, (info.peakMult || 1) / 10) : 0;
      els.barFill.style.transform = 'scaleX(' + pico + ')';
      if (info.count > 0) {
        els.comboLabel.textContent = 'Melhor combo';
        els.comboN.textContent = String(info.maxCombo);
        els.mult.textContent = fmtMult(info.peakMult || 1);
        els.rankLabel.textContent = '';
        if (info.grade && info.grade !== '-') {
          setGrade(info.grade, true);
          els.rankLabel.textContent = info.gradeLabel || '';
        }
      } else {
        els.comboLabel.textContent = 'Combo';
        els.comboN.textContent = '0';
        els.mult.textContent = '×1';
        els.rankLabel.textContent = 'Nada de lá ele por aqui... ainda';
      }
      if (!hover) scheduleAutoClose(info.count > 0 ? 8000 : 4000);
    }

    function banner(text) {
      els.bannerTxt.textContent = text;
      els.banner.classList.remove('show');
      void els.banner.offsetWidth;
      els.banner.classList.add('show');
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
      setTheme: setTheme,
      reset: reset,
      setBusy: setBusy,
      setStatus: setStatus,
      setScore: setScore,
      setCount: setCount,
      setCombo: setCombo,
      look: look,
      done: done,
      banner: banner,
      destroy: destroy,
      isVisible: function () { return visible; }
    };
  }

  function getHud() {
    if (!state.hud) {
      state.hud = createHud({ onRescan: function () { runScan({ manual: true }); } });
      state.hud.setTheme(state.theme);
    }
    return state.hud;
  }

  // Guarda a pele e repassa ao HUD (se ja existir); o HUD novo nasce com a pele guardada.
  function applyTheme(theme) {
    state.theme = normTheme(theme);
    if (state.hud) state.hud.setTheme(state.theme);
  }

  // O popup grava settings.theme: o HUD de todas as abas acompanha ao vivo.
  function onStorageChanged(changes, area) {
    try {
      if (area && area !== 'local') return;
      var ch = changes && changes.settings;
      if (ch && ch.newValue && ch.newValue.theme !== undefined) applyTheme(ch.newValue.theme);
    } catch (e) { /* ignora */ }
  }

  // ---------------------------------------------------------------------------
  // Animacao
  // ---------------------------------------------------------------------------

  // O marca-texto cresce da esquerda em wipeMs (definido por marca, lido pelo content.css).
  function lightHit(hit, wipeMs) {
    var marks = hit.marks;
    for (var i = 0; i < marks.length; i++) {
      marks[i].style.setProperty('--laele-wipe', wipeMs + 'ms', 'important');
      marks[i].classList.add('laele-on');
    }
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
    // girada ±4°, alternando a cada etiqueta
    el.style.setProperty('--laele-giro', (state.floatSeq++ % 2 ? 4 : -4) + 'deg');
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
    }, 1100);
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
          lightHit(order[i], 0);
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
      var wipe = WIPE_MS[ctx.settings.speed] || WIPE_MS.normal;
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
          lightHit(hit, wipe);
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
          hud.look(last.marks[0]);
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
      applyTheme(settings.theme);

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
        terms: new Map(), entryIds: [], hits: [], phrases: [], seq: 0
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

      trimPhrases(acc);
      safeSend({ type: 'LAELE_RESULT', summary: summary, entryIds: acc.entryIds, phrases: acc.phrases }, function (response) {
        if (myId !== state.id || !hud || !response || summary.total <= 0) return;
        try {
          // prioridade: Novo recorde > Entrou no Top lá ele > Recorde do site
          if (response.newGlobalBest) hud.banner('Novo recorde');
          else if (response.newTopPhrase) hud.banner('Entrou no Top lá ele');
          else if (response.newSiteBest) hud.banner('Recorde do site');
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
    try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch (e) { /* ignora */ }
  }

  window.__laeleRobo = { version: 1, alive: extAlive, destroy: destroy };

  try {
    document.addEventListener('visibilitychange', onVisibility);
    if (extAlive() && chrome.runtime.onMessage) chrome.runtime.onMessage.addListener(onMessage);
    if (extAlive() && chrome.storage && chrome.storage.onChanged) chrome.storage.onChanged.addListener(onStorageChanged);
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

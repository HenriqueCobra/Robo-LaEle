/* Robo-LaEle — popup (dropdown da extensão) */
(function () {
  'use strict';

  var LaEle = globalThis.LaEle || {};
  var storage = LaEle.storage;
  var dictionary = LaEle.dictionary;
  var engine = LaEle.engine;

  var SCAN_TIMEOUT_MS = 15000;
  var TAB_KEY = 'laele.popup.tab';
  var TABS = ['records', 'dex', 'settings'];
  var SPEEDS = ['lento', 'normal', 'rapido'];
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var NO_CONTENT_RE = /Receiving end does not exist|Could not establish connection/i;

  var TIERS = {
    leve: { label: 'Leve' },
    comum: { label: 'Comum' },
    pesado: { label: 'Pesado' },
    lendario: { label: 'Lendário' }
  };

  var DEFAULT_SETTINGS = {
    autoScan: true,
    animations: true,
    speed: 'normal',
    showHud: true,
    customWords: []
  };

  var state = {
    ready: false,
    tabId: null,
    tabUrl: '',
    host: '',
    blocked: null,
    summary: null,
    scanning: false,
    scanTimer: null,
    liveRecord: false,
    settings: Object.assign({}, DEFAULT_SETTINGS),
    records: null,
    collection: {},
    dexFilter: 'all',
    dexQuery: '',
    shownScore: 0,
    countRaf: 0,
    toastTimer: null,
    resetTimer: null,
    activeTab: 'records'
  };

  var els = {};
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* Utilidades                                                          */
  /* ------------------------------------------------------------------ */

  function $(id) { return document.getElementById(id); }

  function make(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function icon(id, cls) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('pt-BR');
  }

  function compact(n) {
    n = Number(n || 0);
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',').replace(',0', '') + 'M';
    if (n >= 1e4) return Math.round(n / 1e3) + 'k';
    return fmt(n);
  }

  function fmtCoef(n) {
    return '×' + Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }

  function relTime(ts) {
    if (!ts) return '';
    var diff = Math.max(0, Date.now() - ts) / 1000;
    if (diff < 45) return 'agora';
    var min = Math.round(diff / 60);
    if (min < 60) return 'há ' + min + ' min';
    var h = Math.round(diff / 3600);
    if (h < 24) return 'há ' + h + ' h';
    var d = Math.round(diff / 86400);
    if (d < 2) return 'ontem';
    if (d < 7) return 'há ' + d + ' dias';
    if (d < 30) {
      var w = Math.round(d / 7);
      return 'há ' + w + (w === 1 ? ' semana' : ' semanas');
    }
    try {
      return new Date(ts).toLocaleDateString('pt-BR');
    } catch (e) {
      return '';
    }
  }

  function hueOf(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 360;
  }

  function paintAvatar(node, host) {
    var key = host || '?';
    var hue = hueOf(key);
    node.textContent = (key.replace(/^www\./, '').charAt(0) || '?').toUpperCase();
    node.style.background =
      'linear-gradient(145deg, hsl(' + hue + ' 78% 58%), hsl(' + ((hue + 42) % 360) + ' 72% 40%))';
  }

  function stripWww(host) {
    return String(host || '').replace(/^www\./i, '').toLowerCase();
  }

  function norm(str) {
    try {
      if (engine && typeof engine.normalize === 'function') return engine.normalize(str);
    } catch (e) { /* usa o plano B */ }
    return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function lsGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }

  function lsSet(key, val) {
    try { window.localStorage.setItem(key, val); } catch (e) { /* ignora */ }
  }

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function animationsOn() {
    return !reducedMotion && state.settings.animations !== false;
  }

  function toast(text, kind) {
    var t = els.toast;
    t.textContent = text;
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.hidden = false;
    // reinicia a animação de entrada
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Dicionário / entradas                                               */
  /* ------------------------------------------------------------------ */

  function allEntries() {
    var base = (dictionary && Array.isArray(dictionary.entries)) ? dictionary.entries : [];
    var seen = {};
    var out = [];
    base.forEach(function (e) {
      if (!e || seen[e.id]) return;
      seen[e.id] = true;
      out.push(e);
    });
    (state.settings.customWords || []).forEach(function (e) {
      if (!e || seen[e.id]) return;
      seen[e.id] = true;
      out.push(Object.assign({ custom: true }, e));
    });
    return out;
  }

  var tierMap = {};
  function tierOf(entryId) {
    if (!tierMap.__built) {
      tierMap = { __built: true };
      allEntries().forEach(function (e) { tierMap[e.id] = e.tier; });
    }
    return tierMap[entryId] || null;
  }

  var TIER_COLOR = { leve: '#34d399', comum: '#60a5fa', pesado: '#ff2e88', lendario: '#ffd23f' };

  /* ------------------------------------------------------------------ */
  /* Aba atual                                                           */
  /* ------------------------------------------------------------------ */

  function classifyUrl(url) {
    if (!url) {
      return { icon: 'internal', title: 'Não consegui ler esta aba', text: 'Abra um site comum (http ou https) e tente de novo.' };
    }
    var u;
    try { u = new URL(url); } catch (e) {
      return { icon: 'internal', title: 'Endereço não reconhecido', text: 'Abra um site comum (http ou https) e tente de novo.' };
    }
    var path = u.pathname.toLowerCase();
    var isPdf = /\.pdf$/.test(path);
    var store = (u.hostname === 'chromewebstore.google.com') ||
      (u.hostname === 'chrome.google.com' && path.indexOf('/webstore') === 0);

    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      if (isPdf) return { icon: 'pdf', title: 'PDF não dá para varrer', text: 'O Chrome abre PDFs num leitor fechado, sem acesso ao texto.' };
      if (u.protocol === 'file:') return { icon: 'internal', title: 'Arquivo local', text: 'Arquivos do computador ficam de fora. Abra a página por um endereço http ou https.' };
      return { icon: 'internal', title: 'Página interna do navegador', text: 'O Chrome não deixa extensões entrarem aqui. Abra um site comum para varrer.' };
    }
    if (store) return { icon: 'store', title: 'Loja do Chrome é zona protegida', text: 'O Chrome bloqueia extensões nessa loja. Vá para outro site e tente lá.' };
    if (isPdf) return { icon: 'pdf', title: 'PDF não dá para varrer', text: 'O Chrome abre PDFs num leitor fechado, sem acesso ao texto.' };
    return null;
  }

  async function resolveTab() {
    var tab = null;
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      tab = tabs && tabs[0];
    } catch (e) { /* tab continua nula */ }

    if (!tab) {
      state.blocked = { icon: 'internal', title: 'Não achei a aba atual', text: 'Feche e abra o painel de novo.' };
      return;
    }
    state.tabId = tab.id;
    state.tabUrl = tab.url || tab.pendingUrl || '';
    try { state.host = new URL(state.tabUrl).hostname; } catch (e) { state.host = ''; }
    state.blocked = classifyUrl(state.tabUrl);

    if (!state.blocked && storage && storage.getTabSummary) {
      try {
        var s = await storage.getTabSummary(tab.id);
        // descarta resultado de uma página anterior da mesma aba
        if (s && (!s.host || !state.host || stripWww(s.host) === stripWww(state.host))) state.summary = s;
      } catch (e) { /* sem resumo */ }
    }
  }

  function renderHero() {
    var h = els.hero;
    var s = state.summary;
    var st;

    if (state.blocked) st = 'blocked';
    else if (s && s.count > 0) st = 'result';
    else if (state.scanning) st = 'scanning';
    else if (s) st = 'clean';
    else if (!state.ready) st = 'loading';
    else st = 'empty';

    h.dataset.state = st;
    h.classList.toggle('is-scanning', state.scanning && !state.blocked);
    if (state.blocked) h.dataset.icon = state.blocked.icon; else delete h.dataset.icon;

    var msg = {
      loading: ['Carregando…', ''],
      empty: ['Nenhum lá ele detectado ainda', 'Toque em varrer página para caçar duplo sentido por aqui.'],
      clean: ['Página limpinha', 'Varri tudo e não achei nenhum lá ele. Que inocência.'],
      scanning: ['Varrendo a página…', 'Caçando duplo sentido em cada parágrafo.'],
      blocked: state.blocked ? [state.blocked.title, state.blocked.text] : ['', '']
    }[st];
    if (msg) {
      els.msgTitle.textContent = msg[0];
      els.msgText.textContent = msg[1];
      els.msgText.hidden = !msg[1];
    }

    els.scanPill.hidden = !(st === 'result' && state.scanning);
    els.recordPill.hidden = !(st === 'result' && state.liveRecord && !state.scanning);

    if (st === 'result') {
      paintAvatar(els.heroAvatar, state.host || s.host);
      els.heroHost.textContent = (state.host || s.host || '').replace(/^www\./, '') || 'esta página';
      showScore(Number(s.total) || 0);

      var grade = s.grade || '-';
      els.grade.dataset.grade = grade;
      els.heroMain.dataset.grade = grade;
      els.gradeLetter.textContent = grade;
      els.grade.setAttribute('aria-label', 'Nota ' + grade + (s.gradeLabel ? ': ' + s.gradeLabel : ''));
      els.gradeLabel.textContent = s.gradeLabel || '';

      els.statWords.textContent = fmt(s.count);
      var combo = Number(s.maxCombo) || 0;
      els.statCombo.textContent = combo + 'x';
      els.statMult.textContent = '';
      els.statMult.removeAttribute('title');
      if (combo > 1 && engine && engine.CONFIG) {
        var c = engine.CONFIG;
        var mult = Math.min(c.maxMultiplier, 1 + c.comboStep * (combo - 1));
        els.statMult.textContent = fmtCoef(mult);
        els.statMult.title = 'Multiplicador máximo atingido: ' + fmtCoef(mult);
      }
      renderTerms(s.topTerms || []);
    }

    renderScanButton();
  }

  function renderTerms(terms) {
    var list = els.terms;
    list.textContent = '';
    var top = terms.slice(0, 3);
    els.termsWrap.hidden = top.length === 0;
    top.forEach(function (t) {
      var li = make('li', 'chip');
      var color = TIER_COLOR[tierOf(t.entryId)] || '#a79bbf';
      li.style.setProperty('--c', color);
      li.title = t.label + ': ' + fmt(t.count) + 'x, ' + fmt(t.points) + ' pontos';
      li.appendChild(make('i', 'chip-dot'));
      li.appendChild(make('span', 'chip-label', t.label));
      li.appendChild(make('span', 'chip-n', '×' + fmt(t.count)));
      list.appendChild(li);
    });
  }

  function showScore(to) {
    cancelAnimationFrame(state.countRaf);
    var from = state.shownScore;
    if (from === to) { els.score.textContent = fmt(to); return; }
    if (!animationsOn()) {
      state.shownScore = to;
      els.score.textContent = fmt(to);
      return;
    }
    var dur = Math.min(1100, 450 + Math.log10(Math.abs(to - from) + 1) * 150);
    var t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(from + (to - from) * eased);
      state.shownScore = v;
      els.score.textContent = fmt(v);
      if (p < 1) state.countRaf = requestAnimationFrame(step);
    }
    state.countRaf = requestAnimationFrame(step);
  }

  function renderScanButton() {
    var b = els.scanBtn;
    var loading = state.scanning && !state.blocked;
    b.disabled = !!state.blocked || loading || state.tabId == null;
    b.classList.toggle('is-loading', loading);
    b.setAttribute('aria-busy', loading ? 'true' : 'false');
    els.scanLabel.textContent = loading ? 'Varrendo…' : 'Varrer página';
    if (state.blocked) b.title = 'Esta página não pode ser varrida';
    else b.removeAttribute('title');
  }

  /* ------------------------------------------------------------------ */
  /* Varredura                                                           */
  /* ------------------------------------------------------------------ */

  function setScanning(on) {
    state.scanning = on;
    clearTimeout(state.scanTimer);
    if (on) {
      state.scanTimer = setTimeout(function () {
        if (!state.scanning) return;
        state.scanning = false;
        renderHero();
        toast('A varredura demorou demais. Tente de novo.', 'error');
      }, SCAN_TIMEOUT_MS);
    }
    renderHero();
  }

  function contentFiles() {
    var fallback = ['src/shared/dictionary.js', 'src/shared/engine.js', 'src/shared/storage.js', 'src/content/content.js'];
    try {
      var cs = chrome.runtime.getManifest().content_scripts;
      if (cs && cs[0] && cs[0].js && cs[0].js.length) return cs[0].js;
    } catch (e) { /* usa a lista fixa */ }
    return fallback;
  }

  function contentCss() {
    try {
      var cs = chrome.runtime.getManifest().content_scripts;
      if (cs && cs[0] && cs[0].css && cs[0].css.length) return cs[0].css;
    } catch (e) { /* usa a lista fixa */ }
    return ['src/content/content.css'];
  }

  async function injectContent(tabId) {
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tabId }, files: contentCss() });
    } catch (e) { /* o CSS é opcional para a varredura */ }
    await chrome.scripting.executeScript({ target: { tabId: tabId }, files: contentFiles() });
  }

  async function requestScan(tabId) {
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'LAELE_SCAN' });
    } catch (err) {
      var text = String((err && err.message) || err);
      if (!NO_CONTENT_RE.test(text)) return; // o script respondeu de outro jeito: a varredura segue
      await injectContent(tabId);
      await wait(120);
      await chrome.tabs.sendMessage(tabId, { type: 'LAELE_SCAN' });
    }
  }

  async function scan() {
    if (state.scanning || state.blocked || state.tabId == null) return;
    state.liveRecord = false;
    setScanning(true);
    try {
      await requestScan(state.tabId);
    } catch (err) {
      setScanning(false);
      toast('Não consegui varrer esta página.', 'error');
    }
  }

  function onUpdated(summary, live) {
    if (!summary) return;
    var prev = state.summary;
    if (prev && live === false && prev.at === summary.at && prev.total === summary.total) return;
    state.summary = summary;
    if (live) state.liveRecord = false;
    var wasScanning = state.scanning;
    state.scanning = false;
    clearTimeout(state.scanTimer);
    renderHero();
    reloadData().then(function () {
      var g = state.records && state.records.global;
      if (live && g && g.best > 0 && g.best === Number(summary.total) && g.url && g.url === summary.url &&
          Date.now() - (g.at || 0) < 30000 && (wasScanning || Date.now() - (summary.at || 0) < 30000)) {
        state.liveRecord = true;
        renderHero();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Dados                                                               */
  /* ------------------------------------------------------------------ */

  async function reloadData() {
    if (!storage) return;
    try {
      var res = await Promise.all([
        storage.getSettings ? storage.getSettings() : null,
        storage.getRecords ? storage.getRecords() : null,
        storage.getCollection ? storage.getCollection() : null
      ]);
      if (res[0]) state.settings = Object.assign({}, DEFAULT_SETTINGS, res[0]);
      state.records = res[1] || null;
      state.collection = res[2] || {};
    } catch (e) { /* mantém o que já havia */ }
    tierMap = {};
    renderRecords();
    renderDex();
    renderSettings();
  }

  /* ------------------------------------------------------------------ */
  /* Recordes                                                            */
  /* ------------------------------------------------------------------ */

  function safeOpen(url) {
    try {
      var u = new URL(url);
      if (u.protocol === 'http:' || u.protocol === 'https:') chrome.tabs.create({ url: u.href });
    } catch (e) { /* ignora */ }
  }

  function renderRecords() {
    var rec = state.records || {};
    var g = rec.global || {};
    var best = Number(g.best) || 0;

    els.bestCard.classList.toggle('is-empty', best <= 0);
    els.bestScore.textContent = best > 0 ? fmt(best) : '0';
    els.bestMeta.textContent = '';
    if (best > 0) {
      var name = (g.host || g.title || '').replace(/^www\./, '');
      els.bestMeta.appendChild(make('b', null, name || 'site desconhecido'));
      var when = relTime(g.at);
      if (when) els.bestMeta.appendChild(document.createTextNode(' · ' + when));
      els.bestCard.title = g.title || g.url || '';
    } else {
      els.bestMeta.textContent = 'Ainda sem recorde. Varra uma página para começar.';
      els.bestCard.removeAttribute('title');
    }

    var tot = rec.totals || {};
    els.totScans.textContent = compact(tot.scans);
    els.totWords.textContent = compact(tot.words);
    els.totPoints.textContent = compact(tot.points);

    var rows = Object.keys(rec.bySite || {}).map(function (host) {
      return Object.assign({ host: host }, rec.bySite[host]);
    }).filter(function (r) { return Number(r.best) > 0; })
      .sort(function (a, b) { return b.best - a.best; })
      .slice(0, 10);

    els.sites.textContent = '';
    els.sitesEmpty.hidden = rows.length > 0;
    rows.forEach(function (r, i) {
      var li = document.createElement('li');
      var btn = make('button', 'site-row');
      btn.type = 'button';
      btn.style.animationDelay = (i * 35) + 'ms';
      var hostLabel = r.host.replace(/^www\./, '');
      btn.setAttribute('aria-label', hostLabel + ': ' + fmt(r.best) + ' pontos. Abrir página.');
      btn.title = r.title || r.url || hostLabel;
      if (!r.url) btn.disabled = true;

      btn.appendChild(make('span', 'rank rank-' + (i + 1), String(i + 1)));
      var av = make('span', 'avatar');
      av.setAttribute('aria-hidden', 'true');
      paintAvatar(av, r.host);
      btn.appendChild(av);

      var info = make('span', 'site-info');
      info.appendChild(make('span', 'site-host', hostLabel));
      var subParts = [];
      if (r.maxCombo > 1) subParts.push('combo máx. ' + r.maxCombo + 'x');
      if (r.last != null && r.last !== r.best) subParts.push('última ' + fmt(r.last));
      info.appendChild(make('span', 'site-sub', subParts.join(' · ') || 'melhor pontuação'));
      btn.appendChild(info);

      var right = make('span', 'site-right');
      right.appendChild(make('span', 'site-score', fmt(r.best)));
      right.appendChild(make('span', 'site-when', relTime(r.at)));
      btn.appendChild(right);

      btn.addEventListener('click', function () { if (r.url) safeOpen(r.url); });
      li.appendChild(btn);
      els.sites.appendChild(li);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Laelédex                                                            */
  /* ------------------------------------------------------------------ */

  function renderDex() {
    var entries = allEntries();
    var coll = state.collection || {};
    var total = entries.length;
    var found = entries.filter(function (e) { return coll[e.id] && coll[e.id].count > 0; }).length;
    var pct = total ? Math.round((found / total) * 100) : 0;

    els.dexFound.textContent = fmt(found);
    els.dexTotal.textContent = fmt(total);
    els.dexBar.style.width = pct + '%';
    els.dexPct.textContent = pct + '%';
    els.dexBarWrap.setAttribute('aria-valuenow', String(pct));
    els.dexBarWrap.setAttribute('aria-valuetext', found + ' de ' + total + ' palavras descobertas');

    var q = norm(state.dexQuery.trim());
    var frag = document.createDocumentFragment();
    var shown = 0;

    entries.forEach(function (e, idx) {
      var tier = TIERS[e.tier] ? e.tier : 'comum';
      if (state.dexFilter !== 'all' && tier !== state.dexFilter) return;
      var rec = coll[e.id];
      var isFound = !!(rec && rec.count > 0);
      // a busca só enxerga o que já foi descoberto (o resto continua secreto)
      if (q && !(isFound && norm(e.label).indexOf(q) !== -1)) return;

      shown++;
      var li = make('li', 'dex-card tier-' + tier + (isFound ? ' is-found' : '') + (e.custom ? ' is-custom' : ''));
      var top = make('div', 'dex-top');
      top.appendChild(make('span', 'dex-no', '#' + String(idx + 1).padStart(3, '0')));
      var tierTag = make('span', 'dex-tier');
      tierTag.appendChild(document.createElement('i'));
      tierTag.appendChild(document.createTextNode(TIERS[tier].label));
      top.appendChild(tierTag);
      li.appendChild(top);

      li.appendChild(make('span', 'dex-name', isFound ? e.label : '???'));

      if (isFound) {
        var meta = make('div', 'dex-meta');
        meta.appendChild(make('span', 'dex-coef', fmtCoef(e.coef)));
        meta.appendChild(make('span', 'dex-times', fmt(rec.count) + (rec.count === 1 ? ' vez' : ' vezes')));
        li.appendChild(meta);
        li.setAttribute('aria-label', e.label + ', ' + TIERS[tier].label + ', coeficiente ' + fmtCoef(e.coef) + ', encontrada ' + rec.count + ' vezes');
      } else {
        li.setAttribute('aria-label', 'Palavra ainda não descoberta, raridade ' + TIERS[tier].label);
        li.appendChild(make('div', 'dex-meta'));
      }
      frag.appendChild(li);
    });

    els.dexGrid.textContent = '';
    els.dexGrid.appendChild(frag);
    els.dexEmpty.hidden = shown > 0;
  }

  /* ------------------------------------------------------------------ */
  /* Ajustes                                                             */
  /* ------------------------------------------------------------------ */

  function setSwitch(btn, on) {
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  }

  function renderSettings() {
    var s = state.settings;
    setSwitch(els.autoHeader, !!s.autoScan);
    setSwitch(els.setAutoScan, !!s.autoScan);
    setSwitch(els.setAnimations, !!s.animations);
    setSwitch(els.setShowHud, !!s.showHud);

    var speed = SPEEDS.indexOf(s.speed) !== -1 ? s.speed : 'normal';
    els.speedSeg.style.setProperty('--i', String(SPEEDS.indexOf(speed)));
    var off = !s.animations;
    els.speedSeg.classList.toggle('is-off', off);
    Array.prototype.forEach.call(els.speedSeg.querySelectorAll('.seg'), function (b) {
      var on = b.dataset.speed === speed;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      b.disabled = off;
    });

    var words = s.customWords || [];
    els.customList.textContent = '';
    els.customEmpty.hidden = words.length > 0;
    words.forEach(function (w) {
      var li = make('li', 'custom-item');
      li.appendChild(make('span', 'custom-name', w.label));
      li.appendChild(make('span', 'custom-coef', fmtCoef(w.coef)));
      var rm = make('button', 'icon-btn');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Remover ' + w.label);
      rm.title = 'Remover';
      rm.appendChild(icon('i-x'));
      rm.addEventListener('click', function () { removeWord(w); });
      li.appendChild(rm);
      els.customList.appendChild(li);
    });
  }

  async function saveSetting(partial) {
    var before = Object.assign({}, state.settings);
    state.settings = Object.assign({}, state.settings, partial);
    renderSettings();
    try {
      if (!storage || !storage.saveSettings) throw new Error('sem storage');
      await storage.saveSettings(partial);
    } catch (e) {
      state.settings = before;
      renderSettings();
      toast('Não consegui salvar o ajuste.', 'error');
    }
  }

  function toggleSetting(key) {
    saveSetting((function () { var o = {}; o[key] = !state.settings[key]; return o; })());
  }

  function setAddMessage(text, ok) {
    els.addMsg.hidden = !text;
    els.addMsg.textContent = text || '';
    els.addMsg.classList.toggle('ok', !!ok);
  }

  async function addWord(ev) {
    ev.preventDefault();
    var label = els.wordInput.value.replace(/\s+/g, ' ').trim();
    var coef = parseFloat(els.coefInput.value) || 2;

    if (label.length < 2) { setAddMessage('Escreva pelo menos 2 letras.'); els.wordInput.focus(); return; }
    var key = norm(label);
    var clash = allEntries().some(function (e) { return norm(e.label) === key; });
    if (clash) { setAddMessage('Essa palavra já está na lista.'); els.wordInput.focus(); return; }

    try {
      await storage.addCustomWord({ label: label, coef: coef });
      var fresh = await storage.getSettings();
      if (fresh) state.settings = Object.assign({}, DEFAULT_SETTINGS, fresh);
      tierMap = {};
      els.wordInput.value = '';
      setAddMessage('');
      renderSettings();
      renderDex();
      toast('“' + label + '” entrou na lista.');
      els.wordInput.focus();
    } catch (e) {
      setAddMessage('Não consegui salvar a palavra.');
    }
  }

  async function removeWord(w) {
    try {
      await storage.removeCustomWord(w.id);
      var fresh = await storage.getSettings();
      if (fresh) state.settings = Object.assign({}, DEFAULT_SETTINGS, fresh);
      tierMap = {};
      renderSettings();
      renderDex();
      toast('“' + w.label + '” removida.');
    } catch (e) {
      toast('Não consegui remover.', 'error');
    }
  }

  function updateRangeFill() {
    var r = els.coefInput;
    var pct = ((r.value - r.min) / (r.max - r.min)) * 100;
    r.style.setProperty('--fill', pct + '%');
    els.coefValue.textContent = fmtCoef(r.value);
  }

  function showResetConfirm(on) {
    clearTimeout(state.resetTimer);
    els.resetConfirm.hidden = !on;
    els.resetIdle.hidden = on;
    if (on) {
      els.resetCancel.focus();
      state.resetTimer = setTimeout(function () { showResetConfirm(false); }, 8000);
    } else {
      els.resetBtn.focus();
    }
  }

  async function doReset() {
    try {
      await storage.resetAll();
      await reloadData();
      showResetConfirm(false);
      toast('Recordes zerados.');
    } catch (e) {
      toast('Não consegui zerar.', 'error');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Abas                                                                */
  /* ------------------------------------------------------------------ */

  function selectTab(name, opts) {
    opts = opts || {};
    if (TABS.indexOf(name) === -1) name = 'records';
    state.activeTab = name;
    els.tabs.style.setProperty('--i', String(TABS.indexOf(name)));
    TABS.forEach(function (t) {
      var btn = $('tab-' + t);
      var on = t === name;
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
      $('panel-' + t).hidden = !on;
    });
    if (opts.focus) $('tab-' + name).focus();
    if (opts.persist !== false) lsSet(TAB_KEY, name);
  }

  function onTabKey(ev) {
    var i = TABS.indexOf(state.activeTab);
    var next = null;
    if (ev.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (ev.key === 'ArrowLeft') next = (i + TABS.length - 1) % TABS.length;
    else if (ev.key === 'Home') next = 0;
    else if (ev.key === 'End') next = TABS.length - 1;
    if (next == null) return;
    ev.preventDefault();
    selectTab(TABS[next], { focus: true });
  }

  function onSpeedKey(ev) {
    if (state.settings.animations === false) return;
    var i = SPEEDS.indexOf(state.settings.speed);
    if (i < 0) i = 1;
    var next = null;
    if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') next = Math.min(SPEEDS.length - 1, i + 1);
    else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') next = Math.max(0, i - 1);
    if (next == null) return;
    ev.preventDefault();
    saveSetting({ speed: SPEEDS[next] });
    els.speedSeg.querySelector('[data-speed="' + SPEEDS[next] + '"]').focus();
  }

  /* ------------------------------------------------------------------ */
  /* Inicialização                                                       */
  /* ------------------------------------------------------------------ */

  function cacheEls() {
    [
      'hero', 'heroAvatar', 'heroHost', 'heroMain', 'scanPill', 'recordPill', 'score', 'grade', 'gradeLetter', 'gradeLabel',
      'statWords', 'statCombo', 'statMult', 'terms', 'termsWrap', 'msgTitle', 'msgText', 'scanBtn', 'scanLabel',
      'tabs', 'autoHeader', 'bestCard', 'bestScore', 'bestMeta', 'totScans', 'totWords', 'totPoints', 'sites', 'sitesEmpty',
      'dexFound', 'dexTotal', 'dexPct', 'dexBar', 'dexBarWrap', 'dexSearch', 'dexFilters', 'dexGrid', 'dexEmpty',
      'setAutoScan', 'setAnimations', 'setShowHud', 'speedSeg', 'addForm', 'wordInput', 'coefInput', 'coefValue',
      'addMsg', 'customList', 'customEmpty', 'resetIdle', 'resetConfirm', 'resetBtn', 'resetCancel', 'resetYes', 'toast'
    ].forEach(function (id) { els[id] = $(id); });
    // o contêiner do cartão principal não tem id próprio
    els.heroMain = document.querySelector('.hero-main');
  }

  function bindEvents() {
    els.scanBtn.addEventListener('click', scan);

    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (btn) {
      btn.addEventListener('click', function () { selectTab(btn.dataset.tab); });
      btn.addEventListener('keydown', onTabKey);
    });

    els.autoHeader.addEventListener('click', function () { toggleSetting('autoScan'); });
    els.setAutoScan.addEventListener('click', function () { toggleSetting('autoScan'); });
    els.setAnimations.addEventListener('click', function () { toggleSetting('animations'); });
    els.setShowHud.addEventListener('click', function () { toggleSetting('showHud'); });

    Array.prototype.forEach.call(els.speedSeg.querySelectorAll('.seg'), function (b) {
      b.addEventListener('click', function () { saveSetting({ speed: b.dataset.speed }); });
      b.addEventListener('keydown', onSpeedKey);
    });

    Array.prototype.forEach.call(els.dexFilters.querySelectorAll('.filter'), function (b) {
      b.addEventListener('click', function () {
        state.dexFilter = b.dataset.tier;
        Array.prototype.forEach.call(els.dexFilters.querySelectorAll('.filter'), function (o) {
          o.setAttribute('aria-pressed', o === b ? 'true' : 'false');
        });
        renderDex();
      });
    });
    els.dexSearch.addEventListener('input', function () {
      state.dexQuery = els.dexSearch.value;
      renderDex();
    });

    els.addForm.addEventListener('submit', addWord);
    els.wordInput.addEventListener('input', function () { setAddMessage(''); });
    els.coefInput.addEventListener('input', updateRangeFill);

    els.resetBtn.addEventListener('click', function () { showResetConfirm(true); });
    els.resetCancel.addEventListener('click', function () { showResetConfirm(false); });
    els.resetYes.addEventListener('click', doReset);
    els.resetConfirm.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { ev.stopPropagation(); showResetConfirm(false); }
    });
  }

  function bindRuntime() {
    try {
      chrome.runtime.onMessage.addListener(function (msg) {
        if (msg && msg.type === 'LAELE_UPDATED' && msg.tabId === state.tabId) onUpdated(msg.summary, true);
      });
    } catch (e) { /* fora da extensão */ }

    try {
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area === 'session' && state.tabId != null) {
          var ch = changes['tab:' + state.tabId];
          if (ch && ch.newValue) onUpdated(ch.newValue, false);
        } else if (area === 'local' && (changes.records || changes.collection || changes.settings)) {
          reloadData();
        }
      });
    } catch (e) { /* storage.onChanged é opcional */ }
  }

  async function init() {
    cacheEls();
    bindEvents();
    updateRangeFill();
    selectTab(lsGet(TAB_KEY) || 'records', { persist: false });
    renderHero();

    await reloadData();
    await resolveTab();
    state.ready = true;
    renderHero();
    bindRuntime();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

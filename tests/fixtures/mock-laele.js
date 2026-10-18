/*
 * Mock minimo de LaEle.engine, LaEle.storage e chrome.runtime, apenas para abrir
 * tests/fixtures/pagina-teste.html direto no navegador (file://) e ver o content script funcionar.
 * Nao faz parte da extensao.
 */
(function () {
  'use strict';
  var g = globalThis;
  g.LaEle = g.LaEle || {};

  var WORDS = {
    pau: [3, 'pesado'], rola: [3, 'pesado'], mandioca: [2, 'comum'], banana: [1.5, 'comum'], pepino: [2, 'comum'],
    dar: [1.5, 'comum'], dou: [1.5, 'comum'], deu: [1.5, 'comum'], comer: [1.5, 'comum'], come: [1.5, 'comum'],
    duro: [1, 'leve'], grosso: [1.5, 'leve'], molhado: [1, 'leve'], apertado: [1, 'leve'], passada: [1.2, 'leve'],
    chupar: [2, 'pesado'], enfiar: [2, 'pesado'], sentar: [1.5, 'comum'], rabo: [2, 'comum'], mangueira: [2, 'comum']
  };
  var PHRASES = [
    { tokens: ['de', 'quatro'], coef: 3.5, tier: 'pesado', id: 'de-quatro', label: 'de quatro' },
    { tokens: ['por', 'tras'], coef: 3, tier: 'pesado', id: 'por-tras', label: 'por trás' },
    { tokens: ['ate', 'o', 'talo'], coef: 4, tier: 'lendario', id: 'ate-o-talo', label: 'até o talo' },
    { tokens: ['pegar', 'no', 'pau'], coef: 5, tier: 'lendario', id: 'pegar-no-pau', label: 'pegar no pau' },
    { tokens: ['dar', 'uma'], coef: 2.5, tier: 'comum', id: 'dar-uma', label: 'dar uma' }
  ];
  var custom = [];

  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  g.LaEle.engine = {
    CONFIG: { comboWindow: 8, comboStep: 0.5, maxMultiplier: 10, basePoints: 100 },
    setCustomEntries: function (list) { custom = list || []; },
    normalize: norm,
    analyze: function (text) {
      var re = /[\p{L}\p{N}]+/gu;
      var toks = [];
      var m;
      while ((m = re.exec(text))) toks.push({ raw: m[0], norm: norm(m[0]), start: m.index, end: m.index + m[0].length });
      var found = [];
      for (var i = 0; i < toks.length; i++) {
        var hit = null;
        for (var p = 0; p < PHRASES.length && !hit; p++) {
          var ph = PHRASES[p];
          var ok = i + ph.tokens.length <= toks.length;
          for (var k = 0; ok && k < ph.tokens.length; k++) ok = toks[i + k].norm === ph.tokens[k];
          if (ok) hit = { ph: ph, len: ph.tokens.length };
        }
        if (hit) {
          found.push({ s: i, e: i + hit.len - 1, id: hit.ph.id, label: hit.ph.label, coef: hit.ph.coef, tier: hit.ph.tier });
          i += hit.len - 1;
          continue;
        }
        var w = WORDS[toks[i].norm];
        if (w) { found.push({ s: i, e: i, id: toks[i].norm, label: toks[i].norm, coef: w[0], tier: w[1] }); continue; }
        for (var c = 0; c < custom.length; c++) {
          if ((custom[c].forms || []).map(norm).indexOf(toks[i].norm) !== -1) {
            found.push({ s: i, e: i, id: custom[c].id, label: custom[c].label, coef: custom[c].coef, tier: custom[c].tier || 'comum' });
            break;
          }
        }
      }
      var matches = [];
      var combo = 0;
      var maxCombo = 0;
      var total = 0;
      var prevEnd = -999;
      found.forEach(function (f) {
        combo = f.s - prevEnd <= 8 + 1 && matches.length ? combo + 1 : 1;
        prevEnd = f.e;
        if (combo > maxCombo) maxCombo = combo;
        var mult = Math.min(10, 1 + 0.5 * (combo - 1));
        var pts = Math.round(100 * f.coef * mult);
        total += pts;
        matches.push({
          start: toks[f.s].start, end: toks[f.e].end, raw: text.slice(toks[f.s].start, toks[f.e].end),
          entryId: f.id, label: f.label, coef: f.coef, tier: f.tier, combo: combo, multiplier: mult, points: pts
        });
      });
      return { matches: matches, total: total, maxCombo: maxCombo };
    },
    rank: function (total) {
      if (total <= 0) return { grade: '-', label: '' };
      if (total >= 20000) return { grade: 'S', label: 'Lá ele supremo' };
      if (total >= 8000) return { grade: 'A', label: 'Mente poluída' };
      if (total >= 3000) return { grade: 'B', label: 'Malícia em dia' };
      if (total >= 800) return { grade: 'C', label: 'Inocente demais' };
      return { grade: 'D', label: 'Quase santo' };
    }
  };

  g.LaEle.storage = {
    getSettings: function () {
      var q = new URLSearchParams(location.search);
      return Promise.resolve({
        autoScan: q.get('auto') !== '0', animations: q.get('anim') !== '0', speed: q.get('speed') || 'normal',
        showHud: q.get('hud') !== '0', customWords: [{ id: 'custom-cenoura', label: 'cenoura', coef: 2, tier: 'comum', forms: ['cenoura', 'cenouras'], stems: [], phrase: false }]
      });
    }
  };

  // chrome.runtime falso (so quando a pagina e aberta fora da extensao)
  if (!g.chrome || !g.chrome.runtime || !g.chrome.runtime.id) {
    g.__laeleLog = [];
    var listeners = [];
    g.chrome = {
      runtime: {
        id: 'mock',
        lastError: null,
        sendMessage: function (msg, cb) {
          g.__laeleLog.push(msg);
          if (msg.type === 'LAELE_RESULT' && cb) setTimeout(function () { cb({ newGlobalBest: true, newSiteBest: true }); }, 50);
        },
        onMessage: { addListener: function (fn) { listeners.push(fn); } }
      }
    };
    g.__laeleSend = function (msg) { listeners.forEach(function (fn) { fn(msg, {}, function () {}); }); };
  }
})();

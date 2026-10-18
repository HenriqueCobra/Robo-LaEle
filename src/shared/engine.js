/* Robo-LaEle - motor: normalização, tokenização, matching, combos e pontuação. */
var LaEle = globalThis.LaEle = globalThis.LaEle || {};

(function () {
  'use strict';

  var CONFIG = { comboWindow: 8, comboStep: 0.5, maxMultiplier: 10, basePoints: 100 };

  // faixas de nota: o primeiro limite que o total não alcança define a nota
  var RANKS = [
    { grade: 'D', below: 300, label: 'Quase inocente' },
    { grade: 'C', below: 1000, label: 'Lá ele de leve' },
    { grade: 'B', below: 3000, label: 'Tá ficando safado' },
    { grade: 'A', below: 8000, label: 'Lá ele pesado' },
    { grade: 'S', below: Infinity, label: 'Lá ele supremo' }
  ];

  var LEET = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't', '@': 'a', '$': 's' };
  var RE_NON_ASCII = /[^\x00-\x7f]/;
  var RE_MARKS = /[̀-ͯ]/g;
  var RE_LEET = /[431057@$]/g;
  var RE_REPEAT = /(.)\1{2,}/g;
  var RE_ALNUM = /[\p{L}\p{N}]/u;
  // pontuação final de frase ou parágrafo quebra uma expressão
  var RE_BREAK = /[.!?;:…]|\n\s*\n/;
  var STEM_EXTRA = 5;

  function leetChar(ch) { return LEET[ch]; }

  function normalize(str) {
    if (str === null || str === undefined) return '';
    var s = String(str).toLowerCase();
    if (RE_NON_ASCII.test(s)) s = s.normalize('NFD').replace(RE_MARKS, '');
    return s.replace(RE_LEET, leetChar).replace(RE_REPEAT, '$1');
  }

  // offsets (start/end) sempre referentes ao texto original
  function tokenize(text) {
    var out = [];
    if (text === null || text === undefined || text === '') return out;
    text = String(text);
    var re = /[\p{L}\p{M}\p{N}@$]+/gu;
    var cache = new Map();
    var m;
    while ((m = re.exec(text)) !== null) {
      var raw = m[0];
      if (!RE_ALNUM.test(raw)) continue;
      var norm = cache.get(raw);
      if (norm === undefined) {
        norm = normalize(raw);
        cache.set(raw, norm);
      }
      out.push({ raw: raw, norm: norm, start: m.index, end: m.index + raw.length });
    }
    return out;
  }

  function toCoef(value) {
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return 1;
    return Math.min(n, 50);
  }

  // Constrói o índice: Map de formas, Map de expressões por 1º token e stems por prefixo de 3 letras
  function compile(entries) {
    var words = new Map();
    var phrases = new Map();
    var stems = new Map();
    var size = 0;

    function addWord(norm, info) {
      var prev = words.get(norm);
      if (!prev || info.coef > prev.coef) words.set(norm, info);
    }

    function addPhrase(tokens, info) {
      var first = tokens[0];
      var list = phrases.get(first);
      if (!list) { list = []; phrases.set(first, list); }
      var key = tokens.join(' ');
      for (var i = 0; i < list.length; i++) {
        if (list[i].key === key) {
          if (info.coef > list[i].info.coef) list[i].info = info;
          return;
        }
      }
      list.push({ key: key, tokens: tokens, len: tokens.length, info: info });
    }

    (entries || []).forEach(function (e) {
      if (!e || !e.id) return;
      var info = { id: e.id, label: e.label || e.id, coef: toCoef(e.coef), tier: e.tier || 'comum' };
      var forms = Array.isArray(e.forms) ? e.forms : [];
      var entryStems = Array.isArray(e.stems) ? e.stems : [];
      if (!forms.length && !entryStems.length && e.label) forms = [e.label];
      size++;

      forms.forEach(function (form) {
        var toks = tokenize(form).map(function (t) { return t.norm; });
        if (toks.length === 1) addWord(toks[0], info);
        else if (toks.length > 1) addPhrase(toks, info);
      });

      entryStems.forEach(function (stem) {
        var s = normalize(stem).replace(/[^a-z0-9]/g, '');
        if (s.length < 3) return;
        var key = s.slice(0, 3);
        var bucket = stems.get(key);
        if (!bucket) { bucket = []; stems.set(key, bucket); }
        bucket.push({ stem: s, max: s.length + STEM_EXTRA, info: info });
      });
    });

    // expressões mais longas primeiro; stems mais longos primeiro
    phrases.forEach(function (list) { list.sort(function (a, b) { return b.len - a.len; }); });
    stems.forEach(function (list) { list.sort(function (a, b) { return b.stem.length - a.stem.length; }); });

    return { words: words, phrases: phrases, stems: stems, size: size };
  }

  function lookupWord(index, norm) {
    var info = index.words.get(norm);
    if (info) return info;
    if (norm.length < 3 || !index.stems.size) return null;
    var bucket = index.stems.get(norm.slice(0, 3));
    if (!bucket) return null;
    for (var i = 0; i < bucket.length; i++) {
      var s = bucket[i];
      if (norm.length <= s.max && norm.indexOf(s.stem) === 0) return s.info;
    }
    return null;
  }

  function gapsOk(text, tokens, from, len) {
    for (var k = from; k < from + len - 1; k++) {
      if (RE_BREAK.test(text.slice(tokens[k].end, tokens[k + 1].start))) return false;
    }
    return true;
  }

  // Índice padrão: dicionário embutido + palavras do usuário (cacheado)
  var customEntries = [];
  var defaultIndex = null;

  function baseEntries() {
    if (!LaEle.dictionary && typeof require === 'function') {
      try { require('./dictionary.js'); } catch (err) { /* sem dicionário embutido */ }
    }
    return (LaEle.dictionary && LaEle.dictionary.entries) || [];
  }

  function getDefaultIndex() {
    if (!defaultIndex) defaultIndex = compile(baseEntries().concat(customEntries));
    return defaultIndex;
  }

  function sanitizeCustom(list) {
    var out = [];
    (Array.isArray(list) ? list : []).forEach(function (e, i) {
      if (!e) return;
      var label = String(e.label || '').trim();
      var forms = Array.isArray(e.forms) ? e.forms.filter(Boolean) : [];
      var stems = Array.isArray(e.stems) ? e.stems.filter(Boolean) : [];
      if (!forms.length && !stems.length && label) forms = [label];
      if (!forms.length && !stems.length) return;
      out.push({
        id: e.id || ('custom-' + i),
        label: label || String(forms[0] || stems[0]),
        coef: e.coef,
        tier: e.tier || 'comum',
        forms: forms,
        stems: stems,
        phrase: forms.some(function (f) { return /\s/.test(String(f).trim()); })
      });
    });
    return out;
  }

  // Recompila o índice padrão incluindo as palavras do usuário
  function setCustomEntries(entries) {
    customEntries = sanitizeCustom(entries);
    defaultIndex = null;
    return customEntries.length;
  }

  function analyze(text, index) {
    var result = { matches: [], total: 0, maxCombo: 0 };
    if (text === null || text === undefined || text === '') return result;
    text = String(text);
    var idx = index || getDefaultIndex();
    var tokens = tokenize(text);
    var n = tokens.length;
    if (!n) return result;

    // 1) candidatos a expressão, escolhidos de forma gulosa pelo maior número de tokens
    var chosen = null;
    if (idx.phrases.size) {
      var cands = [];
      for (var i = 0; i < n; i++) {
        var list = idx.phrases.get(tokens[i].norm);
        if (!list) continue;
        for (var c = 0; c < list.length; c++) {
          var ph = list[c];
          if (i + ph.len > n) continue;
          var ok = true;
          for (var k = 1; k < ph.len; k++) {
            if (tokens[i + k].norm !== ph.tokens[k]) { ok = false; break; }
          }
          if (ok && gapsOk(text, tokens, i, ph.len)) cands.push({ start: i, len: ph.len, info: ph.info });
        }
      }
      if (cands.length) {
        cands.sort(function (a, b) {
          return (b.len - a.len) || (a.start - b.start) || (b.info.coef - a.info.coef);
        });
        var taken = new Uint8Array(n);
        chosen = new Map();
        cands.forEach(function (cd) {
          var free = true;
          for (var t = cd.start; t < cd.start + cd.len; t++) {
            if (taken[t]) { free = false; break; }
          }
          if (!free) return;
          for (var u = cd.start; u < cd.start + cd.len; u++) taken[u] = 1;
          chosen.set(cd.start, cd);
        });
      }
    }

    // 2) varredura em ordem: expressão escolhida ou palavra solta
    var items = [];
    for (var p = 0; p < n;) {
      var sel = chosen && chosen.get(p);
      if (sel) {
        items.push({ first: p, last: p + sel.len - 1, info: sel.info });
        p += sel.len;
        continue;
      }
      var info = lookupWord(idx, tokens[p].norm);
      if (info) items.push({ first: p, last: p, info: info });
      p++;
    }

    // 3) combo e pontuação
    var combo = 0;
    var prevLast = -1;
    for (var q = 0; q < items.length; q++) {
      var it = items[q];
      if (q > 0 && it.first - prevLast - 1 <= CONFIG.comboWindow) combo++;
      else combo = 1;
      prevLast = it.last;

      var mult = Math.min(CONFIG.maxMultiplier, 1 + CONFIG.comboStep * (combo - 1));
      mult = Math.round(mult * 1e6) / 1e6;
      var points = Math.round(CONFIG.basePoints * it.info.coef * mult);
      var start = tokens[it.first].start;
      var end = tokens[it.last].end;

      result.matches.push({
        start: start,
        end: end,
        raw: text.slice(start, end),
        entryId: it.info.id,
        label: it.info.label,
        coef: it.info.coef,
        tier: it.info.tier,
        combo: combo,
        multiplier: mult,
        points: points
      });
      result.total += points;
      if (combo > result.maxCombo) result.maxCombo = combo;
    }
    return result;
  }

  function rank(total) {
    var t = Number(total);
    if (!isFinite(t) || t <= 0) return { grade: '-', label: 'Nada de lá ele por aqui' };
    for (var i = 0; i < RANKS.length; i++) {
      if (t < RANKS[i].below) return { grade: RANKS[i].grade, label: RANKS[i].label };
    }
    return { grade: 'S', label: RANKS[RANKS.length - 1].label };
  }

  LaEle.engine = {
    CONFIG: CONFIG,
    RANKS: RANKS,
    normalize: normalize,
    tokenize: tokenize,
    compile: compile,
    analyze: analyze,
    rank: rank,
    setCustomEntries: setCustomEntries,
    getDefaultIndex: getDefaultIndex
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LaEle.engine;

/*
 * LaEle.storage — leitura/escrita em chrome.storage, recordes e coleção (Laelédex).
 *
 * Chaves em chrome.storage.local: 'settings', 'records', 'collection', 'topPhrases'.
 * Resumos por aba em chrome.storage.session: `tab:${tabId}`.
 *
 * Todas as escritas (settings, recordes, coleção, palavras próprias) passam por
 * uma única fila de Promises, então abas simultâneas não geram corrida de
 * leitura-modificação-escrita.
 */
var LaEle = globalThis.LaEle = globalThis.LaEle || {};

LaEle.storage = (function () {
  'use strict';

  var SPEEDS = ['lento', 'normal', 'rapido'];
  var THEMES = ['dark', 'light'];
  var WATCHED_KEYS = ['settings', 'records', 'collection', 'topPhrases'];
  var TOP_PHRASES_MAX = 10;

  function defaultSettings() {
    return { autoScan: true, animations: true, speed: 'normal', showHud: true, theme: 'dark', customWords: [] };
  }

  function defaultRecords() {
    return {
      global: { best: 0, url: '', title: '', host: '', at: 0 },
      bySite: {},
      totals: { scans: 0, words: 0, points: 0 }
    };
  }

  // ---------- acesso ao chrome.storage (resolvido na hora do uso) ----------

  var memorySession = {};

  function localArea() {
    return globalThis.chrome && chrome.storage && chrome.storage.local;
  }

  function sessionArea() {
    return globalThis.chrome && chrome.storage && chrome.storage.session;
  }

  function readLocal(key) {
    var area = localArea();
    if (!area) return Promise.resolve(undefined);
    return area.get(key).then(function (res) { return res ? res[key] : undefined; });
  }

  function writeLocal(obj) {
    var area = localArea();
    if (!area) return Promise.resolve();
    return area.set(obj);
  }

  // ---------- fila de escrita ----------

  var queue = Promise.resolve();

  function enqueue(task) {
    var run = queue.then(task);
    queue = run.then(function () {}, function () {});
    return run;
  }

  // ---------- helpers ----------

  function isObject(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
  }

  function mergeSettings(stored) {
    var out = defaultSettings();
    if (isObject(stored)) {
      Object.keys(out).forEach(function (k) {
        if (stored[k] !== undefined && stored[k] !== null) out[k] = stored[k];
      });
    }
    if (SPEEDS.indexOf(out.speed) === -1) out.speed = 'normal';
    if (THEMES.indexOf(out.theme) === -1) out.theme = 'dark';
    if (!Array.isArray(out.customWords)) out.customWords = [];
    out.autoScan = !!out.autoScan;
    out.animations = !!out.animations;
    out.showHud = !!out.showHud;
    return out;
  }

  function mergeRecords(stored) {
    var out = defaultRecords();
    if (isObject(stored)) {
      if (isObject(stored.global)) out.global = Object.assign(out.global, stored.global);
      if (isObject(stored.bySite)) out.bySite = stored.bySite;
      if (isObject(stored.totals)) out.totals = Object.assign(out.totals, stored.totals);
    }
    return out;
  }

  function mergeCollection(stored) {
    return isObject(stored) ? stored : {};
  }

  // Top lá ele: no máximo 10 trechos válidos, do mais para o menos pontuado
  function mergeTopPhrases(stored) {
    if (!Array.isArray(stored)) return [];
    return stored
      .filter(function (p) { return isObject(p) && typeof p.id === 'string' && p.id; })
      .sort(function (a, b) { return num(b.points) - num(a.points); })
      .slice(0, TOP_PHRASES_MAX);
  }

  function num(v) {
    v = Number(v);
    return isFinite(v) ? v : 0;
  }

  function tierFromCoef(coef) {
    if (coef < 1.5) return 'leve';
    if (coef < 3) return 'comum';
    if (coef < 4) return 'pesado';
    return 'lendario';
  }

  function slugify(label) {
    var s = String(label)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'palavra';
  }

  // ---------- settings ----------

  function getSettings() {
    return readLocal('settings').then(mergeSettings);
  }

  function saveSettings(partial) {
    return enqueue(function () {
      return readLocal('settings').then(function (stored) {
        var next = mergeSettings(Object.assign({}, mergeSettings(stored), isObject(partial) ? partial : {}));
        return writeLocal({ settings: next }).then(function () { return next; });
      });
    });
  }

  // ---------- records / collection ----------

  function getRecords() {
    return readLocal('records').then(mergeRecords);
  }

  function getCollection() {
    return readLocal('collection').then(mergeCollection);
  }

  function getTopPhrases() {
    return readLocal('topPhrases').then(mergeTopPhrases);
  }

  // normalize do motor quando disponível; senão uma versão simples equivalente
  function normalizeText(str) {
    var eng = globalThis.LaEle && globalThis.LaEle.engine;
    if (!eng && typeof require === 'function') {
      try { eng = require('./engine.js'); } catch (err) { /* sem motor: usa o normalize local */ }
    }
    if (eng && typeof eng.normalize === 'function') return eng.normalize(str);
    return String(str).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  }

  // hash FNV-1a de 32 bits em hex
  function hashText(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  // Junta os trechos novos ao Top: mesmo id fica com o de mais pontos.
  // Devolve true se algum trecho entrou no top 10 ou subiu de pontos.
  function mergePhrases(top, incoming, s, at) {
    var host = s.host ? String(s.host) : '';
    var best = new Map();
    incoming.forEach(function (p) {
      if (!isObject(p) || typeof p.text !== 'string' || !p.text.trim()) return;
      var id = host + '|' + hashText(normalizeText(p.text));
      var prev = best.get(id);
      if (!prev || num(p.points) > num(prev.points)) {
        best.set(id, {
          id: id,
          text: p.text,
          hits: Array.isArray(p.hits) ? p.hits : [],
          points: num(p.points),
          maxCombo: num(p.maxCombo),
          count: num(p.count),
          url: s.url || '',
          host: host,
          title: s.title || '',
          at: at
        });
      }
    });

    var list = top.slice();
    var applied = [];
    best.forEach(function (cand, id) {
      var i = list.findIndex(function (x) { return x.id === id; });
      if (i === -1) {
        list.push(cand);
        applied.push(cand);
      } else if (cand.points > num(list[i].points)) {
        list[i] = cand;
        applied.push(cand);
      }
    });
    // ordenação estável: em empate, quem já estava no Top fica na frente
    list.sort(function (a, b) { return num(b.points) - num(a.points); });
    list = list.slice(0, TOP_PHRASES_MAX);

    var entered = applied.some(function (c) {
      return list.some(function (x) { return x === c; });
    });
    return { list: list, entered: entered };
  }

  function recordScan(summary, matchedEntryIds, phrases) {
    return enqueue(function () {
      var area = localArea();
      if (!area) return { newGlobalBest: false, newSiteBest: false, newTopPhrase: false };
      return area.get(['records', 'collection', 'topPhrases']).then(function (res) {
        res = res || {};
        var records = mergeRecords(res.records);
        var collection = mergeCollection(res.collection);
        var s = isObject(summary) ? summary : {};
        var total = num(s.total);
        var count = num(s.count);
        var maxCombo = num(s.maxCombo);
        var at = num(s.at) || Date.now();
        var host = s.host ? String(s.host) : '';
        var result = { newGlobalBest: false, newSiteBest: false, newTopPhrase: false };

        // recorde global
        if (total > 0 && total > num(records.global.best)) {
          records.global = {
            best: total,
            url: s.url || '',
            title: s.title || '',
            host: host,
            at: at
          };
          result.newGlobalBest = true;
        }

        // recorde por site
        if (host) {
          var prev = records.bySite[host];
          var hadPrev = isObject(prev);
          var site = hadPrev ? Object.assign({ best: 0, last: 0, maxCombo: 0, url: '', title: '', at: 0 }, prev)
                             : { best: 0, last: 0, maxCombo: 0, url: '', title: '', at: 0 };
          if (total > 0 && total > num(site.best)) result.newSiteBest = true;
          var isBest = result.newSiteBest || !hadPrev;
          site.last = total;
          site.maxCombo = Math.max(num(site.maxCombo), maxCombo);
          if (result.newSiteBest) site.best = total;
          // url/title/at descrevem a varredura do recorde (ou a primeira, se ainda não há recorde)
          if (isBest) {
            site.url = s.url || '';
            site.title = s.title || '';
            site.at = at;
          }
          records.bySite[host] = site;
        }

        // totais
        records.totals.scans = num(records.totals.scans) + 1;
        records.totals.words = num(records.totals.words) + count;
        records.totals.points = num(records.totals.points) + total;

        // coleção (uma ocorrência por id repetido)
        if (Array.isArray(matchedEntryIds)) {
          matchedEntryIds.forEach(function (id) {
            if (typeof id !== 'string' || !id) return;
            var cur = collection[id];
            if (isObject(cur)) {
              cur.count = num(cur.count) + 1;
            } else {
              collection[id] = { count: 1, firstAt: at, firstUrl: s.url || '' };
            }
          });
        }

        var toWrite = { records: records, collection: collection };

        // Top lá ele (só grava a chave quando há trechos novos)
        if (Array.isArray(phrases) && phrases.length) {
          var merged = mergePhrases(mergeTopPhrases(res.topPhrases), phrases, s, at);
          result.newTopPhrase = merged.entered;
          toWrite.topPhrases = merged.list;
        }

        return area.set(toWrite).then(function () { return result; });
      });
    });
  }

  // ---------- resumo por aba (session) ----------

  function tabKey(tabId) {
    return 'tab:' + tabId;
  }

  function setTabSummary(tabId, summary) {
    var key = tabKey(tabId);
    var area = sessionArea();
    if (!area) {
      memorySession[key] = summary;
      return Promise.resolve();
    }
    var obj = {};
    obj[key] = summary;
    return area.set(obj);
  }

  function getTabSummary(tabId) {
    var key = tabKey(tabId);
    var area = sessionArea();
    if (!area) return Promise.resolve(memorySession[key] || null);
    return area.get(key).then(function (res) { return (res && res[key]) || null; });
  }

  function removeTabSummary(tabId) {
    var key = tabKey(tabId);
    var area = sessionArea();
    if (!area) {
      delete memorySession[key];
      return Promise.resolve();
    }
    return area.remove(key);
  }

  // ---------- reset ----------

  // Zera recordes, totais, coleção e Top lá ele. Configurações e palavras próprias são mantidas.
  function resetAll() {
    return enqueue(function () {
      return writeLocal({ records: defaultRecords(), collection: {}, topPhrases: [] });
    });
  }

  // ---------- palavras próprias ----------

  function addCustomWord(input) {
    return enqueue(function () {
      var label = input && input.label != null ? String(input.label).trim().replace(/\s+/g, ' ') : '';
      if (!label) return Promise.reject(new Error('Palavra vazia'));
      var coef = Number(input.coef);
      if (!isFinite(coef)) coef = 2;
      coef = Math.min(5, Math.max(0.5, coef));

      return readLocal('settings').then(function (stored) {
        var settings = mergeSettings(stored);
        var lower = label.toLowerCase();
        var forms = [lower];
        if (lower.charAt(lower.length - 1) !== 's') forms.push(lower + 's');

        var base = 'custom-' + slugify(label) + '-' + Date.now().toString(36);
        var id = base;
        var n = 1;
        var taken = function (x) { return settings.customWords.some(function (w) { return w && w.id === x; }); };
        while (taken(id)) id = base + '-' + (n++);

        var entry = {
          id: id,
          label: label,
          coef: coef,
          tier: tierFromCoef(coef),
          forms: forms,
          stems: [],
          phrase: /\s/.test(label)
        };
        settings.customWords = settings.customWords.concat([entry]);
        return writeLocal({ settings: settings }).then(function () { return entry; });
      });
    });
  }

  function removeCustomWord(id) {
    return enqueue(function () {
      return readLocal('settings').then(function (stored) {
        var settings = mergeSettings(stored);
        var before = settings.customWords.length;
        settings.customWords = settings.customWords.filter(function (w) { return !(w && w.id === id); });
        var removed = settings.customWords.length !== before;
        if (!removed) return false;
        return writeLocal({ settings: settings }).then(function () { return true; });
      });
    });
  }

  // ---------- mudanças ----------

  // Repassa chrome.storage.onChanged (área local) apenas para settings/records/collection/topPhrases.
  // callback(changes, areaName), onde changes só contém essas chaves. Retorna função para cancelar.
  function onChange(callback) {
    if (typeof callback !== 'function' || !(globalThis.chrome && chrome.storage && chrome.storage.onChanged)) {
      return function () {};
    }
    var listener = function (changes, areaName) {
      if (areaName && areaName !== 'local') return;
      var filtered = {};
      var any = false;
      WATCHED_KEYS.forEach(function (k) {
        if (changes && changes[k]) { filtered[k] = changes[k]; any = true; }
      });
      if (any) callback(filtered, areaName || 'local');
    };
    chrome.storage.onChanged.addListener(listener);
    return function () {
      if (chrome.storage.onChanged.removeListener) chrome.storage.onChanged.removeListener(listener);
    };
  }

  return {
    getSettings: getSettings,
    saveSettings: saveSettings,
    getRecords: getRecords,
    getCollection: getCollection,
    getTopPhrases: getTopPhrases,
    recordScan: recordScan,
    setTabSummary: setTabSummary,
    getTabSummary: getTabSummary,
    removeTabSummary: removeTabSummary,
    resetAll: resetAll,
    addCustomWord: addCustomWord,
    removeCustomWord: removeCustomWord,
    onChange: onChange,
    DEFAULT_SETTINGS: defaultSettings(),
    DEFAULT_RECORDS: defaultRecords()
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = LaEle.storage;

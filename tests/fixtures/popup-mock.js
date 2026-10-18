/* Mock de chrome.* e LaEle.* para pré-visualizar o popup fora da extensão.
 * Controle pela hash da URL, ex.: popup-preview.html#tab=dex&state=empty
 *   tab=records|dex|settings   aba inicial
 *   state=result|empty|scanning|clean|pdf|internal|store
 *   data=none                  sem recordes nem coleção
 *   click=#id|#id2             cliques automáticos (separados por |)
 *   type=texto                 digita na busca da Laelédex
 */
(function () {
  var params = {};
  location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
    var p = kv.split('=');
    if (p[0]) params[p[0]] = decodeURIComponent(p[1] || '');
  });

  if (!params.anim) {
    // captura estática: sem animações, para o screenshot sair no estado final
    var st = document.createElement('style');
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(st);
    window.matchMedia = function (q) { return { matches: /reduce/.test(q), addEventListener: function () {} }; };
  }

  try { localStorage.setItem('laele.popup.tab', params.tab || 'records'); } catch (e) { /* ignora */ }

  var now = Date.now();
  var E = function (id, label, coef, tier, phrase) {
    return { id: id, label: label, coef: coef, tier: tier, forms: [label], stems: [], phrase: !!phrase };
  };
  var entries = [
    E('dar', 'dar', 1.5, 'comum'), E('comer', 'comer', 1.5, 'comum'), E('pau', 'pau', 2, 'comum'),
    E('rola', 'rola', 2.5, 'pesado'), E('duro', 'duro', 1, 'leve'), E('grosso', 'grosso', 1.5, 'leve'),
    E('banana', 'banana', 1, 'leve'), E('mandioca', 'mandioca', 2, 'comum'), E('chupar', 'chupar', 2.5, 'pesado'),
    E('por-tras', 'por trás', 3, 'pesado', true), E('de-quatro', 'de quatro', 3.5, 'pesado', true),
    E('ate-o-talo', 'até o talo', 4, 'lendario', true), E('pegar-no-pau', 'pegar no pau', 4.5, 'lendario', true),
    E('molhado', 'molhado', 1.5, 'leve'), E('apertado', 'apertado', 2, 'comum'), E('sentar', 'sentar', 2, 'comum'),
    E('engolir', 'engolir', 2.5, 'pesado'), E('pepino', 'pepino', 1.5, 'leve'), E('linguica', 'linguiça', 2, 'comum'),
    E('vai-com-tudo', 'vai com tudo', 3.5, 'pesado', true), E('pode-entrar', 'pode entrar', 3, 'pesado', true),
    E('mangueira', 'mangueira', 2, 'comum'), E('pirulito', 'pirulito', 1.5, 'leve'), E('meter', 'meter', 2.5, 'pesado')
  ];

  var settings = { autoScan: true, animations: true, speed: 'normal', showHud: true, customWords: [
    { id: 'custom-1', label: 'cenoura', coef: 2, tier: 'comum', forms: ['cenoura'], stems: [], phrase: false }
  ] };

  var none = params.data === 'none';
  var records = none ? { global: { best: 0, url: '', title: '', host: '', at: 0 }, bySite: {}, totals: { scans: 0, words: 0, points: 0 } } : {
    global: { best: 48250, url: 'https://exemplo.com.br/receitas', title: 'Receitas de bolo', host: 'www.exemplo.com.br', at: now - 3600e3 * 2 },
    bySite: {
      'www.exemplo.com.br': { best: 48250, last: 12100, maxCombo: 14, url: 'https://exemplo.com.br/receitas', title: 'Receitas', at: now - 3600e3 * 2 },
      'pt.wikipedia.org': { best: 31400, last: 31400, maxCombo: 9, url: 'https://pt.wikipedia.org/wiki/Banana', title: 'Banana', at: now - 86400e3 },
      'g1.globo.com': { best: 18900, last: 4200, maxCombo: 6, url: 'https://g1.globo.com/', title: 'G1', at: now - 86400e3 * 3 },
      'reddit.com': { best: 12750, last: 12750, maxCombo: 7, url: 'https://reddit.com/r/brasil', title: 'Brasil', at: now - 600e3 },
      'youtube.com': { best: 8300, last: 900, maxCombo: 4, url: 'https://youtube.com/', title: 'YT', at: now - 86400e3 * 10 },
      'github.com': { best: 1250, last: 1250, maxCombo: 2, url: 'https://github.com/', title: 'GH', at: now - 86400e3 * 45 },
      'mercadolivre.com.br': { best: 940, last: 300, maxCombo: 1, url: 'https://mercadolivre.com.br/', title: 'ML', at: now - 30e3 }
    },
    totals: { scans: 128, words: 4210, points: 1245300 }
  };

  var collection = none ? {} : {
    dar: { count: 142, firstAt: now, firstUrl: '' }, pau: { count: 31, firstAt: now, firstUrl: '' },
    rola: { count: 12, firstAt: now, firstUrl: '' }, duro: { count: 58, firstAt: now, firstUrl: '' },
    'ate-o-talo': { count: 3, firstAt: now, firstUrl: '' }, banana: { count: 1, firstAt: now, firstUrl: '' },
    'por-tras': { count: 9, firstAt: now, firstUrl: '' }, sentar: { count: 5, firstAt: now, firstUrl: '' },
    comer: { count: 77, firstAt: now, firstUrl: '' }, 'custom-1': { count: 2, firstAt: now, firstUrl: '' }
  };

  var summary = {
    url: 'https://exemplo.com.br/receitas', host: 'www.exemplo.com.br', title: 'Receitas de bolo',
    total: 48250, count: 63, maxCombo: 14, grade: 'S', gradeLabel: 'Lá ele supremo',
    topTerms: [
      { entryId: 'ate-o-talo', label: 'até o talo', count: 4, points: 9800 },
      { entryId: 'rola', label: 'rola', count: 11, points: 7200 },
      { entryId: 'dar', label: 'dar', count: 18, points: 5100 }
    ],
    at: now
  };
  if (params.grade) { summary.grade = params.grade; summary.gradeLabel = params.gl || 'Dá pro gasto'; summary.total = 3120; }

  var tabUrl = {
    pdf: 'https://exemplo.com/arquivo.pdf', internal: 'chrome://extensions/', store: 'https://chromewebstore.google.com/detail/x'
  }[params.state] || 'https://www.exemplo.com.br/receitas';

  var tabSummary = null;
  if (!params.state || params.state === 'result') tabSummary = summary;
  if (params.state === 'clean') tabSummary = Object.assign({}, summary, { total: 0, count: 0, maxCombo: 0, topTerms: [], grade: '-' });

  var listeners = [];
  window.chrome = {
    runtime: {
      getManifest: function () { return { content_scripts: [{ js: ['a.js'], css: ['a.css'] }] }; },
      onMessage: { addListener: function (fn) { listeners.push(fn); } },
      sendMessage: function () { return Promise.resolve(); }
    },
    storage: { onChanged: { addListener: function () {} } },
    tabs: {
      query: function () { return Promise.resolve([{ id: 7, url: tabUrl }]); },
      sendMessage: function () {
        setTimeout(function () {
          listeners.forEach(function (fn) { fn({ type: 'LAELE_UPDATED', tabId: 7, summary: Object.assign({}, summary, { total: 49100, count: 66, at: Date.now() }) }); });
        }, 2500);
        return Promise.resolve({ ok: true });
      },
      create: function () {}
    },
    scripting: { insertCSS: function () { return Promise.resolve(); }, executeScript: function () { return Promise.resolve(); } }
  };

  window.LaEle = {
    dictionary: { version: 1, entries: entries },
    engine: {
      CONFIG: { comboWindow: 8, comboStep: 0.5, maxMultiplier: 10, basePoints: 100 },
      normalize: function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    },
    storage: {
      getSettings: function () { return Promise.resolve(JSON.parse(JSON.stringify(settings))); },
      saveSettings: function (p) { Object.assign(settings, p); return Promise.resolve(settings); },
      getRecords: function () { return Promise.resolve(records); },
      getCollection: function () { return Promise.resolve(collection); },
      getTabSummary: function () { return Promise.resolve(tabSummary); },
      addCustomWord: function (w) {
        var e = { id: 'custom-' + Math.random().toString(36).slice(2, 7), label: w.label, coef: w.coef, tier: 'comum', forms: [w.label], stems: [], phrase: false };
        settings.customWords.push(e);
        return Promise.resolve(e);
      },
      removeCustomWord: function (id) {
        settings.customWords = settings.customWords.filter(function (w) { return w.id !== id; });
        return Promise.resolve();
      },
      resetAll: function () {
        records = { global: { best: 0, url: '', title: '', host: '', at: 0 }, bySite: {}, totals: { scans: 0, words: 0, points: 0 } };
        collection = {};
        return Promise.resolve();
      }
    }
  };

  if (params.state === 'scanning') {
    // varredura sem fim, para registrar o estado visual
    window.chrome.tabs.sendMessage = function () { return Promise.resolve({ ok: true }); };
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(function () { document.getElementById('scanBtn').click(); }, 200);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (params.type) {
        var s = document.getElementById('dexSearch');
        s.value = params.type;
        s.dispatchEvent(new Event('input'));
      }
      (params.click || '').split('|').filter(Boolean).forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) el.click();
      });
      if (params.scroll) {
        var panel = document.querySelector('.panel:not([hidden])');
        if (panel) panel.scrollTop = Number(params.scroll);
      }
    }, 400);
  });
})();

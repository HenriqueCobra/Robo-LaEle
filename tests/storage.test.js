'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// ---------- mock em memória de chrome.storage ----------

function tick() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeArea(name, listeners) {
  const data = {};
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  return {
    data,
    async get(keys) {
      await tick();
      const out = {};
      if (keys == null) {
        Object.keys(data).forEach((k) => { out[k] = clone(data[k]); });
      } else if (typeof keys === 'string') {
        if (keys in data) out[keys] = clone(data[keys]);
      } else if (Array.isArray(keys)) {
        keys.forEach((k) => { if (k in data) out[k] = clone(data[k]); });
      } else {
        Object.keys(keys).forEach((k) => { out[k] = k in data ? clone(data[k]) : keys[k]; });
      }
      return out;
    },
    async set(obj) {
      await tick();
      const changes = {};
      Object.keys(obj).forEach((k) => {
        changes[k] = { oldValue: clone(data[k]), newValue: clone(obj[k]) };
        data[k] = clone(obj[k]);
      });
      listeners.slice().forEach((fn) => fn(changes, name));
    },
    async remove(keys) {
      await tick();
      [].concat(keys).forEach((k) => { delete data[k]; });
    }
  };
}

function installChrome() {
  const listeners = [];
  const chromeMock = {
    storage: {
      local: makeArea('local', listeners),
      session: makeArea('session', listeners),
      onChanged: {
        addListener: (fn) => listeners.push(fn),
        removeListener: (fn) => {
          const i = listeners.indexOf(fn);
          if (i >= 0) listeners.splice(i, 1);
        }
      }
    }
  };
  globalThis.chrome = chromeMock;
  return chromeMock;
}

installChrome();
const storage = require('../src/shared/storage.js');
const sw = require('../src/background/service-worker.js');

let chromeMock;
test.beforeEach(() => {
  chromeMock = installChrome();
});

const summary = (over) => Object.assign({
  url: 'https://exemplo.com/a', host: 'exemplo.com', title: 'Página A',
  total: 1000, count: 4, maxCombo: 3, grade: 'B', gradeLabel: 'Bom',
  topTerms: [], at: 1000
}, over);

// ---------- contrato do módulo ----------

test('namespace global LaEle.storage e module.exports apontam para o mesmo objeto', () => {
  assert.equal(globalThis.LaEle.storage, storage);
  for (const fn of ['getSettings', 'saveSettings', 'getRecords', 'getCollection', 'recordScan',
    'setTabSummary', 'getTabSummary', 'resetAll', 'addCustomWord', 'removeCustomWord', 'onChange']) {
    assert.equal(typeof storage[fn], 'function', fn);
  }
});

// ---------- settings ----------

test('getSettings devolve os padrões quando nada foi salvo', async () => {
  assert.deepEqual(await storage.getSettings(), {
    autoScan: true, animations: true, speed: 'normal', showHud: true, customWords: []
  });
});

test('getSettings mescla settings parciais antigos com os padrões', async () => {
  chromeMock.storage.local.data.settings = { autoScan: false, speed: 'rapido' };
  const s = await storage.getSettings();
  assert.equal(s.autoScan, false);
  assert.equal(s.speed, 'rapido');
  assert.equal(s.animations, true);
  assert.equal(s.showHud, true);
  assert.deepEqual(s.customWords, []);
});

test('getSettings corrige velocidade inválida e customWords inválido', async () => {
  chromeMock.storage.local.data.settings = { speed: 'turbo', customWords: 'x' };
  const s = await storage.getSettings();
  assert.equal(s.speed, 'normal');
  assert.deepEqual(s.customWords, []);
});

test('saveSettings mescla parcial e persiste', async () => {
  const next = await storage.saveSettings({ showHud: false });
  assert.equal(next.showHud, false);
  assert.equal(next.autoScan, true);
  assert.equal((await storage.getSettings()).showHud, false);
  await storage.saveSettings({ speed: 'lento' });
  const s = await storage.getSettings();
  assert.equal(s.speed, 'lento');
  assert.equal(s.showHud, false);
});

// ---------- records / recordScan ----------

test('getRecords devolve os padrões', async () => {
  assert.deepEqual(await storage.getRecords(), {
    global: { best: 0, url: '', title: '', host: '', at: 0 },
    bySite: {},
    totals: { scans: 0, words: 0, points: 0 }
  });
  assert.deepEqual(await storage.getCollection(), {});
});

test('recordScan: primeiro scan é recorde global e do site', async () => {
  const res = await storage.recordScan(summary(), ['dar', 'pau']);
  assert.deepEqual(res, { newGlobalBest: true, newSiteBest: true });
  const r = await storage.getRecords();
  assert.deepEqual(r.global, { best: 1000, url: 'https://exemplo.com/a', title: 'Página A', host: 'exemplo.com', at: 1000 });
  assert.deepEqual(r.bySite['exemplo.com'], {
    best: 1000, last: 1000, maxCombo: 3, url: 'https://exemplo.com/a', title: 'Página A', at: 1000
  });
  assert.deepEqual(r.totals, { scans: 1, words: 4, points: 1000 });
});

test('recordScan: scan menor não bate recorde, mas atualiza last, maxCombo e totais', async () => {
  await storage.recordScan(summary(), []);
  const res = await storage.recordScan(summary({ total: 400, count: 2, maxCombo: 5, url: 'https://exemplo.com/b', at: 2000 }), []);
  assert.deepEqual(res, { newGlobalBest: false, newSiteBest: false });
  const r = await storage.getRecords();
  const site = r.bySite['exemplo.com'];
  assert.equal(site.best, 1000);
  assert.equal(site.last, 400);
  assert.equal(site.maxCombo, 5);
  assert.equal(site.url, 'https://exemplo.com/a');
  assert.equal(r.global.best, 1000);
  assert.deepEqual(r.totals, { scans: 2, words: 6, points: 1400 });
});

test('recordScan: empate não é recorde', async () => {
  await storage.recordScan(summary(), []);
  const res = await storage.recordScan(summary({ at: 3000 }), []);
  assert.deepEqual(res, { newGlobalBest: false, newSiteBest: false });
});

test('recordScan: recorde de site novo sem bater o global', async () => {
  await storage.recordScan(summary({ total: 5000 }), []);
  const res = await storage.recordScan(summary({ host: 'outro.com', url: 'https://outro.com/', total: 300, at: 5 }), []);
  assert.deepEqual(res, { newGlobalBest: false, newSiteBest: true });
  const r = await storage.getRecords();
  assert.equal(r.bySite['outro.com'].best, 300);
  assert.equal(r.global.host, 'exemplo.com');
});

test('recordScan: superar o recorde do site atualiza url, title e at', async () => {
  await storage.recordScan(summary(), []);
  const res = await storage.recordScan(summary({ total: 2500, url: 'https://exemplo.com/c', title: 'C', at: 9000 }), []);
  assert.deepEqual(res, { newGlobalBest: true, newSiteBest: true });
  const site = (await storage.getRecords()).bySite['exemplo.com'];
  assert.equal(site.best, 2500);
  assert.equal(site.url, 'https://exemplo.com/c');
  assert.equal(site.title, 'C');
  assert.equal(site.at, 9000);
});

test('recordScan: total 0 nunca é recorde, mas conta como scan', async () => {
  const res = await storage.recordScan(summary({ total: 0, count: 0, maxCombo: 0 }), []);
  assert.deepEqual(res, { newGlobalBest: false, newSiteBest: false });
  const r = await storage.getRecords();
  assert.equal(r.global.best, 0);
  assert.equal(r.totals.scans, 1);
  assert.equal(r.bySite['exemplo.com'].best, 0);
});

test('recordScan: coleção conta uma ocorrência por repetição e guarda firstAt/firstUrl', async () => {
  await storage.recordScan(summary({ at: 111 }), ['dar', 'pau', 'dar', 'dar']);
  let c = await storage.getCollection();
  assert.deepEqual(c.dar, { count: 3, firstAt: 111, firstUrl: 'https://exemplo.com/a' });
  assert.deepEqual(c.pau, { count: 1, firstAt: 111, firstUrl: 'https://exemplo.com/a' });

  await storage.recordScan(summary({ at: 222, url: 'https://exemplo.com/z' }), ['dar', 'rola']);
  c = await storage.getCollection();
  assert.deepEqual(c.dar, { count: 4, firstAt: 111, firstUrl: 'https://exemplo.com/a' });
  assert.deepEqual(c.rola, { count: 1, firstAt: 222, firstUrl: 'https://exemplo.com/z' });
});

test('recordScan ignora ids inválidos e aceita entryIds ausente', async () => {
  await storage.recordScan(summary(), [null, '', 42, 'dar']);
  assert.deepEqual(Object.keys(await storage.getCollection()), ['dar']);
  await storage.recordScan(summary(), undefined);
  assert.equal((await storage.getRecords()).totals.scans, 2);
});

test('recordScan: chamadas simultâneas não perdem atualizações (fila)', async () => {
  const N = 25;
  const results = await Promise.all(
    Array.from({ length: N }, (_, i) =>
      storage.recordScan(summary({ total: (i + 1) * 10, count: 2, maxCombo: i }), ['dar', 'pau']))
  );
  const r = await storage.getRecords();
  const c = await storage.getCollection();
  assert.equal(r.totals.scans, N);
  assert.equal(r.totals.words, N * 2);
  assert.equal(r.totals.points, 10 * (N * (N + 1)) / 2);
  assert.equal(c.dar.count, N);
  assert.equal(c.pau.count, N);
  assert.equal(r.global.best, N * 10);
  assert.equal(r.bySite['exemplo.com'].maxCombo, N - 1);
  // como as chamadas executam em ordem, cada uma foi recorde (totais crescentes)
  assert.ok(results.every((x) => x.newGlobalBest && x.newSiteBest));
});

test('fila continua funcionando depois de uma escrita que falha', async () => {
  const area = chromeMock.storage.local;
  const originalSet = area.set;
  area.set = async () => { throw new Error('falha de disco'); };
  await assert.rejects(storage.recordScan(summary(), ['dar']), /falha de disco/);
  area.set = originalSet;
  const res = await storage.recordScan(summary(), ['dar']);
  assert.equal(res.newGlobalBest, true);
  assert.equal((await storage.getCollection()).dar.count, 1);
});

// ---------- resumo por aba ----------

test('setTabSummary / getTabSummary usam a chave tab:<id> em storage.session', async () => {
  assert.equal(await storage.getTabSummary(7), null);
  const s = summary();
  await storage.setTabSummary(7, s);
  assert.deepEqual(chromeMock.storage.session.data['tab:7'], s);
  assert.deepEqual(await storage.getTabSummary(7), s);
  assert.equal(await storage.getTabSummary(8), null);
  await storage.removeTabSummary(7);
  assert.equal(await storage.getTabSummary(7), null);
});

// ---------- palavras próprias ----------

test('addCustomWord: id, forms, tier e phrase', async () => {
  const w = await storage.addCustomWord({ label: 'Cenoura', coef: 2 });
  assert.match(w.id, /^custom-cenoura-[0-9a-z]+$/);
  assert.equal(w.label, 'Cenoura');
  assert.equal(w.coef, 2);
  assert.equal(w.tier, 'comum');
  assert.deepEqual(w.forms, ['cenoura', 'cenouras']);
  assert.deepEqual(w.stems, []);
  assert.equal(w.phrase, false);
  assert.deepEqual((await storage.getSettings()).customWords, [w]);
});

test('addCustomWord: expressão com espaço vira phrase e slug sem acento', async () => {
  const w = await storage.addCustomWord({ label: 'Bola de Cristal', coef: 3.5 });
  assert.equal(w.phrase, true);
  assert.equal(w.tier, 'pesado');
  assert.match(w.id, /^custom-bola-de-cristal-/);
  assert.equal(w.forms[0], 'bola de cristal');
  const a = await storage.addCustomWord({ label: 'Maçã', coef: 1 });
  assert.match(a.id, /^custom-maca-/);
  assert.equal(a.forms[0], 'maçã');
});

test('addCustomWord: tiers pelos limites de coef', async () => {
  const tier = async (coef) => (await storage.addCustomWord({ label: 'x' + coef, coef })).tier;
  assert.equal(await tier(0.5), 'leve');
  assert.equal(await tier(1.49), 'leve');
  assert.equal(await tier(1.5), 'comum');
  assert.equal(await tier(2.99), 'comum');
  assert.equal(await tier(3), 'pesado');
  assert.equal(await tier(3.99), 'pesado');
  assert.equal(await tier(4), 'lendario');
  assert.equal(await tier(5), 'lendario');
});

test('addCustomWord: palavra vazia é rejeitada e coef é limitado a 0.5..5', async () => {
  await assert.rejects(storage.addCustomWord({ label: '   ', coef: 2 }));
  assert.equal((await storage.addCustomWord({ label: 'alto', coef: 99 })).coef, 5);
  assert.equal((await storage.addCustomWord({ label: 'baixo', coef: 0 })).coef, 0.5);
});

test('addCustomWord: adições simultâneas e mesmo rótulo geram ids únicos', async () => {
  const words = await Promise.all([1, 2, 3, 4, 5].map(() => storage.addCustomWord({ label: 'igual', coef: 2 })));
  const ids = new Set(words.map((w) => w.id));
  assert.equal(ids.size, 5);
  assert.equal((await storage.getSettings()).customWords.length, 5);
});

test('removeCustomWord remove só a palavra pedida', async () => {
  const a = await storage.addCustomWord({ label: 'um', coef: 2 });
  const b = await storage.addCustomWord({ label: 'dois', coef: 2 });
  assert.equal(await storage.removeCustomWord(a.id), true);
  assert.deepEqual((await storage.getSettings()).customWords.map((w) => w.id), [b.id]);
  assert.equal(await storage.removeCustomWord('nao-existe'), false);
});

test('saveSettings preserva customWords existentes', async () => {
  const w = await storage.addCustomWord({ label: 'abc', coef: 2 });
  await storage.saveSettings({ animations: false });
  const s = await storage.getSettings();
  assert.equal(s.animations, false);
  assert.deepEqual(s.customWords, [w]);
});

// ---------- resetAll ----------

test('resetAll zera recordes, totais e coleção, mantendo as configurações', async () => {
  await storage.saveSettings({ speed: 'rapido' });
  const w = await storage.addCustomWord({ label: 'abc', coef: 2 });
  await storage.recordScan(summary(), ['dar']);
  await storage.resetAll();
  assert.deepEqual(await storage.getRecords(), {
    global: { best: 0, url: '', title: '', host: '', at: 0 },
    bySite: {},
    totals: { scans: 0, words: 0, points: 0 }
  });
  assert.deepEqual(await storage.getCollection(), {});
  const s = await storage.getSettings();
  assert.equal(s.speed, 'rapido');
  assert.deepEqual(s.customWords, [w]);
  // depois do reset o próximo scan volta a ser recorde
  assert.equal((await storage.recordScan(summary({ total: 1 }), [])).newGlobalBest, true);
});

// ---------- onChange ----------

test('onChange repassa só settings/records/collection da área local', async () => {
  const seen = [];
  const off = storage.onChange((changes, area) => seen.push({ keys: Object.keys(changes).sort(), area }));
  await storage.saveSettings({ showHud: false });
  await storage.recordScan(summary(), ['dar']);
  await chromeMock.storage.local.set({ outraChave: 1 });
  await chromeMock.storage.session.set({ 'tab:1': {} });
  assert.deepEqual(seen, [
    { keys: ['settings'], area: 'local' },
    { keys: ['collection', 'records'], area: 'local' }
  ]);
  off();
  await storage.saveSettings({ showHud: true });
  assert.equal(seen.length, 2);
});

// ---------- formatCompact (service worker) ----------

test('formatCompact: formato compacto de badge', () => {
  const f = sw.formatCompact;
  assert.equal(f(0), '0');
  assert.equal(f(7), '7');
  assert.equal(f(950), '950');
  assert.equal(f(999), '999');
  assert.equal(f(1000), '1k');
  assert.equal(f(1234), '1.2k');
  assert.equal(f(1999), '1.9k');
  assert.equal(f(9999), '9.9k');
  assert.equal(f(10000), '10k');
  assert.equal(f(12345), '12k');
  assert.equal(f(999999), '999k');
  assert.equal(f(1000000), '1M');
  assert.equal(f(1234567), '1.2M');
  assert.equal(f(12345678), '12M');
  assert.equal(f(1500000000), '1.5B');
  assert.equal(f(-5), '0');
  assert.equal(f(NaN), '0');
  assert.equal(f('1234'), '1.2k');
  assert.equal(f(1234.9), '1.2k');
});

// ---------- service worker: handlers ----------

function installSwChrome() {
  const calls = { badgeText: [], broadcasts: [] };
  chromeMock.action = {
    setBadgeText: async (a) => { calls.badgeText.push(a); },
    setBadgeBackgroundColor: async () => {},
    setBadgeTextColor: async () => {}
  };
  chromeMock.runtime = {
    sendMessage: async (m) => {
      calls.broadcasts.push(m);
      throw new Error('Could not establish connection. Receiving end does not exist.');
    }
  };
  return calls;
}

test('service worker: LAELE_PROGRESS atualiza o badge da aba do remetente', () => {
  const calls = installSwChrome();
  const keep = sw.onMessage({ type: 'LAELE_PROGRESS', total: 12345, count: 3 }, { tab: { id: 5 } }, () => {});
  assert.equal(keep, false);
  assert.deepEqual(calls.badgeText, [{ tabId: 5, text: '12k' }]);
});

test('service worker: LAELE_RESULT grava resumo, recordes, badge, broadcast e responde', async () => {
  const calls = installSwChrome();
  const s = summary({ total: 1234 });
  const response = await new Promise((resolve) => {
    const keep = sw.onMessage({ type: 'LAELE_RESULT', summary: s, entryIds: ['dar', 'dar'] }, { tab: { id: 9 } }, resolve);
    assert.equal(keep, true);
  });
  assert.deepEqual(response, { newGlobalBest: true, newSiteBest: true });
  assert.deepEqual(await storage.getTabSummary(9), s);
  assert.equal((await storage.getCollection()).dar.count, 2);
  assert.deepEqual(calls.badgeText.at(-1), { tabId: 9, text: '1.2k' });
  assert.deepEqual(calls.broadcasts, [{ type: 'LAELE_UPDATED', tabId: 9, summary: s }]);
});

test('service worker: resultado vazio limpa o badge', async () => {
  const calls = installSwChrome();
  await new Promise((resolve) => {
    sw.onMessage({ type: 'LAELE_RESULT', summary: summary({ total: 0, count: 0 }), entryIds: [] }, { tab: { id: 3 } }, resolve);
  });
  assert.deepEqual(calls.badgeText.at(-1), { tabId: 3, text: '' });
});

test('service worker: navegação e fechamento limpam badge e resumo da aba', async () => {
  const calls = installSwChrome();
  await storage.setTabSummary(4, summary());
  sw.onTabUpdated(4, { status: 'loading' }, {});          // reload sem mudança de url: mantém
  assert.notEqual(await storage.getTabSummary(4), null);
  sw.onTabUpdated(4, { status: 'complete', url: 'https://x.com' }, {}); // sem loading: mantém
  assert.notEqual(await storage.getTabSummary(4), null);
  sw.onTabUpdated(4, { status: 'loading', url: 'https://outra.com' }, {});
  await tick(); await tick();
  assert.equal(await storage.getTabSummary(4), null);
  assert.deepEqual(calls.badgeText.at(-1), { tabId: 4, text: '' });

  await storage.setTabSummary(6, summary());
  sw.onTabRemoved(6);
  await tick(); await tick();
  assert.equal(await storage.getTabSummary(6), null);
});

test('service worker: onInstalled grava settings padrão sem sobrescrever os existentes', async () => {
  installSwChrome();
  await chromeMock.storage.local.set({ settings: { speed: 'lento' } });
  sw.onInstalled();
  await new Promise((r) => setTimeout(r, 30));
  const raw = chromeMock.storage.local.data.settings;
  assert.equal(raw.speed, 'lento');
  assert.equal(raw.autoScan, true);
  assert.deepEqual(raw.customWords, []);
});

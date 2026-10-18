'use strict';

const test = require('node:test');
const assert = require('node:assert');

const dictionary = require('../src/shared/dictionary.js');
const engine = require('../src/shared/engine.js');

const { CONFIG } = engine;

// índice mínimo e controlado: coef 1 em tudo, para os números ficarem previsíveis
const SIMPLE = engine.compile([
  { id: 'xis', label: 'xis', coef: 1, tier: 'leve', forms: ['xis'], stems: [], phrase: false },
  { id: 'duo', label: 'duo', coef: 2, tier: 'comum', forms: ['duo'], stems: [], phrase: false }
]);

function fillers(n) {
  return Array.from({ length: n }, () => 'bla').join(' ');
}

function ids(result) {
  return result.matches.map((m) => m.entryId);
}

test('normalize: minúsculas, acentos e cedilha', () => {
  assert.strictEqual(engine.normalize('ÁÉÍÓÚ Ção Ñandú'), 'aeiou cao nandu');
  assert.strictEqual(engine.normalize('Por TRÁS'), 'por tras');
  assert.strictEqual(engine.normalize(null), '');
});

test('normalize: leet', () => {
  assert.strictEqual(engine.normalize('p4u'), 'pau');
  assert.strictEqual(engine.normalize('r0l4'), 'rola');
  assert.strictEqual(engine.normalize('c0m3r'), 'comer');
  assert.strictEqual(engine.normalize('@$7'), 'ast');
  assert.strictEqual(engine.normalize('5ex0'), 'sexo');
});

test('normalize: letras repetidas 3+ colapsam, 2 ficam', () => {
  assert.strictEqual(engine.normalize('roooola'), 'rola');
  assert.strictEqual(engine.normalize('pauuuuu'), 'pau');
  assert.strictEqual(engine.normalize('caaaaralho'), 'caralho');
  assert.strictEqual(engine.normalize('carro'), 'carro');
  assert.strictEqual(engine.normalize('rooola'), 'rola');
  assert.strictEqual(engine.normalize('roola'), 'roola');
});

test('tokenize: offsets apontam para o texto original', () => {
  const text = '  Olá, VOU dar uma Passada!! \u{1F600} Pão-de-queijo p4u';
  const tokens = engine.tokenize(text);
  assert.ok(tokens.length >= 8);
  for (const t of tokens) {
    assert.strictEqual(text.slice(t.start, t.end), t.raw);
    assert.strictEqual(t.norm, engine.normalize(t.raw));
  }
  assert.deepStrictEqual(
    tokens.map((t) => t.norm),
    ['ola', 'vou', 'dar', 'uma', 'passada', 'pao', 'de', 'queijo', 'pau']
  );
  assert.strictEqual(tokens[0].start, 2);
});

test('tokenize: ignora símbolos soltos e texto vazio', () => {
  assert.deepStrictEqual(engine.tokenize(''), []);
  assert.deepStrictEqual(engine.tokenize('... $ @ !!'), []);
});

test('analyze: palavra simples com offsets e pontos', () => {
  const text = 'Que pau enorme';
  const r = engine.analyze(text);
  assert.strictEqual(r.matches.length, 1);
  const m = r.matches[0];
  assert.strictEqual(m.entryId, 'pau');
  assert.strictEqual(m.raw, 'pau');
  assert.strictEqual(m.start, 4);
  assert.strictEqual(m.end, 7);
  assert.strictEqual(text.slice(m.start, m.end), 'pau');
  assert.strictEqual(m.combo, 1);
  assert.strictEqual(m.multiplier, 1);
  assert.strictEqual(m.points, Math.round(CONFIG.basePoints * m.coef));
  assert.strictEqual(r.total, m.points);
  assert.strictEqual(r.maxCombo, 1);
});

test('analyze: acento, caixa alta, leet e repetição casam com o raw original', () => {
  const text = 'POR TRÁS e P4UUUUU e Rooooola';
  const r = engine.analyze(text);
  assert.deepStrictEqual(ids(r), ['por-tras', 'pau', 'rola']);
  assert.strictEqual(r.matches[0].raw, 'POR TRÁS');
  assert.strictEqual(r.matches[1].raw, 'P4UUUUU');
  assert.strictEqual(r.matches[2].raw, 'Rooooola');
  r.matches.forEach((m) => assert.strictEqual(text.slice(m.start, m.end), m.raw));
});

test('analyze: espaços e quebra de linha dentro da expressão', () => {
  assert.deepStrictEqual(ids(engine.analyze('Por   trás')), ['por-tras']);
  assert.deepStrictEqual(ids(engine.analyze('dar\numa passada')), ['dar-uma-passada']);
});

test('analyze: expressão tem prioridade sobre palavra solta (exemplo clássico)', () => {
  const text = 'vou dar uma passada';
  const r = engine.analyze(text);
  assert.strictEqual(r.matches.length, 1);
  const m = r.matches[0];
  assert.strictEqual(m.entryId, 'dar-uma-passada');
  assert.strictEqual(m.raw, 'dar uma passada');
  assert.strictEqual(m.start, 4);
  assert.strictEqual(m.end, text.length);
});

test('analyze: expressão gulosa pelo maior número de tokens', () => {
  const r = engine.analyze('segura no pau da barraca');
  assert.deepStrictEqual(ids(r), ['segurar-no-pau-da-barraca']);
  assert.strictEqual(r.matches[0].raw, 'segura no pau da barraca');

  // expressão menor ("dar uma") perde para a maior ("dar uma rapidinha")
  assert.deepStrictEqual(ids(engine.analyze('deu uma rapidinha')), ['dar-uma-rapidinha']);
  assert.deepStrictEqual(ids(engine.analyze('deu uma folga')), ['dar-uma']);
});

test('analyze: tokens consumidos por expressão não casam de novo', () => {
  const r = engine.analyze('come tudo');
  assert.strictEqual(r.matches.length, 1);
  assert.strictEqual(r.matches[0].entryId, 'comer-tudo');
});

test('analyze: expressão não atravessa fim de frase', () => {
  const r = engine.analyze('Eu vou dar. Uma coisa importante.');
  assert.ok(!ids(r).includes('dar-uma'));
  assert.deepStrictEqual(ids(r), ['dar']);
  assert.ok(!ids(engine.analyze('dar\n\numa passada')).includes('dar-uma-passada'));
});

test('analyze: tokens consumidos por uma expressão maior em sobreposição', () => {
  const idx = engine.compile([
    { id: 'ab', label: 'ab', coef: 1, forms: ['alfa beta'] },
    { id: 'bcd', label: 'bcd', coef: 1, forms: ['beta gama delta'] }
  ]);
  const r = engine.analyze('alfa beta gama delta', idx);
  assert.deepStrictEqual(ids(r), ['bcd']);
});

test('combo: incrementa e multiplica', () => {
  const r = engine.analyze('xis xis xis', SIMPLE);
  assert.deepStrictEqual(r.matches.map((m) => m.combo), [1, 2, 3]);
  assert.deepStrictEqual(r.matches.map((m) => m.multiplier), [1, 1.5, 2]);
  assert.deepStrictEqual(r.matches.map((m) => m.points), [100, 150, 200]);
  assert.strictEqual(r.total, 450);
  assert.strictEqual(r.maxCombo, 3);
});

test('combo: coeficiente entra na conta dos pontos', () => {
  const r = engine.analyze('xis duo', SIMPLE);
  assert.deepStrictEqual(r.matches.map((m) => m.points), [100, Math.round(100 * 2 * 1.5)]);
});

test('combo: janela de tokens e quebra do combo', () => {
  const dentro = engine.analyze('xis ' + fillers(CONFIG.comboWindow) + ' xis', SIMPLE);
  assert.deepStrictEqual(dentro.matches.map((m) => m.combo), [1, 2]);

  const fora = engine.analyze('xis ' + fillers(CONFIG.comboWindow + 1) + ' xis', SIMPLE);
  assert.deepStrictEqual(fora.matches.map((m) => m.combo), [1, 1]);
  assert.strictEqual(fora.maxCombo, 1);
  assert.strictEqual(fora.total, 200);
});

test('combo: recomeça depois de quebrar e acompanha o maior combo', () => {
  const text = 'xis xis xis ' + fillers(CONFIG.comboWindow + 1) + ' xis xis';
  const r = engine.analyze(text, SIMPLE);
  assert.deepStrictEqual(r.matches.map((m) => m.combo), [1, 2, 3, 1, 2]);
  assert.strictEqual(r.maxCombo, 3);
});

test('combo: expressão conta como um match e a janela parte do fim dela', () => {
  const r = engine.analyze('vou dar uma passada e depois pau', undefined);
  assert.deepStrictEqual(r.matches.map((m) => m.combo), [1, 2]);
});

test('combo: cada chamada de analyze é um bloco independente', () => {
  const a = engine.analyze('xis xis', SIMPLE);
  const b = engine.analyze('xis xis', SIMPLE);
  assert.deepStrictEqual(a.matches.map((m) => m.combo), [1, 2]);
  assert.deepStrictEqual(b.matches.map((m) => m.combo), [1, 2]);
});

test('combo: multiplicador respeita o máximo', () => {
  const text = Array.from({ length: 30 }, () => 'xis').join(' ');
  const r = engine.analyze(text, SIMPLE);
  assert.strictEqual(r.matches.length, 30);
  assert.strictEqual(r.maxCombo, 30);
  const last = r.matches[29];
  assert.strictEqual(last.multiplier, CONFIG.maxMultiplier);
  assert.strictEqual(last.points, CONFIG.basePoints * CONFIG.maxMultiplier);
  r.matches.forEach((m) => assert.ok(m.multiplier <= CONFIG.maxMultiplier));
});

test('CONFIG é lido a cada análise', () => {
  const original = CONFIG.comboStep;
  try {
    CONFIG.comboStep = 1;
    const r = engine.analyze('xis xis xis', SIMPLE);
    assert.deepStrictEqual(r.matches.map((m) => m.multiplier), [1, 2, 3]);
  } finally {
    CONFIG.comboStep = original;
  }
});

test('stems: prefixo com no máximo +5 letras', () => {
  assert.deepStrictEqual(ids(engine.analyze('chupando')), ['chupar']);
  assert.deepStrictEqual(ids(engine.analyze('chupeta')), ['chupar']);
  assert.deepStrictEqual(ids(engine.analyze('safadinhas')), ['safado']);
  assert.deepStrictEqual(ids(engine.analyze('chupacabras')), []);
});

test('palavras customizadas entram no índice padrão', () => {
  assert.deepStrictEqual(ids(engine.analyze('comprei uma jabuticaba')), []);
  try {
    const n = engine.setCustomEntries([
      { id: 'custom-jabuticaba', label: 'jabuticaba', coef: 2, tier: 'comum', forms: ['jabuticaba', 'jabuticabas'], stems: [], phrase: false }
    ]);
    assert.strictEqual(n, 1);
    const text = 'Comprei uma JABUTICABA ontem';
    const r = engine.analyze(text);
    assert.deepStrictEqual(ids(r), ['custom-jabuticaba']);
    assert.strictEqual(r.matches[0].coef, 2);
    assert.strictEqual(r.matches[0].points, 200);
    assert.strictEqual(text.slice(r.matches[0].start, r.matches[0].end), 'JABUTICABA');
    // o dicionário embutido continua funcionando junto
    assert.deepStrictEqual(ids(engine.analyze('pau e jabuticabas')), ['pau', 'custom-jabuticaba']);
  } finally {
    engine.setCustomEntries([]);
  }
  assert.deepStrictEqual(ids(engine.analyze('comprei uma jabuticaba')), []);
});

test('palavras customizadas: só label, expressão e entradas inválidas', () => {
  try {
    engine.setCustomEntries([
      { label: 'pé de moleque', coef: 3 },
      { label: '' },
      null
    ]);
    const r = engine.analyze('adoro pe de moleque');
    assert.strictEqual(r.matches.length, 1);
    assert.strictEqual(r.matches[0].raw, 'pe de moleque');
    assert.strictEqual(r.matches[0].points, 300);
  } finally {
    engine.setCustomEntries([]);
  }
});

test('falsos positivos: dar/comer não casam por prefixo', () => {
  const text = [
    'Os dados do computador comercial da empresa pausaram a pauta de Paulo.',
    'O dardo, o darwinismo, a comunidade e a comissão compraram comida.',
    'Sentado na pausa, ele comentou o comportamento do comedor de mangas.'
  ].join(' ');
  const r = engine.analyze(text);
  assert.deepStrictEqual(r.matches.map((m) => m.raw), []);
  assert.strictEqual(r.total, 0);
  assert.strictEqual(r.maxCombo, 0);
});

test('falsos positivos: "da", "de", "no" soltos não pontuam', () => {
  assert.strictEqual(engine.analyze('da casa de campo no centro').matches.length, 0);
  assert.strictEqual(engine.analyze('dá pra ver').matches.length, 0);
});

test('performance: 100 mil palavras em tempo razoável', () => {
  const base = 'o rapaz foi ao mercado comprar pão e leite mas esqueceu a carteira ';
  const text = base.repeat(Math.ceil(100000 / 13)) + ' vou dar uma passada no pau da barraca';
  const t0 = Date.now();
  const r = engine.analyze(text);
  const dt = Date.now() - t0;
  assert.ok(r.matches.length >= 2);
  assert.ok(dt < 5000, 'demorou ' + dt + 'ms');
});

test('rank: faixas e notas', () => {
  assert.strictEqual(engine.rank(0).grade, '-');
  assert.strictEqual(engine.rank(-5).grade, '-');
  assert.strictEqual(engine.rank(1).grade, 'D');
  assert.strictEqual(engine.rank(299).grade, 'D');
  assert.strictEqual(engine.rank(300).grade, 'C');
  assert.strictEqual(engine.rank(999).grade, 'C');
  assert.strictEqual(engine.rank(1000).grade, 'B');
  assert.strictEqual(engine.rank(2999).grade, 'B');
  assert.strictEqual(engine.rank(3000).grade, 'A');
  assert.strictEqual(engine.rank(7999).grade, 'A');
  assert.strictEqual(engine.rank(8000).grade, 'S');
  assert.strictEqual(engine.rank(1e9).grade, 'S');
  assert.strictEqual(engine.rank(8000).label, 'Lá ele supremo');
  ['-', 'D', 'C', 'B', 'A', 'S'].forEach((g) => {
    const total = { '-': 0, D: 100, C: 500, B: 2000, A: 5000, S: 9000 }[g];
    const rk = engine.rank(total);
    assert.strictEqual(rk.grade, g);
    assert.ok(typeof rk.label === 'string' && rk.label.length > 0);
  });
});

test('dicionário: estrutura e sanidade', () => {
  const entries = dictionary.entries;
  assert.strictEqual(dictionary.version, 1);
  assert.ok(entries.length >= 120, 'entradas: ' + entries.length);

  const seen = new Set();
  const tiers = new Set(['leve', 'comum', 'pesado', 'lendario']);
  for (const e of entries) {
    assert.match(e.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, 'id inválido: ' + e.id);
    assert.ok(!seen.has(e.id), 'id duplicado: ' + e.id);
    seen.add(e.id);
    assert.ok(typeof e.label === 'string' && e.label.length > 0);
    assert.ok(e.coef >= 0.5 && e.coef <= 5, 'coef fora da faixa: ' + e.id);
    assert.ok(tiers.has(e.tier), 'tier inválido: ' + e.id);
    assert.ok(Array.isArray(e.forms) && Array.isArray(e.stems));
    assert.ok(e.forms.length + e.stems.length > 0, 'sem formas: ' + e.id);
    if (e.phrase) {
      assert.ok(e.forms.every((f) => /\s/.test(f.trim())), 'phrase com forma de 1 palavra: ' + e.id);
    }
  }

  for (const tier of tiers) {
    assert.ok(entries.some((e) => e.tier === tier), 'sem entradas no tier ' + tier);
  }
});

test('dicionário: expressões valem mais que palavras soltas', () => {
  const avg = (list) => list.reduce((s, e) => s + e.coef, 0) / list.length;
  const phrases = dictionary.entries.filter((e) => e.phrase);
  const words = dictionary.entries.filter((e) => !e.phrase);
  assert.ok(phrases.length >= 40);
  assert.ok(avg(phrases) > avg(words));
  assert.ok(phrases.every((e) => e.coef >= 2.5));
});

test('dicionário: nenhuma forma solta é palavra funcional comum', () => {
  const banned = ['da', 'de', 'do', 'no', 'na', 'em', 'um', 'uma', 'o', 'a', 'e', 'que', 'com', 'como', 'por', 'para', 'se', 'sua', 'seu'];
  const index = engine.getDefaultIndex();
  for (const w of banned) {
    assert.strictEqual(index.words.has(w), false, 'forma solta perigosa: ' + w);
  }
});

test('dicionário: formas não repetidas entre entradas', () => {
  const seen = new Map();
  for (const e of dictionary.entries) {
    for (const f of e.forms) {
      const key = engine.tokenize(f).map((t) => t.norm).join(' ');
      if (seen.has(key)) assert.strictEqual(seen.get(key), e.id, 'forma repetida: ' + key);
      seen.set(key, e.id);
    }
  }
});

test('dicionário: exemplos clássicos do lá ele', () => {
  const casos = {
    'vou dar uma passada': ['dar-uma-passada'],
    'come tudo': ['comer-tudo'],
    'segura no pau da barraca': ['segurar-no-pau-da-barraca'],
    'ficou de quatro': ['de-quatro'],
    'pode entrar': ['pode-entrar'],
    'vai até o talo': ['ate-o-talo'],
    'engole tudo': ['engolir-tudo'],
    'pega no pau': ['pegar-no-pau']
  };
  for (const [texto, esperado] of Object.entries(casos)) {
    assert.deepStrictEqual(ids(engine.analyze(texto)), esperado, texto);
  }
});

test('analyze: entradas vazias ou inválidas', () => {
  for (const v of ['', null, undefined]) {
    const r = engine.analyze(v);
    assert.deepStrictEqual(r, { matches: [], total: 0, maxCombo: 0 });
  }
  assert.strictEqual(engine.analyze('texto sem nada de especial').total, 0);
});

// ---------- phrases (Top lá ele) ----------

// matches artificiais: cada palavra de `itens` é procurada no texto, na ordem
function fakeMatches(text, itens) {
  let from = 0;
  return itens.map(([palavra, combo, points = 100, tier = 'comum']) => {
    const start = text.indexOf(palavra, from);
    assert.ok(start >= 0, 'palavra não achada: ' + palavra);
    from = start + palavra.length;
    return { start, end: from, raw: palavra, entryId: palavra, label: palavra, coef: 1, tier, combo, multiplier: 1, points };
  });
}

function hitTexts(p) {
  return p.hits.map((h) => p.text.slice(h.start, h.end));
}

function palavras(n, prefixo) {
  return Array.from({ length: n }, (_, i) => (prefixo || 'palavra') + i).join(' ');
}

test('phrases: entradas vazias ou sem sequência devolvem lista vazia', () => {
  assert.deepStrictEqual(engine.phrases('', []), []);
  assert.deepStrictEqual(engine.phrases(null, null), []);
  assert.deepStrictEqual(engine.phrases('texto', undefined), []);
});

test('phrases: sequência de 2+ matches vira um trecho com pontos, combo e contagem', () => {
  const text = 'Ele vai dar uma passada e comer tudo.';
  const r = engine.analyze(text);
  const out = engine.phrases(text, r.matches);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].text, text);
  assert.strictEqual(out[0].count, 2);
  assert.strictEqual(out[0].maxCombo, 2);
  assert.strictEqual(out[0].points, r.total);
  assert.deepStrictEqual(hitTexts(out[0]), ['dar uma passada', 'comer tudo']);
  assert.deepStrictEqual(out[0].hits.map((h) => h.tier), r.matches.map((m) => m.tier));
});

test('phrases: match isolado não vira trecho', () => {
  const um = 'xis no meio de nada.';
  assert.deepStrictEqual(engine.phrases(um, engine.analyze(um, SIMPLE).matches), []);
  const longe = 'xis ' + fillers(20) + ' xis';
  const r = engine.analyze(longe, SIMPLE);
  assert.deepStrictEqual(r.matches.map((m) => m.combo), [1, 1]);
  assert.deepStrictEqual(engine.phrases(longe, r.matches), []);
});

test('phrases: duas sequências no mesmo bloco viram dois trechos', () => {
  const text = 'xis duo xis. ' + fillers(12) + '. duo xis!';
  const r = engine.analyze(text, SIMPLE);
  assert.deepStrictEqual(r.matches.map((m) => m.combo), [1, 2, 3, 1, 2]);
  const out = engine.phrases(text, r.matches);
  assert.strictEqual(out.length, 2);
  assert.strictEqual(out[0].text, 'xis duo xis.');
  assert.strictEqual(out[0].count, 3);
  assert.strictEqual(out[0].maxCombo, 3);
  assert.strictEqual(out[1].text, 'duo xis!');
  assert.strictEqual(out[1].count, 2);
  assert.strictEqual(out[1].maxCombo, 2);
  assert.strictEqual(out[0].points, r.matches.slice(0, 3).reduce((s, m) => s + m.points, 0));
  assert.strictEqual(out[1].points, r.matches.slice(3).reduce((s, m) => s + m.points, 0));
});

test('phrases: recorta pela frase (ponto, exclamação, interrogação e reticências)', () => {
  const text = 'Primeira frase sem nada. Segunda tem xis? Sim, duo! Quarta frase ainda sem nada nenhum por aqui… Quinta xis duo. Sexta qualquer.';
  const r = engine.analyze(text, SIMPLE);
  const out = engine.phrases(text, r.matches);
  assert.deepStrictEqual(out.map((p) => p.text), ['Segunda tem xis? Sim, duo!', 'Quinta xis duo.']);
  assert.strictEqual(out[0].count, 2);
  assert.strictEqual(out[1].count, 2);
  // ponto no meio de número não quebra a frase
  const t2 = 'Custou 3.5 reais e xis com duo.';
  assert.strictEqual(engine.phrases(t2, engine.analyze(t2, SIMPLE).matches)[0].text, t2);
  // sem pontuação: o trecho é o bloco inteiro
  const t3 = 'xis e duo sem ponto';
  assert.strictEqual(engine.phrases(t3, engine.analyze(t3, SIMPLE).matches)[0].text, t3);
});

test('phrases: espaços em branco colapsam e os offsets dos hits acompanham', () => {
  const text = '  Oi.\n\n  Tem   xis\t\tcom  duo \n  aqui.  Fim.';
  const r = engine.analyze(text, SIMPLE);
  const out = engine.phrases(text, r.matches);
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].text, 'Tem xis com duo aqui.');
  assert.deepStrictEqual(hitTexts(out[0]), ['xis', 'duo']);
});

test('phrases: acima de 180 caracteres corta o contexto dos dois lados com "…"', () => {
  const lado = palavras(30);
  const text = lado + ' xis e duo ' + lado + '.';
  const out = engine.phrases(text, engine.analyze(text, SIMPLE).matches);
  assert.strictEqual(out.length, 1);
  const p = out[0];
  assert.ok(p.text.length <= 180, 'tamanho ' + p.text.length);
  assert.ok(p.text.startsWith('…'));
  assert.ok(p.text.endsWith('…'));
  assert.ok(p.text.includes('xis e duo'));
  assert.deepStrictEqual(hitTexts(p), ['xis', 'duo']);
  // corte em limite de palavra: nenhuma palavra do contexto aparece pela metade
  const ws = p.text.replace(/…/g, ' ').split(' ').filter(Boolean);
  assert.ok(ws.every((w) => /^(palavra\d+|xis|e|duo)$/.test(w)), ws.join('|'));
  // por igual: os dois lados ficam com tamanhos próximos
  const esquerda = p.hits[0].start;
  const direita = p.text.length - p.hits[1].end;
  assert.ok(Math.abs(esquerda - direita) <= 12, esquerda + ' x ' + direita);
});

test('phrases: corte só do lado que passa do limite', () => {
  const longo = palavras(40);
  const a = 'xis duo ' + longo + '.';
  const pa = engine.phrases(a, engine.analyze(a, SIMPLE).matches)[0];
  assert.ok(pa.text.length <= 180);
  assert.ok(pa.text.startsWith('xis duo '));
  assert.ok(pa.text.endsWith('…'));
  assert.deepStrictEqual(hitTexts(pa), ['xis', 'duo']);

  const b = longo + ' xis duo.';
  const pb = engine.phrases(b, engine.analyze(b, SIMPLE).matches)[0];
  assert.ok(pb.text.length <= 180);
  assert.ok(pb.text.startsWith('…'));
  assert.ok(pb.text.endsWith('xis duo.'));
  assert.deepStrictEqual(hitTexts(pb), ['xis', 'duo']);
});

test('phrases: faixa maior que 180 fica inteira, sem contexto', () => {
  const text = 'Antes dela. xis ' + palavras(40) + ' duo. Depois dela.';
  const out = engine.phrases(text, fakeMatches(text, [['xis', 1], ['duo', 2]]));
  assert.strictEqual(out.length, 1);
  const p = out[0];
  assert.ok(p.text.startsWith('xis '));
  assert.ok(p.text.endsWith('duo.'));
  assert.ok(p.text.length > 180);
  assert.deepStrictEqual(hitTexts(p), ['xis', 'duo']);
  assert.strictEqual(p.hits[0].start, 0);
});

test('phrases: faixa grande com contexto dos dois lados ganha "…" nos dois', () => {
  const text = 'Antes xis ' + palavras(40) + ' duo depois.';
  const p = engine.phrases(text, fakeMatches(text, [['xis', 1], ['duo', 2]]))[0];
  assert.ok(p.text.startsWith('…xis '));
  assert.ok(p.text.endsWith(' duo…'));
  assert.deepStrictEqual(hitTexts(p), ['xis', 'duo']);
});

test('phrases: offsets dos hits batem com o texto (analyze real, espaços e corte)', () => {
  const bloco = Array.from({ length: 25 }, (_, i) => 'texto' + i).join('  ');
  const text = bloco + '  ele vai\ndar uma passada,   comer   tudo e chupar ' + bloco + '. Fim.';
  const r = engine.analyze(text);
  const out = engine.phrases(text, r.matches);
  assert.ok(out.length >= 1);
  for (const p of out) {
    assert.ok(p.text.length <= 180);
    for (const h of p.hits) {
      assert.ok(h.start >= 0 && h.end <= p.text.length && h.start < h.end);
      const trecho = p.text.slice(h.start, h.end);
      assert.ok(engine.analyze(trecho).matches.length >= 1, 'hit sem match: ' + JSON.stringify(trecho));
    }
  }
});

test('phrases: maxCombo é o combo do último match e points soma os da sequência', () => {
  const text = 'xis duo xis duo xis.';
  const r = engine.analyze(text, SIMPLE);
  const p = engine.phrases(text, r.matches)[0];
  assert.strictEqual(p.count, 5);
  assert.strictEqual(p.maxCombo, 5);
  assert.strictEqual(p.points, r.total);
});

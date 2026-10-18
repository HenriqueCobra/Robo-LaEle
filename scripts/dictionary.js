#!/usr/bin/env node
/*
 * Ferramenta do dicionário. A lista de palavras fica ofuscada dentro de
 * src/shared/dictionary.js; aqui você a exporta para JSON, edita e empacota de volta.
 *
 *   node scripts/dictionary.js export [arquivo]   decodifica para JSON (padrão: .dict/entries.json)
 *   node scripts/dictionary.js build  [arquivo]   valida o JSON e reescreve o bloco PAYLOAD
 *
 * A pasta .dict/ está no .gitignore: o JSON legível nunca vai para o repositório.
 * Cada entrada: { id, label, coef, forms: [...], stems: [...] }. A raridade e o campo
 * phrase são calculados no carregamento, a partir do coef e das formas.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'shared', 'dictionary.js');
const DEFAULT_JSON = path.join(__dirname, '..', '.dict', 'entries.json');
const dictionary = require(FILE);
const { encode } = dictionary.codec;

const [cmd, arg] = process.argv.slice(2);
const json = arg ? path.resolve(arg) : DEFAULT_JSON;

function validate(list) {
  const erros = [];
  const ids = new Set();
  const formas = new Map();
  if (!Array.isArray(list) || list.length === 0) throw new Error('o JSON precisa ser uma lista não vazia');
  list.forEach((e, i) => {
    const onde = `entrada ${i} (${e && e.id})`;
    if (!e || typeof e.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id)) erros.push(`${onde}: id inválido`);
    if (ids.has(e.id)) erros.push(`${onde}: id repetido`);
    ids.add(e.id);
    if (typeof e.label !== 'string' || !e.label) erros.push(`${onde}: label vazio`);
    if (typeof e.coef !== 'number' || e.coef < 0.5 || e.coef > 5) erros.push(`${onde}: coef fora de 0,5 a 5`);
    if (!Array.isArray(e.forms) || !Array.isArray(e.stems || [])) erros.push(`${onde}: forms e stems precisam ser listas`);
    if (!(e.forms || []).length && !(e.stems || []).length) erros.push(`${onde}: sem forms nem stems`);
    (e.forms || []).forEach((f) => {
      if (formas.has(f) && formas.get(f) !== e.id) erros.push(`${onde}: forma "${f}" já existe em ${formas.get(f)}`);
      formas.set(f, e.id);
    });
  });
  if (erros.length) throw new Error('JSON inválido:\n  ' + erros.join('\n  '));
}

if (cmd === 'export') {
  fs.mkdirSync(path.dirname(json), { recursive: true });
  const list = dictionary.entries.map((e) => ({ id: e.id, label: e.label, coef: e.coef, forms: e.forms, stems: e.stems }));
  fs.writeFileSync(json, JSON.stringify(list, null, 1) + '\n');
  console.log(`${list.length} entradas exportadas para ${json}`);
} else if (cmd === 'build') {
  const list = JSON.parse(fs.readFileSync(json, 'utf8'));
  validate(list);
  const src = fs.readFileSync(FILE, 'utf8');
  const re = /(\/\*PAYLOAD-START\*\/\s*var PAYLOAD = ')[^']*(';\s*\/\*PAYLOAD-END\*\/)/;
  if (!re.test(src)) throw new Error('marcadores PAYLOAD não encontrados em dictionary.js');
  fs.writeFileSync(FILE, src.replace(re, (_, a, b) => a + encode(list) + b));
  console.log(`${list.length} entradas empacotadas em ${path.relative(process.cwd(), FILE)}`);
} else {
  console.log('uso: node scripts/dictionary.js export|build [arquivo.json]');
  process.exit(cmd ? 1 : 0);
}

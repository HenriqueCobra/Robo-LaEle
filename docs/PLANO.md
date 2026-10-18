# Plano técnico — Robo-LaEle (extensão Chrome)

## Conceito

"Lá ele" é a resposta clássica a qualquer frase com duplo sentido ("vou dar uma passada", "come tudo", "bateu na trave"). O Robo-LaEle é uma extensão do Chrome que varre a página aberta, encontra essas palavras e expressões, destaca cada uma com uma animação conforme é contabilizada e soma uma pontuação no estilo arcade, com combos, multiplicadores e recordes.

## Decisão: algoritmo, não IA

A detecção usa um **dicionário ponderado com normalização de texto e janela de combo**. Não usa modelo de IA porque:

- roda 100% local, instantâneo, sem chave de API, sem custo e sem mandar o conteúdo das páginas para fora (privacidade);
- é determinístico: a mesma página dá sempre a mesma pontuação, o que é essencial para um placar de recordes ser justo;
- o "lá ele" depende muito mais de um vocabulário conhecido do que de compreensão profunda de contexto.

Uma camada de IA opcional (para frases sem palavra-chave) fica no roadmap. O motor foi desenhado para aceitar novas fontes de detecção sem mudar a pontuação.

## Stack

- Manifest V3, JavaScript puro (sem build, sem dependências). Carrega direto em `chrome://extensions` > "Carregar sem compactação".
- Scripts **clássicos** (não ES modules), compartilhando o namespace global `globalThis.LaEle`. Cada arquivo de `src/shared` também faz `module.exports` quando `module` existe, para os testes rodarem em Node.
- Testes: `node --test` (test runner nativo do Node, sem dependências).
- Todo texto de interface em **pt-BR**.

## Estrutura de arquivos

```
manifest.json
icons/                      icon16.png icon32.png icon48.png icon128.png (+ icon.svg fonte)
scripts/make-icons.js       gera os PNGs (Node puro, zlib)
src/shared/dictionary.js    LaEle.dictionary  — lista de palavras/expressões e coeficientes
src/shared/engine.js        LaEle.engine      — normalização, tokenização, matching, combos, pontuação
src/shared/storage.js       LaEle.storage     — leitura/escrita em chrome.storage, recordes, coleção
src/background/service-worker.js — badge, recordes, mensagens
src/content/content.js      varredura do DOM, destaque, animação, HUD
src/content/content.css     estilos dos destaques na página
src/popup/popup.html|css|js dropdown da extensão
tests/engine.test.js
```

Ordem de carregamento:
- content scripts: `dictionary.js`, `engine.js`, `storage.js`, `content.js` (+ `content.css`)
- popup: `<script>` na mesma ordem, depois `popup.js`
- service worker: `importScripts('../shared/dictionary.js', '../shared/engine.js', '../shared/storage.js')`

## Contrato 1 — `LaEle.dictionary` (src/shared/dictionary.js)

```js
LaEle.dictionary = {
  version: 1,
  entries: [
    {
      id: 'dar',              // único, kebab-case ascii
      label: 'dar',           // como mostrar na interface
      coef: 1.5,              // coeficiente lá ele (0.5 a 5). Mais picante = maior
      tier: 'comum',          // 'leve' (< 1.5) | 'comum' (< 2.5) | 'pesado' (< 3.5) | 'lendario' — calculado por dictionary.tierOf(coef)
      forms: ['dar','dou','deu','dando','dei','dava','daria','dá'], // formas exatas (palavra inteira)
      stems: [],              // opcional: prefixos; casa token que começa com o prefixo e tem até +5 letras
      phrase: false           // true se for expressão de várias palavras
    },
    { id: 'por-tras', label: 'por trás', coef: 3, tier: 'pesado', forms: ['por tras','por traz'], stems: [], phrase: true },
    ...
  ]
};
```

- `forms` e `stems` podem ser escritos com acento ou caixa alta; o motor normaliza tudo com a mesma função.
- Mínimo de ~120 entradas: substantivos (mandioca, pepino, banana, linguiça, mangueira, pirulito, vara...), verbos (dar, comer, sentar, meter, enfiar, engolir, soprar...), adjetivos (duro, grosso, comprido, molhado, apertado...) e expressões (`de quatro`, `por trás`, `até o talo`, `sentar em cima`, `dar uma`, `vai com tudo`, `pode entrar`...). Expressões têm coeficiente maior que as palavras isoladas.
- Evitar formas que geram falso positivo absurdo (ex.: não incluir `da`/`de` soltos; palavras curtas só como palavra inteira).

## Contrato 2 — `LaEle.engine` (src/shared/engine.js)

```js
LaEle.engine = {
  CONFIG: { comboWindow: 8, comboStep: 0.5, maxMultiplier: 10, basePoints: 100 },
  normalize(str),          // -> string: minúsculas, sem acento (NFD), leet (4→a 3→e 1→i 0→o 5→s 7→t @→a $→s),
                           //    letras repetidas 3+ vezes colapsadas para 1 ("boooola" → "bola")
  tokenize(text),          // -> [{ raw, norm, start, end }]  start/end = offsets no texto ORIGINAL
  compile(entries),        // -> índice pronto (Map de formas, lista de stems, trie/mapa de expressões por 1º token)
  analyze(text, index?),   // -> { matches: Match[], total, maxCombo }   (index padrão = dicionário embutido + palavras do usuário já compiladas)
  rank(total),             // -> { grade: 'S'|'A'|'B'|'C'|'D'|'-', label: string }  ex.: S = "Lá ele supremo"
  phrases(text, matches),  // -> Phrase[]: um trecho por sequência de combo com 2+ matches (Top lá ele)
};

Match = {
  start, end,          // offsets no texto original (cobre a expressão inteira)
  raw,                 // trecho original
  entryId, label, coef, tier,
  combo,               // posição no combo atual (1 = primeira palavra do combo)
  multiplier,          // 1 + comboStep * (combo - 1), limitado a maxMultiplier
  points               // Math.round(basePoints * coef * multiplier)
}

Phrase = {
  text,                // trecho exibido, até 180 caracteres, com "…" onde foi cortado
  hits: [{ start, end, tier }],   // offsets das palavras achadas DENTRO de `text`
  points,              // soma dos points dos matches da sequência
  maxCombo,            // combo do último match da sequência
  count                // número de matches da sequência
}
```

Regras de matching:
1. Expressões (phrase) têm prioridade sobre palavras soltas e são casadas de forma gulosa pelo maior número de tokens. Tokens consumidos por uma expressão não casam de novo.
2. Palavra solta: o token normalizado está em `forms` ou começa com um `stem` (comprimento ≤ stem + 5).
3. **Combo**: dentro do mesmo texto analisado, se um match começa no máximo `comboWindow` tokens depois do fim do match anterior, `combo` incrementa; caso contrário volta para 1. Pontuação de frase passa por `combo` também (expressão = combo forte, já que vale mais).
4. Cada chamada de `analyze` é um bloco independente: o combo não atravessa blocos. O content script chama `analyze` uma vez por bloco de texto (parágrafo, título, item de lista...).
5. **Trechos (Top lá ele)**: `phrases(text, matches)` agrupa os matches de um bloco em sequências de combo (uma sequência começa em todo match com `combo === 1`) e devolve só as sequências com 2 ou mais matches. O trecho vai do começo da frase do primeiro match ao fim da frase do último (frase = até `.`, `!`, `?` ou `…` seguidos de espaço, ou a borda do bloco), com espaços colapsados. Se passar de 180 caracteres, o contexto em volta é cortado nos limites de palavra, por igual dos dois lados, com "…"; a sequência em si nunca é cortada.

## Contrato 3 — `LaEle.storage` (src/shared/storage.js)

Tudo em `chrome.storage.local`, exceto resultados por aba em `chrome.storage.session`.

```js
// chave 'settings'
{ autoScan: true, animations: true, speed: 'normal' /* 'lento'|'normal'|'rapido' */, showHud: true,
  theme: 'dark' /* 'dark'|'light': pele Tinta ou Papel, ver docs/DESIGN.md */,
  customWords: [ { id: 'custom-xxx', label: 'cenoura', coef: 2, tier: 'comum', forms: ['cenoura','cenouras'], stems: [], phrase: false } ] }

// chave 'records'
{ global: { best: 0, url: '', title: '', host: '', at: 0 },
  bySite: { [host]: { best, last, maxCombo, url, title, at } },
  totals: { scans: 0, words: 0, points: 0 } }

// chave 'collection'  (Laelédex: palavras já encontradas)
{ [entryId]: { count, firstAt, firstUrl } }

// chave 'topPhrases'  (Top lá ele: os 10 melhores trechos de sempre, ordenados por points)
[ { id, text, hits, points, maxCombo, count, url, host, title, at } ]
// id = host + '|' + hash do texto normalizado; o mesmo id não se repete (fica o de mais pontos)

// chrome.storage.session chave `tab:${tabId}`
Summary
```

```js
Summary = { url, host, title, total, count, maxCombo, grade, gradeLabel,
            topTerms: [{ entryId, label, count, points }],   // até 10, ordenado por pontos
            at }
```

API (todas retornam Promise):
`getSettings()`, `saveSettings(partial)`, `getRecords()`, `getCollection()`, `getTopPhrases()`,
`recordScan(summary, matchedEntryIds, phrases?)` → `{ newGlobalBest: bool, newSiteBest: bool, newTopPhrase: bool }` (atualiza records, totals, collection e topPhrases; `newTopPhrase` é true se algum trecho entrou ou subiu no top 10; **só o service worker chama**),
`setTabSummary(tabId, summary)`, `getTabSummary(tabId)`, `resetAll()` (zera também o Top lá ele),
`addCustomWord({label, coef})`, `removeCustomWord(id)`.

## Contrato 4 — mensagens (`chrome.runtime` / `chrome.tabs`)

| De → Para | Mensagem | Resposta |
|---|---|---|
| popup → content | `{ type: 'LAELE_SCAN' }` | `{ ok: true }` (o resultado chega depois via `LAELE_RESULT`) |
| content → background | `{ type: 'LAELE_RESULT', summary, entryIds, phrases }` | `{ newGlobalBest, newSiteBest, newTopPhrase }` |
| background → popup (broadcast `runtime.sendMessage`) | `{ type: 'LAELE_UPDATED', tabId, summary }` | — |
| content → background | `{ type: 'LAELE_PROGRESS', total, count }` | — (background atualiza o badge durante a animação) |

- Se o popup mandar `LAELE_SCAN` e não houver content script na aba (página aberta antes da instalação), o popup injeta via `chrome.scripting.executeScript` / `insertCSS` os mesmos arquivos e tenta de novo.
- Páginas `chrome://`, Chrome Web Store e PDFs não podem ser varridas: o popup mostra um estado vazio amigável.
- Badge: texto com pontuação compacta (`950`, `12k`, `1.2M`), fundo `#FFE45C` com texto `#17141f` (ver `docs/DESIGN.md`).

## Content script (comportamento)

1. Se `settings.autoScan`, varre em `document_idle` (+ 600 ms para páginas que montam conteúdo depois). Também escuta `LAELE_SCAN`.
2. Coleta blocos de texto com `TreeWalker` (ignorar `script, style, noscript, textarea, input, code, pre, svg, [contenteditable]` e nós já destacados). Agrupa nós de texto pelo ancestral de bloco mais próximo, concatena e chama `engine.analyze` por bloco, mapeando os offsets de volta para os nós de texto (um match que atravessa nós é envolvido em pedaços).
3. Envolve cada match em `<mark class="laele-hit" data-laele-points="..." data-laele-mult="...">` inicialmente sem destaque visível.
4. **Animação sequencial** na ordem do documento, priorizando o que está visível no viewport: cada palavra ganha o marca-texto da raridade, que cresce da esquerda, solta um texto flutuante `+150` e `×2,5` quando há combo, e o HUD soma os pontos com contador animado. Duração total limitada (~6 s em `normal`, 3 s em `rapido`, 10 s em `lento`): com muitos matches, acende em lotes. Se `animations` = false, tudo aparece de uma vez.
5. **HUD** fixo no canto inferior direito, em Shadow DOM (estilo isolado do site): pontuação total em contagem animada, contador de palavras, combo atual com barra e multiplicador, nota (S/A/B/C/D) ao final, aviso no fim por prioridade ("Novo recorde" > "Entrou no Top lá ele" > "Recorde do site") conforme a resposta do background, botão fechar e botão "varrer de novo". Respeita `prefers-reduced-motion`.
6. Ao terminar, envia `LAELE_RESULT` com os 10 melhores trechos da página (`engine.phrases` de cada bloco, ordenados por points). Uma nova varredura limpa os destaques anteriores (desfaz os `<mark>`) antes de começar.
7. Nunca quebrar o site: try/catch em volta de tudo, sem mexer em layout fora do `<mark>`, z-index alto só no HUD.
8. A pele do HUD segue `settings.theme` e troca ao vivo por `chrome.storage.onChanged`.

## Popup (dropdown) — design

- Cartão de 360 px dentro de uma moldura de 6 px (janela de 372 px). Visual definido em `docs/DESIGN.md` (opção E: marca-texto, peles Tinta e Papel, fontes Inter e Bricolage Grotesque).
- **Cabeçalho:** logo "Lá ele" + seletor de modo sol/lua (`settings.theme`, escuro por padrão) + chave de varredura automática.
- **Cartão principal (aba atual):** pontuação grande, nota (S/A/B...), palavras encontradas, maior combo, top 3 termos em chips. Estado vazio: "Nada de lá ele por aqui... ainda" / página proibida.
- **Botão primário grande:** "Varrer página" (com estado carregando e atualizando ao vivo via `LAELE_UPDATED`).
- **Abas:** `Recordes` (recorde global + top 10 sites), `Top` (Top lá ele: os 10 melhores trechos de sempre, com as palavras no marca-texto, pontos, combo, site e data), `Laelédex` (todas as palavras do dicionário em grade: encontradas com contagem, não encontradas aparecem como "???" com a raridade; barra de progresso X/Y), `Ajustes` (auto-varredura, animações, velocidade, HUD, adicionar/remover palavras próprias com coeficiente, zerar recordes com confirmação).

## Paleta e tokens compartilhados

Tokens, cores das raridades, tipografia e movimento ficam em `docs/DESIGN.md`. Resumo:

```
Tinta (padrão): fundo #17141f · painel #201c2b · elevado #2b2639 · texto #f6f2ea · rótulo #a29bb5
Papel:          fundo #fbf8f1 · painel #f3eee3 · elevado #e9e2d4 · texto #1b1822 · rótulo #696374
canetas: leve #B8F27C · comum #FFE45C · pesado #FF9BD2 · lendario #FFB054 · texto sobre caneta #17141f
```

# Design — Robo-LaEle

Este documento manda no visual do popup, do HUD, dos destaques na página e dos ícones. Os contratos de dados e mensagens continuam em `docs/PLANO.md`.

Direção escolhida: **opção E, "caneta"**. O protótipo de referência, em tamanho real e funcionando, está em `docs/prototipos/opcao-e-caneta.html`. As opções A a D ficam na mesma pasta só como registro. A E mantém a estrutura da D (popup de 360 px, grade de números, abas segmentadas, HUD no canto) e troca a voz: traço de marca-texto torto como assinatura, quatro canetas por raridade, números em Bricolage Grotesque e duas peles, Tinta (escura, padrão) e Papel (clara).

## A ideia

A extensão passa a caneta nas palavras do site, e a interface usa a mesma caneta. O traço irregular de marca-texto aparece nas palavras, sob o número do placar, na aba ativa, nos chips de palavras e nas frases do Top lá ele. A moldura continua limpa e exata; a graça vem das quatro cores e de pouca coisa torta (a nota carimbada, a etiqueta de pontos). O mascote, dois olhos olhando de lado, fica num quadrado amarelo e no HUD as pupilas viram para a palavra achada.

Fica de fora: gradiente de verdade (o traço é um SVG de cor única), glow, caixa alta, emoji, ícone decorativo e sombra fora do HUD e da etiqueta de pontos.

## Paleta

### Peles

Os mesmos nomes de token nas duas peles. Tinta é o padrão; Papel entra com `settings.theme = 'light'`.

| Token | Tinta | Papel | Uso |
|---|---|---|---|
| `--bg` | `#17141f` | `#fbf8f1` | Fundo do popup e do HUD. |
| `--panel` | `#201c2b` | `#f3eee3` | Blocos, grupos, cartões, trilho de abas. |
| `--raised` | `#2b2639` | `#e9e2d4` | Segmento ativo neutro, trilho de barras, hover forte. |
| `--line` | `#363046` | `#ddd4c2` | Divisão entre linhas de um grupo de ajustes. |
| `--text` | `#f6f2ea` | `#1b1822` | Texto principal. |
| `--soft` | `#cdc6da` | `#4a4556` | Texto secundário dentro de linhas. |
| `--muted` | `#a29bb5` | `#696374` | Legendas, host, rótulos (≥ 4,5:1 nas duas). |
| `--moldura` | `#0c0a11` | `#d9d1c0` | Fundo do `html` do popup, em volta do cartão. |
| `--sw-off` | `#3a3449` | `#cfc6b4` | Trilho do switch desligado. |
| `--nota-d` / `--nota-d-txt` | `#4a4359` / `#f6f2ea` | `#ddd4c2` / `#1b1822` | Quadrado da nota D e sem nota. |

### Canetas (iguais nas duas peles)

| Raridade | Cor | Também é |
|---|---|---|
| leve | `#B8F27C` | nota C, switch ligado, barra da Laelédex |
| comum | `#FFE45C` | nota B, botão "Varrer página", aba ativa, traço sob o placar, quadrado do logo |
| pesado | `#FF9BD2` | nota A, etiqueta "Recorde", aviso "Entrou no Top lá ele" |
| lendário | `#FFB054` | nota S, barra de combo |

Texto sobre qualquer caneta: `--mt-tinta: #17141f`.

### O traço

Três formas de traço, todas em `viewBox="0 0 100 20"` com `preserveAspectRatio="none"`, preenchidas com a cor da caneta:

1. `M2 5C22 2 64 6 98 3L99 17C70 19 32 15 1 18Z`
2. `M1 4C30 6 60 1 99 5L98 16C66 18 36 14 2 17Z`
3. `M3 3C34 5 70 2 97 4L99 18C62 16 30 19 1 16Z`

Viram `background-image` em data URI (`--mt-<raridade>-<1|2|3>`), com `background-repeat: no-repeat` e `box-decoration-break: clone`. A forma alterna pela ordem (1, 2, 3, 1…) para os traços não ficarem iguais.

- **Na interface** (chips, frases, nomes da Laelédex, etiquetas): o traço cobre a altura toda, `background-size: 100% 100%`, `padding: .08em .3em .1em`, texto `--mt-tinta`.
- **Na página do site**: o traço cobre 78% da altura, posicionado a 70% (`background-position: 0 70%`), sem padding nem margin.

### Badge da barra do Chrome

Fundo `#FFE45C`, texto `#17141f` (`setBadgeBackgroundColor` + `setBadgeTextColor`).

## Tipografia

- **Inter** (OFL) 400/500/600 para todo texto de interface. Arquivos `assets/fonts/inter-*.woff2`, família `"LaEle Inter"`.
- **Bricolage Grotesque** (OFL) 800 para a voz: placar, números da grade, nota, número do Top, nome "Lá ele", contador da Laelédex, etiqueta de pontos, multiplicador do HUD. Arquivo `assets/fonts/bricolage-grotesque.woff2` (variável, pesos 200–800), família `"LaEle Bricolage"`, licença `assets/fonts/OFL-BricolageGrotesque.txt`.
- Fallback: `"Helvetica Neue", Arial, sans-serif`. Números com `tabular-nums`. Bricolage com `letter-spacing: -.025em`. Nada de caixa alta nem tracking positivo.
- Popup: `@font-face` em `popup.css` com `url('../../assets/fonts/...')`. Página e HUD: `@font-face` em `content.css` com `chrome-extension://__MSG_@@extension_id__/assets/fonts/...` (o Chrome ignora `@font-face` dentro de Shadow DOM); `web_accessible_resources` já cobre `assets/fonts/*.woff2`.

Escala do popup:

| Tamanho | Uso |
|---|---|
| 54 px Bricolage 800 | `#score` |
| 32 px Bricolage 800 | letra da nota (quadrado 56 px) |
| 30 px Bricolage 800 | recorde global, número do 1º do Top |
| 20 px Bricolage 800 | números da grade, números do Top |
| 17 px Bricolage 800 | nome "Lá ele" |
| 13–15 px Inter 400–600 | texto, linhas, abas, botões |
| 11–12 px Inter | legendas e rótulos |

HUD: placar 40 px, nota 46 px de quadrado com letra 26 px, resto 12–13 px.

## Formas

- **Cantos:** 16 px no HUD; 12 px no cartão do popup; 10 px em grupos, blocos, botões grandes, abas e cartões; 8 px em campos e segmentos; 7 px nos segmentos internos.
- **Fios:** só entre linhas de um mesmo grupo de Ajustes. Blocos se separam por fundo (`--panel`), não por contorno.
- **Sombra:** HUD `0 16px 40px rgba(23,20,31,.28)`; etiqueta de pontos `0 6px 16px rgba(23,20,31,.18)`. Nenhuma outra.
- **Torto de propósito:** nota `rotate(-6deg)`; etiqueta de pontos ±4°; hover do botão principal `translateY(-1px) rotate(-.6deg)`; hover dos cartões da Laelédex `rotate(-1deg) translateY(-2px)`. Nada mais gira.

## Popup

### Janela com cantos

O Chrome desenha a janela do popup sempre retangular e não aceita fundo transparente. Por isso o canto redondo é desenhado por dentro: o `html`/`body` pinta `--moldura` e o conteúdo é um cartão `--bg` com raio 12 e 6 px de folga em volta. A janela fica com 372 px de largura (6 + 360 + 6) e a altura máxima do cartão é 600 px, com rolagem só dentro do cartão.

### Topo e resultado

```
┌──────────────────────────────────────────┐
│ [olhos] Lá ele        (☀|☾●)   Auto (●)  │  ← logo 24 px + Bricolage 17; #themeToggle; #autoHeader
│ [g1] g1.globo.com                         │  ← #heroHost 12 --muted, favicon 14 px raio 4
│ 63.130 pts                         ┌───┐  │  ← #score 54 Bricolage, traço comum-2 sob o número
│ ‾‾‾‾‾‾‾‾‾‾                          │ S │  │  ← #grade 56 px, raio 12, rotate(-6deg), cor da nota
│ Lá ele supremo  [Recorde]          └───┘  │  ← #gradeLabel 14/500; #recordPill = traço pesado-3
│ ┌────────────┬────────────┬────────────┐ │
│ │ 85         │ 28         │ ×14,5      │ │  ← grade --panel raio 10; número 20 Bricolage, legenda 11
│ └────────────┴────────────┴────────────┘ │
│ [mandioca 4] [pau 3] [pepino 3]          │  ← #terms: cada chip é um traço da raridade
│ [         Varrer página                ] │  ← #scanBtn 42 px, comum, texto tinta 14/600
│ ( Recordes | Top | Laelédex | Ajustes )  │  ← #tabs 4 segmentos; ativo = traço comum-3 86% × 62%
```

- **Traço do placar:** pseudo-elemento sob o número (`--mt-comum-2`, 13 px de altura, `z-index: -1` num contêiner com `isolation: isolate`). Quando a pontuação muda, ele se redesenha da esquerda (`scaleX` 0→1, 380 ms).
- **Nota:** fundo pela nota (D `--nota-d`, C leve, B comum, A pesado, S lendário), letra `--mt-tinta` nas coloridas. Ao trocar, `carimbo`: escala 1,45 → giro 3° a 0,94 → volta a −6° e 1, em 420 ms com `cubic-bezier(.34,1.56,.64,1)`.
- **Estados** (`data-state` ≠ resultado): `#msgTitle` 22 Bricolage, `#msgText` 13 `--muted`. Página proibida: botão `--raised` com texto `--muted`.

### Seletor de modo (`#themeToggle`)

Um switch deslizante com sol e lua, 46 × 26 px, raio 13, trilho `--panel`. O sol (claro) fica à esquerda e a lua (escuro) à direita, ícones de traço 2 px em 14 px, cor `--muted`. O botão redondo de 20 px é `--mt-comum` e carrega o ícone do modo atual em `--mt-tinta`; desliza em 220 ms com a curva de mola. `role="switch"`, `aria-label="Modo escuro"`, `aria-checked="true"` no escuro (padrão). Grava `settings.theme` (`'dark'` | `'light'`); o popup troca a pele na hora (`data-theme` no `html`) e o HUD de todas as abas abertas acompanha via `chrome.storage.onChanged`.

### Recordes

- Bloco `--panel`: "Recorde global" 12 `--muted`, `#bestScore` 30 Bricolage com o traço do placar, `#bestMeta` à direita.
- `#totScans` / `#totWords` / `#totPoints` na mesma grade de números do topo.
- "Melhores sites" e `#sites` em linhas de 36 px: posição, favicon 16 px, host, pontos 600, nota em Bricolage. Hover `--panel`.

### Top lá ele (aba nova)

- Legenda "As frases mais lá ele que você já varreu".
- Lista ordenada de até 10 cartões `--panel` raio 10: número em Bricolage (20 px, `--muted`; o 1º com 30 px em `--text` e mais folga), a frase entre aspas com cada palavra achada no traço da sua raridade (13 px, entrelinha 1,75; o 1º com 15 px), e embaixo "9.840 pts" (600), "combo 6", host e data curta em 11 px `--muted`.
- Vazio: "Nenhuma frase ainda" + "Varra uma página com combo de 2 ou mais palavras."
- A frase vem de sites: monte sempre com nós de texto (`textContent`), nunca com `innerHTML`.

### Laelédex

Mantém os cartões da v0.1 (`li.dex-card`, `#001`, raridade, nome ou "???", coeficiente, contagem) em grade de 2 colunas, cartões `--panel` raio 10. Nome descoberto vai no traço da raridade; "???" em Bricolage 18 `--muted`. Cabeçalho: contador em Bricolage, barra de 8 px com trilho `--raised` e preenchimento no traço leve-2, busca `--panel` 36 px, filtros em botões soltos com ponto da raridade (ativo: fundo `--text`, texto `--bg`).

### Ajustes

Grupo `--panel` raio 10, linhas com título 13/500 e descrição 12 `--muted`, divididas por 1 px `--line`; switches 30 × 18 (ligado: leve com bolinha tinta). Velocidade em segmentado de três (ativo `--raised`). Palavras próprias, coeficiente "×2 · comum" e zerar como na v0.1, com as cores desta direção. Rodapé: "Tudo fica no seu navegador, inclusive o Top lá ele."

## HUD na página (Shadow DOM, canto inferior direito)

```
┌───────────────────────────────┐
│ [olhos] Lá ele        −  ↻  × │  ← olhos vivos 24 px; Bricolage 17; botões 26 px
│ 12.450               ┌───┐    │  ← placar 40 Bricolage com traço comum-2 embaixo
│ 23 palavras          │ A │    │  ← nota 46 px girada −6°
│ Lá ele pesado        └───┘    │  ← 13/500
│ Combo 7  ━━━━━━──────  ×4     │  ← barra 8 px: trilho --raised, preenchimento traço lendário-1
│ [Novo recorde]                │  ← aviso no traço pesado
└───────────────────────────────┘
```

- Caixa `--bg` de 248 px, raio 16, sombra do HUD, pele conforme `settings.theme`.
- Pupilas: até 8/128 na direção da palavra, 220 ms; voltam ao centro no fim.
- Aviso no fim, por prioridade: "Novo recorde" > "Entrou no Top lá ele" > "Recorde do site".
- Minimizado (`.min`): cabeçalho + placar.

## Destaque na palavra

- `mark.laele-hit` começa com `background-size: 0% 78%` e cor herdada. Com `.laele-on`, cresce para `100% 78%` em `--laele-wipe` (240 ms no normal) e o texto vira `#17141f !important` na metade do traço.
- Traço pela raridade (`data-laele-tier`) e forma pela ordem (`data-laele-v` 1–3).
- Nada de `padding`, `margin`, `font-size` ou `line-height` no `mark`: o texto do site não se mexe. Tudo com prefixo `laele-` e `!important`.
- Etiqueta de pontos (`.laele-float`): papelzinho da cor da caneta da palavra, raio 7, Bricolage 800 17 px "+240" e Inter 600 12 px "×2" ao lado, texto tinta, girada ±4° alternando. Entra com escala 0,6 → 1,08 → 1, sobe 34 px e some em 950 ms.

## Ícone

Quadrado `#FFE45C` com cantos 30/128, dois olhos brancos com contorno `#17141f` de 7/128, pupilas `#17141f` encostadas à direita e sobrancelha `#17141f` sobre o olho direito. Em 16 px a sobrancelha sai e o contorno fica em 1,2/16. SVG de referência: `#marca` no protótipo.

## Movimento

| Onde | O quê | Duração | Movimento reduzido |
|---|---|---|---|
| Página | Traço cresce da esquerda | 240 ms (lento 420, rápido 120); 520 ms entre palavras no normal (900 / 200) | aparece cheio |
| Página | Etiqueta de pontos | 950 ms | não aparece |
| HUD | Pupilas | 220 ms | paradas |
| HUD e popup | Contagem dos pontos | 320 ms ease-out | salta |
| HUD e popup | Nota carimba | 420 ms, mola | troca sem pulo |
| HUD e popup | Traço sob o placar se redesenha | 380 ms | parado |
| Popup | Aba ativa: traço cresce | 280 ms | parado |
| Popup | Seletor de modo e switches | 220 ms, mola | sem deslize |
| Popup | Hover de botão, linha, cartão | 160–180 ms | igual |

Curvas: padrão `cubic-bezier(.2,.8,.2,1)`; mola `cubic-bezier(.34,1.56,.64,1)`. Só `transform`, `opacity`, `background-size` e cor.

## Acessibilidade

- Texto secundário ≥ 4,5:1 nas duas peles; texto sobre caneta sempre `#17141f` (≥ 11:1).
- Foco: `outline: 2px solid #FFE45C; outline-offset: 3px` (na pele Papel, `#17141f`).
- Switches com `role="switch"`; abas `tablist`/`tab`; segmentados `radiogroup`/`radio`.
- Nota com `aria-label="Nota S"`; cartão oculto com `aria-label="Palavra não descoberta"`.
- `prefers-reduced-motion: reduce` conforme a tabela.

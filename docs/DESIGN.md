# Design — Robo-LaEle

Este documento manda no visual do popup, do HUD, dos destaques na página e dos ícones. Os contratos de dados e mensagens continuam em `docs/PLANO.md`; nada aqui muda IDs, mensagens ou chaves de storage.

Direção escolhida: **opção D, "em silêncio"**. O protótipo de referência, em tamanho real e funcionando, está em `docs/prototipos/opcao-d-silencio.html`. As opções A, B e C ficam na mesma pasta só como registro. As cores podem mudar depois; a estrutura, a tipografia e os componentes estão fechados. Única diferença para o protótipo: a fonte é Inter, não Switzer (ver Tipografia).

## A ideia

A moldura é escura, quieta e exata, e a graça fica nas palavras. A interface tem acabamento de app de sistema: fios de 1 px, controles segmentados, números tabulares e nenhum enfeite. A única cor forte da extensão é o marca-texto que ela passa nas palavras do site. O mascote, dois olhos olhando de lado, aparece pequeno e bem desenhado: no ícone, no cabeçalho do popup e no placar, onde as pupilas viram para a palavra que acabou de ser achada.

O que sai da v0.1: gradiente rosa→roxo, glow, faixa colorida no topo do HUD, rótulos em CAIXA ALTA espaçada, pills, cantos de 14–16 px e animação de entrada em tudo.

## Paleta

### Interface (popup e HUD)

| Token | Hex | Papel |
|---|---|---|
| `--bg` | `#161616` | Fundo do popup e do HUD. |
| `--panel` | `#1e1e1e` | Bloco destacado (recorde global), hover de linha. |
| `--raised` | `#262626` | Quadrado da nota, trilho de barra, botões secundários. |
| `--line` | `#2a2a2a` | Fios de 1 px: borda do popup/HUD, grupos de ajustes, campos, divisões da grade de números. |
| `--text` | `#ededed` | Texto principal. |
| `--soft` | `#a3a3a3` | Texto secundário dentro das linhas (formas, coeficiente, contagem). |
| `--muted` | `#8a8a8a` | Rótulos pequenos (host, legendas dos números). |
| `--bronze` | `#a08672` | Único acento: botão "Varrer página", nota S (fundo), switch ligado, barra de progresso e de combo. Texto sobre bronze é `#111111` (5,5:1). |
| `--bronze-claro` | `#c9a27c` | "Recorde" e "Novo recorde" em texto, ponto da raridade lendária. |
| `--perigo` | `#3a1a1a` / `#ffb4a8` | Só o botão "Apagar tudo" da confirmação de zerar. |

Seletor ativo de abas e de segmentos: fundo `#333333`, texto `#f2f2f2`; trilho `#1f1f1f`.

### Raridades

Cada raridade tem duas cores: o marca-texto (sobre o site, claro) e o ponto (sobre a interface escura).

| Raridade | Marca-texto | Ponto |
|---|---|---|
| leve | `#D3EFB1` | `#9ED37A` |
| comum | `#FFE38A` | `#EFCD4B` |
| pesado | `#FFBFA8` | `#EF8B70` |
| lendário | `#D6B58F` | `#C9A27C` |

Sobre o marca-texto, o texto é sempre `#1d1d1f` (todos acima de 12:1).

### Badge da barra do Chrome

Fundo bronze `#A08672`, texto `#111111` (`chrome.action.setBadgeBackgroundColor` + `setBadgeTextColor`). Substitui o `#ff2e88` do `service-worker.js`.

## Tipografia

Uma família só: **Inter**, pesos 400, 500 e 600. Números sempre com `font-variant-numeric: tabular-nums`. Nada de caixa alta nem `letter-spacing` positivo; títulos e números grandes com tracking negativo (−0,02 a −0,04 em).

Escala do popup (360 px):

| Tamanho | Uso |
|---|---|
| 44 px / 600 | pontuação da aba atual (`#score`) |
| 22–24 px / 600 | recorde global, letra da nota, título de estado |
| 17 px / 500 | números da grade (palavras, combo, multiplicador) |
| 13–14 px / 400–600 | texto, linhas, abas, botões |
| 11–12 px | legendas e rótulos de seção |

HUD: pontuação 32 px / 600, resto 12–13 px.

### Licença e carga da fonte

- Inter 4.1, sob a **SIL Open Font License 1.1**, que permite levar a fonte no repositório e na extensão. Arquivos: `assets/fonts/inter-400.woff2`, `inter-500.woff2`, `inter-600.woff2`, com a licença em `assets/fonts/OFL-Inter.txt`.
- O protótipo da opção D usa Switzer. Ela foi trocada porque a ITF Free Font License proíbe distribuir os arquivos da fonte por repositório público. Fora a fonte, nada mudou.
- Popup: `@font-face` em `popup.css` com `url('../../assets/fonts/...')`.
- Página e HUD: `@font-face` em `content.css` com `url('chrome-extension://__MSG_@@extension_id__/assets/fonts/...')`, porque o Chrome ignora `@font-face` dentro de Shadow DOM; o HUD só usa o nome da família. `manifest.json` ganha `web_accessible_resources` com `assets/fonts/*.woff2` para `<all_urls>`.
- Nome no `@font-face`: `"LaEle Inter"`, para não colidir com a Inter que muitos sites já carregam. `font-display: swap`; fallback `"Helvetica Neue", Arial, sans-serif`.
- As fontes antigas de `assets/fonts/` (Permanent Marker, Bricolage Grotesque) não são usadas nesta direção.

## Formas

- **Cantos:** 12 px no HUD (o popup usa a janela do próprio Chrome, sem contorno); 10 px em grupos e blocos internos; 8 px em botões, campos, segmentados e no quadrado da nota; 6 px em chips e linhas; 4 px na página de apresentação.
- **Fios:** 1 px `--line` só para contornar o HUD, os grupos de ajustes, os campos e a grade de números. Nada de divisória solta entre seções.
- **Sombra:** só no HUD, porque ele flutua sobre o site: `0 12px 32px rgba(0,0,0,.28)`. Nenhuma outra.
- **Sem** gradiente, glow, glass, emoji, caixa alta ou ícone decorativo. Ícones de traço 2 px só para fechar, minimizar, varrer de novo, adicionar e a lupa.

## Popup (360 × até 600 px, rola por dentro)

```
┌──────────────────────────────────────────┐
│ (olhos) Lá ele                 Auto (●)  │  ← logo 22 px + 14/600; #autoHeader switch 28×16
│ [g1] g1.globo.com                         │  ← #heroHost 12 --muted, favicon 14 px
│ 63.130 pts                         ┌───┐  │  ← #score 44/600; "pts" 13 --muted
│                                    │ S │  │  ← #grade 48×48 raio 10, #gradeLetter 24/600
│ Lá ele supremo  • Recorde          └───┘  │  ← #gradeLabel 13; #recordPill = ponto + texto bronze-claro
│ ┌────────────┬────────────┬────────────┐ │
│ │ 85         │ 28         │ ×14,5      │ │  ← #statWords / #statCombo / #statMult 17/500
│ │ palavras   │ maior combo│ multiplic. │ │     legendas 11 --muted, grade com fio 1 px
│ └────────────┴────────────┴────────────┘ │
│ [• mandioca 4] [• pau 3] [• pepino 3]    │  ← #terms: chip raio 6, fio 1 px, ponto da raridade
│ ┌──────────────────────────────────────┐ │
│ │            Varrer página             │ │  ← #scanBtn 38 px, bronze, texto #111 13/600
│ └──────────────────────────────────────┘ │
│ ( Recordes | Laelédex | Ajustes )        │  ← #tabs segmentado; ativo #333
```

- A nota fica num quadrado `--raised` com a letra; **só a nota S** ganha fundo bronze e letra escura.
- `#scanPill` vira o texto "varrendo" depois do host, em `--muted`. Durante a varredura, o botão mostra "Varrendo…" e um traço de 2 px escuro corre na base (loop de 1,1 s, some com movimento reduzido).
- Estados (`data-state` ≠ resultado): `#msgTitle` 20/600 e `#msgText` 13 `--muted`, sem ícone. Página proibida: botão desabilitado `#262626` com texto `#6f6f6f`.
- `.tab-indicator` e `.seg-thumb` podem ficar, mas sem deslizar: o ativo é só o fundo `#333`.

### Recordes

- Bloco `--panel` raio 10: "Recorde global" 12 `--muted`, `#bestScore` 22/600, `#bestMeta` à direita.
- `#totScans` / `#totWords` / `#totPoints`: três colunas, número 15/500 em cima, legenda 11 embaixo.
- "Melhores sites" 11/500 `--muted`, depois `#sites` em linhas de 36 px: posição (12 `--muted`), favicon 16 px raio 4, host, pontos à direita, nota. A nota do primeiro em bronze-claro. Hover: fundo `--panel`.

### Laelédex

- `#dexFound` de `#dexTotal` descobertas e `#dexPct` à direita; `#dexBar` com 4 px de altura, trilho `--raised`, preenchimento bronze.
- `#dexSearch`: campo de 34 px, fio 1 px, lupa 14 px.
- `#dexFilters`: segmentado de cinco (Todas, Leve, Comum, Pesado, Lendário).
- `#dexGrid`: mantém a grade de cartões da v0.1 (`li.dex-card`): número `#001` e etiqueta da raridade com o ponto no topo, nome da palavra ou "???" quando não descoberta, coeficiente e contagem embaixo. Só a pele muda para os tokens desta direção (fundo `--panel`, fio 1 px, raio 8, Inter, ponto da raridade). A busca só procura entre as descobertas.

### Ajustes

- Grupo com fio 1 px e raio 10, uma linha por switch (título 13/500 + descrição 12 `--muted`): `#setAutoScan`, `#setAnimations`, `#setShowHud`.
- "Velocidade" + `#speedSeg` segmentado de três.
- "Palavras próprias": `#wordInput` + botão "+" 34 px; `#coefInput` range com `accent-color` bronze e `#coefValue` "×2 · comum" (raridade calculada pelo coeficiente); `#customList` em linhas com o ponto da raridade e "×" para remover.
- Zerar: `#resetBtn` contornado; confirmação `#resetConfirm` com "Cancelar" e "Apagar tudo" (cor de perigo).
- Rodapé 11 `--muted`: "Tudo fica no seu navegador."

## HUD na página (Shadow DOM, canto inferior direito)

```
┌───────────────────────────────┐
│ (olhos) Lá ele       −  ↻  × │  ← olhos 22 px com pupilas vivas; .btns 24 px
│ 12.450               ┌───┐   │  ← .score 32/600
│ 23 palavras          │ A │   │  ← .sub 12 --muted; .stamp = quadrado da nota 40 px
│ Lá ele pesado        └───┘   │  ← .rank-label 12 #cfcfcf
│ Combo 7  ━━━━━━━──────  ×4   │  ← .combo-n, .bar 4 px bronze, .mult 12/500
│───────────────────────────────│
│ Novo recorde                  │  ← .banner bronze-claro 12/500, separado por fio
└───────────────────────────────┘
```

- Caixa `--bg` de 232 px, fio 1 px, raio 12, sombra do HUD. Sem faixa colorida no topo.
- **Olhar:** a cada palavra marcada, as pupilas do logo do HUD andam até 8 unidades (em 128) na direção da palavra, em 220 ms. No fim da varredura voltam ao centro.
- A nota troca de letra quando a soma muda de faixa e dá um pulo de 1,3× para 1 em 320 ms. Na nota S, o quadrado fica bronze.
- Minimizado (`.min`): só o cabeçalho e `.mini` com a pontuação.

## Destaque na palavra

- `mark.laele-hit` começa sem fundo e com a cor herdada. Com `.laele-on`, ganha o marca-texto da raridade (`data-laele-tier`), raio 3 px, e o texto passa a `#1d1d1f !important`.
- O preenchimento cresce da esquerda (`background-size` de `0% 100%` a `100% 100%` com cor sólida, ou pseudo-elemento com `scaleX`) em 240 ms. `box-decoration-break: clone` para quebrar linha. Nada de `padding`, `margin`, `font-size` ou `line-height`: o texto do site não se mexe.
- Pontos flutuantes (`.laele-float`): etiqueta `#161616` raio 6, texto `#f2f2f2` 12/500 "+260", multiplicador em bronze-claro "×1,5". Sobe 26 px e some em 900 ms.
- Tudo com prefixo `laele-` e `!important`.

## Ícone

Quadrado claro `#F2EFE9` com cantos de 30/128, dois olhos brancos com contorno `#111111` de 6/128, pupilas `#111111` encostadas à direita e uma sobrancelha bronze `#A08672` sobre o olho direito. Em 16 px a sobrancelha sai e o contorno fica em 1,1/16. O quadrado claro aparece tanto na barra clara quanto na escura do Chrome. SVG de referência no protótipo (`#marca` e `#marca16`).

## Movimento

A interface parada já está pronta; só o jogo se mexe.

| Onde | O quê | Duração | Movimento reduzido |
|---|---|---|---|
| Página | Marca-texto cresce da esquerda | 240 ms (lento 420, rápido 120); 520 ms entre palavras no normal (900 / 200) | aparece cheio |
| Página | Etiqueta de pontos sobe 26 px e some | 900 ms | não aparece |
| HUD | Pupilas viram para a palavra | 220 ms | paradas |
| HUD | Contagem dos pontos | 320 ms, ease-out | salta para o valor |
| HUD | Nota troca e pula 1,3× → 1 | 320 ms | troca sem pulo |
| Popup | Traço sob "Varrendo…" | loop 1,1 s | estático |
| Popup | Hover de botão, linha e segmento | 160 ms | igual |

Curva padrão: `cubic-bezier(.2, .8, .2, 1)`. Só `transform`, `opacity` e `background-size`.

## Acessibilidade

- Texto secundário nunca abaixo de 4,5:1 sobre `#161616` (`--muted` dá 5,6:1; `--soft` 7,7:1).
- Foco visível: `outline: 2px solid #a08672; outline-offset: 3px`.
- Switches com `role="switch"`; segmentados com `role="radiogroup"`/`radio` ou `tablist`/`tab`, como hoje.
- A nota tem `aria-label="Nota S"`; os cartões não descobertos têm `aria-label="Palavra não descoberta"`.
- `prefers-reduced-motion: reduce` conforme a tabela.

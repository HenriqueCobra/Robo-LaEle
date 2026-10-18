# Robo-LaEle

Extensão para Chrome que caça **"lá ele"** em qualquer site. Ela varre a página, encontra palavras e expressões de duplo sentido, acende cada uma com animação enquanto conta os pontos e monta um placar arcade com combos, multiplicadores, notas e recordes.

## Como funciona

- **Varredura automática** ao abrir um site (pode desligar) ou **manual** pelo botão "Varrer página" no dropdown da extensão.
- Cada palavra lá ele tem um **coeficiente**: quanto mais safada, mais vale. Expressões ("de quatro", "até o talo", "segura no pau da barraca") valem mais que palavras soltas.
- **Combo**: palavras lá ele próximas umas das outras no mesmo trecho encadeiam combo e aumentam o multiplicador (+0,5x por palavra, até 10x).
- Pontos por palavra = `100 × coeficiente × multiplicador`. No fim, a página recebe uma nota de **D a S**.
- **HUD** na página com pontuação ao vivo, combo e nota; **badge** no ícone com a pontuação da aba.
- **Recordes** global e por site, **Laelédex** (coleção das palavras já encontradas, por raridade) e **palavras próprias** com coeficiente personalizado.

A detecção é feita por um dicionário ponderado (400+ entradas) com normalização de texto: ignora acentos, maiúsculas, leetspeak (`p4u`) e letras esticadas (`roooola`). Tudo roda localmente, sem enviar o conteúdo das páginas para lugar nenhum.

## Instalação (modo desenvolvedor)

1. Clone o repositório.
2. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e selecione a pasta do projeto.
4. Abra qualquer site e veja o placar. Fixe a extensão na barra para usar o dropdown.

## Desenvolvimento

```
node --test                 # testes do motor e do storage
node scripts/make-icons.js  # regenera os ícones
```

Estrutura e contratos entre os módulos estão em [`docs/PLANO.md`](docs/PLANO.md). Para testar a página de exemplo sem a extensão, abra `tests/fixtures/pagina-teste.html` no navegador.

## Roadmap

- Camada opcional de IA para frases de duplo sentido sem palavra-chave.
- Compartilhar placar da página.
- Mais idiomas e gírias regionais no dicionário.

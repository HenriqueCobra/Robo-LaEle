# Robo-LaEle

> Uma extensão de Chrome que dá nota, combo e recorde para trocadilhos. Feita de brincadeira, construída a sério.

"Lá ele" é a resposta clássica que o brasileiro dá quando alguém solta uma frase com duplo sentido sem querer. O Robo-LaEle automatiza esse reflexo: abre uma página, procura as frases que *poderiam* ser lidas de outro jeito, passa o marca-texto em cada uma e monta um placar de arcade com combos, multiplicadores, notas de D a S e recordes por site.

## Sobre o humor (leia antes de julgar)

Este é um projeto de **sátira e zoeira**, feito por amigos para rir de si mesmos. A piada é a existência de um robô que faz o trabalho do tiozão do churrasco, não o conteúdo em si. O tom é de memes brasileiros, não de pegadinha pesada.

Por isso, o dicionário de palavras **não fica legível neste repositório**: ele vai ofuscado dentro de `src/shared/dictionary.js`, e o resto do código, dos testes e da documentação usa exemplos inocentes como mandioca, pepino e bola na trave. Quem quiser ver ou editar a lista usa a ferramenta descrita mais abaixo. Isto é ofuscação, não criptografia: a extensão precisa ler a lista para funcionar, então a chave está no código.

## O que ela faz

- **Varredura automática** ao abrir um site (dá para desligar) ou **manual**, pelo botão "Varrer página".
- **Marca-texto torto** em cada achado, com uma cor por raridade (leve, comum, pesado e lendário), que cresce da esquerda sem mexer no texto do site.
- **Placar na página** em Shadow DOM, com pontuação ao vivo, combo, multiplicador e nota. O logo acompanha cada palavra com os olhos.
- **Pontuação** = `100 × coeficiente × multiplicador`. Achados próximos formam combo (+0,5× por palavra, até 10×).
- **Recordes** global e por site, **Laelédex** (a coleção de tudo que você já encontrou, com as raridades) e **Top lá ele**, que guarda as frases de combo mais alto.
- **Palavras próprias** com coeficiente personalizado.
- **Tema** escuro (Tinta) e claro (Papel), com um seletor de sol e lua.
- **Privacidade**: tudo roda localmente; o conteúdo das páginas nunca sai do navegador.

## A parte séria: tecnologia de verdade

Por trás da piada tem engenharia que dá para reaproveitar:

- **Chrome Extension Manifest V3**, com service worker, content scripts, popup e `chrome.storage` (local e de sessão).
- **Motor de detecção sem IA e determinístico**: normalização de texto (acentos, caixa, leetspeak e letras esticadas), tokenização com offsets no texto original, casamento guloso de expressões, stems com limite de tamanho e janela de combo. Roda em 100 mil palavras em milissegundos.
- **Marcação segura do DOM**: `TreeWalker`, agrupamento de nós de texto por bloco e re-mapeamento dos achados para o texto original, inclusive quando um achado atravessa tags (`<b>`, `<em>`, `<a>`).
- **Interface isolada**: o placar vive num Shadow DOM fechado, para o CSS do site não vazar para dentro nem para fora.
- **Design system próprio** (`docs/DESIGN.md`): duas peles por tokens de cor, fontes livres (Inter e Bricolage Grotesque, ambas OFL) empacotadas na extensão, contraste conferido, `prefers-reduced-motion` respeitado.
- **Testes**: mais de 90 testes com o runner nativo do Node (`node --test`), incluindo integridade do dicionário, falsos positivos e o armazenamento; mais um teste ponta a ponta com Puppeteer carregando a extensão de verdade.
- **Contratos documentados** entre os módulos em [`docs/PLANO.md`](docs/PLANO.md).

## Instalação (modo desenvolvedor)

1. Clone o repositório.
2. Abra `chrome://extensions` e ative o **Modo do desenvolvedor**.
3. Clique em **Carregar sem compactação** e escolha a pasta do projeto (a que tem o `manifest.json`).
4. Abra um site e veja o placar. Fixe a extensão na barra para usar o popup.

## Desenvolvimento

```
node --test                          # testes do motor, do dicionário e do storage
node scripts/make-icons.js           # regenera os ícones
node scripts/dictionary.js export    # decodifica o dicionário para .dict/entries.json (fora do git)
node scripts/dictionary.js build     # valida o JSON e empacota de volta em src/shared/dictionary.js
```

O JSON exportado fica em `.dict/`, que está no `.gitignore`: edite à vontade, rode `build` e commite só o `dictionary.js` já empacotado. Cada entrada tem `id`, `label`, `coef` (de 0,5 a 5), `forms` e `stems`; a raridade é calculada a partir do coeficiente.

Para ver a interface sem instalar nada, abra `tests/fixtures/pagina-teste.html` e `tests/fixtures/popup-preview.html` no navegador. O visual é descrito em [`docs/DESIGN.md`](docs/DESIGN.md), e as outras direções que testamos estão em `docs/prototipos/`.

## Roadmap

- Camada opcional de IA para frases de duplo sentido sem palavra-chave.
- Compartilhar o placar de uma página.
- Mais idiomas e gírias regionais.

## Licenças

Código do projeto: a definir pelos autores. Fontes: Inter e Bricolage Grotesque, SIL Open Font License 1.1 (arquivos de licença em `assets/fonts/`).

# Robo-LaEle

Bot (e/ou IA) que detecta e combate combinações de palavras do tipo **"lá ele"** / **"la ele"** em textos e conversas.

## Ideia geral

A expressão "la ele" (com ou sem acento, em maiúsculas, minúsculas ou com variações propositais) aparece com frequência em chats, comentários e grupos. O Robo-LaEle monitora mensagens, identifica essas combinações e reage de forma configurável.

## Funcionalidades planejadas

- **Detecção**: reconhece "lá ele", "la ele", "laele", "l4 3le", espaçamentos, repetições de letras, emojis e outras tentativas de burlar o filtro.
- **Ação**: apagar a mensagem, avisar o usuário, responder automaticamente, registrar ocorrências ou aplicar punições progressivas.
- **IA**: modelo de classificação para pegar variações que regras fixas não cobrem, reduzindo falsos positivos pelo contexto.
- **Configuração**: lista de termos, nível de rigidez, exceções (canais, usuários, cargos) e mensagens de resposta personalizáveis.
- **Relatórios**: estatísticas de ocorrências por período, canal e usuário.

## Roadmap

1. Detector baseado em regras e expressões regulares com normalização de texto.
2. Integração com plataforma de chat (Discord/Telegram).
3. Camada de IA para variações e contexto.
4. Painel de configuração e relatórios.

## Status

Em fase inicial de planejamento.

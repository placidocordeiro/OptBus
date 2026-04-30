# OptBus — Protótipo de Sistema de Gestão de Transporte Público
### OptBus é um protótipo de interface web para gestão operacional de transporte público urbano, desenvolvido como parte de uma disciplina da Residência em RFID. O projeto explora a aplicação de conceitos de identificação por radiofrequência e análise de dados para apoiar a tomada de decisão em mobilidade urbana.

O sistema simula um painel administrativo voltado para operadores da DMTT de Maceió/AL (ou órgão equivalente) , utilizando dados simulados (mockados) das linhas de ônibus da cidade.

## Funcionalidades
Painel geral com KPIs, gráficos de demanda por horário e mapa dinâmico das rotas em tempo real.

Detalhamento por linha com indicadores de eficiência, lotação e algoritmo de otimização de trajeto (Algoritmo I).

Alocação de frota com recomendações por faixa de horário baseadas em demanda histórica (Algoritmo II).

Ocorrências de segurança com triagem e acionamento policial simulado.

Assistente chatbot para suporte ao operador.

FAQ interativo.

Modo claro e modo escuro.

## Stack utilizada
HTML/CSS/JS puro — sem etapa de build.

React 18 via CDN + Babel standalone.

Leaflet.js para mapas.

Fonte IBM Plex Sans e IBM Plex Mono.


# 🤖 GUIA DE AGENTES - Referência Rápida

**Versão:** 1.0  
**Última Atualização:** Dezembro/2025

---

## 📋 Índice

1. [Visão Geral dos Agentes](#visão-geral-dos-agentes)
2. [Agentes por Plano](#agentes-por-plano)
3. [Referência Rápida de Comandos](#referência-rápida-de-comandos)
4. [Tabela de Disponibilidade](#tabela-de-disponibilidade)

---

## 🎯 Visão Geral dos Agentes

O Meu Agente disponibiliza **12 agentes especializados** que trabalham de forma integrada no WhatsApp. Cada agente é um especialista em uma área específica.

| Agente | Emoji | Especialidade |
|--------|:-----:|---------------|
| Financeiro | 💰 | Controle de caixa e transações |
| Web Search | 🔍 | Pesquisas na internet |
| Scrape/Extract | 📊 | Extração de dados estruturados |
| Agendamento | 📅 | Agenda e tarefas |
| SDR | 🎯 | Qualificação de leads |
| Marketing | 📢 | Otimização Google Ads |
| Dev | 💻 | Suporte técnico/código |
| Vídeo | 🎬 | Geração de vídeos |
| Confirmação | ✅ | Confirmação de presença |
| Resumo de Grupos | 📝 | Resumo de grupos WhatsApp |
| Remarketing | 🔄 | Reengajamento de contatos |
| Follow-up | 📞 | Reativação de inativos |

---

## 📦 Agentes por Plano

### 🆓 PLANO FREE (R$ 0/mês)

> Operações manuais no app, sem automação WhatsApp

---

#### 💰 Agente Financeiro (Manual)

**O que faz:** Controle básico de entradas e saídas financeiras.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Manual (apenas no app) |
| **Categorias** | 12 categorias disponíveis |
| **Exportação** | ❌ Não disponível |
| **Alertas** | ❌ Não disponível |

**Limitações no Free:**
- Registro apenas pelo app web
- Sem exportação de dados
- Sem alertas automáticos
- Dados voláteis (sem backup)

---

#### 🔍 Agente Web Search (Básico)

**O que faz:** Pesquisas simples na web.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Manual (app) |
| **Nível** | Básico |
| **Consultas/dia** | Limitado |
| **Fontes** | Públicas apenas |

**Exemplo de uso:**
```
"Pesquise empresas de tecnologia em São Paulo"
```

---

#### 📊 Agente Scrape/Extract (Básico)

**O que faz:** Extração básica de dados de fontes públicas.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Manual (app) |
| **Nível** | Básico |
| **Formatos** | Visualização apenas |
| **Fontes** | APIs públicas e dados abertos |

---

### 📘 PLANO BÁSICO (R$ 497/mês)

> Tudo do Free + automação básica + Agente de Agendamento

---

#### 💰 Agente Financeiro (Completo)

**O que faz:** Controle completo de caixa com exportação.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | App + WhatsApp (infraestrutura Meu Agente) |
| **Categorias** | 12 categorias |
| **Exportação** | ✅ CSV e PDF |
| **Alertas** | ✅ Saldo e vencimentos |
| **Duplicatas** | ✅ Detecção automática |

**Comandos WhatsApp:**
```
💰 REGISTRAR TRANSAÇÕES
"Registra entrada de R$ 1.200 categoria Vendas, cliente João"
"Saída de R$ 89,90 em Alimentação, almoço de trabalho"
"Entrada 5000 reais, Assinaturas, descrição 'Plano anual cliente X'"

📊 CONSULTAR
"Qual meu saldo do mês?"
"Quanto gastei em Marketing esta semana?"
"Lista despesas de hoje"

📄 EXPORTAR
"Exporta CSV de novembro"
"Gera PDF das transações de 01/11 a 30/11"
"Exporta relatório do mês passado"
```

---

#### 🔍 Agente Web Search (Intermediário)

**O que faz:** Pesquisas com filtros avançados e resumos.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | App + WhatsApp |
| **Nível** | Intermediário |
| **Filtros** | Por região, período, fonte |
| **Resultados** | Resumos com links |

**Comandos WhatsApp:**
```
🔍 PESQUISAS SIMPLES
"Pesquise tendências de e-commerce 2025"
"Busque notícias de marketing digital desta semana"

🔍 PESQUISAS COM FILTROS
"Busque restaurantes em Curitiba com boas avaliações"
"Pesquise concorrentes de [produto] na região Sul"

📊 COMPARAÇÕES
"Compare CRM Pipedrive vs HubSpot"
"Análise rápida de ferramentas de email marketing"
```

---

#### 📊 Agente Scrape/Extract (Intermediário)

**O que faz:** Extração com mais opções de formato.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | App + WhatsApp |
| **Nível** | Intermediário |
| **Formatos** | CSV, JSON |
| **Fontes** | APIs públicas, dados abertos, sites permitidos |

**Comandos WhatsApp:**
```
📊 EXTRAÇÃO BÁSICA
"Extraia dados de empresas de tecnologia do portal dados.gov"
"Busque no portal de dados abertos de SP informações de transporte"

📄 EXPORTAÇÃO
"Gere CSV com os dados extraídos"
"Exporte em JSON"
```

---

#### 📅 Agente de Agendamento

**O que faz:** Gestão completa de agenda com integração Google.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | App + WhatsApp |
| **Integrações** | Google Calendar, Drive, Tasks, Meet |
| **Lembretes** | ✅ Via WhatsApp |
| **Anexos** | ✅ Do Google Drive |

**Comandos WhatsApp:**
```
📅 CRIAR EVENTOS
"Marca reunião com João amanhã às 15h"
"Agenda call com equipe sexta 10h no Google Meet"
"Cria evento 'Apresentação cliente' dia 10/12 às 14h"

🔗 COM MEET
"Marca reunião com Maria terça 16h no Meet e envia o link"
"Agenda videoconferência amanhã 9h, tema: planejamento Q1"

📎 COM ANEXOS
"Anexa arquivo Proposta.pdf na reunião de segunda"
"Adiciona apresentação do Drive no evento de amanhã"

✅ TAREFAS
"Cria tarefa: enviar orçamento até sexta 17h"
"Nova tarefa: revisar contrato, prazo segunda"
"Tarefa urgente: ligar para fornecedor hoje"

🔔 LEMBRETES
"Me lembra de ligar para cliente às 16h"
"Lembrete amanhã 8h: enviar relatório"

📋 CONSULTAS
"Quais meus compromissos de amanhã?"
"Lista reuniões da semana"
"O que tenho para hoje?"
```

---

### 💼 PLANO BUSINESS (R$ 997/mês)

> Tudo do Básico + Número dedicado + Suporte 24/7 + Agentes especializados

---

#### 🎯 Agente SDR (Sales Development Representative)

**O que faz:** Qualificação automatizada de leads com agendamento.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | WhatsApp automático |
| **Qualificação** | Fit alto/médio/baixo |
| **Agendamento** | Automático via Calendar |
| **Confirmação** | WhatsApp + E-mail |

**Fluxo Automático:**
```
1. Lead envia mensagem → Recepção humanizada
2. Coleta: nome, empresa, interesse, urgência, orçamento
3. Qualificação: determina fit
4. Oferta: reunião ou orçamento
5. Agendamento: marca no Google Calendar
6. Confirmação: envia para WhatsApp e e-mail
```

**Comandos de Gestão:**
```
🎯 QUALIFICAÇÃO MANUAL
"Qualifica lead: Ana, 11 99999-9999, quer demo do produto"
"Avalia: João da empresa XYZ, interessado em plano Business"

📅 AGENDAMENTO
"Oferece reunião quinta 10:30 ou sexta 14:00 para Maria"
"Marca demo com lead qualificado para amanhã"

📋 ORÇAMENTOS
"Prepara orçamento para o lead da última conversa"
"Gera proposta comercial para empresa ABC"

📊 RELATÓRIOS
"Quantos leads qualificados esta semana?"
"Status dos leads em andamento"
```

**Mensagens Automáticas (exemplos):**
```
"Oi, [Nome]! Sou do Meu Agente. Vi seu interesse em [produto] — te ajudo rapidinho."

"Para te direcionar melhor: qual seu objetivo principal e para quando você precisa?"

"Consigo [data1] às [hora1] ou [data2] às [hora2]. Qual funciona melhor?"

"Perfeito! Fechei [data] às [hora] por Google Meet. Enviei a confirmação aqui e no seu e-mail."
```

---

#### 📢 Agente de Marketing (Google Ads)

**O que faz:** Análise e otimização de campanhas Google Ads.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | WhatsApp |
| **Análises** | Campanhas, grupos, termos |
| **Alertas** | Gasto, CTR, conversões |
| **Sugestões** | Termos negativos, lances |

**Comandos WhatsApp:**
```
📊 ANÁLISES
"Analisa campanha 'Tráfego Dezembro'"
"Como está a performance do grupo 'Marca'?"
"Relatório da última semana de ads"

🔍 TERMOS NEGATIVOS
"Sugere 5 termos negativos para campanha de leads"
"Quais termos estão desperdiçando orçamento?"

📈 COMPARAÇÕES
"Compara esta semana com a anterior"
"Evolução de CTR no último mês"
"Performance de outubro vs novembro"

⚠️ DIAGNÓSTICOS
"Por que o gasto diário está estourando cedo?"
"O que está causando queda no CTR?"
"Diagnóstico da campanha com baixa conversão"

💡 OTIMIZAÇÕES
"Como posso melhorar a campanha de remarketing?"
"Sugestões de otimização para campanha de busca"
"Recomendações de lance para [palavra-chave]"
```

---

#### 💻 Agente de Dev

**O que faz:** Suporte técnico para desenvolvedores.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | WhatsApp |
| **Linguagens** | JavaScript, Python, PHP, SQL, etc. |
| **Funções** | Debug, otimização, testes |
| **Limites** | Respeita confidencialidade |

**Comandos WhatsApp:**
```
🐛 DEBUGGING
"Revise meu endpoint /api/checkout, erro 500 quando customerId vazio"
"Por que esta função retorna undefined?"
"Debug: query SQL não retorna resultados esperados"

⚡ OTIMIZAÇÃO
"Otimiza esta query que está lenta: [query]"
"Como melhorar performance desta função?"
"Refatora este código para melhor legibilidade"

🧪 TESTES
"Sugere testes unitários para módulo de pagamento"
"Casos de borda para função de validação de CPF"
"Cria teste para endpoint de autenticação"

📝 DOCUMENTAÇÃO
"Documenta esta função: [código]"
"Gera JSDoc para este módulo"
"README para este componente React"

💡 DÚVIDAS TÉCNICAS
"Diferença entre useMemo e useCallback no React"
"Quando usar índice composto no PostgreSQL?"
"Melhores práticas para autenticação JWT"
```

---

#### 🎬 Agente de Vídeo (Google Veo 3)

**O que faz:** Geração de vídeos a partir de prompts.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | WhatsApp |
| **Formatos** | MP4, vertical/horizontal |
| **Duração** | Até 60s por vídeo |
| **Cota** | Limite mensal (ver plano) |

**Comandos WhatsApp:**
```
🎬 CRIAÇÃO BÁSICA
"Cria vídeo de 30s apresentando o Meu Agente"
"Gera vídeo curto para stories sobre [tema]"

📐 COM ESPECIFICAÇÕES
"Vídeo 1080x1920 (vertical) de 15s para reels"
"Cria vídeo 1920x1080 (horizontal) para YouTube"

✏️ COM ROTEIRO
"Cria vídeo com roteiro: 'Bem-vindo ao Meu Agente. Somos sua equipe de IA...'"
"Gera vídeo seguindo este script: [texto]"

🔄 VARIAÇÕES
"Cria 2 variações do vídeo para teste A/B"
"Gera versão alternativa com outro estilo"

🎯 PARA NICHOS
"Adapta roteiro para clínica odontológica"
"Versão do vídeo para e-commerce de moda"

📋 STORYBOARD
"Monte storyboard com 6 cenas e legendas"
"Planejamento visual para vídeo institucional"
```

---

### 🏆 PLANO PREMIUM (R$ 1.497/mês)

> Tudo do Business + Agentes exclusivos + Backups + Governança avançada

---

#### ✅ Agente de Confirmação

**O que faz:** Confirma presença em reuniões automaticamente.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Automático (diário) |
| **Fonte** | Google Calendar + Tasks |
| **Horários** | Configuráveis |
| **Ações** | Confirma ou reagenda |

**Funcionamento:**
```
⏰ ROTINA DIÁRIA
1. 8h: Verifica reuniões do dia no Calendar
2. Envia confirmação para cada participante
3. Registra respostas
4. Alerta sobre não-confirmados

✅ MENSAGEM AUTOMÁTICA
"Oi [Nome]! Confirmando nossa reunião de hoje às [hora]. 
Você consegue participar? 
Responda SIM para confirmar ou me avise se precisar reagendar."

📋 TAREFAS
1. Varredura diária no Google Tasks
2. Lembrete de tarefas pendentes/vencidas
3. Notificação via WhatsApp
```

**Comandos de Gestão:**
```
⚙️ CONFIGURAÇÃO
"Configura confirmação para enviar às 7h"
"Confirma apenas reuniões com clientes externos"
"Desativa confirmação para eventos internos"

📊 RELATÓRIOS
"Quantas confirmações enviadas hoje?"
"Taxa de confirmação da semana"
"Lista reuniões não confirmadas"
```

---

#### 📝 Agente de Resumo de Grupos

**O que faz:** Resumo diário de grupos WhatsApp selecionados.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Automático (diário) |
| **Período** | Últimas 24h |
| **Conteúdo** | Destaques, decisões, pendências |
| **Requisito** | Consentimento do grupo |

**Exemplo de Resumo:**
```
📊 Resumo do Grupo "Equipe Vendas" - 07/12/2025

🔥 DESTAQUES
• João fechou 3 novos contratos (R$ 15k total)
• Maria solicitou material atualizado de preços
• Reunião de alinhamento marcada para segunda 9h

💬 PRINCIPAIS DISCUSSÕES
• Estratégia de prospecção para Q1/2026
• Novo script de abordagem aprovado pelo gerente
• Debate sobre metas do próximo trimestre

📌 PENDÊNCIAS
• Atualizar CRM com novos leads
• Enviar proposta para cliente XYZ
• Agendar treinamento de produto

👥 PARTICIPAÇÃO
• 15 membros ativos
• 47 mensagens
• 3 arquivos compartilhados
```

**Comandos de Gestão:**
```
⚙️ CONFIGURAÇÃO
"Adiciona grupo 'Equipe Marketing' ao resumo"
"Remove grupo 'Avisos' do monitoramento"
"Horário do resumo: 18h"

📋 CONSULTAS
"Resumo do grupo vendas de ontem"
"Quais grupos estão configurados?"
"Estatísticas de mensagens da semana"
```

---

#### 🔄 Agente de Remarketing

**O que faz:** Reengaja contatos que já interagiram.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Automático (configurável) |
| **Critérios** | Interação prévia, tempo, funil |
| **Mensagens** | Templates aprovados |
| **Requisito** | Opt-in do contato |

**Funcionamento:**
```
🎯 IDENTIFICAÇÃO
1. Analisa histórico de conversas
2. Identifica contatos que interagiram mas não converteram
3. Segmenta por tempo e interesse

📨 DISPARO
1. Seleciona template apropriado (aprovado pelo WhatsApp)
2. Personaliza com dados do contato
3. Dispara em horários otimizados

⚠️ REGRAS
• Fora da janela 24h: apenas templates aprovados
• Respeita opt-out imediatamente
• Máximo de 2 tentativas por contato
```

**Comandos de Gestão:**
```
⚙️ CONFIGURAÇÃO
"Reengaja leads que não responderam há 7 dias"
"Configura remarketing para carrinho abandonado"
"Define template para reativação"

📊 RELATÓRIOS
"Quantos reengajamentos esta semana?"
"Taxa de resposta do remarketing"
"Lista contatos reengajados"

⏸️ CONTROLE
"Pausa remarketing para contato [número]"
"Desativa campanha de reengajamento temporariamente"
```

---

#### 📞 Agente de Follow-up

**O que faz:** Localiza e reativa contatos inativos.

| Característica | Detalhe |
|----------------|---------|
| **Modo** | Automático (configurável) |
| **Períodos** | Minutos a anos |
| **Ações** | Lembrete, mensagem, alerta |
| **Requisito** | Templates e opt-in |

**Configurações de Período:**
```
⏱️ EXEMPLOS DE REGRAS
• "Contatos sem resposta há 30 minutos → lembrete"
• "Leads inativos há 7 dias → mensagem de follow-up"
• "Clientes sem compra há 3 meses → oferta especial"
• "Contatos há 1 ano → campanha de reativação"
```

**Comandos de Gestão:**
```
⚙️ CONFIGURAÇÃO
"Configura follow-up para leads inativos há 5 dias"
"Cria regra: clientes sem contato há 30 dias recebem pesquisa"
"Define mensagem de follow-up: [texto]"

📊 RELATÓRIOS
"Quantos follow-ups enviados hoje?"
"Lista contatos que responderam ao follow-up"
"Taxa de reativação do mês"

📋 CONSULTAS
"Quais contatos estão inativos há mais de 15 dias?"
"Lista leads qualificados sem resposta"
```

---

## � **COMBINAÇÕES DE AGENTES (Workflows Integrados)**

Maximize resultados combinando múltiplos agentes em fluxos automatizados.

### Workflow 1: Pipeline de Vendas Completo

**Objetivo**: Converter lead em cliente pagante

**Agentes**: SDR + Agendamento + Financeiro + Follow-up

**Fluxo**:
```
1️⃣ SDR qualifica lead (Budget, Authority, Need, Timing)
   └─ Fit Alto? → Próximo passo
   
2️⃣ Agendamento marca demo para melhor horário
   └─ Confirmação automática via WhatsApp
   
3️⃣ Follow-up lembra lead 24h antes da demo
   └─ Taxa de comparecimento +35%
   
4️⃣ Pós-demo: SDR envia proposta comercial
   └─ Negociação via WhatsApp
   
5️⃣ Fechamento: Financeiro registra venda
   └─ Atualiza dashboard automaticamente
```

**Comandos para Implementar**:
```
"Configure SDR para qualificar leads do Instagram"
"Após qualificação, agende demo automática"
"Follow-up 24h antes da demo"
"Registre vendas fechadas automaticamente"
```

**Resultado Esperado**:
- ⬆️ **+45%** conversão lead → cliente
- ⬇️ **-60%** tempo de vendedor em admin
- 📊 **100%** dados sincronizados

---

### Workflow 2: Atendimento Pós-Venda

**Objetivo**: Garantir satisfação e upsell

**Agentes**: Confirmação + Resumo Grupos + Remarketing

**Fluxo**:
```
1️⃣ Confirmação envia pesquisa NPS 7 dias após compra
   └─ "De 0-10, recomendaria nosso serviço?"
   
2️⃣ NPS < 7? → Alerta para suporte prioritário
   └─ Ticket aberto automaticamente
   
3️⃣ NPS ≥ 9? → Remarketing oferece upgrade
   └─ "Obrigado! Conheça plano Premium:"
   
4️⃣ Resumo Grupos monitora grupo de clientes
   └─ Identifica dúvidas comuns para FAQ
```

**Resultado Esperado**:
- ⬆️ **+28%** taxa de resposta NPS
- ⬆️ **+15%** conversão para planos maiores
- ⬇️ **-40%** churn (cancelamentos)

---

### Workflow 3: Gestão de Eventos

**Objetivo**: Organizar evento sem esquecer detalhes

**Agentes**: Agendamento + Confirmação + Financeiro + Web Search

**Fluxo**:
```
1️⃣ Agendamento cria evento no Google Calendar
   └─ "Webinar: Automação com IA - 15/12 às 19h"
   
2️⃣ Web Search pesquisa benchmarks de eventos similares
   └─ "Busque webinars de automação com mais de 500 participantes"
   
3️⃣ Confirmação envia lembretes escalonados
   └─ 7 dias antes, 3 dias antes, 1 dia antes
   
4️⃣ Financeiro registra custos (plataforma, ads)
   └─ Acompanha ROI do evento
   
5️⃣ Follow-up para não-comparecentes
   └─ Envia gravação + oferta especial
```

**Resultado Esperado**:
- ⬆️ **+52%** taxa de comparecimento
- 📊 ROI rastreado em tempo real
- ⬆️ **+38%** engajamento pós-evento

---

### Workflow 4: Otimização de Marketing

**Objetivo**: Melhorar performance de anúncios

**Agentes**: Marketing + Web Search + Dev

**Fluxo**:
```
1️⃣ Marketing analisa campanhas Google Ads semanalmente
   └─ Identifica termos com CTR < 1%
   
2️⃣ Web Search busca tendências do nicho
   └─ "Pesquise palavras-chave emergentes em [nicho]"
   
3️⃣ Dev otimiza landing pages
   └─ "Sugira melhorias na LP de conversão"
   
4️⃣ Marketing aplica termos negativos sugeridos
   └─ Reduz desperdício de verba
   
5️⃣ Relatório consolidado via WhatsApp
   └─ Toda segunda às 9h
```

**Resultado Esperado**:
- ⬇️ **-32%** CPA (custo por aquisição)
- ⬆️ **+47%** CTR médio
- ⬆️ **+19%** taxa de conversão

---

### Workflow 5: Gestão Financeira Completa

**Objetivo**: Controle total de fluxo de caixa

**Agentes**: Financeiro + Agendamento + Web Search

**Fluxo**:
```
1️⃣ Financeiro registra entradas/saídas via WhatsApp
   └─ Categorização automática por ML
   
2️⃣ Agendamento lembra pagamentos recorrentes
   └─ "Pagamento fornecedor X vence em 3 dias"
   
3️⃣ Financeiro alerta quando saldo < threshold
   └─ "Atenção: saldo abaixo de R$ 5.000"
   
4️⃣ Web Search pesquisa melhores taxas de câmbio
   └─ Para importações/exportações
   
5️⃣ Relatório mensal automático
   └─ DRE simplificado + gráficos
```

**Resultado Esperado**:
- ⬇️ **-90%** atrasos em pagamentos
- 📊 **100%** registros categorizados
- ⬆️ **+25%** economia em negociações

---

## 🛠️ **PADRÕES COMUNS E MELHORES PRÁTICAS**

### Padrão 1: Comandos Claros e Objetivos

❌ **Evite comandos ambíguos**:
```
"Quero registrar uma coisa financeira"
"Me ajuda com agenda?"
"Faz um negócio de vídeo"
```

✅ **Use comandos específicos**:
```
"Registre receita R$ 2.500 de Maria consultoria"
"Marque reunião sexta 15h com João no Meet"
"Crie vídeo 30s sobre lançamento produto"
```

**Por quê?** Agentes processam mais rápido (~3x) e com maior precisão (95% vs 60%).

---

### Padrão 2: Contexto Gradual para Tarefas Complexas

❌ **Evite sobrecarga de informações**:
```
"Crie vídeo vertical 30s formato 1080x1920 sobre produto X 
com roteiro Y focado em benefícios A B C para público Z 
estilo moderno com música upbeat e CTA no final"
```

✅ **Divida em etapas**:
```
Passo 1: "Crie vídeo sobre produto X"
Agente responde: "Ok! Qual o foco principal?"
Passo 2: "Benefícios de economia de tempo"
Agente responde: "Duração e formato?"
Passo 3: "30 segundos, vertical para stories"
```

**Por quê?** Permite ajustes intermediários e evita retrabalho.

---

### Padrão 3: Aproveite Histórico de Conversas

✅ **Use referências contextuais**:
```
"Registre despesa R$ 800 aluguel"
[2 minutos depois]
"Corrija o último registro para R$ 850"
[1 hora depois]
"Exporte registros do mês incluindo esse aluguel"
```

**Por quê?** Agente mantém contexto de curto prazo (últimos 10 comandos), facilitando correções.

---

### Padrão 4: Templates para Repetições

✅ **Crie templates de comandos frequentes**:
```
Template: "Relatório Semanal"
└─ "Exporte financeiro últimos 7 dias em Excel
    + Agende envio para contador@empresa.com
    + Crie tarefa: revisar relatório até sexta"

Comando: "Execute template Relatório Semanal"
```

**Como criar**:
```
"Salve como template 'Relatório Semanal': [comandos]"
"Execute template Relatório Semanal"
"Liste meus templates"
```

---

### Padrão 5: Validação de Dados Importantes

✅ **Sempre confirme registros financeiros críticos**:
```
Você: "Registre despesa R$ 15.000 equipamento"
Agente: "⚠️ Valor alto detectado: R$ 15.000,00
         Confirma registro?
         [SIM] [NÃO] [PARCELAR]"
Você: "Sim, confirmo"
```

**Por quê?** Previne erros em transações de alto valor (configurável: > R$ 5.000).

---

## 🐛 **TROUBLESHOOTING POR AGENTE**

### Financeiro

**Problema**: "Categoria errada atribuída"

**Solução**:
```
1. Corrija: "Mude categoria do último registro para Transporte"
2. Treine o ML: O agente aprende com sua correção
3. Próximas vezes: Categorização automática melhorada
```

**Problema**: "Duplicata não detectada"

**Solução**:
```
1. Ajuste sensibilidade: Configurações → Financeiro → 
   Detecção de Duplicatas → Sensibilidade: Alta
2. Margem: ±5% → ±10% (mais tolerante)
```

---

### Agendamento

**Problema**: "Google Calendar não sincroniza"

**Solução**:
```
1. Verifique permissões: Configurações → Integrações → 
   Google Workspace → Renovar permissões
2. Teste: "Qual minha próxima reunião?" (deve listar eventos)
3. Se falhar: Desconecte e reconecte Google Workspace
```

**Problema**: "Conflito não detectado"

**Solução**:
```
1. Ative buffers: Configurações → Agendamento → 
   Buffer entre reuniões: 15 minutos
2. Considere deslocamento: Configurações → Agendamento → 
   Tempo de deslocamento padrão: 30 minutos
```

---

### SDR

**Problema**: "Leads não são qualificados corretamente"

**Solução**:
```
1. Revise critérios BANT: Configurações → SDR → 
   Critérios de Qualificação
   ├─ Budget mínimo: R$ 5.000 → R$ 3.000 (ajuste)
   ├─ Urgência: 30 dias → 60 dias (mais flexível)
   └─ Authority: Decisor → Decisor ou Influenciador

2. Treine com exemplos:
   "Qualifica lead: João, orçamento R$ 3.500, decide em 45 dias"
   → Marque como "fit médio" manualmente
   → Sistema aprende com feedback
```

**Problema**: "WhatsApp não envia mensagens"

**Solução**:
```
1. Verifique conexão: Configurações → Integrações → 
   WhatsApp → Status: Conectado ✅
   
2. Se desconectado:
   ├─ Desconecte completamente
   ├─ Aguarde 2 minutos
   ├─ Reconecte com QR Code
   └─ Teste: Envie mensagem para seu próprio número

3. Verifique saldo de mensagens:
   ├─ Configurações → Uso → Mensagens WhatsApp
   ├─ Business: Ilimitado
   └─ Se limitado: Upgrade ou aguarde reset mensal

4. Revise templates (mensagens fora janela 24h):
   ├─ Apenas templates pré-aprovados pelo WhatsApp
   ├─ Solicite aprovação: Configurações → WhatsApp → Templates
   └─ Aprovação em ~24h úteis
```

---

### Marketing (Google Ads)

**Problema**: "Análise não encontra campanhas"

**Solução**:
```
1. Verifique conexão: Configurações → Integrações → 
   Google Ads → Status: Conectado ✅
   
2. Teste permissões:
   "Liste minhas campanhas ativas"
   → Deve listar todas campanhas
   
3. Se falhar:
   ├─ Verifique conta correta: Configurações → Google Ads → 
      Conta ID: [confirme]
   └─ Renove permissões: Pode ter expirado
```

**Problema**: "Sugestões de termos negativos genéricas"

**Solução**:
```
1. Forneça contexto:
   ❌ "Sugira termos negativos"
   ✅ "Sugira termos negativos para campanha de leads 
       B2B de software SaaS faturamento > R$ 10k"

2. Analise histórico:
   "Quais termos geraram cliques sem conversão nos últimos 30 dias?"
   → Use essa lista para adicionar negativos
```

---

### Dev

**Problema**: "Agente não entende código"

**Solução**:
```
1. Forneça contexto adicional:
   ❌ "Debug isso: [código]"
   ✅ "Debug: endpoint /api/checkout retorna erro 500
       quando customerId está vazio. 
       Código: [código]
       Erro no log: [erro]"

2. Especifique linguagem/framework:
   "Revise este código React com TypeScript: [código]"
```

**Problema**: "Sugestões de otimização não aplicáveis"

**Solução**:
```
1. Defina constraints:
   "Otimize esta query SQL sem mudar estrutura da tabela
    e mantendo compatibilidade com PostgreSQL 14"
    
2. Especifique objetivo:
   "Reduza tempo de execução desta função de 2s para < 500ms"
```

---

### Vídeo (Google Veo 3)

**Problema**: "Vídeo gerado não atende expectativa"

**Solução**:
```
1. Seja mais específico no prompt:
   ❌ "Crie vídeo sobre produto"
   ✅ "Crie vídeo de 30s mostrando:
       • Introdução (5s): Logo + slogan
       • Problema (10s): Dor do cliente
       • Solução (10s): Seu produto resolvendo
       • CTA (5s): 'Experimente grátis'"

2. Solicite variações:
   "Crie 3 variações do vídeo com estilos diferentes:
    1. Corporativo (sóbrio, azul)
    2. Moderno (vibrante, dinâmico)
    3. Minimalista (clean, branco)"

3. Itere:
   "Ajuste vídeo anterior: mais rápido e música energética"
```

**Problema**: "Cota de vídeos esgotada"

**Solução**:
```
1. Verifique uso: Configurações → Uso → Vídeos Gerados
   ├─ Business: 20 vídeos/mês
   └─ Premium: 50 vídeos/mês

2. Otimize uso:
   ├─ Planeje storyboards antes de gerar
   ├─ Use variações da mesma geração
   └─ Aguarde reset mensal

3. Upgrade: Premium tem 2,5x mais cota
```

---

### Confirmação

**Problema**: "Confirmações não são enviadas"

**Solução**:
```
1. Verifique horário configurado:
   Configurações → Confirmação → Horário de Envio: 8h
   └─ Ajuste se necessário

2. Verifique filtros:
   Configurações → Confirmação → Confirmar apenas:
   ├─ ✅ Reuniões externas
   ├─ ❌ Eventos internos
   └─ ✅ Eventos com "cliente" no título

3. Teste manual:
   "Envie confirmação para reunião de amanhã às 15h"
```

---

### Resumo de Grupos

**Problema**: "Resumo incompleto ou vazio"

**Solução**:
```
1. Verifique consentimento do grupo:
   ├─ Administrador deve autorizar bot no grupo
   ├─ Comando no grupo: "@MeuAgente ativar resumos"
   └─ Confirmação: "✅ Resumos ativados"

2. Verifique período:
   Configurações → Resumo Grupos → Período: Últimas 24h
   └─ Aumente para 48h se grupo com pouca atividade

3. Grupos muito ativos:
   └─ Resumo pode ter limite de 500 mensagens
   └─ Configure filtros: Ignorar mensagens < 10 caracteres
```

---

### Remarketing

**Problema**: "Taxa de resposta baixa"

**Solução**:
```
1. Revise templates:
   ❌ "Oi! Viu nossa promoção?"
   ✅ "Oi [Nome]! Vi que você se interessou por [produto].
       Temos uma condição especial válida só até [data]: [oferta]"

2. Ajuste timing:
   Configurações → Remarketing → Intervalo:
   ├─ Primeiro contato: 7 dias → 5 dias (mais cedo)
   ├─ Segundo contato: 14 dias → 10 dias
   └─ Máximo de tentativas: 2 → 3

3. Segmente melhor:
   "Remarketing apenas para leads qualificados com fit alto"
```

---

### Follow-up

**Problema**: "Contatos reclamam de excesso de mensagens"

**Solução**:
```
1. Reduza frequência:
   Configurações → Follow-up → Intervalo mínimo:
   └─ 5 dias → 10 dias

2. Respeite opt-out rigorosamente:
   ├─ Se contato responder "PARE" ou "SAIR"
   ├─ Remova imediatamente de todas listas
   └─ Blacklist permanente

3. Personalize mensagens:
   ❌ "Oi! Lembra de nós?"
   ✅ "Oi [Nome]! Nosso último contato foi sobre [assunto].
       Houve progresso? Posso ajudar?"
```

---

## �📋 Referência Rápida de Comandos

### Comandos Universais

| Comando | Ação |
|---------|------|
| `SAIR` ou `pare` | Cancela notificações |
| `ajuda` | Menu de opções |
| `status` | Status dos agentes |

### Atalhos por Agente

| Agente | Prefixo Sugerido | Exemplo |
|--------|------------------|---------|
| Financeiro | "registra", "entrada", "saída" | "entrada 500 vendas" |
| Pesquisa | "pesquise", "busque" | "pesquise tendências" |
| Agendamento | "marca", "agenda", "cria tarefa" | "marca reunião amanhã" |
| SDR | "qualifica", "lead" | "qualifica lead Ana" |
| Marketing | "analisa campanha" | "analisa campanha dezembro" |
| Dev | "debug", "otimiza", "revise" | "debug erro 500" |
| Vídeo | "cria vídeo" | "cria vídeo 30s" |

---

## 📊 Tabela de Disponibilidade

| Agente | Free | Básico | Business | Premium |
|--------|:----:|:------:|:--------:|:-------:|
| 💰 Financeiro | Manual | ✅ | ✅ | ✅ |
| 🔍 Web Search | Básico | Interm. | ✅ | Avançado |
| 📊 Scrape/Extract | Básico | Interm. | Interm. | Avançado |
| 📅 Agendamento | ❌ | ✅ | ✅ | ✅ |
| 🎯 SDR | ❌ | ❌ | ✅ | ✅ |
| 📢 Marketing | ❌ | ❌ | ✅ | ✅ |
| 💻 Dev | ❌ | ❌ | ✅ | ✅ |
| 🎬 Vídeo | ❌ | ❌ | ✅ | ✅+ |
| ✅ Confirmação | ❌ | ❌ | ❌ | ✅ |
| 📝 Resumo Grupos | ❌ | ❌ | ❌ | ✅ |
| 🔄 Remarketing | ❌ | ❌ | ❌ | ✅ |
| 📞 Follow-up | ❌ | ❌ | ❌ | ✅ |

**Legenda:**
- ❌ = Não disponível
- Manual = Apenas via app (sem WhatsApp)
- Básico/Interm./Avançado = Nível de recursos
- ✅ = Disponível
- ✅+ = Disponível com cota maior

---

© 2025 Meu Agente. Todos os direitos reservados.

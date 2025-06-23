# Gerenciador de Finanças Familiares

Sistema integrado com API Pluggy para sincronização automática de dados bancários, transações e investimentos com base de dados SQLite local.

## **Arquitetura**

- **API**: Integração com Pluggy API para dados bancários
- **Banco de dados**: SQLite local com Prisma ORM
- **Frontend**: React Router com SSR
- **Backend**: Server loaders e actions para processamento de dados

## **1. Integração com API Pluggy**

### 1.1 Configuração e Autenticação

- Cadastrar-se no Meu Pluggy, para ter acesso ao Pluggy como instituição financeira integrada ao open finance
- Acessar Pluggy Demo App
- Configurar cliente Pluggy com credenciais do `.env`
- Implementar autenticação OAuth com tokens de acesso
- Tokens Pluggy duram 2 horas e serão usados apenas para sincronização de dados

### 1.2 Sincronização de Dados

- **Contas**: Buscar e sincronizar contas correntes, poupança e cartões de crédito
- **Transações**: Importar histórico completo de transações com metadados
- **Investimentos**: Sincronizar posições e movimentações de investimentos
- Implementar estratégia de sincronização incremental baseada em `updatedAt`
- Garantir idempotência por ID único da Pluggy
- Sincronização deve ser manual, por meio de ação do usuário

### 1.3 Tratamento de Erros

- Retry automático para falhas temporárias
- Log estruturado de erros de sincronização
- Fallback para dados locais em caso de indisponibilidade da API

## **2. Modelagem de Dados (Prisma)**

### 2.1 Schema Principal

- **Account**: Baseado no schema Pluggy Account (type, subtype, balance, bankData, creditData)
- **Transaction**: Baseado no schema Pluggy Transaction (amount, date, category, merchant, paymentData)
- **Investment**: Baseado no schema Pluggy Investment (type, subtype, value, transactions, taxes)

### 2.2 Relacionamentos

- Transações vinculadas a contas
- Investimentos com histórico de transações
- Metadados de sincronização (lastSyncAt, pluggyId)

### 2.3 Índices e Performance

- Índices compostos para queries por data e conta
- Índices para pesquisa por categoria e merchant
- Otimização para queries de agregação

## **3. Processamento de Dados**

### 3.1 Categorização Automática

- Engine de categorização baseada em merchant e descrição
- Aprendizado de padrões históricos de categorização
- Interface para correção manual de categorias

### 3.2 Projeções Financeiras

- Projeção de saldos mensais baseada em histórico
- Identificação de despesas recorrentes por análise temporal
- Projeção de parcelas futuras de cartões de crédito
- Cálculo de rendimentos de investimentos

### 3.3 Análise de Padrões

- Detecção de gastos atípicos
- Análise de tendências por categoria
- Identificação de oportunidades de economia

## **4. Interface de Usuário**

### 4.1 Dashboard Principal

- Visão geral de saldos e movimentações
- Gráficos de evolução patrimonial
- Alertas de gastos e metas

### 4.2 Gestão de Transações

- Lista filtrada e pesquisável de transações
- Edição de categorias e tags
- Conciliação manual quando necessário

### 4.3 Análise de Investimentos

- Portfólio consolidado com rentabilidade
- Evolução temporal dos investimentos

### 4.4 Relatórios e Projeções

- Relatórios mensais automatizados
- Projeções de fluxo de caixa
- Análise de metas financeiras

## **Prioridades de Desenvolvimento**

1. **Fase 1**: Schema Prisma e sincronização básica (contas, transações, investimentos)
2. **Fase 2**: Interface de visualização e categorização
3. **Fase 3**: Projeções e análises avançadas
4. **Fase 4**: Automações e relatórios

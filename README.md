# Gerenciador de Finanças Familiares

Um painel financeiro pessoal que conecta suas contas bancárias, cartões de crédito e investimentos em uma única visão. Organize seus gastos por categoria, acompanhe a evolução do seu patrimônio e projete sua situação financeira futura baseada no seu histórico de receitas e despesas. Ideal para quem quer ter controle total sobre suas finanças sem precisar inserir dados manualmente.

## **Arquitetura**

- **API**: Integração com Pluggy API para dados bancários
- **Banco de dados**: SQLite local com Prisma ORM
- **Frontend**: React Router v7 com SSR
- **Backend**: Server loaders e actions para processamento de dados
- **Runtime**: Bun para desenvolvimento e execução

## **Funcionalidades Implementadas**

### 1. Dashboard Principal

- **Visão geral financeira**: Saldo total dividido entre contas bancárias e investimentos
- **Evolução patrimonial**: Gráfico de projeção de saldo baseado em médias móveis de 6 meses
- **Análise de gastos**: Gráfico e tabela de gastos por categoria
- **Métricas calculadas**: Renda mensal média, gastos mensais médios e economia esperada

### 2. Gestão de Transações

- **Visualização por conta**: Cards de contas com saldos e informações específicas
- **Tabela de transações**: Listagem completa com filtros por conta
- **Edição de categorias**: Interface para reclassificar transações manualmente
- **Suporte a cartões de crédito**: Tratamento diferenciado para transações de crédito

### 3. Projeção de Fluxo de Caixa

- **Cashflow fixo**: Visualização de gastos fixos mensais (atualmente hardcoded para Julho 2025)
- **Gráfico interativo**: Entradas, saídas e evolução do saldo
- **Detalhamento diário**: Tooltip com transações específicas por data

### 4. Sincronização com Pluggy

- **Sync manual**: Endpoint `/api/sync` para sincronização completa
- **Contas bancárias**: Importa contas correntes, poupança e cartões
- **Transações**: Sincroniza histórico completo de movimentações
- **Investimentos**: Importa posições e transações de investimento
- **Tratamento de erros**: Logs estruturados e respostas de erro detalhadas

## **Integração com API Pluggy**

### Autenticação

- Autenticação via API key configurada no `.env`
- Cliente Pluggy centralizado para todas as operações

### Sincronização de Dados

- **Contas**: Busca e sincroniza todos os tipos de conta
- **Transações**: Importa histórico com categorização automática básica
- **Investimentos**: Sincroniza posições atuais e movimentações
- **Idempotência**: Baseada em ID único da Pluggy para evitar duplicatas
- **Sincronização completa**: Cada operação refaz toda a sincronização

### Tratamento de Erros

- Logs detalhados para debugging
- Respostas estruturadas de erro
- Graceful degradation em caso de falhas

## **Modelagem de Dados (Prisma)**

### Schema Principal

- **Account**: Contas bancárias e cartões (type, subtype, balance, bankData, creditData)
- **Transaction**: Transações com categorização (amount, date, category, merchant)
- **Investment**: Investimentos com saldo atual (type, subtype, balance)
- **Category**: Sistema de categorias para classificação

### Relacionamentos

- Transações vinculadas a contas específicas
- Investimentos independentes
- Categorias reutilizáveis entre transações

### Views e Agregações

- **category_spending_moving_average**: Médias móveis de gastos por categoria
- **category_income_moving_average**: Médias móveis de receitas por categoria

## **Análise e Projeções**

### Projeções Financeiras

- **Evolução patrimonial**: Baseada em médias móveis de 6 meses de receitas e gastos
- **Projeção de 24 meses**: Estimativa de saldo futuro
- **Categorização de gastos**: Análise mensal por categoria

### Métricas Calculadas

- Renda mensal média (baseada em médias móveis)
- Gastos mensais médios por categoria
- Economia mensal esperada (receita - gastos)

## **Interface de Usuário**

### Dashboard

- Cards de resumo financeiro
- Gráfico de evolução patrimonial
- Análise de gastos por categoria (gráfico + tabela)

### Transações

- Seleção de conta via cards visuais
- Tabela responsiva de transações
- Edição inline de categorias

### Projeções

- Gráfico de cashflow com dados fixos
- Visualização de entradas/saídas/saldo

## **Funcionalidades Não Implementadas**

- **Gestão de investimentos**: Interface está como placeholder
- **Categorização automática inteligente**: Apenas categorização manual
- **Detecção de padrões**: Não há análise automática de gastos atípicos
- **Relatórios automatizados**: Não há geração de relatórios
- **Metas financeiras**: Sistema de metas não implementado
- **Sincronização incremental**: Apenas sincronização completa
- **Refresh automático de tokens**: Gestão manual de autenticação

## **Como Usar**

1. **Configurar credenciais**: Adicionar API key do Pluggy no `.env`
2. **Executar sincronização**: POST para `/api/sync` para importar dados
3. **Navegar no dashboard**: Visualizar resumo financeiro
4. **Gerenciar transações**: Editar categorias conforme necessário
5. **Analisar cashflow**: Verificar projeções de fluxo de caixa

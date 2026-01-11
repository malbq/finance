# Family Finance Manager

## Product Overview

A comprehensive personal finance dashboard that connects bank accounts and credit cards into a unified view. Users can organize expenses by category, track wealth evolution, and visualize spending patterns. Designed for individuals and families who want complete financial control without manual data entry.

## Core Features

### 1. Financial Dashboard

**Objective**: Provide users with a comprehensive overview of their financial situation

**Requirements**:

- Display total balance across bank accounts and investments
- Show wealth evolution projections using 6-month weighted moving averages
- Present spending analysis through interactive charts and detailed category tables
- Calculate key metrics: average monthly income, average monthly expenses, and expected savings

**User Stories**:

- As a user, I want to see my total financial position at a glance
- As a user, I want to understand how my wealth is projected to grow over time
- As a user, I want to identify spending patterns by category

### 2. Transaction Management

**Objective**: Enable users to view, filter, and categorize their financial transactions

**Requirements**:

- Display interactive account cards with balances and account-specific information
- Provide responsive transaction tables with optimized layouts for bank accounts vs credit cards
- Implement real-time filtering by date, description, details, and category
- Enable category editing with dropdown interface and optimistic UI updates
- Support credit card transaction details including installments and original purchase dates
- Show complete payment information including payer/receiver details and merchant data

**User Stories**:

- As a user, I want to view all my transactions organized by account
- As a user, I want to filter transactions to find specific expenses
- As a user, I want to recategorize transactions to improve my expense tracking
- As a user, I want to see detailed information about credit card purchases and installments

### 3. Cash Flow Visualization

**Objective**: Help users understand their financial flow patterns

**Requirements**:

- Display monthly expenses and income patterns
- Provide interactive charts showing income, expenses, and balance evolution
- Include daily transaction details in interactive tooltips

**User Stories**:

- As a user, I want to see my monthly expenses and income
- As a user, I want to understand my cash flow patterns over time

## Technical Requirements

### Frontend Technology Stack

- **Framework**: React with modern hooks and functional components
- **Styling**: TailwindCSS with dark theme implementation
- **Charts**: Recharts library for all data visualizations including:
  - Bar charts for balance evolution
  - Composed charts (Line + Area) for spending analysis
  - Interactive tooltips and responsive design

### Data Integration

- **Primary Data Source**: Pluggy API for automated financial data synchronization
- **Authentication**: Secure API integration with client credentials
- **Data Sync**: Real-time synchronization of:
  - Bank accounts and credit cards
  - Transaction history and metadata
  - Category mappings and hierarchies

### User Experience Requirements

- **Performance**: Fast loading times with optimistic UI updates
- **Real-time Updates**: Live data updates without page refresh
- **Error Handling**: Graceful error states with user-friendly messaging

## Pluggy API Integration Specifications

### Authentication & Security

- Secure client-side authentication using Pluggy credentials
- Support for multiple financial institution connections
- Automated token refresh and session management

### Data Synchronization

- **Accounts**: Sync bank accounts and credit cards with complete metadata
- **Transactions**: Historical data import with payment details, merchant information
- **Categories**: Automatic category mapping with user customization options
- **Frequency**: Manual sync with option for scheduled updates

### Error Handling & Reliability

- Comprehensive error logging and user notification
- Graceful degradation for partial sync failures
- Data validation and duplicate prevention
- Retry mechanisms for failed synchronizations

## Data Model & Schema

### Core Entities (JSON Structure View)

#### Account Entity

```json
{
  "id": "uuid",
  "itemId": "pluggy-item-identifier",
  "number": "account-number",
  "type": "BANK | CREDIT",
  "subtype": "CHECKING_ACCOUNT | CREDIT_CARD",
  "name": "Account Display Name",
  "balance": 15000.0,
  "currencyCode": "BRL",
  "marketingName": "Bank Marketing Name",
  "taxNumber": "12345678901",
  "owner": "Account Owner Name",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",

  // Bank-specific data (when type = BANK)
  "bankData": {
    "transferNumber": "12345-6",
    "closingBalance": 14800.0,
    "automaticallyInvestedBalance": 5000.0,
    "overdraftContractedLimit": 2000.0,
    "overdraftUsedLimit": 200.0,
    "unarrangedOverdraftAmount": 0.0
  },

  // Credit card data (when type = CREDIT)
  "creditData": {
    "level": "PLATINUM",
    "brand": "VISA",
    "balanceCloseDate": "2024-01-15T00:00:00Z",
    "balanceDueDate": "2024-02-10T00:00:00Z",
    "availableCreditLimit": 8000.0,
    "creditLimit": 10000.0,
    "minimumPayment": 450.0,
    "isLimitFlexible": true,
    "holderType": "PRIMARY",
    "status": "ACTIVE",
    "additionalCards": "2",
    "disaggregatedLimits": [
      {
        "lineName": "PURCHASES",
        "limitAmount": 8000.0,
        "usedAmount": 2000.0,
        "availableAmount": 6000.0,
        "isLimitFlexible": false
      }
    ]
  },

  // Nested transactions
  "transactions": [
    // See Transaction Entity below
  ]
}
```

#### Transaction Entity

```json
{
  "id": "transaction-uuid",
  "accountId": "account-uuid",
  "description": "PAGAMENTO PIX",
  "descriptionRaw": "PIX ENVIADO JOAO SILVA",
  "currencyCode": "BRL",
  "amount": -250.0,
  "amountInAccountCurrency": -250.0,
  "date": "2024-01-15T14:30:00Z",
  "category": "Alimentação",
  "categoryId": "07010000",
  "balance": 14750.0,
  "status": "POSTED",
  "type": "DEBIT",
  "operationType": "PIX",
  "createdAt": "2024-01-15T14:30:00Z",
  "updatedAt": "2024-01-15T14:30:00Z",

  // Payment details (PIX, TED, boleto, etc.)
  "paymentData": {
    "paymentMethod": "PIX",
    "reason": "PAYMENT_FOR_GOODS_SERVICES",
    "receiverReferenceId": "pix-reference-123",
    "referenceNumber": "REF123456789",
    "boletoMetadata": null,

    "payer": {
      "name": "João Silva",
      "accountNumber": "12345-6",
      "branchNumber": "0001",
      "routingNumber": "123",
      "routingNumberISPB": "12345678",
      "documentNumber": {
        "type": "CPF",
        "value": "12345678901"
      }
    },

    "receiver": {
      "name": "Maria Santos",
      "accountNumber": "98765-4",
      "branchNumber": "0002",
      "routingNumber": "456",
      "routingNumberISPB": "87654321",
      "documentNumber": {
        "type": "CPF",
        "value": "10987654321"
      }
    }
  },

  // Credit card specific data
  "creditCardMetadata": {
    "installmentNumber": 3,
    "totalInstallments": 12,
    "totalAmount": 3000.0,
    "payeeMCC": "5411",
    "purchaseDate": "2024-01-10T00:00:00Z",
    "cardNumber": "**** **** **** 1234",
    "billId": "bill-123"
  },

  // Merchant information
  "merchant": {
    "name": "SUPERMERCADO XYZ",
    "businessName": "XYZ Comercio de Alimentos Ltda",
    "cnpj": "12345678000190",
    "cnae": "4711302",
    "category": "GROCERY_STORES"
  },

  // Payment processor data
  "acquirerData": {
    "data": "acquirer-specific-metadata"
  }
}
```

#### Investment Entity

```json
{
  "id": "investment-uuid",
  "itemId": "pluggy-item-identifier",
  "type": "FIXED_INCOME",
  "subtype": "TREASURY",
  "number": "TESOURO-12345",
  "name": "Tesouro Direto IPCA+ 2029",
  "balance": 50000.0,
  "lastMonthRate": 0.85,
  "lastTwelveMonthsRate": 10.25,
  "annualRate": 12.15,
  "currencyCode": "BRL",
  "code": "NTNB",
  "isin": "BRSTNCLF1018",
  "value": 3456.78,
  "quantity": 14.46,
  "amount": 50000.0,
  "taxes": 450.0,
  "date": "2024-01-01T00:00:00Z",
  "owner": "Investment Account Owner",
  "amountProfit": 5000.0,
  "amountWithdrawal": 0.0,
  "amountOriginal": 45000.0,
  "dueDate": "2029-05-15T00:00:00Z",
  "issuer": "Tesouro Nacional",
  "issuerCNPJ": "00000000000191",
  "issueDate": "2023-05-15T00:00:00Z",
  "rate": 6.25,
  "rateType": "IPCA_PLUS_RATE",
  "fixedAnnualRate": 6.25,
  "status": "ACTIVE",
  "institution": "Banco XYZ",
  "metadata": "treasury-specific-data",

  // Investment transaction history
  "transactions": [
    {
      "id": "inv-transaction-uuid",
      "type": "BUY",
      "movementType": "DEBIT",
      "quantity": 10.0,
      "value": 3200.5,
      "amount": 32005.0,
      "netAmount": 31955.0,
      "description": "Compra Tesouro IPCA+",
      "agreedRate": 6.25,
      "date": "2023-12-01T00:00:00Z",
      "tradeDate": "2023-12-01T00:00:00Z",
      "brokerageNumber": "12345",
      "expenses": "taxa_custodia: 25.00, taxa_corretagem: 25.00"
    },
    {
      "id": "inv-transaction-uuid-2",
      "type": "INTEREST",
      "movementType": "CREDIT",
      "quantity": 0.0,
      "value": 0.0,
      "amount": 287.5,
      "netAmount": 287.5,
      "description": "Juros semestrais",
      "date": "2024-01-01T00:00:00Z",
      "expenses": null
    }
  ]
}
```

#### Category Entity (Hierarchical)

```json
{
  "id": "07000000",
  "description": "Alimentação",
  "descriptionTranslated": "Food",
  "parentId": null,
  "parentDescription": null,

  // Child categories
  "children": [
    {
      "id": "07010000",
      "description": "Supermercados",
      "descriptionTranslated": "Supermarkets",
      "parentId": "07000000",
      "parentDescription": "Alimentação",

      "children": [
        {
          "id": "07010001",
          "description": "Mercados Grandes",
          "descriptionTranslated": "Large Supermarkets",
          "parentId": "07010000",
          "parentDescription": "Supermercados",
          "children": []
        }
      ]
    },
    {
      "id": "07020000",
      "description": "Restaurantes",
      "descriptionTranslated": "Restaurants",
      "parentId": "07000000",
      "parentDescription": "Alimentação",
      "children": []
    }
  ]
}
```

### Financial Analytics Views

#### Moving Average Projections

```sql
-- SQL View for weighted 6-month moving averages
CREATE VIEW moving_average_projections AS
WITH months_range AS (
  -- Last 6 months with weighting factors
  SELECT 1 as month_offset, date('now', '-1 month', 'start of month') as month_date
  UNION ALL SELECT 2, date('now', '-2 months', 'start of month')
  -- ... continues for 6 months
),
spending_average AS (
  SELECT ROUND(
    SUM(spending_monthly.total * (7 - months_range.month_offset)) / 21.0, 2
  ) as value
  FROM spending_monthly
  JOIN months_range ON spending_monthly.month_date = months_range.month_date
),
income_average AS (
  SELECT ROUND(
    SUM(income_monthly.total * (7 - months_range.month_offset)) / 21.0, 2
  ) as value
  FROM income_monthly
  JOIN months_range ON income_monthly.month_date = months_range.month_date
)
```

**Weighting Formula**: Recent months have higher impact using `(7 - month_offset) / 21.0`

- Month 1 (current): Weight 6/21 ≈ 28.6%
- Month 2: Weight 5/21 ≈ 23.8%
- Month 6: Weight 1/21 ≈ 4.8%

### Data Relationships & Integrity

#### Account Hierarchies

- **Bank Accounts**: Include overdraft limits, automatic investment balances
- **Credit Cards**: Track utilization, payment due dates, available credit

#### Transaction Enrichment

- **Payment Flow**: Complete payer → receiver tracking with document validation
- **Credit Card Details**: Full installment tracking, original purchase attribution
- **Merchant Intelligence**: Business classification, tax identification

#### Category Intelligence

- **Hierarchical Structure**: Parent-child relationships for expense rollups
- **Exclusion Logic**: Automated filtering of transfer/investment categories
- **Custom Mapping**: User-defined category overrides

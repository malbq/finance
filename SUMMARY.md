# Family Finance Manager

## Overview

A comprehensive personal finance dashboard connecting bank accounts, credit cards, and investments. Users organize expenses by category, track wealth evolution, and project future scenarios based on historical patterns. Designed for automated financial control.

## Core Features

### 1. Financial Dashboard

- Total balance across accounts and investments
- Wealth evolution projections (6-month weighted moving averages)
- Spending analysis via interactive charts and category tables
- Key metrics: average monthly income/expenses, expected savings

### 2. Transaction Management

- Interactive account cards with balances
- Responsive transaction tables (bank vs credit card layouts)
- Real-time filtering and category editing
- Credit card details: installments, payment info, merchant data

### 3. Cash Flow Projection

- Monthly expenses and income patterns
- Interactive charts for income, expenses, balance evolution
- Daily transaction tooltips
- Future cash flow projections

### 4. Investment Tracking (Planned)

## Technical Requirements

### Frontend

- React with hooks
- TailwindCSS (dark theme)
- Recharts for visualizations

### Data Integration

- Pluggy API for synchronization
- Secure authentication
- Sync: accounts, transactions, investments, categories

### UX

- Fast loading, optimistic updates
- Real-time updates
- Graceful error handling

## Pluggy Integration

- Multi-institution support
- Sync accounts, transactions, investments, categories
- Manual/scheduled updates
- Error logging, retries, data validation

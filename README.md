# Family Finance Manager

Personal finance dashboard for consolidating accounts, reviewing transactions, and understanding spending over time.

It is built for local use, with synced banking data, fast navigation.

## What the app does

### Dashboard

- Shows total balance across connected accounts and investments
- Highlights spending trends over time
- Breaks spending down by category for quick review
- Helps track overall financial direction at a glance

### Transactions

- Lists transactions by account
- Supports filtering to find specific entries quickly
- Lets you recategorize transactions directly from the UI
- Handles both bank account and credit card activity
- Surfaces richer transaction details when available

### Sync and export

- Pulls the latest data from connected providers on demand
- Keeps local data up to date for day-to-day use
- Exports dashboard and transaction data for external analysis

## Development setup

### Requirements

- Bun
- Pluggy account with **Meu Pluggy** integration

### Environment variables

Create a `.env` file in the project root and copy the values from `template.env`.

The app expects:

- `DATABASE_URL`
- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`
- `PLUGGY_ITEM_ID`
- `PORT`

For UI and local development, the SQLite database path and port are the main required values.

### Install dependencies

```bash
bun install
```

### Initialize the database

```bash
bun run db:migrate
```

### Start the app in development

```bash
bun run dev
```

Then open:

- http://localhost:7777

## Useful commands

```bash
bun run dev
bun run typecheck
bun test
bun run db:migrate
bun run db:generate
```

## Project structure

- `app/` — frontend application
- `api/` — server routes and data access
- `domain/` — shared business models
- `db/` and `drizzle/` — database files and migrations
- `scripts/` — project utilities

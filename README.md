# MoneyTalks Ledger

Fresh rebuilt Vite/React app.

## Features

- Spreadsheet-style editable transaction ledger
- Dashboard graphs for incoming, outgoing and savings
- Spending category bar chart
- Bills spreadsheet with due dates and reminder days
- Income spreadsheet, fully editable
- Calendar showing bills and income
- Tax page with deductions, GST credits and tax estimate
- CSV import/export for bank transactions
- Backup/restore JSON
- Commonwealth/bank sync placeholder with safe CSV import now
- PWA manifest for Vercel / install to phone

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Push this folder to GitHub and import it into Vercel as a Vite app.

## Bank sync note

Real automatic Commonwealth Bank sync needs Open Banking/CDR integration through an accredited provider. This app does not ask for bank passwords and does not scrape NetBank. Use CSV import now; add a CDR provider/backend later.

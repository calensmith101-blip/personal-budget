# MoneyMate Colour Budget App

A brighter Vercel-ready personal budget app.

## Features

- Colourful dashboard
- Bills and subscriptions
- Upcoming and previous/paid bills
- Recurring bills with roll-forward
- Calendar view
- Income tracking
- Monthly leftover estimate
- Category spending bars
- Safety buffer
- Savings goals
- Money pots
- Debt tracker
- Wish list / planned purchases
- Backup and restore JSON
- Calendar export `.ics`
- Print / save as PDF
- Home Assistant iframe panel notes
- Home Assistant webhook setting

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Vercel

Upload the full folder to GitHub, then import it into Vercel as a Next.js project.

## Home Assistant iframe

```yaml
panel_iframe:
  moneymate:
    title: MoneyMate
    icon: mdi:cash-clock
    url: https://YOUR-VERCEL-APP.vercel.app
```

## Note

This version uses browser localStorage. That is simple and easy for Vercel. For real cross-device live syncing, the next upgrade should add Supabase login/database.

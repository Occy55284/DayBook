# Daybook

A mobile-friendly web app for tracking daily trading profit and loss, built for a copy-trading
account. Enter each day's result on a Week / Month / Year / All calendar and see your real profit
after the broker's commission.

## How it works
- **Trading week:** Monday to Friday. No trading at the weekend.
- **Daily entry:** tap a day, type the profit or loss (the **+/-** button switches sign, because phone
  number keypads have no minus key) and pick the lot size you traded (0.01, 0.02 ...). Lot size is for
  reference only and never affects a total.
- **Sunday commission:** the broker takes a percentage (default 30%) of the week's profit on the Sunday
  after it. Each week has a **Sun** row under Friday. Tap it to enter the commission; it is filled in with
  the percentage of that week's profit, and you can change it. After a losing week none is suggested.
- **Real profit:** totals are after commission, with a line showing the commission and the trades-only figure.
- **Analytics:** net profit, best / worst / average day, streak, daily profit and loss bars and a running total.
- **Your data:** Settings has the commission percentage and a CSV download of everything you've entered.
- Money is shown in pounds (£).

## Run it on your computer
1. Install Node.js 22 or newer.
2. `npm install`
3. Optional: copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key
   (the app has working defaults for the current project).
4. `npm run dev`, then open http://localhost:3000

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the app locally |
| `npm run typecheck` | Check the code for type errors |
| `npm test` | Run the automated tests (weeks, commission, totals, money, export) |
| `npm run build` | Build the production version |

Every pull request is checked automatically by `.github/workflows/ci.yml` (type check, tests, build).

## Database
Supabase (Postgres). The whole design, including the per-user security rules, is in
[`supabase/schema.sql`](supabase/schema.sql). To start a fresh copy, run that file once in a new
Supabase project's SQL Editor. Each signed-in user can only see their own rows.

## Where things are
- `app/` pages (Calendar, Analytics, Settings) and global styles
- `components/` screens and shared pieces (`DataProvider` loads your data once and shares it)
- `lib/` the maths (`dates`, `finance`, `analytics`), money formatting, CSV export and the Supabase data layer
- `tests/` automated tests for everything in `lib/` that does arithmetic

## Deploying
Hosted on Vercel. Production is published from the branch set as the Production Branch in the Vercel
project's settings (Settings, Environments, Production).

See [`PROGRESS.md`](PROGRESS.md) for the history of changes and what is planned next.

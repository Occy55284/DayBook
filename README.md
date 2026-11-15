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

## Who can join (invite-only)
Public sign-up is switched off. The owner makes a one-time invite code in **Settings, Invite someone**, copies the
ready-made message and sends it. The person opens the app, taps **Join with an invite code**, and enters the code,
their email and a password. Codes work once, expire (1, 7 or 30 days) and can be cancelled.

- The sign-up rules live in `supabase/functions/signup-with-invite/` (`handler.ts` holds the rules and is tested;
  `index.ts` connects them to the database). It is deployed to Supabase with "Verify JWT" **off**, because people
  joining are not signed in yet. It uses the project's service key, which Supabase supplies to the function itself.
- Guessing is slowed down: after 30 wrong codes in 10 minutes (across everyone) sign-up pauses for a while.
- **Forgot password** sends a reset email and the app has a "Choose a new password" screen for the link.
- Making yourself the owner (once): see the note above `app_admins` in `supabase/schema.sql`.
- For this to be enforced, **"Allow new users to sign up" must be OFF** in Supabase (Authentication, Sign In / Providers).
  Otherwise someone could still call the sign-up service directly and skip the invite.

## Deleting an account
Settings, **Delete my account**: permanently removes the person's login and everything in it (trades, lot sizes,
commissions, settings). It asks for the password and the word DELETE, and is hidden behind a button.
- The rules are in `supabase/functions/delete-account/` (`handler.ts` is tested; `index.ts` connects it to the database).
  It is deployed with "Verify JWT" **off** because it does its own, stricter check: it looks up the real signed-in person
  from their login token. Which account is deleted is always decided by that login, never by anything sent in the request.
- The **only admin cannot delete themselves**, so the app is never left with nobody able to create invite codes.
- The database does the clean-up: every table that holds personal data is linked to the login with "delete cascades",
  so removing the login removes the data (tested against the live database with a throwaway user).

## Privacy policy and terms
Public pages at `/privacy` and `/terms` (no sign-in needed), written for the UK and for a personal, non-company project run by
the owner named in `lib/legal.ts` (name, contact email, the version date and the "not financial advice" sentence all live there).
- Joining requires ticking an agreement box. The sign-up function records **which version of the Terms and Privacy policy** was
  agreed to and **when** on the account (`terms_version`, `terms_accepted_at` in the user's metadata).
- When the legal pages change in a way people should re-agree to, update the text, `LEGAL_VERSION` and `LEGAL_UPDATED` in `lib/legal.ts`.
- These are plain-English drafts that match what the app actually does. They are not legal advice: have them checked before
  offering Daybook widely, and keep them in step with the app (for example if the email service or hosting changes).
- The sign-in screens have a short not-financial-advice notice and links; Settings has an About card.

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

# Progress Log

Newest entry first.

## 2026-11-13 — Monday-to-Friday week, commission on its own Sunday row
**Done**
- Weeks are now Monday to Friday (Calendar, Analytics, month grid). The app opens on this week; at the weekend that is the week that just ended.
- The week's commission is paid on the Sunday right after its Friday. The Week view has a Sunday row under Friday: tap it to enter the commission, pre-filled with 30% of that Mon-Fri week's profit (editable, empty = none). The month view shows it as an orange strip under its week.
- A week's total includes its Sunday's commission, so it is real profit after commission. Month/year/all totals count commission in the month it was paid.
- Data move (done in the database): the five trades entered on Sun 8 - Thu 12 Nov were moved one day later to Mon 9 - Fri 13 Nov, as requested.
- Locked down the old `gmc_requests` table (removed its open policy; no data deleted).

**Notes / decisions**
- Losing weeks: the app suggests no commission, but you can type one in. Still to be confirmed against the broker.
- Sunday trades are no longer possible (no Sunday square).

**Next**
- Win-rate ring and drawdown chart.

## 2026-11-13 — Sunday commission and daily lot size
**Done**
- Sunday entry box now has a Broker commission field. It is filled in with 30% of the previous week's profit (nothing if the week was a loss) and can be edited or emptied. Saved in new table `pnl_commissions`.
- Totals (Calendar and Analytics net / running total) are now AFTER commission. A line under the total shows the commission and the trades-only figure. A Sunday with commission shows an orange dot in the month view.
- Every day's entry box asks for the lot size (0.01, 0.02 ... quick-pick buttons or typed). It starts from the last lot used, is saved with the trade (`pnl_entries.lot_size`), and shows on the day's trade. Display only, never used in any sums.
- Settings has the commission % (default 30), saved in new table `pnl_settings`.
- Database changes were applied to Supabase: new tables `pnl_commissions` and `pnl_settings` (row-level security, own rows only) and a nullable `lot_size` column on `pnl_entries`. Older entries simply have no lot.

**Notes / decisions**
- "Last week" for the commission means the 5 trading days (Sun-Thu) before that Sunday.
- The old `gmc_requests` table from the previous app is still in the same Supabase project and is open to anyone with the public key. Not touched here.

**Next**
- Win-rate ring and drawdown chart.

## 2026-11-12 — Renamed to Daybook
**Done**
- App name is now Daybook: sign-in screen, browser tab title, README and package name.

**Still manual (needs a computer)**
- Vercel: Project → Settings → General → Project Name → `daybook`.
- GitHub: repo → Settings → General → Repository name → `daybook`.

**Next**
- Win-rate ring and drawdown chart.

## 2026-11-12 — +/- button for losses
**Done**
- Entry box now has a +/- button next to the amount, because the phone number keypad has no minus key.
- Green + for a profit, red − for a loss; the number turns red too. The keypad stays open when you tap it.
- Save is blocked (with a hint) if the box holds something that isn't a number, e.g. just "-". Before, that silently cleared the day.

**Next**
- Win-rate ring and drawdown chart.
- Rename the app to Daybook (Vercel project, GitHub repo, app title).

## 2026-11-12 — Analytics tab (first version)
**Done**
- Analytics tab now has a Week / Month / Year / All switch with arrows, like the Calendar.
- Net P&L card plus tiles: best day, worst day, average day, current streak.
- Daily profit & loss bar chart (green = profit, red = loss). Year / All show one bar per month.
- Running-total curve (how far up or down you are overall) for the chosen period.
- Charts are plain SVG, so no new packages. Maths lives in `lib/analytics.ts`.

**Next**
- Win-rate ring and drawdown chart.
- Number keypad on phones has no minus key, so losses are hard to type. Add a +/- toggle.
- Rename the app to Daybook (Vercel project, GitHub repo, app title).

## 2026-11-12 — New project: PnL Tracker (calendar)
**Done**
- Wiped the old GMC Tracker project and started a fresh git history.
- Next.js (TypeScript) app with a dark theme and bottom tabs: Calendar, Analytics, Settings.
- Calendar with Week / Month / Year / All views. Weeks run Sun–Thu (Sunday night trades count on Sunday; no Fri/Sat).
- Tap a day to enter profit/loss. Wins show green, losses red.
- Data saved in Supabase (table `pnl_entries`) behind a login; row-level security limits each user to their own rows.

**Next**
- Supabase database + login (so data is saved online).
- Analytics tab: profit/loss donut, Net PnL, drawdown chart.
- Accounts switcher and monthly/yearly goals.
- Make it installable on a phone home screen.

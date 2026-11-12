# Progress Log

Newest entry first.

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

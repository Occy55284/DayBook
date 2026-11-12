# Progress Log

Newest entry first.

## 2026-11-12 — New project: PnL Tracker (calendar)
**Done**
- Wiped the old GMC Tracker project and started a fresh git history.
- Next.js (TypeScript) app with a dark theme and bottom tabs: Calendar, Analytics, Settings.
- Calendar with Week / Month / Year / All views. Weeks run Sun–Thu (Sunday night trades count on Sunday; no Fri/Sat).
- Tap a day to enter profit/loss. Wins show green, losses red.
- Data is saved in the browser (localStorage) for now.

**Next**
- Supabase database + login (so data is saved online).
- Analytics tab: profit/loss donut, Net PnL, drawdown chart.
- Accounts switcher and monthly/yearly goals.
- Make it installable on a phone home screen.

# Progress Log

Newest entry first.

## 2026-11-24 — Account value on every screen
**Done**
- A slim **Account value** strip under the logo on every signed-in screen (Calendar, Analytics,
  Settings): the total the account is worth now = own money + bonus + profit after commission -
  withdrawals. It is the same number as "Account balance" on the Return card and the balance the lot
  size uses. Masked by privacy mode ("£•••••"); waits for the real numbers before showing, so it never
  flashes a wrong total. With no capital entered it shows a small link to Analytics instead of a number.
- One shared calculation `accountBalance()` in `lib/capital.ts`, now used by the strip, the lot size
  card and the entry-box lot hint (so they can never disagree). `components/AccountView.tsx` (display)
  and `components/AccountStrip.tsx` (data).
- 197 tests (7 new): balance maths incl. negative totals, the strip text, and that it starts masked.

**Separate pull request, same day**
- GMC Tracker removed from `main` (PR #46; owner confirmed). The old `gmc_requests` data in Supabase
  was left untouched at the owner's choice.

**Notes**
- No database changes.

## 2026-11-24 — Privacy mode, target celebration, lot size tracker
**Done**
- **Privacy mode:** a button at the top right of every signed-in screen. When on, every £ amount and
  % return in the app is shown as dots (Calendar, bubbles, month grid, year, Analytics, target and
  capital cards, the chart's target label, bubble aria-labels). The target card's % and progress bar
  are masked too. Remembered on the device; starts masked until the saved choice is read, so numbers
  never flash up. All formatting goes through `lib/privacy.ts` (`makeFmt`) and `useFmt()` in
  `components/Privacy.tsx`; screens that used `money()` / `signed()` / `pctText()` now use `useFmt()`.
  The Return card is also hidden by privacy mode (it keeps its own Hide button for when privacy is off).
- **Target celebration:** the first time this month's profit (after commission) reaches the monthly
  target, glowing bubbles float up and a "TARGET HIT" banner appears (no amounts shown). Once per
  month per device (`daybook-celebrated-YYYY-MM` in the browser), fades after 9s, Escape or "Nice"
  closes it, banner only for people who reduce motion. `components/TargetCelebration.tsx`.
- **Lot size tracker:** rule is 0.01 lots per £1,000, whole steps only (`lib/lots.ts`). New card on
  Analytics under Return on your money: recommended lot for the balance, progress bar to the next
  £1,000 step, a countdown ("about 28 trading days at £25.51 a day, around Fri 25 Dec") and the last
  lot traded, flagged amber if it is above what the balance supports. The day entry box also says
  what the balance supports. Hidden by privacy mode.
- 190 tests (was 161): privacy masking, celebration rules, lot rules and card text.

**Decisions (owner chose these)**
- Balance = everything in the account: own money + bonus + profit - withdrawals (the Return card's
  "Account balance"). Average = the last 20 logged trading days, after the commission paid inside that
  window. Whole steps only (£2,999.99 is still 0.02).

**Notes**
- Privacy mode hides amounts and %, not shapes: charts, bubble sizes, win/loss colours and lot sizes on
  the calendar stay visible. Settings inputs and the entry box show real numbers when you open them.
- The countdown counts Monday to Friday only (no bank holidays) and assumes you trade every trading day
  at your recent average; it is an estimate. The current week's commission is not yet in the average.
- No database changes in this entry.

## 2026-11-23 — Hide option for "Return on your money" + progress log tidy
**Done**
- The **Return on your money** card on Analytics has a **Hide / Show** button, for screen
  sharing. When hidden, the figures are not on the page at all (no % return, profit, balance,
  bonus %, history list or add form), only "••••" and a note. The choice is remembered on the
  device; until it has been read the card starts hidden, so a screen share never flashes the
  numbers. Display split out to `components/CapitalView.tsx` (the wrapper stays in
  `CapitalCard.tsx`); `vitest.config.ts` added so component tests can use the `@/` imports.
- Moved this session's progress entries from the bottom of this file to the top (newest first,
  as the header says); they had been appended below the oldest entry by mistake.

**Notes / decisions**
- Only this card is hidden. Other cards (Net P&L, monthly target) still show profit amounts.
  A single "privacy mode" for the whole app is a possible next step.

## 2026-11-19 — Bubbles on the Week view
**Done**
- The Calendar **Week** view now has a `List | Bubbles` switch (remembered separately from the
  Month choice). Bubbles show the five days plus Sunday's commission, larger than on the
  Month view (`unitPx` 72). A day with nothing entered is a faint dashed "ghost" bubble with a
  + (tap to add a trade); the commission is amber (a dashed ghost until entered, tap to open
  the commission box). Wins green, losses red, size follows the £ amount, as on Month.
- `BubbleView` now takes `items` (`value: null` = ghost, `kind: "day" | "commission"`) plus
  `unitPx`, `labelMinPx`, `hint`, `emptyText`; Month usage updated to match.
- 1 new bubble-layout test for a week-shaped input (157 tests total).

**Notes / decisions**
- Ghost bubbles use the smallest size so a quiet day never competes with a real result.

## 2026-11-19 — New "Terminal" look + daily Bubbles view
**Done**
- Owner chose the "Terminal" direction (after comparing Aurora, Terminal and a light Ledger
  style as prototypes). It is now the app's look, in `app/terminal.css` (loaded after
  `globals.css`): JetBrains Mono type, grid-paper background, neon green/red glow, corner
  brackets on cards, `// LABELS`, blinking cursor on the name, glowing tab bar.
  Added `@fontsource-variable/jetbrains-mono`. Privacy/terms pages stay in the Inter font.
- **Bubbles view:** on the Calendar **Month** view a "Grid | Bubbles" switch (choice remembered
  in the browser). One floating neon-glass bubble per traded day: green = win, red = loss,
  size follows the £ amount (area grows with the amount, with a minimum so small days stay
  readable), today has a dashed ring, tapping a bubble opens that day's entry box.
  Gentle floating motion, switched off for people who ask their device for reduced motion.
- Packing in `lib/bubbles.ts` (no overlaps, compact round cloud, deterministic) with
  12 new tests (156 total). Component: `components/BubbleView.tsx`.

**Notes / decisions**
- Screenshots were taken with a faked signed-in session and a dead database address, so no
  real data was touched.
- Bubbles show trading days only; Sunday commission is not a bubble (the totals include it).
- Possible next: count-up numbers on the totals, a celebration when the target is reached,
  a light theme switch (the Ledger prototype is in git history of PR #42).

## 2026-11-19 — Target pace line on the Running Total graph
**Done**
- On Analytics, in the **Month** view with a monthly target set, the Running Total graph
  now spans the whole month's trading days and shows a dashed amber "pace" line rising
  steadily from £0 to the target at month end (labelled "Target £X"). The green/red line
  being above the dashed line means you are ahead of pace.
- Other views (Week / Year / All) and months with no target set use the original graph,
  unchanged.
- New `pacePoints` in `lib/target.ts` places each day by trading-day position (weekend
  commission shares the Friday's position); 6 new tests (144 total).

**Notes / decisions**
- The old graph spaced logged days evenly; the new one is by calendar trading day so the
  pace line is meaningful. A single logged day now draws from the left edge.
- Pace is a straight line over Mon-Fri days; bank holidays are not removed.

## 2026-11-19 — New Daybook logo (bull and bear)
**Done**
- Replaced the logo with the new bull-and-bear / candlesticks / open-book design:
  browser-tab icon (`app/icon.png`), iPhone home-screen icon (`app/apple-icon.png`)
  and the see-through emblem used in the header and on the sign-in screen
  (`public/logo-mark.png`). The emblem is cut from the supplied picture without its
  "Daybook" lettering; the name is still shown as text next to it.
- Emblem made larger (header 36px -> 52px, sign-in 96px -> 150px) because the new
  artwork has more detail.
- Tests (138), typecheck and build pass.

**Notes / decisions**
- To change the logo again, replace those three image files (keep the same names).

## 2026-11-17 — Monthly profit target + return on your money
**Done**
- **Monthly profit target:** new setting on the Settings page (empty = no target), saved in
  the new nullable column `pnl_settings.monthly_target`. A `TargetCard` on the Calendar and
  Analytics **Month** views shows "£X of £Y", a progress bar, the % done, trading days left
  (Mon-Fri, counting today until it is logged), the amount needed per remaining day, and
  On track / Behind pace. Finished months show "Target reached" or "Missed by £X".
- **Return on your money:** new `CapitalCard` on Analytics with an **Add capital** button.
  Entry types: starting balance, own money added, bonus, withdrawal (amount, date, optional
  note), with a History list and Remove. Shows the all-time % up on your own money, the %
  counting the bonus too, and the account balance. Saved in the new table `pnl_capital`.
- Maths in `lib/target.ts` and `lib/capital.ts`; 23 new tests (138 total).
- "Download my data" now includes the capital rows; privacy page wording updated to list
  the target and capital entries.

**Needs doing in the database (before the app code goes live)**
- Run the two statements in `supabase/schema.sql` (the `pnl_capital` table with its
  row-level-security policies, and `alter table public.pnl_settings add column if not exists
  monthly_target ...`). Live project: `gmc-tracker` (it also still holds the old
  `gmc_requests` table with 283 rows - do not drop that). Until then the app cannot load.

**Notes / decisions**
- % = profit after commission (all-time) / money put in (start + own money added).
  Withdrawals do NOT shrink that base, so taking profit out does not flatter the %; they
  only reduce the balance. Balance = money in + bonus + profit - withdrawals.
- Target is monthly, counted in trading days; bank holidays are not taken off.

**Ideas for later**
- Daily loss limit warning; win rate / average win vs loss; notes on each day; target line
  on the Running Total graph; streak badges; monthly summary to share; target as a % of capital.

## 2026-11-17 — Daybook logo and header
**Done**
- Added the new Daybook logo: browser-tab icon (`app/icon.png`), iPhone
  home-screen icon (`app/apple-icon.png`), and a see-through emblem
  (`public/logo-mark.png`).
- New `components/BrandHeader.tsx`: logo + "Daybook" name at the top of every
  signed-in screen (Calendar, Analytics, Settings), on phone and PC.
- Sign-in screen now shows the new logo instead of the drawn one; removed the
  unused `components/Logo.tsx` and the old `app/icon.svg`.
- Tests (115) pass, typecheck and build pass.

**In progress / next**
- Optional: swap the full logo (with lettering) into the Settings "About" card.

**Notes / decisions**
- Header is slim and centred to match the 480px app column.

## 2026-11-15 — Phase 2C: privacy policy, terms and the agreement
**Done**
- New public pages `/privacy` and `/terms` (readable without signing in), in plain English, written from what the app really does. The app screens moved into a route group so only they sit behind sign-in; web addresses are unchanged.
- Joining needs a ticked box agreeing to the Terms and Privacy policy and acknowledging "record-keeping tool, not financial advice". Both links open in a new tab so nothing typed is lost.
- The sign-up function records which version of the legal pages was agreed to, and when, on the account. (Code and tests are in this change; it is deployed to Supabase right after this is merged, because the current live join screen has no box.)
- Sign-in screens show the not-financial-advice notice and links; Settings has an About card with the notice, links, the contact email and the date of the legal pages.
- 102 automated tests; every earlier browser check and accessibility scan still passes; the new pages have 0 accessibility issues.

**Statements in the drafts the owner must be able to stand behind (please confirm or edit in `app/(legal)/`)**
1. Based in the UK: UK data-protection law, the ICO as the regulator, and English law in the Terms.
2. "I will only look at your records if I need to fix a problem, or if the law requires it."
3. Replying to data requests within one month.
4. Giving notice before stopping Daybook "where I can", and never charging without clear agreement first.
5. Data stored in Supabase's London region (checked: the project is in eu-west-2). Hosting by Vercel.
6. Backups: the drafts say copies in backups are removed when they expire under the provider's schedule. Check what the Supabase plan actually keeps (Phase 2D).
7. Password-reset emails go through the login system's email service (to be updated when a custom email sender is set up in Phase 2D).
8. 18 or over.
9. The contact email is shown publicly on both pages. A separate address for Daybook would keep the personal inbox private.
10. Whether the UK data protection fee to the ICO applies (it can apply even to a side project that handles other people's personal data). Worth a quick check on ico.org.uk.

**Notes / decisions**
- No cookie banner is needed at present: the only thing stored on the device is the sign-in session, which is strictly necessary, and there are no analytics or advertising trackers. Revisit if either is ever added.
- Existing account (the owner's) has no agreement record; it only applies to people who join through the new screen.

**Next**
- Phase 2D: email sender, domain, hosting plans, backups, error monitoring.

## 2026-11-15 — Phase 2B: delete my account
**Done**
- Settings has **Delete my account** (hidden behind a button, with a plain warning and a tip to download your data first). The final button stays off until the password is entered and DELETE is typed.
- Edge Function `delete-account` (deployed, Verify JWT off because it checks the login itself). It finds the real signed-in person from their token, re-checks their password, refuses if they are the only admin, and only then deletes. The account deleted is always the verified person's; no account id is sent or trusted. 18 tests (deliberately broken four ways: deleting whoever the request names, skipping the password, ignoring the only-admin rule, accepting any token; all caught).
- Proven against the live database, with a throwaway user inside a test that aborts itself: deleting a login removes all their trades, commissions, settings and admin row; a used invite code stays on record but no longer points at them; everyone else's data is untouched.
- After deleting, the person lands on the sign-in screen with "Your account and all your data have been deleted." and nothing is kept on the phone.
- Small fix: the download button now says "1 entry", not "1 entries".
- 99 automated tests. All earlier browser checks and accessibility scans still pass.

**Notes / decisions**
- The only admin has to make someone else an admin first. Today that is done in the Supabase SQL Editor (see the note above `app_admins` in `supabase/schema.sql`); an in-app way to share admin rights could come later.
- Data about a deleted person is not kept anywhere in the app (the invite code row keeps only the code and dates).
- Not tested live end to end from the build machine (it can't reach Supabase's web address); the first real deletion of a test account is the live confirmation.

**Next**
- Phase 2C: privacy policy, terms and the "not financial advice" notice (needs the owner's name/contact details). Phase 2D: email sender, domain, hosting plans, backups, error monitoring.

## 2026-11-15 — Phase 2A: invite-only sign-up, forgot password
**Done**
- Sign-in screen is now four screens: Sign in, **Join with an invite code**, **Forgot password**, and **Choose a new password** (for the reset-email link). The old open "Create account" button is gone.
- Invite codes: new tables `app_admins`, `invites`, `invite_attempts` and function `create_invite()` (admin-only, checked by database rules; 15 security checks run directly against the database).
- Sign-up Edge Function `signup-with-invite` (deployed, Verify JWT off): checks the code, creates the account, gives the code back if anything fails, and slows down guessing (30 bad codes / 10 minutes). Its rules (`handler.ts`) have 21 tests.
- Owner screen in Settings ("Invite someone"): create a code with a note and expiry, copy a ready-made message, see waiting / used / expired / cancelled, cancel a waiting code. Only admins see it.
- 81 automated tests; the new screens pass the automated accessibility scan.

**Needs the owner (cannot be done from code)**
- Switch OFF "Allow new users to sign up" in Supabase, otherwise the invite gate can be skipped by calling the sign-up service directly.
- Email: Supabase's built-in sender only emails the project team. For password-reset emails to reach members, set up a custom email sender (SMTP) and ideally a domain.
- Turn on leaked-password protection (Supabase, Authentication; needs a paid plan).

**Notes / decisions**
- Accounts made with a code are marked email-confirmed without sending an email (the code is the gate), so the typed email is not verified. The join screen asks for the email twice because the password reset goes there.
- Not tested live end to end from the build machine (it can't reach Supabase's web address). The function's rules and the database rules are tested; the first real join is the live confirmation.

**Next**
- Phase 2B: delete-my-account. Phase 2C: privacy policy, terms and the "not financial advice" notice (needs the owner's name/contact details). Phase 2D: email sender, domain, hosting plans, backups, error monitoring.

## 2026-11-15 — Phase 1: safer, in pounds, accessible, tested
Result of a full review of the app (see the review notes in the pull request). Plan from here: Phase 2 = ready for other users, Phase 3 = installable app + trader tools (win rate, drawdown, goals, balance), Phase 4 = community side + journal.

**Done**
- Money is now in pounds (£) everywhere, through one formatter (`lib/format.ts`) so a per-user currency can be added later.
- Data-overwrite bug fixed: the app now waits for your data before showing any day to tap. Before, on a slow connection you could tap a day, see an empty box and overwrite the real number. If loading fails you get "Couldn't load your data" and Try again, and nothing can be edited.
- Data is loaded once and shared (`DataProvider`), so switching tabs is instant (no flash of £0.00).
- A failed save now puts back only that one day, instead of rolling everything back.
- Clear has a 6-second Undo (restores the amount, lot size and commission).
- Accessibility: page landmarks and headings, labelled boxes, readable text on coloured days, the entry pop-up is a real dialog (Escape closes it, Tab stays inside, focus returns), spoken names built from the visible text, current tab announced, visible keyboard focus. The automated scan found 0 issues on every screen.
- Settings: "Download my data" gives a CSV of all trades, lot sizes and commissions.
- 50 automated tests for the week, commission, totals, money and export maths (`npm test`), plus `npm run typecheck`, and a GitHub Actions check on every pull request (`.github/workflows/ci.yml`).
- The database design is now saved in the repo (`supabase/schema.sql`) and the README is rewritten.

**Notes / decisions**
- Loading is all-or-nothing: if any of trades, commissions or settings fail to load, editing is blocked until Try again works.
- Not done on purpose (needs the owner): tidying the old `main` branch and stale branches, switching sign-ups to invite-only (Phase 2).

**Next**
- Phase 2 (ready for other users): invite-only sign-up, email confirmation and password reset with a proper email sender, privacy policy and terms, delete-my-account, domain, hosting plans and backups.

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

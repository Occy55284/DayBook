# Progress Log

A running record of work on GMC Tracker V1. Add a new entry at the top of the
log after each working session so the project history stays current.

## How to use this file
- Add one entry per session, newest first.
- Keep entries short: what changed, why, and anything left open.
- Use the template below. Commit this file along with the session's work.

### Entry template
```
## YYYY-MM-DD — <short title>
**Done**
- ...

**In progress / next**
- ...

**Notes / decisions**
- ...
```

---

## 2026-07-09 — GDPR full-name enforcement (requestor + approver) + auto progress log
**Done**
- Blocked full names on the New Request form: label updated to "Requestor Initials — no
  surnames (GDPR)", `pattern="[^\s]+"` added client-side, and `createRequest` in
  `actions.ts` rejects any name containing whitespace server-side. (PR #23)
- Extended the same enforcement to the approver/rejecter field on the Queue page: both
  `approved_by` inputs now carry the same pattern, `updateStatus` in `actions.ts` has a
  matching server-side check, and the Dashboard "Approved By" column now uses `toInitials()`
  so existing records with full names are masked. (PR #25)
- Added `.claude/settings.json` with a `Stop` hook that auto-updates this file at end of
  each session. Uses `asyncRewake` (exit 2) to re-invoke Claude when today's date is not
  yet in the log; fires at most once per day. (PR #24)

**In progress / next**
- PR #25 (approver GDPR fix) open, Vercel preview ready — awaiting merge.
- Possible follow-ups: CSV/Excel export on Reports, dark mode, mobile card layout for Queue.

**Notes / decisions**
- GDPR enforcement is two-layer (client `pattern` + server-side regex) on both name fields.
- `toInitials()` in `lib/calculations.ts` acts as a display-layer fallback for any data
  that pre-dates the enforcement.
- The Stop hook lives in `.claude/settings.json` (committed) so it applies automatically to
  all Claude Code sessions on this project.

---

## 2026-07-01 — Dashboard tweaks, lunch pricing fix, double-submit fix
**Done**
- Dashboard "Recent Requests" now shows 15 rows instead of 10, and dates
  display with the day of week (e.g. `Wed, 01 Jul 2026`) via a new
  `formatDateWithDay` helper in `lib/calculations.ts`. (PR #13)
- Requests marked "Lunch required" (at submission or added later from the
  Hospitality queue) no longer get the standard £3.40 per-room refreshment
  charge, since lunch already covers it — `refreshment_total` is set to 0
  in both `createRequest` and `addLunch`. Request detail page's room
  breakdown updated to reflect £0 per room in that case. (PR #14)
- Fixed a double-submission bug on the New Request form: the submit button
  had no protection against double-clicks, so a second click before the
  redirect completed could send a duplicate request. Added a `SubmitButton`
  client component (`app/components/SubmitButton.tsx`) using
  `useFormStatus` to disable the button and show "Submitting…" while
  pending. Verified in-browser with Playwright. (PR #15)

**In progress / next**
- No feature work in flight.

**Notes / decisions**
- `main` had moved on since the last session (request detail pages,
  `approved_by`, `created_at` ordering, `ROOM_PRICE` now £3.40) — the
  Dashboard PR was rebased onto latest `main` before merging.
- Each change shipped as its own PR (#13, #14, #15), all merged same day.

---

## 2026-07-06 — Rejected status, request detail page, initials display
**Done**
- Added `Rejected` status to schema (migration run in Supabase).
- Added `rejected_by` / `rejected_at` columns so rejections are tracked.
- Reject button added to Delivered items in the queue (alongside Approve), each with an initials input.
- Request detail page (`/requests/:id`) updated to show who rejected or approved and when.
- Dashboard "View →" button fixed — was 404ing due to a stale route from a previous PR; now correctly links to `/requests/:id`.
- Requestor names throughout dashboard and queue now show initials only (full name on hover).
- `badge-rejected` (red) and `button.danger` styles added.

**In progress / next**
- No open items.

**Notes / decisions**
- Next.js 16 requires `params` to be awaited as a Promise; the duplicate `/request/[id]` page used the old sync pattern and was removed.
- Migration SQL is in `supabase/migrations/20260706_add_rejected_status.sql`.

---

## 2026-06-18 — UI overhaul (professional + vibrant)
**Done**
- Reworked `app/globals.css` into a design system: design tokens, vibrant
  gradient accents (indigo/violet brand, cyan/amber/emerald/pink), polished
  cards, forms, buttons and tables.
- Added a sticky branded top bar with a gradient "GMC" logo mark and a new
  `NavBar` client component with active-page highlighting.
- Added a reusable color-coded `StatusBadge` (Submitted = amber, Delivered =
  cyan, Approved = emerald) and used it on the Dashboard and Queue.
- Restyled all pages: gradient stat tiles with icons (Dashboard), tidier form
  (New Request), responsive table wrappers (Queue), key/value summary tables
  (Reports).
- Switched to the Inter font via `next/font/google`.
- Verified `npm run build` passes (all routes prerender).

**In progress / next**
- Functionality unchanged. Possible follow-ups: CSV/Excel export on Reports;
  dark mode; mobile card layout for the Queue table.

**Notes / decisions**
- Pure presentation change — no data model or server action logic touched.
- Trial-ready: kept the design system in one CSS file for easy tweaking.

---

## 2026-06-18 — Project baseline & progress tracking
**Done**
- Captured the current state of the app (Next.js + Supabase) as the starting baseline.
- Added this `PROGRESS.md` to document work after every session.

**In progress / next**
- No feature work in flight.

**Notes / decisions**
- Progress is tracked manually: update this file at the end of each session and
  commit it with that session's changes.

### Baseline snapshot
- **Stack:** Next.js (App Router, TypeScript) + Supabase.
- **Scope (V1):** Customer Service submits room requests (one room per line),
  £3.99/room standard setup charge, optional lunch details/cost, Hospitality
  marks Delivered, Manager/Supervisor marks Approved, weekly/monthly reporting
  from approved records.
- **Pages:** `/` Dashboard, `/new-request` form, `/queue` queue + approval,
  `/reports` reports.
- **Key files:** `app/actions.ts`, `lib/calculations.ts`, `lib/supabase.ts`,
  `supabase/schema.sql`.

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

## 2026-11-17 — Branded background
**Done**
- Added `public/bg-pattern.svg`: a tiled, low-contrast pattern of covered
  dishes, coffee cups and cutlery, used as the page background.
- Added `public/logo-watermark.svg`: a large faint logo fixed in the
  bottom-right corner (opacity set in `body::after` in `app/globals.css`).
- Updated the `body` rule in `app/globals.css` to layer glow + pattern + base colour.
- Build passes (needs Supabase env vars set, as before).

**In progress / next**
- Swap in the real company logo/photo if one is provided (replace the SVGs in
  `public/`, or point the `url(...)` values in `globals.css` at the new files).

**Notes / decisions**
- Cards stay white so text remains readable over the pattern.
- Pure presentation change; no data or server logic touched.

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

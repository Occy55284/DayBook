# GMC Tracker — Standard Operating Procedure (SOP)

**Document owner:** Hospitality / Customer Service Management
**Applies to:** GMC Tracker web application
**Last updated:** 2 July 2026
**Version:** 1.0

---

## 1. Purpose

GMC Tracker replaces the manual Excel process for capturing, delivering, approving and reporting on room refreshment (and optional lunch) requests. This SOP describes exactly how each team should use the app day to day, so that requests are captured correctly, nothing is billed twice, and weekly/monthly reports are accurate.

## 2. Who does what

| Role | Responsibility in the app |
|---|---|
| **Customer Service (CS)** | Submits a New Request whenever a room needs refreshments (and, if relevant, lunch) set up. |
| **Hospitality Team** | Works the Hospitality Queue: delivers the refreshments/lunch and marks each request as Delivered. Can also add lunch details after the fact if CS forgot to include them. |
| **Hospitality Manager / Supervisor** | Reviews Delivered requests and either Approves them (so they count toward billing/reporting) or Rejects them (e.g. duplicate, cancelled, or incorrect request). |
| **Finance / Management** | Uses the Reports page to check daily, weekly and monthly totals, and to download CSV exports for billing. |

## 3. Accessing the app

- Open the app URL in a browser (desktop or mobile — the layout adapts, though it's easiest to use on a laptop/tablet for data entry).
- The top navigation bar has four pages: **Dashboard**, **New Request**, **Hospitality Queue**, **Reports**.
- There is no login for this version — anyone with the link can use it. Do not share the link outside the team.

## 4. Pricing rules (how charges are calculated)

- **Standard refreshment setup charge: £3.40 per room.** This is added automatically for every room listed on a request.
- **If "Lunch required?" is ticked, the £3.40-per-room charge does NOT apply to that request** — lunch already covers the room's refreshments. Only the lunch cost you enter is charged.
- **Total revenue = Refreshment total + Lunch cost.**
- These rules are applied automatically by the system — no manual calculation is needed.

## 5. Request status flow

Every request moves through these statuses, in this order:

```
Submitted  →  Delivered  →  Approved
                          ↘  Rejected
```

- **Submitted** — CS has created the request; it's waiting for Hospitality to action it.
- **Delivered** — Hospitality has delivered the refreshments/lunch to the room.
- **Approved** — A Manager/Supervisor has signed off; the request now counts in Reports (revenue, billing).
- **Rejected** — A Manager/Supervisor has declined the request (e.g. it was a duplicate, cancelled, or entered in error). Rejected requests do **not** count in Reports.

Only **Approved** requests appear in weekly/monthly totals and exports — this is why timely approval matters for accurate reporting.

---

## 6. Procedure: Submitting a New Request (Customer Service)

1. Go to **New Request** in the top navigation.
2. Fill in the form:
   - **Date** — defaults to today; change it if the request is for a different date.
   - **Requestor Name** — your name (Customer Service).
   - **Room List** — one room number per line (e.g. `3.05`, `3.07`, `4.06` on separate lines). Each line is charged £3.40 unless lunch is required (see Section 4).
   - **Lunch required?** — tick this box only if lunch is being provided for this request. Ticking it removes the £3.40 refreshment charge for the rooms in this request.
   - **Lunch Details** — what's being provided (e.g. "6 x wraps, 2 x salads"). Only needed if lunch is required.
   - **Time of Lunch** — when lunch should be delivered.
   - **Lunch Cost** — the total cost of the lunch order.
   - **Notes** — anything else Hospitality needs to know (optional).
3. Click **Submit to Hospitality**. The button will show "Submitting…" and disable itself — this is normal; do **not** click it more than once, and do not press back/refresh while it says "Submitting…".
4. You'll be taken to the Hospitality Queue, where you can see your request listed with status **Submitted**.

**Important:** Only submit each request once. If you're not sure whether a request went through, check the Hospitality Queue or Dashboard for it before submitting again — a duplicate submission means the rooms may get billed twice.

---

## 7. Procedure: Working the Hospitality Queue (Hospitality Team)

1. Go to **Hospitality Queue**. This shows every request that is not yet Approved or Rejected, oldest first.
2. For each request you can see: Date, Requestor, Rooms (with room count), Lunch details (if any), Total cost, when it was submitted, and its current Status.
3. **Once you've delivered the refreshments/lunch for a request:**
   - Click **Mark Delivered** on that row. Its status changes from Submitted to Delivered, ready for manager approval.
4. **If a request didn't have lunch details but now needs them** (e.g. CS forgot to fill it in, or lunch was added on the day):
   - Click **"No — add lunch"** under the Lunch column to expand the mini-form.
   - Fill in **Lunch Details**, **Time of Lunch**, and **Lunch Cost**, then click **Add Lunch**.
   - This automatically removes the £3.40-per-room refreshment charge for that request, since lunch now covers it.
5. You do not approve or reject requests yourself — that's the Manager/Supervisor's job (Section 8). Once you've marked something Delivered, it will disappear from your queue view only after it's been Approved or Rejected.

---

## 8. Procedure: Approving or Rejecting Requests (Manager / Supervisor)

1. Go to **Hospitality Queue**. Requests with status **Delivered** will show two extra controls in the Action column: an **Approved by** field, an **Approve** button, and a **Reject** button.
2. Review the request details (rooms, lunch, total cost) to confirm it's correct and genuinely happened.
3. **To approve:**
   - Type your name into the **Approved by** field.
   - Click **Approve**. The request moves to status Approved and now counts toward Reports/billing.
4. **To reject:**
   - Click **Reject** if the request is a duplicate, was cancelled, or is otherwise incorrect and should not be billed.
   - Rejected requests stay in the system for audit purposes but are excluded from all revenue reporting.
5. **Checking for duplicates before approving:** if you see two requests for the same room, date and requestor submitted within moments of each other, this is very likely an accidental double-submission — reject one of them rather than approving both, to avoid double-billing.

---

## 9. Procedure: Viewing Reports (Finance / Management)

1. Go to **Reports**. This page only ever reflects **Approved** requests — it's designed to be billing-ready.
2. Three summary cards are shown side by side:
   - **Today** — approved requests, rooms, refreshment revenue, lunch revenue and total revenue for today.
   - **This Week** — the same figures for the current week (Monday to today).
   - **Monthly Totals** — figures for a selected month. Use the dropdown next to "Monthly Totals" to switch to a previous month (only months that have approved data, plus the current month, are listed).
3. Below the summary cards:
   - **Weekly Revenue Trend** chart — a bar chart of the last 8 weeks, split into refreshments (orange) and lunch (purple), so you can see revenue trending up or down at a glance. Hover over any bar to see the exact split and total for that week.
   - **Daily Breakdown** chart — the same split, but per day, for whichever month is selected in the Monthly Totals dropdown.
4. **Exporting for billing:** click **⬇ Download CSV** on the Monthly Totals card to download a spreadsheet-ready CSV of every Approved request for the selected month (one row per request, with date, requestor, rooms, refreshment total, lunch details/cost, total cost, and who approved it).

---

## 10. Dashboard — daily overview

The **Dashboard** (home page) is the day-to-day operational snapshot, not a billing report — it includes requests of any status, not just Approved.

- Four tiles at the top show **today's** requests, rooms serviced, refreshments revenue and total revenue (all statuses, so this includes things not yet approved).
- The **Recent Requests** table below shows the 15 most recently submitted requests (any status, any date), with a link on the date and requestor name through to the full **Request Detail** page for that entry, where you can see the full room-by-room breakdown and approval history.
- Use **+ New Request** at the top right as a shortcut to the New Request form.

---

## 11. What the coloured status badges mean

| Badge colour | Status |
|---|---|
| 🟡 Amber | Submitted |
| 🔵 Cyan | Delivered |
| 🟢 Green | Approved |
| 🔴 Red | Rejected |

---

## 12. Troubleshooting / FAQ

**I see a red banner saying "Some data couldn't be loaded" — what do I do?**
This means the app couldn't reach the database for a moment. Refresh the page. If it keeps happening, contact whoever manages the app (the figures on screen may be incomplete until this clears).

**I accidentally clicked Submit twice on a new request — did it create two requests?**
The app is designed to catch this automatically and will not create a duplicate if the same request is submitted again within about 15 seconds. If you're ever unsure, check the Hospitality Queue for the request before re-submitting.

**I approved a request by mistake — can I undo it?**
There's no "unapprove" button in this version. Contact whoever manages the app to correct the record directly if this happens.

**A request is missing lunch information and I need to add it after delivery — is that allowed?**
Yes — use "No — add lunch" in the Hospitality Queue (Section 7, step 4) at any point before the request is approved.

**Where do I find a request I submitted last week?**
It won't be on the Dashboard's Recent Requests list if more than 15 requests have come in since. Ask whoever manages the app to look it up directly, or check the Reports page for the relevant week/month if it's already been approved.

**Who do I contact if something looks wrong (e.g. a wrong total, a stuck request)?**
Contact the app administrator (currently: Mark Graham).

---

## 13. Quick reference — field glossary

| Field | Meaning |
|---|---|
| Request Date | The date the room refreshments/lunch are needed for. |
| Requestor Name | Who from Customer Service raised the request. |
| Room List | The room number(s) covered by this single request. |
| Room Count | Auto-calculated from the Room List. |
| Refreshment Total | £3.40 × room count, unless Lunch required is ticked (then £0.00). |
| Lunch Required | Whether this request includes a lunch order. |
| Lunch Cost | The cost of the lunch order (entered manually). |
| Total | Refreshment Total + Lunch Cost. |
| Approved By | The Manager/Supervisor who approved the request. |
| Status | Submitted → Delivered → Approved (or Rejected). |

---

*This SOP reflects the app as of 2 July 2026. If the app changes (new fields, new pricing, new workflow), this document should be updated to match.*

# GMC Tracker V1

A simple hospitality charging capture app to replace the manual Excel process.

## V1 scope
- Customer Service submits room requests.
- Rooms are entered one per line.
- Standard setup charge: £3.40 per room.
- Lunch details/cost can be added.
- Hospitality marks requests as Delivered.
- Manager/Supervisor marks requests as Approved.
- Weekly/monthly reporting is generated from approved records.

## Setup
1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Copy `.env.example` to `.env.local` and add your Supabase URL and anon key.
4. Run:

```bash
npm install
npm run dev
```

## Pages
- `/` Dashboard
- `/new-request` Customer Service form
- `/queue` Hospitality queue and approval
- `/reports` Weekly/monthly reports

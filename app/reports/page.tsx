import { supabase } from '@/lib/supabase'
import { money } from '@/lib/calculations'
import MonthSelect from '@/app/components/MonthSelect'
import ErrorBanner from '@/app/components/ErrorBanner'
import RevenueChart, { RevenuePoint } from '@/app/components/RevenueChart'

export const dynamic = 'force-dynamic'

const WEEKS_OF_TREND = 8

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return toISODate(d)
}

function mondayOf(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`)
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return toISODate(d)
}

function weekLabel(mondayStr: string) {
  return new Date(`${mondayStr}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC'
  })
}

function dayLabel(dateStr: string) {
  return String(Number(dateStr.slice(8, 10)))
}

function currentMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function summarise(rows: any[]) {
  const requests = rows.length
  const rooms = rows.reduce((sum, r) => sum + Number(r.room_count || 0), 0)
  const refreshments = rows.reduce((sum, r) => sum + Number(r.refreshment_total || 0), 0)
  const lunches = rows.reduce((sum, r) => sum + Number(r.lunch_cost || 0), 0)
  return { requests, rooms, refreshments, lunches, total: refreshments + lunches }
}

function bucketByWeek(rows: any[], weeks: string[]): RevenuePoint[] {
  const totals = new Map(weeks.map((w) => [w, { refreshments: 0, lunches: 0 }]))
  for (const r of rows) {
    const key = mondayOf(r.request_date)
    const bucket = totals.get(key)
    if (bucket) {
      bucket.refreshments += Number(r.refreshment_total || 0)
      bucket.lunches += Number(r.lunch_cost || 0)
    }
  }
  return weeks.map((w) => ({ label: weekLabel(w), ...totals.get(w)! }))
}

function bucketByDay(rows: any[], days: string[]): RevenuePoint[] {
  const totals = new Map(days.map((d) => [d, { refreshments: 0, lunches: 0 }]))
  for (const r of rows) {
    const bucket = totals.get(r.request_date)
    if (bucket) {
      bucket.refreshments += Number(r.refreshment_total || 0)
      bucket.lunches += Number(r.lunch_cost || 0)
    }
  }
  return days.map((d) => ({ label: dayLabel(d), ...totals.get(d)! }))
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams
  const thisMonth = currentMonth()
  const selectedMonth = params.month || thisMonth

  const today = toISODate(new Date())
  const week = mondayOf(today)
  const { start, end } = monthRange(selectedMonth)
  const trendStart = addDays(week, -7 * (WEEKS_OF_TREND - 1))

  const [
    { data: todayRows, error: todayError },
    { data: weekRows, error: weekError },
    { data: monthRows, error: monthError },
    { data: trendRows, error: trendError },
    { data: approvedDates, error: datesError }
  ] = await Promise.all([
    supabase.from('gmc_requests').select('*').eq('status', 'Approved').eq('request_date', today),
    supabase.from('gmc_requests').select('*').eq('status', 'Approved').gte('request_date', week),
    supabase.from('gmc_requests').select('*').eq('status', 'Approved').gte('request_date', start).lt('request_date', end),
    supabase.from('gmc_requests').select('request_date, refreshment_total, lunch_cost').eq('status', 'Approved').gte('request_date', trendStart),
    supabase.from('gmc_requests').select('request_date').eq('status', 'Approved')
  ])

  const hasError = Boolean(todayError || weekError || monthError || trendError || datesError)

  const months = Array.from(
    new Set([thisMonth, ...(approvedDates || []).map((r) => r.request_date.slice(0, 7))])
  ).sort().reverse()

  const todayStats = summarise(todayRows || [])
  const weekly = summarise(weekRows || [])
  const monthly = summarise(monthRows || [])

  const weeks: string[] = []
  for (let i = 0; i < WEEKS_OF_TREND; i++) weeks.push(addDays(trendStart, i * 7))
  const weeklyTrend = bucketByWeek(trendRows || [], weeks)

  const monthDays: string[] = []
  for (let d = start; d < end; d = addDays(d, 1)) monthDays.push(d)
  const dailyBreakdown = bucketByDay(monthRows || [], monthDays)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="lead">Approved records only — ready for weekly and monthly billing.</p>
        </div>
      </div>

      {hasError && <ErrorBanner message="Some report data couldn't be loaded. Figures below may be incomplete — please refresh." />}

      <div className="grid">
        <div className="card">
          <h2>Today</h2>
          <table className="kv"><tbody>
            <tr><th>Requests</th><td>{todayStats.requests}</td></tr>
            <tr><th>Rooms serviced</th><td>{todayStats.rooms}</td></tr>
            <tr><th>Refreshment revenue</th><td>{money(todayStats.refreshments)}</td></tr>
            <tr><th>Lunch revenue</th><td>{money(todayStats.lunches)}</td></tr>
            <tr><th>Total revenue</th><td>{money(todayStats.total)}</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>This Week</h2>
          <table className="kv"><tbody>
            <tr><th>Requests</th><td>{weekly.requests}</td></tr>
            <tr><th>Rooms serviced</th><td>{weekly.rooms}</td></tr>
            <tr><th>Refreshment revenue</th><td>{money(weekly.refreshments)}</td></tr>
            <tr><th>Lunch revenue</th><td>{money(weekly.lunches)}</td></tr>
            <tr><th>Total revenue</th><td>{money(weekly.total)}</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <h2 style={{ marginBottom: 0 }}>Monthly Totals</h2>
            <MonthSelect months={months} selected={selectedMonth} />
          </div>
          <table className="kv"><tbody>
            <tr><th>Requests</th><td>{monthly.requests}</td></tr>
            <tr><th>Rooms serviced</th><td>{monthly.rooms}</td></tr>
            <tr><th>Refreshment revenue</th><td>{money(monthly.refreshments)}</td></tr>
            <tr><th>Lunch revenue</th><td>{money(monthly.lunches)}</td></tr>
            <tr><th>Total revenue</th><td>{money(monthly.total)}</td></tr>
          </tbody></table>
          <a className="btn btn-secondary btn-block" href={`/reports/export?month=${selectedMonth}`}>
            ⬇ Download CSV
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Weekly Revenue Trend</h2>
        <p className="hint" style={{ marginTop: -8 }}>Last {WEEKS_OF_TREND} weeks, refreshments vs lunch, approved records only.</p>
        <RevenueChart data={weeklyTrend} />
      </div>

      <div className="card">
        <h2>Daily Breakdown — {new Date(`${start}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</h2>
        <RevenueChart data={dailyBreakdown} />
      </div>
    </>
  )
}

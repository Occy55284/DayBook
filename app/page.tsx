import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { money, formatDateWithDay, toInitials } from '@/lib/calculations'
import StatusBadge from './components/StatusBadge'
import ErrorBanner from './components/ErrorBanner'

export const dynamic = 'force-dynamic'

function summarise(rows: any[]) {
  const requests = rows.length
  const rooms = rows.reduce((sum, r) => sum + Number(r.room_count || 0), 0)
  const refreshments = rows.reduce((sum, r) => sum + Number(r.refreshment_total || 0), 0)
  const lunches = rows.reduce((sum, r) => sum + Number(r.lunch_cost || 0), 0)
  return { requests, rooms, refreshments, lunches, total: refreshments + lunches }
}

export default async function Dashboard() {
  const today = new Date().toISOString().slice(0, 10)

  const { data: requests, error: recentError } = await supabase
    .from('gmc_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)

  const { data: todayRequests, error: todayError } = await supabase
    .from('gmc_requests')
    .select('room_count, refreshment_total, lunch_cost')
    .eq('request_date', today)

  const rows = requests || []
  const stats = summarise(todayRequests || [])

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="lead">Room refreshment capture, lunch costs, delivery status and approval reporting.</p>
        </div>
        <Link href="/new-request" className="btn">+ New Request</Link>
      </div>

      {(recentError || todayError) && (
        <ErrorBanner message="Some dashboard data couldn't be loaded. Please refresh, or check back shortly." />
      )}

      <div className="grid stats">
        <div className="stat stat-indigo">
          <span className="stat-icon">📋</span>
          <span className="stat-label">Today's requests</span>
          <span className="stat-value">{stats.requests}</span>
        </div>
        <div className="stat stat-cyan">
          <span className="stat-icon">🚪</span>
          <span className="stat-label">Rooms serviced today</span>
          <span className="stat-value">{stats.rooms}</span>
        </div>
        <div className="stat stat-amber">
          <span className="stat-icon">☕</span>
          <span className="stat-label">Today's refreshments</span>
          <span className="stat-value">{money(stats.refreshments)}</span>
        </div>
        <div className="stat stat-emerald">
          <span className="stat-icon">💷</span>
          <span className="stat-label">Today's revenue</span>
          <span className="stat-value">{money(stats.total)}</span>
        </div>
      </div>

      <div className="card">
        <h2>Recent Requests</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Requestor</th><th>Rooms</th><th>Status</th><th>Approved By</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="row-link">
                  <td>{formatDateWithDay(r.request_date)}</td>
                  <td title={r.requestor_name}>{toInitials(r.requestor_name)}</td>
                  <td>{r.room_count}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.approved_by || '—'}</td>
                  <td>{money(r.total_cost)}</td>
                  <td><Link href={`/requests/${r.id}`} className="btn secondary" style={{ padding: '4px 10px', fontSize: '13px' }}>View →</Link></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={7} className="empty">No requests yet. <Link href="/new-request">Create the first request</Link>.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

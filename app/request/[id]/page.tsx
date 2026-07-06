import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { money, toInitials } from '@/lib/calculations'
import StatusBadge from '@/app/components/StatusBadge'

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const { data } = await supabase
    .from('gmc_requests')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) notFound()

  const r = data

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Request Summary</h1>
          <p className="lead">{r.request_date} — {r.requestor_name}</p>
        </div>
        <Link href="/" className="btn secondary">← Back</Link>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Details</h2>
          <table className="kv"><tbody>
            <tr><th>Date</th><td>{r.request_date}</td></tr>
            <tr><th>Requestor</th><td>{r.requestor_name} <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>({toInitials(r.requestor_name)})</span></td></tr>
            <tr><th>WBS / Cost Centre</th><td>{r.wbs_code}</td></tr>
            <tr><th>Rooms</th><td>{r.room_count}</td></tr>
            <tr><th>Room list</th><td><pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>{r.room_list}</pre></td></tr>
            <tr><th>Refreshment cost</th><td>{money(r.refreshment_total)}</td></tr>
            <tr><th>Lunch required</th><td>{r.lunch_required ? 'Yes' : 'No'}</td></tr>
            {r.lunch_required && <>
              <tr><th>Lunch details</th><td>{r.lunch_details || '—'}</td></tr>
              <tr><th>Lunch cost</th><td>{money(r.lunch_cost)}</td></tr>
            </>}
            <tr><th>Total cost</th><td><strong>{money(r.total_cost)}</strong></td></tr>
            {r.notes && <tr><th>Notes</th><td>{r.notes}</td></tr>}
          </tbody></table>
        </div>

        <div className="card">
          <h2>Status</h2>
          <table className="kv"><tbody>
            <tr><th>Status</th><td><StatusBadge status={r.status} /></td></tr>
            <tr><th>Submitted</th><td>{new Date(r.created_at).toLocaleString('en-GB')}</td></tr>
            {r.status === 'Approved' && <>
              <tr><th>Approved by</th><td>{r.approved_by ? <><strong>{toInitials(r.approved_by)}</strong> <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>({r.approved_by})</span></> : '—'}</td></tr>
              <tr><th>Approved at</th><td>{r.approved_at ? new Date(r.approved_at).toLocaleString('en-GB') : '—'}</td></tr>
            </>}
            {r.status === 'Rejected' && <>
              <tr><th>Rejected by</th><td>{r.rejected_by ? <><strong>{toInitials(r.rejected_by)}</strong> <span style={{ color: 'var(--ink-soft)', fontSize: '13px' }}>({r.rejected_by})</span></> : '—'}</td></tr>
              <tr><th>Rejected at</th><td>{r.rejected_at ? new Date(r.rejected_at).toLocaleString('en-GB') : '—'}</td></tr>
            </>}
          </tbody></table>
        </div>
      </div>
    </>
  )
}

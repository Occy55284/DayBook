import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { money, ROOM_PRICE } from '@/lib/calculations'
import StatusBadge from '@/app/components/StatusBadge'

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { data: request } = await supabase
    .from('gmc_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (!request) notFound()

  const rooms = request.room_list
    .split('\n')
    .map((room: string) => room.trim())
    .filter(Boolean)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Request — {request.request_date}</h1>
          <p className="lead">{request.requestor_name}</p>
        </div>
        <Link href="/" className="btn btn-secondary">Back to Dashboard</Link>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Summary</h2>
          <table className="kv"><tbody>
            <tr><th>Status</th><td><StatusBadge status={request.status} /></td></tr>
            <tr><th>Requestor</th><td>{request.requestor_name}</td></tr>
            {request.status === 'Approved' && <>
              <tr><th>Approved by</th><td>{request.approved_by || '—'}</td></tr>
              <tr><th>Approved at</th><td>{request.approved_at ? new Date(request.approved_at).toLocaleString('en-GB') : '—'}</td></tr>
            </>}
            {request.status === 'Rejected' && <>
              <tr><th>Rejected by</th><td>{request.rejected_by || '—'}</td></tr>
              <tr><th>Rejected at</th><td>{request.rejected_at ? new Date(request.rejected_at).toLocaleString('en-GB') : '—'}</td></tr>
            </>}
            <tr><th>Notes</th><td>{request.notes || '—'}</td></tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>Costs</h2>
          <table className="kv"><tbody>
            <tr><th>Rooms</th><td>{request.room_count}</td></tr>
            <tr><th>Refreshment total</th><td>{money(request.refreshment_total)}</td></tr>
            <tr><th>Lunch required</th><td>{request.lunch_required ? 'Yes' : 'No'}</td></tr>
            {request.lunch_required && (
              <>
                <tr><th>Lunch details</th><td>{request.lunch_details || '—'}</td></tr>
                <tr><th>Lunch cost</th><td>{money(request.lunch_cost)}</td></tr>
              </>
            )}
            <tr><th>Total</th><td><strong>{money(request.total_cost)}</strong></td></tr>
          </tbody></table>
        </div>
      </div>

      <div className="card">
        <h2>Room breakdown</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Room</th><th>Setup charge</th></tr></thead>
            <tbody>
              {rooms.map((room: string, i: number) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{room}</td>
                  <td>{request.lunch_required ? money(0) : money(ROOM_PRICE)}</td>
                </tr>
              ))}
              {!rooms.length && <tr><td colSpan={3} className="empty">No rooms listed.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

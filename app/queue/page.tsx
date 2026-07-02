import { supabase } from '@/lib/supabase'
import { money } from '@/lib/calculations'
import { updateStatus, addLunch } from '@/app/actions'
import StatusBadge from '@/app/components/StatusBadge'
import ErrorBanner from '@/app/components/ErrorBanner'

export const dynamic = 'force-dynamic'

function submittedAt(value: string) {
  return new Date(value).toLocaleString('en-GB', { timeZone: 'Europe/London' })
}

export default async function QueuePage() {
  const { data, error } = await supabase
    .from('gmc_requests')
    .select('*')
    .not('status', 'in', '(Approved,Rejected)')
    .order('request_date', { ascending: true })
    .order('created_at', { ascending: true })

  const rows = data || []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Hospitality Queue</h1>
          <p className="lead">Mark requests as delivered, then approve them for reporting.</p>
        </div>
      </div>

      {error && <ErrorBanner message="Couldn't load the queue. Please refresh, or check back shortly." />}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th><th>Requestor</th><th>Rooms</th><th>Lunch</th><th>Total</th><th>Submitted</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.request_date}</td>
                  <td>{r.requestor_name}</td>
                  <td><pre>{r.room_list}</pre><strong>{r.room_count} rooms</strong></td>
                  <td>
                    {r.lunch_required ? (
                      <><div>{r.lunch_details}{r.lunch_time ? ` at ${r.lunch_time}` : ''}</div><strong>{money(r.lunch_cost)}</strong></>
                    ) : (
                      <details>
                        <summary className="hint" style={{ cursor: 'pointer' }}>No — add lunch</summary>
                        <form action={addLunch} style={{ marginTop: 10, minWidth: 200 }}>
                          <input type="hidden" name="id" value={r.id} />
                          <label htmlFor={`lunch_details_${r.id}`}>Lunch Details</label>
                          <textarea id={`lunch_details_${r.id}`} name="lunch_details" placeholder="Example: 6 x wraps, 2 x salads" />
                          <label htmlFor={`lunch_time_${r.id}`}>Time of Lunch</label>
                          <input id={`lunch_time_${r.id}`} type="time" name="lunch_time" />
                          <label htmlFor={`lunch_cost_${r.id}`}>Lunch Cost</label>
                          <input id={`lunch_cost_${r.id}`} type="number" step="0.01" min="0" name="lunch_cost" placeholder="0.00" required />
                          <button className="secondary" type="submit" style={{ marginTop: 10 }}>Add Lunch</button>
                        </form>
                      </details>
                    )}
                  </td>
                  <td>{money(r.total_cost)}</td>
                  <td>{submittedAt(r.created_at)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>
                    <div className="actions">
                      {r.status === 'Submitted' && (
                        <form action={updateStatus}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="status" value="Delivered" />
                          <button className="secondary" type="submit">Mark Delivered</button>
                        </form>
                      )}
                      {r.status === 'Delivered' && (
                        <>
                          <form action={updateStatus} className="actions">
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="Approved" />
                            <input name="approved_by" placeholder="Approved by" aria-label="Approved by" />
                            <button className="success" type="submit">Approve</button>
                          </form>
                          <form action={updateStatus}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="status" value="Rejected" />
                            <button className="danger" type="submit">Reject</button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} className="empty">No active requests.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

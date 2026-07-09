import { createRequest } from '@/app/actions'
import SubmitButton from '@/app/components/SubmitButton'

export default function NewRequestPage() {
  const today = new Date().toISOString().slice(0, 10)

  return (
    <>
      <div className="page-head">
        <div>
          <h1>New GMC Request</h1>
          <p className="lead">Submit a room refreshment request to the hospitality team.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <form action={createRequest}>
          <label htmlFor="request_date">Date</label>
          <input id="request_date" type="date" name="request_date" defaultValue={today} required />

          <label htmlFor="requestor_name">Requestor Initials — no surnames (GDPR)</label>
          <input
            id="requestor_name"
            name="requestor_name"
            placeholder="e.g. AB or Sarah"
            pattern="[^\s]+"
            title="First name or initials only — no spaces or surnames"
            required
          />

          <label htmlFor="room_list">Room List — one room per line</label>
          <textarea id="room_list" name="room_list" placeholder={`3.05\n3.07\n4.06`} required />
          <p className="hint">Each room is charged at the standard refreshment setup rate of £3.40, unless lunch is required.</p>

          <label className="check" htmlFor="lunch_required">
            <input id="lunch_required" type="checkbox" name="lunch_required" /> Lunch required? (no £3.40 refreshment charge if checked)
          </label>

          <label htmlFor="lunch_details">Lunch Details</label>
          <textarea id="lunch_details" name="lunch_details" placeholder="Example: 6 x wraps, 2 x salads" />

          <label htmlFor="lunch_time">Time of Lunch</label>
          <input id="lunch_time" type="time" name="lunch_time" />

          <label htmlFor="lunch_cost">Lunch Cost</label>
          <input id="lunch_cost" type="number" step="0.01" min="0" name="lunch_cost" placeholder="0.00" />

          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" placeholder="Optional notes" />

          <SubmitButton>Submit to Hospitality</SubmitButton>
        </form>
      </div>
    </>
  )
}

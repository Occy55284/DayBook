'use client'

import { useRouter } from 'next/navigation'

function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' })
}

export default function MonthSelect({ months, selected }: { months: string[]; selected: string }) {
  const router = useRouter()

  return (
    <select
      aria-label="Select month"
      value={selected}
      onChange={(e) => router.push(`/reports?month=${e.target.value}`)}
      style={{ width: 'auto' }}
    >
      {months.map((m) => (
        <option key={m} value={m}>{monthLabel(m)}</option>
      ))}
    </select>
  )
}

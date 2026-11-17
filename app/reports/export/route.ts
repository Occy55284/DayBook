import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const COLUMNS = [
  'request_date',
  'requestor_name',
  'room_list',
  'room_count',
  'refreshment_total',
  'lunch_required',
  'lunch_details',
  'lunch_time',
  'lunch_cost',
  'total_cost',
  'approved_by',
  'approved_at',
  'notes'
] as const

function csvCell(value: unknown): string {
  let str = value === null || value === undefined ? '' : String(value)
  // Neutralise leading formula characters so Excel/Sheets don't execute them.
  if (/^[=+\-@]/.test(str)) str = `'${str}`
  return `"${str.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 1)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get('month') || ''
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'Invalid or missing month parameter (expected YYYY-MM).' }, { status: 400 })
  }

  const { start, end } = monthRange(month)

  const { data, error } = await supabase
    .from('gmc_requests')
    .select(COLUMNS.join(','))
    .eq('status', 'Approved')
    .gte('request_date', start)
    .lt('request_date', end)
    .order('request_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = data || []
  const lines = [
    COLUMNS.join(','),
    ...rows.map((r: any) => COLUMNS.map((c) => csvCell(r[c])).join(','))
  ]

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gmc-approved-${month}.csv"`
    }
  })
}

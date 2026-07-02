'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { countRooms, refreshmentTotal } from '@/lib/calculations'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Resend's onboarding@resend.dev sender only delivers while no domain is verified, and
// rejects the whole send if any recipient besides the account owner's address is included.
// Restore the Accenture addresses here once a domain is verified in Resend.
const HOSPITALITY_NOTIFICATION_RECIPIENTS = [
  'grahammark55284@gmail.com'
]

async function notifyHospitality(payload: Record<string, any>) {
  if (!process.env.RESEND_API_KEY) return

  const submittedAt = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
  const lines = [
    `Date: ${payload.request_date}`,
    `Requestor: ${payload.requestor_name}`,
    `Rooms (${payload.room_count}): ${payload.room_list.replace(/\n/g, ', ')}`,
    `Refreshment total: £${payload.refreshment_total.toFixed(2)}`,
    payload.lunch_required
      ? `Lunch: ${payload.lunch_details || '-'} at ${payload.lunch_time || '-'} (£${payload.lunch_cost.toFixed(2)})`
      : 'Lunch: not required',
    `Submitted: ${submittedAt}`
  ]

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'GMC Tracker <onboarding@resend.dev>',
      to: HOSPITALITY_NOTIFICATION_RECIPIENTS,
      subject: `New GMC request: ${payload.requestor_name} (${payload.room_count} rooms)`,
      text: lines.join('\n')
    })
  })

  if (!response.ok) {
    console.error('Hospitality notification email failed', response.status, await response.text())
  }
}

export async function createRequest(formData: FormData) {
  const roomList = String(formData.get('room_list') || '')
  const lunchRequired = formData.get('lunch_required') === 'on'
  const lunchCost = Number(formData.get('lunch_cost') || 0)

  const payload = {
    request_date: String(formData.get('request_date') || ''),
    requestor_name: String(formData.get('requestor_name') || '').trim(),
    room_list: roomList.trim(),
    room_count: countRooms(roomList),
    refreshment_total: lunchRequired ? 0 : refreshmentTotal(roomList),
    lunch_required: lunchRequired,
    lunch_details: String(formData.get('lunch_details') || '').trim() || null,
    lunch_time: lunchRequired ? (String(formData.get('lunch_time') || '').trim() || null) : null,
    lunch_cost: lunchRequired ? lunchCost : 0,
    notes: String(formData.get('notes') || '').trim() || null,
    status: 'Submitted'
  }

  if (!payload.request_date || !payload.requestor_name || !payload.room_list) {
    throw new Error('Date, requestor and room list are required.')
  }

  const db = getSupabase()

  // Defense-in-depth against double-clicks, multiple tabs or network retries
  // submitting the same request twice: skip the insert if an identical one
  // was made moments ago, rather than creating a duplicate billable record.
  const dedupeSince = new Date(Date.now() - 15_000).toISOString()
  const { data: recentDuplicate } = await db
    .from('gmc_requests')
    .select('id')
    .eq('requestor_name', payload.requestor_name)
    .eq('room_list', payload.room_list)
    .eq('request_date', payload.request_date)
    .gte('created_at', dedupeSince)
    .limit(1)
    .maybeSingle()

  if (!recentDuplicate) {
    const { error } = await db.from('gmc_requests').insert(payload)
    if (error) throw new Error(error.message)

    await notifyHospitality(payload)
  }

  revalidatePath('/')
  revalidatePath('/queue')
  redirect('/queue')
}

export async function updateStatus(formData: FormData) {
  const id = String(formData.get('id'))
  const status = String(formData.get('status'))
  const approvedBy = String(formData.get('approved_by') || '').trim() || null

  const updates: Record<string, any> = { status }
  if (status === 'Approved') {
    updates.approved_by = approvedBy || 'Hospitality Manager / Supervisor'
    updates.approved_at = new Date().toISOString()
  }

  const { error } = await getSupabase().from('gmc_requests').update(updates).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/queue')
  revalidatePath('/reports')
}

export async function addLunch(formData: FormData) {
  const id = String(formData.get('id'))
  const lunchDetails = String(formData.get('lunch_details') || '').trim()
  const lunchTime = String(formData.get('lunch_time') || '').trim()
  const lunchCost = Number(formData.get('lunch_cost') || 0)

  const updates = {
    lunch_required: true,
    lunch_details: lunchDetails || null,
    lunch_time: lunchTime || null,
    lunch_cost: lunchCost,
    refreshment_total: 0
  }

  const { error } = await getSupabase().from('gmc_requests').update(updates).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/')
  revalidatePath('/queue')
  revalidatePath('/reports')
}

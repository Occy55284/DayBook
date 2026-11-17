const variants: Record<string, string> = {
  submitted: 'badge-submitted',
  delivered: 'badge-delivered',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
}

export default function StatusBadge({ status }: { status: string }) {
  const key = (status || '').toLowerCase()
  const variant = variants[key] || 'badge-submitted'
  return <span className={`badge ${variant}`}>{status}</span>
}

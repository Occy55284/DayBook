'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-block" disabled={pending} aria-disabled={pending}>
      {pending ? 'Submitting…' : children}
    </button>
  )
}

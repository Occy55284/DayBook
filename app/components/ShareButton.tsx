'use client'

import { useState } from 'react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = window.location.origin
    const shareData = { title: 'GMC Tracker', text: 'Hospitality charging capture and reporting', url }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled the share sheet, nothing to do
      }
      return
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" className="secondary share-btn" onClick={handleShare}>
      {copied ? 'Link copied!' : 'Share'}
    </button>
  )
}

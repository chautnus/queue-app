'use client'
import { useEffect, useState } from 'react'

interface QRDisplayProps {
  queueId: string
  qrType: string
  queueName: string
  logoUrl?: string
}

export default function QRDisplay({ queueId, qrType, queueName, logoUrl }: QRDisplayProps) {
  const [displayUrl, setDisplayUrl] = useState('')
  const [rawQrUrl, setRawQrUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const suffix = qrType === 'daily' ? `?date=${today}` : ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const joinUrl = `${origin}/q/${queueId}${suffix}`

  useEffect(() => {
    if (!origin) return
    fetch(`/api/queues/${queueId}/qr?type=${qrType}`)
      .then(r => r.json())
      .then(d => setRawQrUrl(d.qr))
      .catch(() => {})
  }, [queueId, qrType, origin])

  useEffect(() => {
    if (!rawQrUrl) return
    if (!logoUrl) { setDisplayUrl(rawQrUrl); return }

    const canvas = document.createElement('canvas')
    canvas.width = 400; canvas.height = 400
    const ctx = canvas.getContext('2d')!
    const qrImg = new Image()
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, 400, 400)
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      logo.onload = () => {
        const s = 80, x = 160, y = 160
        ctx.fillStyle = 'white'
        ctx.fillRect(x - 8, y - 8, s + 16, s + 16)
        ctx.drawImage(logo, x, y, s, s)
        setDisplayUrl(canvas.toDataURL('image/png'))
      }
      logo.onerror = () => setDisplayUrl(rawQrUrl)
      logo.src = logoUrl
    }
    qrImg.src = rawQrUrl
  }, [rawQrUrl, logoUrl])

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card text-center">
      <h3 className="font-semibold text-gray-900 mb-1">QR Code tham gia</h3>
      <p className="text-xs text-gray-400 mb-4">
        {qrType === 'daily' ? `Hôm nay: ${today}` : 'Cố định – không thay đổi'}
      </p>
      {displayUrl ? (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white border-2 border-gray-200 rounded-2xl shadow-sm">
            <img src={displayUrl} alt={`QR ${queueName}`} className="w-52 h-52" />
          </div>
        </div>
      ) : (
        <div className="w-52 h-52 mx-auto mb-4 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center text-gray-300">
          Đang tạo...
        </div>
      )}
      <div className="space-y-2">
        <button onClick={copyLink}
          className={`btn-secondary w-full justify-center text-sm ${copied ? 'text-green-600 border-green-300' : ''}`}>
          {copied ? '✓ Đã sao chép!' : '🔗 Sao chép liên kết'}
        </button>
        {displayUrl && (
          <a href={displayUrl} download={`qr-${queueName}.png`}
            className="btn-secondary w-full justify-center text-sm inline-flex">
            ⬇ Tải QR Code
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 break-all">{joinUrl}</p>
    </div>
  )
}

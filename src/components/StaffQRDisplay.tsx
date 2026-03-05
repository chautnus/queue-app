'use client'
import { useEffect, useState } from 'react'

interface StaffQRDisplayProps {
  queueId: string
  queueName: string
  logoUrl?: string
}

export default function StaffQRDisplay({ queueId, queueName, logoUrl }: StaffQRDisplayProps) {
  const [displayUrl, setDisplayUrl] = useState('')
  const [rawQrUrl, setRawQrUrl] = useState('')
  const [staffJoinUrl, setStaffJoinUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const origin = window.location.origin
    setStaffJoinUrl(`${origin}/staff/join/${queueId}`)
    fetch(`/api/queues/${queueId}/staff-qr`)
      .then(r => r.json())
      .then(d => setRawQrUrl(d.qr))
      .catch(() => {})
  }, [queueId])

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
    navigator.clipboard.writeText(staffJoinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card text-center">
      <h3 className="font-semibold text-gray-900 mb-1">QR Code nhân viên</h3>
      <p className="text-xs text-gray-400 mb-4">Nhân viên quét mã này để bắt đầu ca làm</p>
      {displayUrl ? (
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-white border-2 border-orange-200 rounded-2xl shadow-sm">
            <img src={displayUrl} alt={`QR nhân viên ${queueName}`} className="w-52 h-52" />
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
          <a href={displayUrl} download={`staff-qr-${queueName}.png`}
            className="btn-secondary w-full justify-center text-sm inline-flex">
            ⬇ Tải QR Code
          </a>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 break-all">{staffJoinUrl}</p>
    </div>
  )
}

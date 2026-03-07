'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'

export default function ProfilePage() {
  const t = useTranslations('profile')
  const [logo, setLogo] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/profile')
      .then(r => r.json())
      .then(d => { setLogo(d.logo); setName(d.name); setEmail(d.email) })
      .catch(() => {})
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true); setMessage(''); setError('')
    const formData = new FormData()
    formData.append('logo', file)

    const res = await fetch('/api/admin/logo', { method: 'POST', body: formData })
    const data = await res.json()
    if (res.ok) {
      setLogo(data.logo + '?t=' + Date.now())
      setMessage(t('uploadSuccess'))
    } else {
      setError(data.error || t('uploadError'))
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="max-w-lg space-y-6">
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">{t('accountInfo')}</h2>
          <div className="text-sm space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">{t('fullName')}</span>
              <span className="font-medium text-gray-900">{name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">{t('email')}</span>
              <span className="font-medium text-gray-900">{email}</span>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">{t('logoTitle')}</h2>
          <p className="text-sm text-gray-500">{t('logoDesc')}</p>

          <div className="flex items-center gap-4">
            {logo ? (
              <img src={logo} alt="Logo" className="w-24 h-24 rounded-2xl object-cover border-2 border-gray-200 shadow" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                {t('noLogo')}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {logo ? t('currentLogo') : t('noLogo')}
              </p>
              <p className="text-xs text-gray-400">{t('logoFormats')}</p>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload"
              className={`btn-primary cursor-pointer inline-flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? t('uploading') : (logo ? t('changeButton') : t('uploadButton'))}
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

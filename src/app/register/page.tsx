'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError(t('passwordMismatch')); return }
    if (form.password.length < 6) { setError(t('passwordTooShort')); return }
    setLoading(true); setError('')

    const res = await fetch('/api/admin/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || t('registerFailed')); setLoading(false); return }
    router.push('/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card w-full max-w-md">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🎫</div>
          <h1 className="text-2xl font-bold text-gray-900">{t('adminRegisterTitle')}</h1>
          <p className="text-gray-500 mt-1">{t('adminRegisterSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="form-label">{t('fullName')}</label>
            <input className="form-input" placeholder="Nguyễn Văn A"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">{t('email')}</label>
            <input type="email" className="form-input" placeholder="admin@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">{t('password')}</label>
            <input type="password" className="form-input" placeholder={t('passwordMin')}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">{t('confirmPassword')}</label>
            <input type="password" className="form-input" placeholder={t('confirmPasswordPlaceholder')}
              value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? t('registering') : t('registerButton')}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">{t('loginLink')}</Link>
        </p>
      </div>
    </div>
  )
}

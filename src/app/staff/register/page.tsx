'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StaffRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp'); return }
    if (form.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return }
    setLoading(true); setError('')

    const res = await fetch('/api/staff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Đăng ký thất bại'); setLoading(false); return }
    router.push('/staff/login?registered=1')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="card w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👷</div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo tài khoản nhân viên</h1>
          <p className="text-gray-500 mt-1">Đăng ký để bắt đầu phục vụ khách hàng</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <div>
            <label className="form-label">Họ tên</label>
            <input className="form-input" placeholder="Nguyễn Văn A"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" placeholder="nhanvien@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Mật khẩu</label>
            <input type="password" className="form-input" placeholder="Tối thiểu 6 ký tự"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Xác nhận mật khẩu</label>
            <input type="password" className="form-input" placeholder="Nhập lại mật khẩu"
              value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/staff/login" className="text-orange-600 font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  )
}

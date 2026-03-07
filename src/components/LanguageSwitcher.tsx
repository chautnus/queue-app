'use client'
import { useTransition, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [locale, setLocale] = useState('vi')

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)locale=([^;]*)/)
    setLocale(match?.[1] === 'en' ? 'en' : 'vi')
  }, [])

  const toggle = () => {
    const next = locale === 'vi' ? 'en' : 'vi'
    document.cookie = `locale=${next};path=/;max-age=31536000`
    setLocale(next)
    startTransition(() => router.refresh())
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="text-xs font-semibold px-2 py-1 rounded border border-current opacity-70 hover:opacity-100 transition-opacity disabled:opacity-40"
      title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      {locale === 'vi' ? 'EN' : 'VI'}
    </button>
  )
}

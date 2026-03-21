"use client";

import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="text-lg font-bold text-blue-600 flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill="#2563eb" />
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            QueueApp
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">About</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="mailto:support@queueapp.dev" className="hover:text-slate-900 transition-colors">Contact</Link>
            <LanguageSwitcher />
          </nav>
        </div>
        <div className="mt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} QueueApp. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

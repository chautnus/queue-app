"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function PrivacyPage() {
  const t = useTranslations("privacy");
  const tc = useTranslations("common");
  const tl = useTranslations("landing");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
              <rect width="28" height="28" rx="8" fill="#2563eb" />
              <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
            QueueApp
          </Link>
          <Link href="/" className="btn-ghost text-sm">
            &larr; {tc("back_to_home")}
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{t("title")}</h1>
          <p className="text-sm text-slate-400 mb-8">{t("last_updated")}: March 2026</p>

          <div className="card p-6 sm:p-8 space-y-8 text-slate-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">1. {t("section1_title")}</h2>
              <p>{t("section1_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">2. {t("section2_title")}</h2>
              <p>{t("section2_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">3. {t("section3_title")}</h2>
              <p>{t("section3_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">4. {t("section4_title")}</h2>
              <p>{t("section4_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">5. {t("section5_title")}</h2>
              <p>{t("section5_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">6. {t("section6_title")}</h2>
              <p>{t("section6_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">7. {t("section7_title")}</h2>
              <p>{t("section7_text")}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">8. {t("section8_title")}</h2>
              <p>
                {t("section8_text")}{" "}
                <a href="mailto:support@queueapp.dev" className="text-blue-600 hover:underline">
                  support@queueapp.dev
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/about" className="hover:text-slate-900 transition-colors">{tl("footer_about")}</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">{tl("footer_terms")}</Link>
            <Link href="/privacy" className="text-slate-900 font-medium">{tl("footer_privacy")}</Link>
            <Link href="mailto:support@queueapp.dev" className="hover:text-slate-900 transition-colors">{tl("footer_contact")}</Link>
          </nav>
          <span className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} QueueApp. {tc("all_rights")}
          </span>
        </div>
      </footer>
    </div>
  );
}

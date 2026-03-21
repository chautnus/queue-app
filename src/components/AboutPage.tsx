"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const t = useTranslations("about");
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">{t("title")}</h1>

          <div className="card p-6 sm:p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">{t("what_is_title")}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t("what_is_text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">{t("mission_title")}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t("mission_text")}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">{t("benefits_title")}</h2>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>{t("benefit_1")}</li>
                <li>{t("benefit_2")}</li>
                <li>{t("benefit_3")}</li>
                <li>{t("benefit_4")}</li>
                <li>{t("benefit_5")}</li>
                <li>{t("benefit_6")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">{t("contact_title")}</h2>
              <p className="text-slate-600 leading-relaxed">
                {t("contact_text")}
              </p>
              <p className="mt-2 text-slate-600">
                Email:{" "}
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
            <Link href="/about" className="text-slate-900 font-medium">{tl("footer_about")}</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">{tl("footer_terms")}</Link>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">{tl("footer_privacy")}</Link>
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

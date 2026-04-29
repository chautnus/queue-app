"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import PublicFooter from "@/components/PublicFooter";
import AdBanner from "@/components/AdBanner";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "FreeQueue",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "description": "Free queue management system for businesses. Let customers join queues via QR code and get real-time updates on their turn.",
  "url": "https://freequeue.app",
};

export default function LandingPage({ session }: { session: any }) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
            <div className="relative w-10 h-10 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M4 6H20M4 12H16M4 18H12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Free<span className="text-blue-600">Queue</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/announcements" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Announcements
            </Link>
            <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard/queues" className="inline-flex items-center justify-center bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg transition-all text-sm active:scale-95">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
                  {tc("login")}
                </Link>
                <Link href="/register" className="inline-flex items-center justify-center bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg hover:bg-slate-800 transition-all text-sm active:scale-95">
                  {tc("get_started")}
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-48 sm:pb-36 overflow-hidden">
        {/* Premium Background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero-bg.png" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/0 via-slate-50/20 to-slate-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest">Version 2.0 is live</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8">
            Manage your queue <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              without the wait.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 leading-relaxed mb-12">
            The modern way to handle customer flow. Let your customers join the queue from anywhere and get notified when it's their turn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard/queues"
                className="group relative inline-flex items-center justify-center bg-blue-600 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
              >
                Go to Dashboard
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center bg-blue-600 text-white font-bold px-10 py-4 rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
                >
                  Start for Free
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-white text-slate-900 font-bold px-10 py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all hover:-translate-y-1"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {t("how_it_works")}
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              {t("how_it_works_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {/* Step 1 */}
            <div className="relative text-center group">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-6xl font-black text-slate-100 select-none pointer-events-none">
                1
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("step1_title")}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t("step1_desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center group">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
                </svg>
              </div>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-6xl font-black text-slate-100 select-none pointer-events-none">
                2
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("step2_title")}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t("step2_desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center group">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 text-6xl font-black text-slate-100 select-none pointer-events-none">
                3
              </span>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("step3_title")}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {t("step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_LANDING ?? ""} />
      </div>

      {/* Features Grid */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {t("features_title")}
            </h2>
            <p className="mt-3 text-lg text-slate-500">
              {t("features_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Real-time Updates */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_realtime")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_realtime_desc")}
              </p>
            </div>

            {/* Multiple Services */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_multi_service")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_multi_service_desc")}
              </p>
            </div>

            {/* Display Board */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_display")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_display_desc")}
              </p>
            </div>

            {/* Analytics */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_analytics")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_analytics_desc")}
              </p>
            </div>

            {/* Push Notifications */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_notifications")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_notifications_desc")}
              </p>
            </div>

            {/* No App Required */}
            <div className="card p-6 hover:shadow-lg transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5">{t("feat_noapp")}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t("feat_noapp_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="card bg-gradient-to-br from-blue-600 to-indigo-700 border-0 p-10 sm:p-14 rounded-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              {t("ready_title")}
            </h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
              {t("ready_subtitle")}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center bg-white text-blue-700 font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all text-base"
            >
              {t("cta_start_today")}
              <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

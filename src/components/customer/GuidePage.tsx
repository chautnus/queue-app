"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import AdBanner from "@/components/AdBanner";

interface GuidePageProps {
  queue: {
    id: string;
    name: string;
    logoUrl: string | null;
    greeting: string | null;
  };
}

export default function GuidePage({ queue }: GuidePageProps) {
  const t = useTranslations("guide");

  const STEPS = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 4v1m6.364 1.636l-.707.707M20 12h-1M17.657 17.657l-.707-.707M12 20v-1m-5.657-1.636l.707-.707M4 12H3m2.343-5.657l.707.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: t("step1_title"),
      desc: t("step1_desc"),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: t("step2_title"),
      desc: t("step2_desc"),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
      title: t("step3_title"),
      desc: t("step3_desc"),
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      title: t("step4_title"),
      desc: t("step4_desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-3">
          {queue.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={queue.logoUrl}
              alt={queue.name}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-100"
            />
          ) : (
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xl">
                {queue.name[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{queue.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t("usage_title")}</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {STEPS.map((step, i) => (
          <div key={i} className="card p-5 flex gap-4 items-start">
            <div className="shrink-0 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {t("step_label", { n: i + 1 })}
                </span>
                <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}

        {/* Tips */}
        <div className="card p-5 bg-amber-50 border-amber-200">
          <h3 className="font-semibold text-amber-800 text-sm mb-2">{t("tip_title")}</h3>
          <ul className="text-sm text-amber-700 space-y-1.5">
            <li>{t("tip1")}</li>
            <li>{t("tip2")}</li>
            <li>{t("tip3")}</li>
          </ul>
        </div>

        {/* Back button */}
        <Link
          href={`/q/${queue.id}`}
          className="btn-primary w-full py-4 text-center block text-base font-semibold rounded-2xl"
        >
          {t("take_number")}
        </Link>

        {/* Ad Banner */}
        <div className="mt-4">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER ?? ""} />
        </div>
      </div>
    </div>
  );
}

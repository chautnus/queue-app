"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type QueueData = {
  id: string;
  name: string;
  status: string;
  logoUrl: string | null;
  streams: { _count: { counters: number }; id: string; name: string }[];
  _count: { tickets: number };
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("dashboard");

  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: t("status_active"),
    PAUSED: t("status_paused"),
    CLOSED: t("status_closed"),
    SCHEDULED: t("status_scheduled"),
  };

  if (status === "ACTIVE") {
    return (
      <span className="badge-green">
        <span className="live-dot" />
        {STATUS_LABEL[status] ?? status}
      </span>
    );
  }
  if (status === "PAUSED") {
    return <span className="badge-amber">{STATUS_LABEL[status] ?? status}</span>;
  }
  if (status === "SCHEDULED") {
    return <span className="badge-blue">{STATUS_LABEL[status] ?? status}</span>;
  }
  return <span className="badge-gray">{STATUS_LABEL[status] ?? status}</span>;
}

export default function QueuesList({ queues }: { queues: QueueData[] }) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("queues")}</h1>
        <Link
          href="/dashboard/queues/new"
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("create_queue")}
        </Link>
      </div>

      {queues.length === 0 ? (
        <div className="text-center py-16 card">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">{t("no_queues")}</h3>
          <p className="text-sm text-slate-500 mb-6">{t("create_first_queue")}</p>
          <Link
            href="/dashboard/queues/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            {t("create_queue")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {queues.map((queue) => (
            <div
              key={queue.id}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {queue.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={queue.logoUrl}
                      alt={queue.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden"); }}
                    />
                  ) : null}
                  <div className={`w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 ${queue.logoUrl ? "hidden" : ""}`}>
                    <span className="text-blue-600 font-bold text-base">
                      {queue.name[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{queue.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {queue.streams.length} {t("streams_count")} · {queue.streams.reduce((s, st) => s + st._count.counters, 0)} {t("counters_count")}
                    </p>
                  </div>
                </div>
                <StatusBadge status={queue.status} />
              </div>

              {/* Stats */}
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-slate-900">{queue._count.tickets}</span>
                <span className="text-sm text-slate-400">{t("tickets_count")}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <Link
                  href={`/dashboard/queues/${queue.id}`}
                  className="flex-1 text-center py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  {t("monitor")}
                </Link>
                <Link
                  href={`/dashboard/queues/${queue.id}/edit`}
                  className="flex-1 text-center py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {t("edit")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

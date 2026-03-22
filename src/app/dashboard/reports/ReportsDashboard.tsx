"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type Queue = { id: string; name: string };

type DailyReport = {
  summary: {
    total: number;
    completed: number;
    absent: number;
    waiting: number;
    avgWaitSeconds: number | null;
    avgServiceSeconds: number | null;
  };
  byStream: Array<{ streamId: string; streamName: string; total: number; completed: number; absent: number; avgServiceSeconds: number | null }>;
  byStaff: Array<{ name: string; served: number; totalServiceSeconds: number }>;
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ReportsDashboard({ queues }: { queues: Queue[] }) {
  const t = useTranslations("reports");
  const today = new Date().toISOString().slice(0, 10);
  const [queueId, setQueueId] = useState(queues[0]?.id ?? "");
  const [date, setDate] = useState(today);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!queueId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/reports/daily?queueId=${queueId}&date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setReport(d);
      })
      .catch(() => setError(t("load_error")))
      .finally(() => setLoading(false));
  }, [queueId, date]);

  const handleExportCSV = () => {
    const url = `/api/reports/customers?queueId=${queueId}&from=${date}&to=${date}`;
    window.open(url, "_blank");
  };

  if (queues.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-slate-400 text-sm">{t("no_queues")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">{t("heading")}</h1>
      {/* ── Filters ── */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700 whitespace-nowrap">{t("queue")}</label>
          <select
            value={queueId}
            onChange={(e) => setQueueId(e.target.value)}
            className="input py-2 w-auto"
          >
            {queues.map((q) => (
              <option key={q.id} value={q.id}>{q.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">{t("date")}</label>
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="input py-2 w-auto"
          />
        </div>
        <button onClick={handleExportCSV} className="btn-outline text-sm flex items-center gap-2 ml-auto">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t("export_csv")}
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="card p-4 border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      {/* ── Report ── */}
      {!loading && report && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: t("tickets_issued"), value: report.summary.total, accent: "text-slate-900" },
              { label: t("served"), value: report.summary.completed, accent: "text-green-600" },
              { label: t("absent"), value: report.summary.absent, accent: "text-amber-600" },
              { label: t("avg_wait"), value: formatDuration(report.summary.avgWaitSeconds ?? 0), accent: "text-blue-600" },
              { label: t("avg_service"), value: formatDuration(report.summary.avgServiceSeconds ?? 0), accent: "text-violet-600" },
            ].map((card) => (
              <div key={card.label} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${card.accent}`}>{card.value}</p>
                <p className="text-xs text-slate-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          {/* By staff */}
          {report.byStaff.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">{t("by_staff")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-4 font-medium text-slate-500">{t("staff_member")}</th>
                      <th className="text-right py-2 pr-4 font-medium text-slate-500">{t("served")}</th>
                      <th className="text-right py-2 font-medium text-slate-500">{t("avg_service")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byStaff.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-800">{row.name}</td>
                        <td className="py-3 pr-4 text-right text-slate-700">{row.served}</td>
                        <td className="py-3 text-right text-slate-500">{formatDuration(row.served > 0 ? Math.round(row.totalServiceSeconds / row.served) : 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By stream */}
          {report.byStream.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">{t("by_stream")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 pr-4 font-medium text-slate-500">{t("stream")}</th>
                      <th className="text-right py-2 pr-4 font-medium text-slate-500">{t("issued")}</th>
                      <th className="text-right py-2 pr-4 font-medium text-slate-500">{t("completed")}</th>
                      <th className="text-right py-2 pr-4 font-medium text-slate-500">{t("absent")}</th>
                      <th className="text-right py-2 font-medium text-slate-500">{t("avg_service")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byStream.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-800">{row.streamName}</td>
                        <td className="py-3 pr-4 text-right text-slate-700">{row.total}</td>
                        <td className="py-3 pr-4 text-right text-green-600">{row.completed}</td>
                        <td className="py-3 pr-4 text-right text-amber-600">{row.absent}</td>
                        <td className="py-3 text-right text-violet-600">{formatDuration(row.avgServiceSeconds ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.summary.total === 0 && (
            <div className="card p-10 text-center">
              <p className="text-slate-400 text-sm">{t("no_data")}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

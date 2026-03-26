"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

type StreamStats = {
  id: string;
  name: string;
  waiting: number;
  called: number;
  serving: number;
  total: number;
};

type SessionInfo = {
  id: string;
  staffName: string | null;
  counter: string;
  servedCount: number;
  startAt: string;
};

type OperatingHour = {
  day: number;
  open: string;
  close: string;
  enabled: boolean;
};

type Stats = {
  queue: { id: string; name: string; status: string; operatingHours?: OperatingHour[] | null };
  streams: StreamStats[];
  activeSessions: SessionInfo[];
  totalWaiting: number;
  totalServing: number;
  avgWaitSeconds?: number;
  avgServeSeconds?: number;
  todayServed?: number;
};

function formatOperatingHours(hours: OperatingHour[], dayNames: string[], noSchedule: string): string {
  const enabled = hours.filter((h) => h.enabled).sort((a, b) => a.day - b.day);
  if (enabled.length === 0) return noSchedule;

  // Group consecutive days with same hours
  const groups: { days: number[]; open: string; close: string }[] = [];
  for (const h of enabled) {
    const last = groups[groups.length - 1];
    if (last && last.open === h.open && last.close === h.close && last.days[last.days.length - 1] === h.day - 1) {
      last.days.push(h.day);
    } else {
      groups.push({ days: [h.day], open: h.open, close: h.close });
    }
  }

  return groups
    .map((g) => {
      const dayRange =
        g.days.length === 1
          ? dayNames[g.days[0]]
          : `${dayNames[g.days[0]]}-${dayNames[g.days[g.days.length - 1]]}`;
      return `${dayRange} ${g.open}-${g.close}`;
    })
    .join(", ");
}

export default function LiveMonitor({ queueId }: { queueId: string }) {
  const t = useTranslations("monitor");
  const [stats, setStats] = useState<Stats | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [staffQrUrl, setStaffQrUrl] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/queues/${queueId}/stats`);
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
    }
  }, [queueId]);

  useEffect(() => {
    fetchStats();
    setQrUrl(`/api/queues/${queueId}/qr`);
    setStaffQrUrl(`/api/queues/${queueId}/staff-qr`);

    const es = new EventSource(`/api/queues/${queueId}/sse`);
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
    es.onmessage = () => fetchStats();

    return () => es.close();
  }, [queueId, fetchStats]);

  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const toggleStatus = async (newStatus: string) => {
    setStatusLoading(true);
    const res = await fetch(`/api/queues/${queueId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) await fetchStats();
    setStatusLoading(false);
  };

  const totalToday = stats.streams.reduce((s, r) => s + r.total, 0);
  const queueStatus = stats.queue.status;

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900">{stats.queue.name}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            queueStatus === "ACTIVE" ? "bg-green-50 text-green-700" :
            queueStatus === "PAUSED" ? "bg-amber-50 text-amber-700" :
            queueStatus === "CLOSED" ? "bg-red-50 text-red-700" :
            "bg-slate-100 text-slate-500"
          }`}>
            {queueStatus === "ACTIVE" ? t("status_active") :
             queueStatus === "PAUSED" ? t("status_paused") :
             queueStatus === "CLOSED" ? t("status_closed") : t("status_inactive")}
          </span>
          {stats.queue.operatingHours && Array.isArray(stats.queue.operatingHours) && (
            <span className="text-xs text-slate-400 ml-2">
              {formatOperatingHours(
              stats.queue.operatingHours as OperatingHour[],
              [t("day_sun_short"), t("day_mon_short"), t("day_tue_short"), t("day_wed_short"), t("day_thu_short"), t("day_fri_short"), t("day_sat_short")],
              t("no_schedule")
            )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="live-dot" />
              {t("live")}
            </span>
          )}
          {queueStatus !== "ACTIVE" && (
            <button
              onClick={() => toggleStatus("ACTIVE")}
              disabled={statusLoading}
              className="text-xs py-2 px-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50"
            >
              {t("activate")}
            </button>
          )}
          {queueStatus === "ACTIVE" && (
            <button
              onClick={() => toggleStatus("PAUSED")}
              disabled={statusLoading}
              className="text-xs py-2 px-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50"
            >
              {t("pause")}
            </button>
          )}
          {queueStatus === "PAUSED" && (
            <button
              onClick={() => toggleStatus("CLOSED")}
              disabled={statusLoading}
              className="text-xs py-2 px-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 disabled:opacity-50"
            >
              {t("close")}
            </button>
          )}
          {qrUrl && (
            <a
              href={qrUrl}
              download="qr-khach-hang.png"
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              QR
            </a>
          )}
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t("waiting"), value: String(stats.totalWaiting), accent: "text-blue-600" },
          { label: t("serving"), value: String(stats.totalServing), accent: "text-green-600" },
          { label: t("staff"), value: String(stats.activeSessions.length), accent: "text-violet-600" },
          { label: t("today"), value: String(totalToday), accent: "text-slate-700" },
          { label: t("avg_wait"), value: stats.avgWaitSeconds ? `${Math.round(stats.avgWaitSeconds / 60)}m` : "—", accent: "text-amber-600" },
          { label: t("avg_serve"), value: stats.avgServeSeconds ? `${Math.round(stats.avgServeSeconds / 60)}m` : "—", accent: "text-teal-600" },
        ].map((card) => (
          <div key={card.label} className="card p-4 text-center">
            <p className={`text-3xl font-bold ${card.accent}`}>{card.value}</p>
            <p className="text-xs text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── Streams ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {stats.streams.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 text-sm">{s.name}</h3>
              <span className="text-xs text-slate-400">{t("total")}: {s.total}</span>
            </div>
            <div className="flex gap-3">
              {[
                { label: t("wait"), value: s.waiting, color: "text-blue-600" },
                { label: t("called"), value: s.called, color: "text-amber-600" },
                { label: t("serve"), value: s.serving, color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 text-center bg-slate-50 rounded-xl py-2">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Active staff ── */}
      {stats.activeSessions.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">{t("active_staff")}</h3>
          <div className="space-y-2">
            {stats.activeSessions.map((sess) => (
              <div key={sess.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {sess.staffName?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{sess.staffName ?? t("staff_member")}</p>
                    <p className="text-xs text-slate-400">{sess.counter}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{sess.servedCount}</p>
                  <p className="text-xs text-slate-400">{t("served")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QR Codes + Links ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {qrUrl && (
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("qr_customer")}</h3>
            <Image src={qrUrl} alt={t("qr_customer")} width={180} height={180} className="mx-auto rounded-xl" unoptimized />
            <div className="flex justify-center gap-3 mt-4">
              <a href={qrUrl} download="qr-customer.png" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                {t("download_png")}
              </a>
            </div>
            <div className="mt-3 p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">{t("direct_link")}:</p>
              <a
                href={`/q/${queueId}`}
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 font-mono break-all"
              >
                {typeof window !== "undefined" ? window.location.origin : ""}/q/{queueId}
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/q/${queueId}`)}
                className="mt-1 text-xs text-slate-500 hover:text-slate-700 underline"
              >
                {t("copy_link")}
              </button>
            </div>
          </div>
        )}
        {staffQrUrl && (
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">{t("qr_staff")}</h3>
            <Image src={staffQrUrl} alt={t("qr_staff")} width={180} height={180} className="mx-auto rounded-xl" unoptimized />
            <div className="flex justify-center gap-3 mt-4">
              <a href={staffQrUrl} download="qr-staff.png" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                {t("download_png")}
              </a>
            </div>
            <div className="mt-3 p-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">{t("direct_link")}:</p>
              <a
                href={`/staff/join/${queueId}`}
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-700 font-mono break-all"
              >
                {typeof window !== "undefined" ? window.location.origin : ""}/staff/join/{queueId}
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/staff/join/${queueId}`)}
                className="mt-1 text-xs text-slate-500 hover:text-slate-700 underline"
              >
                {t("copy_link")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Display Board Link ── */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{t("display_board")}</h3>
        <p className="text-xs text-slate-400 mb-3">{t("display_board_desc")}</p>
        <div className="flex items-center gap-3">
          <a
            href={`/display/${queueId}`}
            target="_blank"
            className="btn-primary text-xs py-2 px-4"
          >
            {t("open_display_board")}
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/display/${queueId}`)}
            className="btn-outline text-xs py-2 px-4"
          >
            {t("copy_link")}
          </button>
        </div>
      </div>
    </div>
  );
}

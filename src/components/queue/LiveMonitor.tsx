"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

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

type Stats = {
  queue: { id: string; name: string; status: string };
  streams: StreamStats[];
  activeSessions: SessionInfo[];
  totalWaiting: number;
  totalServing: number;
};

export default function LiveMonitor({ queueId }: { queueId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [staffQrUrl, setStaffQrUrl] = useState<string | null>(null);
  const [live, setLive] = useState(false);

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

  const totalToday = stats.streams.reduce((s, r) => s + r.total, 0);

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{stats.queue.name}</h1>
        <div className="flex items-center gap-4">
          {live && (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <span className="live-dot" />
              Trực tiếp
            </span>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Đang chờ", value: stats.totalWaiting, accent: "text-blue-600" },
          { label: "Đang phục vụ", value: stats.totalServing, accent: "text-green-600" },
          { label: "Nhân viên", value: stats.activeSessions.length, accent: "text-violet-600" },
          { label: "Hôm nay", value: totalToday, accent: "text-slate-700" },
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
              <span className="text-xs text-slate-400">Tổng: {s.total}</span>
            </div>
            <div className="flex gap-3">
              {[
                { label: "Chờ", value: s.waiting, color: "text-blue-600" },
                { label: "Gọi", value: s.called, color: "text-amber-600" },
                { label: "Phục vụ", value: s.serving, color: "text-green-600" },
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
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Nhân viên đang làm việc</h3>
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
                    <p className="text-sm font-medium text-slate-800">{sess.staffName ?? "Nhân viên"}</p>
                    <p className="text-xs text-slate-400">{sess.counter}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{sess.servedCount}</p>
                  <p className="text-xs text-slate-400">phục vụ</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── QR Codes ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {qrUrl && (
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">QR Khách hàng</h3>
            <Image src={qrUrl} alt="QR Khách hàng" width={180} height={180} className="mx-auto rounded-xl" unoptimized />
            <div className="flex justify-center gap-3 mt-4">
              <a href={qrUrl} download="qr-khach-hang.png" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                ↓ Tải PNG
              </a>
            </div>
          </div>
        )}
        {staffQrUrl && (
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">QR Nhân viên</h3>
            <Image src={staffQrUrl} alt="QR Nhân viên" width={180} height={180} className="mx-auto rounded-xl" unoptimized />
            <div className="flex justify-center gap-3 mt-4">
              <a href={staffQrUrl} download="qr-nhan-vien.png" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                ↓ Tải PNG
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    es.onmessage = () => fetchStats();

    return () => es.close();
  }, [queueId, fetchStats]);

  if (!stats) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Waiting", value: stats.totalWaiting, color: "blue" },
          { label: "Serving", value: stats.totalServing, color: "green" },
          { label: "Active Staff", value: stats.activeSessions.length, color: "purple" },
          {
            label: "Total Today",
            value: stats.streams.reduce((s, r) => s + r.total, 0),
            color: "gray",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Streams */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.streams.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">{s.name}</h3>
            <div className="flex gap-3">
              {[
                { label: "Waiting", value: s.waiting, color: "blue" },
                { label: "Called", value: s.called, color: "yellow" },
                { label: "Serving", value: s.serving, color: "green" },
              ].map((stat) => (
                <div key={stat.label} className="flex-1 text-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active staff */}
      {stats.activeSessions.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Active Staff</h3>
          <div className="space-y-2">
            {stats.activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{sess.staffName}</p>
                  <p className="text-sm text-gray-500">{sess.counter}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{sess.servedCount}</p>
                  <p className="text-xs text-gray-500">served</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Codes */}
      <div className="grid gap-4 sm:grid-cols-2">
        {qrUrl && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <h3 className="font-semibold text-gray-900 mb-3">Customer QR</h3>
            <Image
              src={qrUrl}
              alt="Customer QR Code"
              width={200}
              height={200}
              className="mx-auto"
              unoptimized
            />
            <a
              href={qrUrl}
              download="customer-qr.png"
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700"
            >
              Download ↓
            </a>
          </div>
        )}
        {staffQrUrl && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <h3 className="font-semibold text-gray-900 mb-3">Staff QR</h3>
            <Image
              src={staffQrUrl}
              alt="Staff QR Code"
              width={200}
              height={200}
              className="mx-auto"
              unoptimized
            />
            <a
              href={staffQrUrl}
              download="staff-qr.png"
              className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700"
            >
              Download ↓
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

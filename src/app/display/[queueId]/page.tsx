"use client";

import { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import AdBanner from "@/components/AdBanner";

type TicketInfo = {
  displayNumber: string;
  counterName: string;
};

type QueueStats = {
  totalWaiting: number;
  totalServing: number;
};

export default function DisplayBoardPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = use(params);
  const t = useTranslations("display");
  const [serving, setServing] = useState<TicketInfo[]>([]);
  const [queueName, setQueueName] = useState("Queue Display");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<QueueStats>({ totalWaiting: 0, totalServing: 0 });
  const [clock, setClock] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data + SSE
  useEffect(() => {
    const fetchStats = () => {
      fetch(`/api/queues/${queueId}/public-stats`)
        .then((r) => r.json())
        .then((data) => {
          if (data.stats?.queue?.name) setQueueName(data.stats.queue.name);
          if (data.stats?.queue?.logoUrl) setLogoUrl(data.stats.queue.logoUrl);
          if (data.stats) {
            setStats({
              totalWaiting: data.stats.totalWaiting ?? 0,
              totalServing: data.stats.totalServing ?? 0,
            });
          }
        })
        .catch(() => {});
    };

    fetchStats();
    // Refresh stats every 30s for accuracy
    const statsInterval = setInterval(fetchStats, 30000);

    const es = new EventSource(`/api/queues/${queueId}/sse`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "ticket:called") {
          setServing((prev) => {
            const exists = prev.find(
              (t) => t.counterName === event.data.counterName
            );
            if (exists) {
              return prev.map((t) =>
                t.counterName === event.data.counterName
                  ? { ...t, displayNumber: event.data.displayNumber }
                  : t
              );
            }
            return [
              ...prev,
              {
                displayNumber: event.data.displayNumber,
                counterName: event.data.counterName,
              },
            ];
          });
          // Decrement waiting when someone is called
          setStats((prev) => ({
            ...prev,
            totalWaiting: Math.max(0, prev.totalWaiting - 1),
          }));
        }
        if (event.type === "ticket:created") {
          setStats((prev) => ({
            ...prev,
            totalWaiting: prev.totalWaiting + 1,
          }));
        }
        if (event.type === "ticket:completed" || event.type === "ticket:absent") {
          setStats((prev) => ({
            ...prev,
            totalServing: Math.max(0, prev.totalServing - 1),
          }));
        }
      } catch {
        // ignore
      }
    };

    return () => {
      es.close();
      clearInterval(statsInterval);
    };
  }, [queueId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 text-white flex flex-col">
      {/* Header */}
      <div className="py-8 border-b border-white/10">
        <div className="flex items-center justify-center gap-4">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={queueName}
              className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : null}
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">{queueName}</h1>
            <p className="text-blue-200 text-lg mt-2 font-medium">{t("now_serving")}</p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex justify-center gap-8 py-4 bg-white/5 border-b border-white/10">
        <div className="text-center">
          <p className="text-3xl font-bold text-yellow-300">{stats.totalWaiting}</p>
          <p className="text-xs text-blue-200 uppercase tracking-wider mt-1">{t("waiting")}</p>
        </div>
        <div className="w-px bg-white/20" />
        <div className="text-center">
          <p className="text-3xl font-bold text-green-300">{serving.length}</p>
          <p className="text-xs text-blue-200 uppercase tracking-wider mt-1">{t("serving")}</p>
        </div>
      </div>

      {/* Main serving area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {serving.length === 0 ? (
          <div className="text-center text-blue-300">
            <div className="text-6xl mb-4 opacity-30">⏳</div>
            <p className="text-2xl font-light">{t("no_customers")}</p>
          </div>
        ) : (
          <div className="grid gap-6 w-full max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {serving.map((ticket) => (
              <div
                key={ticket.counterName}
                className="bg-white/10 rounded-3xl p-8 text-center backdrop-blur-sm border border-white/10 shadow-lg animate-[fadeIn_0.3s_ease-out]"
              >
                <p className="text-blue-200 text-sm font-medium mb-3 uppercase tracking-wider">
                  {ticket.counterName}
                </p>
                <p className="text-8xl font-black tracking-tight leading-none">
                  {ticket.displayNumber}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ad Banner */}
      <div className="px-4 py-2">
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_DISPLAY ?? ""} />
      </div>

      {/* Footer with clock */}
      <div className="text-center py-4 border-t border-white/10 bg-white/5">
        <p className="text-blue-200 text-lg font-mono">
          {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

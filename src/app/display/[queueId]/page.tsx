"use client";

import { useState, useEffect, use } from "react";

type TicketInfo = {
  displayNumber: string;
  counterName: string;
};

export default function DisplayBoardPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = use(params);
  const [serving, setServing] = useState<TicketInfo[]>([]);
  const [queueName, setQueueName] = useState("Queue Display");

  useEffect(() => {
    // Fetch initial stats (public endpoint — no auth required)
    fetch(`/api/queues/${queueId}/public-stats`)
      .then((r) => r.json())
      .then((data) => {
        if (data.stats?.queue?.name) setQueueName(data.stats.queue.name);
      });

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
        }
      } catch {
        // ignore
      }
    };

    return () => es.close();
  }, [queueId]);

  return (
    <div className="min-h-screen bg-blue-700 text-white flex flex-col">
      <div className="text-center py-8 border-b border-blue-600">
        <h1 className="text-3xl font-bold">{queueName}</h1>
        <p className="text-blue-200 mt-1">Now Serving</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {serving.length === 0 ? (
          <div className="text-center text-blue-300">
            <p className="text-2xl">Waiting for customers...</p>
          </div>
        ) : (
          <div className="grid gap-6 w-full max-w-4xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {serving.map((ticket) => (
              <div
                key={ticket.counterName}
                className="bg-white/10 rounded-3xl p-8 text-center backdrop-blur"
              >
                <p className="text-blue-200 text-sm mb-2">{ticket.counterName}</p>
                <p className="text-7xl font-black tracking-tight">
                  {ticket.displayNumber}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center py-4 text-blue-300 text-sm">
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}

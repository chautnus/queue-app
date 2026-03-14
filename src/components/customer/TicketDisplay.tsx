"use client";

import { useEffect, useRef } from "react";
import { formatWaitTime } from "@/lib/wait-time";

type TicketInfo = {
  id: string;
  displayNumber: string;
  verifyCode: string;
  streamName: string;
  status: string;
  waitingAhead: number;
  estimatedSeconds: number;
};

type Props = {
  ticket: TicketInfo;
  queueId: string;
  onRatingRequest: () => void;
};

export default function TicketDisplay({
  ticket,
  queueId,
  onRatingRequest,
}: Props) {
  const pushRequestedRef = useRef(false);

  useEffect(() => {
    // Request push notification permission once
    if (pushRequestedRef.current) return;
    pushRequestedRef.current = true;

    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          registerPush(ticket.id, queueId);
        }
      });
    } else if (Notification.permission === "granted") {
      registerPush(ticket.id, queueId);
    }
  }, [ticket.id, queueId]);

  // SSE: listen for this ticket being called
  useEffect(() => {
    const es = new EventSource(`/api/queues/${queueId}/sse`);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (
          event.type === "ticket:called" &&
          event.data.ticketId === ticket.id
        ) {
          onRatingRequest();
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => es.close();
  }, [queueId, ticket.id, onRatingRequest]);

  const statusColor =
    ticket.status === "WAITING"
      ? "text-blue-600"
      : ticket.status === "CALLED"
      ? "text-green-600"
      : ticket.status === "SERVING"
      ? "text-orange-600"
      : "text-gray-500";

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border-2 border-blue-200 p-8 text-center">
        <p className="text-sm font-medium text-gray-500 mb-1">{ticket.streamName}</p>

        <div className="ticket-number text-blue-700 my-4">
          {ticket.displayNumber}
        </div>

        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2 mb-4">
          <span className="text-sm text-gray-600">Verification code:</span>
          <span className="font-mono font-bold text-xl tracking-widest">
            {ticket.verifyCode}
          </span>
        </div>

        <p className={`text-sm font-medium ${statusColor}`}>
          {ticket.status === "WAITING" && "Waiting in queue"}
          {ticket.status === "CALLED" && "Please proceed to the counter!"}
          {ticket.status === "SERVING" && "Currently being served"}
          {ticket.status === "COMPLETED" && "Service completed"}
        </p>
      </div>

      {(ticket.status === "WAITING" || ticket.status === "CALLED") && (
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex gap-4 text-center">
            <div className="flex-1">
              <p className="text-2xl font-bold text-blue-700">
                {ticket.waitingAhead}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Ahead of you</p>
            </div>
            <div className="w-px bg-blue-200" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-blue-700">
                {formatWaitTime(ticket.estimatedSeconds)}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Est. wait</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-gray-400">
        Keep this page open to receive notifications when it&apos;s your turn.
      </p>
    </div>
  );
}

async function registerPush(ticketId: string, queueId: string) {
  try {
    const sw = await navigator.serviceWorker.ready;
    const keyRes = await fetch("/api/push/vapid-key");
    if (!keyRes.ok) return;

    const { publicKey } = await keyRes.json();

    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
    });

    const sub = subscription.toJSON();
    if (!sub.endpoint || !sub.keys) return;

    await fetch(`/api/tickets/${ticketId}/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queueId,
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      }),
    });
  } catch (err) {
    console.error("Push registration failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

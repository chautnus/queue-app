"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { formatWaitTime } from "@/lib/wait-time";
import AdBanner from "@/components/AdBanner";

type TicketInfo = {
  id: string;
  displayNumber: string;
  verifyCode: string;
  streamName: string;
  status: string;
  waitingAhead: number;
  estimatedSeconds: number;
  counterName?: string;
};

type Props = {
  ticket: TicketInfo;
  queueId: string;
  onRatingRequest: () => void;
};

export default function TicketDisplay({ ticket, queueId, onRatingRequest }: Props) {
  const t = useTranslations("customer");
  const pushRequestedRef = useRef(false);
  const [counterName, setCounterName] = useState<string | undefined>(ticket.counterName);

  useEffect(() => {
    if (pushRequestedRef.current) return;
    pushRequestedRef.current = true;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") registerPush(ticket.id, queueId);
      });
    } else if (Notification.permission === "granted") {
      registerPush(ticket.id, queueId);
    }
  }, [ticket.id, queueId]);

  useEffect(() => {
    const es = new EventSource(`/api/queues/${queueId}/sse`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "ticket:called" && event.data.ticketId === ticket.id) {
          if (event.data.counterName) {
            setCounterName(event.data.counterName);
          }
          onRatingRequest();
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [queueId, ticket.id, onRatingRequest]);

  const isCalled = ticket.status === "CALLED";
  const isServing = ticket.status === "SERVING";
  const isWaiting = ticket.status === "WAITING";

  return (
    <div className="space-y-4">
      {/* ── Ticket card ── */}
      <div className={`card p-8 text-center ${isCalled ? "border-green-300 bg-green-50" : ""}`}>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{ticket.streamName}</p>
        <p className="text-sm text-slate-500 mb-2">{t("your_number")}</p>

        <div className={`ticket-number my-3 ${isCalled ? "text-green-600" : "text-blue-600"}`}>
          {ticket.displayNumber}
        </div>

        {/* Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
          isCalled
            ? "bg-green-100 text-green-700"
            : isWaiting
            ? "bg-blue-50 text-blue-600"
            : "bg-slate-100 text-slate-500"
        }`}>
          {isCalled && <span className="live-dot bg-green-500" />}
          {isWaiting && <span className="w-2 h-2 rounded-full bg-blue-400" />}
          {ticket.status === "WAITING" ? t("waiting_in_queue") : ticket.status === "CALLED" ? t("your_turn") : ticket.status === "SERVING" ? t("being_served") : ticket.status === "COMPLETED" ? t("completed") : ticket.status}
        </div>

        {/* Counter name - shown when called or serving */}
        {(isCalled || isServing) && counterName && (
          <div className="mt-2 mb-2 px-4 py-3 bg-green-100 border border-green-200 rounded-2xl">
            <p className="text-lg font-bold text-green-800">
              {t("go_to_counter", { counter: counterName })}
            </p>
          </div>
        )}

        {/* Verify code */}
        <div className="mt-2">
          <p className="text-xs text-slate-400 mb-1">{t("verify_code")}</p>
          <span className="inline-block font-mono font-bold text-2xl tracking-[0.3em] bg-slate-100 px-4 py-2 rounded-xl text-slate-700">
            {ticket.verifyCode}
          </span>
        </div>
      </div>

      {/* ── Wait info ── */}
      {(isWaiting || isCalled) && (
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex gap-4 text-center">
            <div className="flex-1">
              <p className="text-2xl font-bold text-blue-700">{ticket.waitingAhead}</p>
              <p className="text-xs text-blue-500 mt-0.5">{t("waiting_ahead")}</p>
            </div>
            <div className="w-px bg-blue-200" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-blue-700">{formatWaitTime(ticket.estimatedSeconds)}</p>
              <p className="text-xs text-blue-500 mt-0.5">{t("estimated_wait_time")}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-slate-400">
        {t("keep_page_open")}
      </p>

      {/* Ad while waiting */}
      {(isWaiting || isCalled) && (
        <div className="mt-4">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER ?? ""} />
        </div>
      )}
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
      body: JSON.stringify({ queueId, endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }),
    });
  } catch (err) {
    console.error("Push registration failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

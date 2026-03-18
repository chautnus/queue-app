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

const STATUS_TEXT: Record<string, string> = {
  WAITING: "Đang chờ trong hàng",
  CALLED: "Đến lượt bạn! Vui lòng đến quầy.",
  SERVING: "Đang được phục vụ",
  COMPLETED: "Đã hoàn thành",
};

export default function TicketDisplay({ ticket, queueId, onRatingRequest }: Props) {
  const pushRequestedRef = useRef(false);

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
          onRatingRequest();
        }
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [queueId, ticket.id, onRatingRequest]);

  const isCalled = ticket.status === "CALLED";
  const isWaiting = ticket.status === "WAITING";

  return (
    <div className="space-y-4">
      {/* ── Ticket card ── */}
      <div className={`card p-8 text-center ${isCalled ? "border-green-300 bg-green-50" : ""}`}>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{ticket.streamName}</p>
        <p className="text-sm text-slate-500 mb-2">Số của bạn</p>

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
          {STATUS_TEXT[ticket.status] ?? ticket.status}
        </div>

        {/* Verify code */}
        <div className="mt-2">
          <p className="text-xs text-slate-400 mb-1">Mã xác nhận</p>
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
              <p className="text-xs text-blue-500 mt-0.5">người đang chờ trước</p>
            </div>
            <div className="w-px bg-blue-200" />
            <div className="flex-1">
              <p className="text-2xl font-bold text-blue-700">{formatWaitTime(ticket.estimatedSeconds)}</p>
              <p className="text-xs text-blue-500 mt-0.5">thời gian chờ ước tính</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-center text-slate-400">
        Giữ trang này mở để nhận thông báo khi đến lượt bạn
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

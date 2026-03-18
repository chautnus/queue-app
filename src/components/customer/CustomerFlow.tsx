"use client";

import { useState, useEffect } from "react";
import AdBanner from "./AdBanner";
import CaptchaVerify from "./CaptchaVerify";
import CustomerForm from "./CustomerForm";
import TicketDisplay from "./TicketDisplay";
import WaitInfo from "./WaitInfo";
import RatingPrompt from "./RatingPrompt";
import { getOrCreateDeviceId } from "@/lib/device";

type Stream = {
  id: string;
  name: string;
  waitingCount: number;
  avgProcessingSeconds: number;
};

type QueueData = {
  id: string;
  name: string;
  logoUrl: string | null;
  greeting: string | null;
  status: string;
  timezone: string;
  requireCustomerInfo: boolean;
  customFields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }> | null;
  redirectUrl: string | null;
  adBannerSlotId: string | null;
  streams: Stream[];
};

type TicketInfo = {
  id: string;
  displayNumber: string;
  verifyCode: string;
  streamName: string;
  status: string;
  waitingAhead: number;
  estimatedSeconds: number;
};

type FlowState =
  | "loading"
  | "info"
  | "captcha"
  | "form"
  | "joining"
  | "ticket"
  | "rating";

export default function CustomerFlow({ queue }: { queue: QueueData }) {
  const [state, setState] = useState<FlowState>("loading");
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [customerInfo, setCustomerInfo] = useState<Record<string, unknown>>({});
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string>(
    queue.streams[0]?.id ?? ""
  );
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    async function init() {
      const id = await getOrCreateDeviceId(queue.id);
      setDeviceId(id);
      const res = await fetch(`/api/queues/${queue.id}/join?deviceId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.ticket) {
        setTicket({ ...data.ticket, waitingAhead: 0, estimatedSeconds: 0 });
        setState("ticket");
      } else {
        setState("info");
      }
    }
    init();
  }, [queue.id]);

  const handleCaptchaComplete = (token: string) => {
    setCaptchaToken(token);
    if (queue.requireCustomerInfo && queue.customFields?.length) {
      setState("form");
    } else {
      handleJoin(token, {});
    }
  };

  const handleJoin = async (token: string, info: Record<string, unknown>) => {
    setState("joining");
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    const answer = decoded.op === "+" ? decoded.a + decoded.b : decoded.a - decoded.b;

    const res = await fetch(`/api/queues/${queue.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        streamId: selectedStreamId,
        customerInfo: info,
        captchaAnswer: answer,
        captchaToken: token,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setTicket(data.ticket);
      setState("ticket");
      if (queue.redirectUrl) window.open(queue.redirectUrl, "_blank", "noopener");
    } else {
      if (res.status === 409 && data.ticket) {
        setTicket(data.ticket);
        setState("ticket");
      } else {
        setState("info");
        alert(data.error || "Không thể lấy số");
      }
    }
  };

  // ── Loading ──
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Queue unavailable ──
  if (queue.status !== "ACTIVE" && state !== "ticket") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Hàng đợi chưa mở</h2>
          <p className="text-sm text-slate-500">
            {queue.status === "PAUSED" ? "Hàng đợi tạm dừng" : "Hàng đợi đã đóng"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-8 pb-6">
        <div className="max-w-md mx-auto flex flex-col items-center text-center gap-3">
          {queue.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={queue.logoUrl} alt={queue.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100" />
          ) : (
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">{queue.name[0].toUpperCase()}</span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{queue.name}</h1>
            {queue.greeting && <p className="text-sm text-slate-500 mt-0.5">{queue.greeting}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Ad banner */}
        {queue.adBannerSlotId && <AdBanner slotId={queue.adBannerSlotId} />}

        {/* ── Info state ── */}
        {state === "info" && (
          <>
            <WaitInfo streams={queue.streams} timezone={queue.timezone} />

            {queue.streams.length > 1 && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Chọn loại dịch vụ</p>
                <div className="space-y-2">
                  {queue.streams.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStreamId(s.id)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-colors ${
                        selectedStreamId === s.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900 text-sm">{s.name}</span>
                        <span className="text-xs text-slate-400">{s.waitingCount} đang chờ</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setState("captcha")}
              className="btn-primary w-full py-4 text-base font-semibold rounded-2xl"
            >
              Lấy số
            </button>
          </>
        )}

        {/* ── Captcha ── */}
        {state === "captcha" && (
          <CaptchaVerify onComplete={handleCaptchaComplete} onBack={() => setState("info")} />
        )}

        {/* ── Form ── */}
        {state === "form" && (
          <CustomerForm
            fields={queue.customFields ?? []}
            onSubmit={(info) => { setCustomerInfo(info); handleJoin(captchaToken, info); }}
            onBack={() => setState("captcha")}
          />
        )}

        {/* ── Joining ── */}
        {state === "joining" && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Đang lấy số...</p>
          </div>
        )}

        {/* ── Ticket ── */}
        {state === "ticket" && ticket && (
          <>
            <TicketDisplay ticket={ticket} queueId={queue.id} onRatingRequest={() => setShowRating(true)} />
            {showRating && <RatingPrompt ticketId={ticket.id} onDone={() => setShowRating(false)} />}
          </>
        )}
      </div>

      {/* Suppress unused warning */}
      {customerInfo && null}
    </div>
  );
}

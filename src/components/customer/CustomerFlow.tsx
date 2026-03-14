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

      // Check if device already has an active ticket
      const res = await fetch(
        `/api/queues/${queue.id}/join?deviceId=${encodeURIComponent(id)}`
      );
      const data = await res.json();

      if (data.ticket) {
        setTicket({
          ...data.ticket,
          waitingAhead: 0,
          estimatedSeconds: 0,
        });
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

  const handleJoin = async (
    token: string,
    info: Record<string, unknown>
  ) => {
    setState("joining");

    // Extract captcha answer from token
    const decoded = JSON.parse(
      Buffer.from(token, "base64url").toString("utf-8")
    );
    const answer =
      decoded.op === "+" ? decoded.a + decoded.b : decoded.a - decoded.b;

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

      // Open redirect URL in new tab if configured
      if (queue.redirectUrl) {
        window.open(queue.redirectUrl, "_blank", "noopener");
      }
    } else {
      if (res.status === 409 && data.ticket) {
        setTicket(data.ticket);
        setState("ticket");
      } else {
        setState("info");
        alert(data.error || "Failed to join queue");
      }
    }
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (queue.status !== "ACTIVE" && state !== "ticket") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Queue Unavailable</h2>
          <p className="text-gray-500">This queue is currently {queue.status.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-6 text-white">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {queue.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={queue.logoUrl}
              alt={queue.name}
              className="w-12 h-12 rounded-xl object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {queue.name[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{queue.name}</h1>
            {queue.greeting && (
              <p className="text-blue-100 text-sm">{queue.greeting}</p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Ad banner */}
        {queue.adBannerSlotId && <AdBanner slotId={queue.adBannerSlotId} />}

        {/* State machine */}
        {state === "info" && (
          <>
            <WaitInfo streams={queue.streams} timezone={queue.timezone} />

            {/* Stream selector (if multiple) */}
            {queue.streams.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select service type
                </label>
                <div className="space-y-2">
                  {queue.streams.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStreamId(s.id)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-colors ${
                        selectedStreamId === s.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-sm text-gray-500">
                        {s.waitingCount} waiting
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setState("captcha")}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl text-lg hover:bg-blue-700 transition-colors"
            >
              Join Queue
            </button>
          </>
        )}

        {state === "captcha" && (
          <CaptchaVerify
            onComplete={handleCaptchaComplete}
            onBack={() => setState("info")}
          />
        )}

        {state === "form" && (
          <CustomerForm
            fields={queue.customFields ?? []}
            onSubmit={(info) => {
              setCustomerInfo(info);
              handleJoin(captchaToken, info);
            }}
            onBack={() => setState("captcha")}
          />
        )}

        {state === "joining" && (
          <div className="flex flex-col items-center py-12 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600">Getting your ticket...</p>
          </div>
        )}

        {state === "ticket" && ticket && (
          <>
            <TicketDisplay
              ticket={ticket}
              queueId={queue.id}
              onRatingRequest={() => setShowRating(true)}
            />
            {showRating && (
              <RatingPrompt
                ticketId={ticket.id}
                onDone={() => setShowRating(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

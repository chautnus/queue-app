"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type TicketInfo = {
  id: string;
  displayNumber: string;
  streamName: string;
  streamId?: string | null;
  verifyCode?: string;
  status: string;
};

type StreamOption = {
  id: string;
  name: string;
};

type Props = {
  sessionId: string;
  counterName: string;
  queueName: string;
  queueId: string;
  initialStatus: string;
  initialServedCount: number;
  streamAssignMode?: string;
  streams?: StreamOption[];
};

export default function WorkScreen({
  sessionId,
  counterName,
  queueName,
  queueId,
  initialStatus,
  initialServedCount,
  streamAssignMode,
  streams = [],
}: Props) {
  const router = useRouter();
  const t = useTranslations("staff");
  const [status, setStatus] = useState(initialStatus);
  const [servedCount, setServedCount] = useState(initialServedCount);
  const [currentTicket, setCurrentTicket] = useState<TicketInfo | null>(null);
  const [inputNumber, setInputNumber] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [assignStreamId, setAssignStreamId] = useState<string>(streams[0]?.id ?? "");

  const isPaused = status === "PAUSED";
  const isStaffAssign = streamAssignMode === "STAFF_ASSIGN";

  // SSE for session updates
  useEffect(() => {
    const es = new EventSource(`/api/staff/sse/${sessionId}`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "ticket:called") setCurrentTicket(event.data);
      } catch { /* ignore */ }
    };
    return () => es.close();
  }, [sessionId]);

  const showMsg = (text: string, ok: boolean) => {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 2500);
  };

  const callNext = async () => {
    setLoading(true);
    const res = await fetch(`/api/staff/session/${sessionId}/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isStaffAssign && assignStreamId ? { assignStreamId } : {}),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrentTicket(data.ticket ?? null);
      if (!data.ticket) showMsg(t("no_waiting"), true);
    } else {
      showMsg(data.error ?? t("invalid_ticket"), false);
    }
    setLoading(false);
  };

  const acceptTicket = async () => {
    if (!inputNumber || !inputCode) return;
    setLoading(true);
    const res = await fetch(`/api/staff/session/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayNumber: inputNumber.toUpperCase(), verifyCode: inputCode }),
    });
    const data = await res.json();
    if (res.ok) {
      setServedCount((c) => c + 1);
      setInputNumber("");
      setInputCode("");
      setShowManual(false);
      showMsg(t("accepted"), true);
    } else {
      showMsg(data.error ?? t("invalid_ticket"), false);
    }
    setLoading(false);
  };

  const markAbsent = async () => {
    setLoading(true);
    await fetch(`/api/staff/session/${sessionId}/absent`, { method: "POST" });
    setCurrentTicket(null);
    setLoading(false);
  };

  const togglePause = async () => {
    const res = await fetch(`/api/staff/session/${sessionId}/pause`, { method: "POST" });
    if (res.ok) { const data = await res.json(); setStatus(data.session.status); }
  };

  const endSession = async () => {
    if (!confirm(t("end_confirm"))) return;
    await fetch(`/api/staff/session/${sessionId}/end`, { method: "POST" });
    router.push("/staff");
  };

  // Suppress unused warning
  void queueId;

  return (
    <div className={`min-h-screen flex flex-col ${isPaused ? "bg-amber-50" : "bg-slate-50"}`}>
      {/* ── Paused banner ── */}
      {isPaused && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-800">⏸ {t("paused_banner")}</p>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div>
            <h1 className="font-bold text-slate-900">{counterName}</h1>
            <p className="text-xs text-slate-400">{queueName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">{servedCount}</p>
            <p className="text-xs text-slate-400">{t("served")}</p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">

        {/* Current ticket */}
        <div className={`card p-8 text-center ${currentTicket ? "" : "border-dashed"}`}>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            {t("now_serving")}
          </p>
          {currentTicket ? (
            <>
              <div className="ticket-number text-slate-900">{currentTicket.displayNumber}</div>
              {currentTicket.verifyCode && (
                <p className="text-lg font-mono font-semibold text-slate-500 mt-1 tracking-widest">
                  {currentTicket.verifyCode}
                </p>
              )}
              <p className="text-sm text-slate-400 mt-2">
                {currentTicket.streamName || (
                  <span className="text-amber-600 font-medium">{t("unassigned_ticket")}</span>
                )}
              </p>
            </>
          ) : (
            <p className="text-3xl text-slate-200 font-light py-6">—</p>
          )}
        </div>

        {/* Message feedback */}
        {message && (
          <div className={`p-3 rounded-xl text-center text-sm font-medium ${
            message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {message.text}
          </div>
        )}

        {/* Actions */}
        {!isPaused && (
          <div className="space-y-3">
            {/* Stream assignment selector for STAFF_ASSIGN mode */}
            {isStaffAssign && streams.length > 0 && (
              <div className="card p-4">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  {t("assign_stream")}
                </label>
                <select
                  value={assignStreamId}
                  onChange={(e) => setAssignStreamId(e.target.value)}
                  className="input w-full"
                >
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Call next */}
            <button
              onClick={callNext}
              disabled={loading}
              className="w-full py-5 bg-blue-600 text-white font-bold text-xl rounded-2xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
            >
              {loading ? t("calling") : t("call_next")}
            </button>

            {/* Secondary: absent + manual */}
            <div className="flex gap-3">
              {currentTicket && (
                <button
                  onClick={markAbsent}
                  disabled={loading}
                  className="flex-1 py-3 border border-amber-200 bg-amber-50 text-amber-700 font-medium rounded-xl hover:bg-amber-100 transition-colors text-sm"
                >
                  {t("absent")}
                </button>
              )}
              <button
                onClick={() => setShowManual((v) => !v)}
                className="flex-1 py-3 btn-outline text-sm"
              >
                {showManual ? t("hide") : t("enter_code")}
              </button>
            </div>

            {/* Manual entry */}
            {showManual && (
              <div className="card p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700">{t("manual_entry")}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputNumber}
                    onChange={(e) => setInputNumber(e.target.value.toUpperCase())}
                    placeholder={t("ticket_number")}
                    className="flex-1 input text-center font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    maxLength={4}
                    placeholder={t("code")}
                    className="w-20 input text-center font-mono font-bold"
                  />
                </div>
                <button
                  onClick={acceptTicket}
                  disabled={loading || !inputNumber || inputCode.length !== 4}
                  className="w-full py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-40 text-sm"
                >
                  {t("accept")}
                </button>
              </div>
            )}
          </div>
        )}

        {isPaused && (
          <button
            onClick={togglePause}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 text-lg"
          >
            {t("resume")}
          </button>
        )}
      </div>

      {/* ── Footer controls ── */}
      <div className="px-4 pb-6 max-w-md mx-auto w-full">
        <div className="flex gap-3">
          {!isPaused && (
            <button
              onClick={togglePause}
              className="flex-1 py-3 btn-amber text-sm"
            >
              {t("pause")}
            </button>
          )}
          <button
            onClick={endSession}
            className="flex-1 py-3 btn-danger border border-red-100 rounded-xl text-sm"
          >
            {t("end_session")}
          </button>
        </div>
      </div>
    </div>
  );
}

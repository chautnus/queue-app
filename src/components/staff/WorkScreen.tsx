"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useWorkScreenActions } from "./useWorkScreenActions";
import WorkActions from "./WorkActions";
import WorkFooter from "./WorkFooter";
import StaffCreateTicketPanel from "./StaffCreateTicketPanel";
import StaffReassignPanel from "./StaffReassignPanel";

type TicketInfo = {
  id: string;
  displayNumber: string;
  streamName: string;
  streamId?: string | null;
  verifyCode?: string;
  status: string;
};

type StreamOption = { id: string; name: string };

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
  void queueId;
  const t = useTranslations("staff");
  const [status, setStatus] = useState(initialStatus);
  const [servedCount, setServedCount] = useState(initialServedCount);
  const [currentTicket, setCurrentTicket] = useState<TicketInfo | null>(null);
  const [inputNumber, setInputNumber] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [assignStreamId, setAssignStreamId] = useState<string>(streams[0]?.id ?? "");

  const isPaused = status === "PAUSED";
  const isStaffAssign = streamAssignMode === "STAFF_ASSIGN";

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

  const actions = useWorkScreenActions({
    sessionId, isStaffAssign, assignStreamId,
    inputNumber, inputCode,
    setCurrentTicket, setServedCount,
    setInputNumber, setInputCode,
    setShowManual, setStatus,
  });

  return (
    <div className={`min-h-screen flex flex-col ${isPaused ? "bg-amber-50" : "bg-slate-50"}`}>
      {isPaused && (
        <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-800">⏸ {t("paused_banner")}</p>
        </div>
      )}

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

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-4">
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

        {actions.message && (
          <div className={`p-3 rounded-xl text-center text-sm font-medium ${
            actions.message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {actions.message.text}
          </div>
        )}

        {!isPaused && (
          <WorkActions
            isStaffAssign={isStaffAssign}
            streams={streams}
            assignStreamId={assignStreamId}
            setAssignStreamId={setAssignStreamId}
            currentTicket={currentTicket}
            inputNumber={inputNumber}
            setInputNumber={setInputNumber}
            inputCode={inputCode}
            setInputCode={setInputCode}
            showManual={showManual}
            toggleShowManual={() => setShowManual((v) => !v)}
            loading={actions.loading}
            onCallNext={actions.callNext}
            onMarkAbsent={actions.markAbsent}
            onAcceptTicket={actions.acceptTicket}
            onCreateTicket={() => { setShowCreateTicket(true); setShowReassign(false); }}
            onReassign={() => { setShowReassign(true); setShowCreateTicket(false); }}
          />
        )}

        {showCreateTicket && (
          <StaffCreateTicketPanel
            sessionId={sessionId}
            streams={streams}
            onClose={() => setShowCreateTicket(false)}
            onCreated={() => setShowCreateTicket(false)}
          />
        )}

        {showReassign && currentTicket && (
          <StaffReassignPanel
            sessionId={sessionId}
            currentTicket={currentTicket}
            onClose={() => setShowReassign(false)}
            onReassigned={(counterName) => {
              actions.showMsg(`Đã chuyển → ${counterName}`, true);
              setCurrentTicket(null);
            }}
          />
        )}

        {isPaused && (
          <button
            onClick={actions.togglePause}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 text-lg"
          >
            {t("resume")}
          </button>
        )}
      </div>

      <WorkFooter
        isPaused={isPaused}
        onTogglePause={actions.togglePause}
        onEndSession={actions.endSession}
      />
    </div>
  );
}

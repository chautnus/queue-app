"use client";

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
  isStaffAssign: boolean;
  streams: StreamOption[];
  assignStreamId: string;
  setAssignStreamId: (v: string) => void;
  currentTicket: TicketInfo | null;
  inputNumber: string;
  setInputNumber: (v: string) => void;
  inputCode: string;
  setInputCode: (v: string) => void;
  showManual: boolean;
  toggleShowManual: () => void;
  loading: boolean;
  onCallNext: () => void;
  onMarkAbsent: () => void;
  onAcceptTicket: () => void;
  onCreateTicket: () => void;
  onReassign: () => void;
};

export default function WorkActions({
  isStaffAssign,
  streams,
  assignStreamId,
  setAssignStreamId,
  currentTicket,
  inputNumber,
  setInputNumber,
  inputCode,
  setInputCode,
  showManual,
  toggleShowManual,
  loading,
  onCallNext,
  onMarkAbsent,
  onAcceptTicket,
  onCreateTicket,
  onReassign,
}: Props) {
  const t = useTranslations("staff");

  return (
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
        onClick={onCallNext}
        disabled={loading}
        className="w-full py-5 bg-blue-600 text-white font-bold text-xl rounded-2xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm shadow-blue-200"
      >
        {loading ? t("calling") : t("call_next")}
      </button>

      {/* Secondary: absent + manual entry toggle */}
      <div className="flex gap-3">
        {currentTicket && (
          <button
            onClick={onMarkAbsent}
            disabled={loading}
            className="flex-1 py-3 border border-amber-200 bg-amber-50 text-amber-700 font-medium rounded-xl hover:bg-amber-100 transition-colors text-sm"
          >
            {t("absent")}
          </button>
        )}
        <button onClick={toggleShowManual} className="flex-1 py-3 btn-outline text-sm">
          {showManual ? t("hide") : t("enter_code")}
        </button>
      </div>

      {/* Tertiary: create ticket + reassign counter */}
      <div className="flex gap-3">
        <button onClick={onCreateTicket} className="flex-1 py-3 btn-outline text-sm">
          {t("create_ticket")}
        </button>
        <button
          onClick={onReassign}
          disabled={!currentTicket || !["CALLED", "SERVING"].includes(currentTicket.status)}
          className="flex-1 py-3 btn-outline text-sm disabled:opacity-40"
        >
          {t("reassign_ticket")}
        </button>
      </div>

      {/* Manual entry panel */}
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
            onClick={onAcceptTicket}
            disabled={loading || !inputNumber || inputCode.length !== 4}
            className="w-full py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-40 text-sm"
          >
            {t("accept")}
          </button>
        </div>
      )}
    </div>
  );
}

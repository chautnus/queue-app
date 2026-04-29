"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type StreamOption = { id: string; name: string };

type CreatedTicket = {
  id: string;
  displayNumber: string;
  streamName?: string;
};

type Props = {
  sessionId: string;
  streams: StreamOption[];
  onClose: () => void;
  onCreated: (ticket: CreatedTicket) => void;
};

export default function StaffCreateTicketPanel({ sessionId, streams, onClose, onCreated }: Props) {
  const t = useTranslations("staff");
  const [streamId, setStreamId] = useState<string>(streams[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedTicket | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/session/${sessionId}/create-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId: streamId || null,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create ticket");
        return;
      }
      const ticket = data.data ?? data;
      setCreated({ id: ticket.id, displayNumber: ticket.displayNumber, streamName: ticket.streamName });
      onCreated({ id: ticket.id, displayNumber: ticket.displayNumber, streamName: ticket.streamName });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setCreated(null);
    setCustomerName("");
    setCustomerPhone("");
    setError(null);
  };

  if (created) {
    return (
      <div className="card p-6 space-y-4 text-center">
        <p className="text-sm font-medium text-green-600">{t("create_ticket_success")}</p>
        <div className="ticket-number text-slate-900">{created.displayNumber}</div>
        {created.streamName && (
          <p className="text-sm text-slate-500">{created.streamName}</p>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={handleCreateAnother} className="flex-1 py-2.5 btn-outline text-sm">
            {t("create_ticket_another")}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium">
            {t("create_ticket_done")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{t("create_ticket_title")}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      {streams.length > 1 && (
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("create_ticket_select_stream")}</label>
          <select value={streamId} onChange={(e) => setStreamId(e.target.value)} className="input w-full text-sm">
            {streams.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <input
        type="text"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        placeholder={t("create_ticket_name_placeholder")}
        className="input w-full text-sm"
      />
      <input
        type="tel"
        value={customerPhone}
        onChange={(e) => setCustomerPhone(e.target.value)}
        placeholder={t("create_ticket_phone_placeholder")}
        className="input w-full text-sm"
      />

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? t("create_ticket_creating") : t("create_ticket_submit")}
      </button>
    </div>
  );
}

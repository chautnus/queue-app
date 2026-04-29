"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

type TicketInfo = {
  id: string;
  displayNumber: string;
  streamName: string;
  streamId?: string | null;
  verifyCode?: string;
  status: string;
};

type PeerSession = {
  id: string;
  counterName: string;
  servedCount: number;
};

type Props = {
  sessionId: string;
  currentTicket: TicketInfo;
  onClose: () => void;
  onReassigned: (counterName: string) => void;
};

export default function StaffReassignPanel({ sessionId, currentTicket, onClose, onReassigned }: Props) {
  const t = useTranslations("staff");
  const [peers, setPeers] = useState<PeerSession[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/staff/session/${sessionId}/peers`)
      .then((r) => r.json())
      .then((data) => {
        const list: PeerSession[] = data?.data?.sessions ?? data?.sessions ?? [];
        setPeers(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => setError("Failed to load counters"))
      .finally(() => setFetching(false));
  }, [sessionId]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/session/${sessionId}/reassign-ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: currentTicket.id, targetSessionId: selectedId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to transfer");
        return;
      }
      const counterName = data?.data?.counterName ?? data?.counterName ?? selectedId;
      onReassigned(counterName);
      onClose();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{t("reassign_title")}</p>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>

      <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-600">
        {t("now_serving")}: <span className="font-bold text-slate-900">{currentTicket.displayNumber}</span>
      </div>

      {fetching ? (
        <p className="text-sm text-slate-400 text-center py-2">{t("create_ticket_creating")}</p>
      ) : peers.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-2">No other active counters</p>
      ) : (
        <div>
          <label className="text-xs text-slate-500 mb-1 block">{t("reassign_select_counter")}</label>
          <div className="space-y-2">
            {peers.map((p) => (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  selectedId === p.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="target-counter"
                  value={p.id}
                  checked={selectedId === p.id}
                  onChange={() => setSelectedId(p.id)}
                  className="accent-blue-600"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{p.counterName}</p>
                  <p className="text-xs text-slate-400">{p.servedCount} served</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleConfirm}
        disabled={loading || !selectedId || fetching}
        className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {loading ? "..." : t("reassign_confirm")}
      </button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TicketInfo = {
  id: string;
  displayNumber: string;
  streamName: string;
  status: string;
};

type Props = {
  sessionId: string;
  counterName: string;
  queueName: string;
  queueId: string;
  initialStatus: string;
  initialServedCount: number;
};

export default function WorkScreen({
  sessionId,
  counterName,
  queueName,
  queueId,
  initialStatus,
  initialServedCount,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [servedCount, setServedCount] = useState(initialServedCount);
  const [currentTicket, setCurrentTicket] = useState<TicketInfo | null>(null);
  const [inputNumber, setInputNumber] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // SSE for session updates
  useEffect(() => {
    const es = new EventSource(`/api/staff/sse/${sessionId}`);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "ticket:called") {
          setCurrentTicket(event.data);
        }
      } catch {
        // ignore
      }
    };
    return () => es.close();
  }, [sessionId]);

  const callNext = async () => {
    setLoading(true);
    setMessage(null);
    const res = await fetch(`/api/staff/session/${sessionId}/next`, {
      method: "POST",
    });
    const data = await res.json();

    if (res.ok) {
      if (data.ticket) {
        setCurrentTicket(data.ticket);
      } else {
        setMessage("No waiting tickets");
        setCurrentTicket(null);
      }
    } else {
      setMessage(data.error ?? "Error");
    }
    setLoading(false);
  };

  const acceptTicket = async () => {
    if (!inputNumber || !inputCode) return;
    setLoading(true);
    setMessage(null);

    const res = await fetch(`/api/staff/session/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayNumber: inputNumber.toUpperCase(),
        verifyCode: inputCode,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setServedCount((c) => c + 1);
      setInputNumber("");
      setInputCode("");
      setMessage("Ticket accepted ✓");
      setTimeout(() => setMessage(null), 2000);
    } else {
      setMessage(data.error ?? "Invalid ticket");
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
    const res = await fetch(`/api/staff/session/${sessionId}/pause`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setStatus(data.session.status);
    }
  };

  const endSession = async () => {
    if (!confirm("End your work session?")) return;
    await fetch(`/api/staff/session/${sessionId}/pause`, { method: "POST" });
    router.push("/staff");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-gray-900">{counterName}</h1>
            <p className="text-sm text-gray-500">{queueName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-700">{servedCount}</p>
            <p className="text-xs text-gray-500">Served today</p>
          </div>
        </div>

        {status === "PAUSED" && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-sm text-yellow-800 font-medium text-center">
            Session paused — not accepting customers
          </div>
        )}
      </div>

      {/* Current ticket */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <p className="text-sm text-gray-500 mb-2">Current Ticket</p>
        {currentTicket ? (
          <>
            <p className="ticket-number text-blue-700">{currentTicket.displayNumber}</p>
            <p className="text-sm text-gray-500 mt-1">{currentTicket.streamName}</p>
          </>
        ) : (
          <p className="text-2xl text-gray-300 font-light py-4">—</p>
        )}
      </div>

      {/* Actions */}
      {status === "ACTIVE" && (
        <div className="space-y-3">
          <button
            onClick={callNext}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-semibold text-lg rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Loading..." : "Call Next →"}
          </button>

          {/* Manual ticket entry */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Accept by code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputNumber}
                onChange={(e) => setInputNumber(e.target.value.toUpperCase())}
                placeholder="Ticket #"
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                maxLength={4}
                placeholder="Code"
                className="w-24 px-3 py-2.5 border border-gray-200 rounded-xl text-center font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={acceptTicket}
              disabled={loading || !inputNumber || inputCode.length !== 4}
              className="w-full py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-40"
            >
              Accept Ticket
            </button>
          </div>

          {currentTicket && (
            <button
              onClick={markAbsent}
              disabled={loading}
              className="w-full py-3 border border-orange-200 text-orange-600 font-medium rounded-xl hover:bg-orange-50"
            >
              Mark Absent
            </button>
          )}
        </div>
      )}

      {message && (
        <div
          className={`p-3 rounded-xl text-center text-sm font-medium ${
            message.includes("✓")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={togglePause}
          className={`flex-1 py-3 border font-medium rounded-xl transition-colors ${
            status === "PAUSED"
              ? "border-blue-200 text-blue-600 hover:bg-blue-50"
              : "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
          }`}
        >
          {status === "PAUSED" ? "Resume" : "Pause"}
        </button>
        <button
          onClick={endSession}
          className="flex-1 py-3 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50"
        >
          End Session
        </button>
      </div>
    </div>
  );
}

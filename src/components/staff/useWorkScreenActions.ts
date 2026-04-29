"use client";

import { useState } from "react";
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

type Options = {
  sessionId: string;
  isStaffAssign: boolean;
  assignStreamId: string;
  inputNumber: string;
  inputCode: string;
  setCurrentTicket: (t: TicketInfo | null) => void;
  setServedCount: React.Dispatch<React.SetStateAction<number>>;
  setInputNumber: (v: string) => void;
  setInputCode: (v: string) => void;
  setShowManual: (v: boolean) => void;
  setStatus: (v: string) => void;
};

export function useWorkScreenActions({
  sessionId,
  isStaffAssign,
  assignStreamId,
  inputNumber,
  inputCode,
  setCurrentTicket,
  setServedCount,
  setInputNumber,
  setInputCode,
  setShowManual,
  setStatus,
}: Options) {
  const router = useRouter();
  const t = useTranslations("staff");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

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
    if (res.ok) {
      const data = await res.json();
      setStatus(data.session.status);
    }
  };

  const endSession = async () => {
    if (!confirm(t("end_confirm"))) return;
    await fetch(`/api/staff/session/${sessionId}/end`, { method: "POST" });
    router.push("/staff");
  };

  return { loading, message, showMsg, callNext, acceptTicket, markAbsent, togglePause, endSession };
}

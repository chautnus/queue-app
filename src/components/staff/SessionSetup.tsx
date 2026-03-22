"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type Counter = { id: string; name: string };
type Stream = { id: string; name: string; counters: Counter[] };

type Props = {
  queueId: string;
  staffName: string;
  streams: Stream[];
};

export default function SessionSetup({ queueId, staffName, streams }: Props) {
  const router = useRouter();
  const t = useTranslations("session_setup");
  const [selectedStreamIds, setSelectedStreamIds] = useState<string[]>([
    streams[0]?.id ?? "",
  ]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>(
    streams[0]?.counters[0]?.id ?? ""
  );
  const [plannedEndTime, setPlannedEndTime] = useState("17:00");
  const [submitting, setSubmitting] = useState(false);

  const toggleStream = (streamId: string) => {
    setSelectedStreamIds((prev) =>
      prev.includes(streamId)
        ? prev.filter((s) => s !== streamId)
        : [...prev, streamId]
    );
  };

  const allCounters = streams
    .filter((s) => selectedStreamIds.includes(s.id))
    .flatMap((s) => s.counters);

  const handleStart = async () => {
    if (!selectedCounterId || selectedStreamIds.length === 0) return;
    setSubmitting(true);

    const res = await fetch("/api/staff/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counterId: selectedCounterId,
        queueId,
        streamIds: selectedStreamIds,
        plannedEndTime,
      }),
    });

    if (res.ok) {
      const { session } = await res.json();
      router.push(`/staff/work/${session.id}`);
    } else {
      setSubmitting(false);
      alert("Failed to start session");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <p className="text-sm text-gray-600">
        {t("greeting", { name: staffName })}
      </p>

      {/* Stream selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("service_streams")}
        </label>
        <div className="space-y-2">
          {streams.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleStream(s.id)}
              className={`w-full p-3 rounded-xl border-2 text-left transition-colors ${
                selectedStreamIds.includes(s.id)
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                    selectedStreamIds.includes(s.id)
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectedStreamIds.includes(s.id) && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="currentColor">
                      <path d="M8 2L4 7 2 5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span className="font-medium text-gray-900">{s.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Counter selection */}
      {allCounters.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("counter")}
          </label>
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allCounters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Planned end time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("planned_end_time")}
        </label>
        <input
          type="time"
          value={plannedEndTime}
          onChange={(e) => setPlannedEndTime(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleStart}
        disabled={
          submitting ||
          selectedStreamIds.length === 0 ||
          !selectedCounterId
        }
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? t("starting") : t("start_session")}
      </button>
    </div>
  );
}

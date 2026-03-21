"use client";

import { useTranslations } from "next-intl";
import { formatWaitTime } from "@/lib/wait-time";

type Stream = {
  id: string;
  name: string;
  waitingCount: number;
  avgProcessingSeconds: number;
};

export default function WaitInfo({
  streams,
  timezone: _timezone,
}: {
  streams: Stream[];
  timezone: string;
}) {
  const t = useTranslations("customer");
  const totalWaiting = streams.reduce((s, r) => s + r.waitingCount, 0);
  const avgSeconds = streams[0]?.avgProcessingSeconds ?? 300;
  const estimatedWait = totalWaiting * avgSeconds;

  return (
    <div className="bg-blue-50 rounded-2xl p-4">
      <div className="flex gap-4">
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-blue-700">{totalWaiting}</p>
          <p className="text-sm text-blue-600 mt-1">{t("status_waiting")}</p>
        </div>
        <div className="w-px bg-blue-200" />
        <div className="flex-1 text-center">
          <p className="text-3xl font-bold text-blue-700">
            {formatWaitTime(estimatedWait)}
          </p>
          <p className="text-sm text-blue-600 mt-1">{t("est_wait")}</p>
        </div>
      </div>
    </div>
  );
}

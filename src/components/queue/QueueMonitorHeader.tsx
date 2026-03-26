"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function QueueMonitorHeader({
  queueId,
  queueName,
}: {
  queueId: string;
  queueName: string;
}) {
  const t = useTranslations("dashboard");
  const tm = useTranslations("monitor");

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/queues" className="hover:text-blue-600">
            {t("queues")}
          </Link>
          <span>/</span>
          <span>{queueName}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{queueName}</h1>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/dashboard/queues/${queueId}/edit`}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {tm("edit")}
        </Link>
        <Link
          href={`/display/${queueId}`}
          target="_blank"
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {tm("display_board")} ↗
        </Link>
      </div>
    </div>
  );
}

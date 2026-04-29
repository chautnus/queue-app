"use client";

import { useTranslations } from "next-intl";

type Props = {
  isPaused: boolean;
  onTogglePause: () => void;
  onEndSession: () => void;
};

export default function WorkFooter({ isPaused, onTogglePause, onEndSession }: Props) {
  const t = useTranslations("staff");

  return (
    <div className="px-4 pb-6 max-w-md mx-auto w-full">
      <div className="flex gap-3">
        {!isPaused && (
          <button onClick={onTogglePause} className="flex-1 py-3 btn-amber text-sm">
            {t("pause")}
          </button>
        )}
        <button
          onClick={onEndSession}
          className="flex-1 py-3 btn-danger border border-red-100 rounded-xl text-sm"
        >
          {t("end_session")}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";

type SettingsProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
};

export default function SettingsPage({ user }: SettingsProps) {
  const t = useTranslations("settings");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">{t("account_settings")}</h1>

      <div className="card p-6 space-y-6">
        {/* Profile info */}
        <div>
          <h2 className="section-title">{t("personal_info")}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">{t("full_name")}</span>
              <span className="text-sm font-medium text-slate-900">{user.name ?? t("not_updated")}</span>
            </div>
            <div className="divider" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">{t("email")}</span>
              <span className="text-sm font-medium text-slate-900">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* App info */}
        <div>
          <h2 className="section-title">{t("app_info")}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">{t("version")}</span>
              <span className="text-sm font-medium text-slate-900">1.0.0</span>
            </div>
            <div className="divider" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">{t("platform")}</span>
              <span className="text-sm font-medium text-slate-900">Next.js PWA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

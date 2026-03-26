"use client";

import { useTranslations } from "next-intl";
import BrandSettings from "./BrandSettings";

export default function BrandPageContent() {
  const t = useTranslations("dashboard");

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t("brand")}</h1>
      <BrandSettings />
    </div>
  );
}

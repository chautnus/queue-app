"use client";

import { useTranslations } from "next-intl";
import LoginForm from "@/components/auth/LoginForm";

export default function StaffLoginPageContent() {
  const t = useTranslations("auth_page");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("staff_title")}</h1>
          <p className="mt-2 text-gray-600">{t("staff_subtitle")}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

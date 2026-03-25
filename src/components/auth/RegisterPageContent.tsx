"use client";

import { useTranslations } from "next-intl";
import RegisterForm from "@/components/auth/RegisterForm";

interface RegisterPageContentProps {
  showGoogle: boolean;
}

export default function RegisterPageContent({ showGoogle }: RegisterPageContentProps) {
  const t = useTranslations("auth_page");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("register_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register_subtitle")}</p>
        </div>
        <div className="card p-6">
          <RegisterForm showGoogle={showGoogle} />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          {t("have_account")}{" "}
          <a href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            {t("login_link")}
          </a>
        </p>
      </div>
    </div>
  );
}

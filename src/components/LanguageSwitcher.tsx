"use client";

import { locales, localeNames, type Locale } from "@/i18n/config";
import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [currentLocale, setCurrentLocale] = useState<Locale>("vi");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && locales.includes(stored)) {
      setCurrentLocale(stored);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value as Locale;
    localStorage.setItem("locale", newLocale);
    window.location.reload();
  };

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className="bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      aria-label="Select language"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {localeNames[locale]}
        </option>
      ))}
    </select>
  );
}

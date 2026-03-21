"use client";

import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

type LocaleContextType = {
  locale: Locale;
};

const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
});

export function useLocale(): Locale {
  return useContext(LocaleContext).locale;
}

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    const resolvedLocale =
      stored && locales.includes(stored) ? stored : defaultLocale;
    setLocale(resolvedLocale);

    import(`@/i18n/locales/${resolvedLocale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => {
        import(`@/i18n/locales/${defaultLocale}.json`).then((mod) =>
          setMessages(mod.default)
        );
      });
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  if (!messages) {
    return null;
  }

  return (
    <LocaleContext.Provider value={{ locale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

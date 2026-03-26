export const locales = ["en", "vi", "fr", "es", "zh", "tl", "th", "id"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  fr: "Français",
  es: "Español",
  zh: "中文",
  tl: "Filipino",
  th: "ไทย",
  id: "Bahasa Indonesia",
};

/** Detect locale from browser navigator.languages, falling back to defaultLocale */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return defaultLocale;
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    const code = lang.split("-")[0].toLowerCase();
    if ((locales as readonly string[]).includes(code)) return code as Locale;
  }
  return defaultLocale;
}

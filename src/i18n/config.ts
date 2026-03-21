export const locales = ["en", "vi", "fr", "es", "zh", "tl", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "vi";

export const localeNames: Record<Locale, string> = {
  en: "English",
  vi: "Tiếng Việt",
  fr: "Français",
  es: "Español",
  zh: "中文",
  tl: "Filipino",
  th: "ไทย",
};

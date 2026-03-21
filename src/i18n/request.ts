import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const locale = "vi"; // default
  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default,
  };
});

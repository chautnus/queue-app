"use client";

import { useEffect } from "react";

type Props = {
  slotId: string;
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export default function AdBanner({ slotId }: Props) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense might not be loaded yet
    }
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

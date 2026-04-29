import type { Metadata } from "next";
import PrivacyPage from "@/components/PrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for FreeQueue.",
};

export default function PrivacyPageRoute() {
  return <PrivacyPage />;
}

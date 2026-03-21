import type { Metadata } from "next";
import TermsPage from "@/components/TermsPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for QueueApp.",
};

export default function TermsPageRoute() {
  return <TermsPage />;
}

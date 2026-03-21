import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about QueueApp and our mission to modernize queue management.",
};

export default function AboutPageRoute() {
  return <AboutPage />;
}

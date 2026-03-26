import { Metadata } from "next";
import QueueWizard from "@/components/queue/QueueWizard";

export const metadata: Metadata = { title: "New Queue" };

export default function NewQueuePage() {
  return <QueueWizard />;
}

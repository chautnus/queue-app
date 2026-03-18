import { Metadata } from "next";
import QueueWizard from "@/components/queue/QueueWizard";

export const metadata: Metadata = { title: "Tạo hàng đợi" };

export default function NewQueuePage() {
  return <QueueWizard />;
}

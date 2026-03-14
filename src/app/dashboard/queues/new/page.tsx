import { Metadata } from "next";
import QueueWizard from "@/components/queue/QueueWizard";

export const metadata: Metadata = { title: "New Queue" };

export default function NewQueuePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Queue</h1>
      <QueueWizard />
    </div>
  );
}

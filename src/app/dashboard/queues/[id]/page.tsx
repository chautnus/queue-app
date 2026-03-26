import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LiveMonitor from "@/components/queue/LiveMonitor";
import QueueMonitorHeader from "@/components/queue/QueueMonitorHeader";

export const metadata: Metadata = { title: "Queue Monitor" };

export default async function QueueMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const queue = await prisma.queue.findUnique({
    where: { id, ownerId: session!.user.id },
    select: { id: true, name: true, status: true, slug: true },
  });

  if (!queue) notFound();

  return (
    <div>
      <QueueMonitorHeader queueId={id} queueName={queue.name} />
      <LiveMonitor queueId={id} />
    </div>
  );
}

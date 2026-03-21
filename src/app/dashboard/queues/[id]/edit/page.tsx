import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QueueWizard from "@/components/queue/QueueWizard";
import type { CreateQueueInput } from "@/lib/validations/queue";

export const metadata: Metadata = { title: "Edit Queue" };

export default async function EditQueuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();

  const queue = await prisma.queue.findUnique({
    where: { id, ownerId: session.user.id },
    include: {
      streams: {
        include: { counters: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!queue) notFound();

  // Build initialValues matching CreateQueueInput shape
  const initialValues: Partial<CreateQueueInput> = {
    name: queue.name,
    greeting: queue.greeting ?? undefined,
    logoUrl: queue.logoUrl ?? "",
    startAt: queue.startAt?.toISOString() ?? "",
    endAt: queue.endAt?.toISOString() ?? "",
    timezone: queue.timezone,
    qrRotationType: queue.qrRotationType,
    requireCustomerInfo: queue.requireCustomerInfo,
    collectName: queue.collectName,
    collectPhone: queue.collectPhone,
    collectEmail: queue.collectEmail,
    customFields: (queue.customFields as CreateQueueInput["customFields"]) ?? [],
    redirectUrl: queue.redirectUrl ?? "",
    allowTransfer: queue.allowTransfer,
    transferQueueId: queue.transferQueueId ?? undefined,
    streams: queue.streams.map((s) => ({
      name: s.name,
      ticketPrefix: s.ticketPrefix ?? undefined,
      avgProcessingSeconds: s.avgProcessingSeconds,
      counters: s.counters.map((c) => ({
        name: c.name,
        schedule: (c.schedule as CreateQueueInput["streams"][0]["counters"][0]["schedule"]) ?? undefined,
      })),
    })),
  };

  return (
    <QueueWizard
      mode="edit"
      queueId={id}
      initialValues={initialValues}
      initialLogoUrl={queue.logoUrl ?? undefined}
    />
  );
}

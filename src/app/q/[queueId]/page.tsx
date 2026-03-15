import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerFlow from "@/components/customer/CustomerFlow";
import AdBanner from "@/components/AdBanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ queueId: string }>;
}): Promise<Metadata> {
  const { queueId } = await params;
  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { name: true },
  });
  return { title: queue?.name ?? "Queue" };
}

export default async function CustomerQueuePage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      streams: {
        include: {
          counters: { select: { id: true, name: true } },
          _count: {
            select: {
              tickets: true,
            },
          },
          tickets: {
            where: { status: { in: ["WAITING", "CALLED"] } },
            select: { id: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!queue) notFound();

  const queueData = {
    id: queue.id,
    name: queue.name,
    logoUrl: queue.logoUrl,
    greeting: queue.greeting,
    status: queue.status,
    timezone: queue.timezone,
    requireCustomerInfo: queue.requireCustomerInfo,
    customFields: queue.customFields as
      | Array<{
          name: string;
          label: string;
          type: string;
          required: boolean;
          options?: string[];
        }>
      | null,
    redirectUrl: queue.redirectUrl,
    adBannerSlotId: queue.adBannerSlotId,
    streams: queue.streams.map((s) => ({
      id: s.id,
      name: s.name,
      waitingCount: s.tickets.length,
      avgProcessingSeconds: s.avgProcessingSeconds,
    })),
  };

  return (
    <>
      <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_CUSTOMER ?? ""} />
      <CustomerFlow queue={queueData} />
    </>
  );
}

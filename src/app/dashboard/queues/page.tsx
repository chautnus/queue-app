import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QueuesList from "@/components/dashboard/QueuesList";

export const metadata: Metadata = { title: "Queues" };

export default async function QueuesPage() {
  const session = await auth();
  const queues = await prisma.queue.findMany({
    where: { ownerId: session!.user.id },
    include: {
      streams: {
        include: { _count: { select: { counters: true } } },
      },
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return <QueuesList queues={queues} />;
}

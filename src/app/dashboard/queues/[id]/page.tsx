import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LiveMonitor from "@/components/queue/LiveMonitor";

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/dashboard/queues" className="hover:text-blue-600">
              Queues
            </Link>
            <span>/</span>
            <span>{queue.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{queue.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/queues/${id}/edit`}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
          <Link
            href={`/display/${id}`}
            target="_blank"
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Display Board ↗
          </Link>
        </div>
      </div>

      <LiveMonitor queueId={id} />
    </div>
  );
}

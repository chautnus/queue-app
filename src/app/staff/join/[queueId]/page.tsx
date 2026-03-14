import { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SessionSetup from "@/components/staff/SessionSetup";

export const metadata: Metadata = { title: "Start Session" };

export default async function StaffJoinPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;
  const session = await auth();

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: {
      streams: {
        include: { counters: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!queue) notFound();

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{queue.name}</h1>
          <p className="text-gray-500 mt-1">Set up your work session</p>
        </div>
        <SessionSetup
          queueId={queue.id}
          staffName={session?.user?.name ?? "Staff"}
          streams={queue.streams.map((s) => ({
            id: s.id,
            name: s.name,
            counters: s.counters.map((c) => ({ id: c.id, name: c.name })),
          }))}
        />
      </div>
    </div>
  );
}

import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { staffAuth } from "@/lib/staff-auth";
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

  // Try staff auth first, then admin auth (admin can also act as staff)
  const staffSession = await staffAuth();
  const adminSession = await auth();
  const session = staffSession ?? adminSession;

  if (!session?.user) {
    redirect(`/staff/login?callbackUrl=/staff/join/${queueId}`);
  }

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
    <div className="min-h-screen bg-slate-50 flex items-start justify-center pt-8 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{queue.name}</h1>
          <p className="text-slate-500 mt-1">Thiet lap phien lam viec</p>
        </div>
        <SessionSetup
          queueId={queue.id}
          staffName={session.user.name ?? "Nhan vien"}
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

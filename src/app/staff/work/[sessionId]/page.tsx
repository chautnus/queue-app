import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkScreen from "@/components/staff/WorkScreen";

export const metadata: Metadata = { title: "Serving" };

export default async function StaffWorkPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/staff/login");

  const staffSession = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: session.user.id },
    include: {
      counter: { select: { name: true } },
      queue: { select: { id: true, name: true } },
    },
  });

  if (!staffSession) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <WorkScreen
          sessionId={sessionId}
          counterName={staffSession.counter.name}
          queueName={staffSession.queue.name}
          queueId={staffSession.queue.id}
          initialStatus={staffSession.status}
          initialServedCount={staffSession.servedCount}
        />
      </div>
    </div>
  );
}

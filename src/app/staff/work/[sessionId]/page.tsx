import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { staffAuth } from "@/lib/staff-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkScreen from "@/components/staff/WorkScreen";
import AdBanner from "@/components/AdBanner";

export const metadata: Metadata = { title: "Serving" };

export default async function StaffWorkPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  // Try staff auth first, then admin auth
  const staffSession = await staffAuth();
  const adminSession = await auth();
  const session = staffSession ?? adminSession;

  if (!session?.user) redirect("/staff/login");

  const ss = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: session.user.id },
    include: {
      counter: { select: { name: true } },
      queue: {
        select: {
          id: true,
          name: true,
          streamAssignMode: true,
          streams: { select: { id: true, name: true }, orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!ss) notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-md mx-auto px-4 py-6">
        <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_STAFF ?? ""} />
        <WorkScreen
          sessionId={sessionId}
          counterName={ss.counter.name}
          queueName={ss.queue.name}
          queueId={ss.queue.id}
          initialStatus={ss.status}
          initialServedCount={ss.servedCount}
          streamAssignMode={ss.queue.streamAssignMode}
          streams={ss.queue.streams}
        />
      </div>
    </div>
  );
}

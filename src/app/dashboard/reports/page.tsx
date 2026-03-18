import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsDashboard from "./ReportsDashboard";

export const metadata: Metadata = { title: "Báo cáo" };

export default async function ReportsPage() {
  const session = await auth();
  const queues = await prisma.queue.findMany({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Báo cáo</h1>
      <ReportsDashboard queues={queues} />
    </div>
  );
}

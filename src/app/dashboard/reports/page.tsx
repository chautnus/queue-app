import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ReportsDashboard from "./ReportsDashboard";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  const queues = await prisma.queue.findMany({
    where: { ownerId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return <ReportsDashboard queues={queues} />;
}

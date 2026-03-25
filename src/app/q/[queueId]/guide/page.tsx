import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuidePage from "@/components/customer/GuidePage";

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
  return { title: `${queue?.name ?? "Queue"} — Guide` };
}

export default async function GuidePageServer({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    select: { id: true, name: true, logoUrl: true, greeting: true },
  });

  if (!queue) notFound();

  return <GuidePage queue={queue} />;
}

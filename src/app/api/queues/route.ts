import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateQueueSchema } from "@/lib/validations/queue";
import { randomBytes } from "crypto";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40) +
    "-" +
    randomBytes(3).toString("hex")
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queues = await prisma.queue.findMany({
    where: { ownerId: session.user.id },
    include: {
      streams: {
        include: { counters: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { tickets: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ queues });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = CreateQueueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { streams, ...queueData } = parsed.data;

    const queue = await prisma.$transaction(async (tx) => {
      const q = await tx.queue.create({
        data: {
          ...queueData,
          ownerId: session.user.id,
          slug: generateSlug(queueData.name),
          qrSecret: randomBytes(32).toString("hex"),
          logoUrl: queueData.logoUrl || null,
          redirectUrl: queueData.redirectUrl || null,
          customFields: queueData.customFields ?? undefined,
        },
      });

      for (let si = 0; si < streams.length; si++) {
        const { counters, ...streamData } = streams[si];
        const stream = await tx.stream.create({
          data: { ...streamData, queueId: q.id, order: si },
        });

        for (let ci = 0; ci < counters.length; ci++) {
          await tx.counter.create({
            data: {
              ...counters[ci],
              streamId: stream.id,
              order: ci,
              schedule: counters[ci].schedule ?? undefined,
            },
          });
        }
      }

      return q;
    });

    return NextResponse.json({ queue }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/queues]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

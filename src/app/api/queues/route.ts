import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

    const { streams, operatingHours, ...queueData } = parsed.data;

    // Retry slug generation on unique constraint collision
    let slug = generateSlug(queueData.name);
    for (let attempt = 0; attempt < 3; attempt++) {
      const exists = await prisma.queue.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      slug = generateSlug(queueData.name);
    }

    const queue = await prisma.$transaction(async (tx) => {
      const q = await tx.queue.create({
        data: {
          name: queueData.name,
          ownerId: session.user.id,
          slug,
          qrSecret: randomBytes(32).toString("hex"),
          logoUrl: queueData.logoUrl || null,
          timezone: queueData.timezone,
          qrRotationType: queueData.qrRotationType,
          category: queueData.category ?? null,
          requireCustomerInfo: queueData.requireCustomerInfo,
          collectName: queueData.collectName,
          collectPhone: queueData.collectPhone,
          collectEmail: queueData.collectEmail,
          collectAge: queueData.collectAge,
          collectAddress: queueData.collectAddress,
          streamAssignMode: queueData.streamAssignMode,
          customFields: queueData.customFields ?? Prisma.JsonNull,
          redirectUrl: queueData.redirectUrl || null,
          allowTransfer: queueData.allowTransfer,
          transferQueueId: queueData.transferQueueId ?? null,
          greeting: queueData.greeting ?? null,
          operatingHours: operatingHours ?? Prisma.JsonNull,
        },
      });

      for (let si = 0; si < streams.length; si++) {
        const s = streams[si];
        const stream = await tx.stream.create({
          data: {
            name: s.name,
            ticketPrefix: s.ticketPrefix ?? null,
            avgProcessingSeconds: s.avgProcessingSeconds,
            queueId: q.id,
            order: si,
          },
        });

        for (let ci = 0; ci < s.counters.length; ci++) {
          await tx.counter.create({
            data: {
              name: s.counters[ci].name,
              streamId: stream.id,
              order: ci,
              schedule: s.counters[ci].schedule ?? Prisma.JsonNull,
            },
          });
        }
      }

      return q;
    });

    return NextResponse.json({ queue }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/queues]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

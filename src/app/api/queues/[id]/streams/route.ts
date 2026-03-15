import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { StreamInputSchema } from "@/lib/validations/queue";

const PutStreamsSchema = z.object({
  streams: z.array(StreamInputSchema).min(1, "At least one stream required"),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const queue = await prisma.queue.findUnique({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = PutStreamsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { streams } = parsed.data;

  await prisma.$transaction(async (tx) => {
    // Delete all existing streams (cascades to counters via schema)
    await tx.stream.deleteMany({ where: { queueId: id } });

    // Recreate streams and counters
    for (let si = 0; si < streams.length; si++) {
      const { counters, ...streamData } = streams[si];
      const stream = await tx.stream.create({
        data: { ...streamData, queueId: id, order: si },
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
  });

  return NextResponse.json({ ok: true });
}

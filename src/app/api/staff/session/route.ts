import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSessionSchema = z.object({
  counterId: z.string(),
  queueId: z.string(),
  streamIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { counterId, queueId, streamIds } = parsed.data;

  // End any existing active sessions for this user
  await prisma.staffSession.updateMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    data: { status: "ENDED", endAt: new Date() },
  });

  const staffSession = await prisma.staffSession.create({
    data: {
      userId: session.user.id,
      counterId,
      queueId,
      streamIds,
      status: "ACTIVE",
    },
    include: {
      counter: { select: { name: true } },
      queue: { select: { name: true } },
    },
  });

  return NextResponse.json({ session: staffSession }, { status: 201 });
}

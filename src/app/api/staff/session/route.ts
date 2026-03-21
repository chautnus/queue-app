import { NextRequest, NextResponse } from "next/server";
import { getStaffUser } from "@/lib/get-staff-user";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const CreateSessionSchema = z.object({
  counterId: z.string(),
  queueId: z.string(),
  streamIds: z.array(z.string()).min(1),
  plannedEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getStaffUser();
  if (!user) {
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

  const { counterId, queueId, streamIds, plannedEndTime } = parsed.data;

  // Compute plannedEndAt from HH:MM in today's local date
  let plannedEndAt: Date | undefined;
  if (plannedEndTime) {
    const queue = await prisma.queue.findUnique({ where: { id: queueId }, select: { timezone: true } });
    const now = new Date();
    // Build today's date in UTC then set hours/minutes from plannedEndTime
    const [hh, mm] = plannedEndTime.split(":").map(Number);
    const end = new Date(now);
    end.setHours(hh, mm, 0, 0);
    // If end is in the past (e.g. shift set to "09:00" but it's already 17:00), push to tomorrow
    if (end <= now) end.setDate(end.getDate() + 1);
    plannedEndAt = end;
    void queue; // timezone stored for future use
  }

  // End any existing active sessions for this user
  await prisma.staffSession.updateMany({
    where: { userId: user.id, status: "ACTIVE" },
    data: { status: "ENDED", endAt: new Date() },
  });

  const staffSession = await prisma.staffSession.create({
    data: {
      userId: user.id,
      counterId,
      queueId,
      streamIds,
      status: "ACTIVE",
      ...(plannedEndAt ? { plannedEndAt } : {}),
    },
    include: {
      counter: { select: { name: true } },
      queue: { select: { name: true } },
    },
  });

  return NextResponse.json({ session: staffSession }, { status: 201 });
}

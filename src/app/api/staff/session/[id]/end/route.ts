import { NextRequest, NextResponse } from "next/server";
import { getStaffUser } from "@/lib/get-staff-user";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getStaffUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const staffSession = await prisma.staffSession.findUnique({
    where: { id, userId: user.id },
  });

  if (!staffSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (staffSession.status === "ENDED") {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  const now = new Date();
  const totalSeconds =
    staffSession.totalServiceSeconds +
    Math.round((now.getTime() - staffSession.startAt.getTime()) / 1000);

  const updated = await prisma.staffSession.update({
    where: { id },
    data: {
      status: "ENDED",
      endAt: now,
      totalServiceSeconds: totalSeconds,
      pausedAt: null,
    },
  });

  return NextResponse.json({ session: updated });
}

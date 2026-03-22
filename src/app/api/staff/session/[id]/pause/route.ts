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

  try {
    const staffSession = await prisma.staffSession.findUnique({
      where: { id, userId: user.id },
    });

    if (!staffSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date();
    const isCurrentlyPaused = staffSession.status === "PAUSED";

    const updated = await prisma.staffSession.update({
      where: { id },
      data: {
        status: isCurrentlyPaused ? "ACTIVE" : "PAUSED",
        pausedAt: isCurrentlyPaused ? null : now,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (err) {
    console.error("[POST /api/staff/session/[id]/pause]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

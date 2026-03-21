import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.enum(["INACTIVE", "ACTIVE", "PAUSED", "CLOSED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const queue = await prisma.queue.findUnique({
    where: { id, ownerId: session.user.id },
    select: { id: true, status: true },
  });

  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = StatusSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updated = await prisma.queue.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json({ queue: updated });
}

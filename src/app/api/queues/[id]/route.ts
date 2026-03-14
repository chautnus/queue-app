import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateQueueSchema } from "@/lib/validations/queue";

async function getQueueForOwner(id: string, userId: string) {
  const queue = await prisma.queue.findUnique({
    where: { id },
    include: {
      streams: {
        include: { counters: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!queue || queue.ownerId !== userId) return null;
  return queue;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const queue = await getQueueForOwner(id, session.user.id);
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ queue });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const queue = await getQueueForOwner(id, session.user.id);
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = UpdateQueueSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { streams: _streams, ...updateData } = parsed.data;

  const updated = await prisma.queue.update({
    where: { id },
    data: {
      ...updateData,
      logoUrl: updateData.logoUrl || null,
      redirectUrl: updateData.redirectUrl || null,
    },
  });

  return NextResponse.json({ queue: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const queue = await getQueueForOwner(id, session.user.id);
  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.queue.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

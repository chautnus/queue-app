import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  try {
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.greeting !== undefined) data.greeting = body.greeting || null;
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl || null;
    if (body.timezone !== undefined) data.timezone = body.timezone;
    if (body.operatingHours !== undefined) data.operatingHours = body.operatingHours ?? Prisma.JsonNull;
    if (body.qrRotationType !== undefined) data.qrRotationType = body.qrRotationType;
    if (body.requireCustomerInfo !== undefined) data.requireCustomerInfo = body.requireCustomerInfo;
    if (body.collectName !== undefined) data.collectName = body.collectName;
    if (body.collectPhone !== undefined) data.collectPhone = body.collectPhone;
    if (body.collectEmail !== undefined) data.collectEmail = body.collectEmail;
    if (body.collectAge !== undefined) data.collectAge = body.collectAge;
    if (body.collectAddress !== undefined) data.collectAddress = body.collectAddress;
    if (body.streamAssignMode !== undefined) data.streamAssignMode = body.streamAssignMode;
    if (body.redirectUrl !== undefined) data.redirectUrl = body.redirectUrl || null;
    if (body.allowTransfer !== undefined) data.allowTransfer = body.allowTransfer;
    if (body.category !== undefined) data.category = body.category || null;
    if (body.adBannerSlotId !== undefined) data.adBannerSlotId = body.adBannerSlotId || null;
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.queue.update({
      where: { id },
      data,
    });

    return NextResponse.json({ queue: updated });
  } catch (err) {
    console.error("[PATCH /api/queues/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
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

  try {
    await prisma.queue.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/queues/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

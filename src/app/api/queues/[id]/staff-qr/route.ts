import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signStaffQrToken, generateQrPng } from "@/lib/qr";

export async function GET(
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
    select: { id: true, qrSecret: true },
  });

  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await signStaffQrToken(queue.id, queue.qrSecret);
  const baseUrl = req.nextUrl.origin;
  const qrUrl = `${baseUrl}/staff/join/${queue.id}?token=${token}`;
  const png = await generateQrPng(qrUrl);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

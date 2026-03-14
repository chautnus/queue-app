import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signCustomerQrToken, generateQrPng } from "@/lib/qr";

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
    select: { id: true, qrSecret: true, qrRotationType: true, timezone: true },
  });

  if (!queue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await signCustomerQrToken(
    queue.id,
    queue.qrSecret,
    queue.qrRotationType,
    queue.timezone
  );

  const baseUrl = req.nextUrl.origin;
  const qrUrl = `${baseUrl}/q/${queue.id}?token=${token}`;
  const png = await generateQrPng(qrUrl);

  const cacheHeader =
    queue.qrRotationType === "DAILY"
      ? "no-store"
      : "public, max-age=86400";

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": cacheHeader,
    },
  });
}

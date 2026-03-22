import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signCustomerQrToken, generateQrPngWithLogo } from "@/lib/qr";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const queue = await prisma.queue.findUnique({
      where: { id, ownerId: session.user.id },
      select: { id: true, qrSecret: true, qrRotationType: true, timezone: true, logoUrl: true },
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

    // Use forwarded host on Railway (proxy passes original host), fallback to nextUrl.origin
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const baseUrl = `${proto}://${host}`;
    const qrUrl = `${baseUrl}/q/${queue.id}?token=${token}`;
    const png = await generateQrPngWithLogo(qrUrl, queue.logoUrl, baseUrl);

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
  } catch (err) {
    console.error("[GET /api/queues/[id]/qr]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

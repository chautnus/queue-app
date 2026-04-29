import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyToken } from "@/app/api/captcha/route";
import { createTicket } from "@/lib/join-service";
import { verifyQrUrl } from "@/lib/qr-signature";
import { checkRateLimit, buildRateLimitKey, getClientIp } from "@/lib/rate-limit";
import {
  getIdempotencyKey,
  getIdempotentResponse,
  setIdempotentResponse,
} from "@/lib/idempotency";

const JoinSchema = z.object({
  deviceId: z.string().min(1),
  streamId: z.string().nullable().optional(),
  customerInfo: z.record(z.unknown()).optional(),
  captchaAnswer: z.number(),
  captchaToken: z.string(),
  /** Full queue URL from QR scan — used for HMAC signature verification */
  qrUrl: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ ticket: null });

  const registration = await prisma.deviceRegistration.findUnique({
    where: { queueId_deviceId: { queueId: id, deviceId } },
  });
  if (!registration?.ticketId) return NextResponse.json({ ticket: null });

  const ticket = await prisma.ticket.findUnique({
    where: { id: registration.ticketId, status: { in: ["WAITING", "CALLED", "SERVING"] } },
    include: { stream: { select: { name: true } } },
  });

  return NextResponse.json({ ticket });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(req);

  // 1. Rate limiting — 5 req/min per IP+deviceId
  const body = await req.json().catch(() => null);
  const rlKey = buildRateLimitKey(ip, body?.deviceId);
  const { allowed } = await checkRateLimit(rlKey);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 2. Idempotency
  const idemKey = getIdempotencyKey(req);
  if (idemKey) {
    const cached = await getIdempotentResponse(idemKey);
    if (cached) {
      return NextResponse.json(cached.body, { status: cached.status });
    }
  }

  try {
    const parsed = JoinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { deviceId, streamId, customerInfo, captchaAnswer, captchaToken, qrUrl } = parsed.data;

    // 3. HMAC QR signature verification (if QR_SECRET set and qrUrl provided)
    if (qrUrl && process.env.QR_SECRET) {
      const valid = verifyQrUrl(qrUrl, process.env.QR_SECRET);
      if (!valid) {
        return NextResponse.json({ error: "Invalid QR signature" }, { status: 400 });
      }
    }

    // 4. CAPTCHA verification
    const captchaValid = verifyCaptchaToken(captchaToken, captchaAnswer);
    if (!captchaValid) {
      return NextResponse.json({ error: { captcha: ["Invalid CAPTCHA answer"] } }, { status: 400 });
    }

    // 5. Check duplicate active ticket
    const existingReg = await prisma.deviceRegistration.findUnique({
      where: { queueId_deviceId: { queueId: id, deviceId } },
    });
    if (existingReg?.ticketId) {
      const existingTicket = await prisma.ticket.findUnique({
        where: { id: existingReg.ticketId, status: { in: ["WAITING", "CALLED", "SERVING"] } },
      });
      if (existingTicket) {
        return NextResponse.json(
          { error: "Device already has an active ticket", ticket: existingTicket },
          { status: 409 }
        );
      }
    }

    // 6. Queue status check
    const queue = await prisma.queue.findUnique({ where: { id }, select: { status: true } });
    if (!queue) return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    if (queue.status !== "ACTIVE") {
      return NextResponse.json({ error: "Queue is not accepting tickets" }, { status: 400 });
    }

    // 7. Create ticket (pessimistic locking inside)
    const ticket = await createTicket({ queueId: id, deviceId, streamId, customerInfo });

    const responseBody = { ticket };
    if (idemKey) await setIdempotentResponse(idemKey, { status: 200, body: responseBody });

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[POST /api/queues/:id/join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function verifyCaptchaToken(token: string, answer: number): boolean {
  const decoded = verifyToken(token);
  if (!decoded) return false;
  if (decoded.op === "+") return decoded.a + decoded.b === answer;
  if (decoded.op === "-") return decoded.a - decoded.b === answer;
  return false;
}

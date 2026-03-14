import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { allocateTicketNumber, generateVerifyCode } from "@/lib/ticket";
import { broadcastToQueue } from "@/lib/sse";
import { estimateWaitTime } from "@/lib/wait-time";

const JoinSchema = z.object({
  deviceId: z.string().min(1),
  streamId: z.string().optional(),
  customerInfo: z.record(z.unknown()).optional(),
  captchaAnswer: z.number(),
  captchaToken: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check existing ticket for device
  const { id } = await params;
  const deviceId = req.nextUrl.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json({ ticket: null });
  }

  const registration = await prisma.deviceRegistration.findUnique({
    where: { queueId_deviceId: { queueId: id, deviceId } },
  });

  if (!registration?.ticketId) {
    return NextResponse.json({ ticket: null });
  }

  const ticket = await prisma.ticket.findUnique({
    where: {
      id: registration.ticketId,
      status: { in: ["WAITING", "CALLED", "SERVING"] },
    },
    include: { stream: { select: { name: true } } },
  });

  return NextResponse.json({ ticket });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = JoinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { deviceId, streamId, customerInfo, captchaAnswer, captchaToken } =
      parsed.data;

    // Verify CAPTCHA
    const captchaValid = await verifyCaptchaToken(
      captchaToken,
      captchaAnswer
    );
    if (!captchaValid) {
      return NextResponse.json(
        { error: { captcha: ["Invalid CAPTCHA answer"] } },
        { status: 400 }
      );
    }

    // Check if device already has an active ticket for this queue
    const existingReg = await prisma.deviceRegistration.findUnique({
      where: { queueId_deviceId: { queueId: id, deviceId } },
    });

    if (existingReg?.ticketId) {
      const existingTicket = await prisma.ticket.findUnique({
        where: {
          id: existingReg.ticketId,
          status: { in: ["WAITING", "CALLED", "SERVING"] },
        },
      });

      if (existingTicket) {
        return NextResponse.json(
          { error: "Device already has an active ticket", ticket: existingTicket },
          { status: 409 }
        );
      }
    }

    // Get queue config
    const queue = await prisma.queue.findUnique({
      where: { id },
      include: {
        streams: { orderBy: { order: "asc" } },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    if (queue.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Queue is not accepting tickets" },
        { status: 400 }
      );
    }

    // Determine target stream
    const targetStreamId =
      streamId ?? queue.streams[0]?.id;

    if (!targetStreamId) {
      return NextResponse.json(
        { error: "No stream available" },
        { status: 400 }
      );
    }

    // Allocate ticket number atomically
    const { number, displayNumber } = await allocateTicketNumber(
      targetStreamId,
      queue.timezone
    );
    const verifyCode = generateVerifyCode();

    // Create ticket + device registration in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const t = await tx.ticket.create({
        data: {
          queueId: id,
          streamId: targetStreamId,
          ticketNumber: number,
          displayNumber,
          verifyCode,
          deviceId,
          customerInfo: customerInfo ? JSON.parse(JSON.stringify(customerInfo)) : undefined,
        },
        include: { stream: { select: { name: true, avgProcessingSeconds: true } } },
      });

      await tx.deviceRegistration.upsert({
        where: { queueId_deviceId: { queueId: id, deviceId } },
        create: { queueId: id, deviceId, ticketId: t.id },
        update: { ticketId: t.id },
      });

      return t;
    });

    // Calculate wait time
    const { waitingAhead, estimatedSeconds } = await estimateWaitTime(
      targetStreamId,
      number,
      queue.timezone
    );

    // Broadcast to queue subscribers
    broadcastToQueue(id, {
      type: "ticket:created",
      data: { ticketId: ticket.id, displayNumber, streamId: targetStreamId, waitingAhead },
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        displayNumber: ticket.displayNumber,
        verifyCode: ticket.verifyCode,
        streamName: ticket.stream.name,
        status: ticket.status,
        waitingAhead,
        estimatedSeconds,
      },
    });
  } catch (err) {
    console.error("[POST /api/queues/:id/join]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Verify CAPTCHA token (server-side math challenge)
// Token is a signed timestamp+question stored in a short-lived cookie
async function verifyCaptchaToken(
  token: string,
  answer: number
): Promise<boolean> {
  try {
    // Token format: base64(JSON({ a, b, op, exp }))
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf-8"));
    if (decoded.exp < Date.now()) return false;

    let expected: number;
    if (decoded.op === "+") expected = decoded.a + decoded.b;
    else if (decoded.op === "-") expected = decoded.a - decoded.b;
    else return false;

    return expected === answer;
  } catch {
    return false;
  }
}

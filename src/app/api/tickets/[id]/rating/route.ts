import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const RatingSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { id: true, status: true, rating: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (ticket.rating !== null) {
    return NextResponse.json({ error: "Already rated" }, { status: 409 });
  }

  const body = await req.json();
  const parsed = RatingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  await prisma.ticket.update({
    where: { id },
    data: { rating: parsed.data.rating, ratingComment: parsed.data.comment },
  });

  return NextResponse.json({ success: true });
}

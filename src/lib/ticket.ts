import { prisma } from "@/lib/prisma";
import { getTodayInTz } from "@/lib/date-utils";

export async function allocateTicketNumber(
  streamId: string,
  timezone: string
): Promise<{ number: number; displayNumber: string }> {
  const today = getTodayInTz(timezone); // "YYYY-MM-DD"

  // Atomic upsert + increment — race-safe via PostgreSQL row-level locking
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    INSERT INTO "DailyTicketCounter" (id, "streamId", date, count)
    VALUES (gen_random_uuid(), ${streamId}::text, ${today}::text, 1)
    ON CONFLICT ("streamId", date)
    DO UPDATE SET count = "DailyTicketCounter".count + 1
    RETURNING count
  `;

  const number = Number(result[0].count);

  const stream = await prisma.stream.findUniqueOrThrow({
    where: { id: streamId },
    select: { ticketPrefix: true },
  });

  const prefix = stream.ticketPrefix ?? "";
  const displayNumber = `${prefix}${String(number).padStart(3, "0")}`;

  return { number, displayNumber };
}

export function generateVerifyCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

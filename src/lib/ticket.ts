import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTodayInTz } from "@/lib/date-utils";

type TxClient = Prisma.TransactionClient;

/**
 * Allocate the next ticket number for a stream using pessimistic locking.
 * Must be called INSIDE a prisma.$transaction to guarantee gapless numbering:
 * if the outer transaction rolls back, the counter rolls back too.
 *
 * Uses SELECT ... FOR UPDATE to prevent concurrent duplicate numbers.
 */
export async function allocateTicketNumber(
  tx: TxClient,
  streamId: string,
  timezone: string
): Promise<{ number: number; displayNumber: string }> {
  const today = getTodayInTz(timezone);

  // Pessimistic lock: SELECT ... FOR UPDATE then increment
  // Creates row if absent, then locks it for the duration of the transaction.
  await tx.$executeRaw`
    INSERT INTO "DailyTicketCounter" (id, "streamId", date, count)
    VALUES (gen_random_uuid(), ${streamId}::text, ${today}::text, 0)
    ON CONFLICT ("streamId", date) DO NOTHING
  `;

  const result = await tx.$queryRaw<[{ count: bigint }]>`
    SELECT count FROM "DailyTicketCounter"
    WHERE "streamId" = ${streamId}::text AND date = ${today}::text
    FOR UPDATE
  `;

  const next = Number(result[0].count) + 1;

  await tx.$executeRaw`
    UPDATE "DailyTicketCounter"
    SET count = ${next}
    WHERE "streamId" = ${streamId}::text AND date = ${today}::text
  `;

  const stream = await tx.stream.findUniqueOrThrow({
    where: { id: streamId },
    select: { ticketPrefix: true },
  });

  const prefix = stream.ticketPrefix ?? "";
  const displayNumber = `${prefix}${String(next).padStart(3, "0")}`;

  return { number: next, displayNumber };
}

export function generateVerifyCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

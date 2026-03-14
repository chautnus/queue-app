import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSSEStream,
  subscribeToQueue,
  unsubscribeFromQueue,
} from "@/lib/sse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Verify queue exists
  const queue = await prisma.queue.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!queue) {
    return new Response("Queue not found", { status: 404 });
  }

  return createSSEStream(
    (controller) => subscribeToQueue(id, controller),
    (controller) => unsubscribeFromQueue(id, controller)
  );
}

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  createSSEStream,
  subscribeToSession,
  unsubscribeFromSession,
} from "@/lib/sse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  return createSSEStream(
    (controller) => subscribeToSession(sessionId, controller),
    (controller) => unsubscribeFromSession(sessionId, controller)
  );
}

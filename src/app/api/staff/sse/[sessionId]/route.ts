import { NextRequest } from "next/server";
import { getStaffUser } from "@/lib/get-staff-user";
import {
  createSSEStream,
  subscribeToSession,
  unsubscribeFromSession,
} from "@/lib/sse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const user = await getStaffUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { sessionId } = await params;

  return createSSEStream(
    (controller) => subscribeToSession(sessionId, controller),
    (controller) => unsubscribeFromSession(sessionId, controller)
  );
}

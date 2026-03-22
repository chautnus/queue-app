import { NextRequest } from "next/server";
import { getStaffUser } from "@/lib/get-staff-user";
import { prisma } from "@/lib/prisma";
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

  // Verify session belongs to this user
  const staffSession = await prisma.staffSession.findUnique({
    where: { id: sessionId, userId: user.id },
  });

  if (!staffSession) {
    return new Response("Session not found", { status: 404 });
  }

  return createSSEStream(
    (controller) => subscribeToSession(sessionId, controller),
    (controller) => unsubscribeFromSession(sessionId, controller)
  );
}

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function initVapid() {
  const subject = process.env.VAPID_SUBJECT ?? process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (subject && publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  }
  return false;
}

export async function sendPushToTicket(
  ticketId: string,
  payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }
): Promise<void> {
  if (!initVapid()) return; // Push not configured

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { ticketId },
  });

  const staleEndpoints: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err: unknown) {
        const error = err as { statusCode?: number };
        // 410 Gone or 404 = subscription expired
        if (error.statusCode === 410 || error.statusCode === 404) {
          staleEndpoints.push(sub.endpoint);
        }
      }
    })
  );

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: staleEndpoints } },
    });
  }
}

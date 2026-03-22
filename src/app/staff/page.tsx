import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StaffHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/staff/login");

  // Find active session and redirect to it
  const activeSession = await prisma.staffSession.findFirst({
    where: { userId: session.user.id, status: "ACTIVE" },
    orderBy: { startAt: "asc" },
  });

  if (activeSession) {
    redirect(`/staff/work/${activeSession.id}`);
  }

  // No active session - show queue selection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Portal</h1>
        <p className="text-gray-500">Scan a queue QR code to start your session.</p>
      </div>
    </div>
  );
}

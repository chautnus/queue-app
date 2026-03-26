import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import AdBanner from "@/components/AdBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar user={session.user} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_ADMIN ?? ""} />
        </div>
      </main>
    </div>
  );
}

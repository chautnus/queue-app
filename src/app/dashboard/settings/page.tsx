import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Cai dat" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900 mb-6">Cai dat tai khoan</h1>

      <div className="card p-6 space-y-6">
        {/* Profile info */}
        <div>
          <h2 className="section-title">Thong tin ca nhan</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Ho ten</span>
              <span className="text-sm font-medium text-slate-900">{session.user.name ?? "Chua cap nhat"}</span>
            </div>
            <div className="divider" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Email</span>
              <span className="text-sm font-medium text-slate-900">{session.user.email}</span>
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* App info */}
        <div>
          <h2 className="section-title">Thong tin ung dung</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Phien ban</span>
              <span className="text-sm font-medium text-slate-900">1.0.0</span>
            </div>
            <div className="divider" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Nen tang</span>
              <span className="text-sm font-medium text-slate-900">Next.js PWA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

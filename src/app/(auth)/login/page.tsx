import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard/queues");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Đăng nhập</h1>
          <p className="mt-1 text-sm text-slate-500">Quản lý hàng đợi của bạn</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <a href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Đăng ký
          </a>
        </p>
      </div>
    </div>
  );
}

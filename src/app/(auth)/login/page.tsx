import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard/queues");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">QueueApp</h1>
          <p className="mt-2 text-gray-600">Sign in to manage your queues</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}

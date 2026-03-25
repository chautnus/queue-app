import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginPageContent from "@/components/auth/LoginPageContent";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard/queues");

  const showGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return <LoginPageContent showGoogle={showGoogle} />;
}

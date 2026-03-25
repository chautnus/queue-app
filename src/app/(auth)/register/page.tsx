import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RegisterPageContent from "@/components/auth/RegisterPageContent";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard/queues");

  const showGoogle = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return <RegisterPageContent showGoogle={showGoogle} />;
}

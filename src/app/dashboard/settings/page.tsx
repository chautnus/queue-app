import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import SettingsPage from "@/components/dashboard/SettingsPage";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsServerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <SettingsPage user={{ name: session.user.name, email: session.user.email }} />;
}

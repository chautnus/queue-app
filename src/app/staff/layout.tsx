import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/staff/login");
  }

  return <>{children}</>;
}

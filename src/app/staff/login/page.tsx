import { Metadata } from "next";
import StaffLoginPageContent from "@/components/auth/StaffLoginPageContent";

export const metadata: Metadata = { title: "Staff Login" };

export default function StaffLoginPage() {
  return <StaffLoginPageContent />;
}

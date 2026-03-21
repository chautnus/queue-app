import { auth } from "@/lib/auth";
import { staffAuth } from "@/lib/staff-auth";

/**
 * Get authenticated user from either admin auth or staff auth.
 * Staff can login via either system, so we check both.
 */
export async function getStaffUser() {
  const [adminSession, staffSession] = await Promise.all([
    auth().catch(() => null),
    staffAuth().catch(() => null),
  ]);

  return staffSession?.user ?? adminSession?.user ?? null;
}

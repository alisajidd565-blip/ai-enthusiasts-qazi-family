import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";

export async function assertAdmin() {
  const cookieStore = await cookies();
  const ok = await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!ok) redirect("/admin/login");
}

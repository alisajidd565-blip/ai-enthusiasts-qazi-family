import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Challenge, Cousin, Submission } from "@/lib/types";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const cookieStore = await cookies();
  const ok = await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!ok) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: cousins }, { data: challenges }, { data: submissions }] = await Promise.all([
    admin.from("cousins").select("*").order("sort_order", { ascending: true }),
    admin.from("challenges").select("*").order("challenge_date", { ascending: false }).limit(120),
    admin.from("submissions").select("*").order("submitted_at", { ascending: false }).limit(800),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-sm text-zinc-400">Loading admin…</div>}>
        <AdminDashboard
          cousins={(cousins ?? []) as Cousin[]}
          challenges={(challenges ?? []) as Challenge[]}
          submissions={(submissions ?? []) as Submission[]}
        />
      </Suspense>
    </main>
  );
}

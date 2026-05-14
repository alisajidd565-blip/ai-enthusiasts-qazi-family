import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin"; // ← Recommended change
import type { Challenge, Cousin, Submission } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  try {
    const cookieStore = await cookies();
    const ok = await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
    if (!ok) redirect("/admin/login");

    const supabase = createAdminClient();   // ← Better for admin

    const [{ data: cousins, error: cousinsError },
           { data: challenges, error: challengesError },
           { data: submissions, error: submissionsError }] = await Promise.all([
      supabase.from("cousins").select("*").order("sort_order", { ascending: true }),
      supabase.from("challenges").select("*").order("challenge_date", { ascending: false }).limit(120),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }).limit(800),
    ]);

    if (cousinsError) throw new Error(`Cousins query failed: ${cousinsError.message}`);
    if (challengesError) throw new Error(`Challenges query failed: ${challengesError.message}`);
    if (submissionsError) throw new Error(`Submissions query failed: ${submissionsError.message}`);

    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-sm text-zinc-400">Loading admin dashboard...</div>}>
          <AdminDashboard
            cousins={(cousins ?? []) as Cousin[]}
            challenges={(challenges ?? []) as Challenge[]}
            submissions={(submissions ?? []) as Submission[]}
          />
        </Suspense>
      </main>
    );
  } catch (error: any) {
    console.error("Admin page error:", error);
    
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-red-100">
          <h2 className="font-semibold text-xl mb-2">Admin page error</h2>
          <p className="text-red-200">{error.message}</p>
          {process.env.NODE_ENV === "development" && error.stack && (
            <pre className="mt-4 text-xs text-red-300/70 overflow-auto">{error.stack}</pre>
          )}
        </div>
      </main>
    );
  }
}

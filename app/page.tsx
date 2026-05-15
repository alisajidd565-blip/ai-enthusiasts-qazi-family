import Link from "next/link";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/auth";
import { createPublicClient } from "@/lib/supabase/public";
import type { Challenge, Cousin, Submission } from "@/lib/types";
import {
  bestSubmissionThisMonthUtc,
  computeTotalScores,
  currentStreakUtc,
  funniestRoasts,
  mostImprovedCousinId,
} from "@/lib/stats";
import { HomePage } from "@/components/home/HomePage";

export const dynamic = "force-dynamic";

async function loadHomeData(): Promise<{
  cousins: Cousin[];
  challenges: Challenge[];
  submissions: Submission[];
  hallSubmissionIds: string[];
}> {
  try {
    const supabase = createPublicClient();
    const [{ data: cousins }, { data: challenges }, { data: submissions }, { data: hall }] = await Promise.all([
      supabase.from("cousins").select("*").order("sort_order", { ascending: true }),
      supabase.from("challenges").select("*").order("challenge_date", { ascending: false }).limit(60),
      supabase.from("submissions").select("*").order("submitted_at", { ascending: false }).limit(800),
      supabase.from("hall_of_fame").select("submission_id").limit(50),
    ]);

    return {
      cousins: (cousins ?? []) as Cousin[],
      challenges: (challenges ?? []) as Challenge[],
      submissions: (submissions ?? []) as Submission[],
      hallSubmissionIds: (hall ?? []).map((h) => h.submission_id as string),
    };
  } catch {
    return { cousins: [], challenges: [], submissions: [], hallSubmissionIds: [] };
  }
}

export default async function Page() {
  const cookieStore = await cookies();
  const isAdmin = await verifyAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);

  const { cousins, challenges, submissions, hallSubmissionIds } = await loadHomeData();

  const activeChallenge =
    (challenges.find((c) => c.is_active) ?? challenges[0]) ?? null;

  const totals = computeTotalScores(submissions);
  const leaderboard = [...cousins]
    .map((c) => ({
      cousin: c,
      totalScore: totals.get(c.id) ?? 0,
      submissionCount: submissions.filter((s) => s.cousin_id === c.id).length,
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  const bestMonth = bestSubmissionThisMonthUtc(submissions);
  const roasts = funniestRoasts(submissions, 4);
  const mostImprovedId = mostImprovedCousinId({
    submissions,
    cousinIds: cousins.map((c) => c.id),
  });

  const hallSubs = submissions.filter((s) => hallSubmissionIds.includes(s.id));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="text-xs text-zinc-400 sm:text-sm">
          Private family arena · Groq judging · Cloudinary storage · Supabase records
        </div>
        <Link
          href="/admin/login"
          prefetch={false}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-200 backdrop-blur transition hover:border-cyan-400/30 hover:bg-white/10 sm:text-sm"
        >
          Admin
        </Link>
      </div>

      <HomePage
        isAdmin={isAdmin}
        cousins={cousins}
        challenges={challenges}
        submissions={submissions}
        activeChallenge={activeChallenge}
        leaderboard={leaderboard}
        hallSubs={hallSubs}
        bestMonth={bestMonth}
        roasts={roasts}
        mostImprovedId={mostImprovedId}
        streakByCousinId={Object.fromEntries(
          cousins.map((c) => [c.id, currentStreakUtc(submissions, c.id)]),
        )}
      />
    </main>
  );
}

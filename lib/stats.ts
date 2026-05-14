import { addDays, differenceInCalendarDays, formatISO, parseISO, startOfDay } from "date-fns";
import type { Submission } from "@/lib/types";

export function computeTotalScores(submissions: Submission[]) {
  const map = new Map<string, number>();
  for (const s of submissions) {
    map.set(s.cousin_id, (map.get(s.cousin_id) ?? 0) + Number(s.final_score));
  }
  return map;
}

export function currentStreakUtc(submissions: Submission[], cousinId: string, today = new Date()) {
  const dates = new Set(
    submissions
      .filter((s) => s.cousin_id === cousinId)
      .map((s) => formatISO(startOfDay(parseISO(s.submitted_at)), { representation: "date" })),
  );

  let streak = 0;
  let cursor = startOfDay(today);

  while (dates.has(formatISO(cursor, { representation: "date" }))) {
    streak += 1;
    cursor = addDays(cursor, -1);
    if (streak > 3650) break;
  }

  return streak;
}

export function mostImprovedCousinId(params: {
  submissions: Submission[];
  cousinIds: string[];
}) {
  const { submissions, cousinIds } = params;
  const byCousin = new Map<string, Submission[]>();
  for (const id of cousinIds) byCousin.set(id, []);
  for (const s of submissions) {
    const list = byCousin.get(s.cousin_id);
    if (!list) continue;
    list.push(s);
  }

  let bestId: string | null = null;
  let bestDelta = -Infinity;

  for (const id of cousinIds) {
    const list = (byCousin.get(id) ?? []).sort(
      (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime(),
    );
    const scores = list
      .map((s) => (s.overall_ai != null ? Number(s.overall_ai) : Number(s.final_score)))
      .filter((n) => !Number.isNaN(n));
    if (scores.length < 4) continue;
    const mid = Math.floor(scores.length / 2);
    const first = scores.slice(0, mid);
    const second = scores.slice(mid);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const delta = avg(second) - avg(first);
    if (delta > bestDelta) {
      bestDelta = delta;
      bestId = id;
    }
  }

  return bestDelta > 0.25 ? bestId : null;
}

export function bestSubmissionThisMonthUtc(submissions: Submission[], now = new Date()) {
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  const inMonth = submissions.filter((s) => {
    const d = new Date(s.submitted_at);
    return d.getUTCFullYear() === year && d.getUTCMonth() === month;
  });
  if (!inMonth.length) return null;
  return inMonth.reduce((best, s) => (Number(s.final_score) > Number(best.final_score) ? s : best));
}

export function funniestRoasts(submissions: Submission[], limit = 3) {
  return [...submissions]
    .filter((s) => (s.roast ?? "").trim().length > 0)
    .sort((a, b) => (b.roast?.length ?? 0) - (a.roast?.length ?? 0))
    .slice(0, limit);
}

export function daysUntil(endsAtIso: string | null) {
  if (!endsAtIso) return null;
  const end = parseISO(endsAtIso);
  const now = new Date();
  return differenceInCalendarDays(startOfDay(end), startOfDay(now));
}

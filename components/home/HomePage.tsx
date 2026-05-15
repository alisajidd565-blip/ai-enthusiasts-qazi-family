"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Challenge, Cousin, Submission } from "@/lib/types";
import { daysUntil } from "@/lib/stats";

function safeFormatDate(iso: string | null | undefined, fmt: string) {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, fmt);
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type BoardRow = {
  cousin: Cousin;
  totalScore: number;
  submissionCount: number;
  rank: number;
};

export function HomePage(props: {
  isAdmin: boolean;
  cousins: Cousin[];
  challenges: Challenge[];
  submissions: Submission[];
  activeChallenge: Challenge | null;
  leaderboard: BoardRow[];
  hallSubs: Submission[];
  bestMonth: Submission | null;
  roasts: Submission[];
  mostImprovedId: string | null;
  streakByCousinId: Record<string, number>;
}) {
  const {
    isAdmin,
    cousins,
    submissions,
    activeChallenge,
    leaderboard,
    hallSubs,
    bestMonth,
    roasts,
    mostImprovedId,
    streakByCousinId,
  } = props;

  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const subsByCousin = useMemo(() => {
    const map = new Map<string, Submission[]>();
    for (const c of cousins) map.set(c.id, []);
    for (const s of submissions) {
      const list = map.get(s.cousin_id);
      if (list) list.push(s);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    }
    return map;
  }, [cousins, submissions]);

  const hallCards = useMemo(() => {
    if (hallSubs.length) return hallSubs.slice(0, 9);
    return leaderboard
      .map((r) => subsByCousin.get(r.cousin.id)?.[0])
      .filter((s): s is Submission => Boolean(s))
      .slice(0, 3);
  }, [hallSubs, leaderboard, subsByCousin]);

  const cousinById = useMemo(() => new Map(cousins.map((c) => [c.id, c])), [cousins]);
  
  const endsInDays = null;

  return (
    <div className="space-y-16">
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 sm:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />

        <div className="relative space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
            Live family arena
          </div>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            AI Enthusiasts
            <span className="block bg-gradient-to-r from-cyan-200 via-fuchsia-200 to-lime-200 bg-clip-text text-transparent">
              Qazi Family
            </span>
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            Daily prompts, cousin chaos, and Groq-powered judging. Uploads are private to the family—scores
            are loud, the roasts are (mostly) affectionate, and the leaderboard never forgets.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#challenge"
              className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-zinc-950 shadow-glow transition hover:brightness-110"
            >
              Today&apos;s challenge
            </a>
            <a
              href="#leaderboard"
              className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-zinc-100 backdrop-blur transition hover:border-white/25 hover:bg-white/10"
            >
              Leaderboard
            </a>
          </div>
        </div>
      </header>

      <section id="challenge" className="scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Daily challenge</h2>
            <p className="mt-2 text-sm text-zinc-400">The prompt everyone is (supposedly) working on.</p>
          </div>
          {activeChallenge ? (
            <div className="hidden text-right text-xs text-zinc-400 sm:block">
              <div className="text-sm text-zinc-200">{safeFormatDate(activeChallenge.challenge_date, "MMM d, yyyy")}</div>
              <div className="mt-1 inline-flex items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-zinc-200">
                  {activeChallenge.difficulty}
                </span>
                {endsInDays != null ? (
                  <span className="text-[11px] text-zinc-400">
                    {endsInDays < 0 ? "Closed" : endsInDays === 0 ? "Ends today" : `Ends in ${endsInDays}d`}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-fuchsia-500/10" />
          <div className="relative">
            {!activeChallenge ? (
              <div className="text-zinc-300">
                No active challenge yet. Create one in{" "}
                <Link className="text-cyan-300 underline" href="/admin/login" prefetch={false}>
                  Admin
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-zinc-400 sm:hidden">
                  {safeFormatDate(activeChallenge.challenge_date, "MMM d, yyyy")} ·{" "}
                  <span className="text-zinc-200">{activeChallenge.difficulty}</span>
                </div>
                <blockquote className="text-lg leading-relaxed text-zinc-100 sm:text-2xl">
                  “{activeChallenge.prompt}”
                </blockquote>
                {activeChallenge.reference_image_url && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-cyan-300 uppercase tracking-wide">📎 Reference Image — modify this image according to the prompt above</p>
                    <div className="overflow-hidden rounded-2xl border border-cyan-400/20 bg-black/30">
                      <img
                        src={activeChallenge.reference_image_url}
                        alt="Challenge reference image"
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                    <p className="text-xs text-zinc-500">Use this image as your starting point. Your submission should reflect the changes described in the prompt.</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Groq vision judging</span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Cloudinary originals</span>
                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1">Supabase history</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="spotlights" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Spotlights</h2>
          <p className="mt-2 text-sm text-zinc-400">Best of the month, most improved momentum, and legendary roasts.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Best submission (this month)</div>
            {!bestMonth ? (
              <div className="mt-3 text-sm text-zinc-300">No submissions this month yet.</div>
            ) : (
              <div className="mt-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setLightbox({ src: bestMonth.image_url, alt: "Best of month" })}
                  className="group relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bestMonth.image_url}
                    alt="Best of month"
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </button>
                <div className="text-sm text-zinc-200">
                  Score: <span className="text-cyan-200">{Number(bestMonth.final_score).toFixed(1)}</span> / 10
                </div>
                <div className="text-xs text-zinc-400">
                  By {cousinById.get(bestMonth.cousin_id)?.display_name ?? "Unknown"}
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Most improved (momentum)</div>
            {!mostImprovedId ? (
              <div className="mt-3 text-sm text-zinc-300">Need a few more scored submissions to measure trends.</div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="text-lg font-semibold text-zinc-100">
                  {cousinById.get(mostImprovedId)?.display_name ?? "Unknown"}
                </div>
                <p className="text-sm text-zinc-400">
                  Based on average score lift from earlier submissions to recent ones (family analytics, not science).
                </p>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-zinc-400">Funniest AI roasts</div>
            <div className="mt-3 space-y-3">
              {roasts.length ? (
                roasts.map((s) => (
                  <div key={s.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <div className="text-[11px] text-zinc-500">
                      {cousinById.get(s.cousin_id)?.display_name ?? "Unknown"}
                    </div>
                    <div className="mt-1 text-sm italic text-zinc-200">“{s.roast}”</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-300">Roasts will appear after judging runs.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="hall" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Hall of fame</h2>
          <p className="mt-2 text-sm text-zinc-400">Curated legends (admin picks) plus automatic all-time heavy hitters.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {hallCards.length === 0 ? (
            <div className="md:col-span-3 text-sm text-zinc-400">
              Nothing here yet — upload in Admin, then use “Add to Hall of Fame” on a submission.
            </div>
          ) : null}
          {hallCards.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setLightbox({ src: s.image_url, alt: "Hall of fame" })}
              className="glass group relative overflow-hidden rounded-2xl text-left"
            >
              <div className="relative aspect-[4/3] w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.image_url}
                  alt="Hall of fame"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white">
                    {cousinById.get(s.cousin_id)?.display_name ?? "Unknown"}
                  </div>
                  <div className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white">
                    {Number(s.final_score).toFixed(1)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="leaderboard" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">Leaderboard</h2>
          <p className="mt-2 text-sm text-zinc-400">Cumulative scores across all judged submissions.</p>
        </div>

        <div className="grid gap-3">
          {leaderboard.map((row) => (
            <div
              key={row.cousin.id}
              className="glass flex items-center justify-between gap-4 rounded-2xl p-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold",
                    row.rank === 1 && "border-amber-300/40 bg-amber-300/10 text-amber-100",
                    row.rank === 2 && "border-zinc-300/30 bg-zinc-300/10 text-zinc-100",
                    row.rank === 3 && "border-orange-300/30 bg-orange-300/10 text-orange-100",
                    row.rank > 3 && "border-white/10 bg-white/5 text-zinc-200",
                  )}
                >
                  {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                </div>
                <div>
                  <div className="font-semibold text-zinc-100">{row.cousin.display_name}</div>
                  <div className="text-xs text-zinc-500">
                    {row.submissionCount} submissions · streak {streakByCousinId[row.cousin.id] ?? 0} days
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold tracking-tight text-cyan-200">{row.totalScore.toFixed(1)}</div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">total</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="cousins" className="scroll-mt-24 space-y-6">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">The roster</h2>
          <p className="mt-2 text-sm text-zinc-400">Profiles, galleries, and Groq commentary.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {cousins.map((cousin) => {
            const list = subsByCousin.get(cousin.id) ?? [];
            const latest = list[0];
            const row = leaderboard.find((r) => r.cousin.id === cousin.id);
            return (
              <article
                key={cousin.id}
                className="glass relative overflow-hidden rounded-3xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5" />
                <div className="relative space-y-4 p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                      {cousin.profile_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cousin.profile_image_url}
                          alt={cousin.display_name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-200">
                          {initialsFromName(cousin.display_name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-display text-xl font-semibold">{cousin.display_name}</h3>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-xs text-zinc-300">
                          {row?.totalScore.toFixed(1) ?? "0.0"} pts
                        </span>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-xs text-cyan-100">
                          streak {streakByCousinId[cousin.id] ?? 0}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{cousin.intro}</p>
                    </div>
                  </div>

                  {latest ? (
                    <div className="grid gap-3 sm:grid-cols-5">
                      <button
                        type="button"
                        onClick={() => setLightbox({ src: latest.image_url, alt: `${cousin.display_name} latest` })}
                        className="group relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:col-span-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={latest.image_url}
                          alt={`${cousin.display_name} latest submission`}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] text-white backdrop-blur">
                          Latest
                        </div>
                      </button>
                      <div className="sm:col-span-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                            <span>{safeFormatDate(latest.submitted_at, "MMM d, yyyy")}</span>
                            <span className="rounded-full bg-white/5 px-2 py-0.5 text-zinc-200">
                              Score {Number(latest.final_score).toFixed(1)}/10
                            </span>
                          </div>
                          <div className="mt-3 text-sm text-zinc-200">
                            {latest.feedback ? latest.feedback : "Judging notes will appear here after Groq runs."}
                          </div>
                          {latest.improvement_tips ? (
                            <div className="mt-3 text-sm text-zinc-400">
                              <span className="text-zinc-500">Tip: </span>
                              {latest.improvement_tips}
                            </div>
                          ) : null}
                          {latest.roast ? (
                            <div className="mt-3 rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/5 p-3 text-sm italic text-fuchsia-100">
                              “{latest.roast}”
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-6 text-sm text-zinc-400">
                      No submissions yet. {isAdmin ? "Upload from Admin to kick things off." : "Tell the admin to upload."}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const first = list[0];
                        if (first) setLightbox({ src: first.image_url, alt: "Gallery" });
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-zinc-100 transition hover:border-white/20 hover:bg-white/10 disabled:opacity-40"
                      disabled={!list.length}
                    >
                      Open gallery ({list.length})
                    </button>
                    {isAdmin ? (
                      <Link
                        href={`/admin?cousin=${encodeURIComponent(cousin.slug)}`}
                        prefetch={false}
                        className="rounded-full bg-gradient-to-r from-cyan-400/90 to-fuchsia-400/90 px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:brightness-110"
                      >
                        Admin: upload / edit
                      </Link>
                    ) : null}
                  </div>

                  {list.length > 1 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {list.slice(0, 6).map((s) => (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => setLightbox({ src: s.image_url, alt: "History" })}
                          className="relative h-16 w-24 flex-none overflow-hidden rounded-xl border border-white/10 bg-black/30"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.image_url} alt="Thumbnail" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-white/10 pt-10 text-center text-xs text-zinc-500">
        Built for the Qazi family WhatsApp chaos · Keep prompts weird · Keep roasts kindish
      </footer>

      <AnimatePresence>
        {lightbox ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-glow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-3 top-3 z-10 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-white backdrop-blur"
                onClick={() => setLightbox(null)}
              >
                Close
              </button>
              <div className="relative aspect-video w-full bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox.src} alt={lightbox.alt} className="h-full w-full object-contain" />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

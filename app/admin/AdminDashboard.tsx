"use client";

import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Challenge, Cousin, Submission } from "@/lib/types";
import { SubmitButton } from "@/components/SubmitButton";
import {
  addHallOfFame,
  createChallenge,
  deleteChallenge,
  deleteSubmission,
  logoutAction,
  reJudgeSubmission,
  resetLeaderboard,
  updateChallenge,
  updateCousinIntro,
  updateSubmissionScore,
  uploadCousinProfile,
  uploadSubmission,
} from "./actions";

export function AdminDashboard(props: {
  cousins: Cousin[];
  challenges: Challenge[];
  submissions: Submission[];
}) {
  const { cousins, challenges, submissions } = props;
  const searchParams = useSearchParams();

  const [cousinId, setCousinId] = useState(cousins[0]?.id ?? "");
  const [challengeId, setChallengeId] = useState("");

  useEffect(() => {
    const slug = searchParams.get("cousin");
    if (!slug) return;
    const c = cousins.find((x) => x.slug === slug);
    if (c) setCousinId(c.id);
  }, [searchParams, cousins]);

  const activeChallenge = useMemo(() => {
    return challenges.find((c) => c.is_active) ?? challenges[0] ?? null;
  }, [challenges]);

  useEffect(() => {
    if (!challengeId && activeChallenge) setChallengeId(activeChallenge.id);
  }, [activeChallenge, challengeId]);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-400">Admin</div>
          <h1 className="mt-2 font-display text-3xl font-semibold">Control room</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Uploads trigger Cloudinary storage + Groq judging. The homepage updates automatically after each action.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-100 hover:bg-white/10"
          >
            View site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-100 hover:bg-red-500/15"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Upload a submission (Groq judging)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Pick the cousin and (optionally) the challenge. If challenge is blank, the newest active challenge is used.
        </p>

        <form className="mt-5 grid gap-4 md:grid-cols-2" action={uploadSubmission} encType="multipart/form-data">
          <label className="block text-sm text-zinc-300">
            Cousin
            <select
              name="cousinId"
              value={cousinId}
              onChange={(e) => setCousinId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
            >
              {cousins.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm text-zinc-300">
            Challenge (optional)
            <select
              name="challengeId"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
            >
              <option value="">Auto (latest active)</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.challenge_date} · {c.difficulty}
                </option>
              ))}
            </select>
          </label>

          <div className="md:col-span-2">
            <label className="block text-sm text-zinc-300">
              Image file
              <input
                name="file"
                type="file"
                accept="image/*"
                required
                className="mt-2 block w-full text-sm text-zinc-200 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/15"
              />
            </label>
          </div>

          <div className="md:col-span-2">
            <SubmitButton
              pendingText="Uploading / judging…"
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-5 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              Upload & judge
            </SubmitButton>
          </div>
        </form>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Profile photos</h2>
        <p className="mt-2 text-sm text-zinc-400">Upload each cousin’s portrait (stored on Cloudinary, URL saved in Supabase).</p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {cousins.map((c) => (
            <div key={c.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  {c.profile_image_url ? (
                    <Image src={c.profile_image_url} alt={c.display_name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-zinc-300">?</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{c.display_name}</div>
                  <div className="truncate text-xs text-zinc-500">{c.slug}</div>
                </div>
              </div>

              <form className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end" action={uploadCousinProfile} encType="multipart/form-data">
                <input type="hidden" name="cousinId" value={c.id} />
                <input name="file" type="file" accept="image/*" required className="block w-full text-sm text-zinc-200" />
                <SubmitButton className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60">
                  Save photo
                </SubmitButton>
              </form>

              <form className="mt-4 space-y-2" action={updateCousinIntro}>
                <input type="hidden" name="id" value={c.id} />
                <label className="block text-xs text-zinc-400">
                  Introduction
                  <textarea
                    name="intro"
                    defaultValue={c.intro}
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                  />
                </label>
                <SubmitButton className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60">
                  Save intro
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Challenges</h2>

        <form className="mt-5 grid gap-3 md:grid-cols-2" action={createChallenge}>
          <label className="md:col-span-2 block text-sm text-zinc-300">
            Prompt
            <textarea
              name="prompt"
              rows={3}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
              placeholder="Write the daily challenge…"
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Date (UTC)
            <input
              name="challenge_date"
              type="date"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
            />
          </label>
          <label className="block text-sm text-zinc-300">
            Difficulty
            <select
              name="difficulty"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
              <option value="legendary">legendary</option>
            </select>
          </label>
          <label className="md:col-span-2 block text-sm text-zinc-300">
            Ends at (optional, local time)
            <input
              name="ends_at"
              type="datetime-local"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
            />
          </label>
          <div className="md:col-span-2">
            <SubmitButton className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60">
              Create challenge
            </SubmitButton>
          </div>
        </form>

        <div className="mt-8 space-y-4">
          {challenges.map((ch) => (
            <div key={ch.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-zinc-400">
                  {ch.challenge_date} · <span className="text-zinc-200">{ch.difficulty}</span> ·{" "}
                  <span className={ch.is_active ? "text-cyan-200" : "text-zinc-500"}>
                    {ch.is_active ? "active" : "inactive"}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {ch.updated_at || ch.created_at
                    ? format(parseISO((ch.updated_at ?? ch.created_at) as string), "MMM d, HH:mm")
                    : null}
                </div>
              </div>

              <form className="mt-4 space-y-3" action={updateChallenge}>
                <input type="hidden" name="id" value={ch.id} />
                <textarea
                  name="prompt"
                  defaultValue={ch.prompt}
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                />
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    name="challenge_date"
                    type="date"
                    defaultValue={ch.challenge_date}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                  />
                  <select
                    name="difficulty"
                    defaultValue={ch.difficulty}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                  >
                    <option value="easy">easy</option>
                    <option value="medium">medium</option>
                    <option value="hard">hard</option>
                    <option value="legendary">legendary</option>
                  </select>
                  <select
                    name="is_active"
                    defaultValue={String(ch.is_active)}
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                  >
                    <option value="true">active</option>
                    <option value="false">inactive</option>
                  </select>
                </div>
                <input
                  name="ends_at"
                  type="datetime-local"
                  defaultValue={ch.ends_at ? format(parseISO(ch.ends_at), "yyyy-MM-dd'T'HH:mm") : ""}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring focus:ring-cyan-400/30"
                />
                <SubmitButton className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:opacity-60">
                  Save changes
                </SubmitButton>
              </form>

              <form
                className="mt-3"
                action={deleteChallenge}
                onSubmit={(e) => {
                  if (!confirm("Delete this challenge?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={ch.id} />
                <SubmitButton className="text-sm text-red-300 hover:underline disabled:opacity-60">
                  Delete challenge
                </SubmitButton>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <h2 className="font-display text-xl font-semibold">Submissions</h2>
        <p className="mt-2 text-sm text-zinc-400">Manual scoring overrides totals. Re-judge re-runs Groq on the stored image URL.</p>

        <div className="mt-5 space-y-4">
          {submissions.map((s) => {
            const cousin = cousins.find((c) => c.id === s.cousin_id);
            return (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 lg:w-72">
                    <Image src={s.image_url} alt="Submission" fill className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
                      <span className="font-semibold text-white">{cousin?.display_name ?? "Unknown"}</span>
                      <span className="text-zinc-500">{format(parseISO(s.submitted_at), "MMM d, yyyy HH:mm")}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-200">
                        final {Number(s.final_score).toFixed(1)}
                      </span>
                    </div>

                    <div className="grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                      <div>creativity: {s.creativity ?? "—"}</div>
                      <div>adherence: {s.adherence ?? "—"}</div>
                      <div>realism: {s.realism ?? "—"}</div>
                    </div>

                    <div className="text-sm text-zinc-200">{s.feedback ?? "—"}</div>
                    {s.improvement_tips ? <div className="text-sm text-zinc-400">Tip: {s.improvement_tips}</div> : null}
                    {s.roast ? <div className="text-sm italic text-fuchsia-200">“{s.roast}”</div> : null}

                    <div className="flex flex-wrap gap-2">
                      <form className="flex items-center gap-2" action={updateSubmissionScore}>
                        <input type="hidden" name="id" value={s.id} />
                        <input
                          name="final_score"
                          defaultValue={String(s.final_score)}
                          className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm"
                        />
                        <SubmitButton className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/15 disabled:opacity-60">
                          Save score
                        </SubmitButton>
                      </form>

                      <form action={reJudgeSubmission}>
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-100 disabled:opacity-60">
                          Re-judge
                        </SubmitButton>
                      </form>

                      <form action={addHallOfFame}>
                        <input type="hidden" name="submissionId" value={s.id} />
                        <input type="hidden" name="note" value="Curated pick" />
                        <SubmitButton className="rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 px-3 py-1 text-sm text-fuchsia-100 disabled:opacity-60">
                          Add to Hall of Fame
                        </SubmitButton>
                      </form>

                      <form
                        action={deleteSubmission}
                        onSubmit={(e) => {
                          if (!confirm("Delete this submission permanently?")) e.preventDefault();
                        }}
                      >
                        <input type="hidden" name="id" value={s.id} />
                        <SubmitButton className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm text-red-100 disabled:opacity-60">
                          Delete
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-3xl border border-red-400/15 bg-red-500/5 p-6">
        <h2 className="font-display text-xl font-semibold text-red-100">Danger zone</h2>
        <p className="mt-2 text-sm text-red-100/80">
          This deletes all submissions from Supabase and attempts to delete the Cloudinary images. Challenges and cousins remain.
        </p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" action={resetLeaderboard}>
          <label className="block text-sm text-red-100">
            Type RESET to confirm
            <input name="confirm" className="mt-2 w-full rounded-xl border border-red-400/20 bg-black/30 px-3 py-2 text-sm text-white outline-none" />
          </label>
          <SubmitButton className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-60">
            Reset leaderboard
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}

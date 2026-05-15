"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { timingSafeEqual } from "crypto";
import { ADMIN_COOKIE, createAdminToken } from "@/lib/auth";
import { assertAdmin } from "@/lib/admin-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteCloudinaryAsset, uploadImageBuffer } from "@/lib/cloudinary";
import { judgeSubmissionWithGroq } from "@/lib/groq";

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected || password.length === 0 || !safeEqual(password, expected)) {
    return { error: "Invalid password" };
  }

  const token = await createAdminToken();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

export async function createChallenge(formData: FormData) {
  await assertAdmin();
  const prompt = String(formData.get("prompt") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "medium");
  const challengeDate = String(formData.get("challenge_date") ?? "").trim();
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();

  if (!prompt) throw new Error("Prompt is required");
  if (!challengeDate) throw new Error("Date is required");

  const admin = createAdminClient();
  const endsAt = endsAtRaw ? new Date(endsAtRaw).toISOString() : null;

  const { error } = await admin.from("challenges").insert({
    prompt,
    challenge_date: challengeDate,
    difficulty,
    ends_at: endsAt,
    is_active: true,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateChallenge(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const patch: Record<string, unknown> = {};
  const prompt = String(formData.get("prompt") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "").trim();
  const challengeDate = String(formData.get("challenge_date") ?? "").trim();
  const isActive = String(formData.get("is_active") ?? "");
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();

  if (prompt) patch.prompt = prompt;
  if (difficulty) patch.difficulty = difficulty;
  if (challengeDate) patch.challenge_date = challengeDate;
  if (isActive === "true" || isActive === "false") patch.is_active = isActive === "true";
  patch.ends_at = endsAtRaw ? new Date(endsAtRaw).toISOString() : null;

  const admin = createAdminClient();
  const { error } = await admin.from("challenges").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteChallenge(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  const admin = createAdminClient();
  const { error } = await admin.from("challenges").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateCousinIntro(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const intro = String(formData.get("intro") ?? "");
  if (!id) throw new Error("Missing id");
  const admin = createAdminClient();
  const { error } = await admin.from("cousins").update({ intro }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function uploadCousinProfile(formData: FormData) {
  await assertAdmin();
  const cousinId = String(formData.get("cousinId") ?? "");
  const file = formData.get("file");
  if (!cousinId) throw new Error("Missing cousin");
  if (!(file instanceof Blob)) throw new Error("Missing file");

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageBuffer({ buffer, folder: "qazi-family/profiles" });

  const admin = createAdminClient();
  const { error } = await admin
    .from("cousins")
    .update({ profile_image_url: uploaded.secure_url, cloudinary_public_id: uploaded.public_id })
    .eq("id", cousinId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function uploadSubmission(formData: FormData) {
  await assertAdmin();
  const cousinId = String(formData.get("cousinId") ?? "");
  const challengeIdRaw = String(formData.get("challengeId") ?? "").trim();
  const file = formData.get("file");
  if (!cousinId) throw new Error("Missing cousin");
  if (!(file instanceof Blob)) throw new Error("Missing file");

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await uploadImageBuffer({ buffer, folder: "qazi-family/submissions" });

  const admin = createAdminClient();

  let challengeId: string | null = challengeIdRaw || null;
  if (!challengeId) {
    const { data: ch } = await admin
      .from("challenges")
      .select("id")
      .eq("is_active", true)
      .order("challenge_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    challengeId = ch?.id ?? null;
  }

  let challengePrompt = "General creative AI image.";
  if (challengeId) {
    const { data: ch } = await admin.from("challenges").select("prompt").eq("id", challengeId).maybeSingle();
    if (ch?.prompt) challengePrompt = ch.prompt;
  }

  const { data: inserted, error } = await admin
    .from("submissions")
    .insert({
      cousin_id: cousinId,
      challenge_id: challengeId,
      image_url: uploaded.secure_url,
      cloudinary_public_id: uploaded.public_id,
      final_score: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  const submissionId = inserted.id as string;

  try {
    const judge = await judgeSubmissionWithGroq({ challengePrompt, imageUrl: uploaded.secure_url });
    const { error: upErr } = await admin
      .from("submissions")
      .update({
        creativity: judge.creativity,
        adherence: judge.adherence,
        realism: judge.realism,
        overall_ai: judge.overall,
        final_score: judge.overall,
        feedback: judge.feedback,
        improvement_tips: judge.improvement_tips,
        roast: judge.roast,
        judged_at: new Date().toISOString(),
        gemini_raw: JSON.parse(JSON.stringify(judge)) as never,
      })
      .eq("id", submissionId);
    if (upErr) throw new Error(upErr.message);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await admin
      .from("submissions")
      .update({
        feedback: `Groq judging failed — you can set a manual score below. (${message})`,
        gemini_raw: { error: message } as never,
      })
      .eq("id", submissionId);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSubmissionScore(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  const scoreRaw = String(formData.get("final_score") ?? "").trim();
  if (!id) throw new Error("Missing id");
  const finalScore = Number(scoreRaw);
  if (Number.isNaN(finalScore)) throw new Error("Invalid score");

  const admin = createAdminClient();
  const { error } = await admin.from("submissions").update({ final_score: finalScore }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteSubmission(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const admin = createAdminClient();
  const { data: row } = await admin.from("submissions").select("cloudinary_public_id").eq("id", id).maybeSingle();
  if (row?.cloudinary_public_id) {
    try {
      await deleteCloudinaryAsset(row.cloudinary_public_id);
    } catch {
      // ignore storage cleanup failures
    }
  }

  const { error } = await admin.from("submissions").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addHallOfFame(formData: FormData) {
  await assertAdmin();
  const submissionId = String(formData.get("submissionId") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!submissionId) throw new Error("Missing submission");

  const admin = createAdminClient();
  const { error } = await admin.from("hall_of_fame").insert({ submission_id: submissionId, note: note || null });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function resetLeaderboard(formData: FormData) {
  await assertAdmin();
  const confirm = String(formData.get("confirm") ?? "");
  if (confirm !== "RESET") throw new Error("Type RESET to confirm");

  const admin = createAdminClient();
  const { data: rows } = await admin.from("submissions").select("id, cloudinary_public_id").limit(5000);
  for (const r of rows ?? []) {
    if (r.cloudinary_public_id) {
      try {
        await deleteCloudinaryAsset(r.cloudinary_public_id);
      } catch {
        // ignore
      }
    }
  }

  const { error } = await admin.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function reJudgeSubmission(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");

  const admin = createAdminClient();
  const { data: sub } = await admin.from("submissions").select("image_url, challenge_id").eq("id", id).single();

  if (!sub) throw new Error("Submission not found");

  let challengePrompt = "General creative AI image.";
  if (sub.challenge_id) {
    const { data: ch } = await admin.from("challenges").select("prompt").eq("id", sub.challenge_id).maybeSingle();
    if (ch?.prompt) challengePrompt = ch.prompt;
  }

  try {
    const judge = await judgeSubmissionWithGroq({ challengePrompt, imageUrl: sub.image_url });
    const { error } = await admin
      .from("submissions")
      .update({
        creativity: judge.creativity,
        adherence: judge.adherence,
        realism: judge.realism,
        overall_ai: judge.overall,
        final_score: judge.overall,
        feedback: judge.feedback,
        improvement_tips: judge.improvement_tips,
        roast: judge.roast,
        judged_at: new Date().toISOString(),
        gemini_raw: JSON.parse(JSON.stringify(judge)) as never,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await admin
      .from("submissions")
      .update({
        feedback: `Groq judging failed — ${message}`,
        gemini_raw: { error: message } as never,
      })
      .eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/admin");
}

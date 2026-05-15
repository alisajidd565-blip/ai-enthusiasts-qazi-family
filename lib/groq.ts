import Groq from "groq-sdk";

export type JudgeResult = {
  creativity: number;
  adherence: number;
  realism: number;
  overall: number;
  feedback: string;
  improvement_tips: string;
  roast: string;
};

function clamp10(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.min(10, Math.max(0, n));
}

function parseJudgeJson(text: string): JudgeResult {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return {
    creativity: clamp10(Number(parsed.creativity)),
    adherence: clamp10(Number(parsed.adherence)),
    realism: clamp10(Number(parsed.realism)),
    overall: clamp10(Number(parsed.overall)),
    feedback: String(parsed.feedback ?? ""),
    improvement_tips: String(parsed.improvement_tips ?? ""),
    roast: String(parsed.roast ?? ""),
  };
}

export async function judgeSubmissionWithGroq(params: {
  challengePrompt: string;
  imageUrl: string;
}): Promise<JudgeResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const imageResp = await fetch(params.imageUrl);
  if (!imageResp.ok) {
    throw new Error(`Failed to fetch image for judging (${imageResp.status})`);
  }
  const mimeType = imageResp.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imageResp.arrayBuffer());
  const base64 = buffer.toString("base64");

  const modelName = process.env.GROQ_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
  const groq = new Groq({ apiKey });

  const instruction = [
    "You are the head judge for a private family AI image competition.",
    "Analyze the provided image against the challenge prompt.",
    "Score fairly using the full 0-10 range when appropriate.",
    "Be specific about what works and what is missing.",
    "Roasts must be playful and family-friendly (no slurs, no harassment, no political targeting).",
    "",
    "Return ONLY valid JSON with these exact keys:",
    '{ "creativity": number, "adherence": number, "realism": number, "overall": number, "feedback": string, "improvement_tips": string, "roast": string }',
    "",
    "CHALLENGE PROMPT:",
    params.challengePrompt,
  ].join("\n");

  const response = await groq.chat.completions.create({
    model: modelName,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: instruction },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content ?? "";
  return parseJudgeJson(text);
}

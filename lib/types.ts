export type Difficulty = "easy" | "medium" | "hard" | "legendary";

export type Cousin = {
  id: string;
  slug: string;
  display_name: string;
  intro: string;
  profile_image_url: string | null;
  cloudinary_public_id: string | null;
  sort_order: number;
};

export type Challenge = {
  id: string;
  prompt: string;
  challenge_date: string;
  difficulty: Difficulty;
  ends_at: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Submission = {
  id: string;
  cousin_id: string;
  challenge_id: string | null;
  image_url: string;
  cloudinary_public_id: string | null;
  submitted_at: string;
  creativity: number | null;
  adherence: number | null;
  realism: number | null;
  overall_ai: number | null;
  final_score: number;
  feedback: string | null;
  improvement_tips: string | null;
  roast: string | null;
  judged_at: string | null;
};

export type LeaderboardRow = {
  cousin: Cousin;
  totalScore: number;
  submissionCount: number;
  rank: number;
};

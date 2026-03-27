-- Retention Features Migration
-- 1. exercise_responses table (already exists — add missing columns/indexes)
-- 2. personal_book_summaries table (for living summary)
-- 3. blocker column on maintenance_checkins (for adaptive check-in)

-- Feature 1: Exercise Responses — ensure table exists and has correct shape
CREATE TABLE IF NOT EXISTS exercise_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter_number INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'reflection',
  prompt_text TEXT,
  response_text TEXT NOT NULL,
  ai_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercise_responses_user_book ON exercise_responses(user_id, book_id);

-- Feature 3: Adaptive Check-in — blocker column
ALTER TABLE maintenance_checkins ADD COLUMN IF NOT EXISTS blocker TEXT;
ALTER TABLE maintenance_checkins ADD COLUMN IF NOT EXISTS ai_followup TEXT;

-- Feature 4: Personal Book Summaries (Living Summary)
CREATE TABLE IF NOT EXISTS personal_book_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  response_count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_personal_summaries_user ON personal_book_summaries(user_id, book_id);

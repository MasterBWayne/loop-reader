-- Feature 2: Weekly Insights
CREATE TABLE IF NOT EXISTS weekly_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_date DATE NOT NULL,
  insight_text TEXT NOT NULL,
  linked_book_id TEXT,
  linked_chapter_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_insights_user ON weekly_insights(user_id, week_date);

ALTER TABLE weekly_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weekly insights" ON weekly_insights
  FOR ALL USING (auth.uid() = user_id);

-- Feature 3: Problem-Oriented Filter (The Toolbelt)
ALTER TABLE chapter_reflections ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Feature 4 & 5: Flashback Challenges & Wins Gallery
ALTER TABLE chapter_reflections ADD COLUMN IF NOT EXISTS is_implemented BOOLEAN DEFAULT false;
ALTER TABLE chapter_reflections ADD COLUMN IF NOT EXISTS implemented_at TIMESTAMPTZ;

-- Flashback responses
CREATE TABLE IF NOT EXISTS flashback_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter_number INT NOT NULL,
  response_type TEXT NOT NULL, -- 'yes', 'not_yet', 'help'
  ai_reframe TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter_number)
);

ALTER TABLE flashback_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own flashback responses" ON flashback_responses
  FOR ALL USING (auth.uid() = user_id);

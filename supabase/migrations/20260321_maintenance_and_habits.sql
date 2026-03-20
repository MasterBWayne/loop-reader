-- Maintenance Mode: weekly principle check-ins for completed books
CREATE TABLE IF NOT EXISTS maintenance_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter_number INT NOT NULL,
  week_date DATE NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 10),
  reflection TEXT,
  ai_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, week_date)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_user ON maintenance_checkins(user_id, book_id);

ALTER TABLE maintenance_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own maintenance checkins" ON maintenance_checkins
  FOR ALL USING (auth.uid() = user_id);

-- Habit definitions per book (seeded from app data, but stored for future admin editing)
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT NOT NULL,
  habit_text TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_habits_book ON habits(book_id);

-- Habit completions: user checks off habits
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id, completed_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user ON habit_completions(user_id, habit_id);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read habits" ON habits FOR SELECT USING (true);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habit completions" ON habit_completions
  FOR ALL USING (auth.uid() = user_id);

-- Spaced Repetition Review Cards
CREATE TABLE IF NOT EXISTS review_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL,
  chapter_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  review_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_review_cards_user_due ON review_cards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_review_cards_user_book_chapter ON review_cards(user_id, book_id, chapter_number);

-- RLS
ALTER TABLE review_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own review cards" ON review_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own review cards" ON review_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review cards" ON review_cards
  FOR UPDATE USING (auth.uid() = user_id);

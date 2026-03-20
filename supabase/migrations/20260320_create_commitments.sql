-- Commitments: accountability loop for exercise follow-ups
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id TEXT NOT NULL,
  chapter_number INT NOT NULL,
  commitment_text TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  followed_up BOOLEAN NOT NULL DEFAULT false,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_commitments_user ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_commitments_pending ON commitments(user_id, followed_up, due_date);

-- Allow anon access for the app (RLS disabled for now, matching other tables)
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own commitments" ON commitments
  FOR ALL USING (auth.uid() = user_id);

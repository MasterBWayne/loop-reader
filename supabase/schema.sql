-- Loop Reader Database Schema
-- Run this in Supabase SQL Editor after creating the project

-- Users: readers who purchased access
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  gumroad_sale_id TEXT,
  tier TEXT NOT NULL DEFAULT 'basic', -- 'basic' | 'loop_experience' | 'community'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Intake form answers (personalization)
  intake_struggle TEXT,
  intake_duration TEXT,
  intake_impact TEXT,
  intake_tried TEXT,
  intake_vision TEXT,
  intake_completed BOOLEAN NOT NULL DEFAULT false,

  -- Rate limiting
  ai_messages_this_month INT NOT NULL DEFAULT 0,
  ai_messages_month_reset TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now())
);

-- Books: metadata for each book in the series
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  book_number INT NOT NULL DEFAULT 1,
  total_chapters INT NOT NULL DEFAULT 8,
  gumroad_product_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Book chapters: actual content
CREATE TABLE IF NOT EXISTS book_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- markdown
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(book_id, chapter_number)
);

-- Sessions: AI companion chat sessions per user per book
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  current_chapter INT NOT NULL DEFAULT 1,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Session messages: chat history
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily check-ins: quick daily reflections
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  reflection TEXT,
  mood_before INT CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INT CHECK (mood_after BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pods: small accountability groups
CREATE TABLE IF NOT EXISTS pods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  max_members INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pod members
CREATE TABLE IF NOT EXISTS pod_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pod_id UUID NOT NULL REFERENCES pods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(pod_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_access_token ON users(access_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_book ON sessions(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_pod ON pod_members(pod_id);
CREATE INDEX IF NOT EXISTS idx_pod_members_user ON pod_members(user_id);

-- Row Level Security (enable later when auth is configured)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pod_members ENABLE ROW LEVEL SECURITY;

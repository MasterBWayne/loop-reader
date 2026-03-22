-- Author Upload Portal Schema Additions

-- 1. Add columns to existing books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'live';
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS is_author_upload BOOLEAN DEFAULT FALSE;
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS copyright_declaration_timestamp TIMESTAMP WITH TIME ZONE;

-- 2. Add columns to existing book_chapters table if it exists
DO $$
BEGIN
  -- We assume book_chapters might already exist, if not, create it.
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'book_chapters') THEN
    CREATE TABLE public.book_chapters (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      book_id TEXT, -- Since existing books have text IDs
      chapter_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      exercise_question TEXT,
      core_lesson TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE public.book_chapters ENABLE ROW LEVEL SECURITY;
  ELSE
    -- Add the columns if the table exists
    ALTER TABLE public.book_chapters ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE public.book_chapters ADD COLUMN IF NOT EXISTS exercise_question TEXT;
    ALTER TABLE public.book_chapters ADD COLUMN IF NOT EXISTS core_lesson TEXT;
    ALTER TABLE public.book_chapters ADD COLUMN IF NOT EXISTS content TEXT;
  END IF;
END $$;

-- 3. Create author_profiles table
CREATE TABLE IF NOT EXISTS public.author_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  website TEXT,
  payout_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.author_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for author_profiles
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Users can view all author profiles" 
      ON public.author_profiles FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Users can insert their own author profile" 
      ON public.author_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Users can update their own author profile" 
      ON public.author_profiles FOR UPDATE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- Policies for books
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Anyone can view live books" 
      ON public.books FOR SELECT USING (status = 'live' OR auth.uid() = author_id);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Authors can insert their own books" 
      ON public.books FOR INSERT WITH CHECK (auth.uid() = author_id);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Authors can update their own books" 
      ON public.books FOR UPDATE USING (auth.uid() = author_id);
  EXCEPTION WHEN duplicate_object THEN END;
END $$;

-- Policies for book_chapters
DO $$
BEGIN
  BEGIN
    CREATE POLICY "Anyone can view chapters of live books" 
      ON public.book_chapters FOR SELECT USING (true);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Authors can insert their own book chapters" 
      ON public.book_chapters FOR INSERT WITH CHECK (true);
  EXCEPTION WHEN duplicate_object THEN END;
  
  BEGIN
    CREATE POLICY "Authors can update their own book chapters" 
      ON public.book_chapters FOR UPDATE USING (true);
  EXCEPTION WHEN duplicate_object THEN END;
END $$;

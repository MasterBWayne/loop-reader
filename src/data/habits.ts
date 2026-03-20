export interface BookHabit {
  bookId: string;
  habits: string[];
}

export const BOOK_HABITS: BookHabit[] = [
  {
    bookId: 'stop-chasing',
    habits: [
      "Caught myself in a mental loop and named it without believing it",
      "Initiated 0 unnecessary contact when feeling anxious",
      "Let someone else fill the silence instead of over-explaining",
      "Did 1 thing for myself without seeking validation",
    ],
  },
  {
    bookId: 'art-of-war-inner-battles',
    habits: [
      "Observed my reactions without acting on them for 10+ minutes",
      "Identified 1 battle not worth fighting and let it go",
      "Structured my environment to make the right choice automatic",
      "Read a situation by actions, not just words",
    ],
  },
  {
    bookId: 'how-to-get-rich',
    habits: [
      "Identified and delegated 1 low-leverage task",
      "Protected my peak focus hours from interruptions",
      "Said no to 1 good-but-not-great opportunity",
      "Moved toward ownership — worked ON the business, not just IN it",
    ],
  },
  {
    bookId: 'win-friends',
    habits: [
      "Had 1 conversation where I asked 3+ questions and shared 0 personal stories",
      "Gave someone specific, sincere appreciation (not generic)",
      "Used someone's name intentionally in conversation",
      "Let someone fully finish speaking without interrupting",
      "Talked in terms of what the other person wanted, not what I wanted",
    ],
  },
  {
    bookId: 'small-talk',
    habits: [
      "Started 1 conversation with a genuine question (not 'how are you')",
      "Let someone finish speaking without planning my response",
      "Remembered and used 1 person's name in conversation",
      "Found a connection point in 1 conversation",
    ],
  },
  {
    bookId: 'never-split-the-difference',
    habits: [
      "Used mirroring in 1 conversation (repeated last 3 words as a question)",
      "Labeled someone's emotion before responding ('It seems like...')",
      "Let silence do the work after making a request",
      "Asked a calibrated question instead of making a demand ('How am I supposed to do that?')",
      "Avoided saying 'yes' as a fake commitment — got a real answer",
    ],
  },
];

export function getHabitsForBook(bookId: string): string[] {
  return BOOK_HABITS.find(b => b.bookId === bookId)?.habits || [];
}

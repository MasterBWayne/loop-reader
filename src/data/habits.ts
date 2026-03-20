export interface BookHabit {
  bookId: string;
  habits: string[];
}

export const BOOK_HABITS: BookHabit[] = [
  {
    bookId: 'stop-chasing',
    habits: [
      'Caught my inner roommate mid-narrative and said "I notice I\'m thinking" instead of engaging',
      'Sat with discomfort for 60 seconds without reaching for my phone or fixing something',
      'Did one thing today purely because I wanted to — not to prove anything',
      'Let a conversation end without trying to teach, fix, or optimize the other person',
    ],
  },
  {
    bookId: 'art-of-war-inner-battles',
    habits: [
      'Mapped one trigger before it fired — noticed the pattern before acting on it',
      'Did my hardest task during my peak energy window instead of wasting it on admin',
      'Removed one friction point from a good habit (or added one to a bad habit)',
      'Paused before reacting to a setback and asked "how can I use this?" first',
      'Made one decision I\'d been sitting on for more than a week',
    ],
  },
  {
    bookId: 'how-to-get-rich',
    habits: [
      'Spent at least 30 minutes building something I own (not someone else\'s asset)',
      'Said no to one thing that was comfortable but not moving me forward',
      'Had one conversation about money, deals, or business without flinching',
      'Identified one task I\'m doing that someone else could do 80% as well',
    ],
  },
  {
    bookId: 'win-friends',
    habits: [
      'Had 1 conversation where I asked 3+ questions and talked about myself 0 times',
      'Gave someone sincere, specific appreciation (not generic "good job")',
      'Remembered and used someone\'s name intentionally in conversation',
      'Let someone fully finish speaking without interrupting or loading my reply',
    ],
  },
  {
    bookId: 'small-talk',
    habits: [
      'Started one conversation with a stranger or acquaintance I\'d normally ignore',
      'Asked a follow-up question that went deeper than surface level',
      'Used an open-ended question instead of a yes/no question in a conversation',
      'Exited a conversation gracefully instead of letting it die awkwardly',
    ],
  },
  {
    bookId: 'never-split-the-difference',
    habits: [
      'Mirrored someone\'s last 3 words in a conversation and noticed what they revealed',
      'Labeled an emotion out loud ("It seems like you\'re frustrated") instead of ignoring it',
      'Asked a calibrated "how" or "what" question instead of making a demand',
      'Held my position on something instead of splitting the difference to avoid discomfort',
    ],
  },
];

export function getHabitsForBook(bookId: string): string[] {
  return BOOK_HABITS.find(b => b.bookId === bookId)?.habits || [];
}

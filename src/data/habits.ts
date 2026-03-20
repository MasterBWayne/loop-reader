export interface BookHabit {
  bookId: string;
  habits: { id: string; habitText: string; frequency: 'daily' | 'weekly' }[];
}

export const BOOK_HABITS: BookHabit[] = [
  {
    bookId: 'stop-chasing',
    habits: [
      { id: 'sc-1', habitText: "Caught myself in a mental loop and named it without believing it", frequency: 'daily' },
      { id: 'sc-2', habitText: "Initiated 0 unnecessary contact when feeling anxious", frequency: 'daily' },
      { id: 'sc-3', habitText: "Let someone else fill the silence instead of over-explaining", frequency: 'daily' },
      { id: 'sc-4', habitText: "Did 1 thing for myself without seeking validation", frequency: 'daily' },
    ],
  },
  {
    bookId: 'art-of-war-inner-battles',
    habits: [
      { id: 'aw-1', habitText: "Observed my reactions without acting on them for 10+ minutes", frequency: 'daily' },
      { id: 'aw-2', habitText: "Identified 1 battle not worth fighting and let it go", frequency: 'weekly' },
      { id: 'aw-3', habitText: "Structured my environment to make the right choice automatic", frequency: 'weekly' },
      { id: 'aw-4', habitText: "Read a situation by actions, not just words", frequency: 'daily' },
    ],
  },
  {
    bookId: 'how-to-get-rich',
    habits: [
      { id: 'htgr-1', habitText: "Identified and delegated 1 low-leverage task", frequency: 'weekly' },
      { id: 'htgr-2', habitText: "Protected my peak focus hours from interruptions", frequency: 'daily' },
      { id: 'htgr-3', habitText: "Said no to 1 good-but-not-great opportunity", frequency: 'weekly' },
      { id: 'htgr-4', habitText: "Moved toward ownership — worked ON the business, not just IN it", frequency: 'daily' },
    ],
  },
  {
    bookId: 'win-friends',
    habits: [
      { id: 'wf-1', habitText: "Had 1 conversation where I asked 3+ questions and shared 0 personal stories", frequency: 'daily' },
      { id: 'wf-2', habitText: "Gave someone specific, sincere appreciation (not generic)", frequency: 'daily' },
      { id: 'wf-3', habitText: "Used someone's name intentionally in conversation", frequency: 'daily' },
      { id: 'wf-4', habitText: "Let someone fully finish speaking without interrupting", frequency: 'daily' },
      { id: 'wf-5', habitText: "Talked in terms of what the other person wanted, not what I wanted", frequency: 'daily' },
    ],
  },
  {
    bookId: 'small-talk',
    habits: [
      { id: 'st-1', habitText: "Started 1 conversation with a genuine question (not 'how are you')", frequency: 'daily' },
      { id: 'st-2', habitText: "Let someone finish speaking without planning my response", frequency: 'daily' },
      { id: 'st-3', habitText: "Remembered and used 1 person's name in conversation", frequency: 'daily' },
      { id: 'st-4', habitText: "Found a connection point in 1 conversation", frequency: 'daily' },
    ],
  },
  {
    bookId: 'never-split-the-difference',
    habits: [
      { id: 'ns-1', habitText: "Used mirroring in 1 conversation (repeated last 3 words as a question)", frequency: 'daily' },
      { id: 'ns-2', habitText: "Labeled someone's emotion before responding ('It seems like...')", frequency: 'daily' },
      { id: 'ns-3', habitText: "Let silence do the work after making a request", frequency: 'daily' },
      { id: 'ns-4', habitText: "Asked a calibrated question instead of making a demand ('How am I supposed to do that?')", frequency: 'daily' },
      { id: 'ns-5', habitText: "Avoided saying 'yes' as a fake commitment — got a real answer", frequency: 'weekly' },
    ],
  },
];

export function getHabitsForBook(bookId: string): string[] {
  return BOOK_HABITS.find(b => b.bookId === bookId)?.habits.map(h => h.habitText) || [];
}

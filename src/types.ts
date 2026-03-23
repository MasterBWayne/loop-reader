// Extended Chapter type used by newer book data files
// The canonical Chapter interface lives in src/data/books.ts
export interface Chapter {
  // Old-format fields
  number?: number;
  exerciseQuestion?: string;
  
  // New-format fields
  id?: string;
  bookId?: string;
  chapterNumber?: number;
  keyConcepts?: string[];
  estimatedMinutes?: number;
  exercises?: { id: string; chapterId: string; prompt: string; exerciseType: string }[];
  
  // Shared
  title: string;
  content: string;
}

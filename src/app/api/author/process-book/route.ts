import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// pdf-parse loaded dynamically to avoid bundling canvas/DOM polyfills at build time
async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    const title = formData.get('title') as string;
    const subtitle = formData.get('subtitle') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const coverColor = formData.get('coverColor') as string;
    const price = parseInt(formData.get('price') as string || '0', 10);
    const authorId = formData.get('authorId') as string;
    
    const file = formData.get('file') as File | null;
    let fullText = formData.get('text') as string || '';

    if (!title || !author || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      fullText = await parsePdf(buffer);
    }

    if (!fullText.trim()) {
      return NextResponse.json({ error: 'No text extracted' }, { status: 400 });
    }

    const { data: book, error: bookError } = await supabase.from('books').insert({
      title,
      subtitle: subtitle || null,
      author,
      description,
      category,
      cover_color: coverColor,
      price,
      author_id: authorId,
      status: 'processing',
      is_author_upload: true,
      copyright_declaration_timestamp: new Date().toISOString()
    }).select('id').single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Failed to create book: ' + (bookError?.message || 'Unknown error') }, { status: 500 });
    }

    const bookId = book.id;

    // Simple chapter extraction heuristic
    const chapterRegex = /(?:^|\n)(?:chapter\s+\d+|[1-9]\d*\.)[^\n]*/gi;
    let chapters = [];
    let match;
    let tempMatches = [];
    
    while ((match = chapterRegex.exec(fullText)) !== null) {
      tempMatches.push({ index: match.index, title: match[0].trim() });
    }

    if (tempMatches.length === 0) {
      chapters.push({
        number: 1,
        title: title,
        content: fullText.trim()
      });
    } else {
      let chapterNum = 1;
      for (let i = 0; i < tempMatches.length; i++) {
        const start = tempMatches[i].index;
        const end = i < tempMatches.length - 1 ? tempMatches[i+1].index : fullText.length;
        
        let content = fullText.substring(start, end).trim();
        if (content.startsWith(tempMatches[i].title)) {
          content = content.substring(tempMatches[i].title.length).trim();
        }

        if (content.length > 50) {
          chapters.push({
            number: chapterNum++,
            title: tempMatches[i].title,
            content: content
          });
        }
      }
      
      // If the heuristic failed and created no chapters, use full text
      if (chapters.length === 0) {
        chapters.push({ number: 1, title: title, content: fullText.trim() });
      }
    }

    const processedChapters = [];
    
    for (const ch of chapters) {
      const prompt = `
You are an expert reading companion AI. I am going to give you a chapter from a book.
Please analyze it and provide three things in JSON format:
1. "summary": A 2-3 sentence summary of the chapter.
2. "exercise_question": A single reflection/exercise question for the reader to apply the chapter's lesson.
3. "core_lesson": A one-sentence core lesson or takeaway.

Chapter Content:
${ch.content.substring(0, 10000)} // truncate to avoid token limits

Return ONLY valid JSON like this:
{
  "summary": "...",
  "exercise_question": "...",
  "core_lesson": "..."
}
`;

      let summary = 'Summary generation failed.';
      let exercise_question = 'What did you learn from this chapter?';
      let core_lesson = 'Core lesson generation failed.';

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { temperature: 0.3 }
        });
        
        const text = String(response.text ?? '') || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          summary = parsed.summary || summary;
          exercise_question = parsed.exercise_question || exercise_question;
          core_lesson = parsed.core_lesson || core_lesson;
        }
      } catch (err) {
        console.error('Gemini processing failed for chapter', ch.number, err);
      }

      processedChapters.push({
        book_id: bookId,
        chapter_number: ch.number,
        title: ch.title,
        content: ch.content,
        summary,
        exercise_question,
        core_lesson
      });
    }

    const { error: chaptersError } = await supabase.from('book_chapters').insert(processedChapters);
    if (chaptersError) {
      console.error('Failed to save chapters:', chaptersError);
    }

    await supabase.from('books').update({ status: 'live' }).eq('id', bookId);

    return NextResponse.json({ success: true, bookId });
  } catch (error: any) {
    console.error('Process Book API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}


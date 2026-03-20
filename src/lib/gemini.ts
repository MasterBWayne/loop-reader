import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface UserProfileContext {
  display_name?: string;
  age?: number;
  life_situation?: string;
  current_goals?: string;
  biggest_challenges?: string;
  relationship_status?: string;
  career_stage?: string;
}

export async function generatePersonalizedIntro(
  chapterTitle: string,
  chapterContent: string,
  intake: {
    struggle: string;
    duration: string;
    impact: string;
    tried: string;
    vision: string;
  },
  profile?: UserProfileContext,
  priorReflections?: { chapter: number; answer: string }[]
): Promise<string> {
  const prompt = `You are The Architect — a sharp, direct friend who read this person's journal AND this chapter and is connecting the dots for them.

CHAPTER: "${chapterTitle}"
CHAPTER CONTENT (first 800 chars): ${chapterContent.slice(0, 800)}

THEIR INTAKE (use their EXACT words and details, not paraphrases):
- Struggle: ${intake.struggle}
- Duration: ${intake.duration}
- Impact: ${intake.impact}
- Tried: ${intake.tried}
- Vision: ${intake.vision}

${profile ? `PROFILE: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. Situation: ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}${profile.biggest_challenges ? '. Challenges: ' + profile.biggest_challenges : ''}` : ''}

${priorReflections?.length ? `PRIOR REFLECTIONS (use these for deeper specificity):\n${priorReflections.map(r => `Ch${r.chapter}: "${r.answer.slice(0, 200)}"`).join('\n')}` : ''}

Write a 4-5 sentence personalized "For You" card. MANDATORY structure:
1. FIRST: Reference something SPECIFIC from their intake — quote their actual words or cite a concrete detail (e.g. "You said you've been dealing with X for Y years" or "You mentioned you tried Z and it didn't work"). NO vague paraphrasing.
2. THEN: Connect that specific detail directly to THIS chapter's core concept. Name the concept. Explain WHY their situation makes this chapter especially relevant to them.
3. FINALLY: Give ONE concrete action or reframe they can use TODAY that combines their situation + this chapter's idea. Be specific — who, what, when.

Rules:
- BANNED phrases: "journey", "resonate", "a life where", "vision that fuels", "intertwine", "align", "deeply"
- Do NOT summarize the chapter
- Do NOT write generic motivational statements
- Every sentence must contain a specific detail from THEIR intake or THIS chapter's concept
- Write in second person ("you")
- 70-100 words. Not a word fewer than 70.
- Sound like a smart friend connecting dots they missed, not a coach giving a pep talk`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 350,
    },
  });

  return response.text?.trim() || '';
}

export async function generateCompanionResponse(
  chapterTitle: string,
  chapterContentSnippet: string,
  userMessage: string,
  chatHistory: { role: string; content: string }[],
  intake?: {
    struggle: string;
    duration: string;
    impact: string;
    tried: string;
    vision: string;
  },
  profile?: UserProfileContext
): Promise<string> {
  const intakeContext = intake
    ? `\nReader context: They struggle with "${intake.struggle}" (${intake.duration}). Impact: "${intake.impact}". They've tried: "${intake.tried}". Their vision: "${intake.vision}".`
    : '';
  const profileContext = profile
    ? `\nReader profile: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}`
    : '';

  const historyText = chatHistory
    .slice(-6) // last 6 messages for context
    .map(m => `${m.role === 'user' ? 'Reader' : 'Companion'}: ${m.content}`)
    .join('\n');

  const prompt = `You are an AI reading companion for the book "Stop Chasing" by The Architect. You're helping someone read Chapter: "${chapterTitle}".

Chapter excerpt: ${chapterContentSnippet.slice(0, 800)}
${intakeContext}${profileContext}

Recent conversation:
${historyText}

Reader's new message: "${userMessage}"

Respond as a thoughtful companion who:
1. Actually engages with what they said (don't deflect with questions)
2. Connects their question/thought to the chapter content
3. If relevant, connects to their personal situation from intake
4. Asks ONE follow-up question only if it genuinely deepens the conversation
5. Keeps response under 80 words

Rules:
- No therapy-speak ("that's valid", "I hear you", "it's okay to feel")
- No summarizing the chapter back to them
- Sound like a sharp, thoughtful friend
- Use *italics* for emphasis sparingly`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.8,
      maxOutputTokens: 300,
    },
  });

  return response.text?.trim() || "I need a moment to think about that. Could you rephrase?";
}

export async function generateReflectionResponse(
  chapterTitle: string,
  questionText: string,
  answerText: string,
  profile?: UserProfileContext
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';

  const prompt = `You are The Architect, a personal development author who is deeply insightful and direct.

A reader just completed the reflection exercise for the chapter "${chapterTitle}".

Question asked: "${questionText}"
Their answer: "${answerText}"
${profileCtx}

Write a brief, warm response (3-4 sentences) that:
1. Acknowledges something specific they wrote (quote or reference a phrase)
2. Offers one deeper insight or reframe they might not have considered
3. Connects what they wrote to a broader pattern in their life
4. Ends with genuine encouragement, not platitudes

Rules:
- No therapy-speak ("that is valid", "I hear you")
- Sound like a sharp friend who sees them clearly
- Under 70 words
- Use *italics* for one key phrase`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.8, maxOutputTokens: 250 },
  });
  return response.text?.trim() || '';
}

export async function generateJourneySummary(
  bookTitle: string,
  reflections: { chapter_number: number; question_text: string; answer_text: string }[],
  profile?: UserProfileContext
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';

  const reflText = reflections.map(r => `Chapter ${r.chapter_number}: Q: "${r.question_text}" A: "${r.answer_text}"`).join('\n');

  const prompt = `You are The Architect. A reader has finished "${bookTitle}".

Here are their reflection answers from each chapter:
${reflText}
${profileCtx}

Write a personal journey summary (5-7 sentences) that:
1. Identifies the through-line across their answers (what pattern emerged?)
2. Names their core insight in one clear sentence
3. Acknowledges the growth visible from first chapter to last
4. Offers one forward-looking observation about where this leads
5. Closes with something that makes them feel the work was worth it

Rules:
- Speak directly to them ("you")
- Reference specific things they wrote
- No generic self-help conclusions
- Sound like a mentor who watched them evolve in real time
- Under 120 words`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 400 },
  });
  return response.text?.trim() || '';
}

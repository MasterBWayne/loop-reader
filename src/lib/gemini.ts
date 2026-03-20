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

${profile ? `\nWHO THEY ARE (use this to translate the chapter's examples into THEIR world):
- Age: ${profile.age || 'unknown'}
- Career: ${profile.career_stage || 'unknown'}
- Relationship: ${profile.relationship_status || 'unknown'}
- Life situation: ${profile.life_situation || 'unknown'}
- Goals: ${profile.current_goals || 'unknown'}
- Challenges: ${profile.biggest_challenges || 'unknown'}` : ''}

${priorReflections?.length ? `PRIOR REFLECTIONS (use these for deeper specificity):\n${priorReflections.map(r => `Ch${r.chapter}: "${r.answer.slice(0, 200)}"`).join('\n')}` : ''}

Write a 4-5 sentence personalized "For You" card. MANDATORY structure:
1. FIRST: Reference something SPECIFIC from their intake — quote their actual words or cite a concrete detail (e.g. "You said you've been dealing with X for Y years" or "You mentioned you tried Z and it didn't work"). NO vague paraphrasing.
2. THEN: TRANSLATE this chapter's core concept into THEIR specific life context. Do NOT use the book's generic examples. Rewrite the example using their actual situation. If they're an MBA student in Bangkok, use that. If they manage rental properties, use that. If they struggle with anxious attachment, use that. The chapter talks about hostage negotiation? Translate it to their tenant dispute or their relationship pattern.
3. FINALLY: Give ONE concrete action they can take THIS WEEK in their specific situation. Name the person, the context, the exact move. Not "try being more present" — more like "Next time [their partner] goes quiet, mirror their last sentence back instead of filling the silence."

Rules:
- BANNED phrases: "journey", "resonate", "a life where", "vision that fuels", "intertwine", "align", "deeply"
- Do NOT use the book's original examples — ALWAYS rewrite them using the reader's life
- Do NOT write generic motivational statements
- Every sentence must contain a specific detail from THEIR life or THIS chapter's concept
- Write in second person ("you")
- 80-120 words
- Sound like a smart friend who knows their life AND read the book, connecting dots they missed`;

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
    ? `\nReader's struggle: "${intake.struggle}" (${intake.duration}). Impact: "${intake.impact}". Tried: "${intake.tried}". Vision: "${intake.vision}".`
    : '';
  const profileContext = profile
    ? `\nReader's life: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}${profile.biggest_challenges ? '. Challenges: ' + profile.biggest_challenges : ''}`
    : '';

  const historyText = chatHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'Reader' : 'Companion'}: ${m.content}`)
    .join('\n');

  const prompt = `You are an AI reading companion for a book by The Architect. You're helping someone read Chapter: "${chapterTitle}".

Chapter excerpt: ${chapterContentSnippet.slice(0, 800)}
${intakeContext}${profileContext}

Recent conversation:
${historyText}

Reader's new message: "${userMessage}"

CRITICAL INSTRUCTION: You know this reader's real life situation. When explaining concepts from the chapter, ALWAYS translate them into examples from THEIR life — their career, their relationships, their challenges. Never use the book's generic examples. If the book talks about negotiating with hostage-takers, you rewrite it as their specific situation (e.g. negotiating with a difficult tenant, handling a conflict with their partner, navigating their MBA cohort).

Respond as a thoughtful companion who:
1. Actually engages with what they said (don't deflect with questions)
2. Connects their question/thought to the chapter content using THEIR life as the example
3. References their specific situation from intake/profile when relevant
4. Asks ONE follow-up question only if it genuinely deepens the conversation
5. Keeps response under 100 words

Rules:
- No therapy-speak ("that's valid", "I hear you", "it's okay to feel")
- No summarizing the chapter back to them
- Sound like a sharp friend who knows their life
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

// ── Accountability Loop ────────────────────────────────────────────────

export async function generateCommitmentFollowUp(
  commitmentText: string,
  chapterTitle: string,
  outcomeText: string,
  profile?: UserProfileContext
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';

  const prompt = `You are The Architect. A reader made a commitment after reading "${chapterTitle}":

Their commitment: "${commitmentText}"
What happened: "${outcomeText}"
${profileCtx}

Write a brief response (3-4 sentences) that:
1. Acknowledges what they actually did (or didn't do — no judgment either way)
2. If they followed through: name what that says about them and reinforce the pattern
3. If they didn't: gently explore what got in the way without shaming, and suggest a smaller version
4. Connect it back to the chapter's core idea

Rules:
- No therapy-speak
- No generic "great job!" — be specific about what they did
- Under 60 words
- Sound like a friend who remembers what you promised and actually checks in`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 200 },
  });
  return response.text?.trim() || '';
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

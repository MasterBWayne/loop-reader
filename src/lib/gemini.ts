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
  const prompt = `You are a deeply insightful personal development author writing under the pen name "The Architect." Your voice is: direct, warm but not soft, zero therapy-speak, zero generic advice. You sound like a brilliant friend who sees people clearly.

A reader is about to read Chapter: "${chapterTitle}"

Here's what they shared about themselves:
- Biggest struggle: ${intake.struggle}
- How long: ${intake.duration}
- Impact on life: ${intake.impact}
- What they've tried: ${intake.tried}
- Ideal life vision: ${intake.vision}

${profile ? `\nReader profile: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. Situation: ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}${profile.biggest_challenges ? '. Challenges: ' + profile.biggest_challenges : ''}` : ''}

${priorReflections?.length ? `\nPrior chapter reflections from this reader:\n${priorReflections.map(r => `Ch${r.chapter}: "${r.answer.slice(0, 150)}"`).join('\n')}` : ''}

The chapter covers this content (first 500 chars): ${chapterContent.slice(0, 500)}

Write a 2-3 sentence personalized opening that:
1. Acknowledges their specific situation (reference their words, not generic)
2. Creates a bridge from where they are to what this chapter will show them
3. Makes them feel seen without being condescending

Rules:
- Do NOT use "I understand" or "you're not alone" or any therapy platitudes
- Do NOT summarize the chapter
- Write in second person ("you")
- Keep it under 60 words
- Sound like a person, not a bot`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: {
      temperature: 0.7,
      maxOutputTokens: 200,
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

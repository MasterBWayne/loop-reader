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
  const prompt = `You are the ReadKindled AI companion — a sharp, direct friend who read this person's journal AND this chapter and is connecting the dots for them.

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
    readingStyle?: 'direct' | 'warm' | 'balanced';
  },
  profile?: UserProfileContext
): Promise<string> {
  const styleInstruction = intake?.readingStyle === 'direct'
    ? '\nCOACHING STYLE: Be direct, practical, action-oriented. Cut to the point. No hand-holding.'
    : intake?.readingStyle === 'warm'
    ? '\nCOACHING STYLE: Be gentle, reflective, empathetic. Explore what\'s underneath. Hold space before pushing.'
    : '\nCOACHING STYLE: Balance practical advice with emotional reflection. Read the room — sometimes push, sometimes hold.';
  const intakeContext = intake
    ? `\nReader's struggle: "${intake.struggle}" (${intake.duration}). Impact: "${intake.impact}". Tried: "${intake.tried}". Vision: "${intake.vision}".${styleInstruction}`
    : '';
  const profileContext = profile
    ? `\nReader's life: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}${profile.biggest_challenges ? '. Challenges: ' + profile.biggest_challenges : ''}`
    : '';

  const historyText = chatHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'Reader' : 'Companion'}: ${m.content}`)
    .join('\n');

  const prompt = `You are an AI reading companion for ReadKindled. You're helping someone read Chapter: "${chapterTitle}".

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

// ── Maintenance Mode ───────────────────────────────────────────────────

export async function generateMaintenanceResponse(
  chapterTitle: string,
  rating: number,
  reflection: string,
  profile?: UserProfileContext,
  intake?: { struggle: string; vision: string; impact: string }
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';
  const intakeCtx = intake?.struggle
    ? `\nUser context: This person is working on: ${intake.struggle}. Their vision: ${intake.vision}. Always connect your response to their specific situation.`
    : '';

  const prompt = `You are the ReadKindled AI companion doing a weekly check-in with a reader who finished a book.
${intakeCtx}
The principle from "${chapterTitle}" was revisited this week.
Their self-rating: ${rating}/10
${reflection ? `Their reflection: "${reflection}"` : 'No reflection provided.'}
${profileCtx}

Write a 1-2 sentence response:
- If rating 1-4: encouraging reframe — name what's hard about this specific principle and give them a smaller version to try
- If rating 5-7: acknowledge the effort, point out what partial practice still teaches them
- If rating 8-10: reinforce the win — name specifically what practicing this principle is building in them

Rules:
- Under 40 words
- No therapy-speak
- Reference the specific principle, not generic encouragement
- Sound like a coach who remembers what they're working on`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 120 },
  });
  return response.text?.trim() || '';
}

// ── Accountability Loop ────────────────────────────────────────────────

export async function generateCommitmentFollowUp(
  commitmentText: string,
  chapterTitle: string,
  outcomeText: string,
  profile?: UserProfileContext,
  intake?: { struggle: string; vision: string; impact: string }
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';
  const intakeCtx = intake?.struggle
    ? `\nUser context: This person is working on: ${intake.struggle}. Their vision: ${intake.vision}. Always connect your response to their specific situation.`
    : '';

  const prompt = `You are the ReadKindled AI companion. A reader made a commitment after reading "${chapterTitle}":
${intakeCtx}
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
  profile?: UserProfileContext,
  intake?: { struggle: string; vision: string; impact: string }
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';
  const intakeCtx = intake?.struggle
    ? `\nUser context: This person is working on: ${intake.struggle}. Their vision: ${intake.vision}. Always connect your response to their specific situation.`
    : '';

  const prompt = `You are the ReadKindled AI companion, a personal development author who is deeply insightful and direct.
${intakeCtx}
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

  const prompt = `You are the ReadKindled AI companion. A reader has finished "${bookTitle}".

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

// ── Journey Tab Upgrades ───────────────────────────────────────────────

export async function generateWeeklyInsight(
  reflections: { bookTitle: string; chapterTitle: string; answer_text: string }[]
): Promise<{ insight: string; linked_book_id?: string; linked_chapter_number?: number }> {
  if (reflections.length === 0) return { insight: "You haven't written any reflections this week. Read a chapter and share your thoughts to start finding patterns." };

  const reflText = reflections.map((r, i) => `[Entry ${i+1}] Book: ${r.bookTitle} | Chapter: ${r.chapterTitle} | Answer: "${r.answer_text}"`).join('\n');

  const prompt = `You are an AI pattern-recognition engine analyzing a user's journal entries from the last 7 days.
Here are their recent reflections:
${reflText}

Task: Identify a recurring theme or pattern in their answers.
Generate a 2-3 sentence insight starting with something like "In X exercises this week, you mentioned..." or "A pattern is emerging around..."
Then, optionally suggest one of the chapters they reflected on to revisit.

Output format MUST be a valid JSON object:
{
  "insight": "The 2-3 sentence insight text.",
  "linkedBookTitle": "Exact book title to revisit (or null)",
  "linkedChapterTitle": "Exact chapter title to revisit (or null)"
}
Return ONLY the JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 200 },
  });
  
  try {
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    const parsed = JSON.parse(text);
    return { 
      insight: parsed.insight || "Keep reflecting to reveal deeper patterns.", 
      linked_book_id: parsed.linkedBookTitle, 
      linked_chapter_number: parsed.linkedChapterTitle 
    };
  } catch (e) {
    return { insight: "You're building momentum! Keep reflecting to reveal deeper patterns across your reading." };
  }
}

export async function categorizeReflectionTags(answerText: string): Promise<string[]> {
  const prompt = `Categorize the following reflection answer into exactly 1 or 2 of these tags: Anxiety, Negotiation, Focus, Relationships, Money, Identity, Habits.
If none fit perfectly, pick the closest one.
Answer: "${answerText}"

Output format MUST be a valid JSON array of strings, e.g. ["Focus", "Habits"]. Return ONLY the JSON array.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.1, maxOutputTokens: 50 },
  });

  try {
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const tags = JSON.parse(text);
    const validTags = ["Anxiety", "Negotiation", "Focus", "Relationships", "Money", "Identity", "Habits"];
    return tags.filter((t: string) => validTags.includes(t)).slice(0, 2);
  } catch (e) {
    return [];
  }
}

// ── Active Recall Gate ────────────────────────────────────────────────

export async function evaluateActiveRecall(
  userResponse: string,
  chapterTitle: string,
  chapterContent: string,
  exerciseQuestion?: string
): Promise<{ understood: boolean; feedback: string; missed: string }> {
  const prompt = `You are evaluating whether a reader grasped the core idea of a book chapter.

CHAPTER: "${chapterTitle}"
CHAPTER CONTENT (first 1200 chars): ${chapterContent.slice(0, 1200)}
${exerciseQuestion ? `EXERCISE QUESTION: "${exerciseQuestion}"` : ''}

READER'S RECALL RESPONSE: "${userResponse}"

Task: Evaluate whether they captured the chapter's CORE idea. They don't need perfect recall — just evidence they understood the main concept, not surface-level or tangential points.

Output MUST be valid JSON:
{
  "understood": true/false,
  "feedback": "1-2 sentences. If understood: brief positive acknowledgment of what they got right. If not: gentle note about what their response focused on.",
  "missed": "If understood: empty string. If not: 1 sentence describing the core idea they missed, stated simply and directly."
}
Return ONLY the JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.3, maxOutputTokens: 200 },
  });

  try {
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(text);
  } catch {
    return { understood: true, feedback: 'Thanks for reflecting on this chapter.', missed: '' };
  }
}

// ── Adaptive Check-in Follow-up ──────────────────────────────────────

export async function generateAdaptiveFollowup(
  chapterTitle: string,
  blockerDescription: string,
  profile?: UserProfileContext
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}`
    : '';

  const prompt = `You are the ReadKindled AI companion. A reader admitted they didn't practice the principle from "${chapterTitle}" this week.

What got in their way: "${blockerDescription}"
${profileCtx}

Give them a SMALLER, more achievable version of the practice. Something they could do in under 5 minutes, today, with zero preparation.

Rules:
- 2-3 sentences max
- Name the specific micro-action (not "try to be more mindful" — more like "set one phone alarm labeled 'notice the roommate' at 2pm")
- Acknowledge the blocker without judgment
- Sound like a coach adjusting the workout, not lowering the bar`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 150 },
  });
  return response.text?.trim() || 'Start even smaller: pick one moment today to pause and notice.';
}

// ── Living Summary (Personal Narrative) ──────────────────────────────

export async function generatePersonalSummary(
  bookTitle: string,
  reflections: { chapter_number: number; question_text: string; answer_text: string }[],
  checkins: { chapter_number: number; rating: number; reflection?: string }[],
  profile?: UserProfileContext
): Promise<string> {
  const profileCtx = profile
    ? `\nReader: ${profile.age ? profile.age + 'yo' : ''}${profile.career_stage ? ', ' + profile.career_stage : ''}${profile.relationship_status ? ', ' + profile.relationship_status : ''}${profile.life_situation ? '. ' + profile.life_situation : ''}${profile.current_goals ? '. Goals: ' + profile.current_goals : ''}`
    : '';

  const reflText = reflections.map(r => `Ch${r.chapter_number}: Q: "${r.question_text}" A: "${r.answer_text}"`).join('\n');
  const checkinText = checkins.length > 0
    ? '\nCheck-in history:\n' + checkins.map(c => `Ch${c.chapter_number}: ${c.rating}/10${c.reflection ? ` — "${c.reflection}"` : ''}`).join('\n')
    : '';

  const prompt = `Based on these responses from a reader of "${bookTitle}", write a 300-word personal narrative in second person ("you") summarizing what this book meant to them, what they discovered about themselves, and what changed. Use their actual words and insights. Make it feel like their personal story with this book.

THEIR REFLECTIONS:
${reflText}
${checkinText}
${profileCtx}

Rules:
- Write in second person ("you")
- Quote their actual phrases (use italics with *)
- Structure: what they came in with → what the book revealed → what shifted → where they're heading
- No generic self-help conclusions — every sentence should reference something THEY wrote
- Sound like a biographer who captured their transformation
- Exactly 250-300 words`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.8, maxOutputTokens: 600 },
  });
  return response.text?.trim() || '';
}

export async function generateFlashbackReframe(answerText: string): Promise<{ reframe: string; microStep: string }> {
  const prompt = `A user is revisiting an old journal reflection from over 30 days ago. They admitted they have NOT YET applied what they learned.
Their original reflection: "${answerText}"

Task: Provide a gentle reframe and a 1-action micro-step to help them get unstuck.
Output format MUST be a valid JSON object:
{
  "reframe": "1 sentence normalizing the delay and reframing it.",
  "microStep": "1 tiny, immediate action they can take today."
}
Return ONLY the JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.7, maxOutputTokens: 150 },
  });

  try {
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    return JSON.parse(text);
  } catch (e) {
    return { reframe: "It's normal to need time to process before acting.", microStep: "Pick just one sentence from this reflection to keep in mind today." };
  }
}


// ── Spaced Repetition Card Generation ───────────────────────────────

export async function generateReviewCards(
  chapterTitle: string,
  chapterContent: string,
  exerciseQuestion: string
): Promise<{ question: string; correct_answer: string }[]> {
  const prompt = `You are generating spaced repetition review cards for a self-improvement book chapter.

CHAPTER: "${chapterTitle}"
CONTENT (first 2000 chars): ${chapterContent.slice(0, 2000)}
EXERCISE: "${exerciseQuestion}"

Generate exactly 3 review cards that test the reader's understanding of the KEY CONCEPTS. Each card should:
- Test a different core idea from the chapter
- Be answerable in 1-3 sentences
- Focus on practical understanding, not trivia
- Be phrased as a question the reader could answer from memory

Output MUST be a valid JSON array:
[
  { "question": "...", "correct_answer": "..." },
  { "question": "...", "correct_answer": "..." },
  { "question": "...", "correct_answer": "..." }
]

The correct_answer should be a concise, clear answer (1-2 sentences). Return ONLY the JSON array.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: prompt,
    config: { temperature: 0.4, maxOutputTokens: 500 },
  });

  try {
    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const cards = JSON.parse(text);
    if (Array.isArray(cards) && cards.length > 0) return cards;
    return [];
  } catch {
    return [];
  }
}

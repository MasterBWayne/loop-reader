import { Chapter } from '../types';

const BOOK_ID = 'when-body-says-no';

export const WHEN_BODY_SAYS_NO_CHAPTERS: Chapter[] = [
  {
    id: `${BOOK_ID}-ch1`,
    bookId: BOOK_ID,
    chapterNumber: 0,
    title: 'The Mind-Body Unity',
    content: `**The Illusion of Separation**
Western medicine has long operated under a fatal delusion: the belief that the mind and the body are entirely separate entities. We treat physical illnesses as isolated mechanical breakdowns, ignoring the profound psychological environment in which those illnesses develop. The truth is that the brain, the immune system, and the endocrine system are deeply intertwined, communicating constantly through a complex network of hormones and neurotransmitters.

**The Biology of Belief**
Our emotional states are not just fleeting, abstract experiences; they are profound physiological events. When we experience chronic fear, deep resentment, or an overwhelming need to please others, our bodies physically react. The emotional suppression required to maintain a facade of "niceness" or extreme capability sends powerful, continuous stress signals throughout our entire biological system, altering how our cells actually function.

**Listening to the Symptoms**
When we consistently ignore our emotional needs, our bodies will eventually force the issue. A physical symptom—whether it is chronic fatigue, an autoimmune flare-up, or a severe illness—is rarely a random tragedy. It is often the body's desperate, final attempt to communicate that our current way of living is unsustainable. The body says "no" when our minds refuse to.`,
    keyConcepts: ['Psychoneuroimmunology', 'Emotional suppression as physical stress', 'Symptoms as communication'],
    estimatedMinutes: 5,
    exercises: [
      {
        id: `${BOOK_ID}-ch1-ex1`,
        chapterId: `${BOOK_ID}-ch1`,
        prompt: 'Think of a time when you were under immense emotional or psychological stress. Did your body manifest any physical symptoms (like a cold, back pain, or exhaustion) shortly afterward?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch2`,
    bookId: BOOK_ID,
    chapterNumber: 1,
    title: 'The Cost of Hidden Stress',
    content: `**The Normalization of Strain**
We live in a culture that not only ignores chronic stress but actively rewards it. We praise the people who never say no, who work themselves to the bone, and who never complain about the heavy burdens they carry. Because this extreme overexertion is socially validated, we often fail to recognize it as stress at all. We normalize our exhaustion, mistaking our high tolerance for pain as a sign of strength.

**The Physiology of the Fight-or-Flight Response**
When we perceive a threat, our bodies release a cascade of stress hormones, including cortisol and adrenaline, preparing us to fight or flee. This is a brilliant survival mechanism for acute emergencies. However, when we are trapped in toxic relationships, deeply unfulfilling jobs, or relentless self-criticism, this stress response remains constantly activated. Our bodies are essentially locked in a state of perpetual emergency.

**The Exhaustion of the Immune System**
Over time, this chronic flood of stress hormones wreaks havoc on the body. It elevates blood pressure, disrupts digestion, and, crucially, suppresses the immune system. When the immune system is chronically exhausted by psychological stress, it becomes unable to fight off disease, or worse, it becomes confused and begins to attack the body's own healthy tissues. Hidden stress is the silent architect of chronic illness.`,
    keyConcepts: ['Normalized overexertion', 'Chronic stress response', 'Immune system suppression'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch2-ex1`,
        chapterId: `${BOOK_ID}-ch2`,
        prompt: 'What is one area of your life where you are chronically overextending yourself, but convincing yourself that "it\'s fine" because you are capable of handling it?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch3`,
    bookId: BOOK_ID,
    chapterNumber: 2,
    title: 'The Repression of Emotion',
    content: `**The "Nice" Personality**
There is a specific personality profile that frequently correlates with chronic illness: the compulsive caregiver. These are the individuals who are excessively "nice," who chronically put the needs of others before their own, and who have a profound inability to express negative emotions, particularly anger. They believe that their worth is entirely dependent on being useful, agreeable, and undemanding.

**The Toxicity of Unfelt Anger**
Anger is a vital, protective emotion. It is the biological boundary that alerts us when we are being violated or when our needs are being ignored. When we repress anger because we are terrified of conflict or rejection, that aggressive energy does not simply vanish. It turns inward. Repressed anger creates massive internal tension, slowly poisoning the very physiological systems designed to protect us.

**The Tragedy of Extreme Capability**
The most capable people are often the ones most at risk. Because they never ask for help and never show weakness, the people around them assume they are fine. They become isolated in their competence, carrying the emotional weight of everyone around them while systematically ignoring the desperate, pleading signals of their own bodies.`,
    keyConcepts: ['Compulsive caregiving', 'Repressed anger', 'The isolation of capability'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch3-ex1`,
        chapterId: `${BOOK_ID}-ch3`,
        prompt: 'When someone crosses a boundary or asks too much of you, do you allow yourself to feel and express irritation, or do you immediately suppress it and try to be accommodating?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch4`,
    bookId: BOOK_ID,
    chapterNumber: 3,
    title: 'Boundaries and Disease',
    content: `**The Architecture of Self**
A healthy psychological boundary is the invisible line that separates your needs, feelings, and responsibilities from those of everyone else. It is the ability to say "no" without crippling guilt. When psychological boundaries are weak or nonexistent, we constantly absorb the stress and chaos of our environment. We do not know where we end and the rest of the world begins.

**The Immune System as a Boundary**
The psychological boundary has a direct physical counterpart: the immune system. The immune system's primary job is to distinguish "self" from "non-self" and to destroy any foreign invaders that threaten the organism. When our psychological boundaries collapse—when we constantly betray ourselves to please others—the immune system often becomes confused. It either fails to recognize external threats, or it mistakenly identifies our own tissues as the enemy.

**Reclaiming Your Space**
Healing requires the terrifying work of rebuilding these boundaries. It means learning to tolerate the disappointment of others. It means prioritizing your own biological need for rest over the endless demands of your family, your employer, and your own perfectionism. Saying "no" to the world is often the only way to say "yes" to your own survival.`,
    keyConcepts: ['Psychological boundaries', 'The immune system as "self"', 'The guilt of saying no'],
    estimatedMinutes: 5,
    exercises: [
      {
        id: `${BOOK_ID}-ch4-ex1`,
        chapterId: `${BOOK_ID}-ch4`,
        prompt: 'Identify one specific relationship or obligation where you currently have weak boundaries. What is one small, clear "no" you need to communicate this week to protect your energy?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch5`,
    bookId: BOOK_ID,
    chapterNumber: 4,
    title: 'The Seven A\'s of Healing',
    content: `**The Path to Wholeness**
Healing from chronic stress and illness requires a fundamental shift in how we relate to ourselves. It begins with Acceptance—the willingness to acknowledge our current reality, including our physical limitations and our emotional pain, without judgment. Next is Awareness, the rigorous practice of paying attention to our body's subtle signals before they escalate into screaming symptoms.

**Anger, Autonomy, and Attachment**
We must reclaim our Anger, recognizing it as a necessary, protective force that defines our boundaries. We must assert our Autonomy, refusing to let our lives be dictated by the expectations and demands of others. Crucially, we must also examine our Attachments, seeking out relationships that are built on mutual respect and genuine connection, rather than desperately clinging to toxic dynamics out of fear.

**Assertion and Affirmation**
Finally, we practice Assertion—the courage to express our true selves, our real needs, and our authentic limits to the world. And we cultivate Affirmation, making a daily, conscious commitment to our own creative urges, our own joy, and our own right to exist simply for ourselves. Healing is not just the absence of disease; it is the profound, unapologetic reclamation of the self.`,
    keyConcepts: ['Acceptance and Awareness', 'Reclaiming anger and autonomy', 'Authentic assertion'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch5-ex1`,
        chapterId: `${BOOK_ID}-ch5`,
        prompt: 'Look at the "Seven A\'s" (Acceptance, Awareness, Anger, Autonomy, Attachment, Assertion, Affirmation). Which one feels the most difficult or unnatural for you to practice, and why?',
        exerciseType: 'reflection'
      }
    ]
  }
];
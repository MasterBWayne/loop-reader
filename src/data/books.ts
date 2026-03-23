import { ART_OF_WAR_CHAPTERS } from './art-of-war';
import { HOW_TO_GET_RICH_CHAPTERS } from './how-to-get-rich';
import { WIN_FRIENDS_CHAPTERS } from './win-friends';
import { SMALL_TALK_CHAPTERS } from './small-talk';
import { NEVER_SPLIT_CHAPTERS } from './never-split';
import { FOUR_AGREEMENTS_CHAPTERS } from './four-agreements';
import { ATTACHED_CHAPTERS } from './attached';
import { MOUNTAIN_IS_YOU_CHAPTERS } from './mountain-is-you';
import { POWER_OF_NOW_CHAPTERS } from './power-of-now';
import { THINK_GROW_RICH_CHAPTERS } from './think-grow-rich';
import { ATOMIC_HABITS_CHAPTERS } from './atomic-habits';
import { SUBTLE_ART_CHAPTERS } from './subtle-art';
import { UNTETHERED_SOUL_CHAPTERS } from './untethered-soul';
import { MINDSET_CHAPTERS } from './mindset';
import { DEEP_WORK_CHAPTERS } from './deep-work';
import { SEVEN_HABITS_CHAPTERS } from './7-habits';
import { MAN_SEARCH_MEANING_CHAPTERS } from './man-search-meaning';
import { DARE_TO_LEAD_CHAPTERS } from './dare-to-lead';
import { GRIT_CHAPTERS } from './grit';
import { ESSENTIALISM_CHAPTERS } from './essentialism';
import { DARING_GREATLY_CHAPTERS } from './daring-greatly';
import { BODY_KEEPS_SCORE_CHAPTERS } from './body-keeps-score';
import { SIX_PILLARS_SELF_ESTEEM_CHAPTERS } from './six-pillars-self-esteem';
import { NO_MORE_MR_NICE_GUY_CHAPTERS } from './no-more-mr-nice-guy';
import { MODELS_CHAPTERS } from './models';
import { WAY_OF_SUPERIOR_MAN_CHAPTERS } from './way-of-superior-man';
import { TWELVE_RULES_LIFE_CHAPTERS } from './12-rules-life';
import { MEDITATIONS_CHAPTERS } from './meditations';
import { OBSTACLE_IS_WAY_CHAPTERS } from './obstacle-is-way';
import { EGO_IS_ENEMY_CHAPTERS } from './ego-is-enemy';
import { CANT_HURT_ME_CHAPTERS } from './cant-hurt-me';
import { MIRACLE_MORNING_CHAPTERS } from './miracle-morning';
import { IKIGAI_CHAPTERS } from './ikigai';
import { RICH_DAD_POOR_DAD_CHAPTERS } from './rich-dad-poor-dad';
import { PSYCHOLOGY_MONEY_CHAPTERS } from './psychology-money';
import { EMOTIONAL_INTELLIGENCE_CHAPTERS } from './emotional-intelligence';
import { GIFTS_OF_IMPERFECTION_CHAPTERS } from './gifts-of-imperfection';
import { FEELING_GOOD_CHAPTERS } from './feeling-good';
import { LOVE_LANGUAGES_CHAPTERS } from './love-languages';
import { NONVIOLENT_COMMUNICATION_CHAPTERS } from './nonviolent-communication';
import { BOUNDARIES_CHAPTERS } from './boundaries';
import { CODEPENDENT_NO_MORE_CHAPTERS } from './codependent-no-more';
import { ADULT_CHILDREN_CHAPTERS } from './adult-children';
import { RADICAL_ACCEPTANCE_CHAPTERS } from './radical-acceptance';
import { INFLUENCE_CHAPTERS } from './influence';
import { PREDICTABLY_IRRATIONAL_CHAPTERS } from './predictably-irrational';
import { DOPAMINE_NATION_CHAPTERS } from './dopamine-nation';
import { LOST_CONNECTIONS_CHAPTERS } from './lost-connections';
import { COURAGE_TO_BE_DISLIKED_CHAPTERS } from './courage-to-be-disliked';
import { MAN_ENOUGH_CHAPTERS } from './man-enough';
import { LOVING_WHAT_IS_CHAPTERS } from './loving-what-is';
import { SEAT_OF_SOUL_CHAPTERS } from './seat-of-soul';
import { WOMENS_BODIES_WISDOM_CHAPTERS } from './womens-bodies-wisdom';
import { LETTING_GO_CHAPTERS } from './letting-go';
import { MASTERY_CHAPTERS } from './mastery';
import { WHEN_BODY_SAYS_NO_CHAPTERS } from './when-body-says-no';

export interface Chapter {
  number: number;
  title: string;
  content: string;
  exerciseQuestion?: string; // reflection question at end of chapter
}

// Normalize chapters from new-format data files (with id/bookId/chapterNumber)
// into the canonical Chapter interface used by the reader
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeChapters(chapters: any[]): Chapter[] {
  return chapters.map((ch, i) => ({
    number: typeof ch.number === 'number' ? ch.number : (typeof ch.chapterNumber === 'number' ? ch.chapterNumber + 1 : i + 1),
    title: ch.title || `Chapter ${i + 1}`,
    content: ch.content || '',
    exerciseQuestion: ch.exerciseQuestion || (Array.isArray(ch.exercises) && ch.exercises[0]?.prompt) || undefined,
  }));
}

export type BookCategory = 'Self-Help' | 'Business' | 'Philosophy' | 'Relationships' | 'Psychology' | 'Spirituality' | 'Leadership' | 'Communication' | 'Negotiation' | 'Habits/Productivity';

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  author: string;
  bookNumber: number;
  description: string;
  readTime: string;
  category: BookCategory;
  tags: string[];
  featured: boolean;
  coverColor: string; // gradient accent for placeholder covers
  chapters: Chapter[];
  price?: number;
  is_author_upload?: boolean;
}

export const CATEGORIES: BookCategory[] = ['Self-Help', 'Business', 'Philosophy', 'Relationships', 'Psychology', 'Spirituality', 'Leadership', 'Communication', 'Negotiation', 'Habits/Productivity'];

export const BOOKS: Book[] = [
  {
    id: 'stop-chasing',
    title: 'Stop Chasing',
    subtitle: 'Book One',
    author: 'The Architect',
    bookNumber: 1,
    description: 'How to break free from the loops that keep high performers stuck \u2014 and find what the last 5% actually requires.',
    readTime: '~45 min read',
    category: 'Self-Help',
    tags: ['attachment', 'identity', 'high performers', 'meaning'],
    featured: true,
    coverColor: 'from-amber-600 to-orange-800',
    chapters: [
      {
        number: 1,
        title: 'The 95% Illusion',
    exerciseQuestion: 'What would you do with your time if you had nothing left to prove?',
        content: `You've done everything right.

The degree. The career. The apartment. The body. The travel. The friends. You checked every box that was supposed to make life feel complete.

And yet here you are at 2am, staring at the ceiling, wondering why it still doesn't feel like enough.

This is the 95% illusion \u2014 the belief that if you just accomplish the next thing, fill the next gap, optimize the next system, the restlessness will finally stop.

It won't.

Not because something is wrong with you. But because the last 5% isn't a checklist item. It can't be earned, optimized, or hacked. It requires something most high performers have never learned to do: stop performing.

**The Pattern**

Think about the last time you felt genuinely at peace. Not the dopamine hit of a completed project. Not the relief of a crisis averted. Actual peace \u2014 the kind where your mind goes quiet and you don't reach for your phone to fill the silence.

If you're struggling to remember, that's the signal.

High performers develop a specific addiction: the addiction to progress. Every problem is a puzzle. Every emotion is data. Every relationship is a system to optimize. And for a long time, this works. It gets you further than most people will ever go.

But eventually you hit a wall that systems can't solve. A loneliness that productivity can't fill. A hunger that achievement can't satisfy.

That wall is the entrance to the last 5%.

**The Uncomfortable Truth**

The things that got you to 95% \u2014 discipline, optimization, relentless execution \u2014 are precisely the things blocking the final 5%.

You can't optimize your way into love.
You can't discipline yourself into meaning.
You can't execute your way into peace.

This isn't a productivity problem. It's an identity problem. You've built your entire sense of self around being the person who figures things out. The person who handles it. The person who doesn't need help.

And now you're stuck \u2014 because the next level requires becoming someone who can receive, who can surrender, who can sit in uncertainty without immediately trying to solve it.

**Your First Exercise**

Before you turn to the next chapter, sit with this question for sixty seconds. Don't answer it. Don't analyze it. Just let it land:

*What would I do with my time if I had nothing left to prove?*

Write whatever comes up. Don't edit it. Don't judge it. This is the starting point.`,
      },
      {
        number: 2,
        title: 'You Are Not The Roommate',
    exerciseQuestion: 'How many times today did you catch yourself in a mental spiral? What was the loudest story your roommate told you?',
        content: `There's a voice in your head that never stops talking.

It narrates your day. It judges your decisions. It replays conversations from three years ago and rehearses ones that haven't happened yet. It tells you that you should have said something different, done something better, been someone else.

Michael Singer calls this voice "the roommate."

Imagine you had an actual roommate who talked to you the way your mind talks to you. Someone who followed you everywhere, commenting on everything, criticizing every choice, catastrophizing every outcome.

You'd move out.

But you can't move out of your own head \u2014 so most people do something worse. They believe the roommate is them.

**The Separation**

The most important distinction you'll ever make is this: you are not your thoughts. You are the one who hears them.

Read that again.

You are not the voice. You are the awareness behind the voice. You are the space in which thoughts arise, exist briefly, and dissolve \u2014 if you let them.

The problem isn't that the voice exists. The problem is that you've been taking orders from it for your entire life.

It says "you're not good enough" and you believe it, so you overwork.
It says "they'll leave you" and you believe it, so you over-function.
It says "you need to control this" and you believe it, so you build another system.

**The Practice**

The practice isn't complicated. It's just hard.

When the voice speaks, notice it. Don't argue with it. Don't try to replace it with a positive affirmation. Don't analyze why it's saying what it's saying.

Just notice.

"Ah, the roommate is talking again."

That's it. That tiny gap between the thought and your awareness of the thought is everything. In that gap lives your freedom.

Every time you notice without engaging, the gap gets wider. The voice gets quieter. Not because you silenced it \u2014 but because you stopped giving it your attention, which is the only fuel it has.

**Why This Matters For The 95%**

Your restlessness, your inability to feel satisfied, your constant drive for more \u2014 these aren't character traits. They're the roommate's script.

The roommate is terrified of stillness because stillness means it loses power. So it keeps you busy. It keeps you optimizing. It keeps you in the future or the past \u2014 anywhere but here, right now, where you might discover that you're already whole.

The last 5% begins the moment you stop obeying the voice and start observing it.

*Exercise: For the next 24 hours, every time you catch yourself in a mental spiral \u2014 judgment, worry, comparison \u2014 simply say internally: "I notice I'm thinking." Nothing more. Count how many times this happens. The number will surprise you.*`,
      },
      { number: 3, title: 'The Approval Addiction', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
      { number: 4, title: 'The Fair Exchange Audit', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
      { number: 5, title: 'Dissolving the Charge', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
      { number: 6, title: 'The Optimization Trap', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
      { number: 7, title: 'Breaking Anxious Attachment', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
      { number: 8, title: 'The Q1 Matrix', content: 'Coming soon.\n\n*This chapter will be available when the book launches.*' },
    ],
  },
  {
    id: 'art-of-war-inner-battles',
    title: 'The Art of War for Inner Battles',
    subtitle: 'Book Two',
    author: 'The Architect',
    bookNumber: 2,
    description: 'Sun Tzu\'s 2,500-year-old strategy manual, rewritten for the war inside your head. Not metaphor \u2014 field manual.',
    readTime: '~40 min read',
    category: 'Philosophy',
    tags: ['strategy', 'mindset', 'discipline', 'emotional control'],
    featured: true,
    coverColor: 'from-slate-700 to-zinc-900',
    chapters: ART_OF_WAR_CHAPTERS,
  },
  {
    id: 'how-to-get-rich',
    title: 'How to Get Rich',
    subtitle: 'Book Three',
    author: 'Felix Dennis (adapted)',
    bookNumber: 3,
    description: 'The brutally honest blueprint for building wealth from a self-made British publishing billionaire. No fluff. No pretense. Just the raw truth about what it actually takes.',
    readTime: '~50 min read',
    category: 'Business',
    tags: ['wealth', 'entrepreneurship', 'ownership', 'execution', 'risk'],
    featured: true,
    coverColor: 'from-emerald-700 to-green-900',
    chapters: HOW_TO_GET_RICH_CHAPTERS,
  },
  {
    id: 'win-friends',
    title: 'How to Win Friends and Influence People',
    subtitle: 'Book Four',
    author: 'Dale Carnegie (adapted)',
    bookNumber: 4,
    description: 'The timeless blueprint for human connection, rewritten for a generation that forgot how to talk to people. 12 principles that actually work.',
    readTime: '~60 min read',
    category: 'Relationships',
    tags: ['people skills', 'influence', 'communication', 'empathy', 'leadership'],
    featured: false,
    coverColor: 'from-blue-700 to-indigo-900',
    chapters: WIN_FRIENDS_CHAPTERS,
  },
  {
    id: 'small-talk',
    title: 'The Fine Art of Small Talk',
    subtitle: 'Book Five',
    author: 'Debra Fine (adapted)',
    bookNumber: 5,
    description: 'How to start a conversation with anyone, keep it going, and turn strangers into connections. The skill nobody taught you.',
    readTime: '~40 min read',
    category: 'Communication',
    tags: ['networking', 'social skills', 'conversation', 'introvert', 'confidence'],
    featured: false,
    coverColor: 'from-violet-600 to-purple-900',
    chapters: SMALL_TALK_CHAPTERS,
  },
  {
    id: 'never-split-the-difference',
    title: 'Never Split the Difference',
    subtitle: 'Book Six',
    author: 'Chris Voss (adapted)',
    bookNumber: 6,
    description: 'An FBI hostage negotiator\'s field guide to getting what you want \u2014 in deals, relationships, and the conversation inside your own head.',
    readTime: '~45 min read',
    category: 'Negotiation',
    tags: ['negotiation', 'empathy', 'influence', 'communication', 'conflict'],
    featured: true,
    coverColor: 'from-red-800 to-stone-900',
    chapters: NEVER_SPLIT_CHAPTERS,
  },
  {
    id: 'four-agreements',
    title: 'The Four Agreements',
    subtitle: 'Book Seven',
    author: 'Don Miguel Ruiz (adapted)',
    bookNumber: 7,
    description: 'Ancient Toltec wisdom distilled into a practical guide for breaking self-limiting beliefs and living with authentic freedom.',
    readTime: '~35 min read',
    category: 'Spirituality',
    tags: ['mindset', 'self-awareness', 'beliefs', 'freedom', 'integrity'],
    featured: false,
    coverColor: '#E9C46A',
    chapters: FOUR_AGREEMENTS_CHAPTERS,
  },
  {
    id: 'attached',
    title: 'Attached',
    subtitle: 'Book Eight',
    author: 'Amir Levine & Rachel Heller (adapted)',
    bookNumber: 8,
    description: 'The science of adult bonding and how understanding your relational wiring can transform the way you love, fight, and connect.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['attachment', 'relationships', 'love', 'communication', 'self-awareness'],
    featured: false,
    coverColor: '#E07A5F',
    chapters: ATTACHED_CHAPTERS,
  },
  {
    id: 'mountain-is-you',
    title: 'The Mountain Is You',
    subtitle: 'Book Nine',
    author: 'Brianna Wiest (adapted)',
    bookNumber: 9,
    description: 'A deep dive into self-sabotage — why you do it, how to recognize it, and the inner transformation required to finally get out of your own way.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['self-sabotage', 'self-awareness', 'emotional intelligence', 'identity', 'growth'],
    featured: false,
    coverColor: '#7B6FA0',
    chapters: MOUNTAIN_IS_YOU_CHAPTERS,
  },
  {
    id: 'power-of-now',
    title: 'The Power of Now',
    subtitle: 'Book Ten',
    author: 'Eckhart Tolle (adapted)',
    bookNumber: 10,
    description: 'A guide to escaping the prison of compulsive thinking and discovering the profound peace that exists in the present moment.',
    readTime: '~30 min read',
    category: 'Spirituality',
    tags: ['presence', 'mindfulness', 'consciousness', 'inner peace', 'surrender'],
    featured: false,
    coverColor: '#6A4C93',
    chapters: POWER_OF_NOW_CHAPTERS,
  },
  {
    id: 'think-grow-rich',
    title: 'Think and Grow Rich',
    subtitle: 'Book Eleven',
    author: 'Napoleon Hill (adapted)',
    bookNumber: 11,
    description: 'The timeless principles of wealth creation distilled from decades of studying the most successful people in history. Desire, conviction, and relentless execution.',
    readTime: '~35 min read',
    category: 'Business',
    tags: ['wealth', 'mindset', 'desire', 'persistence', 'success'],
    featured: false,
    coverColor: '#F4A261',
    chapters: THINK_GROW_RICH_CHAPTERS,
  },
  {
    id: 'atomic-habits',
    title: 'Atomic Habits',
    subtitle: 'Book Twelve',
    author: 'James Clear (adapted)',
    bookNumber: 12,
    description: 'A proven framework for building good habits and breaking bad ones. Tiny changes, remarkable results.',
    readTime: '~40 min read',
    category: 'Habits/Productivity',
    tags: ['habits', 'productivity', 'behavior change', 'systems', 'self-improvement'],
    featured: false,
    coverColor: '#2D6A4F',
    chapters: ATOMIC_HABITS_CHAPTERS,
  },
  {
    id: 'subtle-art',
    title: 'The Subtle Art of Not Giving a F*ck',
    subtitle: 'Book Thirteen',
    author: 'Mark Manson (adapted)',
    bookNumber: 13,
    description: 'A counterintuitive approach to living a good life by choosing what to care about — and letting go of everything else.',
    readTime: '~40 min read',
    category: 'Self-Help',
    tags: ['values', 'responsibility', 'acceptance', 'mindset', 'authenticity'],
    featured: false,
    coverColor: '#E63946',
    chapters: SUBTLE_ART_CHAPTERS,
  },
  {
    id: 'untethered-soul',
    title: 'The Untethered Soul',
    subtitle: 'Book Fourteen',
    author: 'Michael Singer (adapted)',
    bookNumber: 14,
    description: 'A journey beyond yourself — learning to let go of the habitual thoughts and emotions that limit your consciousness.',
    readTime: '~35 min read',
    category: 'Spirituality',
    tags: ['consciousness', 'inner freedom', 'letting go', 'awareness', 'presence'],
    featured: false,
    coverColor: '#264653',
    chapters: UNTETHERED_SOUL_CHAPTERS,
  },
  {
    id: 'mindset',
    title: 'Mindset',
    subtitle: 'Book Fifteen',
    author: 'Carol Dweck (adapted)',
    bookNumber: 15,
    description: 'How the way you think about your abilities shapes everything — and why a growth mindset is the key to reaching your potential.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['growth mindset', 'learning', 'resilience', 'potential', 'self-belief'],
    featured: false,
    coverColor: '#4CC9F0',
    chapters: MINDSET_CHAPTERS,
  },
  {
    id: 'deep-work',
    title: 'Deep Work',
    subtitle: 'Book Sixteen',
    author: 'Cal Newport (adapted)',
    bookNumber: 16,
    description: 'Rules for focused success in a distracted world. How to cultivate the rare ability to concentrate without distraction.',
    readTime: '~40 min read',
    category: 'Habits/Productivity',
    tags: ['focus', 'productivity', 'deep work', 'distraction', 'craftsmanship'],
    featured: false,
    coverColor: '#2B2D42',
    chapters: DEEP_WORK_CHAPTERS,
  },
  {
    id: '7-habits',
    title: 'The 7 Habits of Highly Effective People',
    subtitle: 'Book Seventeen',
    author: 'Stephen Covey (adapted)',
    bookNumber: 17,
    description: 'A principle-centered approach to personal and professional effectiveness that moves you from dependence to independence to interdependence.',
    readTime: '~40 min read',
    category: 'Habits/Productivity',
    tags: ['habits', 'effectiveness', 'leadership', 'principles', 'character'],
    featured: false,
    coverColor: '#457B9D',
    chapters: normalizeChapters(SEVEN_HABITS_CHAPTERS),
  },
  {
    id: 'man-search-meaning',
    title: "Man's Search for Meaning",
    subtitle: 'Book Eighteen',
    author: 'Viktor Frankl (adapted)',
    bookNumber: 18,
    description: 'How finding purpose in the darkest circumstances reveals the deepest truth about human resilience and the will to live.',
    readTime: '~35 min read',
    category: 'Philosophy',
    tags: ['meaning', 'purpose', 'resilience', 'suffering', 'freedom'],
    featured: false,
    coverColor: '#1D3557',
    chapters: normalizeChapters(MAN_SEARCH_MEANING_CHAPTERS),
  },
  {
    id: 'dare-to-lead',
    title: 'Dare to Lead',
    subtitle: 'Book Nineteen',
    author: 'Bren\u00e9 Brown (adapted)',
    bookNumber: 19,
    description: 'Why brave leadership requires vulnerability, empathy, and the courage to have the hard conversations that most people avoid.',
    readTime: '~40 min read',
    category: 'Leadership',
    tags: ['leadership', 'vulnerability', 'courage', 'trust', 'empathy'],
    featured: false,
    coverColor: '#C77DFF',
    chapters: normalizeChapters(DARE_TO_LEAD_CHAPTERS),
  },
  {
    id: 'grit',
    title: 'Grit',
    subtitle: 'Book Twenty',
    author: 'Angela Duckworth (adapted)',
    bookNumber: 20,
    description: 'The science of passion and perseverance — why talent alone is never enough and how sustained effort over time is the real key to achievement.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['perseverance', 'passion', 'effort', 'talent', 'achievement'],
    featured: false,
    coverColor: '#F77F00',
    chapters: normalizeChapters(GRIT_CHAPTERS),
  },
  {
    id: 'essentialism',
    title: 'Essentialism',
    subtitle: 'Book Twenty-One',
    author: 'Greg McKeown (adapted)',
    bookNumber: 21,
    description: 'The disciplined pursuit of less — how to cut through the noise and focus only on what truly matters.',
    readTime: '~35 min read',
    category: 'Habits/Productivity',
    tags: ['focus', 'simplicity', 'priorities', 'boundaries', 'clarity'],
    featured: false,
    coverColor: '#8D99AE',
    chapters: normalizeChapters(ESSENTIALISM_CHAPTERS),
  },
  {
    id: 'daring-greatly',
    title: 'Daring Greatly',
    subtitle: 'Book Twenty-Two',
    author: 'Bren\u00e9 Brown (adapted)',
    bookNumber: 22,
    description: 'How the courage to be vulnerable transforms the way we live, love, parent, and lead.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['vulnerability', 'courage', 'shame', 'connection', 'wholehearted'],
    featured: false,
    coverColor: '#EF233C',
    chapters: normalizeChapters(DARING_GREATLY_CHAPTERS),
  },
  {
    id: 'body-keeps-score',
    title: 'The Body Keeps the Score',
    subtitle: 'Book Twenty-Three',
    author: 'Bessel van der Kolk (adapted)',
    bookNumber: 23,
    description: 'How trauma reshapes the body and brain — and the revolutionary treatments that can help you reclaim your life.',
    readTime: '~40 min read',
    category: 'Psychology',
    tags: ['trauma', 'healing', 'body', 'neuroscience', 'recovery'],
    featured: false,
    coverColor: '#3D5A80',
    chapters: normalizeChapters(BODY_KEEPS_SCORE_CHAPTERS),
  },
  {
    id: 'six-pillars-self-esteem',
    title: 'The Six Pillars of Self-Esteem',
    subtitle: 'Book Twenty-Four',
    author: 'Nathaniel Branden (adapted)',
    bookNumber: 24,
    description: 'The definitive guide to building authentic self-worth through conscious living, self-acceptance, and personal integrity.',
    readTime: '~35 min read',
    category: 'Self-Help',
    tags: ['self-esteem', 'self-worth', 'confidence', 'integrity', 'consciousness'],
    featured: false,
    coverColor: '#81B29A',
    chapters: normalizeChapters(SIX_PILLARS_SELF_ESTEEM_CHAPTERS),
  },
  {
    id: 'no-more-mr-nice-guy',
    title: 'No More Mr. Nice Guy',
    subtitle: 'Book Twenty-Five',
    author: 'Robert Glover (adapted)',
    bookNumber: 25,
    description: 'Breaking free from the Nice Guy Syndrome — why people-pleasing backfires and how to start living authentically.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['people-pleasing', 'boundaries', 'authenticity', 'masculinity', 'self-respect'],
    featured: false,
    coverColor: '#F2CC8F',
    chapters: normalizeChapters(NO_MORE_MR_NICE_GUY_CHAPTERS),
  },
  {
    id: 'models',
    title: 'Models',
    subtitle: 'Book Twenty-Six',
    author: 'Mark Manson (adapted)',
    bookNumber: 26,
    description: 'Attracting women through honesty — why vulnerability and authenticity are more magnetic than any technique or tactic.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['attraction', 'honesty', 'vulnerability', 'confidence', 'dating'],
    featured: false,
    coverColor: '#D62246',
    chapters: normalizeChapters(MODELS_CHAPTERS),
  },
  {
    id: 'way-of-superior-man',
    title: 'The Way of the Superior Man',
    subtitle: 'Book Twenty-Seven',
    author: 'David Deida (adapted)',
    bookNumber: 27,
    description: 'A spiritual guide to mastering the challenges of women, work, and sexual desire while living with purpose and integrity.',
    readTime: '~35 min read',
    category: 'Self-Help',
    tags: ['masculinity', 'purpose', 'polarity', 'relationships', 'presence'],
    featured: false,
    coverColor: '#1B4332',
    chapters: normalizeChapters(WAY_OF_SUPERIOR_MAN_CHAPTERS),
  },
  {
    id: '12-rules-life',
    title: '12 Rules for Life',
    subtitle: 'Book Twenty-Eight',
    author: 'Jordan Peterson (adapted)',
    bookNumber: 28,
    description: 'An antidote to chaos — practical rules for standing up straight, telling the truth, and finding meaning in responsibility.',
    readTime: '~40 min read',
    category: 'Philosophy',
    tags: ['meaning', 'responsibility', 'order', 'truth', 'discipline'],
    featured: false,
    coverColor: '#774936',
    chapters: TWELVE_RULES_LIFE_CHAPTERS,
  },
  {
    id: 'meditations',
    title: 'Meditations',
    subtitle: 'Book Twenty-Nine',
    author: 'Marcus Aurelius (adapted)',
    bookNumber: 29,
    description: 'The private journal of a Roman Emperor — timeless Stoic wisdom on duty, impermanence, and mastering your own mind.',
    readTime: '~35 min read',
    category: 'Philosophy',
    tags: ['stoicism', 'virtue', 'discipline', 'impermanence', 'duty'],
    featured: false,
    coverColor: '#6B705C',
    chapters: MEDITATIONS_CHAPTERS,
  },
  {
    id: 'obstacle-is-way',
    title: 'The Obstacle Is the Way',
    subtitle: 'Book Thirty',
    author: 'Ryan Holiday (adapted)',
    bookNumber: 30,
    description: 'The ancient Stoic art of turning adversity into advantage — how every obstacle contains the seed of an equal or greater opportunity.',
    readTime: '~35 min read',
    category: 'Philosophy',
    tags: ['stoicism', 'adversity', 'resilience', 'perception', 'action'],
    featured: false,
    coverColor: '#A5A58D',
    chapters: OBSTACLE_IS_WAY_CHAPTERS,
  },
  {
    id: 'ego-is-enemy',
    title: 'Ego Is the Enemy',
    subtitle: 'Book Thirty-One',
    author: 'Ryan Holiday (adapted)',
    bookNumber: 31,
    description: 'How the need to be more than, better than, and recognized for more than our work sabotages everything we set out to achieve.',
    readTime: '~35 min read',
    category: 'Philosophy',
    tags: ['ego', 'humility', 'stoicism', 'self-awareness', 'discipline'],
    featured: false,
    coverColor: '#B7B7A4',
    chapters: EGO_IS_ENEMY_CHAPTERS,
  },
  {
    id: 'cant-hurt-me',
    title: "Can't Hurt Me",
    subtitle: 'Book Thirty-Two',
    author: 'David Goggins (adapted)',
    bookNumber: 32,
    description: 'Master your mind and defy the odds — how to unlock the full potential of your body and mind through relentless mental toughness.',
    readTime: '~40 min read',
    category: 'Self-Help',
    tags: ['mental toughness', 'discipline', 'suffering', 'willpower', 'resilience'],
    featured: false,
    coverColor: '#333333',
    chapters: CANT_HURT_ME_CHAPTERS,
  },
  {
    id: 'miracle-morning',
    title: 'The Miracle Morning',
    subtitle: 'Book Thirty-Three',
    author: 'Hal Elrod (adapted)',
    bookNumber: 33,
    description: 'How waking up one hour earlier and following a simple six-step routine can transform your life before 8 AM.',
    readTime: '~30 min read',
    category: 'Habits/Productivity',
    tags: ['morning routine', 'habits', 'productivity', 'mindset', 'discipline'],
    featured: false,
    coverColor: '#FFB703',
    chapters: MIRACLE_MORNING_CHAPTERS,
  },
  {
    id: 'ikigai',
    title: 'Ikigai',
    subtitle: 'Book Thirty-Four',
    author: 'Hector Garcia & Francesc Miralles (adapted)',
    bookNumber: 34,
    description: 'The Japanese secret to a long and happy life — finding the intersection of what you love, what you are good at, and what the world needs.',
    readTime: '~30 min read',
    category: 'Self-Help',
    tags: ['purpose', 'longevity', 'flow', 'joy', 'simplicity'],
    featured: false,
    coverColor: '#FB8500',
    chapters: IKIGAI_CHAPTERS,
  },
  {
    id: 'rich-dad-poor-dad',
    title: 'Rich Dad Poor Dad',
    subtitle: 'Book Thirty-Five',
    author: 'Robert Kiyosaki (adapted)',
    bookNumber: 35,
    description: 'What the rich teach their kids about money that the poor and middle class do not — a radical rethinking of wealth and financial literacy.',
    readTime: '~35 min read',
    category: 'Business',
    tags: ['wealth', 'financial literacy', 'assets', 'mindset', 'investing'],
    featured: false,
    coverColor: '#2DC653',
    chapters: RICH_DAD_POOR_DAD_CHAPTERS,
  },
  {
    id: 'psychology-money',
    title: 'The Psychology of Money',
    subtitle: 'Book Thirty-Six',
    author: 'Morgan Housel (adapted)',
    bookNumber: 36,
    description: 'Timeless lessons on wealth, greed, and happiness — why managing money is more about behavior than intelligence.',
    readTime: '~35 min read',
    category: 'Business',
    tags: ['money', 'behavior', 'wealth', 'compounding', 'humility'],
    featured: false,
    coverColor: '#0077B6',
    chapters: PSYCHOLOGY_MONEY_CHAPTERS,
  },
  {
    id: 'emotional-intelligence',
    title: 'Emotional Intelligence',
    subtitle: 'Book Thirty-Seven',
    author: 'Daniel Goleman (adapted)',
    bookNumber: 37,
    description: 'Why emotional intelligence can matter more than IQ — and how mastering your emotions is the key to success in every area of life.',
    readTime: '~40 min read',
    category: 'Psychology',
    tags: ['emotions', 'self-awareness', 'empathy', 'social skills', 'self-regulation'],
    featured: false,
    coverColor: '#9B2335',
    chapters: EMOTIONAL_INTELLIGENCE_CHAPTERS,
  },
  {
    id: 'gifts-of-imperfection',
    title: 'The Gifts of Imperfection',
    subtitle: 'Book Thirty-Eight',
    author: 'Bren\u00e9 Brown (adapted)',
    bookNumber: 38,
    description: 'Letting go of who you think you are supposed to be and embracing who you actually are — a guide to wholehearted living.',
    readTime: '~35 min read',
    category: 'Self-Help',
    tags: ['authenticity', 'self-compassion', 'shame', 'worthiness', 'courage'],
    featured: false,
    coverColor: '#D4A5A5',
    chapters: GIFTS_OF_IMPERFECTION_CHAPTERS,
  },
  {
    id: 'feeling-good',
    title: 'Feeling Good',
    subtitle: 'Book Thirty-Nine',
    author: 'David Burns (adapted)',
    bookNumber: 39,
    description: 'The clinically proven drug-free treatment for depression — how to identify and defeat the cognitive distortions that fuel anxiety and sadness.',
    readTime: '~40 min read',
    category: 'Psychology',
    tags: ['depression', 'cognitive distortions', 'CBT', 'mental health', 'self-esteem'],
    featured: false,
    coverColor: '#4A90D9',
    chapters: FEELING_GOOD_CHAPTERS,
  },
  {
    id: 'love-languages',
    title: 'The Five Love Languages',
    subtitle: 'Book Forty',
    author: 'Gary Chapman (adapted)',
    bookNumber: 40,
    description: 'How to express heartfelt commitment to your partner by learning to speak their unique emotional language of love.',
    readTime: '~30 min read',
    category: 'Relationships',
    tags: ['love', 'communication', 'relationships', 'intimacy', 'connection'],
    featured: false,
    coverColor: '#FF6B6B',
    chapters: LOVE_LANGUAGES_CHAPTERS,
  },
  {
    id: 'nonviolent-communication',
    title: 'Nonviolent Communication',
    subtitle: 'Book Forty-One',
    author: 'Marshall Rosenberg (adapted)',
    bookNumber: 41,
    description: 'A language of life — how to connect compassionately with yourself and others by expressing needs without blame or judgment.',
    readTime: '~35 min read',
    category: 'Communication',
    tags: ['communication', 'empathy', 'needs', 'compassion', 'conflict resolution'],
    featured: false,
    coverColor: '#6BCB77',
    chapters: NONVIOLENT_COMMUNICATION_CHAPTERS,
  },
  {
    id: 'boundaries',
    title: 'Boundaries',
    subtitle: 'Book Forty-Two',
    author: 'Henry Cloud & John Townsend (adapted)',
    bookNumber: 42,
    description: 'When to say yes, how to say no — learning to take control of your life by understanding where you end and someone else begins.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['boundaries', 'self-respect', 'relationships', 'limits', 'responsibility'],
    featured: false,
    coverColor: '#4D908E',
    chapters: BOUNDARIES_CHAPTERS,
  },
  {
    id: 'codependent-no-more',
    title: 'Codependent No More',
    subtitle: 'Book Forty-Three',
    author: 'Melody Beattie (adapted)',
    bookNumber: 43,
    description: 'How to stop controlling others and start caring for yourself — breaking free from the cycle of codependency.',
    readTime: '~35 min read',
    category: 'Relationships',
    tags: ['codependency', 'detachment', 'self-care', 'boundaries', 'recovery'],
    featured: false,
    coverColor: '#B5838D',
    chapters: CODEPENDENT_NO_MORE_CHAPTERS,
  },
  {
    id: 'adult-children',
    title: 'Adult Children of Emotionally Immature Parents',
    subtitle: 'Book Forty-Four',
    author: 'Lindsay Gibson (adapted)',
    bookNumber: 44,
    description: 'How to heal from distant, rejecting, or self-involved parents and reclaim your emotional autonomy as an adult.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['family', 'healing', 'emotional maturity', 'boundaries', 'inner child'],
    featured: false,
    coverColor: '#6D6875',
    chapters: ADULT_CHILDREN_CHAPTERS,
  },
  {
    id: 'radical-acceptance',
    title: 'Radical Acceptance',
    subtitle: 'Book Forty-Five',
    author: 'Tara Brach (adapted)',
    bookNumber: 45,
    description: 'Embracing your life with the heart of a Buddha — how to free yourself from the trance of unworthiness through mindfulness and compassion.',
    readTime: '~35 min read',
    category: 'Spirituality',
    tags: ['acceptance', 'mindfulness', 'compassion', 'self-love', 'presence'],
    featured: false,
    coverColor: '#80B918',
    chapters: RADICAL_ACCEPTANCE_CHAPTERS,
  },
  {
    id: 'influence',
    title: 'Influence',
    subtitle: 'Book Forty-Six',
    author: 'Robert Cialdini (adapted)',
    bookNumber: 46,
    description: 'The psychology of persuasion — six universal principles that drive human behavior and how to defend yourself against manipulation.',
    readTime: '~40 min read',
    category: 'Psychology',
    tags: ['persuasion', 'influence', 'psychology', 'behavior', 'decision-making'],
    featured: false,
    coverColor: '#BC4749',
    chapters: INFLUENCE_CHAPTERS,
  },
  {
    id: 'predictably-irrational',
    title: 'Predictably Irrational',
    subtitle: 'Book Forty-Seven',
    author: 'Dan Ariely (adapted)',
    bookNumber: 47,
    description: 'The hidden forces that shape our decisions — why we systematically make irrational choices and how to anticipate our own flaws.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['behavioral economics', 'decision-making', 'irrationality', 'bias', 'choices'],
    featured: false,
    coverColor: '#606C38',
    chapters: PREDICTABLY_IRRATIONAL_CHAPTERS,
  },
  {
    id: 'dopamine-nation',
    title: 'Dopamine Nation',
    subtitle: 'Book Forty-Eight',
    author: 'Anna Lembke (adapted)',
    bookNumber: 48,
    description: 'Finding balance in the age of indulgence — how the pursuit of pleasure is leading to pain and what we can do to restore equilibrium.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['dopamine', 'addiction', 'balance', 'pleasure', 'self-control'],
    featured: false,
    coverColor: '#5F0F40',
    chapters: DOPAMINE_NATION_CHAPTERS,
  },
  {
    id: 'lost-connections',
    title: 'Lost Connections',
    subtitle: 'Book Forty-Nine',
    author: 'Johann Hari (adapted)',
    bookNumber: 49,
    description: 'Uncovering the real causes of depression — and the unexpected solutions that go far beyond medication.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['depression', 'connection', 'meaning', 'community', 'mental health'],
    featured: false,
    coverColor: '#0F4C5C',
    chapters: LOST_CONNECTIONS_CHAPTERS,
  },
  {
    id: 'courage-to-be-disliked',
    title: 'The Courage to Be Disliked',
    subtitle: 'Book Fifty',
    author: 'Ichiro Kishimi (adapted)',
    bookNumber: 50,
    description: 'How to free yourself from the expectations of others and find true happiness through Adlerian psychology.',
    readTime: '~35 min read',
    category: 'Philosophy',
    tags: ['freedom', 'acceptance', 'Adlerian psychology', 'courage', 'self-determination'],
    featured: false,
    coverColor: '#9E0059',
    chapters: COURAGE_TO_BE_DISLIKED_CHAPTERS,
  },
  {
    id: 'man-enough',
    title: 'Man Enough',
    subtitle: 'Book Fifty-One',
    author: 'Justin Baldoni (adapted)',
    bookNumber: 51,
    description: 'Undefining masculinity — how to break free from the suffocating rules of manhood and become the man you actually want to be.',
    readTime: '~35 min read',
    category: 'Self-Help',
    tags: ['masculinity', 'vulnerability', 'identity', 'emotional health', 'courage'],
    featured: false,
    coverColor: '#2C3E50',
    chapters: MAN_ENOUGH_CHAPTERS,
  },
  {
    id: 'loving-what-is',
    title: 'Loving What Is',
    subtitle: 'Book Fifty-Two',
    author: 'Byron Katie (adapted)',
    bookNumber: 52,
    description: 'Four questions that can change your life — how to end suffering by questioning the stressful thoughts you believe.',
    readTime: '~35 min read',
    category: 'Self-Help',
    tags: ['inquiry', 'acceptance', 'thoughts', 'freedom', 'peace'],
    featured: false,
    coverColor: '#8E9AAF',
    chapters: normalizeChapters(LOVING_WHAT_IS_CHAPTERS),
  },
  {
    id: 'seat-of-soul',
    title: 'The Seat of the Soul',
    subtitle: 'Book Fifty-Three',
    author: 'Gary Zukav (adapted)',
    bookNumber: 53,
    description: 'Aligning your personality with your soul — how authentic power comes from within, not from external achievement.',
    readTime: '~35 min read',
    category: 'Spirituality',
    tags: ['soul', 'authentic power', 'intention', 'consciousness', 'evolution'],
    featured: false,
    coverColor: '#5C4033',
    chapters: normalizeChapters(SEAT_OF_SOUL_CHAPTERS),
  },
  {
    id: 'womens-bodies-wisdom',
    title: "Women's Bodies, Women's Wisdom",
    subtitle: 'Book Fifty-Four',
    author: 'Christiane Northrup (adapted)',
    bookNumber: 54,
    description: 'A groundbreaking guide to the connection between body, mind, and spirit in women\'s health and healing.',
    readTime: '~40 min read',
    category: 'Self-Help',
    tags: ['health', 'body wisdom', 'healing', 'empowerment', 'self-care'],
    featured: false,
    coverColor: '#C9B1BD',
    chapters: WOMENS_BODIES_WISDOM_CHAPTERS,
  },
  {
    id: 'letting-go',
    title: 'Letting Go',
    subtitle: 'Book Fifty-Five',
    author: 'David Hawkins (adapted)',
    bookNumber: 55,
    description: 'The pathway of surrender — a practical guide to releasing the emotional blocks that prevent you from experiencing the life you want.',
    readTime: '~35 min read',
    category: 'Spirituality',
    tags: ['surrender', 'emotions', 'consciousness', 'healing', 'freedom'],
    featured: false,
    coverColor: '#7EC8E3',
    chapters: normalizeChapters(LETTING_GO_CHAPTERS),
  },
  {
    id: 'mastery',
    title: 'Mastery',
    subtitle: 'Book Fifty-Six',
    author: 'Robert Greene (adapted)',
    bookNumber: 56,
    description: 'The keys to achieving mastery in any field — how the greatest minds in history found their calling and reached the highest levels of power and ability.',
    readTime: '~40 min read',
    category: 'Self-Help',
    tags: ['mastery', 'apprenticeship', 'creativity', 'purpose', 'excellence'],
    featured: false,
    coverColor: '#1A1A2E',
    chapters: normalizeChapters(MASTERY_CHAPTERS),
  },
  {
    id: 'when-body-says-no',
    title: 'When the Body Says No',
    subtitle: 'Book Fifty-Seven',
    author: 'Gabor Maté (adapted)',
    bookNumber: 57,
    description: 'The cost of hidden stress — how repressed emotions and the inability to say no manifest as chronic illness in the body.',
    readTime: '~35 min read',
    category: 'Psychology',
    tags: ['stress', 'mind-body', 'chronic illness', 'emotions', 'boundaries'],
    featured: false,
    coverColor: '#386641',
    chapters: normalizeChapters(WHEN_BODY_SAYS_NO_CHAPTERS),
  },
];

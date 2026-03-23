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

export interface Chapter {
  number: number;
  title: string;
  content: string;
  exerciseQuestion?: string; // reflection question at end of chapter
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
];

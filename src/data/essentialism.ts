import { Chapter } from '../types';

const BOOK_ID = 'essentialism';

export const ESSENTIALISM_CHAPTERS: Chapter[] = [
  {
    id: `${BOOK_ID}-ch1`,
    bookId: BOOK_ID,
    chapterNumber: 0,
    title: 'The Disciplined Pursuit of Less',
    content: `**The Paradox of Success**\nOften, our very competence is what undermines us. When you do good work, you are rewarded with more options, more requests, and more opportunities. Slowly, without realizing it, you stretch yourself incredibly thin, making a millimeter of progress in a million different directions. The paradox of success is that the capable are the most likely to be consumed by the trivial.\n\n**The Essentialist Shift**\nWe have been conditioned to believe that we must do it all. The essentialist rejects this lie. They operate from a fundamentally different premise: "Less, but better." It is a deliberate, ongoing shift in mindset from asking "How can I fit it all in?" to asking "What is the absolute highest contribution I can make right now?" It requires accepting the uncomfortable truth that almost everything is noise.\n\n**Reclaiming Your Right to Choose**\nIf you do not prioritize your life, someone else will fiercely prioritize it for you. Your time and energy are finite resources. Recognizing that you have the power to choose is the foundational step of reclaiming your agency. You are not obligated to say yes to every request or chase every shiny object. Your ability to choose is an invincible power that no one can take away unless you surrender it.`,
    keyConcepts: ['Recognizing the trap of over-commitment', 'Shifting to a "Less, but better" mindset', 'Reclaiming your power to choose'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch1-ex1`,
        chapterId: `${BOOK_ID}-ch1`,
        prompt: 'Look at your schedule for the past week. Are you making a millimeter of progress in a million directions, or significant progress in one or two vital areas? Where are you spread too thin?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch2`,
    bookId: BOOK_ID,
    chapterNumber: 1,
    title: 'The Power of Extreme Criteria',
    content: `**The 90 Percent Rule**\nWhen evaluating an opportunity, we often fall into the trap of a broad, lukewarm "yes." If it sounds somewhat interesting or mildly beneficial, we agree to it. The essentialist uses a much more ruthless filter. If an opportunity does not score a 90 out of 100 on your internal scale, you must change the score to a zero and reject it. It’s either a "hell yes," or it’s a "no."\n\n**Embracing Trade-offs**\nEvery choice requires a sacrifice. You cannot have it all, and pretending that you can only leads to exhaustion. A core discipline of focus is acknowledging the reality of trade-offs. When you say yes to one thing, you are inextricably saying no to something else. Instead of asking, "What do I want?" ask yourself, "What problem do I want to solve? What am I willing to give up to have this?"\n\n**The Art of the Graceful No**\nSaying no is a profound leadership skill. It can feel deeply uncomfortable because we fear disappointing others or missing out. But a clear, respectful "no" earns you far more respect in the long run than a hesitant, non-committal "yes" that leads to burnout and poor performance. Protect your time fiercely, and remember that a clear boundary is a kindness to both yourself and the requester.`,
    keyConcepts: ['Applying the 90 percent rule to opportunities', 'Acknowledging and embracing trade-offs', 'Learning to deliver a graceful but firm "no"'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch2-ex1`,
        chapterId: `${BOOK_ID}-ch2`,
        prompt: 'Think of an obligation you recently agreed to that you instantly regretted. Why did you say yes? What trade-off did you ignore when making that decision?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch3`,
    bookId: BOOK_ID,
    chapterNumber: 2,
    title: 'Creating Space to Explore',
    content: `**The Necessity of Unavailability**\nIn our hyper-connected world, being busy is often worn as a badge of honor. But frantic motion is not the same as meaningful momentum. To discern what is truly essential, you must violently protect your time to think. This means deliberately creating pockets of unavailability—turning off notifications, closing the door, and sitting in silence. You cannot hear the signal if you are constantly surrounded by the noise.\n\n**The Importance of Play**\nPlay is not an unproductive luxury; it is a critical engine of creativity and problem-solving. When we are overly focused on efficiency, we kill the lateral thinking required to discover breakthrough solutions. Engaging in activities purely for the joy of them reduces stress, expands our perspective, and often leads to the exact insights we need to tackle our most complex challenges.\n\n**Protecting the Asset**\nYour mind and body are the primary engines of your contribution. Sleep is not an obstacle to productivity; it is the ultimate performance enhancer. The non-essentialist treats sleep as a necessary evil and brags about running on fumes. The essentialist recognizes that sleep is an investment in their highest level of cognitive function, emotional regulation, and daily impact.`,
    keyConcepts: ['Creating deliberate quiet time to think', 'Recognizing play as a tool for creativity', 'Prioritizing sleep as a performance enhancer'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch3-ex1`,
        chapterId: `${BOOK_ID}-ch3`,
        prompt: 'How much deliberate, uninterrupted time do you set aside each week purely for thinking and reflection? Where can you carve out 30 minutes of unavailability this week?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch4`,
    bookId: BOOK_ID,
    chapterNumber: 3,
    title: 'Editing Your Life',
    content: `**The Sunk-Cost Fallacy**\nWe are wired to hold onto things we have invested in, whether it’s a failing project, a toxic relationship, or an outdated strategy. We think, "I can't stop now, I've already put so much time into this." The essentialist has the courage to cut their losses. They evaluate every commitment as if they were seeing it for the first time. If you wouldn't start investing in it today, you must stop investing in it tomorrow.\n\n**The Art of Subtraction**\nWhen faced with a complex problem, our default instinct is usually to add: add more software, add more meetings, add more steps. But the most elegant solutions are often found through subtraction. Instead of asking what you can add to fix a problem, ask what you can remove. Eliminate the friction, strip away the non-essential steps, and clarify the core objective.\n\n**Setting Boundaries**\nBoundaries are the invisible architecture of a focused life. They are not walls meant to keep people out; they are fences meant to protect what is valuable inside. If you do not set clear boundaries around your time, energy, and resources, the world will happily consume them. Learn to lovingly but firmly define what is your responsibility and what belongs to someone else.`,
    keyConcepts: ['Overcoming the sunk-cost fallacy', 'Solving problems through subtraction', 'Building protective boundaries'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch4-ex1`,
        chapterId: `${BOOK_ID}-ch4`,
        prompt: 'What is one project, commitment, or habit in your life that you continue to invest in purely because you\'ve already spent time on it? What would happen if you simply let it go?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch5`,
    bookId: BOOK_ID,
    chapterNumber: 4,
    title: 'Executing Effortlessly',
    content: `**Building Routine and Rhythm**\nThe goal is not to rely on sheer willpower every single day; willpower is a finite, depletable resource. The goal is to build routines that make the essential things the easiest things to do. By designing a rhythm for your daily life, you remove the friction of decision fatigue. When your habits align with your priorities, execution becomes smooth, automatic, and incredibly powerful.\n\n**The Power of Small Wins**\nWhen we focus only on the massive, distant goals, we easily become overwhelmed and paralyzed. The key to massive momentum is to lower the barrier to entry. Focus on securing small, incremental wins every single day. These micro-victories build confidence, create psychological momentum, and compound over time into massive, undeniable results.\n\n**Living in the Present**\nThe mind naturally wanders to the regrets of the past or the anxieties of the future. But the only place where true execution happens is in the present moment. The essentialist continually asks themselves, "What is important right now?" By anchoring your attention to the immediate task at hand, you cut through the anxiety and bring your full, undivided power to the only moment you actually control.`,
    keyConcepts: ['Designing routines to conserve willpower', 'Building momentum through small wins', 'Anchoring attention to the present moment'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch5-ex1`,
        chapterId: `${BOOK_ID}-ch5`,
        prompt: 'What is one highly essential task you need to do daily? How can you redesign your environment or routine to make executing that task almost effortless?',
        exerciseType: 'reflection'
      }
    ]
  }
];
import { Chapter } from '../types';

const BOOK_ID = 'grit';

export const GRIT_CHAPTERS: Chapter[] = [
  {
    id: `${BOOK_ID}-ch1`,
    bookId: BOOK_ID,
    chapterNumber: 0,
    title: 'The Myth of Pure Talent',
    content: `**The Illusion of Effortless Genius**\nWe love the narrative of the natural-born genius. When we watch a virtuoso perform or a star athlete dominate, we naturally attribute their success to an innate, almost magical gift. This "talent bias" is comforting because it lets us off the hook; if they were just born that way, we don't have to compare ourselves to them. But the truth behind extraordinary achievement is far less glamorous and far more accessible.\n\n**Effort Counts Twice**\nTalent is simply how quickly your skills improve when you invest effort. But skill alone doesn't produce achievement. It is effort that turns talent into skill, and it is effort that turns that skill into actual, tangible achievement. In the equation of success, effort counts twice. A naturally gifted person who stops trying will easily be surpassed by someone with less initial talent who refuses to quit working.\n\n**The Mundanity of Excellence**\nExcellence is actually quite mundane. It is the result of dozens of small, seemingly ordinary actions performed consistently over a long period. It is the early mornings, the boring drills, the unglamorous repetitions that no one sees. When you realize that greatness is not a sudden lightning strike but a daily, compounding habit, the path to achievement becomes a matter of your own persistence.`,
    keyConcepts: ['Overcoming the bias for natural talent', 'The multiplying power of sustained effort', 'Excellence as a daily habit'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch1-ex1`,
        chapterId: `${BOOK_ID}-ch1`,
        prompt: 'Where in your life have you used the excuse of "I\'m just not talented at that" to avoid putting in the necessary effort? How would your approach change if you believed effort counted twice?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch2`,
    bookId: BOOK_ID,
    chapterNumber: 1,
    title: 'Discovering Your Deep Interest',
    content: `**Passion is a Process, Not an Epiphany**\nWe are often told to "follow our passion" as if passion were a fully formed object hiding under a rock, waiting to be discovered. But deep, enduring interest is rarely found in a sudden flash of insight. It is sparked by curiosity, nurtured through early exposure, and deepened through years of continued engagement. Passion is not something you simply find; it is something you actively develop.\n\n**The Trial and Error of Curiosity**\nBefore you can commit to a lifelong pursuit, you have to play. You must explore different fields, try new hobbies, and pay attention to what quietly captures your attention. Don't worry if your early interests are fleeting. The goal in the beginning is not mastery, but exploration. Give yourself permission to be a beginner and follow the threads of curiosity without demanding immediate certainty.\n\n**Deepening the Engagement**\nOnce an interest takes root, it requires deliberate cultivation to survive the inevitable boredom and plateaus. This means moving beyond the initial excitement and finding nuance in the details. You begin to ask deeper questions, seek out mentors, and embrace the complexity of the subject. A mature passion is resilient; it is sustained not just by novelty, but by a deepening appreciation for the craft itself.`,
    keyConcepts: ['Developing passion through exploration', 'Giving yourself permission to be a beginner', 'Cultivating a mature, resilient interest'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch2-ex1`,
        chapterId: `${BOOK_ID}-ch2`,
        prompt: 'What is a topic or activity that you have always been quietly curious about but haven\'t pursued? What is one low-stakes way you could explore it this weekend?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch3`,
    bookId: BOOK_ID,
    chapterNumber: 2,
    title: 'The Discipline of Deliberate Practice',
    content: `**Not All Practice is Equal**\nYou can jog every day for ten years and never become an Olympic runner. Simply spending time on a task does not guarantee improvement. To truly achieve mastery, you must engage in deliberate practice. This means stepping outside your comfort zone and focusing entirely on the specific elements of your performance that you currently cannot do well.\n\n**The Discomfort of the Stretch Goal**\nDeliberate practice is intentionally frustrating. It requires you to set a highly specific stretch goal, give the task your undivided attention, and actively seek out immediate, critical feedback. You have to be willing to look at your mistakes unblinkingly. It is the process of breaking down a skill into micro-components and drilling your weakest links until they become strong.\n\n**The Cycle of Reflection and Refinement**\nAfter the intense effort of deliberate practice, reflection is crucial. You must analyze the feedback, adjust your approach, and try again. This continuous loop of action, feedback, and refinement is the engine of growth. It transforms mindless repetition into a highly efficient, targeted evolution of your abilities.`,
    keyConcepts: ['Distinguishing time spent from deliberate practice', 'Embracing the discomfort of stretch goals', 'Utilizing the feedback loop for refinement'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch3-ex1`,
        chapterId: `${BOOK_ID}-ch3`,
        prompt: 'Think about a skill you are trying to improve. Instead of just "practicing more," what is one highly specific micro-component of that skill you can isolate and drill this week?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch4`,
    bookId: BOOK_ID,
    chapterNumber: 3,
    title: 'Connecting to a Higher Purpose',
    content: `**The Parable of the Bricklayers**\nThree bricklayers are asked what they are doing. The first says, "I am laying bricks." The second says, "I am building a church." The third says, "I am building the house of God." All three are doing the exact same physical work, but their internal experience is vastly different. Purpose is the conviction that your daily labor matters to people other than yourself.\n\n**Moving from Self to Others**\nInterest and practice are largely self-focused. You enjoy the activity, and you want to get better at it. But to sustain effort over decades—especially through severe adversity—you usually need to connect your work to a higher purpose. When you see how your efforts contribute to the well-being of others, it unlocks a reservoir of energy and endurance that self-interest alone cannot provide.\n\n**Finding Purpose in the Present**\nYou do not need to change careers to find purpose; you often just need to reframe your current work. Look at the tasks you perform daily and ask how they connect to the larger picture. How does your role support your team, your family, or your community? By consciously drawing a line between your daily grind and the benefit it provides to others, you infuse your routine with profound meaning.`,
    keyConcepts: ['Understanding the power of purpose', 'Connecting daily work to the well-being of others', 'Reframing your current role to find meaning'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch4-ex1`,
        chapterId: `${BOOK_ID}-ch4`,
        prompt: 'Think about your primary job or role. How does the work you do directly or indirectly improve the lives of other people?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch5`,
    bookId: BOOK_ID,
    chapterNumber: 4,
    title: 'The Power of Hope and Resilience',
    content: `**The Mindset of Optimism**\nHope is the bedrock of grit. But this is not the passive hope that things will magically get better tomorrow. Gritty hope is the active expectation that our own efforts can improve our future. It is deeply tied to a growth mindset—the underlying belief that your abilities and intelligence are not fixed traits, but muscles that can grow stronger through struggle and learning.\n\n**Reframing Failure**\nWhen faced with a setback, pessimists tend to view the cause as permanent and pervasive ("I always mess this up, I'm just not smart enough"). Optimists, however, view setbacks as temporary and specific ("I used the wrong strategy this time, I need to adjust"). By changing the way you explain failure to yourself, you protect your motivation and keep the door open for future success.\n\n**Getting Back Up**\nThe ultimate test of grit is not how you perform on your best days, but how you respond on your worst. Resilience is the choice to get back up after being knocked down, to dust yourself off, and to step back into the arena. Cultivate your inner dialogue, lean on your community, and remember that falling is not failing; failing is refusing to rise again.`,
    keyConcepts: ['Cultivating an active, growth-oriented hope', 'Explaining setbacks as temporary and specific', 'The enduring choice to rise after falling'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch5-ex1`,
        chapterId: `${BOOK_ID}-ch5`,
        prompt: 'When you encounter a difficult setback, what is the typical story you tell yourself about why it happened? How can you reframe that story to be temporary and specific rather than permanent?',
        exerciseType: 'reflection'
      }
    ]
  }
];
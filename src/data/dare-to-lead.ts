import { Chapter } from '../types';

const BOOK_ID = 'dare-to-lead';

export const DARE_TO_LEAD_CHAPTERS: Chapter[] = [
  {
    id: `${BOOK_ID}-ch1`,
    bookId: BOOK_ID,
    chapterNumber: 0,
    title: 'The Heart of Brave Leadership',
    content: `**Rumbling with Vulnerability**\nThe greatest myth about leadership is that it requires an armor of invulnerability. But real courage doesn't mean you don't feel fear; it means you show up anyway. Vulnerability is not a weakness; it is the absolute prerequisite for courage. It is the willingness to have tough conversations, admit when you don't know the answer, and be seen when you cannot control the outcome.\n\n**Taking Off the Armor**\nWe all have default behaviors we lean on when we feel threatened. Maybe you get defensive, maybe you shut down, or maybe you try to perfect everything to avoid criticism. This is your armor. But armor is heavy, and while it might protect you from getting hurt, it also isolates you from deep connection, innovation, and trust. A daring leader actively practices taking that armor off.\n\n**Clear is Kind**\nOne of the most challenging parts of leadership is giving honest feedback. It's tempting to sugarcoat difficult conversations to spare someone's feelings, but halfway truths are actually deeply unkind. Clarity, delivered with empathy and respect, is the kindest gift you can give. It builds trust and shows that you respect the other person enough to tell them the truth.`,
    keyConcepts: ['Vulnerability as the birthplace of courage', 'Identifying and dropping your armor', 'The kindness of clear communication'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch1-ex1`,
        chapterId: `${BOOK_ID}-ch1`,
        prompt: 'What does your "armor" look like when you feel defensive or threatened at work or in relationships? How does it get in the way of connection?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch2`,
    bookId: BOOK_ID,
    chapterNumber: 1,
    title: 'Living Into Our Values',
    content: `**Identifying Your Core Two**\nIt’s easy to have a long list of things you value—honesty, family, success, integrity. But when you value everything, you value nothing. The real test of leadership is narrowing your list down to just two core values. These are the non-negotiable principles that guide your hardest decisions when everything else is stripped away. They act as your North Star in the dark.\n\n**The Arena of Action**\nValues are not just words on a poster; they are active behaviors. It is not enough to profess your values; you must practice them, especially when it is difficult or costly to do so. Living into your values means choosing courage over comfort, and doing what is right rather than what is easy, fast, or popular. It means stepping into the arena.\n\n**Operationalizing Beliefs**\nTo truly live your values, you have to translate them into observable actions. If your core value is "courage," what does that actually look like in a meeting? If it's "accountability," how do you behave when a project fails? When you clearly define the behaviors that align with your values, you create a standard of accountability for yourself and your team.`,
    keyConcepts: ['Narrowing down to two core values', 'Practicing values over professing them', 'Translating values into observable behaviors'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch2-ex1`,
        chapterId: `${BOOK_ID}-ch2`,
        prompt: 'If you had to pick just TWO core values that define how you want to live and lead, what would they be? Why are they non-negotiable for you?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch3`,
    bookId: BOOK_ID,
    chapterNumber: 2,
    title: 'Braving Trust',
    content: `**The Marble Jar of Trust**\nTrust is not built in sweeping, dramatic gestures. It is built in tiny, everyday moments. Imagine a jar of marbles: every time you follow through on a promise, listen without interrupting, or admit a mistake, you put a marble in the jar. Over time, that jar fills up. Trust is earned drop by drop, action by action, in the quiet, unglamorous moments of daily interaction.\n\n**The Anatomy of Trust**\nTrust can feel abstract, but it is deeply structural. It requires boundaries—knowing what is okay and what is not okay. It requires reliability—doing what you say you will do over and over again. It requires accountability—owning your mistakes, apologizing, and making amends. And it requires vaulting—keeping information confidential that isn't yours to share. These elements form the bedrock of safe relationships.\n\n**Generosity of Spirit**\nOne of the most profound components of trust is the assumption of positive intent. When someone makes a mistake or a project goes sideways, do you immediately assume they were careless, or do you extend the most generous interpretation of their intentions? Assuming positive intent changes the entire dynamic of a conversation from accusatory to collaborative.`,
    keyConcepts: ['Trust is built in small moments', 'The core elements: boundaries, reliability, accountability', 'Assuming positive intent'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch3-ex1`,
        chapterId: `${BOOK_ID}-ch3`,
        prompt: 'Think of someone you deeply trust. What specific, small actions have they taken over time that built that "marble jar" of trust for you?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch4`,
    bookId: BOOK_ID,
    chapterNumber: 3,
    title: 'Learning to Rise',
    content: `**The Inevitability of Falling**\nIf you are going to lead bravely, innovate, or put yourself out there in any meaningful way, you will inevitably fail. You will face-plant in the arena. The goal is not to avoid falling; the goal is to know how to get back up. Resilience is a skill that can be learned, but it requires the courage to own your story of struggle rather than running from it.\n\n**The Reckoning with Emotion**\nWhen we experience a setback, our first instinct is often to offload the emotion—we get angry, we blame others, or we numb out. The brave leader does the opposite. They pause and reckon with the emotion. They get curious about what they are feeling. Recognizing that you are hooked by emotion is the first crucial step to navigating through it without causing damage to yourself or others.\n\n**The Rumble with the Narrative**\nIn the absence of data, we will always make up stories. When someone doesn't email us back or a project fails, our brains rapidly invent a narrative to make sense of the pain, usually one where we are the victim or completely inadequate. To rise strong, you must challenge this "shitty first draft" of your story. Separate the facts from the fiction you've created, and write a new, honest ending.`,
    keyConcepts: ['Accepting failure as part of courage', 'Reckoning with your emotional response', 'Challenging the stories we tell ourselves'],
    estimatedMinutes: 7,
    exercises: [
      {
        id: `${BOOK_ID}-ch4-ex1`,
        chapterId: `${BOOK_ID}-ch4`,
        prompt: 'Recall a recent time you felt slighted or failed at something. What was the "first draft" story your brain immediately made up? What were the actual, undeniable facts?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch5`,
    bookId: BOOK_ID,
    chapterNumber: 4,
    title: 'Cultivating a Culture of Courage',
    content: `**Embracing the Suck**\nBuilding a brave culture requires a tolerance for discomfort. We have to normalize the messy, awkward parts of growth. When you introduce a new idea or navigate a tough transition, there will be a period of friction and frustration. Instead of rushing to fix it or pretend it isn't happening, leaders must name the discomfort, hold space for it, and normalize "the suck" as a necessary part of the process.\n\n**Shame Resilience in Teams**\nShame is the ultimate killer of innovation. It creates cultures of perfectionism, blame, and fear. To combat this, teams must cultivate empathy and psychological safety. When failure occurs, the conversation should focus on fixing the process, not shaming the person. A culture where it is safe to fail is the only culture where it is possible to truly innovate.\n\n**The Power of Connection**\nAt the end of the day, leadership is not about titles or corner offices; it is about human connection. It is about recognizing the inherent worth and potential in the people around you and having the courage to develop that potential. When you lead with your heart, drop the armor, and lean into vulnerability, you give everyone around you the permission to do exactly the same.`,
    keyConcepts: ['Normalizing discomfort and messiness', 'Creating psychological safety over blame', 'Leadership as a deep human connection'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch5-ex1`,
        chapterId: `${BOOK_ID}-ch5`,
        prompt: 'How do you typically react when someone on your team (or in your life) makes a mistake? Does your reaction foster shame, or does it foster a safe environment to learn?',
        exerciseType: 'reflection'
      }
    ]
  }
];
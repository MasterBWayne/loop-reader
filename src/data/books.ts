export interface Chapter {
  number: number;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle: string;
  bookNumber: number;
  description: string;
  readTime: string;
  chapters: Chapter[];
}

export const BOOKS: Book[] = [
  {
    id: 'stop-chasing',
    title: 'Stop Chasing',
    subtitle: 'Book One',
    bookNumber: 1,
    description: 'How to break free from the loops that keep high performers stuck \u2014 and find what the last 5% actually requires.',
    readTime: '~45 min read',
    chapters: [
      {
        number: 1,
        title: 'The 95% Illusion',
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
    bookNumber: 2,
    description: 'Sun Tzu\'s 2,500-year-old strategy manual, rewritten for the war inside your head. Not metaphor \u2014 field manual.',
    readTime: '~40 min read',
    chapters: [
      {
        number: 1,
        title: 'Know Your Enemy',
        content: `Sun Tzu wrote: "If you know the enemy and know yourself, you need not fear the result of a hundred battles."

The enemy isn't your ex. It isn't your boss. It isn't the economy, your parents, or the algorithm. The enemy is the pattern you keep running that produces the same result while you expect something different.

You already know this intellectually. But knowing and seeing are not the same thing.

**Mapping the Battlefield**

Every internal battle has a structure. It feels chaotic \u2014 the anxiety, the rumination, the sudden bursts of motivation followed by collapse. But it isn't chaos. It's a system. And systems can be mapped.

Here's the map:

Trigger \u2192 Story \u2192 Feeling \u2192 Reaction \u2192 Consequence \u2192 Guilt \u2192 Repeat.

That text from someone who hurt you (trigger) becomes "they don't respect me" (story) becomes rage in your chest (feeling) becomes a sharp reply you regret (reaction) becomes distance (consequence) becomes "why do I always do this" (guilt) becomes the next trigger.

This isn't weakness. It's architecture. And architecture can be redesigned.

**The First Reconnaissance**

Sun Tzu sent scouts before sending soldiers. You need to do the same.

For the next three days, carry a note \u2014 phone or paper, doesn't matter. Every time you feel a strong emotional reaction, write down three things:
1. What happened (the trigger, not the story)
2. What your mind said about it (the story)
3. What you did next (the reaction)

Don't try to change anything yet. You're gathering intelligence. A general who attacks before understanding the terrain loses.

**Why Most Self-Help Fails Here**

Most approaches tell you to change the reaction. Meditate. Breathe. Count to ten. That's like telling a general to retreat without showing him the map first.

You can't outsmart a pattern you haven't fully seen. The reason you keep losing the same battles isn't lack of willpower \u2014 it's lack of intelligence. Not the IQ kind. The strategic kind.

*This week's mission: Map three trigger-story-reaction cycles. Don't fix them. Just see them clearly. Clarity precedes victory.*`,
      },
      {
        number: 2,
        title: 'The Terrain of Your Mind',
        content: `Sun Tzu identified nine types of terrain, each requiring a different strategy. Your mind has terrain too, and most people navigate it blind.

**The Three Internal Terrains**

Your mind operates across three distinct terrains, and the mistake most people make is using the same strategy for all of them.

Terrain One: The Open Field \u2014 this is your rational mind. Clear visibility. You can see cause and effect. Logic works here. When you're budgeting, planning a project, or solving a technical problem, you're on open ground. You're good at this terrain. It's where high performers live.

Terrain Two: The Dense Forest \u2014 this is your emotional landscape. Visibility is poor. Logic doesn't help because the trees are too thick. When you're triggered by a partner's silence, anxious about being judged, or suddenly overwhelmed for "no reason" \u2014 you're in the forest. Most of your battles are lost here because you keep trying to use open-field strategy.

Terrain Three: The Underground \u2014 this is your subconscious. The beliefs formed before age seven. The stories you absorbed from your family system before you had the capacity to question them. "Love means sacrifice." "Vulnerability is weakness." "If I'm not useful, I'm not wanted." You can't see this terrain at all \u2014 but it determines everything.

**The Strategic Error**

Your entire life, you've been a master of Terrain One. That's how you built what you built. But the problems keeping you stuck aren't Terrain One problems.

Your relationship anxiety isn't a logic problem.
Your chronic dissatisfaction isn't a planning problem.
Your inability to feel "enough" isn't an achievement problem.

These are Terrain Two and Three problems. And they require completely different weapons.

**Shifting Strategy**

On open ground, the weapon is analysis.
In the forest, the weapon is presence.
Underground, the weapon is awareness.

Analysis means breaking something into parts and reassembling it logically. This is what you do naturally.

Presence means sitting inside an experience without trying to escape, fix, or understand it. This is what you've been avoiding.

Awareness means seeing a pattern without being inside it \u2014 recognizing the underground belief that's running the show without getting recruited by it.

*Exercise: Think of a recurring emotional pattern \u2014 something that keeps happening despite your best efforts to change it. Ask yourself: Am I treating a forest problem like an open-field problem? What would it look like to stop analyzing it and simply be present with it for five minutes?*`,
      },
      {
        number: 3,
        title: 'Winning Without Fighting',
        content: `Sun Tzu's most famous principle: "The supreme art of war is to subdue the enemy without fighting."

Translated for your inner world: the highest form of personal mastery is dissolving a pattern without battling it.

**The War You've Been Waging**

Think about how you handle difficult emotions. If you're like most high performers, you do one of three things:

You suppress \u2014 push it down, get back to work, handle it later (you never do).
You analyze \u2014 turn the emotion into a problem to solve, therapize yourself, journal about it.
You perform \u2014 channel the energy into productivity, exercise, achievement. Transform pain into fuel.

All three are forms of fighting. And all three have the same fundamental flaw: they treat the emotion as the enemy.

The emotion is not the enemy. The emotion is a messenger. And you've spent your entire life shooting the messenger.

**The Surrender Strategy**

Michael Singer describes the alternative: when an emotion arises, you don't suppress it, don't analyze it, don't perform over it. You let it pass through you.

Not "letting go" in the passive, defeated sense. Letting through \u2014 like water through a net. You feel it fully without becoming it. You experience the sensation in your body without launching the story about what it means.

This sounds simple. It's the hardest thing you'll ever do. Because everything in your nervous system is wired to either fight or flee from discomfort. Sitting with it \u2014 truly sitting with it \u2014 feels like dying.

It isn't dying. It's the death of a pattern that was never actually you.

**The Practical Application**

Next time you feel a strong emotion \u2014 anger, anxiety, shame, loneliness \u2014 try this:

1. Stop what you're doing. Physically stop.
2. Find the sensation in your body. Where is it? Chest? Stomach? Throat?
3. Breathe into that specific location. Don't try to change it.
4. Stay with it for 90 seconds.

Neuroscience tells us that the chemical lifespan of an emotion is approximately 90 seconds. Everything after that is a story you're telling yourself to keep the feeling alive.

If you can sit through those 90 seconds without launching into narrative, you'll feel the emotion begin to dissolve on its own. Not because you fought it. Because you finally let it complete its natural cycle.

*This is winning without fighting.*`,
      },
      {
        number: 4,
        title: 'The Power of Position',
        content: `Sun Tzu wrote: "The clever combatant imposes his will on the enemy, but does not allow the enemy's will to be imposed on him."

In your inner world, this translates to a single question: Are you choosing your emotional position, or is it being chosen for you?

**Reactive vs. Positional**

Most people live their entire emotional lives in reactive mode. Something happens, they react. Someone says something, they feel something. The environment dictates the internal state.

This is how you've been operating \u2014 even though you'd never run a business this way. You'd never let a competitor set your strategy. You'd never let a client's mood determine your quarterly plan. But you let a partner's tone determine your entire evening.

Positional living means deciding in advance how you want to show up \u2014 and holding that position regardless of what arrives.

This isn't suppression. It's sovereignty. There's a difference between "I'm choosing not to engage with this trigger right now" and "I'm pretending this trigger doesn't exist." The first is strength. The second is a time bomb.

**Choosing Your Ground**

Every morning, before you check your phone, before you read the news, before anyone else's energy enters your field \u2014 you have a window.

In that window, you can choose your position for the day. Not your goals. Not your tasks. Your position.

Position sounds like: "Today, I'm going to respond rather than react." Or: "Today, I'm going to notice when I'm performing for approval and gently stop." Or simply: "Today, I stay present."

The moment you check your phone before choosing your position, you've handed the high ground to someone else. And you'll spend the rest of the day fighting uphill.

*Exercise: Tomorrow morning, before you touch your phone, sit for two minutes and declare your position for the day. Write it on a sticky note. Put it where you'll see it by noon. At the end of the day, honestly assess: did you hold your position, or were you pulled off it? No judgment. Just intelligence.*`,
      },
      {
        number: 5,
        title: 'Strategic Patience',
        content: 'Coming soon.\n\nThis chapter explores why the most powerful move is often no move at all \u2014 and how to distinguish strategic patience from avoidance.\n\n*This chapter will be available when the book launches.*',
      },
      {
        number: 6,
        title: 'The Energy Economy',
        content: 'Coming soon.\n\nSun Tzu never fought wars he couldn\'t afford. This chapter applies that principle to how you spend your emotional, physical, and creative energy.\n\n*This chapter will be available when the book launches.*',
      },
      {
        number: 7,
        title: 'Alliances and Boundaries',
        content: 'Coming soon.\n\nWho you let into your inner circle determines which battles you fight. This chapter is about choosing your allies and protecting your perimeter.\n\n*This chapter will be available when the book launches.*',
      },
      {
        number: 8,
        title: 'The General\'s Peace',
        content: 'Coming soon.\n\nThe final chapter: what victory actually looks like when the war is inside you. Hint \u2014 it doesn\'t look like winning. It looks like not needing to fight.\n\n*This chapter will be available when the book launches.*',
      },
    ],
  },
];

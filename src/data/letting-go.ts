import { Chapter } from '../types';

const BOOK_ID = 'letting-go';

export const LETTING_GO_CHAPTERS: Chapter[] = [
  {
    id: `${BOOK_ID}-ch1`,
    bookId: BOOK_ID,
    chapterNumber: 0,
    title: 'The Mechanism of Surrender',
    content: `**The Burden of Suppressed Emotion**
Throughout our lives, we constantly push down painful or uncomfortable feelings. We suppress them through sheer willpower, repress them entirely into the unconscious, or escape them through constant distraction and entertainment. This accumulated reservoir of negative energy does not simply disappear; it becomes the driving force behind our physical illnesses, our psychological distress, and our self-defeating behaviors. 

**The Illusion of the Mind**
We often mistakenly believe that we can think our way out of our problems. We analyze, rationalize, and try to find logical solutions to our emotional pain. However, thoughts are merely the rationalizations of the underlying feelings. A single suppressed emotion can generate thousands of anxious thoughts. If we only deal with the thoughts, we are just pruning the leaves while the root remains intact. To find true peace, we must bypass the mind entirely and address the raw emotional energy itself.

**The Art of Letting Go**
Surrender is fundamentally simple, though not always easy. It is the process of allowing a feeling to be exactly what it is, without resisting it, without trying to change it, and without judging it. It means noticing the physical sensation of the emotion in the body, ignoring all the thoughts and stories attached to it, and simply letting the energy run its course until it naturally dissipates. It is dropping the resistance.`,
    keyConcepts: ['Suppression and repression', 'Thoughts driven by feelings', 'The technique of surrender'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch1-ex1`,
        chapterId: `${BOOK_ID}-ch1`,
        prompt: 'Identify a mild annoyance you felt today. Instead of thinking about why you were annoyed, can you locate the physical sensation of that annoyance in your body and simply observe it without trying to stop it?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch2`,
    bookId: BOOK_ID,
    chapterNumber: 1,
    title: 'The Map of Consciousness',
    content: `**Levels of Energy**
Every human emotion carries a specific energetic frequency that dramatically impacts how we experience the world. The lower frequencies—such as shame, guilt, apathy, grief, and fear—are life-depleting. When we vibrate at these levels, the world appears hostile, hopeless, and terrifying. Our physical energy is drained, and our actions are driven entirely by a desperate need for survival and defense.

**The Turning Point of Courage**
As we move up the scale, passing through desire, anger, and pride, we gain more energy, though it is still largely ego-driven and combative. The massive shift occurs at the level of Courage. At this frequency, energy becomes life-affirming. We move from being victims of circumstance to being capable of facing and changing our reality. The world ceases to be an enemy and becomes a landscape of opportunity and growth.

**Ascending Through Letting Go**
We do not climb the levels of consciousness by acquiring new beliefs or forcing positive thoughts. We ascend by systematically letting go of the heavy, lower-frequency emotions that drag us down. As we surrender fear, anger, and guilt, the higher frequencies of acceptance, love, and eventually peace naturally reveal themselves. Our baseline state of being fundamentally shifts.`,
    keyConcepts: ['Emotional frequencies', 'The pivot point of Courage', 'Ascension via subtraction'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch2-ex1`,
        chapterId: `${BOOK_ID}-ch2`,
        prompt: 'Looking at your general mood over the past week, which level of consciousness (e.g., Fear, Anger, Desire, Courage) do you feel you have operated from the most?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch3`,
    bookId: BOOK_ID,
    chapterNumber: 2,
    title: 'Apathy and Grief',
    content: `**The Paralysis of Apathy**
Apathy is a state of deep despair, characterized by the belief that "I can't" and "nobody can help." It is the emotion of the victim, completely devoid of energy or hope. When we are trapped in apathy, we cannot even muster the energy to care. The way out of apathy is not to try to jump to joy, but to simply allow ourselves to desire something, or even to feel anger. Any movement is progress.

**The Weight of Unprocessed Grief**
Grief is the pain of loss—loss of a person, a dream, or a deeply held belief. We often desperately avoid feeling grief because we are terrified it will overwhelm us and never end. However, grief is an emotion like any other; it has a beginning, a middle, and an end. If we surrender to the waves of sadness without resisting them, the reservoir of grief eventually empties.

**Finding the Hidden Attachments**
Both apathy and grief are rooted in profound attachments. We believe that our source of happiness exists outside of ourselves, and when that source is threatened or lost, we collapse. By letting go of the feeling of grief, we also begin to let go of the attachment. We learn that our wholeness was never dependent on the external world.`,
    keyConcepts: ['The trap of victimhood', 'The finite nature of grief', 'Releasing attachments'],
    estimatedMinutes: 5,
    exercises: [
      {
        id: `${BOOK_ID}-ch3-ex1`,
        chapterId: `${BOOK_ID}-ch3`,
        prompt: 'Is there a past loss or failure that you still feel heavy with, but rarely allow yourself to fully cry over or mourn? What are you afraid will happen if you let the grief surface?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch4`,
    bookId: BOOK_ID,
    chapterNumber: 3,
    title: 'Anger, Pride, and Courage',
    content: `**The Fire of Anger**
Anger contains a tremendous amount of energy. While it can be destructive when acted out, it is actually a significant step up from the paralysis of apathy or fear. Anger moves us into action. However, holding onto anger poisons the body and mind. The goal is to feel the physical energy of the anger without acting on it, and without fueling it with thoughts of revenge or injustice, until the energy burns itself out.

**The Vulnerability of Pride**
Pride is often mistaken for healthy self-esteem, but it is deeply defensive and fragile. It requires constant validation and demands that we defend our opinions, our status, and our righteousness. When we operate from pride, we are easily offended and constantly engaged in conflict. Letting go of pride means surrendering the exhausting need to always be "right" and embracing true humility.

**Stepping into Courage**
When we surrender the heavy, defensive emotions, we naturally arrive at Courage. Courage is not the absence of fear; it is the willingness to move forward despite it. It is a state of empowerment, where we feel capable of handling whatever life presents. From this level, we can truly begin to dismantle the remaining layers of the ego with clarity and purpose.`,
    keyConcepts: ['Harnessing the energy of anger', 'The fragility of pride', 'True empowerment'],
    estimatedMinutes: 6,
    exercises: [
      {
        id: `${BOOK_ID}-ch4-ex1`,
        chapterId: `${BOOK_ID}-ch4`,
        prompt: 'Where in your life is your pride currently keeping you in conflict? What would it feel like to simply surrender the need to prove that you are right?',
        exerciseType: 'reflection'
      }
    ]
  },
  {
    id: `${BOOK_ID}-ch5`,
    bookId: BOOK_ID,
    chapterNumber: 4,
    title: 'Acceptance and Peace',
    content: `**The Shift to Acceptance**
At the level of Acceptance, a profound transformation occurs. We stop trying to force the world, others, and ourselves to be different than they are. We take complete responsibility for our own state of mind, realizing that no one can "make" us angry or sad without our consent. We engage with life as a creator rather than a victim, responding to challenges with harmony rather than resistance.

**The Healing Power of Love**
As we continue to let go, Acceptance deepens into Love. This is not romantic love, which is often riddled with conditions and attachments, but a pure, unconditional state of being. Love heals because it is a frequency that aligns perfectly with the truth of who we are. It dissolves the barriers between self and other, naturally bringing joy, gratitude, and a desire to serve.

**The Arrival of Peace**
The ultimate culmination of the letting go process is Peace. This is the realm of illumination, where the noisy, frantic mind finally falls entirely silent. All conflict ceases, and what remains is an unshakable, infinite stillness. We realize that this profound peace was never something we had to achieve or acquire; it was always our natural state, simply waiting for the clouds of our suppressed emotions to clear.`,
    keyConcepts: ['Total responsibility', 'Unconditional love', 'The silence of Peace'],
    estimatedMinutes: 5,
    exercises: [
      {
        id: `${BOOK_ID}-ch5-ex1`,
        chapterId: `${BOOK_ID}-ch5`,
        prompt: 'Imagine for a moment that every problem in your life is exactly as it should be, and there is nothing you need to fight or fix. Can you feel a brief glimpse of the stillness of Acceptance?',
        exerciseType: 'reflection'
      }
    ]
  }
];
import type { Lesson } from './types';
import { generatedLessons } from './generatedCurriculum';
import { flagshipLessons } from './flagshipLessons';
import { attachAudio } from './audio';

const coreLessons: Lesson[] = [
  {
    id: 'small-talk-at-work',
    number: 1,
    title: 'Small talk at work',
    situation: 'Two coworkers catch up before the weekend.',
    durationSeconds: 42,
    estimatedMinutes: 8,
    level: 'B1–B2',
    category: 'Work',
    focus: 'Natural word stress',
    intention: 'Keep the small words light and let the key words carry the meaning.',
    speakers: [
      { id: 'maya', name: 'Maya', role: 'Coworker', color: 'lime' },
      { id: 'noah', name: 'Noah', role: 'Coworker', color: 'coral' },
    ],
    lines: [
      { id: 'work-1', speakerId: 'maya', text: "Hey, how's your day going?", phraseGroups: ["Hey", "how's your day going?"], stressWords: ['day', 'going'], coachNote: 'Let “how’s your” flow together. Lift your voice slightly at the end.' },
      { id: 'work-2', speakerId: 'noah', text: "Pretty good. I've been busy, but I'm almost done.", phraseGroups: ['Pretty good', "I've been busy", "but I'm almost done"], stressWords: ['good', 'busy', 'done'], coachNote: 'Keep “I’ve been” light. Give GOOD, BUSY, and DONE a clear beat.' },
      { id: 'work-3', speakerId: 'maya', text: 'Nice! Any plans for the weekend?', phraseGroups: ['Nice!', 'Any plans', 'for the weekend?'], stressWords: ['plans', 'weekend'], coachNote: 'Sound genuinely curious. Smile and make WEEKEND the strongest word.' },
      { id: 'work-4', speakerId: 'noah', text: "Yeah, I'm meeting some friends on Saturday.", phraseGroups: ['Yeah', "I'm meeting some friends", 'on Saturday'], stressWords: ['friends', 'Saturday'], coachNote: 'Reduce “some” and “on.” Land clearly on SATURDAY.' },
      { id: 'work-5', speakerId: 'maya', text: 'Sounds good. I hope you have a great time.', phraseGroups: ['Sounds good', 'I hope you have', 'a great time'], stressWords: ['good', 'great'], coachNote: 'Keep it warm and relaxed. Do not rush the last phrase.' },
      { id: 'work-6', speakerId: 'noah', text: 'Thanks! What about you?', phraseGroups: ['Thanks!', 'What about you?'], stressWords: ['Thanks', 'you'], coachNote: 'Make this a real handoff. Stress YOU to turn the question back.' },
    ],
    expressions: [
      { phrase: 'Pretty good', meaning: 'Things are going reasonably well.', example: 'How are you? Pretty good, thanks.' },
      { phrase: 'Sounds good', meaning: 'I like or agree with that idea.', example: 'Let’s meet at six. Sounds good.' },
      { phrase: 'What about you?', meaning: 'A natural way to return the same question.', example: 'I work from home. What about you?' },
    ],
    stressExercise: {
      sentence: 'I thought the meeting was tomorrow.',
      prompt: 'Which word corrects the day?',
      answer: 'tomorrow',
      options: [
        { word: 'I', meaning: 'I thought it—not necessarily someone else.' },
        { word: 'meeting', meaning: 'The meeting, rather than another event.' },
        { word: 'tomorrow', meaning: 'Tomorrow, not the day someone just mentioned.' },
      ],
      coachNote: 'Contrastive stress gently corrects information without adding more words.',
    },
  },
  {
    id: 'ordering-coffee',
    number: 2,
    title: 'Ordering coffee',
    situation: 'A quick, friendly order at a neighborhood café.',
    durationSeconds: 36,
    estimatedMinutes: 7,
    level: 'A2–B1',
    category: 'Food',
    focus: 'Polite rhythm',
    intention: 'Sound friendly by grouping requests and softening the small words.',
    speakers: [
      { id: 'barista', name: 'Alex', role: 'Barista', color: 'lime' },
      { id: 'customer', name: 'Sam', role: 'Customer', color: 'coral' },
    ],
    lines: [
      { id: 'coffee-1', speakerId: 'barista', text: 'Hi there! What can I get for you?', phraseGroups: ['Hi there!', 'What can I get', 'for you?'], stressWords: ['get', 'you'], coachNote: 'Keep the greeting bright. “Can I” should be quick and light.' },
      { id: 'coffee-2', speakerId: 'customer', text: "Could I get a small latte, please?", phraseGroups: ['Could I get', 'a small latte', 'please?'], stressWords: ['small', 'latte'], coachNote: 'Link “could I” smoothly. Let PLEASE sound warm, not heavy.' },
      { id: 'coffee-3', speakerId: 'barista', text: 'Sure. Would you like that hot or iced?', phraseGroups: ['Sure', 'Would you like that', 'hot or iced?'], stressWords: ['hot', 'iced'], coachNote: 'Give HOT and ICED equal weight so both choices are clear.' },
      { id: 'coffee-4', speakerId: 'customer', text: 'Iced, please. And could I have oat milk?', phraseGroups: ['Iced, please', 'And could I have', 'oat milk?'], stressWords: ['Iced', 'oat'], coachNote: 'Pause after PLEASE. Stress OAT because it is the new detail.' },
      { id: 'coffee-5', speakerId: 'barista', text: "Of course. That'll be four fifty.", phraseGroups: ['Of course', "That'll be", 'four fifty'], stressWords: ['course', 'four', 'fifty'], coachNote: '“That’ll” contracts into two easy beats: THAT-ll.' },
    ],
    expressions: [
      { phrase: 'Could I get…?', meaning: 'A common, polite way to order.', example: 'Could I get a glass of water?' },
      { phrase: 'Of course', meaning: 'A friendly way to say yes.', example: 'Can I sit here? Of course.' },
    ],
    stressExercise: {
      sentence: 'Could I get a small latte?',
      prompt: 'Which word changes the size of the order?',
      answer: 'small',
      options: [
        { word: 'I', meaning: 'You, rather than someone else, are ordering.' },
        { word: 'small', meaning: 'A small one, not another size.' },
        { word: 'latte', meaning: 'A latte, rather than another drink.' },
      ],
      coachNote: 'Stress the detail that distinguishes your choice.',
    },
  },
  {
    id: 'moving-a-meeting',
    number: 3,
    title: 'Moving a meeting',
    situation: 'Two teammates find a better time to talk.',
    durationSeconds: 46,
    estimatedMinutes: 9,
    level: 'B1–B2',
    category: 'Work',
    focus: 'Polite correction',
    intention: 'Use pauses and contrastive stress to make changes easy to follow.',
    speakers: [
      { id: 'lina', name: 'Lina', role: 'Designer', color: 'lime' },
      { id: 'omar', name: 'Omar', role: 'Developer', color: 'coral' },
    ],
    lines: [
      { id: 'meeting-1', speakerId: 'lina', text: 'Are we still on for three this afternoon?', phraseGroups: ['Are we still on', 'for three', 'this afternoon?'], stressWords: ['still', 'three'], coachNote: 'STILL checks whether the original plan remains true.' },
      { id: 'meeting-2', speakerId: 'omar', text: "Actually, could we make it four instead?", phraseGroups: ['Actually', 'could we make it four', 'instead?'], stressWords: ['four', 'instead'], coachNote: 'Pause after ACTUALLY. Stress FOUR to make the correction clear.' },
      { id: 'meeting-3', speakerId: 'lina', text: "Four works for me. I'll update the invite.", phraseGroups: ['Four works for me', "I'll update", 'the invite'], stressWords: ['Four', 'update'], coachNote: 'A falling tone on “me” makes your agreement sound settled.' },
      { id: 'meeting-4', speakerId: 'omar', text: 'Perfect. Thanks for being flexible.', phraseGroups: ['Perfect', 'Thanks', 'for being flexible'], stressWords: ['Perfect', 'flexible'], coachNote: 'Slow down slightly on FLEXIBLE so the thanks feels sincere.' },
      { id: 'meeting-5', speakerId: 'lina', text: 'No worries. Talk to you then.', phraseGroups: ['No worries', 'Talk to you then'], stressWords: ['worries', 'then'], coachNote: '“Talk to you” often links into one smooth phrase.' },
    ],
    expressions: [
      { phrase: 'Are we still on?', meaning: 'Is our existing plan still happening?', example: 'Are we still on for lunch?' },
      { phrase: 'Works for me', meaning: 'That time or plan is convenient for me.', example: 'Tuesday at ten works for me.' },
      { phrase: 'No worries', meaning: 'It is not a problem.', example: 'Sorry I’m late. No worries.' },
    ],
    stressExercise: {
      sentence: 'Could we meet at four instead?',
      prompt: 'Which word corrects the meeting time?',
      answer: 'four',
      options: [
        { word: 'we', meaning: 'Us, rather than another group.' },
        { word: 'meet', meaning: 'Meet, rather than call or write.' },
        { word: 'four', meaning: 'Four, rather than the previous time.' },
      ],
      coachNote: 'Put the strongest beat on the replacement information.',
    },
  },
  {
    id: 'catching-up',
    number: 4,
    title: 'Catching up',
    situation: 'Two friends run into each other after a long time.',
    durationSeconds: 51,
    estimatedMinutes: 9,
    level: 'B2–C1',
    category: 'Social',
    focus: 'Warm, expressive intonation',
    intention: 'Use pitch changes and pauses to sound interested—not rushed.',
    speakers: [
      { id: 'june', name: 'June', role: 'Friend', color: 'lime' },
      { id: 'daniel', name: 'Daniel', role: 'Friend', color: 'coral' },
    ],
    lines: [
      { id: 'catch-1', speakerId: 'june', text: "Daniel? I haven't seen you in ages!", phraseGroups: ['Daniel?', "I haven't seen you", 'in ages!'], stressWords: ['Daniel', 'ages'], coachNote: 'Let the name rise with surprise, then stretch AGES a little.' },
      { id: 'catch-2', speakerId: 'daniel', text: "I know! It's been way too long. How have you been?", phraseGroups: ['I know!', "It's been way too long", 'How have you been?'], stressWords: ['way', 'long', 'been'], coachNote: 'WAY strengthens “too long.” Pause before the real question.' },
      { id: 'catch-3', speakerId: 'june', text: "Really good, actually. I just started a new job.", phraseGroups: ['Really good, actually', 'I just started', 'a new job'], stressWords: ['good', 'new', 'job'], coachNote: 'Stress NEW JOB as the news you want your friend to notice.' },
      { id: 'catch-4', speakerId: 'daniel', text: "That's amazing. Tell me all about it.", phraseGroups: ["That's amazing", 'Tell me', 'all about it'], stressWords: ['amazing', 'all'], coachNote: 'Use a wider pitch range on AMAZING to show real enthusiasm.' },
      { id: 'catch-5', speakerId: 'june', text: "I'd love to. Do you have time for a coffee?", phraseGroups: ["I'd love to", 'Do you have time', 'for a coffee?'], stressWords: ['love', 'time', 'coffee'], coachNote: 'Keep “do you have” light so TIME and COFFEE stand out.' },
      { id: 'catch-6', speakerId: 'daniel', text: "Absolutely. Let's go to that place around the corner.", phraseGroups: ['Absolutely', "Let's go to that place", 'around the corner'], stressWords: ['Absolutely', 'place', 'corner'], coachNote: 'Start decisively, then relax through the suggestion.' },
    ],
    expressions: [
      { phrase: 'In ages', meaning: 'For a very long time.', example: 'I haven’t been there in ages.' },
      { phrase: 'Tell me all about it', meaning: 'I am interested; give me the details.', example: 'You got the job? Tell me all about it.' },
      { phrase: 'Around the corner', meaning: 'Very nearby, past the next corner.', example: 'There’s a bakery around the corner.' },
    ],
    stressExercise: {
      sentence: 'I just started a new job.',
      prompt: 'Which word makes the job the new information?',
      answer: 'job',
      options: [
        { word: 'I', meaning: 'You did—not another person.' },
        { word: 'started', meaning: 'You started it, rather than only considering it.' },
        { word: 'job', meaning: 'The job is the important new thing.' },
      ],
      coachNote: 'New information often receives the final, strongest beat.',
    },
  },
];

const reviewedById = new Map(flagshipLessons.map((lesson) => [lesson.id, lesson]));

const collectionByCategory: Record<Lesson['category'], NonNullable<Lesson['collection']>> = {
  Everyday: 'Everyday Social English',
  Work: 'Workplace Conversations',
  Social: 'Everyday Social English',
  Travel: 'Travel and Services',
  Food: 'Everyday Social English',
  Home: 'Everyday Social English',
  Services: 'Travel and Services',
  Community: 'Everyday Social English',
  Wellbeing: 'Difficult Conversations',
  Ideas: 'Storytelling and Opinions',
};

const reviewedCore = coreLessons.map((lesson) => ({
  ...lesson,
  contentStatus: 'reviewed' as const,
  collection: 'Start Here' as const,
}));

const catalogLessons = generatedLessons.map((lesson) => {
  const reviewed = reviewedById.get(lesson.id);
  return reviewed
    ? { ...reviewed, contentStatus: 'reviewed' as const, collection: 'Start Here' as const }
    : { ...lesson, contentStatus: 'draft' as const, collection: collectionByCategory[lesson.category] };
});

export const lessons: Lesson[] = [...reviewedCore, ...catalogLessons].map((lesson) => attachAudio(lesson));

export const flagshipLessonIds = lessons
  .filter((lesson) => lesson.collection === 'Start Here')
  .map((lesson) => lesson.id);

export const getLessonById = (id: string) => lessons.find((lesson) => lesson.id === id);

export const getTodaysLesson = (date = new Date()) => {
  const anchorDay = Math.floor(Date.UTC(2026, 0, 1) / 86_400_000);
  const civilDay = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const index = ((civilDay - anchorDay) % lessons.length + lessons.length) % lessons.length;
  return lessons[index] ?? lessons[0]!;
};

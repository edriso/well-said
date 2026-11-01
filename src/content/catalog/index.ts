import type { Lesson } from '../types';
import { communityLessons } from './community';
import { everydayLessons } from './everyday';
import { foodLessons } from './food';
import { homeLessons } from './home';
import { ideasLessons } from './ideas';
import { servicesLessons } from './services';
import { socialLessons } from './social';
import { startHereLessons } from './startHere';
import { travelLessons } from './travel';
import { wellbeingLessons } from './wellbeing';
import { workLessons } from './work';

export { startHereLessons };

/** Every hand-authored workout outside Start Here, grouped by situation family. */
export const categoryLessons: Lesson[] = [
  ...everydayLessons,
  ...workLessons,
  ...socialLessons,
  ...travelLessons,
  ...foodLessons,
  ...homeLessons,
  ...servicesLessons,
  ...communityLessons,
  ...wellbeingLessons,
  ...ideasLessons,
];

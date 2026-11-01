import { useEffect, useState } from 'react';
import { lessons } from '../content/lessons';
import type { Lesson } from '../content/types';
import { useProgress } from '../hooks/useProgress';
import { usePreferences } from '../hooks/usePreferences';
import { useTheme } from '../hooks/useTheme';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';
import { scrollToTop } from '../lib/motion';

export function App() {
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(() => {
    const requestedId = new URLSearchParams(window.location.search).get('workout');
    return lessons.find((item) => item.id === requestedId);
  });
  const progressApi = useProgress();
  const preferencesApi = usePreferences();
  const themeApi = useTheme();

  const openLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    const url = new URL(window.location.href);
    url.searchParams.set('workout', lesson.id);
    window.history.pushState({}, '', url);
    scrollToTop();
  };

  const closeLesson = () => {
    setActiveLesson(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete('workout');
    window.history.pushState({}, '', url);
    scrollToTop();
  };

  useEffect(() => {
    const onPopState = () => {
      const id = new URLSearchParams(window.location.search).get('workout');
      setActiveLesson(lessons.find((lesson) => lesson.id === id));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return activeLesson ? (
    <WorkoutScreen lesson={activeLesson} onClose={closeLesson} progressApi={progressApi} themeApi={themeApi} />
  ) : (
    <HomeScreen progress={progressApi.progress} onOpenLesson={openLesson} preferencesApi={preferencesApi} themeApi={themeApi} />
  );
}

import { useEffect, useState } from 'react';
import { lessons } from '../content/lessons';
import type { Lesson } from '../content/types';
import { useProgress } from '../hooks/useProgress';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutScreen } from '../screens/WorkoutScreen';

export function App() {
  const [activeLesson, setActiveLesson] = useState<Lesson | undefined>(() => {
    const requestedId = new URLSearchParams(window.location.search).get('workout');
    return lessons.find((item) => item.id === requestedId);
  });
  const progressApi = useProgress();

  const openLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    const url = new URL(window.location.href);
    url.searchParams.set('workout', lesson.id);
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0 });
  };

  const closeLesson = () => {
    setActiveLesson(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete('workout');
    window.history.pushState({}, '', url);
    window.scrollTo({ top: 0 });
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
    <WorkoutScreen lesson={activeLesson} onClose={closeLesson} progressApi={progressApi} />
  ) : (
    <HomeScreen progress={progressApi.progress} onOpenLesson={openLesson} />
  );
}

import { ArrowRight, Check, Clock3, Headphones, Search, Settings2, Sparkles, Volume2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { hasModelAudio } from '../content/audio';
import { lessons } from '../content/lessons';
import { LESSON_CATEGORIES, type Lesson, type ProgressState } from '../content/types';
import { selectDailyLesson } from '../content/recommendations';
import { Brand } from '../components/Brand';
import { ThemeToggle } from '../components/ThemeToggle';
import type { usePreferences } from '../hooks/usePreferences';
import { countCompletedWorkouts, countPracticeDaysThisWeek, countPracticedLines } from '../hooks/useProgress';
import type { useTheme } from '../hooks/useTheme';

const usesModelAudio = lessons.some(hasModelAudio);

type Props = {
  progress: ProgressState;
  onOpenLesson: (lesson: Lesson) => void;
  preferencesApi: ReturnType<typeof usePreferences>;
  themeApi: ReturnType<typeof useTheme>;
};

export function HomeScreen({ progress, onOpenLesson, preferencesApi, themeApi }: Props) {
  const today = useMemo(() => selectDailyLesson(progress, preferencesApi.preferences), [preferencesApi.preferences, progress]);
  const completedToday = Boolean(progress.lessons[today.id]?.completedAt);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(12);
  const filteredLessons = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return lessons.filter((lesson) => {
      const matchesCategory = category === 'All' || lesson.category === category;
      const matchesQuery = !normalizedQuery || [lesson.title, lesson.situation, lesson.focus, lesson.category].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);
  const visibleLessons = filteredLessons.slice(0, visibleCount);

  return (
    <main className="home-shell">
      <nav className="topbar page-width" aria-label="Primary navigation">
        <Brand />
        <div className="topbar-actions"><span className="nav-note">Daily speaking practice</span><ThemeToggle theme={themeApi.theme} onToggle={themeApi.toggleTheme} /></div>
      </nav>

      <section className="hero page-width" aria-labelledby="home-heading">
        <div className="hero-copy">
          <p className="eyebrow"><span className="live-dot" /> Your daily speaking gym</p>
          <h1 id="home-heading">Sound a little more <em>natural</em> today.</h1>
          <p className="hero-subtitle">One real conversation. A few focused reps. No grammar drills, scores, or clutter.</p>
        </div>

        <article className="today-card">
          <div className="today-card-top">
            <p className="eyebrow">Today’s workout</p>
            <span className="workout-number">#{String(today.number).padStart(2, '0')}</span>
          </div>
          <div className="today-title-row">
            <div className="lesson-icon"><Volume2 size={25} aria-hidden="true" /></div>
            <div>
              <p className="scenario">{today.situation}</p>
              <h2>{today.title}</h2>
            </div>
          </div>
          <div className="lesson-meta" aria-label="Workout details">
            <span><Clock3 size={16} /> {today.estimatedMinutes} min</span>
            <span>{today.level}</span>
            <span>{today.category}</span>
            <span><Sparkles size={16} /> {today.focus}</span>
          </div>
          <blockquote>“{today.intention}”</blockquote>
          <button className="primary-button large" onClick={() => onOpenLesson(today)}>
            {completedToday ? 'Practice again' : 'Start workout'} <ArrowRight size={20} />
          </button>
          <p className="audio-note"><Headphones size={15} aria-hidden="true" /> {hasModelAudio(today) ? 'Model audio performed with synthetic voices.' : 'Browser demo voice until model audio is added.'}</p>
        </article>
      </section>

      <section className="progress-strip page-width" aria-label="Your weekly progress">
        <div><strong>{countPracticeDaysThisWeek(progress)}</strong><span>days practiced this week</span></div>
        <div><strong>{progress.totalReps.toLocaleString()}</strong><span>real speaking reps</span></div>
        <div><strong>{countPracticedLines(progress)}</strong><span>lines practiced</span></div>
        <div><strong>{countCompletedWorkouts(progress)}</strong><span>workouts complete</span></div>
      </section>

      <section className="preferences-section page-width" aria-labelledby="preferences-title">
        <details className="preferences-card">
          <summary><span><Settings2 aria-hidden="true" /><strong id="preferences-title">Make today’s workout fit you</strong></span><small>Level and situations</small></summary>
          <div className="preferences-body">
            <fieldset>
              <legend>Speaking comfort</legend>
              <div className="choice-row">
                {([['steady', 'Build steadily'], ['everyday', 'Everyday challenge'], ['stretch', 'Stretch me']] as const).map(([value, label]) => (
                  <label key={value}><input type="radio" name="comfort" checked={preferencesApi.preferences.comfort === value} onChange={() => preferencesApi.setPreferences({ comfort: value })} /> {label}</label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Situations that matter most</legend>
              <div className="choice-row categories">
                {LESSON_CATEGORIES.map((area) => <label key={area}><input type="checkbox" checked={preferencesApi.preferences.areas.includes(area)} onChange={() => preferencesApi.setPreferences({ areas: preferencesApi.preferences.areas.includes(area) ? preferencesApi.preferences.areas.filter((item) => item !== area) : [...preferencesApi.preferences.areas, area] })} /> {area}</label>)}
              </div>
            </fieldset>
            <p>Your choices stay in this browser and gently adjust the daily recommendation. The full library remains available.</p>
          </div>
        </details>
      </section>

      <section className="library page-width" aria-labelledby="library-title">
        <div className="section-heading">
          <div><p className="eyebrow">Keep exploring</p><h2 id="library-title">Workout library</h2></div>
          <p>{lessons.length} short conversations—more than six months of daily practice without a repeat.</p>
        </div>
        <div className="library-tools">
          <label className="search-field"><Search aria-hidden="true" /><span className="sr-only">Search workouts</span><input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(12); }} placeholder="Search situations or skills" /></label>
          <label className="category-field"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setVisibleCount(12); }}><option>All</option>{LESSON_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <span className="result-count" aria-live="polite">{filteredLessons.length} {filteredLessons.length === 1 ? 'workout' : 'workouts'}</span>
        </div>
        <div className="lesson-grid">
          {visibleLessons.map((lesson) => {
            const complete = Boolean(progress.lessons[lesson.id]?.completedAt);
            return (
              <button className="lesson-card" key={lesson.id} onClick={() => onOpenLesson(lesson)}>
                <span className="lesson-card-index">{complete ? <Check size={17} /> : String(lesson.number).padStart(2, '0')}</span>
                <span className="lesson-card-copy"><strong>{lesson.title}</strong><small>{lesson.category} · {lesson.focus} · {lesson.estimatedMinutes} min{hasModelAudio(lesson) ? ' · Model audio' : ''}</small></span>
                <ArrowRight className="card-arrow" size={19} />
              </button>
            );
          })}
        </div>
        {filteredLessons.length === 0 && <div className="empty-library"><strong>No workouts found.</strong><p>Try a broader situation, skill, or category.</p></div>}
        {visibleCount < filteredLessons.length && <button className="secondary-button load-more" onClick={() => setVisibleCount((count) => count + 12)}>Show 12 more <ArrowRight /></button>}
      </section>

      <footer className="page-width">
        <Brand />
        <div className="footer-copy">
          <p>Show up. Speak out. Leave a little clearer.</p>
          {usesModelAudio && <small>Model audio voiced with <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">ElevenLabs</a>.</small>}
        </div>
      </footer>
    </main>
  );
}

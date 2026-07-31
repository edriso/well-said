import { ArrowRight, Check, Clock3, Headphones, Sparkles, Volume2 } from 'lucide-react';
import { getTodaysLesson, lessons } from '../content/lessons';
import type { Lesson, ProgressState } from '../content/types';
import { Brand } from '../components/Brand';

type Props = {
  progress: ProgressState;
  onOpenLesson: (lesson: Lesson) => void;
};

export function HomeScreen({ progress, onOpenLesson }: Props) {
  const today = getTodaysLesson();
  const completedToday = Boolean(progress.lessons[today.id]?.completedAt);

  return (
    <main className="home-shell">
      <nav className="topbar page-width" aria-label="Primary navigation">
        <Brand />
        <span className="nav-note">Daily speaking practice</span>
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
            <span><Sparkles size={16} /> {today.focus}</span>
          </div>
          <blockquote>“{today.intention}”</blockquote>
          <button className="primary-button large" onClick={() => onOpenLesson(today)}>
            {completedToday ? 'Practice again' : 'Start workout'} <ArrowRight size={20} />
          </button>
          <p className="audio-note"><Headphones size={15} /> Demo voice is active until studio audio is added.</p>
        </article>
      </section>

      <section className="progress-strip page-width" aria-label="Your progress">
        <div><strong>{progress.totalSentences.toLocaleString()}</strong><span>sentences shadowed</span></div>
        <div><strong>{progress.totalReps.toLocaleString()}</strong><span>speaking reps</span></div>
        <div><strong>{Object.values(progress.lessons).filter((item) => item.completedAt).length}</strong><span>workouts complete</span></div>
      </section>

      <section className="library page-width" aria-labelledby="library-title">
        <div className="section-heading">
          <div><p className="eyebrow">Keep exploring</p><h2 id="library-title">Workout library</h2></div>
          <p>Short conversations for moments that happen in real life.</p>
        </div>
        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const complete = Boolean(progress.lessons[lesson.id]?.completedAt);
            return (
              <button className="lesson-card" key={lesson.id} onClick={() => onOpenLesson(lesson)}>
                <span className="lesson-card-index">{complete ? <Check size={17} /> : String(lesson.number).padStart(2, '0')}</span>
                <span className="lesson-card-copy"><strong>{lesson.title}</strong><small>{lesson.focus} · {lesson.estimatedMinutes} min</small></span>
                <ArrowRight className="card-arrow" size={19} />
              </button>
            );
          })}
        </div>
      </section>

      <footer className="page-width"><Brand /><p>Show up. Speak out. Leave a little clearer.</p></footer>
    </main>
  );
}

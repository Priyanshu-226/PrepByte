import { useMemo } from 'react';
import { Bar, Intro } from '../ui.jsx';
import { useApp } from '../lib/context.js';
import { lastDays, longestStreak, readinessLabel, topicStats } from '../lib/stats.js';

export default function Insights() {
  const { problems, topics, progress, solvedSet, score, streak, due } = useApp();
  const { goal } = progress;
  const ts = useMemo(() => topicStats(problems, topics, solvedSet), [problems, topics, solvedSet]);
  const all = useMemo(() => {
    const out = {};
    for (const level of ['Easy', 'Medium', 'Hard']) {
      const list = problems.filter(p => p.difficulty === level);
      out[level] = { total: list.length, done: list.filter(p => solvedSet.has(p.id)).length };
    }
    return out;
  }, [problems, solvedSet]);

  const weakest = [...ts].sort((a, b) => a.pct - b.pct)[0];
  const days = lastDays(progress.activity, 14);
  const max = Math.max(1, ...days.map(d => d.count));
  const advice =
    score < 25
      ? `Start with the highest-frequency ${goal.company} questions. Two or three a day builds the habit.`
      : weakest && weakest.pct < 100
        ? `${weakest.name} is your weakest area at ${weakest.pct}% covered. Put your next sessions there.`
        : 'Every topic is covered. Keep reviewing to hold on to it.';

  return (
    <>
      <Intro eyebrow="PROGRESS ANALYTICS" title="Know what to improve next." text="Use readiness signals to decide your next practice session." />
      <section className="insights">
        <article>
          <small>OVERALL READINESS</small>
          <b>
            {score}
            <i>/100</i>
          </b>
          <strong>{readinessLabel(score)}</strong>
          <p>{advice}</p>
        </article>
        <div className="panel">
          <h3>Topic coverage</h3>
          {ts.map(t => (
            <Bar key={t.name} n={t.name} v={t.pct} weak={t.pct < 40} note={`${t.done}/${t.total}`} />
          ))}
        </div>
        <div className="panel">
          <h3>Review signals</h3>
          <p>
            <b>{progress.solved.length}</b> of {problems.length} questions solved
          </p>
          <p>
            <b>{progress.saved.length}</b> saved for revision
          </p>
          <p>
            <b>{due.length}</b> reviews due now
          </p>
          <p>
            <b>{streak}</b> day streak, <b>{Math.max(streak, longestStreak(progress.activity))}</b> longest
          </p>
          <h3 className="sub">By difficulty</h3>
          {['Easy', 'Medium', 'Hard'].map(level => (
            <Bar key={level} n={level} v={all[level].total ? Math.round((all[level].done / all[level].total) * 100) : 0} note={`${all[level].done}/${all[level].total}`} />
          ))}
        </div>
      </section>

      <section className="panel spaced">
        <small>LAST 14 DAYS</small>
        <h3>Daily activity</h3>
        <div className="chart" role="img" aria-label="Problems solved or reviewed per day for the last 14 days">
          {days.map(d => (
            <div key={d.key} title={`${d.key}: ${d.count}`}>
              <i style={{ height: `${Math.max(d.count ? 12 : 3, (d.count / max) * 100)}%` }} className={d.count ? 'on' : ''} />
              <small>{d.date}</small>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

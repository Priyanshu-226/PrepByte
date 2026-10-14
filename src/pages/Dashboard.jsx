import { useMemo } from 'react';
import { Bar, Card, Empty, Row } from '../ui.jsx';
import { RefreshIcon } from '../icons.jsx';
import { useApp } from '../lib/context.js';
import { companyProgress, dailyPlan, daysLeft, lastDays, longestStreak, topicStats } from '../lib/stats.js';

export default function Dashboard() {
  const { problems, topics, progress, solvedSet, score, streak, due, setPage, goPractice } = useApp();
  const { goal } = progress;
  const days = daysLeft(goal.targetDate);

  const plan = useMemo(() => dailyPlan(problems, solvedSet, goal.company, 4), [problems, solvedSet, goal.company]);
  const mine = useMemo(() => companyProgress(problems, goal.company, solvedSet), [problems, goal.company, solvedSet]);
  const focus = useMemo(
    () => topicStats(problems, topics, solvedSet).filter(t => t.pct < 100).sort((a, b) => a.pct - b.pct).slice(0, 3),
    [problems, topics, solvedSet]
  );
  const week = lastDays(progress.activity, 7);
  const weekTotal = week.reduce((n, d) => n + d.count, 0);

  const hint = focus[0] ? ` ${focus[0].name} is the best place to grow next.` : '';
  const copy = mine.total ? `${mine.done} of ${mine.total} ${goal.company} questions done.${hint}` : 'Start with the highest-frequency questions and build from there.';

  return (
    <>
      <section className="hero">
        <div>
          <small>YOUR PERSONALIZED PLAN</small>
          <h2>
            {goal.company} {goal.role}
            <br />
            {days > 0 ? (
              <>
                in <i>{days} {days === 1 ? 'day' : 'days'}</i>
              </>
            ) : (
              <i>set a new date</i>
            )}
          </h2>
          <p>{copy}</p>
          <div className="hero-actions">
            <button onClick={() => goPractice({ company: goal.company, status: 'Unsolved' })}>{progress.solved.length ? 'Continue practice' : 'Start practicing'}</button>
            <button className="ghost" onClick={() => setPage('Profile')}>
              Change target
            </button>
          </div>
        </div>
        <div className="ring" style={{ '--p': score }} role="img" aria-label={`${score}% ready`}>
          <b>{score}%</b>
          <span>ready</span>
        </div>
      </section>

      <section className="stats">
        <Card n={progress.solved.length} t="Problems solved" sub={`of ${problems.length} in the library`} />
        <Card n={streak} t="Day streak" sub={streak ? `Longest: ${Math.max(streak, longestStreak(progress.activity))} days` : 'Solve one today to start a streak'} />
        <Card n={due.length} t="Reviews due" sub={due.length ? 'Revisit them before they fade' : 'Nothing waiting right now'} />
      </section>

      {due.length > 0 && (
        <button className="banner" onClick={() => setPage('Revision')}>
          <RefreshIcon size={16} />
          <span>
            <b>{due.length} {due.length === 1 ? 'review is' : 'reviews are'} due.</b> Spaced repetition works best when you revisit on time.
          </span>
          <em>Review now</em>
        </button>
      )}

      <section className="grid">
        <div className="panel">
          <div className="head">
            <div>
              <small>NEXT UP</small>
              <h3>Today's plan</h3>
            </div>
            <button onClick={() => goPractice({ company: goal.company })}>See all</button>
          </div>
          {plan.map(p => (
            <Row p={p} company={goal.company} key={p.id} />
          ))}
          {!plan.length && <Empty>You have solved every question in the library. Import more through the admin API to keep going.</Empty>}
        </div>

        <div className="stack">
          <div className="panel">
            <small>THIS WEEK</small>
            <h3>{weekTotal} {weekTotal === 1 ? 'session' : 'sessions'}</h3>
            <div className="week">
              {week.map(d => (
                <div key={d.key} className={(d.isToday ? 'today ' : '') + (d.count ? 'hit' : '')}>
                  <small>{d.label}</small>
                  <b>{d.date}</b>
                  <i title={`${d.count} solved or reviewed`} />
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <small>SKILL MAP</small>
            <h3>Focus next</h3>
            {focus.map(t => (
              <Bar key={t.name} n={t.name} v={t.pct} weak={t.pct < 50} />
            ))}
            {!focus.length && <Empty>Every topic is fully covered.</Empty>}
          </div>
        </div>
      </section>
    </>
  );
}

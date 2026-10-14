import { useMemo } from 'react';
import { Empty, Intro, Row } from '../ui.jsx';
import { useApp } from '../lib/context.js';
import { dueText, reviewQueue } from '../lib/stats.js';

export default function Revision() {
  const { progress, byId, review, openProblem, savedSet, problems } = useApp();
  const { due, upcoming } = useMemo(() => reviewQueue(progress.reviews, byId), [progress.reviews, byId]);
  const saved = problems.filter(p => savedSet.has(p.id));

  return (
    <>
      <Intro eyebrow="SPACED REPETITION" title="Keep it fresh." text="Solved questions come back after 1, 3, 7, 14, 30, and 60 days. Rate each review to adjust the schedule." badge={`${due.length} due`} />

      <section className="panel">
        <div className="head">
          <div>
            <small>DUE NOW</small>
            <h3>Review queue</h3>
          </div>
        </div>
        {due.map(item => (
          <div className="review" key={item.problem.id}>
            <button className="title" onClick={() => openProblem(item.problem)}>
              <b>{item.problem.title}</b>
              <small>
                {item.problem.topic} · <i className={item.problem.difficulty.toLowerCase()}>{item.problem.difficulty}</i> · {dueText(item.due)}
              </small>
            </button>
            <span className="gap">every {item.interval} {item.interval === 1 ? 'day' : 'days'}</span>
            <button className="outline" onClick={() => review(item.problem.id, false)}>
              Struggled
            </button>
            <button className="primary" onClick={() => review(item.problem.id, true)}>
              Nailed it
            </button>
          </div>
        ))}
        {!due.length && <Empty>{progress.solved.length ? 'Nothing is due. Come back tomorrow, or practice something new.' : 'Solve a problem and it will come back here for review tomorrow.'}</Empty>}
      </section>

      {upcoming.length > 0 && (
        <section className="panel spaced">
          <small>COMING UP</small>
          <h3>Next reviews</h3>
          {upcoming.slice(0, 8).map(item => (
            <div className="upcoming" key={item.problem.id}>
              <button className="title" onClick={() => openProblem(item.problem)}>
                <b>{item.problem.title}</b>
                <small>{item.problem.topic}</small>
              </button>
              <span>{dueText(item.due)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="panel spaced">
        <small>BOOKMARKS</small>
        <h3>Saved for later</h3>
        {saved.map(p => (
          <Row p={p} showSave key={p.id} />
        ))}
        {!saved.length && <Empty>Bookmark a question from the Practice page and it will show up here.</Empty>}
      </section>
    </>
  );
}

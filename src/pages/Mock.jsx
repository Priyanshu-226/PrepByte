import { useEffect, useState } from 'react';
import { Empty, Intro, Select } from '../ui.jsx';
import { ExternalIcon } from '../icons.jsx';
import { useApp } from '../lib/context.js';
import { formatClock } from '../lib/stats.js';

const KEY = 'prepbyte:mock';
const PLANS = { 2: ['Medium', 'Medium'], 3: ['Easy', 'Medium', 'Hard'], 4: ['Easy', 'Medium', 'Medium', 'Hard'] };

function loadRun() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.ids) && saved.endsAt) return saved;
  } catch { /* ignore */ }
  return null;
}

export default function Mock() {
  const { problems, byId, companies, progress, solvedSet, addMock, markSolved, notify, openProblem } = useApp();
  const [setup, setSetup] = useState({ company: progress.goal.company, count: 3, minutes: 60 });
  const [run, setRun] = useState(loadRun);
  const [now, setNow] = useState(Date.now());
  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      if (run) localStorage.setItem(KEY, JSON.stringify(run));
      else localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [run]);

  useEffect(() => {
    if (!run) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [run]);

  const start = () => {
    const pool = problems.filter(p => setup.company === 'Any' || p.companies.includes(setup.company));
    const used = new Set();
    const picked = [];
    for (const level of PLANS[setup.count]) {
      const options = pool.filter(p => p.difficulty === level && !used.has(p.id));
      const fresh = options.filter(p => !solvedSet.has(p.id));
      const top = (fresh.length ? fresh : options).sort((a, b) => b.frequency - a.frequency).slice(0, 8);
      if (!top.length) continue;
      const pick = top[Math.floor(Math.random() * top.length)];
      used.add(pick.id);
      picked.push(pick.id);
    }
    if (picked.length < 2) {
      notify('Not enough questions for that company and mix.');
      return;
    }
    setResult(null);
    setNow(Date.now());
    setRun({ ids: picked, company: setup.company, startedAt: Date.now(), endsAt: Date.now() + setup.minutes * 60000, minutes: setup.minutes, done: [] });
  };

  const toggleDone = id => setRun(r => ({ ...r, done: r.done.includes(id) ? r.done.filter(x => x !== id) : [...r.done, id] }));

  const finish = () => {
    const seconds = Math.min(86400, Math.max(0, Math.round((Date.now() - run.startedAt) / 1000)));
    run.done.forEach(markSolved);
    addMock({ at: new Date().toISOString(), company: run.company, total: run.ids.length, solved: run.done.length, seconds });
    setResult({ solved: run.done.length, total: run.ids.length, seconds });
    setRun(null);
  };

  const left = run ? Math.max(0, Math.ceil((run.endsAt - now) / 1000)) : 0;

  return (
    <>
      <Intro eyebrow="MOCK INTERVIEW" title="Practice under pressure." text="Get a timed set of questions in the style of your target company. Solve them on LeetCode, tick them off here, and review how it went." badge={`${progress.mocks.length} completed`} />

      {run && (
        <section className="panel mock-run">
          <div className="mock-top">
            <div>
              <small>{run.company === 'Any' ? 'ANY COMPANY' : run.company.toUpperCase()} · {run.minutes} MIN</small>
              <h3>{left > 0 ? 'Interview in progress' : "Time's up"}</h3>
            </div>
            <strong className={'mock-clock' + (left === 0 ? ' over' : left < 300 ? ' low' : '')}>{formatClock(left)}</strong>
          </div>
          {run.ids.map(id => {
            const p = byId.get(id);
            if (!p) return null;
            const done = run.done.includes(id);
            return (
              <div className={'mock-q' + (done ? ' done' : '')} key={id}>
                <button className="check" aria-pressed={done} aria-label={done ? `Unmark ${p.title}` : `Mark ${p.title} solved`} onClick={() => toggleDone(id)}>
                  {done && '✓'}
                </button>
                <button className="title" onClick={() => openProblem(p)}>
                  <b>{p.title}</b>
                  <small>
                    {p.topic} · <i className={p.difficulty.toLowerCase()}>{p.difficulty}</i> · about {p.time} min
                  </small>
                </button>
                {p.url && (
                  <a className="outline link" href={p.url} target="_blank" rel="noopener noreferrer">
                    <ExternalIcon size={14} /> Open
                  </a>
                )}
              </div>
            );
          })}
          <div className="modal-actions">
            <button className="primary" onClick={finish}>
              Finish interview ({run.done.length}/{run.ids.length} solved)
            </button>
            <button className="outline" onClick={() => setRun(null)}>
              Abandon
            </button>
          </div>
        </section>
      )}

      {!run && result && (
        <section className="panel mock-result">
          <small>RESULT</small>
          <h3>
            {result.solved} of {result.total} solved in {formatClock(result.seconds)}
          </h3>
          <p>{result.solved === result.total ? 'Clean sweep. Those solves are now in your review queue.' : result.solved ? 'Good effort. Solved ones are added to your reviews; revisit the rest in Practice.' : 'Tough round. Pick the topics you struggled with and try again tomorrow.'}</p>
        </section>
      )}

      {!run && (
        <section className="panel spaced">
          <small>NEW SESSION</small>
          <h3>Set up your interview</h3>
          <div className="mock-setup">
            <label className="field">
              <span>Company</span>
              <Select label="Company" v={setup.company} set={company => setSetup(s => ({ ...s, company }))} options={['Any', ...companies.map(c => c.name)]} />
            </label>
            <label className="field">
              <span>Questions</span>
              <Select label="Number of questions" v={`${setup.count} questions`} set={v => setSetup(s => ({ ...s, count: Number(v[0]) }))} options={['2 questions', '3 questions', '4 questions']} />
            </label>
            <label className="field">
              <span>Time limit</span>
              <Select label="Time limit" v={`${setup.minutes} min`} set={v => setSetup(s => ({ ...s, minutes: parseInt(v, 10) }))} options={['45 min', '60 min', '90 min']} />
            </label>
          </div>
          <p className="note">Prefers questions you have not solved yet, picking from the most-asked ones. Mix: {PLANS[setup.count].join(', ')}.</p>
          <div className="modal-actions">
            <button className="primary" onClick={start}>
              Start mock interview
            </button>
          </div>
        </section>
      )}

      <section className="panel spaced">
        <small>HISTORY</small>
        <h3>Past interviews</h3>
        {progress.mocks.slice(0, 8).map(m => (
          <div className="mock-hist" key={m.at}>
            <span>{new Date(m.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
            <b>{m.company}</b>
            <span>
              {m.solved}/{m.total} solved
            </span>
            <span className="mono">{formatClock(m.seconds)}</span>
          </div>
        ))}
        {!progress.mocks.length && <Empty>Your finished mock interviews will show up here.</Empty>}
      </section>
    </>
  );
}

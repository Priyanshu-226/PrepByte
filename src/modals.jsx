import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, X } from 'lucide-react';
import { useApp } from './lib/context.js';
import { formatClock } from './lib/stats.js';
import { ExternalIcon, PauseIcon, PlayIcon, RefreshIcon } from './icons.jsx';
import { SignInPanel } from './signin.jsx';

function useEscape(close) {
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
}

const backdropClose = close => e => {
  if (e.target === e.currentTarget) close();
};

export function ProblemModal({ p, close }) {
  const { isSolved, isSaved, toggleSolved, toggleSaved, progress, setNote, topics } = useApp();
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const closeRef = useRef(null);
  useEscape(close);
  useEffect(() => closeRef.current?.focus(), []);
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const solved = isSolved(p.id);
  const saved = isSaved(p.id);
  const concepts = topics.find(t => t.name === p.topic)?.concepts ?? [];
  const best = progress.times[p.id];
  const over = seconds > p.time * 60;

  const markSolved = () => {
    setRunning(false);
    toggleSolved(p.id, solved ? 0 : seconds);
  };

  return (
    <div className="modal-bg" onMouseDown={backdropClose(close)}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pm-title">
        <button className="close" ref={closeRef} onClick={close} aria-label="Close">
          <X size={20} />
        </button>
        <small>{p.companies.join(', ')}</small>
        <h2 id="pm-title">{p.title}</h2>
        <p className="meta">
          <b className={p.difficulty.toLowerCase()}>{p.difficulty}</b> · {p.topic} · {p.frequency}% interview frequency · about {p.time} minutes
        </p>

        <div className={'timer' + (over ? ' over' : '')}>
          <strong aria-live="off">{formatClock(seconds)}</strong>
          <span>of {formatClock(p.time * 60)} target</span>
          <div>
            <button className="outline" onClick={() => setRunning(r => !r)}>
              {running ? <PauseIcon size={14} /> : <PlayIcon size={14} />} {running ? 'Pause' : seconds ? 'Resume' : 'Start timer'}
            </button>
            {seconds > 0 && (
              <button
                className="outline"
                onClick={() => {
                  setRunning(false);
                  setSeconds(0);
                }}
              >
                <RefreshIcon size={14} /> Reset
              </button>
            )}
          </div>
        </div>
        {best && <p className="best">Your best time: {formatClock(best)}</p>}

        {concepts.length > 0 && (
          <div className="concepts">
            <span>Patterns to recall</span>
            {concepts.map(c => (
              <i key={c}>{c}</i>
            ))}
          </div>
        )}

        <label className="notes">
          <span>Your notes</span>
          <textarea rows={4} maxLength={2000} placeholder="Approach, edge cases, what tripped you up…" value={progress.notes[p.id] || ''} onChange={e => setNote(p.id, e.target.value)} />
        </label>

        <div className="modal-actions">
          {p.url && (
            <a className="outline link" href={p.url} target="_blank" rel="noopener noreferrer">
              <ExternalIcon size={14} /> Open on LeetCode
            </a>
          )}
          <button className="primary" onClick={markSolved}>
            {solved ? '✓ Solved' : 'Mark as solved'}
          </button>
          <button className="outline" onClick={() => toggleSaved(p.id)}>
            <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save for review'}
          </button>
        </div>
      </section>
    </div>
  );
}

export function AuthModal({ close }) {
  useEscape(close);
  return (
    <div className="modal-bg" onMouseDown={backdropClose(close)}>
      <section className="modal auth" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" className="close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>
        <small>PREPBYTE ACCOUNT</small>
        <h2 id="auth-title">Sign in to sync</h2>
        <p>Keep your progress, notes, and reviews across devices. Everything you have done here is merged into your account.</p>
        <SignInPanel onDone={close} />
      </section>
    </div>
  );
}

export function Palette({ close }) {
  const { problems, openProblem, setPage, pages } = useApp();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  useEscape(close);

  const items = useMemo(() => {
    const s = q.trim().toLowerCase();
    const inTitle = p => p.title.toLowerCase().includes(s);
    // Title matches rank first, so "coin" finds Coin Change before every question tagged Coinbase.
    const found = (s
      ? problems.filter(p => `${p.title} ${p.topic} ${p.companies.join(' ')}`.toLowerCase().includes(s)).sort((a, b) => Number(inTitle(b)) - Number(inTitle(a)) || b.frequency - a.frequency)
      : [...problems].sort((a, b) => b.frequency - a.frequency).slice(0, 5)
    )
      .slice(0, 8)
      .map(p => ({ key: p.id, label: p.title, hint: `${p.topic} · ${p.difficulty}`, run: () => openProblem(p) }));
    const goto = pages
      .filter(n => !s || n.toLowerCase().includes(s))
      .map(n => ({ key: `page-${n}`, label: `Go to ${n}`, hint: 'Page', run: () => setPage(n) }));
    return [...found, ...goto];
  }, [q, problems, pages, openProblem, setPage]);

  const run = item => {
    close();
    item.run();
  };

  const onKeyDown = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex(i => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && items[index]) {
      e.preventDefault();
      run(items[index]);
    }
  };

  return (
    <div className="modal-bg top" onMouseDown={backdropClose(close)}>
      <section className="palette" role="dialog" aria-modal="true" aria-label="Quick search">
        <input
          autoFocus
          placeholder="Search questions, topics, companies, or pages"
          value={q}
          onChange={e => {
            setQ(e.target.value);
            setIndex(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul>
          {items.map((item, i) => (
            <li key={item.key}>
              <button className={i === index ? 'on' : ''} onMouseEnter={() => setIndex(i)} onClick={() => run(item)}>
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </button>
            </li>
          ))}
          {!items.length && <li className="none">Nothing matches that search.</li>}
        </ul>
      </section>
    </div>
  );
}

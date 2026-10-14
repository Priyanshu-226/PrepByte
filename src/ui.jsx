import { Bookmark, Check } from 'lucide-react';
import { useApp } from './lib/context.js';

export function Bar({ n, v, weak, note }) {
  return (
    <div className="bar">
      <div>
        <span>{n}</span>
        <b>{note ?? `${v}%`}</b>
      </div>
      <i>
        <em className={weak ? 'weak' : ''} style={{ width: `${v}%` }} />
      </i>
    </div>
  );
}

export function Select({ v, set, options, label, disabled }) {
  return (
    <select aria-label={label} value={v} disabled={disabled} onChange={e => set(e.target.value)}>
      {options.map(x => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
}

export function Card({ n, t, sub }) {
  return (
    <article className="card">
      <b>{n}</b>
      <span>{t}</span>
      <small>{sub}</small>
    </article>
  );
}

export function Intro({ eyebrow, title, text, badge }) {
  return (
    <section className="intro">
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
      {badge && <b>{badge}</b>}
    </section>
  );
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>;
}

export function Row({ p, company, showSave }) {
  const { isSolved, isSaved, toggleSolved, toggleSaved, openProblem } = useApp();
  const solved = isSolved(p.id);
  const saved = isSaved(p.id);
  const shown = company && p.companies.includes(company) ? company : p.companies[0];
  const extra = p.companies.length - 1;
  return (
    <div className={'row' + (solved ? ' solved' : '')}>
      <button className="check" aria-label={solved ? `Mark ${p.title} as not solved` : `Mark ${p.title} as solved`} aria-pressed={solved} onClick={() => toggleSolved(p.id)}>
        {solved && <Check size={13} />}
      </button>
      <button className="title" onClick={() => openProblem(p)}>
        <b>{p.title}</b>
        <small>
          {p.topic} · <i className={p.difficulty.toLowerCase()}>{p.difficulty}</i>
          {p.acceptance !== null && ` · ${p.acceptance}% accepted`}
        </small>
      </button>
      <span className="co">
        {shown}
        {extra > 0 && <em> +{extra}</em>}
      </span>
      <span className="freq">{p.frequency}%</span>
      <span className="mins">{p.time}m</span>
      {showSave ? (
        <button className={'save' + (saved ? ' on' : '')} aria-label={saved ? 'Remove from saved' : 'Save for review'} aria-pressed={saved} onClick={() => toggleSaved(p.id)}>
          <Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      ) : (
        <button className="start" onClick={() => openProblem(p)}>
          Start
        </button>
      )}
    </div>
  );
}

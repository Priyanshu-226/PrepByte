import { useMemo, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { Bar, Empty, Intro, Row } from '../ui.jsx';
import { BackIcon } from '../icons.jsx';
import { useApp } from '../lib/context.js';
import { companyProgress } from '../lib/stats.js';

const CATEGORY_ORDER = ['Big Tech', 'Product', 'Finance', 'India', 'Services'];

export default function Companies() {
  const { companies, problems, solvedSet, goPractice, progress, setGoal, notify } = useApp();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('All');
  const active = companies.find(c => c.name === open);
  const categories = useMemo(() => ['All', ...CATEGORY_ORDER.filter(c => companies.some(x => x.category === c)), ...new Set(companies.map(c => c.category).filter(c => !CATEGORY_ORDER.includes(c)))], [companies]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return companies.filter(c => (category === 'All' || c.category === category) && (!s || c.name.toLowerCase().includes(s)));
  }, [companies, q, category]);

  if (active) {
    return <CompanyDetail company={active} onBack={() => setOpen(null)} {...{ problems, solvedSet, goPractice, progress, setGoal, notify }} />;
  }

  return (
    <>
      <Intro eyebrow="COMPANY-WISE PREPARATION" title="Train for your target." text="Focused queues built from company interview patterns. Company tags here are illustrative seed data; import your own for real numbers." badge={`${companies.length} companies`} />
      <section className="company-filters">
        <label>
          <Search size={16} />
          <input placeholder="Search companies" aria-label="Search companies" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <div className="chips">
          {categories.map(c => (
            <button key={c} className={category === c ? 'on' : ''} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </section>
      <section className="companies">
        {shown.map((c, i) => {
          const p = companyProgress(problems, c.name, solvedSet);
          return (
            <button onClick={() => setOpen(c.name)} key={c.name}>
              <b className={'logo l' + (i % 5)}>{c.name[0]}</b>
              <div>
                <h3>{c.name}</h3>
                <small>{c.count} curated questions</small>
                <i className="mini">
                  <em style={{ width: `${p.pct}%` }} />
                </i>
              </div>
              <span>
                {p.done}/{p.total} solved
              </span>
              <ChevronRight size={17} />
            </button>
          );
        })}
        {!shown.length && <Empty>No companies match that search.</Empty>}
      </section>
    </>
  );
}

function CompanyDetail({ company, onBack, problems, solvedSet, goPractice, progress, setGoal, notify }) {
  const p = useMemo(() => companyProgress(problems, company.name, solvedSet), [problems, company.name, solvedSet]);
  const top = [...p.list].sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  const isTarget = progress.goal.company === company.name;

  return (
    <>
      <button className="back" onClick={onBack}>
        <BackIcon size={15} /> All companies
      </button>
      <section className="panel company-head">
        <b className="logo l0">{company.name[0]}</b>
        <div>
          <small>COMPANY GUIDE · {company.category.toUpperCase()}</small>
          <h2>{company.name}</h2>
          <p>{company.blurb || `${company.count} questions tagged for ${company.name}.`}</p>
        </div>
        <div className="company-actions">
          <button className="primary" onClick={() => goPractice({ company: company.name })}>
            Practice {company.name}
          </button>
          <button
            className="outline"
            disabled={isTarget}
            onClick={() => {
              setGoal({ company: company.name });
              notify(`${company.name} is now your target.`);
            }}
          >
            {isTarget ? '✓ Your target' : 'Set as my target'}
          </button>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="head">
            <div>
              <small>MOST ASKED</small>
              <h3>Top questions</h3>
            </div>
            <button onClick={() => goPractice({ company: company.name })}>See all {p.total}</button>
          </div>
          {top.map(q => (
            <Row p={q} company={company.name} key={q.id} />
          ))}
          {!top.length && <Empty>No questions tagged yet.</Empty>}
        </div>
        <div className="stack">
          <div className="panel">
            <small>YOUR PROGRESS</small>
            <h3>
              {p.done} of {p.total} solved
            </h3>
            {['Easy', 'Medium', 'Hard'].map(level => (
              <Bar key={level} n={level} v={p.byLevel[level].total ? Math.round((p.byLevel[level].done / p.byLevel[level].total) * 100) : 0} note={`${p.byLevel[level].done}/${p.byLevel[level].total}`} />
            ))}
          </div>
          {company.rounds.length > 0 && (
            <div className="panel">
              <small>TYPICAL INTERVIEW FLOW</small>
              <ol className="rounds">
                {company.rounds.map(r => (
                  <li key={r}>{r}</li>
                ))}
              </ol>
              <p className="note">Loops change by role, team, and year. Check your recruiter's guidance.</p>
            </div>
          )}
          {company.focus.length > 0 && (
            <div className="panel">
              <small>FOCUS TOPICS</small>
              <div className="chips">
                {company.focus.map(t => (
                  <button key={t} onClick={() => goPractice({ company: company.name, topic: t })}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

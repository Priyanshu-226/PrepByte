import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { Empty, Intro, Row, Select } from '../ui.jsx';
import { useApp } from '../lib/context.js';

const LEVEL = { Easy: 0, Medium: 1, Hard: 2 };
const ACCEPTANCE = {
  'Any rate': () => true,
  '60% or more': a => a !== null && a >= 60,
  '40% to 60%': a => a !== null && a >= 40 && a < 60,
  'Under 40%': a => a !== null && a < 40
};
const SORTS = {
  'Most asked': (a, b) => b.frequency - a.frequency || a.title.localeCompare(b.title),
  'Easiest first': (a, b) => LEVEL[a.difficulty] - LEVEL[b.difficulty] || b.frequency - a.frequency,
  'Shortest first': (a, b) => a.time - b.time || b.frequency - a.frequency,
  'Highest acceptance': (a, b) => (b.acceptance ?? -1) - (a.acceptance ?? -1) || b.frequency - a.frequency,
  'Lowest acceptance': (a, b) => (a.acceptance ?? 101) - (b.acceptance ?? 101) || b.frequency - a.frequency,
  'A to Z': (a, b) => a.title.localeCompare(b.title)
};

export default function Practice() {
  const { problems, companies, topics, filters, setFilters, resetFilters, solvedSet, savedSet } = useApp();
  const { q, company, topic, level, status, acceptance, sort } = filters;
  const hasAcceptance = problems.some(p => p.acceptance !== null);
  const set = key => value => setFilters(f => ({ ...f, [key]: value }));

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return problems
      .filter(
        p =>
          (!s || `${p.title} ${p.topic} ${p.companies.join(' ')}`.toLowerCase().includes(s)) &&
          (company === 'All' || p.companies.includes(company)) &&
          (topic === 'All' || p.topic === topic) &&
          (level === 'All' || p.difficulty === level) &&
          (ACCEPTANCE[acceptance] || ACCEPTANCE['Any rate'])(p.acceptance) &&
          (status === 'All' ||
            (status === 'Solved' && solvedSet.has(p.id)) ||
            (status === 'Unsolved' && !solvedSet.has(p.id)) ||
            (status === 'Saved' && savedSet.has(p.id)))
      )
      .sort(SORTS[sort] || SORTS['Most asked']);
  }, [problems, q, company, topic, level, status, acceptance, sort, solvedSet, savedSet]);

  return (
    <>
      <Intro eyebrow="CURATED QUESTION LIBRARY" title="Practice with purpose." text="Find questions by company, pattern, difficulty, and interview frequency." badge={`${results.length} ${results.length === 1 ? 'result' : 'results'}`} />
      <section className="filters">
        <label>
          <Search size={17} />
          <input placeholder="Search questions, topics or companies" aria-label="Search questions" value={q} onChange={e => set('q')(e.target.value)} />
        </label>
        <Select label="Company" v={company} set={set('company')} options={['All', ...companies.map(c => c.name)]} />
        <Select label="Topic" v={topic} set={set('topic')} options={['All', ...topics.map(t => t.name)]} />
        <Select label="Difficulty" v={level} set={set('level')} options={['All', 'Easy', 'Medium', 'Hard']} />
        <Select label="Status" v={status} set={set('status')} options={['All', 'Unsolved', 'Solved', 'Saved']} />
        <Select label="Acceptance rate" v={acceptance} set={set('acceptance')} options={Object.keys(ACCEPTANCE)} disabled={!hasAcceptance} />
        <Select label="Sort" v={sort} set={set('sort')} options={Object.keys(SORTS)} />
        <button onClick={resetFilters}>Reset</button>
      </section>
      {!hasAcceptance && <p className="note filters-note">Acceptance rates are empty until you run <code>npm run sync:leetcode</code> with the API running.</p>}
      <section className="panel table">
        <div className="table-head">
          <span />
          <span>QUESTION</span>
          <span>COMPANY</span>
          <span>FREQ.</span>
          <span>TIME</span>
          <span />
        </div>
        {results.map(p => (
          <Row p={p} company={company === 'All' ? undefined : company} showSave key={p.id} />
        ))}
        {!results.length && (
          <Empty>
            No questions match these filters. <button className="linklike" onClick={resetFilters}>Clear all filters</button> to see the full library.
          </Empty>
        )}
      </section>
    </>
  );
}

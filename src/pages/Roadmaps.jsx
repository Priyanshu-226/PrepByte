import { useMemo, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { Intro, Row } from '../ui.jsx';
import { useApp } from '../lib/context.js';
import { topicStats } from '../lib/stats.js';

export default function Roadmaps() {
  const { problems, topics, solvedSet, goPractice } = useApp();
  const [open, setOpen] = useState(null);
  const stats = useMemo(() => topicStats(problems, topics, solvedSet), [problems, topics, solvedSet]);
  const complete = stats.filter(t => t.pct === 100).length;

  return (
    <>
      <Intro eyebrow="STRUCTURED LEARNING" title="Your DSA roadmap." text="Work through the topics in order. Each one finishes when you have solved all of its questions." badge={`${complete}/${stats.length} complete`} />
      <section className="road">
        {stats.map((t, i) => {
          const isOpen = open === t.name;
          return (
            <article key={t.name} className={(t.pct === 100 ? 'done ' : '') + (isOpen ? 'open' : '')}>
              <div className="road-head">
                <span className="check static">{t.pct === 100 && <Check size={13} />}</span>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <button className="road-title" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : t.name)}>
                  <h3>{t.name}</h3>
                  <small>
                    {t.concepts.length} concepts · {t.total} questions · {t.done} solved
                  </small>
                  <i className="mini">
                    <em style={{ width: `${t.pct}%` }} />
                  </i>
                </button>
                <button className="outline" onClick={() => goPractice({ topic: t.name })}>
                  Practice
                </button>
                <button className={'chev' + (isOpen ? ' on' : '')} aria-label={isOpen ? 'Collapse' : 'Expand'} onClick={() => setOpen(isOpen ? null : t.name)}>
                  <ChevronRight size={17} />
                </button>
              </div>
              {isOpen && (
                <div className="road-body">
                  {t.concepts.length > 0 && (
                    <div className="concepts">
                      <span>Concepts</span>
                      {t.concepts.map(c => (
                        <i key={c}>{c}</i>
                      ))}
                    </div>
                  )}
                  {[...t.list].sort((a, b) => b.frequency - a.frequency).map(p => (
                    <Row p={p} key={p.id} />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </section>
    </>
  );
}

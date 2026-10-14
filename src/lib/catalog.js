import { normalizeProblem } from '../../shared/problems.js';

// Turn raw problems + company/topic info into what the UI needs.
export function catalogFrom(rawProblems, companyList, topicList) {
  const problems = rawProblems.map(normalizeProblem).filter(Boolean);
  const byId = new Map(problems.map(p => [p.id, p]));

  const info = new Map((companyList || []).map(c => [c.name, c]));
  const counts = new Map();
  for (const p of problems) for (const c of p.companies) counts.set(c, (counts.get(c) || 0) + 1);
  const companies = [...counts]
    .map(([name, count]) => ({ blurb: '', rounds: [], focus: [], category: 'Product', ...info.get(name), name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const ordered = (topicList || []).filter(t => problems.some(p => p.topic === t.name));
  const known = new Set((topicList || []).map(t => t.name));
  const extra = [...new Set(problems.map(p => p.topic))].filter(name => !known.has(name)).map(name => ({ name, concepts: [] }));

  return { problems, byId, companies, topics: [...ordered, ...extra] };
}

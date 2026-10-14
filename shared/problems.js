// Problem shape shared by the API server and the browser.
export const LEVELS = ['Easy', 'Medium', 'Hard'];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;

// Acceptance rate in percent with one decimal, or null when unknown.
function percent(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : null;
}

export function normalizeProblem(p) {
  if (!p || typeof p !== 'object') return null;
  const id = typeof p.id === 'string' ? p.id.trim() : '';
  const title = typeof p.title === 'string' ? p.title.trim() : '';
  const topic = typeof p.topic === 'string' ? p.topic.trim() : '';
  const list = Array.isArray(p.companies) ? p.companies : [p.company];
  const companies = [...new Set(list.filter(c => typeof c === 'string' && c.trim()).map(c => c.trim().slice(0, 40)))];
  if (!ID_RE.test(id) || !title || !topic || !companies.length || !LEVELS.includes(p.difficulty)) return null;
  const num = (v, fallback, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  };
  return {
    id,
    title: title.slice(0, 140),
    topic: topic.slice(0, 60),
    difficulty: p.difficulty,
    company: companies[0],
    companies,
    time: num(p.time, 25, 1, 240),
    frequency: num(p.frequency, 50, 0, 100),
    acceptance: percent(p.acceptance),
    url: typeof p.url === 'string' && /^https?:\/\//.test(p.url) ? p.url : ''
  };
}

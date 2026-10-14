import { dayKey, DAY_MS } from '../../shared/progress.js';

const WEIGHT = { Easy: 1, Medium: 2, Hard: 3 };

export function topicStats(problems, topics, solvedSet) {
  return topics
    .map(t => {
      const list = problems.filter(p => p.topic === t.name);
      const done = list.filter(p => solvedSet.has(p.id)).length;
      return { name: t.name, concepts: t.concepts, total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0, list };
    })
    .filter(t => t.total > 0);
}

export function companyProgress(problems, company, solvedSet) {
  const list = problems.filter(p => p.companies.includes(company));
  const byLevel = {};
  for (const level of ['Easy', 'Medium', 'Hard']) {
    const inLevel = list.filter(p => p.difficulty === level);
    byLevel[level] = { total: inLevel.length, done: inLevel.filter(p => solvedSet.has(p.id)).length };
  }
  const done = list.filter(p => solvedSet.has(p.id)).length;
  return { list, total: list.length, done, pct: list.length ? Math.round((done / list.length) * 100) : 0, byLevel };
}

// Readiness is measured against fixed benchmarks, so it does not shrink as the library grows:
//   60%  progress through the target company's 50 most-asked questions (harder ones count more)
//   40%  topic coverage, where a topic counts as covered after about 6 solved questions
const BENCHMARK_QUESTIONS = 50;
const TOPIC_TARGET = 6;

export function readiness(problems, topics, solvedSet, company) {
  const mine = problems.filter(p => p.companies.includes(company));
  const pool = mine.length ? mine : problems;
  const weight = list => list.reduce((n, p) => n + WEIGHT[p.difficulty], 0);
  const benchmark = [...pool].sort((a, b) => b.frequency - a.frequency).slice(0, BENCHMARK_QUESTIONS);
  const companyPart = weight(benchmark) ? Math.min(1, weight(pool.filter(p => solvedSet.has(p.id))) / weight(benchmark)) : 0;
  const ts = topicStats(problems, topics, solvedSet);
  const topicPart = ts.length ? ts.reduce((n, t) => n + Math.min(1, t.done / Math.min(t.total, TOPIC_TARGET)), 0) / ts.length : 0;
  return Math.round(100 * (0.6 * companyPart + 0.4 * topicPart));
}

export function readinessLabel(score) {
  if (score < 25) return 'Just starting';
  if (score < 50) return 'Building momentum';
  if (score < 75) return 'On track';
  return 'Interview ready';
}

export function currentStreak(activity, today = new Date()) {
  const d = new Date(today);
  if (!(activity[dayKey(d)] > 0)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (activity[dayKey(d)] > 0) {
    n += 1;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function longestStreak(activity) {
  const keys = Object.keys(activity).filter(k => activity[k] > 0).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const key of keys) {
    const t = Date.parse(`${key}T00:00:00`);
    run = prev !== null && Math.round((t - prev) / DAY_MS) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export function lastDays(activity, n, today = new Date()) {
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({ key, count: activity[key] || 0, label: 'SMTWTFS'[d.getDay()], date: d.getDate(), isToday: i === 0 });
  }
  return out;
}

export function reviewQueue(reviews, byId, now = Date.now()) {
  const items = Object.entries(reviews)
    .map(([id, r]) => ({ problem: byId.get(id), due: Date.parse(r.due), interval: r.interval }))
    .filter(x => x.problem && !Number.isNaN(x.due))
    .sort((a, b) => a.due - b.due);
  return { due: items.filter(x => x.due <= now), upcoming: items.filter(x => x.due > now) };
}

export function dueText(due, now = Date.now()) {
  const diff = due - now;
  if (diff <= 0) {
    const late = Math.floor(-diff / DAY_MS);
    return late < 1 ? 'Due today' : `Overdue by ${late} ${late === 1 ? 'day' : 'days'}`;
  }
  const days = Math.ceil(diff / DAY_MS);
  return days <= 1 ? 'Tomorrow' : `In ${days} days`;
}

export function dailyPlan(problems, solvedSet, company, n = 4) {
  const byFrequency = (a, b) => b.frequency - a.frequency || a.title.localeCompare(b.title);
  const open = problems.filter(p => !solvedSet.has(p.id));
  const mine = open.filter(p => p.companies.includes(company)).sort(byFrequency);
  const rest = open.filter(p => !p.companies.includes(company)).sort(byFrequency);
  return [...mine, ...rest].slice(0, n);
}

export function daysLeft(targetDate, now = Date.now()) {
  const end = Date.parse(`${targetDate}T23:59:59`);
  return Number.isNaN(end) ? 0 : Math.max(0, Math.ceil((end - now) / DAY_MS));
}

export function formatClock(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

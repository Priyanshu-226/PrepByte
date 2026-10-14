// MongoDB aggregation pipelines for catalog analytics and per-user roadmap summaries,
// each with an in-memory equivalent that is used when MongoDB is not connected.
const round1 = n => (n === null ? null : Math.round(n * 10) / 10);
const countIf = level => ({ $sum: { $cond: [{ $eq: ['$difficulty', level] }, 1, 0] } });

// Questions per company with average frequency, average acceptance, and the difficulty split.
export const companyStatsPipeline = () => [
  { $unwind: '$companies' },
  { $group: { _id: '$companies', problems: { $sum: 1 }, avgFrequency: { $avg: '$frequency' }, avgAcceptance: { $avg: '$acceptance' }, easy: countIf('Easy'), medium: countIf('Medium'), hard: countIf('Hard') } },
  { $project: { _id: 0, company: '$_id', problems: 1, avgFrequency: { $round: ['$avgFrequency', 1] }, avgAcceptance: { $round: ['$avgAcceptance', 1] }, easy: 1, medium: 1, hard: 1 } },
  { $sort: { problems: -1, company: 1 } }
];

export const topicStatsPipeline = () => [
  { $group: { _id: '$topic', problems: { $sum: 1 }, avgFrequency: { $avg: '$frequency' }, avgAcceptance: { $avg: '$acceptance' }, easy: countIf('Easy'), medium: countIf('Medium'), hard: countIf('Hard') } },
  { $project: { _id: 0, topic: '$_id', problems: 1, avgFrequency: { $round: ['$avgFrequency', 1] }, avgAcceptance: { $round: ['$avgAcceptance', 1] }, easy: 1, medium: 1, hard: 1 } },
  { $sort: { problems: -1, topic: 1 } }
];

// Solved questions per topic for one user: join the progress document to the problems collection.
export const userSummaryPipeline = userId => [
  { $match: { userId } },
  { $project: { _id: 0, solved: '$data.solved' } },
  { $unwind: '$solved' },
  { $lookup: { from: 'problems', localField: 'solved', foreignField: 'id', as: 'problem' } },
  { $unwind: '$problem' },
  { $group: { _id: '$problem.topic', solved: { $sum: 1 } } },
  { $project: { _id: 0, topic: '$_id', solved: 1 } },
  { $sort: { solved: -1, topic: 1 } }
];

function statsBy(list, keysOf, label) {
  const groups = new Map();
  for (const p of list) {
    for (const key of keysOf(p)) {
      const g = groups.get(key) || { [label]: key, problems: 0, freq: 0, acc: 0, accN: 0, easy: 0, medium: 0, hard: 0 };
      g.problems += 1;
      g.freq += p.frequency;
      if (p.acceptance !== null && p.acceptance !== undefined) {
        g.acc += p.acceptance;
        g.accN += 1;
      }
      g[p.difficulty.toLowerCase()] += 1;
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map(g => ({ [label]: g[label], problems: g.problems, avgFrequency: round1(g.freq / g.problems), avgAcceptance: g.accN ? round1(g.acc / g.accN) : null, easy: g.easy, medium: g.medium, hard: g.hard }))
    .sort((a, b) => b.problems - a.problems || String(a[label]).localeCompare(String(b[label])));
}

export const companyStatsFromList = list => statsBy(list, p => p.companies, 'company');
export const topicStatsFromList = list => statsBy(list, p => [p.topic], 'topic');

export function userSummaryFromList(list, solvedIds) {
  const solved = new Set(solvedIds);
  const counts = new Map();
  for (const p of list) if (solved.has(p.id)) counts.set(p.topic, (counts.get(p.topic) || 0) + 1);
  return [...counts].map(([topic, n]) => ({ topic, solved: n })).sort((a, b) => b.solved - a.solved || a.topic.localeCompare(b.topic));
}

// Combine topic totals with a user's solved counts, in roadmap order.
export function buildRoadmap(topicOrder, topicTotals, solvedRows) {
  const total = new Map(topicTotals.map(t => [t.topic, t.problems]));
  const solved = new Map(solvedRows.map(r => [r.topic, r.solved]));
  return topicOrder
    .filter(name => total.has(name))
    .map(name => ({ topic: name, total: total.get(name), solved: solved.get(name) || 0, pct: Math.round(((solved.get(name) || 0) / total.get(name)) * 100) }));
}

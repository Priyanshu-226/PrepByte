import assert from 'node:assert/strict';
import test from 'node:test';
import { companyInfo, problems } from '../server/data.js';
import { normalizeProblem } from '../shared/problems.js';
import { buildRoadmap, companyStatsFromList, companyStatsPipeline, topicStatsFromList, topicStatsPipeline, userSummaryFromList, userSummaryPipeline } from '../server/analytics.js';
import { parseQuestionList } from '../server/leetcode.js';
import { parseCsv, rowToProblem } from '../scripts/csv.js';

test('acceptance rate is kept as a one-decimal percentage or null', () => {
  const base = { id: 'x', title: 'X', topic: 'T', difficulty: 'Easy', company: 'A' };
  assert.equal(normalizeProblem({ ...base, acceptance: 53.456 }).acceptance, 53.5);
  assert.equal(normalizeProblem({ ...base, acceptance: '41' }).acceptance, 41);
  for (const bad of [undefined, null, '', 'abc', -1, 101]) assert.equal(normalizeProblem({ ...base, acceptance: bad }).acceptance, null, String(bad));
  assert.ok(problems.every(p => p.acceptance === null), 'seed data does not invent acceptance rates');
});

test('CSV import handles quotes and maps columns to problems', () => {
  const csv = [
    'id,title,topic,difficulty,companies,frequency,acceptance,time,url',
    'two-sum,"Two Sum, the classic",Arrays & Hashing,Easy,Amazon;Google ; Meta,96,55.4,15,https://leetcode.com/problems/two-sum/',
    '',
    'x-y,"Say ""hi""",T,Hard,Uber,,,,'
  ].join('\r\n');
  const rows = parseCsv(csv);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].title, 'Two Sum, the classic');
  assert.equal(rows[1].title, 'Say "hi"');
  const a = rowToProblem(rows[0]);
  assert.deepEqual(a.companies, ['Amazon', 'Google', 'Meta']);
  assert.equal(a.acceptance, 55.4);
  assert.equal(normalizeProblem(a).frequency, 96);
  assert.equal('frequency' in rowToProblem(rows[1]), false, 'empty cells are omitted so upserts do not wipe values');
  assert.deepEqual(parseCsv(''), []);
});

test('LeetCode problem-list pages are parsed', () => {
  const page = parseQuestionList({ problemsetQuestionList: { total: 2, questions: [{ acRate: 55.123, difficulty: 'Easy', title: 'Two Sum', titleSlug: 'two-sum', isPaidOnly: false, topicTags: [{ name: 'Array' }] }, { title: 'bad' }] } });
  assert.equal(page.total, 2);
  assert.deepEqual(page.questions, [{ id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', acceptance: 55.1, paid: false, topics: ['Array'] }]);
  assert.deepEqual(parseQuestionList(null), { total: 0, questions: [] });
});

test('aggregation pipelines have the expected stages', () => {
  assert.deepEqual(companyStatsPipeline().map(s => Object.keys(s)[0]), ['$unwind', '$group', '$project', '$sort']);
  assert.equal(companyStatsPipeline()[0].$unwind, '$companies');
  assert.deepEqual(topicStatsPipeline().map(s => Object.keys(s)[0]), ['$group', '$project', '$sort']);
  const user = userSummaryPipeline('u-1');
  assert.deepEqual(user[0], { $match: { userId: 'u-1' } });
  assert.equal(user.find(s => s.$lookup).$lookup.from, 'problems');
});

test('in-memory analytics compute what the pipelines describe', () => {
  const list = [
    { id: 'a', topic: 'Graphs', difficulty: 'Easy', companies: ['X', 'Y'], frequency: 80, acceptance: 50 },
    { id: 'b', topic: 'Graphs', difficulty: 'Hard', companies: ['X'], frequency: 60, acceptance: null },
    { id: 'c', topic: 'Trees', difficulty: 'Medium', companies: ['Y'], frequency: 70, acceptance: 30 }
  ];
  const companies = companyStatsFromList(list);
  assert.deepEqual(companies.find(c => c.company === 'X'), { company: 'X', problems: 2, avgFrequency: 70, avgAcceptance: 50, easy: 1, medium: 0, hard: 1 });
  assert.equal(companyStatsFromList(list.slice(1, 2))[0].avgAcceptance, null);
  const topics = topicStatsFromList(list);
  assert.equal(topics[0].topic, 'Graphs');
  const solved = userSummaryFromList(list, ['a', 'b', 'zzz']);
  assert.deepEqual(solved, [{ topic: 'Graphs', solved: 2 }]);
  assert.deepEqual(buildRoadmap(['Trees', 'Graphs', 'Empty'], topics, solved), [
    { topic: 'Trees', total: 1, solved: 0, pct: 0 },
    { topic: 'Graphs', total: 2, solved: 2, pct: 100 }
  ]);
});

test('real seed data produces consistent company stats', () => {
  const stats = companyStatsFromList(problems);
  assert.equal(stats.length, companyInfo.length);
  assert.equal(stats.reduce((n, c) => n + c.problems, 0), problems.reduce((n, p) => n + p.companies.length, 0));
});

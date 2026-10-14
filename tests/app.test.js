import assert from 'node:assert/strict';
import test from 'node:test';
import { companyInfo, problems, roadmapTopics } from '../server/data.js';
import { normalizeProblem } from '../shared/problems.js';
import { SCHEDULE, dayKey, emptyProgress, mergeProgress, nextInterval, sanitizeProgress } from '../shared/progress.js';
import { aboutContainsCode, leetcodeCodes, signSession, verifySession } from '../server/session.js';
import { fetchLeetcode, normalizeLeetcode, publicLeetcode } from '../server/leetcode.js';
import { catalogFrom } from '../src/lib/catalog.js';
import { currentStreak, dailyPlan, dueText, lastDays, longestStreak, readiness, reviewQueue, topicStats } from '../src/lib/stats.js';

const catalog = catalogFrom(problems, companyInfo, roadmapTopics);

test('seed data is consistent', () => {
  assert.equal(new Set(problems.map(p => p.id)).size, problems.length, 'unique ids');
  assert.ok(problems.length >= 500 && problems.length <= 700, `library size ${problems.length}`);
  assert.ok(companyInfo.length >= 80 && companyInfo.length <= 100, `company count ${companyInfo.length}`);
  const topics = new Set(roadmapTopics.map(t => t.name));
  const companies = new Set(companyInfo.map(c => c.name));
  for (const p of problems) {
    assert.ok(topics.has(p.topic), `${p.id} topic ${p.topic}`);
    assert.ok(p.url.startsWith('https://leetcode.com/problems/'), p.id);
    for (const c of p.companies) assert.ok(companies.has(c), `${p.id} company ${c}`);
  }
  assert.equal(catalog.topics.length, roadmapTopics.length);
  assert.equal(catalog.companies.length, companyInfo.length);
  for (const c of catalog.companies) assert.ok(c.count >= 10, `${c.name} has only ${c.count} questions`);
  for (const t of catalog.topics) assert.ok(problems.some(p => p.topic === t.name));
});

test('normalizeProblem rejects bad input and clamps numbers', () => {
  assert.equal(normalizeProblem({ id: 'Bad Id', title: 'x', topic: 'y', difficulty: 'Easy', company: 'A' }), null);
  assert.equal(normalizeProblem({ id: 'ok', title: 'x', topic: 'y', difficulty: 'Nope', company: 'A' }), null);
  const p = normalizeProblem({ id: 'ok', title: 'x', topic: 'y', difficulty: 'Easy', company: 'A', frequency: 500, time: 'abc', url: 'javascript:alert(1)' });
  assert.equal(p.frequency, 100);
  assert.equal(p.time, 25);
  assert.equal(p.url, '');
  assert.deepEqual(p.companies, ['A']);
});

test('sanitizeProgress drops junk, unknown ids, and prototype keys', () => {
  const raw = JSON.parse('{"name":"  Ann  ","solved":["two-sum","two-sum","nope","__proto__"],"notes":{"__proto__":"x","two-sum":"hi","nope":"x"},"times":{"two-sum":90,"nope":5},"activity":{"2026-10-10":2,"bad":3},"updatedAt":5}');
  const ids = new Set(problems.map(p => p.id));
  const clean = sanitizeProgress(raw, ids);
  assert.equal(clean.name, 'Ann');
  assert.deepEqual(clean.solved, ['two-sum']);
  assert.deepEqual(clean.notes, { 'two-sum': 'hi' });
  assert.deepEqual(clean.times, { 'two-sum': 90 });
  assert.deepEqual(clean.activity, { '2026-10-10': 2 });
  assert.equal(Object.getPrototypeOf(clean.notes), Object.prototype);
  assert.deepEqual(sanitizeProgress(null).solved, []);
});

test('mergeProgress unions work and keeps the newer settings', () => {
  const a = { ...emptyProgress(), solved: ['two-sum'], name: 'Local', updatedAt: 10, activity: { '2026-10-09': 1 }, solvedAt: { 'two-sum': '2026-10-09T10:00:00.000Z' } };
  const b = { ...emptyProgress(), solved: ['3sum'], saved: ['lru-cache'], name: 'Remote', updatedAt: 20, activity: { '2026-10-09': 3 } };
  const m = mergeProgress(a, b);
  assert.deepEqual(m.solved.sort(), ['3sum', 'two-sum']);
  assert.deepEqual(m.saved, ['lru-cache']);
  assert.equal(m.name, 'Remote');
  assert.equal(m.activity['2026-10-09'], 3);
  assert.equal(m.updatedAt, 20);
});

test('spaced repetition ladder', () => {
  assert.equal(nextInterval(1, true), 3);
  assert.equal(nextInterval(14, true), 30);
  assert.equal(nextInterval(60, true), SCHEDULE.at(-1));
  assert.equal(nextInterval(30, false), 1);
});

test('readiness grows with solved questions', () => {
  const none = readiness(catalog.problems, catalog.topics, new Set(), 'Amazon');
  const some = readiness(catalog.problems, catalog.topics, new Set(['two-sum', '3sum', 'coin-change']), 'Amazon');
  const all = readiness(catalog.problems, catalog.topics, new Set(catalog.problems.map(p => p.id)), 'Amazon');
  assert.equal(none, 0);
  assert.ok(some > none && some < 20);
  assert.equal(all, 100);
});

test('topic stats and daily plan', () => {
  const ts = topicStats(catalog.problems, catalog.topics, new Set(['two-sum']));
  assert.equal(ts.find(t => t.name === 'Arrays & Hashing').done, 1);
  const plan = dailyPlan(catalog.problems, new Set(['two-sum']), 'Amazon', 4);
  assert.equal(plan.length, 4);
  assert.ok(!plan.some(p => p.id === 'two-sum'));
  assert.ok(plan.every(p => p.companies.includes('Amazon')));
});

test('streaks', () => {
  const today = new Date(2026, 9, 10, 12);
  const key = offset => { const d = new Date(today); d.setDate(d.getDate() + offset); return dayKey(d); };
  assert.equal(currentStreak({ [key(0)]: 1, [key(-1)]: 2, [key(-2)]: 1 }, today), 3);
  assert.equal(currentStreak({ [key(-1)]: 1, [key(-2)]: 1 }, today), 2, 'streak survives until the day ends');
  assert.equal(currentStreak({ [key(-3)]: 1 }, today), 0);
  assert.equal(longestStreak({ [key(-9)]: 1, [key(-8)]: 1, [key(-7)]: 1, [key(-2)]: 1, [key(-1)]: 1 }), 3);
  const week = lastDays({ [key(0)]: 2 }, 7, today);
  assert.equal(week.length, 7);
  assert.equal(week.at(-1).count, 2);
  assert.ok(week.at(-1).isToday);
});

test('review queue splits due and upcoming', () => {
  const now = Date.parse('2026-10-10T12:00:00Z');
  const reviews = {
    'two-sum': { due: '2026-10-09T12:00:00Z', interval: 1 },
    '3sum': { due: '2026-10-12T12:00:00Z', interval: 3 },
    ghost: { due: '2026-10-01T12:00:00Z', interval: 1 }
  };
  const { due, upcoming } = reviewQueue(reviews, catalog.byId, now);
  assert.deepEqual(due.map(x => x.problem.id), ['two-sum']);
  assert.deepEqual(upcoming.map(x => x.problem.id), ['3sum']);
  assert.equal(dueText(Date.parse('2026-10-12T12:00:00Z'), now), 'In 2 days');
  assert.equal(dueText(Date.parse('2026-10-10T11:00:00Z'), now), 'Due today');
});

test('progress keeps a valid LeetCode username and clean mock history', () => {
  const clean = sanitizeProgress({
    leetcode: 'good_name-1',
    mocks: [
      { at: '2026-10-10T10:00:00Z', company: 'Amazon', total: 3, solved: 2, seconds: 3000 },
      { at: 'nope', company: 'x', total: 3, solved: 1, seconds: 10 },
      { at: '2026-10-10T11:00:00Z', company: 'Google', total: 2, solved: 5, seconds: 10 }
    ]
  });
  assert.equal(clean.leetcode, 'good_name-1');
  assert.equal(clean.mocks.length, 1);
  assert.equal(sanitizeProgress({ leetcode: '<script>' }).leetcode, '');
  const merged = mergeProgress({ ...emptyProgress(), mocks: clean.mocks, updatedAt: 1 }, { ...emptyProgress(), leetcode: 'abc', mocks: clean.mocks, updatedAt: 2 });
  assert.equal(merged.mocks.length, 1, 'duplicate mocks are merged');
  assert.equal(merged.leetcode, 'abc');
});

test('sessions are standard HS256 JWTs: signed, expiring, and tamper-proof', () => {
  const secret = 'test-secret';
  const now = Date.now();
  const token = signSession(secret, { sub: 'lc:ann', name: 'Ann' }, { now, ttlSeconds: 60 });
  const [head, body, sig] = token.split('.');
  assert.deepEqual(JSON.parse(Buffer.from(head, 'base64url').toString()), { alg: 'HS256', typ: 'JWT' });
  const claims = JSON.parse(Buffer.from(body, 'base64url').toString());
  assert.equal(claims.iss, 'prepbyte');
  assert.equal(claims.exp - claims.iat, 60);
  assert.equal(verifySession(secret, token, now).sub, 'lc:ann');
  assert.equal(verifySession('other-secret', token, now), null, 'wrong secret');
  assert.equal(verifySession(secret, token, now + 120_000), null, 'expired');
  const forged = Buffer.from(JSON.stringify({ ...claims, sub: 'lc:admin' })).toString('base64url');
  assert.equal(verifySession(secret, `${head}.${forged}.${sig}`, now), null, 'tampered payload');
  const noneHead = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  assert.equal(verifySession(secret, `${noneHead}.${body}.`, now), null, 'alg none is rejected');
  assert.equal(verifySession(secret, 'garbage', now), null);
  assert.equal(verifySession(secret, 'a.b.c', now), null, 'foreign tokens fall through to Supabase');
});

test('ownership codes are per user, stable within an hour, and accepted for one extra hour', () => {
  const secret = 's';
  const t = Date.UTC(2026, 9, 10, 10, 30);
  const [now, prev] = leetcodeCodes(secret, 'Ann', t);
  assert.match(now, /^pb-[0-9a-f]{10}$/);
  assert.equal(leetcodeCodes(secret, 'ann', t)[0], now, 'case-insensitive');
  assert.notEqual(leetcodeCodes(secret, 'bob', t)[0], now);
  const later = leetcodeCodes(secret, 'ann', t + 3600000);
  assert.equal(later[1], now, 'previous hour stays valid');
  assert.ok(aboutContainsCode(`hello ${now} world`, later));
  assert.ok(!aboutContainsCode('no code here', later));
  assert.ok(!aboutContainsCode(undefined, later));
  assert.notEqual(prev, now);
});

const sampleLeetcode = {
  matchedUser: {
    username: 'Ann',
    profile: { realName: 'Ann A', userAvatar: 'https://assets.leetcode.com/a.png', aboutMe: 'code pb-abc', ranking: 1234 },
    submitStatsGlobal: { acSubmissionNum: [{ difficulty: 'All', count: 10 }, { difficulty: 'Easy', count: 5 }, { difficulty: 'Medium', count: 4 }, { difficulty: 'Hard', count: 1 }] }
  },
  recentAcSubmissionList: [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1760000000' }, { title: 'Bad', titleSlug: '', timestamp: 'x' }]
};

test('LeetCode payloads are normalized and aboutMe never leaves the server', async () => {
  const n = normalizeLeetcode(sampleLeetcode);
  assert.deepEqual(n.solved, { all: 10, easy: 5, medium: 4, hard: 1 });
  assert.equal(n.recent.length, 1);
  assert.equal(n.recent[0].slug, 'two-sum');
  assert.equal(n.recent[0].at, new Date(1760000000 * 1000).toISOString());
  assert.equal('aboutMe' in publicLeetcode(n), false);
  assert.equal(normalizeLeetcode({ matchedUser: null }), null);
  assert.equal(normalizeLeetcode({ matchedUser: { username: 'x', profile: { userAvatar: 'http://insecure' } } }).avatar, '');

  const ok = await fetchLeetcode('Ann', async () => ({ ok: true, json: async () => ({ data: sampleLeetcode }) }));
  assert.equal(ok.username, 'Ann');
  await assert.rejects(fetchLeetcode('nobody', async () => ({ ok: true, json: async () => ({ data: { matchedUser: null } }) })), e => e.status === 404);
  await assert.rejects(fetchLeetcode('x', async () => ({ ok: false })), e => e.status === 502);
  await assert.rejects(fetchLeetcode('x', async () => { throw new Error('network'); }), e => e.status === 502);
});

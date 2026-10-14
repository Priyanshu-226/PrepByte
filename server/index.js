import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import { companyInfo, problems as seedProblems, roadmapTopics } from './data.js';
import { emptyProgress, sanitizeProgress } from '../shared/progress.js';
import { normalizeProblem } from '../shared/problems.js';
import { LEETCODE_USER_RE } from '../shared/progress.js';
import { fetchLeetcode, httpError, publicLeetcode } from './leetcode.js';
import { aboutContainsCode, leetcodeCodes, signSession, verifySession } from './session.js';
import { buildRoadmap, companyStatsFromList, companyStatsPipeline, topicStatsFromList, topicStatsPipeline, userSummaryFromList, userSummaryPipeline } from './analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 8787);
const dbName = process.env.MONGODB_DB || 'prepbyte';
const CACHE_PREFIX = 'prepbyte:';

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const authEnabled = Boolean(supabaseUrl && supabaseKey) && !supabaseUrl.includes('your-project');

// Secret for LeetCode sign-in sessions and ownership codes. Set SESSION_SECRET so they survive restarts.
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) console.warn('SESSION_SECRET is not set; LeetCode sign-ins will reset whenever the server restarts.');
const SESSION_DAYS = 30;

let mongo = null;
let redis = null;
let problems = [...seedProblems];
const memoryProgress = new Map();

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '256kb' }));

/* ---------- services (both optional) ---------- */

async function connectServices() {
  if (process.env.MONGODB_URI) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
      await client.connect();
      mongo = client;
      await prepareProblemsCollection();
      await loadStoredProblems();
      console.log('MongoDB connected');
    } catch {
      mongo = null;
      console.warn('MongoDB unavailable; progress is kept in memory and seed data is used.');
    }
  }
  if (process.env.REDIS_URL) {
    try {
      const client = createClient({
        url: process.env.REDIS_URL,
        socket: { connectTimeout: 2500, reconnectStrategy: retries => (retries < 3 ? 500 : false) }
      });
      client.on('error', () => {});
      await client.connect();
      redis = client;
      console.log('Redis connected');
    } catch {
      redis = null;
      console.warn('Redis unavailable; caching is off.');
    }
  }
}

// Keep the seed library in MongoDB (inserted once, never overwritten) so aggregation pipelines see every question.
async function prepareProblemsCollection() {
  const col = mongo.db(dbName).collection('problems');
  await col.createIndex({ id: 1 }, { unique: true });
  await col.createIndex({ companies: 1 });
  await col.createIndex({ topic: 1 });
  await col.bulkWrite(seedProblems.map(p => ({ updateOne: { filter: { id: p.id }, update: { $setOnInsert: p }, upsert: true } })));
  await mongo.db(dbName).collection('progress').createIndex({ userId: 1 }, { unique: true });
}

// Stored versions win over the bundled seed, so imports and acceptance-rate updates survive restarts.
async function loadStoredProblems() {
  const stored = await mongo.db(dbName).collection('problems').find({}, { projection: { _id: 0 } }).toArray();
  const byId = new Map(problems.map(p => [p.id, p]));
  for (const doc of stored) {
    const p = normalizeProblem(doc);
    if (p) byId.set(p.id, p);
  }
  problems = [...byId.values()];
}

async function cached(key, ttlSeconds, produce) {
  const fullKey = CACHE_PREFIX + key;
  if (redis?.isReady) {
    try {
      const hit = await redis.get(fullKey);
      if (hit) return JSON.parse(hit);
    } catch { /* fall through to a fresh read */ }
  }
  const value = await produce();
  if (redis?.isReady) {
    try { await redis.set(fullKey, JSON.stringify(value), { EX: ttlSeconds }); } catch { /* cache is best-effort */ }
  }
  return value;
}

async function clearCache() {
  if (!redis?.isReady) return;
  try {
    const keys = await redis.keys(`${CACHE_PREFIX}*`);
    if (keys.length) await redis.del(keys);
  } catch { /* ignore */ }
}

/* ---------- auth (Supabase access tokens) ---------- */

const tokenCache = new Map();

async function userFromRequest(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const own = verifySession(sessionSecret, token); // PrepByte JWT (LeetCode sign-in)
  if (own) return { id: own.sub, email: '' };
  if (!authEnabled) return null; // otherwise it must be a Supabase JWT
  const hit = tokenCache.get(token);
  if (hit && hit.expires > Date.now()) return hit.user;
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: supabaseKey, authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const body = await res.json();
    if (!body?.id) return null;
    const user = { id: body.id, email: body.email };
    tokenCache.set(token, { user, expires: Date.now() + 60_000 });
    if (tokenCache.size > 500) {
      for (const [key, value] of tokenCache) if (value.expires < Date.now()) tokenCache.delete(key);
    }
    return user;
  } catch {
    return null;
  }
}

async function requireUser(req, res, next) {
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ message: 'Sign in to sync your progress.' });
  req.user = user;
  next();
}

/* ---------- per-user progress storage ---------- */

const validIds = () => new Set(problems.map(p => p.id));

async function readProgress(userId) {
  if (mongo) {
    try {
      const doc = await mongo.db(dbName).collection('progress').findOne({ userId });
      if (doc?.data) return sanitizeProgress(doc.data, validIds());
    } catch (error) {
      console.warn('Progress read failed, falling back to memory:', error.message);
    }
  }
  return memoryProgress.has(userId) ? sanitizeProgress(memoryProgress.get(userId), validIds()) : emptyProgress();
}

async function writeProgress(userId, data) {
  memoryProgress.set(userId, data);
  if (!mongo) return;
  try {
    await mongo.db(dbName).collection('progress').updateOne({ userId }, { $set: { data, updatedAt: new Date() } }, { upsert: true });
  } catch (error) {
    console.warn('Progress write failed (kept in memory):', error.message);
  }
}

/* ---------- middleware ---------- */

function makeLimiter(max, windowMs = 60_000) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) if (rec.reset < now) hits.delete(ip);
  }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const rec = hits.get(req.ip);
    if (!rec || rec.reset < now) {
      hits.set(req.ip, { count: 1, reset: now + windowMs });
      return next();
    }
    rec.count += 1;
    if (rec.count > max) {
      res.set('Retry-After', String(Math.ceil((rec.reset - now) / 1000)));
      return res.status(429).json({ message: 'Too many requests. Try again in a minute.' });
    }
    next();
  };
}

// Per-IP requests per minute across the API. Set RATE_LIMIT_PER_MIN=0 to disable (for example while load testing).
const rateLimit = Number(process.env.RATE_LIMIT_PER_MIN ?? 300);
if (rateLimit > 0) app.use('/api', makeLimiter(rateLimit));
const strictLimit = makeLimiter(20); // anything that calls out to LeetCode

/* ---------- catalog routes ---------- */

app.get('/api/health', (_req, res) =>
  res.json({ ok: true, services: { mongo: Boolean(mongo), redis: Boolean(redis?.isReady), supabase: authEnabled, leetcode: true }, problems: problems.length })
);

app.get('/api/catalog', async (_req, res) => {
  res.json(await cached('catalog', 60, async () => ({ problems, companies: companyInfo, topics: roadmapTopics })));
});

app.get('/api/problems', async (req, res) => {
  const q = ['search', 'topic', 'company', 'difficulty'].map(k => String(req.query[k] || '').toLowerCase().trim());
  const [search, topic, company, difficulty] = q;
  const key = `problems:${q.join(':')}`;
  res.json(await cached(key, 60, async () =>
    problems.filter(p =>
      (!search || `${p.title} ${p.topic} ${p.companies.join(' ')}`.toLowerCase().includes(search)) &&
      (!topic || p.topic.toLowerCase().includes(topic)) &&
      (!company || p.companies.some(c => c.toLowerCase() === company)) &&
      (!difficulty || p.difficulty.toLowerCase() === difficulty)
    )
  ));
});

async function aggregate(collection, pipeline, fallback) {
  if (mongo) {
    try {
      return await mongo.db(dbName).collection(collection).aggregate(pipeline).toArray();
    } catch (error) {
      console.warn('Aggregation failed, using in-memory data:', error.message);
    }
  }
  return fallback();
}

const companyStats = () => aggregate('problems', companyStatsPipeline(), () => companyStatsFromList(problems));
const topicStats = () => aggregate('problems', topicStatsPipeline(), () => topicStatsFromList(problems));

app.get('/api/companies', async (_req, res) => res.json(await cached('companies', 60, companyStats)));
app.get('/api/topics', async (_req, res) => res.json(await cached('topics', 60, topicStats)));

/* ---------- LeetCode: public stats and "sign in with LeetCode" ---------- */

const leetcodeName = value => {
  if (typeof value !== 'string' || !LEETCODE_USER_RE.test(value.trim())) throw httpError(400, 'Enter a valid LeetCode username.');
  return value.trim();
};

app.get('/api/leetcode/:username', strictLimit, async (req, res) => {
  const username = leetcodeName(req.params.username);
  res.json(await cached(`leetcode:${username.toLowerCase()}`, 300, async () => publicLeetcode(await fetchLeetcode(username))));
});

// Step 1: hand out a code the user pastes into their LeetCode profile summary.
app.post('/api/auth/leetcode/start', strictLimit, async (req, res) => {
  const profile = await fetchLeetcode(leetcodeName(req.body?.username));
  res.json({ username: profile.username, code: leetcodeCodes(sessionSecret, profile.username)[0], validMinutes: 60 });
});

// Step 2: confirm the code is on the profile, then issue a session.
app.post('/api/auth/leetcode/verify', strictLimit, async (req, res) => {
  const profile = await fetchLeetcode(leetcodeName(req.body?.username));
  if (!aboutContainsCode(profile.aboutMe, leetcodeCodes(sessionSecret, profile.username))) {
    throw httpError(401, 'We could not find the code on your LeetCode profile yet. Save it in your Summary and try again.');
  }
  const now = Date.now();
  const ttlSeconds = SESSION_DAYS * 86400;
  const user = { username: profile.username, name: profile.name, avatar: profile.avatar };
  const token = signSession(sessionSecret, { sub: `lc:${profile.username.toLowerCase()}`, ...user }, { now, ttlSeconds });
  res.json({ token, expiresAt: now + ttlSeconds * 1000, user });
});

/* ---------- per-user progress ---------- */

app.get('/api/progress', requireUser, async (req, res) => res.json(await readProgress(req.user.id)));

app.put('/api/progress', requireUser, async (req, res) => {
  const clean = sanitizeProgress(req.body, validIds());
  await writeProgress(req.user.id, clean);
  res.json(clean);
});

// Personalized roadmap: per-topic totals joined with this user's solved questions.
app.get('/api/roadmap', requireUser, async (req, res) => {
  const [totals, solvedRows] = await Promise.all([
    cached('topics', 60, topicStats),
    aggregate('progress', userSummaryPipeline(req.user.id), async () => userSummaryFromList(problems, (await readProgress(req.user.id)).solved))
  ]);
  res.json(buildRoadmap(roadmapTopics.map(t => t.name), totals, solvedRows));
});

/* ---------- admin ---------- */

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

// POST /api/admin/problems/import          adds new questions, skips ids that already exist
// POST /api/admin/problems/import?mode=upsert  also merges the given fields into existing questions (e.g. acceptance rates)
app.post('/api/admin/problems/import', async (req, res) => {
  const key = process.env.ADMIN_API_KEY;
  if (!key || !safeEqual(req.get('x-admin-key') || '', key)) return res.status(401).json({ message: 'Admin authorization required.' });
  const incoming = Array.isArray(req.body) ? req.body : req.body?.problems;
  if (!Array.isArray(incoming)) return res.status(400).json({ message: 'Send a JSON array of problems.' });
  const upsert = req.query.mode === 'upsert';

  const index = new Map(problems.map((p, i) => [p.id, i]));
  const added = [];
  const updated = [];
  let skipped = 0;
  for (const raw of incoming) {
    const at = typeof raw?.id === 'string' ? index.get(raw.id) : undefined;
    if (at !== undefined) {
      const merged = upsert ? normalizeProblem({ ...problems[at], ...raw }) : null;
      if (merged) {
        problems[at] = merged;
        updated.push(merged);
      } else skipped += 1;
      continue;
    }
    const p = normalizeProblem(raw);
    if (p) {
      index.set(p.id, problems.length + added.length);
      added.push(p);
    } else skipped += 1;
  }
  problems.push(...added);

  if (mongo && (added.length || updated.length)) {
    const col = mongo.db(dbName).collection('problems');
    try {
      const ops = [
        ...added.map(p => ({ updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true } })),
        ...updated.map(p => ({ updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true } }))
      ];
      await col.bulkWrite(ops, { ordered: false });
    } catch (error) {
      console.warn('Imported problems could not be saved to MongoDB:', error.message);
    }
  }
  await clearCache();
  res.status(201).json({ imported: added.length, updated: updated.length, skipped });
});

/* ---------- unknown API routes, then the built client (after `npm run build`) ---------- */

app.use('/api', (_req, res) => res.status(404).json({ message: 'Not found.' }));

const dist = path.resolve(__dirname, '../dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  const status = err.status && err.status < 500 ? err.status : 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ message: status < 500 ? err.message : 'Something went wrong on the server.' });
});

connectServices()
  .catch(error => console.warn('Service setup failed:', error.message))
  .finally(() => app.listen(port, () => console.log(`PrepByte API listening on http://localhost:${port}`)));

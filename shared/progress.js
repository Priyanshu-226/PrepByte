// Progress model shared by the browser (local-first) and the API (per-user sync).
export const SCHEDULE = [1, 3, 7, 14, 30, 60]; // spaced-repetition ladder, in days
export const DAY_MS = 86400000;

const ID_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const LEETCODE_USER_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function dayKey(date = new Date()) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function addDays(days, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return dayKey(d);
}

export function emptyProgress() {
  return {
    version: 2,
    name: '',
    goal: { company: 'Amazon', role: 'SDE I', targetDate: addDays(42) },
    solved: [],
    saved: [],
    notes: {},
    times: {},
    solvedAt: {},
    reviews: {},
    activity: {},
    leetcode: '',
    mocks: [],
    updatedAt: 0
  };
}

const isoOrNull = v => {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
};

function pickEntries(obj, limit, keyOk, valueFn) {
  const out = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  let count = 0;
  for (const [key, value] of Object.entries(obj)) {
    if (count >= limit) break;
    if (!keyOk(key)) continue;
    const next = valueFn(value);
    if (next === undefined) continue;
    out[key] = next;
    count += 1;
  }
  return out;
}

// Never trust stored or posted progress: rebuild it field by field.
export function sanitizeProgress(raw, validIds) {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const okId = id => typeof id === 'string' && ID_RE.test(id) && (!validIds || validIds.has(id));
  const ids = list => (Array.isArray(list) ? [...new Set(list.filter(okId))].slice(0, 2000) : []);
  const text = (v, max, fallback) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : fallback);

  const goal = raw.goal && typeof raw.goal === 'object' ? raw.goal : {};
  const solved = ids(raw.solved);
  const solvedSet = new Set(solved);

  return {
    version: 2,
    name: text(raw.name, 60, ''),
    goal: {
      company: text(goal.company, 40, base.goal.company),
      role: text(goal.role, 40, base.goal.role),
      targetDate: typeof goal.targetDate === 'string' && DATE_RE.test(goal.targetDate) ? goal.targetDate : base.goal.targetDate
    },
    solved,
    saved: ids(raw.saved),
    notes: pickEntries(raw.notes, 500, okId, v => (typeof v === 'string' && v.trim() ? v.slice(0, 2000) : undefined)),
    times: pickEntries(raw.times, 2000, k => okId(k) && solvedSet.has(k), v => (Number.isFinite(v) && v > 0 && v <= 86400 ? Math.round(v) : undefined)),
    solvedAt: pickEntries(raw.solvedAt, 2000, k => okId(k) && solvedSet.has(k), v => isoOrNull(v) ?? undefined),
    reviews: pickEntries(raw.reviews, 2000, k => okId(k) && solvedSet.has(k), v => {
      const due = v && isoOrNull(v.due);
      const interval = v && Number(v.interval);
      return due && Number.isFinite(interval) ? { due, interval: Math.min(365, Math.max(1, Math.round(interval))) } : undefined;
    }),
    activity: pickEntries(raw.activity, 800, k => DATE_RE.test(k), v => (Number.isInteger(v) && v > 0 ? Math.min(v, 500) : undefined)),
    leetcode: typeof raw.leetcode === 'string' && LEETCODE_USER_RE.test(raw.leetcode) ? raw.leetcode : '',
    mocks: sanitizeMocks(raw.mocks),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : 0
  };
}

function sanitizeMocks(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const m of list.slice(0, 50)) {
    const at = isoOrNull(m?.at);
    const total = Math.round(Number(m?.total));
    const solved = Math.round(Number(m?.solved));
    const seconds = Math.round(Number(m?.seconds));
    const company = typeof m?.company === 'string' && m.company.trim() ? m.company.trim().slice(0, 40) : 'Any';
    if (at && total > 0 && total <= 10 && solved >= 0 && solved <= total && Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400) {
      out.push({ at, company, total, solved, seconds });
    }
  }
  return out;
}

// Used on sign-in: combine what this device has with what the account has.
export function mergeProgress(local, remote) {
  const a = sanitizeProgress(local);
  const b = sanitizeProgress(remote);
  const [base, other] = a.updatedAt >= b.updatedAt ? [a, b] : [b, a];
  const solved = [...new Set([...a.solved, ...b.solved])];
  const solvedSet = new Set(solved);

  const times = {};
  for (const id of new Set([...Object.keys(a.times), ...Object.keys(b.times)])) {
    if (solvedSet.has(id)) times[id] = Math.min(a.times[id] ?? Infinity, b.times[id] ?? Infinity);
  }
  const solvedAt = {};
  for (const id of solved) {
    const stamps = [a.solvedAt[id], b.solvedAt[id]].filter(Boolean).sort();
    if (stamps.length) solvedAt[id] = stamps[0];
  }
  const reviews = {};
  for (const id of solved) {
    const r = base.reviews[id] || other.reviews[id];
    if (r) reviews[id] = r;
  }
  const activity = {};
  for (const k of new Set([...Object.keys(a.activity), ...Object.keys(b.activity)])) {
    activity[k] = Math.max(a.activity[k] || 0, b.activity[k] || 0);
  }
  return {
    version: 2,
    name: base.name || other.name,
    goal: base.goal,
    solved,
    saved: [...new Set([...a.saved, ...b.saved])],
    notes: { ...other.notes, ...base.notes },
    times,
    solvedAt,
    reviews,
    activity,
    leetcode: base.leetcode || other.leetcode,
    mocks: mergeMocks(a.mocks, b.mocks),
    updatedAt: Math.max(a.updatedAt, b.updatedAt)
  };
}

function mergeMocks(a, b) {
  const seen = new Map();
  for (const m of [...a, ...b]) seen.set(m.at, m);
  return [...seen.values()].sort((x, y) => y.at.localeCompare(x.at)).slice(0, 50);
}

export function nextInterval(current, ok) {
  if (!ok) return SCHEDULE[0];
  return SCHEDULE.find(days => days > current) ?? SCHEDULE[SCHEDULE.length - 1];
}

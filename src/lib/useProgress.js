import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DAY_MS, dayKey, emptyProgress, mergeProgress, nextInterval, sanitizeProgress } from '../../shared/progress.js';
import { api } from './api.js';

const KEY = 'prepbyte:v2';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitizeProgress(JSON.parse(raw));
    const old = localStorage.getItem('prepbyte'); // first version of the app
    if (old) {
      const o = JSON.parse(old);
      return sanitizeProgress({ solved: o.solved, saved: o.saved });
    }
  } catch { /* corrupted storage: start fresh */ }
  return emptyProgress();
}

const omit = (obj, key) => {
  const { [key]: _removed, ...rest } = obj;
  return rest;
};

// Local-first progress. When a user is signed in it is merged with, and synced to, their account.
export function useProgress({ userId, token }) {
  const [progress, setProgress] = useState(load);
  const [sync, setSync] = useState('local');
  const [tick, setTick] = useState(0);
  const ref = useRef(progress);
  const tokenRef = useRef(token);
  const hydrated = useRef(false);
  ref.current = progress;
  tokenRef.current = token;

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* storage full or blocked */ }
  }, [progress]);

  useEffect(() => {
    hydrated.current = false;
    if (!userId) {
      setSync('local');
      return undefined;
    }
    let dead = false;
    setSync('syncing');
    api
      .getProgress(tokenRef.current)
      .then(remote => {
        if (dead) return;
        const merged = mergeProgress(ref.current, remote);
        ref.current = merged;
        hydrated.current = true;
        setProgress(merged);
        setSync('synced');
      })
      .catch(() => {
        if (!dead) setSync('error');
      });
    return () => { dead = true; };
  }, [userId, tick]);

  useEffect(() => {
    if (!userId || !hydrated.current) return undefined;
    setSync('syncing');
    const timer = setTimeout(() => {
      api.putProgress(tokenRef.current, progress).then(() => setSync('synced')).catch(() => setSync('error'));
    }, 800);
    return () => clearTimeout(timer);
  }, [progress, userId]);

  const actions = useMemo(() => {
    const commit = next => {
      const stamped = { ...next, updatedAt: Date.now() };
      ref.current = stamped;
      setProgress(stamped);
    };

    return {
      // Returns true when the problem is now solved.
      toggleSolved(id, seconds = 0) {
        const p = ref.current;
        const now = new Date();
        if (p.solved.includes(id)) {
          const activity = { ...p.activity };
          const when = p.solvedAt[id] ? dayKey(new Date(p.solvedAt[id])) : null;
          if (when && activity[when] > 0) {
            activity[when] -= 1;
            if (activity[when] <= 0) delete activity[when];
          }
          commit({ ...p, solved: p.solved.filter(x => x !== id), solvedAt: omit(p.solvedAt, id), reviews: omit(p.reviews, id), activity });
          return false;
        }
        const today = dayKey(now);
        commit({
          ...p,
          solved: [...p.solved, id],
          solvedAt: { ...p.solvedAt, [id]: now.toISOString() },
          reviews: { ...p.reviews, [id]: { due: new Date(now.getTime() + DAY_MS).toISOString(), interval: 1 } },
          activity: { ...p.activity, [today]: (p.activity[today] || 0) + 1 },
          times: seconds > 0 ? { ...p.times, [id]: Math.min(p.times[id] ?? Infinity, seconds) } : p.times
        });
        return true;
      },
      // Returns the new spacing in days.
      review(id, ok) {
        const p = ref.current;
        const now = Date.now();
        const interval = nextInterval(p.reviews[id]?.interval || 1, ok);
        const today = dayKey(new Date(now));
        commit({
          ...p,
          reviews: { ...p.reviews, [id]: { due: new Date(now + interval * DAY_MS).toISOString(), interval } },
          activity: { ...p.activity, [today]: (p.activity[today] || 0) + 1 }
        });
        return interval;
      },
      toggleSaved(id) {
        const p = ref.current;
        const has = p.saved.includes(id);
        commit({ ...p, saved: has ? p.saved.filter(x => x !== id) : [...p.saved, id] });
        return !has;
      },
      setNote(id, text) {
        const p = ref.current;
        commit({ ...p, notes: text ? { ...p.notes, [id]: text.slice(0, 2000) } : omit(p.notes, id) });
      },
      setName(name) {
        commit({ ...ref.current, name: name.slice(0, 60) });
      },
      setGoal(patch) {
        const p = ref.current;
        commit({ ...p, goal: { ...p.goal, ...patch } });
      },
      // entries: [{ id, at }] from LeetCode's recent accepted submissions. Returns how many were new.
      importSolved(entries) {
        const p = ref.current;
        const have = new Set(p.solved);
        const next = { ...p, solved: [...p.solved], solvedAt: { ...p.solvedAt }, reviews: { ...p.reviews }, activity: { ...p.activity } };
        let added = 0;
        for (const { id, at } of entries) {
          if (have.has(id)) continue;
          const parsed = new Date(at);
          const when = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
          have.add(id);
          added += 1;
          next.solved.push(id);
          next.solvedAt[id] = when.toISOString();
          next.reviews[id] = { due: new Date(when.getTime() + DAY_MS).toISOString(), interval: 1 };
          const key = dayKey(when);
          next.activity[key] = (next.activity[key] || 0) + 1;
        }
        if (added) commit(next);
        return added;
      },
      setLeetcode(username) {
        commit({ ...ref.current, leetcode: username.slice(0, 40) });
      },
      addMock(record) {
        const p = ref.current;
        commit({ ...p, mocks: [record, ...p.mocks].slice(0, 50) });
      },
      replaceAll(next) {
        commit(sanitizeProgress(next));
      },
      reset() {
        commit(emptyProgress());
      }
    };
  }, []);

  const retrySync = useCallback(() => setTick(t => t + 1), []);

  return { progress, actions, sync, retrySync };
}

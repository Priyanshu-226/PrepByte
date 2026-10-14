import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseEnabled } from '../supabase.js';
import { api } from './api.js';

const LC_KEY = 'prepbyte:lc-session';

function loadLeetcodeSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(LC_KEY));
    if (saved?.token && saved.expiresAt > Date.now() && saved.user?.username) return saved;
  } catch { /* ignore */ }
  return null;
}

// Two kinds of sign-in share one interface: Supabase (Google, email) and LeetCode (verified through the API).
export function useAuth() {
  const [session, setSession] = useState(null);
  const [lc, setLc] = useState(loadLeetcodeSession);

  useEffect(() => {
    if (!supabase) return undefined;
    let live = true;
    supabase.auth.getSession().then(({ data }) => {
      if (live) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => {
    if (session?.user) {
      const u = session.user;
      const meta = u.user_metadata || {};
      return {
        id: u.id,
        email: u.email || '',
        name: meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : ''),
        avatar: meta.avatar_url || meta.picture || '',
        provider: u.app_metadata?.provider === 'google' ? 'google' : 'email'
      };
    }
    if (lc) {
      return { id: `lc:${lc.user.username.toLowerCase()}`, email: '', name: lc.user.name || lc.user.username, avatar: lc.user.avatar || '', provider: 'leetcode', username: lc.user.username };
    }
    return null;
  }, [session, lc]);

  const token = session?.access_token ?? lc?.token ?? null;
  const redirectTo = () => window.location.origin + window.location.pathname;

  const signInGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectTo() } });
    return error ? error.message : null;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return error ? { error: error.message } : { confirm: !data.session };
  }, []);

  const magicLink = useCallback(async email => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    return error ? error.message : null;
  }, []);

  const leetcodeStart = useCallback(username => api.leetcodeStart(username), []);

  const leetcodeVerify = useCallback(async username => {
    const result = await api.leetcodeVerify(username);
    const saved = { token: result.token, expiresAt: result.expiresAt, user: result.user };
    try { localStorage.setItem(LC_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ }
    setLc(saved);
  }, []);

  const signOut = useCallback(async () => {
    try { localStorage.removeItem(LC_KEY); } catch { /* ignore */ }
    setLc(null);
    if (supabase) await supabase.auth.signOut();
  }, []);

  return useMemo(
    () => ({ enabled: supabaseEnabled, user, token, signInGoogle, signIn, signUp, magicLink, leetcodeStart, leetcodeVerify, signOut }),
    [user, token, signInGoogle, signIn, signUp, magicLink, leetcodeStart, leetcodeVerify, signOut]
  );
}

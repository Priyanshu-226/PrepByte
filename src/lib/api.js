const base = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', token, body, signal } = {}) {
  const headers = {};
  if (body) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, signal, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try { message = (await res.json()).message || message; } catch { /* keep default */ }
    throw new Error(message);
  }
  return res.json();
}

export const api = {
  catalog: signal => request('/catalog', { signal }),
  getProgress: token => request('/progress', { token }),
  putProgress: (token, progress) => request('/progress', { method: 'PUT', token, body: progress }),
  leetcode: username => request(`/leetcode/${encodeURIComponent(username)}`),
  leetcodeStart: username => request('/auth/leetcode/start', { method: 'POST', body: { username } }),
  leetcodeVerify: username => request('/auth/leetcode/verify', { method: 'POST', body: { username } })
};

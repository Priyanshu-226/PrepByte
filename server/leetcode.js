// Reads public LeetCode profile data through LeetCode's GraphQL endpoint.
const QUERY = `query prepbyteProfile($username: String!, $limit: Int!) {
  matchedUser(username: $username) {
    username
    profile { realName userAvatar aboutMe ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
  recentAcSubmissionList(username: $username, limit: $limit) { title titleSlug timestamp }
}`;

export const httpError = (status, message) => Object.assign(new Error(message), { status });

export function normalizeLeetcode(data) {
  const user = data?.matchedUser;
  if (!user) return null;
  const counts = {};
  for (const row of user.submitStatsGlobal?.acSubmissionNum || []) counts[row.difficulty] = Number(row.count) || 0;
  const avatar = user.profile?.userAvatar;
  return {
    username: user.username,
    name: user.profile?.realName || user.username,
    avatar: typeof avatar === 'string' && avatar.startsWith('https://') ? avatar : '',
    ranking: Number(user.profile?.ranking) || null,
    aboutMe: typeof user.profile?.aboutMe === 'string' ? user.profile.aboutMe : '',
    solved: { all: counts.All ?? 0, easy: counts.Easy ?? 0, medium: counts.Medium ?? 0, hard: counts.Hard ?? 0 },
    recent: (data.recentAcSubmissionList || [])
      .map(s => ({ slug: s.titleSlug, title: s.title, when: new Date(Number(s.timestamp) * 1000) }))
      .filter(s => s.slug && !Number.isNaN(s.when.getTime()))
      .map(({ slug, title, when }) => ({ slug, title, at: when.toISOString() }))
  };
}

// Never send aboutMe to the browser: it is only used server-side to verify ownership.
export const publicLeetcode = ({ aboutMe: _about, ...rest }) => rest;

export async function fetchLeetcode(username, fetchImpl = fetch) {
  let res;
  try {
    res = await fetchImpl('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json', referer: 'https://leetcode.com', origin: 'https://leetcode.com', 'user-agent': 'Mozilla/5.0 (compatible; PrepByte)' },
      body: JSON.stringify({ query: QUERY, variables: { username, limit: 20 } }),
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw httpError(502, 'Could not reach LeetCode. Try again in a moment.');
  }
  if (!res.ok) throw httpError(502, 'LeetCode did not respond as expected. Try again shortly.');
  let body;
  try {
    body = await res.json();
  } catch {
    throw httpError(502, 'LeetCode returned an unreadable response.');
  }
  const profile = normalizeLeetcode(body?.data);
  if (!profile) throw httpError(404, 'We could not find that LeetCode username.');
  return profile;
}

/* ---- Whole-problemset listing (used by scripts/sync-leetcode.js to fetch acceptance rates) ---- */

export const QUESTION_LIST_QUERY = `query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
  problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
    total: totalNum
    questions: data { acRate difficulty title titleSlug isPaidOnly topicTags { name } }
  }
}`;

export function parseQuestionList(data) {
  const list = data?.problemsetQuestionList;
  if (!list || !Array.isArray(list.questions)) return { total: 0, questions: [] };
  return {
    total: Number(list.total) || 0,
    questions: list.questions
      .filter(q => q && typeof q.titleSlug === 'string')
      .map(q => ({
        id: q.titleSlug,
        title: q.title,
        difficulty: q.difficulty,
        acceptance: Number.isFinite(Number(q.acRate)) ? Math.round(Number(q.acRate) * 10) / 10 : null,
        paid: Boolean(q.isPaidOnly),
        topics: (q.topicTags || []).map(t => t.name)
      }))
  };
}

export async function fetchQuestionPage(skip, limit = 100, fetchImpl = fetch) {
  const res = await fetchImpl('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', referer: 'https://leetcode.com/problemset/', origin: 'https://leetcode.com', 'user-agent': 'Mozilla/5.0 (compatible; PrepByte)' },
    body: JSON.stringify({ query: QUESTION_LIST_QUERY, variables: { categorySlug: '', skip, limit, filters: {} } }),
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`LeetCode responded with ${res.status}`);
  return parseQuestionList((await res.json())?.data);
}

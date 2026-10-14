# PrepByte

Company-wise coding interview preparation: a personal plan and readiness score, a filterable question library, topic roadmaps, company guides, spaced-repetition reviews, and progress analytics.

React + Vite on the front, Express on the back. MongoDB, Redis, and Supabase sign-in are all **optional**; the app is fully usable without them.

## Run locally

```bash
npm install
cp .env.example .env     # optional: only needed for Mongo, Redis, Supabase, or admin import
npm run server           # terminal 1: API on http://localhost:8787
npm run dev              # terminal 2: client on http://localhost:5173 (proxies /api)
```

Production: `npm run build`, then `npm start`. Express serves `dist/` and the API from one port.

Run the tests with `npm test`.

## What works

| Area | Behavior |
| --- | --- |
| Dashboard | Target company and date, a readiness score measured against fixed benchmarks (your target company's 50 most-asked questions plus topic coverage), so it doesn't shrink as the library grows, today's plan, streak, week view, weakest topics |
| Practice | 522 questions. Search plus company, topic, difficulty, and status filters, four sort orders, bookmarks, and a problem modal |
| Problem modal | Timed drill with target time, personal notes, link to the problem, mark solved, save |
| Roadmaps | 22 topics in learning order with real progress; expand for concepts and questions |
| Companies | 83 company guides with search and categories (Big Tech, Product, Finance, India, Services). Top questions, typical interview flow, focus topics, progress, and "Set as my target" |
| Revision | Solved questions return after 1, 3, 7, 14, 30, 60 days. "Nailed it" moves up the ladder; "Struggled" resets to 1 day |
| Mock interview | A timed set (2 to 4 questions) in the style of a company. Survives a refresh, records results and adds solves to your reviews |
| Insights | Coverage by topic and difficulty, streaks, 14-day activity |
| Profile | Name, target, sign-in, LeetCode sync, export/import/reset of your data |
| Search | `Ctrl/Cmd + K` opens a quick finder for questions and pages |

Progress is saved in your browser first. Sign in and it is merged with your account and synced across devices.

## Sign-in

Three ways to sign in, all on the Profile page (and from the header's **Sign in** button).

**Email and Google** use Supabase.

1. Create a Supabase project and put its URL and publishable key in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). Restart `npm run dev` and `npm run server`.
2. Email works straight away (password or magic link). In Supabase, Authentication, URL Configuration, add your site URL (for example `http://localhost:5173`) to the redirect list.
3. For Google: in Google Cloud Console create an OAuth client (type Web) and add `https://<your-project>.supabase.co/auth/v1/callback` as an authorized redirect URI. Then in Supabase, Authentication, Providers, Google, paste the client ID and secret and enable it.

**LeetCode** has no "log in with" option, so PrepByte verifies that you own the profile instead:

1. Enter your LeetCode username and press **Get my code**.
2. Paste the code anywhere in your LeetCode profile **Summary** and save.
3. Press **Verify and sign in**. The server reads your public profile, checks for the code, and issues a signed 30-day session. You can delete the code afterwards.

This needs only the API server. Set `SESSION_SECRET` in `.env` so sessions survive a restart.

**LeetCode sync** (Profile, LeetCode) works for any user: it shows your public stats and marks library questions solved from your recent accepted submissions. LeetCode only exposes your latest submissions publicly, so older solves have to be ticked off by hand.

## API

| Route | Description |
| --- | --- |
| `GET /api/health` | Status, and whether Mongo, Redis, and auth are active |
| `GET /api/catalog` | Problems, company guides, roadmap topics (cached in Redis when available) |
| `GET /api/problems?search=&topic=&company=&difficulty=` | Filtered problems |
| `GET /api/companies`, `GET /api/topics` | Per-company / per-topic stats (questions, average frequency, average acceptance, difficulty split). Computed with MongoDB aggregation pipelines, cached in Redis |
| `GET /api/roadmap` | Personalized roadmap: per-topic totals joined with the signed-in user's solved questions (aggregation pipeline with `$lookup`) |
| `GET /api/progress`, `PUT /api/progress` | Per-user progress. Requires `Authorization: Bearer <Supabase access token or LeetCode session>` |
| `GET /api/leetcode/:username` | Public LeetCode stats and recent accepted submissions (cached 5 minutes) |
| `POST /api/auth/leetcode/start`, `POST /api/auth/leetcode/verify` | The two steps of LeetCode sign-in |
| `POST /api/admin/problems/import` | Add problems. Header `x-admin-key: $ADMIN_API_KEY`, body is a JSON array. Add `?mode=upsert` to also merge fields (such as `acceptance`) into existing questions |

Import example:

```bash
curl -X POST http://localhost:8787/api/admin/problems/import \
  -H "content-type: application/json" -H "x-admin-key: $ADMIN_API_KEY" \
  -d '[{"id":"my-problem","title":"My Problem","topic":"Graphs","difficulty":"Medium","companies":["Amazon","Uber"],"frequency":70,"time":30,"url":"https://leetcode.com/problems/two-sum/"}]'
```

## Loading real data at scale

The bundled library is a 522-question starter set. To grow it:

```bash
# 1. Real acceptance rates straight from LeetCode (API must be running, ADMIN_API_KEY set in .env)
npm run sync:leetcode
npm run sync:leetcode -- --export leetcode-all.json   # also saves LeetCode's full problem list

# 2. Your own company-wise dataset from a CSV
#    columns: id,title,topic,difficulty,companies,frequency,acceptance,time,url   (companies separated by ;)
npm run import:csv -- data/problems.csv
```

`import:csv` upserts in batches of 500, so it can load thousands of rows. LeetCode does not publish company tags, so a dataset with hundreds of companies has to come from a source you are allowed to use (your own collection, or a licensed or open dataset). Acceptance rates stay empty until you run the sync; the Practice filter says so instead of showing made-up numbers.

## Authentication and data

- **JWT:** LeetCode sign-in issues standard HS256 JSON Web Tokens (`iss: prepbyte`, 30 day expiry; `alg: none` and other algorithms are rejected). Google and email sign-in use Supabase, which also issues JWTs; the API verifies both.
- **MongoDB:** the problem library is stored in the `problems` collection with indexes on `id`, `companies`, and `topic`; progress is stored per user in `progress`. `/api/companies`, `/api/topics`, and `/api/roadmap` run aggregation pipelines (`$unwind`, `$group`, `$lookup`, `$project`, `$sort`; see `server/analytics.js`). Without MongoDB the same numbers are computed in memory.
- **Redis:** catalog, problem searches, and the company and topic aggregates are cached for 60 seconds, and the cache is cleared on import.

## Measuring performance honestly

Do not quote latency or concurrency numbers you have not measured. To measure them:

```bash
# Start the API with Mongo (and optionally Redis) running, rate limit off for the test:
RATE_LIMIT_PER_MIN=0 npm run server

npm run bench -- http://localhost:8787/api/companies --connections 200 --seconds 15
```

Run it once with `REDIS_URL` set and once without (restart the server in between), on the same machine, and compare the average and p95 latency. `/api/companies` is the useful endpoint to test because it runs a MongoDB aggregation that Redis can skip. Endpoints that read the in-memory catalog are already fast, so caching them shows little difference. The script prints which services were active, so the result is reproducible.

User counts and completion rates come from real usage (the Supabase dashboard shows sign-ups); they cannot be produced by the code.

## About the seed data

The 522 questions across 83 companies link to their public LeetCode pages. **Company tags and frequency percentages are illustrative placeholders, not official statistics.** Some companies are hand-tagged; the rest are assigned from their typical topic focus. Replace everything with data you trust through the import route.

## Resume-safe claims

The application implements a React client and Express API with MongoDB and Redis integration points. Do not claim data scale, users, latency reduction, or concurrent-session counts until those figures have been measured in your deployed environment.

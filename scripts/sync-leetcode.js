// Pull real acceptance rates from LeetCode and merge them into your question library.
//   npm run sync:leetcode                      updates acceptance for every question already in the API
//   npm run sync:leetcode -- --export all.json also saves LeetCode's full problem list (id, title, difficulty, acceptance, topics)
import 'dotenv/config';
import fs from 'node:fs';
import { fetchQuestionPage } from '../server/leetcode.js';

const api = (process.env.API_URL || 'http://localhost:8787').replace(/\/$/, '');
const key = process.env.ADMIN_API_KEY;
const exportAt = process.argv.indexOf('--export');
const exportFile = exportAt > -1 ? process.argv[exportAt + 1] : null;
if (!key) {
  console.error('Set ADMIN_API_KEY in .env first (it must match the server).');
  process.exit(1);
}

const all = [];
for (let skip = 0; ; skip += 100) {
  const page = await fetchQuestionPage(skip, 100);
  all.push(...page.questions);
  process.stdout.write(`\rFetched ${all.length}/${page.total} questions`);
  if (!page.questions.length || all.length >= page.total) break;
  await new Promise(resolve => setTimeout(resolve, 400)); // be polite to LeetCode
}
console.log();
if (exportFile) {
  fs.writeFileSync(exportFile, JSON.stringify(all, null, 2));
  console.log(`Saved ${all.length} questions to ${exportFile}`);
}

const catalog = await (await fetch(`${api}/api/catalog`)).json();
const known = new Set(catalog.problems.map(p => p.id));
const updates = all.filter(q => known.has(q.id) && q.acceptance !== null).map(q => ({ id: q.id, acceptance: q.acceptance }));
const res = await fetch(`${api}/api/admin/problems/import?mode=upsert`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify(updates) });
if (!res.ok) {
  console.error(`Update failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
console.log(`Updated acceptance rates for ${(await res.json()).updated} of ${known.size} questions.`);

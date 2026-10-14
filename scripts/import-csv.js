// Load a large question/company dataset from CSV into a running API.
//   npm run import:csv -- data/problems.csv
// Columns: id,title,topic,difficulty,companies,frequency,acceptance,time,url   (companies separated by ;)
import 'dotenv/config';
import fs from 'node:fs';
import { parseCsv, rowToProblem } from './csv.js';

const file = process.argv[2];
const api = (process.env.API_URL || 'http://localhost:8787').replace(/\/$/, '');
const key = process.env.ADMIN_API_KEY;
if (!file || !key) {
  console.error('Usage: ADMIN_API_KEY=... npm run import:csv -- path/to/problems.csv   (set API_URL if the API is not on localhost:8787)');
  process.exit(1);
}

const problems = parseCsv(fs.readFileSync(file, 'utf8')).map(rowToProblem);
console.log(`Read ${problems.length} rows from ${file}`);
const totals = { imported: 0, updated: 0, skipped: 0 };
for (let i = 0; i < problems.length; i += 500) {
  const res = await fetch(`${api}/api/admin/problems/import?mode=upsert`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-key': key }, body: JSON.stringify(problems.slice(i, i + 500)) });
  if (!res.ok) {
    console.error(`Batch starting at row ${i + 1} failed: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const body = await res.json();
  for (const k of Object.keys(totals)) totals[k] += body[k] || 0;
}
console.log('Done:', totals);

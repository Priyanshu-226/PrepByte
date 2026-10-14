// Measure API latency under concurrent load, so any numbers you quote are your own.
//   npm run bench -- http://localhost:8787/api/companies --connections 200 --seconds 15
// Compare a run with REDIS_URL set against a run without it (restart the server in between).
import { performance } from 'node:perf_hooks';

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http')) || 'http://localhost:8787/api/companies';
const flag = (name, fallback) => {
  const at = args.indexOf(`--${name}`);
  return at > -1 ? Number(args[at + 1]) || fallback : fallback;
};
const connections = flag('connections', 50);
const seconds = flag('seconds', 10);

const health = await fetch(new URL('/api/health', url)).then(r => r.json()).catch(() => null);
if (!health) {
  console.error(`Could not reach ${new URL('/api/health', url)}. Start the API first (npm run server).`);
  process.exit(1);
}
console.log(`Target ${url}`);
console.log(`Services: ${JSON.stringify(health.services)}`);
console.log(`${connections} concurrent connections for ${seconds}s...\n`);

const times = [];
let errors = 0;
let limited = 0;
const deadline = performance.now() + seconds * 1000;
await fetch(url).catch(() => {}); // warm up caches before measuring

async function worker() {
  while (performance.now() < deadline) {
    const start = performance.now();
    try {
      const res = await fetch(url);
      await res.arrayBuffer();
      if (res.status === 429) limited += 1;
      else if (!res.ok) errors += 1;
      else times.push(performance.now() - start);
    } catch {
      errors += 1;
    }
  }
}
await Promise.all(Array.from({ length: connections }, worker));

times.sort((a, b) => a - b);
const pct = p => (times.length ? times[Math.min(times.length - 1, Math.floor((p / 100) * times.length))] : NaN);
const avg = times.reduce((n, t) => n + t, 0) / (times.length || 1);
console.log(`Requests: ${times.length} ok, ${errors} failed, ${limited} rate-limited (${(times.length / seconds).toFixed(0)} req/s)`);
if (limited) console.log('Many requests were rate limited. Restart the server with RATE_LIMIT_PER_MIN=0 for load tests.');
console.log(`Latency ms: avg ${avg.toFixed(1)} | p50 ${pct(50).toFixed(1)} | p95 ${pct(95).toFixed(1)} | p99 ${pct(99).toFixed(1)}`);

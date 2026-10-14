// Minimal CSV reader (quotes, escaped quotes, CRLF) and the column mapping used by import-csv.js.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell);
      cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// Columns: id, title, topic, difficulty, companies (separated by ;), frequency, acceptance, time, url
export function rowToProblem(row) {
  const out = { id: row.id, title: row.title, topic: row.topic, difficulty: row.difficulty, companies: (row.companies || '').split(';').map(c => c.trim()).filter(Boolean) };
  for (const key of ['frequency', 'acceptance', 'time']) if (row[key] !== undefined && row[key] !== '') out[key] = Number(row[key]);
  if (row.url) out.url = row.url;
  return out;
}

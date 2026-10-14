import fs from 'node:fs';
import path from 'node:path';

// Live data tests read the API key from .env, and never touch the database.
const file = path.resolve(import.meta.dirname, '../.env');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=');
    if (i > 0 && !line.trimStart().startsWith('#')) {
      const k = line.slice(0, i).trim();
      if (k === 'CR_API_KEY' || k === 'CR_API_BASE') process.env[k] ??= line.slice(i + 1).trim();
    }
  }
}
delete process.env.DATABASE_URL;

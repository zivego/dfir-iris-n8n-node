import fs from 'node:fs';
import path from 'node:path';

const distPath = path.resolve(import.meta.dirname, '..', 'dist');

fs.rmSync(distPath, { recursive: true, force: true });

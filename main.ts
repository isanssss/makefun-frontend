// Entry point for the makefun-frontend-01 submission (Node 22, standard library only).
//
// The product is the static frontend in app/ — plain HTML, CSS and ES modules with no
// build step, reading make.fun's public API. This program hands it in: it copies app/
// and screenshots/ from beside this file into the output directory and writes a
// dossier.json there with the vendored make.fun library, summarising the screenshots,
// the first load's files and bytes, and the source for the judge.
//
// Output directory: /output in the grader's container, or $MAKEFUN_OUTPUT_DIR
// anywhere else:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// vendor/makefun-frontend.ts is left exactly as shipped: the scorer requires
// dossier.json to be byte for byte what its own copy of the library writes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(name: string): void {
  const from = join(root, name);
  if (!existsSync(from)) return;
  mkdirSync(join(outputDir, name), { recursive: true });
  cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

// The scorer's own caps, passed through unchanged: text_max_bytes shapes the dossier's
// bytes; the rest refuse anything the scorer would refuse anyway (over 3 screenshots or
// one over 256 KiB; over 993 files or 16 MiB in app/).
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

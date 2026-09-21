import { cp, mkdir, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const entries = ['index.html', 'privacy.html', 'manifest.json', 'sw.js', 'assets', 'i18n', 'src', 'styles'];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of entries) {
  await cp(new URL(entry, root), new URL(entry, output), { recursive: true });
}

console.log(`Built offline web assets in ${output.pathname}`);
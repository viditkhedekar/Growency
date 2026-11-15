import { cp, readdir } from 'node:fs/promises';
import { basename } from 'node:path';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);

// The homepage uses Vite. Serve the existing static pages, their assets,
// and both generations of homepage archives from the same deployment.
const rootFiles = (await readdir(root, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(?:html|css|js|png)$/.test(entry.name) && entry.name !== 'index.html')
  .map(({ name }) => name);

for (const path of ['assets', 'compare', 'archive', ...rootFiles]) {
  await cp(new URL(path, root), new URL(path, dist), {
    recursive: true,
    filter: (source) => !basename(source).startsWith('.'),
  });
}

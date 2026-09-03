import { access, cp, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'out');

async function required(file) {
  try {
    await access(file, constants.R_OK);
  } catch {
    throw new Error(`Не найден обязательный файл релиза: ${path.relative(root, file)}`);
  }
}

await required(path.join(output, 'index.html'));
await required(path.join(root, 'timeweb', 'api', 'lead.php'));
await required(path.join(root, 'timeweb', 'public', '.htaccess'));

await mkdir(path.join(output, 'api'), { recursive: true });
await cp(path.join(root, 'timeweb', 'api', 'lead.php'), path.join(output, 'api', 'lead.php'));
await cp(path.join(root, 'timeweb', 'public', '.htaccess'), path.join(output, '.htaccess'));

console.log('Timeweb release prepared in out/. Upload its contents to public_html; private configuration is intentionally excluded.');

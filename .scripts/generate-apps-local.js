import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appsDir = path.join(__dirname, '..', 'apps');
const outputFile = path.join(__dirname, '..', 'apps.local.json');

try {
  const appDirs = fs
    .readdirSync(appsDir)
    .filter((dir) => fs.existsSync(path.join(appsDir, dir, 'metadata.json')));

  const apps = appDirs.map((dir) => {
    const metaPath = path.join(appsDir, dir, 'metadata.json');
    const content = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(content);
  });

  fs.writeFileSync(outputFile, JSON.stringify(apps, null, 2));
  console.log(`Generated ${outputFile} with ${apps.length} apps.`);
} catch (err) {
  console.error('Error generating apps.local.json:', err);
  process.exit(1);
}

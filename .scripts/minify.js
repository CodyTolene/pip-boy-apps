import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const folders = ['../USER', '../USER_BOOT'];
const allFiles = [];

for (const folder of folders) {
  const fullPath = path.resolve(__dirname, folder);
  if (!fs.existsSync(fullPath)) continue;
  const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.js')).map(f => ({
    name: f,
    path: path.join(fullPath, f),
    output: path.join(__dirname, '../minified', path.basename(folder), f)
  }));
  allFiles.push(...files);
}

if (allFiles.length === 0) {
  console.log('No JavaScript files found.');
  process.exit(0);
}

let selected = 0;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
readline.emitKeypressEvents(process.stdin, rl);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

function render() {
  console.clear();
  console.log('Select a file to minify:\n');
  allFiles.forEach((f, i) => {
    console.log(`${i === selected ? '>' : ' '} ${f.name}`);
  });
}

render();

process.stdin.on('keypress', (str, key) => {
  if (key.name === 'up') {
    selected = (selected + allFiles.length - 1) % allFiles.length;
    render();
  } else if (key.name === 'down') {
    selected = (selected + 1) % allFiles.length;
    render();
  } else if (key.name === 'return') {
    const { path: inputPath, output } = allFiles[selected];
    fs.mkdirSync(path.dirname(output), { recursive: true });
    console.log(`\nMinifying ${inputPath}...`);
    try {
      execSync(`espruino --minify "${inputPath}" -o "${output}"`, { stdio: 'inherit' });
      console.log('\nMinification complete.');
    } catch (e) {
      console.error(`Failed to minify: ${e.message}`);
    }
    rl.close();
    process.exit(0);
  } else if (key.ctrl && key.name === 'c') {
    rl.close();
    process.exit(0);
  }
});

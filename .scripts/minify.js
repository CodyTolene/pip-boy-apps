import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import readline from 'readline';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let espruinoCli;
try {
  espruinoCli = require.resolve('espruino/bin/espruino-cli.js');
} catch {
  espruinoCli = null;
}

function runEspruino(args) {
  if (!espruinoCli) {
    throw new Error('Espruino CLI not found. Run: npm i');
  }
  execFileSync(process.execPath, [espruinoCli, ...args], { stdio: 'inherit' });
}

const appsDir = path.resolve(__dirname, '../apps');
const allFiles = [];

function findJsFiles(dir, baseDir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findJsFiles(fullPath, baseDir);
    } else if (
      entry.isFile() &&
      path.extname(entry.name) === '.js' &&
      !entry.name.endsWith('.min.js')
    ) {
      const relativePath = path.relative(baseDir, fullPath);
      allFiles.push({
        name: relativePath,
        path: fullPath,
        output: path.join(
          path.dirname(fullPath),
          path.basename(fullPath, '.js') + '.min.js',
        ),
      });
    }
  }
}

if (fs.existsSync(appsDir)) {
  findJsFiles(appsDir, appsDir);
}

if (allFiles.length === 0) {
  console.log('No JavaScript files found in apps/.');
  process.exit(0);
}

let selected = 0;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
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
      runEspruino(['--minify', inputPath, '-o', output]);
      console.log('\nMinification complete.');
    } catch (e) {
      console.error(`Failed to minify: ${e.message}`);
    }
    rl.close();
    process.exit(0);
  }
});

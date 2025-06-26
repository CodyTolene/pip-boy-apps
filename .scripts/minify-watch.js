import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  console.log('Select a file to watch and minify on change:\n');
  allFiles.forEach((f, i) => {
    console.log(`${i === selected ? '>' : ' '} ${f.name}`);
  });
}

function minifyFile(inputPath, output) {
  fs.mkdirSync(path.dirname(output), { recursive: true });
  console.log(`[${new Date().toLocaleTimeString()}] Minifying ${inputPath}...`);
  try {
    execSync(`espruino --minify "${inputPath}" -o "${output}"`, {
      stdio: 'inherit',
    });
    console.log(`Minification complete: ${output}\n`);
  } catch (e) {
    console.error(`Failed to minify: ${e.message}`);
  }
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
    console.log(`\nWatching ${inputPath} for changes... Press CTRL+C to stop.`);
    minifyFile(inputPath, output);

    fs.watchFile(inputPath, { interval: 500 }, () => {
      minifyFile(inputPath, output);
    });

    rl.close();
  } else if (key.ctrl && key.name === 'c') {
    console.log('\nStopping watcher.');
    rl.close();
    process.exit(0);
  }
});

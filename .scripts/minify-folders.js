import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targets = [
  { input: '../USER', output: '../min/USER' },
  { input: '../USER_BOOT', output: '../min/USER_BOOT' },
];

for (const { input, output } of targets) {
  const inputDir = path.resolve(__dirname, input);
  const outputDir = path.resolve(__dirname, output);

  if (!fs.existsSync(inputDir)) {
    console.warn(`Skipping ${inputDir}, folder not found.`);
    continue;
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.readdirSync(inputDir).forEach((file) => {
    if (path.extname(file) === '.js') {
      const inputPath = path.join(inputDir, file);
      const outputPath = path.join(outputDir, file);
      console.log(`Minifying ${file}...`);
      try {
        execSync(`espruino --minify "${inputPath}" -o "${outputPath}"`, {
          stdio: 'inherit',
        });
      } catch (e) {
        console.error(`Failed to minify ${file}:`, e.message);
      }
    }
  });
}

console.log('All minifiable files processed.');

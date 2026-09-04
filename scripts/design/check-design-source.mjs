import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const failures = [];
const darkDir = 'дизайн/темная';
const lightDir = 'дизайн/светлая ';
const compactMobileSize = { width: 941, height: 1672 };
const fullHdMobileSize = { width: 1080, height: 1920 };

function pngFiles(dir) {
  if (!existsSync(dir)) {
    failures.push(`missing design directory: ${dir}`);
    return [];
  }
  return readdirSync(dir)
    .filter((file) => file.endsWith('.png'))
    .sort()
    .map((file) => join(dir, file));
}

function dimensions(file) {
  const output = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  return {
    width: Number(output.match(/pixelWidth:\s+(\d+)/)?.[1]),
    height: Number(output.match(/pixelHeight:\s+(\d+)/)?.[1]),
  };
}

function expectedSizeFor(file) {
  const fileName = file.split('/').at(-1) ?? '';
  return /^(21|22|23|24|25)_/.test(fileName) ? fullHdMobileSize : compactMobileSize;
}

function expectMobileReferences(label, files, expectedCount) {
  if (files.length !== expectedCount) {
    failures.push(`${label} expected ${expectedCount} png references, found ${files.length}`);
  }
  for (const file of files) {
    const { width, height } = dimensions(file);
    const expected = expectedSizeFor(file);
    if (width !== expected.width || height !== expected.height) {
      failures.push(`${file} has ${width}x${height}, expected ${expected.width}x${expected.height}`);
    }
  }
}

const darkFiles = pngFiles(darkDir);
const lightFiles = pngFiles(lightDir);

expectMobileReferences('dark theme', darkFiles, 25);
expectMobileReferences('light theme', lightFiles, 20);

const darkPrefixes = new Set(darkFiles.map((file) => file.split('/').at(-1)?.slice(0, 2)));
for (let index = 1; index <= 25; index += 1) {
  const prefix = String(index).padStart(2, '0');
  if (!darkPrefixes.has(prefix)) failures.push(`dark theme missing numbered screen ${prefix}`);
}

const screenListPath = join(darkDir, 'Список_экранов.txt');
if (!existsSync(screenListPath)) {
  failures.push(`missing screen list: ${screenListPath}`);
} else {
  const listedScreens = readFileSync(screenListPath, 'utf8')
    .split('\n')
    .filter((line) => /^\d{2}_/.test(line));
  if (listedScreens.length < 20) failures.push(`screen list has ${listedScreens.length} entries, expected at least 20`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('design source contract ok');

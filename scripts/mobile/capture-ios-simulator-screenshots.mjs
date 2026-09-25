import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const flutter = process.env.FLUTTER_BIN ?? '/Volumes/PD1000/job/flutter/bin/flutter';
const udid = process.env.IOS_SIMULATOR_UDID ?? '3D5FB3C3-6125-4972-A95F-EF7FD060FEDB';
const outDir = resolve(root, 'docs/project/app-store-screenshots/ios-simulator-native-full');
const appPath = resolve(root, 'apps/mobile/build/ios/iphonesimulator/Runner.app');

const screens = [
  ['01-login-native.png', '/login'],
  ['02-home-native.png', '/'],
  ['03-new-case-native.png', '/case/new'],
  ['04-category-native.png', '/case/category'],
  ['05-chat-native.png', '/case/chat'],
  ['06-documents-native.png', '/documents'],
  ['07-legal-native.png', '/legal'],
  ['08-subscription-native.png', '/subscription'],
];

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    ...options,
  });
}

function tryRun(command, args) {
  try {
    execFileSync(command, args, { cwd: root, stdio: 'ignore' });
  } catch {
    // Expected when the simulator is already booted or the app is not installed.
  }
}

mkdirSync(outDir, { recursive: true });

tryRun('xcrun', ['simctl', 'boot', udid]);
run('xcrun', ['simctl', 'bootstatus', udid, '-b']);

for (const [fileName, route] of screens) {
  run(flutter, [
    'build',
    'ios',
    '--simulator',
    '--debug',
    `--dart-define=AI_LAWYER_INITIAL_ROUTE=${route}`,
  ], { cwd: resolve(root, 'apps/mobile') });
  tryRun('xcrun', ['simctl', 'terminate', udid, 'kz.milanium.lawyer']);
  tryRun('xcrun', ['simctl', 'uninstall', udid, 'kz.milanium.lawyer']);
  run('xcrun', ['simctl', 'install', udid, appPath]);
  run('xcrun', ['simctl', 'launch', udid, 'kz.milanium.lawyer']);
  execFileSync('sleep', ['5']);
  const outPath = join(outDir, fileName);
  rmSync(outPath, { force: true });
  run('xcrun', ['simctl', 'io', udid, 'screenshot', outPath]);
}

console.log(`Captured ${screens.length} native screenshots in ${outDir}`);

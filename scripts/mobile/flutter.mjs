import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const pinned = '/Volumes/PD1000/job/flutter/bin/flutter';
const executable = process.env.FLUTTER_BIN || (existsSync(pinned) ? pinned : existsSync('/workspace/flutter-sdk/bin/flutter') ? '/workspace/flutter-sdk/bin/flutter' : 'flutter');
const args = process.argv.slice(2);
const command = args[0] === 'dart' ? (executable === 'flutter' ? 'dart' : join(dirname(executable), 'dart')) : executable;
if (args[0] === 'dart') args.shift();
const result = spawnSync(command, args, {
  stdio: 'inherit', env: { ...process.env, ...(existsSync('/workspace/flutter-sdk') ? {
    PUB_CACHE: process.env.PUB_CACHE || '/workspace/.pub-cache',
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME || '/workspace/.config',
    FLUTTER_SUPPRESS_ANALYTICS: 'true', CI: 'true',
  } : {}) },
});
if (result.error) console.error(`Flutter SDK unavailable. Set FLUTTER_BIN to a supported SDK: ${result.error.message}`);
process.exit(result.status ?? 1);

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const flutter = process.env.FLUTTER_BIN ?? '/Volumes/PD1000/job/flutter/bin/flutter';
const devices = JSON.parse(execFileSync('xcrun', ['simctl', 'list', 'devices', 'available', '--json'], {encoding:'utf8'}));
const available = Object.values(devices.devices).flat().find(device=>device.name.includes('iPhone') && device.isAvailable);
const udid = process.env.IOS_SIMULATOR_UDID ?? available?.udid;
if(!udid) throw new Error('No available iPhone simulator');
const outDir = process.env.IOS_SCREENSHOT_DIR ?? resolve(root, 'docs/project/app-store-screenshots/ios-simulator-native-full');
const appPath = resolve(root, 'apps/mobile/build/ios/iphonesimulator/Runner.app');

const allScreens = [
  ['01-onboarding.png','/onboarding'],['02-login.png','/login'],['03-register.png','/register'],
  ['04-otp.png','/otp'],['05-biometric.png','/biometric'],['06-home.png','/'],
  ['07-profile.png','/profile'],['08-settings.png','/settings'],['09-help.png','/help'],
  ['10-cases.png','/cases'],['11-case.png','/case/details'],['12-new-case.png','/case/new'],
  ['13-category.png','/case/category'],['14-chat.png','/case/chat'],['15-documents.png','/documents'],
  ['16-document-upload.png','/documents/add'],['17-analysis.png','/documents/analysis'],
  ['18-deadlines.png','/deadlines'],['19-legal.png','/legal'],
  ['20-claim.png','/workflow/pretrial-claim'],['21-claim-draft.png','/workflow/pretrial-claim/draft'],
  ['22-claim-send.png','/workflow/pretrial-claim/send'],['23-subscription.png','/subscription'],
];

const firstScreen=Number(process.env.IOS_PREVIEW_FIRST || 1);
const lastScreen=Number(process.env.IOS_PREVIEW_LAST || allScreens.length);
if(!Number.isInteger(firstScreen)||!Number.isInteger(lastScreen)||firstScreen<1||lastScreen>allScreens.length||firstScreen>lastScreen)throw new Error('Invalid native preview range');
const screens=allScreens.slice(firstScreen-1,lastScreen);

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

run(flutter, [
  'build', 'ios', '--simulator', '--debug',
  '--dart-define=AI_LAWYER_PREVIEW_MODE=true',
], { cwd: resolve(root, 'apps/mobile') });
tryRun('xcrun', ['simctl', 'terminate', udid, 'kz.milanium.lawyer']);
tryRun('xcrun', ['simctl', 'uninstall', udid, 'kz.milanium.lawyer']);
run('xcrun', ['simctl', 'install', udid, appPath]);

const dataContainer = execFileSync('xcrun', ['simctl', 'get_app_container', udid, 'kz.milanium.lawyer', 'data'], {encoding:'utf8'}).trim();
const confirmationPath = join(dataContainer, 'tmp', 'aizan-preview-route.txt');
for (const [fileName, route] of screens) {
  rmSync(confirmationPath, {force:true});
  try {
    run('xcrun', ['simctl', 'launch', udid, 'kz.milanium.lawyer'], {
      env: {...process.env, SIMCTL_CHILD_AIZAN_PREVIEW_ROUTE: route,
        SIMCTL_CHILD_AIZAN_PREVIEW_CONFIRMATION_PATH: confirmationPath},
    });
    const deadline = Date.now() + 30000;
    let confirmed = false;
    while (Date.now() < deadline) {
      if (existsSync(confirmationPath) && readFileSync(confirmationPath, 'utf8') === route) {
        confirmed = true; break;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!confirmed) throw new Error(`Native route did not confirm after its first frame: ${route}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    const outPath = join(outDir, fileName);
    rmSync(outPath, { force: true });
    run('xcrun', ['simctl', 'io', udid, 'screenshot', outPath]);
    console.log(`Verified native route ${route}`);
  } finally {
    tryRun('xcrun', ['simctl', 'terminate', udid, 'kz.milanium.lawyer']);
  }
}

console.log(`Captured ${screens.length} native screenshots in ${outDir}`);

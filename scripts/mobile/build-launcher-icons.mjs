import {readFile, writeFile} from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../../', import.meta.url);
const ios = new URL('apps/mobile/ios/Runner/Assets.xcassets/AppIcon.appiconset/', root);
const master = await readFile(new URL('Icon-App-1024x1024@1x.png', ios));
const metadata = await sharp(master).metadata();
if (metadata.width !== 1024 || metadata.height !== 1024 || metadata.hasAlpha) {
  throw new Error('The launcher master must be opaque 1024x1024 PNG');
}
const resize = size => sharp(master).resize(size, size).removeAlpha().png().toBuffer();
const contents = JSON.parse(await readFile(new URL('Contents.json', ios), 'utf8'));
for (const image of contents.images) {
  const size = Math.round(parseFloat(image.size) * parseFloat(image.scale));
  if (size !== 1024) await writeFile(new URL(image.filename, ios), await resize(size));
}
for (const [density, size] of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})) {
  await writeFile(new URL(`apps/mobile/android/app/src/main/res/mipmap-${density}/ic_launcher.png`, root), await resize(size));
}
for (const [path, size] of Object.entries({
  'apps/web/app/icon.png':512,
  'apps/web/app/apple-icon.png':180,
  'apps/web/public/brand/aizan-icon-192.png':192,
  'apps/web/public/brand/aizan-icon-512.png':512,
})) await writeFile(new URL(path, root), await resize(size));

const sizes = [16,32,48];
const pngs = await Promise.all(sizes.map(size => sharp(master).resize(size, size).ensureAlpha().png().toBuffer()));
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (const [index, size] of sizes.entries()) {
  const entry = 6 + index * 16;
  header[entry] = size;
  header[entry + 1] = size;
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(pngs[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += pngs[index].length;
}
await writeFile(new URL('apps/web/app/favicon.ico', root), Buffer.concat([header,...pngs]));
console.log('Generated iOS, Android and web launcher icons from the opaque monogram master');

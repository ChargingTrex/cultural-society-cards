import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import QRCode from 'qrcode';

const root = dirname(fileURLToPath(import.meta.url));
const qrDir = join(root, 'qr');

const data = JSON.parse(readFileSync(join(root, 'members.json'), 'utf8'));

mkdirSync(qrDir, { recursive: true });

const labels = [];

for (const member of data.members) {
  const url = `${data.site.baseUrl}/${member.slug}/`;
  await QRCode.toFile(join(qrDir, `${member.slug}.png`), url, {
    errorCorrectionLevel: 'M',
    margin: 4, // quiet zone, in modules — required, do not reduce
    width: 1024,
    color: { dark: '#000000FF', light: '#FFFFFFFF' },
  });
  labels.push(`${member.slug}\t${member.name}\t${url}`);
}

writeFileSync(join(qrDir, 'labels.txt'), labels.join('\n') + '\n');

console.log(`wrote ${data.members.length} QR code(s) -> ${qrDir}`);
console.log('print rules: >=20mm square, keep the 4-module quiet zone, pure black on pure white, no logo overlay');

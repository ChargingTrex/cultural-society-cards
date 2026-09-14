import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateMembers, pickForeground } from './src/validate.js';
import { renderMemberPage } from './src/page.js';
import { renderVCard } from './src/vcard.js';
import { renderDirectoryPage } from './src/index.js';

const root = dirname(fileURLToPath(import.meta.url));
const distDir = join(root, 'dist');
const photosDir = join(root, 'assets', 'photos');

const data = JSON.parse(readFileSync(join(root, 'members.json'), 'utf8'));
const { warnings } = validateMembers(data, { photosDir });
for (const warning of warnings) console.error(`warning: ${warning}`);

// Every declaration in styles.css ends in ";" or "," (never a bare token at
// end of line), so stripping comments and per-line indentation is safe:
// nothing in the file depends on a line break as its only separator. The
// one embedded data: URI (the dither noise texture) has been checked for
// "word: word"/"word, word"-style spacing the punctuation collapse below
// could corrupt — it has none, only bare "http://" and "data:image" with no
// adjacent space, so collapsing whitespace around {}:;, is safe here too.
function minifyCss(source) {
  const collapsed = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
  return collapsed.replace(/\s*([{}:;,])\s*/g, '$1');
}

const css = minifyCss(readFileSync(join(root, 'src', 'styles.css'), 'utf8'));

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

function resolveWhatsapp(member) {
  if (member.whatsapp === false) return null;
  if (member.whatsapp) return member.whatsapp;
  if (member.phone) return member.phone.replace(/\D/g, '');
  return null;
}

const built = [];

for (const member of data.members) {
  const accent = member.accent || data.site.accent;
  const surface = member.surface || data.site.surface;
  const { ink: primaryForeground } = pickForeground(accent);
  const resolved = {
    ...member,
    accent,
    surface,
    primaryForeground,
    whatsapp: resolveWhatsapp(member),
  };

  const html = renderMemberPage(resolved, data.site, css);
  if (html.includes('<script')) {
    throw new Error(`${member.name}: generated page contains a <script> tag`);
  }

  const memberDir = join(distDir, member.slug);
  mkdirSync(memberDir, { recursive: true });
  writeFileSync(join(memberDir, 'index.html'), html);
  writeFileSync(join(memberDir, 'contact.vcf'), renderVCard(resolved, data.site));

  const bytes = Buffer.byteLength(html);
  if (bytes > 20 * 1024) {
    const message = `${member.name}'s page is ${(bytes / 1024).toFixed(1)} KB, over the 20 KB budget`;
    console.error(`warning: ${message}`);
    warnings.push(message);
  }

  built.push({ member, resolved, bytes });
}

const { ink: siteForeground } = pickForeground(data.site.accent);
const directoryHtml = renderDirectoryPage(data.site, built.map((b) => b.resolved), css, siteForeground);
if (directoryHtml.includes('<script')) {
  throw new Error('directory page contains a <script> tag');
}
writeFileSync(join(distDir, 'index.html'), directoryHtml);

writeFileSync(join(distDir, '.nojekyll'), '');
if (data.site.cname) {
  writeFileSync(join(distDir, 'CNAME'), `${data.site.cname}\n`);
}

if (existsSync(join(root, 'assets'))) {
  cpSync(join(root, 'assets'), join(distDir, 'assets'), { recursive: true });
}

console.log(`built ${built.length} member page(s) + directory -> ${distDir}`);
for (const { member, bytes } of built) {
  console.log(`  ${member.name.padEnd(20)} dist/${member.slug}/  (${(bytes / 1024).toFixed(1)} KB)`);
}
console.log(`  ${'Directory'.padEnd(20)} dist/index.html  (${(Buffer.byteLength(directoryHtml) / 1024).toFixed(1)} KB)`);
if (warnings.length > 0) {
  console.log(`${warnings.length} warning(s) — see above`);
}

// A student editing members.json through GitHub's web UI never sees stderr
// — only whether the Actions run is green or red. Without this, a bio-length
// or missing-contact warning is invisible to exactly the person who needs to
// see it (DECISIONS.md D9).
if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = warnings.length > 0
    ? `## Build warnings\n\n${warnings.map((w) => `- ${w}`).join('\n')}\n`
    : '## Build warnings\n\nNone.\n';
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
}

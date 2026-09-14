// vCard 3.0, CRLF line endings — some Android contact apps reject LF-only
// (CLAUDE.md invariant, BUILD-SPEC.md §7).
function escapeVCardValue(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function splitName(name) {
  const lastSpace = name.lastIndexOf(' ');
  if (lastSpace === -1) return { given: name, family: '' };
  return { given: name.slice(0, lastSpace), family: name.slice(lastSpace + 1) };
}

export function renderVCard(member, site) {
  const { given, family } = splitName(member.name);
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

  lines.push(`N:${escapeVCardValue(family)};${escapeVCardValue(given)};;;`);
  lines.push(`FN:${escapeVCardValue(member.name)}`);
  lines.push(`ORG:${escapeVCardValue(site.org)};${escapeVCardValue(member.club ?? '')}`);
  if (member.role) lines.push(`TITLE:${escapeVCardValue(member.role)}`);
  if (member.phone) lines.push(`TEL;TYPE=CELL:${member.phone.replace(/[^\d+]/g, '')}`);
  if (member.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(member.email)}`);
  lines.push(`URL:${site.baseUrl}/${member.slug}/`);
  if (member.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${member.instagram}`);
  }
  lines.push(`NOTE:${escapeVCardValue(site.title)}, ${escapeVCardValue(site.org)}`);
  lines.push('END:VCARD');

  return lines.join('\r\n') + '\r\n';
}

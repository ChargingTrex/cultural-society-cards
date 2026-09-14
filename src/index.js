import { escapeHtml, avatarMarkup, clubTheme, clubBackgroundUrl } from './page.js';

// Sorted by site.roleOrder when present, otherwise left in members.json's own
// order — a committee list has an intended order, never alphabetical by
// default (BUILD-SPEC.md §8).
function sortMembers(members, roleOrder) {
  if (!roleOrder || roleOrder.length === 0) return members;
  const rank = new Map(roleOrder.map((role, i) => [role, i]));
  return [...members].map((member, i) => ({ member, i })).sort((a, b) => {
    const ra = rank.has(a.member.role) ? rank.get(a.member.role) : roleOrder.length;
    const rb = rank.has(b.member.role) ? rank.get(b.member.role) : roleOrder.length;
    return ra - rb || a.i - b.i;
  }).map(({ member }) => member);
}

// Each card carries its own member's accent as a local CSS var — the page
// itself stays neutral (site.accent, on <body>), but the avatar underneath
// is what should read as "that member's color" on a page listing everyone.
// A club with a defined theme also puts its own background photo on the
// card itself (same image as that member's individual page), so the group
// identity carries into the directory listing, not just each own page.
function renderCard(member) {
  const roleLine = [member.role, member.club].filter(Boolean).join(' · ');
  const theme = clubTheme(member);
  const bgUrl = clubBackgroundUrl(member, 'assets/');
  const themedClass = theme ? ' card-themed' : '';
  const style = [
    `--primary:${escapeHtml(member.accent)}`,
    `--primary-foreground:${escapeHtml(member.primaryForeground)}`,
    bgUrl ? `background-image:url('${bgUrl}')` : '',
  ].filter(Boolean).join(';');
  return `<li><a class="card${themedClass}" style="${style}" href="${escapeHtml(member.slug)}/" aria-label="${escapeHtml(member.name)}, ${escapeHtml(roleLine)}">
<div class="card-avatar">${avatarMarkup(member, { assetsPath: 'assets/' })}</div>
<span class="card-name">${escapeHtml(member.name)}</span>
<span class="card-role">${escapeHtml(roleLine)}</span>
</a></li>`;
}

export function renderDirectoryPage(site, members, css, accentForeground) {
  const sorted = sortMembers(members, site.roleOrder);
  const cards = sorted.map(renderCard).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(site.title)} — ${escapeHtml(site.org)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(site.title)} committee directory, ${escapeHtml(site.org)}.">
<meta name="theme-color" content="#F4F2ED" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E0F" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif&display=swap" rel="stylesheet">
<style>${css}</style>
</head>
<body data-surface="paper" style="--primary:${escapeHtml(site.accent)};--primary-foreground:${escapeHtml(accentForeground)}">
<div class="directory">
<header class="directory-header">
<p class="role-line">${escapeHtml(site.org)}</p>
<h1 class="name">${escapeHtml(site.title)}</h1>
</header>
<ul class="directory-grid">
${cards}
</ul>
</div>
</body>
</html>
`;
}

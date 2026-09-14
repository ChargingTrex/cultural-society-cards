import { icons } from './icons.js';
import { renderDoodle } from './decoration.js';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function initials(name) {
  const words = name.trim().split(/\s+/);
  const last = words[words.length - 1];
  // A single-letter last word is a surname initial, not a name — "Arun S"
  // and "Amarnath Reddy S" would otherwise both render "AS". Fall back to
  // the first name's own two letters so they stay distinguishable.
  if (words.length === 1 || last.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + last[0]).toUpperCase();
}

// Group identity, not individual choice: everyone in a themed club shares
// one accent plus one background image — a person is distinguished by their
// name and photo, not by a personal color. Each accent is a warm color that
// contrasts against its own cool-toned background (hue sampled from the
// actual image — see project-meta/DECISIONS.md D22-D24):
//   Cultural Society — blue backdrop (214.7°)  -> coral-red (~14°)
//   Media            — pink backdrop (335°)    -> jade green (155°, true complement)
//   Student Council   — red backdrop (360°/0°)  -> cyan-teal (~190°, true complement)
// A club with no entry here falls back to site.accent (see build.js) — no
// per-member override exists any more.
const CLUB_THEMES = {
  'Cultural Society': { bg: 'cultural-society.jpg', accent: '#F2704A' },
  Media: { bg: 'media.jpg', accent: '#34B87F' },
  'Student Council': { bg: 'student-council.jpg', accent: '#2AA9C7' },
};

export function clubTheme(member) {
  return CLUB_THEMES[member.club] ?? null;
}

export function clubBackgroundUrl(member, assetsPath = '../assets/') {
  const theme = clubTheme(member);
  return theme ? `${assetsPath}clubs/${theme.bg}` : null;
}

export function avatarMarkup(member, { fullBleed = false, assetsPath = '../assets/' } = {}) {
  if (member.photo) {
    return `<img class="${fullBleed ? 'tile-bg' : 'avatar-img'}" src="${assetsPath}photos/${escapeHtml(member.photo)}" alt="" />`;
  }
  const cls = fullBleed ? 'avatar-fallback avatar-fallback--tile' : 'avatar-fallback';
  const gradient = 'background:linear-gradient(135deg, var(--primary), color-mix(in oklab, var(--primary) 55%, #000))';
  return `<div class="${cls}" style="${gradient}"><span>${escapeHtml(initials(member.name))}</span></div>`;
}

// Packs t-sm tiles into pairs in DOM order and promotes any tile left
// without a partner to t-wide, per DESIGN-SYSTEM.md §6.5 invariant 2 — this
// is what keeps the mobile (2-column) grid free of holes regardless of how
// many optional links a member has.
function pairSmallTiles(tiles) {
  const result = [];
  let pending = null;
  for (const tile of tiles) {
    if (tile.size !== 'sm') {
      if (pending) {
        result.push({ ...pending, size: 'wide', promoted: true });
        pending = null;
      }
      result.push(tile);
      continue;
    }
    if (pending) {
      result.push(pending, tile);
      pending = null;
    } else {
      pending = tile;
    }
  }
  if (pending) result.push({ ...pending, size: 'wide', promoted: true });
  return result;
}

const UNIT = { sm: 1, wide: 2, tall: 1, full: 4 };

function buildAnchorTile(member) {
  if (member.instagram) {
    const hasPhoto = Boolean(member.photo);
    return {
      size: 'lg',
      tag: 'a',
      href: `https://instagram.com/${member.instagram}`,
      ariaLabel: `${member.name} on Instagram, @${member.instagram}`,
      // A real uploaded photo stays visible unconditionally — mobile has no
      // hover, and a member who bothered to add a photo should have it seen
      // there too. Without one, the initials avatar instead only blooms in
      // on hover (desktop-only delight; touch devices never see it, and the
      // tile is already complete without it).
      className: `tile-anchor${hasPhoto ? ' has-photo' : ' has-reveal'}`,
      bg: hasPhoto
        ? `${avatarMarkup(member, { fullBleed: true })}<div class="tile-scrim"></div>`
        : `<div class="tile-reveal">${avatarMarkup(member, { fullBleed: true })}<div class="tile-scrim"></div></div>`,
      chipColor: 'var(--c-instagram)',
      icon: icons.instagram,
      title: 'Instagram',
      meta: `@${member.instagram}`,
    };
  }
  return {
    size: 'lg',
    tag: 'div',
    className: 'tile-anchor tile-image-only',
    bg: avatarMarkup(member, { fullBleed: true }),
    imageOnly: true,
  };
}

function buildPostAnchorTiles(member, site) {
  const tiles = [];

  tiles.push({
    size: 'wide',
    tag: 'a',
    href: 'contact.vcf',
    download: true,
    ariaLabel: `Save ${member.name}'s contact details`,
    treatment: 'solid',
    icon: icons.save,
    title: 'Save contact',
    meta: 'Add to phone',
  });

  if (member.email) {
    tiles.push({
      size: 'wide',
      tag: 'a',
      href: `mailto:${member.email}`,
      ariaLabel: `Email ${member.name} at ${member.email}`,
      chipColor: 'var(--c-email)',
      icon: icons.email,
      title: 'Email',
      meta: member.email,
    });
  }

  const smTiles = [];

  if (member.phone) {
    smTiles.push({
      size: 'sm',
      tag: 'a',
      href: `tel:${member.phone.replace(/[^\d+]/g, '')}`,
      ariaLabel: `Call ${member.name} on ${member.phone}`,
      chipColor: 'var(--c-phone)',
      icon: icons.phone,
      title: 'Call',
      meta: member.phone,
    });
  }

  if (member.whatsapp) {
    smTiles.push({
      size: 'sm',
      tag: 'a',
      href: `https://wa.me/${member.whatsapp}`,
      ariaLabel: `Message ${member.name} on WhatsApp`,
      chipColor: 'var(--c-whatsapp)',
      icon: icons.whatsapp,
      title: 'WhatsApp',
      meta: 'Message',
    });
  }

  if (member.linkedin) {
    smTiles.push({
      size: 'sm',
      tag: 'a',
      href: member.linkedin,
      ariaLabel: `${member.name} on LinkedIn`,
      chipColor: 'var(--c-linkedin)',
      icon: icons.linkedin,
      title: 'LinkedIn',
      meta: 'View profile',
    });
  }

  for (const link of member.links ?? []) {
    smTiles.push({
      size: link.size === 'wide' ? 'wide' : 'sm',
      tag: 'a',
      href: link.url,
      ariaLabel: `${link.label}, ${member.name}'s link`,
      chipColor: 'var(--c-link)',
      icon: icons.link,
      title: link.label,
      meta: 'Open link',
    });
  }

  const paired = pairSmallTiles(smTiles);
  tiles.push(...paired);

  // General rule: pick whichever Society size (wide=2 or full=4) brings the
  // running total to a multiple of 4, so the last desktop row never falls
  // short. D12's "blocksAfterEmail parity" version was a special case of
  // this that silently assumed Save+Email always total a fixed 4 units —
  // it breaks for a member with no email and no other contact tile at all
  // (Save alone = 2 units). Every unit value here is even, so the running
  // total before Society is always 0 or 2 mod 4 — never odd.
  const unitsBeforeSociety = tiles.reduce((sum, tile) => sum + UNIT[tile.size], 0);
  const societySize = unitsBeforeSociety % 4 === 2 ? 'wide' : 'full';

  tiles.push({
    size: societySize,
    tag: 'a',
    href: '../',
    ariaLabel: `${member.club ?? site.title}, part of ${site.org}. View the full directory.`,
    treatment: 'wash',
    chipColor: 'var(--c-link)',
    icon: icons.society,
    title: member.club || site.title,
    meta: site.org,
  });

  return tiles;
}

// The one-t-lg invariant holds by construction (buildAnchorTile always
// returns exactly one anchor); what still needs checking is the packing math.
function assertPacking(postAnchor) {
  for (let i = 0; i < postAnchor.length; i += 1) {
    if (postAnchor[i].size !== 'sm') continue;
    if (postAnchor[i + 1]?.size !== 'sm') {
      throw new Error('packing assertion failed: an unpaired t-sm tile survived packing');
    }
    i += 1;
  }

  const units = postAnchor.reduce((sum, tile) => sum + UNIT[tile.size], 0);
  if (units % 4 !== 0) {
    throw new Error(`packing assertion failed: ${units} column units after the anchor is not divisible by 4`);
  }
}

function renderTile(tile) {
  // Grid sizing (grid-column/grid-row) only takes effect on a direct child
  // of the `.grid` container, which is the <li> — not the <a>/<div> nested
  // inside it, even though that inner element is what looks like "the tile."
  const liClass = `t-${tile.size}`;
  const innerClasses = [tile.className, 'tile'].filter(Boolean).join(' ');
  const treatmentClass = tile.treatment === 'wash' ? ' tile-wash' : tile.treatment === 'solid' ? ' tile-solid' : '';
  const finalClass = `${innerClasses}${treatmentClass}`;

  if (tile.imageOnly) {
    return `<li class="${liClass}"><div class="${finalClass}">${tile.bg}</div></li>`;
  }

  const chip = tile.chipColor
    ? `<span class="tile-chip" style="--chip-color:${tile.chipColor}">${tile.icon}</span>`
    : '';
  const arrow = `<span class="tile-arrow">${icons.arrow}</span>`;
  const text = `<span class="tile-text"><span class="tile-title">${escapeHtml(tile.title)}</span><span class="tile-meta">${escapeHtml(tile.meta)}</span></span>`;
  const bg = tile.bg ?? '';
  const downloadAttr = tile.download ? ' download' : '';

  return `<li class="${liClass}"><a class="${finalClass}" href="${escapeHtml(tile.href)}"${downloadAttr} rel="noopener noreferrer" aria-label="${escapeHtml(tile.ariaLabel)}">${bg}${chip}${arrow}${text}</a></li>`;
}

function renderHead(member, site) {
  const description = member.bio || `${member.role}, ${member.club ?? ''}, ${site.title} at ${site.org}`.replace(/, ,/g, ',');
  const pageUrl = `${site.baseUrl}/${member.slug}/`;
  const ogImage = member.photo ? `\n<meta property="og:image" content="${site.baseUrl}/assets/photos/${member.photo}">` : '';

  return `<title>${escapeHtml(member.name)} — ${escapeHtml(member.role)}, ${escapeHtml(site.title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${escapeHtml(pageUrl)}">
<meta property="og:type" content="profile">
<meta property="og:title" content="${escapeHtml(member.name)}">
<meta property="og:description" content="${escapeHtml(description)}">${ogImage}
<meta property="og:url" content="${escapeHtml(pageUrl)}">
<meta name="theme-color" content="#F4F2ED" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E0F" media="(prefers-color-scheme: dark)">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif&display=swap" rel="stylesheet">`;
}

export function renderMemberPage(member, site, css) {
  const anchor = buildAnchorTile(member);
  const postAnchor = buildPostAnchorTiles(member, site);
  assertPacking(postAnchor);

  const anchorHtml = renderTile(anchor);
  const tilesHtml = postAnchor.map(renderTile).join('');

  const bioHtml = member.bio ? `<p class="bio">${escapeHtml(member.bio)}</p>` : '';
  const roleLine = [member.role, member.club].filter(Boolean).join(' · ');

  // The club photo is the page's own backdrop, not a decoration layered on
  // top of the default surface — the scallop/blob flourishes exist to give
  // the flat accent wash some life, which a real photo doesn't need.
  const clubBg = clubBackgroundUrl(member);
  const bodyClass = clubBg ? ' class="has-club-bg"' : '';
  const bodyStyle = `--primary:${escapeHtml(member.accent)};--primary-foreground:${escapeHtml(member.primaryForeground)}${clubBg ? `;--club-bg:url('${clubBg}')` : ''}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${renderHead(member, site)}
<style>${css}</style>
</head>
<body data-surface="${escapeHtml(member.surface)}"${bodyClass} style="${bodyStyle}">
<div class="page">
${clubBg ? '' : renderDoodle()}
<div class="rail rail-center">
<div class="avatar">${avatarMarkup(member)}</div>
<h1 class="name">${escapeHtml(member.name)}</h1>
<p class="role-line">${escapeHtml(roleLine)}</p>
${bioHtml}
</div>
<ul class="grid">
${anchorHtml}
${tilesHtml}
</ul>
</div>
</body>
</html>
`;

  return html;
}

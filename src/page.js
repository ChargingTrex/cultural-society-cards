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

// Club identity, not individual accent, drives the avatar backdrop for
// clubs with a defined theme (small, pre-cropped 50:85 JPEGs in
// assets/clubs/ — see project-meta/DECISIONS.md D18). Any club without an
// entry here just keeps the existing per-member accent gradient.
const CLUB_BACKGROUNDS = {
  'Cultural Society': 'cultural-society.jpg',
  Media: 'media.jpg',
  'Student Council': 'student-council.jpg',
};

export function avatarMarkup(member, { fullBleed = false, assetsPath = '../assets/' } = {}) {
  if (member.photo) {
    return `<img class="${fullBleed ? 'tile-bg' : 'avatar-img'}" src="${assetsPath}photos/${escapeHtml(member.photo)}" alt="" />`;
  }
  const clubBg = CLUB_BACKGROUNDS[member.club];
  if (clubBg) {
    const cls = fullBleed ? 'avatar-fallback avatar-fallback--tile avatar-club' : 'avatar-fallback avatar-club';
    return `<div class="${cls}" style="background-image:url('${assetsPath}clubs/${clubBg}')"><span>${escapeHtml(initials(member.name))}</span></div>`;
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

function countBlocks(tiles) {
  let count = 0;
  let i = 0;
  while (i < tiles.length) {
    if (tiles[i].size === 'sm') {
      count += 1;
      i += 2;
    } else {
      count += 1;
      i += 1;
    }
  }
  return count;
}

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

  // DESIGN-SYSTEM.md §6.5's own reference table has even/odd backwards
  // relative to its worked example and to §6.4's base-case diagram — both of
  // which this formula matches. See DECISIONS.md D12.
  const blocksAfterEmail = countBlocks(paired);
  const societySize = blocksAfterEmail % 2 === 1 ? 'wide' : 'full';

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

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
${renderHead(member, site)}
<style>${css}</style>
</head>
<body data-surface="${escapeHtml(member.surface)}" style="--primary:${escapeHtml(member.accent)};--primary-foreground:${escapeHtml(member.primaryForeground)}">
<div class="page">
${renderDoodle()}
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

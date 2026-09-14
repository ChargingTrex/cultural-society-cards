import { existsSync } from 'node:fs';
import { join } from 'node:path';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const SLUG_RE = /^[a-z0-9-]+$/;
const INK_DARK = '#14120F';
const INK_LIGHT = '#FFFFFF';

function relativeLuminance(hex) {
  const channels = [0, 1, 2].map((i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255);
  const linear = channels.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

// DESIGN-SYSTEM.md's own threshold (lum > 0.45 -> dark ink) picks the wrong
// ink for at least one seed accent: #E4572E scores 3.69:1 with white text but
// 5.07:1 with dark text. Picking whichever ink actually wins is what the
// "must stay legible" requirement means; see DECISIONS.md D12.
function pickForeground(accent) {
  const onDark = contrastRatio(accent, INK_DARK);
  const onLight = contrastRatio(accent, INK_LIGHT);
  return onDark >= onLight
    ? { ink: INK_DARK, contrast: onDark }
    : { ink: INK_LIGHT, contrast: onLight };
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

function hasAnyContactMethod(member) {
  return (
    !isEmpty(member.instagram) ||
    !isEmpty(member.phone) ||
    !isEmpty(member.whatsapp) ||
    !isEmpty(member.email) ||
    !isEmpty(member.linkedin) ||
    (member.links ?? []).length > 0
  );
}

export function validateMembers(data, { photosDir }) {
  const errors = [];
  const warnings = [];
  const seenSlugs = new Set();

  if (isEmpty(data?.site?.accent) || !HEX_RE.test(data.site.accent)) {
    errors.push(`site.accent must be a #RRGGBB hex value, got "${data?.site?.accent}"`);
  }

  for (const member of data.members ?? []) {
    const name = member.name || `member with slug "${member.slug}"`;

    if (isEmpty(member.slug)) {
      errors.push(`${name}: missing slug`);
    } else if (!SLUG_RE.test(member.slug)) {
      errors.push(`${name}: slug "${member.slug}" must match ^[a-z0-9-]+$`);
    } else if (seenSlugs.has(member.slug)) {
      errors.push(`${name}: duplicate slug "${member.slug}"`);
    } else {
      seenSlugs.add(member.slug);
    }

    if (isEmpty(member.name)) errors.push(`${name}: missing name`);
    if (isEmpty(member.role)) errors.push(`${name}: missing role`);

    const accent = isEmpty(member.accent) ? data.site.accent : member.accent;
    if (!isEmpty(accent) && !HEX_RE.test(accent)) {
      errors.push(`${name}: accent "${accent}" is not a valid #RRGGBB hex value`);
    } else if (!isEmpty(accent)) {
      const { contrast } = pickForeground(accent);
      if (contrast < 4.5) {
        errors.push(
          `${name}: accent "${accent}" reaches only ${contrast.toFixed(2)}:1 against either ink (needs 4.5:1 against at least one)`,
        );
      }
    }

    if (!isEmpty(member.photo) && !existsSync(join(photosDir, member.photo))) {
      errors.push(`${name}: photo "${member.photo}" not found in assets/profilepic/`);
    }

    for (const link of member.links ?? []) {
      const size = link.size ?? 'sm';
      if (size !== 'sm' && size !== 'wide') {
        errors.push(`${name}: custom link "${link.label}" has size "${size}", must be "sm" or "wide"`);
      }
    }

    if (!isEmpty(member.bio) && member.bio.length > 180) {
      warnings.push(`${name}: bio is ${member.bio.length} chars, over the 180-char guideline (not truncated)`);
    }

    if (!hasAnyContactMethod(member)) {
      warnings.push(`${name}: has no contact method at all`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`members.json validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  return { warnings };
}

export { pickForeground, contrastRatio, relativeLuminance, isEmpty, INK_DARK, INK_LIGHT };

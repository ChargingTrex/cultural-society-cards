// Original decorative artwork for the frosted surface: a couple of soft
// organic blobs (fill, low opacity) sitting under the existing scalloped
// line flourishes, all tinted by the member's own accent (currentColor is
// avoided in favor of an explicit CSS var so both layers share one hue) —
// inline SVG, no image asset, no separate request.

// Smooth-blob-from-points trick: connect N points around a circle with
// quadratic curves whose control point is the point itself and whose
// endpoint is the midpoint to the next point. Any set of points comes out
// as a smooth closed shape with no hand-tuned bezier handles.
function blobPath(radii, size) {
  const cx = size / 2;
  const cy = size / 2;
  const points = radii.map((r, i) => {
    const angle = (i / radii.length) * Math.PI * 2;
    return [cx + Math.cos(angle) * r * cx, cy + Math.sin(angle) * r * cy];
  });
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  const start = mid(points[points.length - 1], points[0]);
  let d = `M${start[0].toFixed(1)} ${start[1].toFixed(1)}`;
  for (let i = 0; i < points.length; i += 1) {
    const next = points[(i + 1) % points.length];
    const m = mid(points[i], next);
    d += ` Q${points[i][0].toFixed(1)} ${points[i][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return `${d} Z`;
}

function blob(radii, size, className) {
  return `<svg class="blob ${className}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false"><path d="${blobPath(radii, size)}"/></svg>`;
}

function scallopStrip(bumps, radius) {
  let d = `M0 ${radius}`;
  for (let i = 0; i < bumps; i += 1) {
    d += ` a ${radius} ${radius} 0 0 1 ${radius * 2} 0`;
  }
  return d;
}

function flourish(bumps, radius, className) {
  const width = bumps * radius * 2;
  const height = radius * 2;
  return `<svg class="doodle ${className}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false"><path d="${scallopStrip(bumps, radius)}"/></svg>`;
}

// Fixed, hand-picked radius sequences (not randomized — this runs at build
// time for every member alike, so "deterministic and pleasant" beats
// "different every build").
const BLOB_TOP = [1, 0.78, 1.1, 0.7, 1.15, 0.8, 1.05, 0.85];
const BLOB_BOTTOM = [0.85, 1.1, 0.75, 1.2, 0.8, 1.05, 0.7, 1.12];

export function renderDoodle() {
  return (
    blob(BLOB_TOP, 240, 'blob-top') +
    blob(BLOB_BOTTOM, 260, 'blob-bottom') +
    flourish(4, 22, 'doodle-top') +
    flourish(5, 26, 'doodle-bottom')
  );
}

// Same motif, used as a prominent (not-just-corner-wash) accent tucked
// behind the rail avatar. Tinted by var(--primary), which by now resolves
// to the member's committee color, not an individual one.
const BLOB_AVATAR = [0.9, 1.15, 0.8, 1.1, 0.75, 1.2, 0.85, 1];

export function renderAvatarAccent() {
  return blob(BLOB_AVATAR, 200, 'blob-avatar');
}

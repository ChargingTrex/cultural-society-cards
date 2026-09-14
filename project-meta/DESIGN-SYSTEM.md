# Mosaic — Design System

A bento-style design system for single-person profile pages, built for
**Sai University Cultural Society** member cards.

**Reference:** [`limegreen-studio/bento.you`](https://github.com/limegreen-studio/bento.you)
(Next.js + Tailwind + shadcn/ui, MIT, three themes: *Calm Frosted*, *Dither*,
*Shadcn White*) and the bento.me profile-rail layout it descends from.
This system borrows the **visual language and token contract**, not code or
brand assets. Token names deliberately match the shadcn convention so anything
written here drops straight into a bento.you fork if we ever go that way.

> **Context for whoever implements this:** every page is reached by scanning a
> QR code on a printed ID card. The reader is **on a phone, outdoors, on mobile
> data, for about ten seconds**. Mobile is the primary layout, not the fallback.
> Desktop is a courtesy.

---

## 1. Principles

1. **One anchor per page.** Exactly one 2×2 tile. If every tile is the same size
   you no longer have a bento grid, you have a card list.
2. **The tile is the button.** The whole tile is the tap target — never a small
   link inside a large box.
3. **DOM order = visual order = focus order.** Never `grid-auto-flow: dense`.
   The spans in §6 are chosen so the grid fills perfectly without it.
4. **Above the fold is the answer.** Name, role and the primary action must be
   visible at 375 × 667 with no scrolling.
5. **One gutter value everywhere.**
6. **The accent is data.** Each member supplies one hex; the page tints from it.
   Nothing else in the palette moves.

---

## 2. Tokens

shadcn-compatible names, warm-neutral values. Everything is defined on `:root`;
dark mode overrides only what changes.

### 2.1 Light (base)

```css
:root {
  /* Surfaces */
  --background:        #F4F2ED;   /* page canvas        */
  --card:              #FFFFFF;   /* tile surface       */
  --popover:           #FFFFFF;

  /* Text */
  --foreground:        #14120F;   /* primary            */
  --card-foreground:   #14120F;
  --muted-foreground:  #6E6862;   /* meta, captions     */
  --subtle-foreground: #A8A29B;   /* placeholder        */

  /* Lines */
  --border:            #E4E0D9;
  --ring:              var(--primary);

  /* Per-member accent — set inline: <body style="--primary:#E4572E"> */
  --primary:            #E4572E;
  --primary-foreground: #FFFFFF;                                /* see §2.4 */
  --primary-wash: color-mix(in oklab, var(--primary) 10%, var(--card));
  --primary-edge: color-mix(in oklab, var(--primary) 24%, var(--card));

  /* Elevation */
  --shadow-rest:  0 1px 2px rgb(20 18 15 / .04), 0 4px 12px rgb(20 18 15 / .06);
  --shadow-hover: 0 2px 4px rgb(20 18 15 / .05), 0 12px 28px rgb(20 18 15 / .10);

  --radius: 24px;
}
```

### 2.2 Dark

Dark tiles drop shadows entirely — a shadow on a dark canvas is invisible and
only muddies the edge. A hairline does the separation instead.

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --background:        #0E0E0F;
    --card:              #18181A;
    --popover:           #18181A;

    --foreground:        #F2F0EC;
    --card-foreground:   #F2F0EC;
    --muted-foreground:  #9A948D;
    --subtle-foreground: #6B655E;

    --border:            rgb(255 255 255 / .10);

    --primary-wash: color-mix(in oklab, var(--primary) 18%, var(--card));
    --primary-edge: color-mix(in oklab, var(--primary) 34%, var(--card));

    --shadow-rest:  none;
    --shadow-hover: none;
  }
}
```

Mirror both blocks under `:root[data-theme="dark"]` and `:root[data-theme="light"]`
if a manual toggle is ever added, so the toggle beats the OS in both directions.
Emit `<meta name="theme-color">` twice, once per scheme.

### 2.3 Platform colors

Used **only** on the icon chip of a tile. Never as a tile background, never as
text color.

| Purpose   | Token           | Value            |
|-----------|-----------------|------------------|
| Instagram | `--c-instagram` | `#E1306C`        |
| WhatsApp  | `--c-whatsapp`  | `#25D366`        |
| LinkedIn  | `--c-linkedin`  | `#0A66C2`        |
| Phone     | `--c-phone`     | `var(--foreground)` |
| Email     | `--c-email`     | `var(--primary)` |
| Generic   | `--c-link`      | `var(--muted-foreground)` |

Chip recipe: `background: color-mix(in oklab, <platform> 14%, transparent)` with
the glyph at full strength. Raise the mix to 22% in dark mode.

### 2.4 Accent contrast guard — a build-time rule, not a CSS one

Members supply arbitrary hex. Text on top of it must stay legible, so the build
script decides the ink rather than trusting the data:

```js
const lum = hex => {
  const c = [0, 1, 2]
    .map(i => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const primaryForeground = lum(accent) > 0.45 ? '#14120F' : '#FFFFFF';
```

Emit `--primary` and `--primary-foreground` together on `<body>`. If the accent
reaches 4.5:1 against **neither** ink, fail the build with a named error. That
member's data is wrong, and failing loudly beats shipping an unreadable card.

---

## 3. Surface themes

bento.you ships three. We ship the same three ideas as one attribute on `<body>`,
so a member — or the society, for a season — can switch look without touching
layout. **Default: `frosted`.**

```html
<body data-surface="frosted" style="--primary:#E4572E;--primary-foreground:#fff">
```

### `frosted` — default (≈ Calm Frosted)

Translucent tiles over a soft accent-derived mesh. Warm, modern, and it makes
each member's page feel personal from one hex.

```css
[data-surface="frosted"] {
  background:
    radial-gradient(70% 55% at 12% 0%,
      color-mix(in srgb, var(--primary) 24%, transparent), transparent 70%),
    radial-gradient(60% 50% at 92% 18%,
      color-mix(in srgb, var(--primary) 14%, transparent), transparent 70%),
    var(--background);
  background-repeat: no-repeat;
}
[data-surface="frosted"] .tile {
  background: color-mix(in srgb, var(--card) 74%, transparent);
  backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid color-mix(in srgb, var(--card) 55%, transparent);
  box-shadow: var(--shadow-rest);
}
@supports not (backdrop-filter: blur(1px)) {
  [data-surface="frosted"] .tile { background: var(--card); }
}
```

Two guard rails: keep tile opacity at **74%, not 40%** — glassier looks better in
a screenshot and fails contrast on a real phone in sunlight. And cap the blur at
16px; `backdrop-filter` across a dozen tiles is the one thing on this page that
can stutter on a budget Android.

### `paper` (≈ Shadcn White)

Solid `--card`, `--shadow-rest`, no blur, flat `--background`. The safe default
for print-adjacent contexts and the fastest to render.

### `dither`

Flat `--card`, **no shadow**, hard `1px solid var(--border)`, `--radius: 16px`,
and a 4% noise overlay via a tiny inline SVG `feTurbulence` data-URI. Meta text
switches to `ui-monospace`. Use sparingly — it is a personality theme.

---

## 4. Typography

```css
:root {
  --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
               Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

Google Fonts with `preconnect` + `display=swap`. Four cuts total — Inter
400/500/600, Instrument Serif 400. Nothing more; this loads on mobile data.

| Token | Role | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| `--t-display` | Member name | `clamp(2rem, 7vw, 2.6rem)` / 1.05 | 400 serif | `-0.02em` |
| `--t-lead` | Bio, anchor-tile title | `1.0625rem` / 1.55 | 400 | `0` |
| `--t-title` | Tile title | `0.9375rem` / 1.3 | 600 | `-0.005em` |
| `--t-body` | Tile body | `0.875rem` / 1.45 | 400 | `0` |
| `--t-meta` | Handle, number, URL | `0.8125rem` / 1.3 | 400 | `0` |
| `--t-label` | Role eyebrow | `0.75rem` / 1 | 600 | `0.07em` uppercase |

- The serif is for **the member's name and nothing else**. It is the one moment
  of personality on the page; spending it twice spends it.
- `--t-meta` is always `--muted-foreground`.
- Centre only the name block, and only on mobile. Never centre body text.
- Bio caps at ~180 characters — warn at build time, never silently truncate.

---

## 5. Spacing, radius, sizing

```css
:root {
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px;
  --s-5:20px; --s-6:24px; --s-8:32px; --s-10:40px; --s-12:48px;

  --gap: 12px;        /* grid gutter, mobile */
  --tile-pad: 16px;

  --radius: 24px;     /* below 16px it reads as a plain card grid */
  --radius-inner: 14px;
  --radius-chip: 12px;

  --chip: 40px;
  --avatar: 88px;
}

@media (min-width: 640px) {
  :root { --gap: 16px; --tile-pad: 20px; --avatar: 104px; }
}
```

Minimum tap target **44 × 44px**. Every tile clears this by construction — check
any inline link you nest inside one.

---

## 6. The grid

### 6.1 Page shell

```css
.page {
  max-width: min(1080px, 100% - 32px);
  margin-inline: auto;
  padding-block: var(--s-8) var(--s-12);
}

@media (min-width: 960px) {
  .page {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: var(--s-8);
    align-items: start;
    padding-block: var(--s-12);
  }
  .rail { position: sticky; top: var(--s-12); }
}
```

Below 960px the rail is simply the first block in the stack — avatar, name,
role, bio — then the grid.

### 6.2 Tile grid

```css
.grid {
  display: grid;
  gap: var(--gap);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(150px, auto);
  /* NO grid-auto-flow: dense — it decouples focus order from visual order,
     and every tile here is a link. */
}

@media (min-width: 640px) {
  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-auto-rows: 168px; }
}
```

`minmax(0, 1fr)` rather than `1fr` — without it a long email address blows the
column out.

### 6.3 Size classes

| Class | Span | Mobile (2 col) | Desktop (4 col) |
|---|---|---|---|
| `.t-sm` | 1×1 | half | quarter |
| `.t-wide` | 2×1 | full | half |
| `.t-tall` | 1×2 | half, double height | quarter, double height |
| `.t-lg` | 2×2 | full, double height | half, double height |

```css
.t-wide { grid-column: span 2; }
.t-tall { grid-row: span 2; }
.t-lg   { grid-column: span 2; grid-row: span 2; }
```

These need no per-breakpoint overrides: `span 2` is half of four columns and all
of two. That is the whole trick.

### 6.4 Canonical tile order

DOM order for a member page, chosen so the grid fills with **no holes at either
breakpoint and no dense flow**:

| # | Tile | Size |
|---|---|---|
| 1 | Instagram (anchor) | `t-lg` |
| 2 | Save contact | `t-wide` |
| 3 | Email | `t-wide` |
| 4 | Call | `t-sm` |
| 5 | WhatsApp | `t-sm` |
| … | Optional extra links | `t-sm`, **always in pairs** |
| last | Society tile | `t-wide` or `t-full` — see below |

Desktop result (4 columns):

```
┌───────────────┬───────────────┐
│               │ Save contact  │  row 1
│   Instagram   ├───────────────┤
│    (2 × 2)    │     Email     │  row 2
├───────┬───────┼───────────────┤
│ Call  │ WhatsA│    Society    │  row 3
└───────┴───────┴───────────────┘
```

Mobile (2 columns) stacks the same list: Instagram full-width and double height,
then Save, then Email, then Call + WhatsApp side by side, then Society.

### 6.5 Two invariants that keep the grid hole-free

Members have different numbers of links, so the tile list is not fixed. Two rules
keep every layout closing cleanly without falling back to `dense`.

**Invariant 1 — exactly one `t-lg` per page.** Normally Instagram. If a member
has no Instagram, promote their photo to a `t-lg` image tile. Never ship a page
with no anchor, and never one with two.

**Invariant 2 — everything after the anchor is a 2-column block.**

Think of the tiles after the anchor as blocks of two columns:

- a `t-wide` tile is one block;
- two `t-sm` tiles side by side are one block.

So the build pairs `t-sm` tiles, and **promotes any unpaired `t-sm` to `t-wide`**.
That alone guarantees mobile never has a hole: at two columns, one block is
exactly one row.

Desktop has four columns, so a row is *two* blocks. Count the blocks after Email
(the Call/WhatsApp pair counts as one). If that count is **odd**, the Society
tile takes the whole row instead of half:

```css
.t-full { grid-column: 1 / -1; }
```

| Blocks after Email | Society tile | Last desktop row |
|---|---|---|
| even | `t-wide` | Society sits beside the preceding block |
| odd | `t-full` | Society fills the row on its own |

Worked example — a member with LinkedIn: blocks are `[Call+WhatsApp]`,
`[LinkedIn→promoted to wide]`, `[Society]` = 3, odd, so Society gets `t-full`.
Row 3 is the pair plus LinkedIn; row 4 is Society across all four columns. No
hole at either breakpoint.

---

## 7. Tile anatomy

```
┌─────────────────────────────┐
│ ◉ chip 40px            ↗    │  chip top-left, arrow top-right
│                             │
│                             │
│ Title              t-title  │  bottom-aligned
│ meta               t-meta   │
└─────────────────────────────┘
```

```css
.tile {
  border-radius: var(--radius);
  padding: var(--tile-pad);
  overflow: hidden;                    /* clips media to the radius */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: transform var(--dur) var(--ease),
              box-shadow var(--dur) var(--ease);
}
```

The `↗` is `opacity: 0` at rest, `.4` on hover/focus, and `aria-hidden="true"`.

Icons: inline SVG, 20 × 20, `stroke-width: 1.75`, `stroke: currentColor`, Lucide
paths (MIT) pasted in. **Do not load an icon library** — that is a network
request on a page whose only job is to open instantly.

### Surface treatments — three, and only three

| Treatment | Use | Style |
|---|---|---|
| **Plain** | most tiles | the active `data-surface` recipe |
| **Wash** | passive info (Society tile) | `--primary-wash`, `1px solid var(--primary-edge)`, no shadow |
| **Solid** | the one primary action | `background: var(--primary)`, text `--primary-foreground` |

Exactly one Solid tile per page: **Save contact**.

### Per type

| Type | Title | Meta | Chip | Treatment |
|---|---|---|---|---|
| Instagram | "Instagram" | `@handle` | `--c-instagram` | Plain |
| Call | "Call" | formatted number | `--c-phone` | Plain |
| Email | "Email" | address (may wrap to 2 lines) | `--c-email` | Plain |
| WhatsApp | "WhatsApp" | "Message" | `--c-whatsapp` | Plain |
| Save contact | "Save contact" | "Add to phone" | — | **Solid** |
| Society | club name | "Sai University" | society mark | **Wash** |
| Image | — | — | — | full-bleed `<img>`, `object-fit: cover` |

The anchor tile at `t-lg` gets extra weight: chip scales to 52px, title uses
`--t-lead`, handle sits directly under it. If a photo is available it fills the
tile with a bottom scrim —
`linear-gradient(to top, rgb(0 0 0 / .55), transparent 60%)` — and white text.
**The scrim is mandatory whenever text sits on imagery.**

---

## 8. The rail

```
avatar 88 → 104px, --radius-inner, 1px inset hairline
NAME                     --t-display, serif
ROLE · CLUB              --t-label, --muted-foreground
bio                      --t-lead, ≤180 chars
```

Avatar fallback when no photo exists — generate as **inline SVG at build time**,
no runtime JS, no placeholder service:

```
rounded square, linear-gradient(135deg,
  var(--primary), color-mix(in oklab, var(--primary) 55%, #000))
+ initials in --primary-foreground at --t-display
```

---

## 9. Motion

```css
:root { --ease: cubic-bezier(.2,.8,.2,1); --dur: 180ms; }

.tile:hover  { transform: translateY(-2px); box-shadow: var(--shadow-hover); }
.tile:active { transform: scale(.985); transition-duration: 90ms; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
  }
}
```

Optional entrance: tiles fade and rise 8px, staggered 30ms, under 400ms total,
skipped entirely under reduced motion. Nothing else moves. No parallax, no
scroll-triggered animation — the page is open for eleven seconds.

---

## 10. Focus & accessibility

```css
:where(a, button):focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 3px;
  border-radius: var(--radius);
}
```

Non-negotiable:

- **Accessible names stand alone.** `aria-label="Call Arun on +91 99405 27740"`,
  not "Call". A screen-reader user tabbing the grid hears a list of links out of
  context.
- ≥ 4.5:1 body, ≥ 3:1 large text, in **both** schemes and **all three** surface
  themes. Frosted is the one that slips — check it.
- No dense flow (§6.2).
- Scrim on any text over imagery (§7).
- `<html lang="en">`, one `<h1>` (the member's name), tiles are `<a>` inside
  `<ul>`/`<li>` so the count is announced.
- Honour `prefers-reduced-motion` and `prefers-color-scheme`.

---

## 11. Performance budget

Opened from a camera, on mobile data, once.

| Budget | Target |
|---|---|
| HTML with CSS inlined | ≤ 20 KB uncompressed |
| Avatar | ≤ 60 KB, 208px wide (2× of 104) |
| Requests | ≤ 4 — document, 2 font files, 1 image |
| JavaScript | **0 bytes** |

Inline the whole stylesheet into every page. At this size a separate
`styles.css` costs a round trip and saves nothing.

---

## 12. Quick reference

```
background #F4F2ED · card #FFFFFF · fg #14120F · muted #6E6862 · border #E4E0D9
radius 24 tile / 14 inner · gap 12 → 16 · pad 16 → 20
grid 2 col → 4 col at 640 · rows 150 → 168 · rail 320px sticky at 960
sm 1×1 · wide 2×1 · tall 1×2 · lg 2×2 — exactly one lg per page
surfaces: frosted (default) · paper · dither
serif for the name only · everything else Inter
motion 180ms cubic-bezier(.2,.8,.2,1) · hover -2px · active .985
zero JS · zero icon libraries · never dense flow
```

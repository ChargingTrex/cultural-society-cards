# Build Spec — Cultural Society Member Cards

**Feed this file to Claude Code.** It is written to be decision-complete: every
choice that could stall you is already made. Where something is genuinely open,
it says so and gives a default.

Companion document: **`DESIGN-SYSTEM.md`** — read it before writing any CSS. This
file owns *what* gets built; that file owns *how it looks*.

---

## Kickoff prompt

> Read `BUILD-SPEC.md` and `DESIGN-SYSTEM.md` in this repo, then implement the
> whole thing. Start by scaffolding the repo structure in §4, then `members.json`,
> then `build.js`, then the page template and CSS. Run the build and show me the
> generated HTML for `arun` before moving on to the QR script and the deploy
> workflow. Work through the acceptance checklist in §13 at the end.

---

## 1. What this is

Every member of the Sai University Cultural Society committee has a QR code
printed on their ID card. Scanning it opens a single web page for that person —
photo, name, role, club, short bio, and one-tap buttons for Instagram, phone,
WhatsApp, email, and "save to contacts".

Think Linktree, laid out as a bento grid. Hosted free on GitHub Pages.

**The whole site is generated from one JSON file.** Next year's committee should
be able to hand over by editing that file in GitHub's web UI — no local setup, no
build knowledge, no design decisions.

---

## 2. The reference, and why we are not forking it

The visual reference is [`limegreen-studio/bento.you`](https://github.com/limegreen-studio/bento.you)
— Next.js + Tailwind + shadcn/ui, MIT licensed, with a drag-and-drop bento
builder and three themes. `DESIGN-SYSTEM.md` takes its token contract and surface
themes so this work stays compatible with it.

**Build fresh; do not fork it.** The reasoning, so nobody relitigates it later:

| | bento.you fork | This spec |
|---|---|---|
| Hosting | Needs a Node server / Vercel for the builder + `.env` | Static files, GitHub Pages, free forever |
| Shape of the problem | One person, one page, arranged by hand | ~30 people, one page each, generated from one file |
| Handover | Successor learns Next.js, Tailwind, the builder, and redeploys | Successor edits ten lines of JSON in a browser |
| Dependency surface | Next.js + React + Tailwind + shadcn, patched forever | Zero runtime dependencies |
| Time to first byte | React hydration | Pre-rendered HTML with inlined CSS |

Drag-and-drop authoring is the right call when a page is a personal canvas. It is
the wrong call when thirty pages must stay visually consistent because they are
all printed on the same ID card batch.

If the society later wants per-member drag-and-drop, revisit then — `members.json`
is a clean migration source.

---

## 3. Hard constraints

1. **Static output only.** No server, no runtime data fetching, no framework.
2. **Zero runtime JavaScript** on member pages. The QR script's `qrcode`
   dependency is `devDependencies` only.
3. **Node 20+**, ES modules, plain `node:fs` and template literals. No bundler,
   no templating library, no CSS framework.
4. **Relative asset paths everywhere** — the site must work identically at
   `user.github.io/repo/`, at a user page, and on a custom domain.
5. **One data file** is the only thing a non-technical editor ever touches.
6. Never commit `dist/`. CI builds it.

---

## 4. Repo structure

```
cultural-society-cards/
├── members.json              ← the only file editors touch
├── build.js                  ← generates dist/
├── qr.js                     ← generates QR PNGs (run manually)
├── package.json
├── src/
│   ├── styles.css            ← inlined into every page at build time
│   ├── page.js               ← member page template
│   ├── index.js              ← directory page template
│   ├── icons.js              ← inline SVG path strings
│   └── vcard.js              ← vCard 3.0 serialiser
├── assets/
│   └── photos/               ← <slug>.jpg, committed to the repo
├── qr/                       ← generated PNGs, gitignored
├── dist/                     ← generated site, gitignored
├── .github/workflows/deploy.yml
├── .gitignore
└── README.md                 ← handover guide, see §12
```

`package.json` scripts:

```json
{
  "type": "module",
  "scripts": {
    "build": "node build.js",
    "qr": "node qr.js",
    "serve": "node build.js && npx --yes serve dist"
  },
  "devDependencies": { "qrcode": "^1.5.4" }
}
```

---

## 5. Data model — `members.json`

One object, two keys.

```jsonc
{
  "site": {
    "title": "Cultural Society",
    "org": "Sai University",
    "baseUrl": "https://<github-username>.github.io/cultural-society-cards",
    "surface": "frosted",          // "frosted" | "paper" | "dither"
    "accent": "#E4572E"            // society default, per-member override wins
  },
  "members": [ /* … */ ]
}
```

### Member fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `slug` | string | ✅ | URL segment. Lowercase, `a–z0–9-`, **keep it short** (see §9). |
| `name` | string | ✅ | Full display name. |
| `role` | string | ✅ | Committee position. |
| `club` | string | — | Club or department. |
| `batch` | string | — | e.g. `SCDS '28`. |
| `bio` | string | — | ≤180 chars. Warn above that; never truncate silently. |
| `photo` | string | — | Filename in `assets/photos/`, or a full URL. Omit → generated initials avatar. |
| `accent` | string | — | `#RRGGBB`. Falls back to `site.accent`. |
| `surface` | string | — | Overrides `site.surface`. |
| `instagram` | string | — | Handle **without** `@`. |
| `phone` | string | — | E.164 with spaces for display: `+91 99405 27740`. |
| `whatsapp` | string | — | Digits only, country code, no `+`. Defaults to `phone` stripped. |
| `email` | string | — | |
| `linkedin` | string | — | Full URL. |
| `links` | array | — | `[{ "label": "Portfolio", "url": "…", "size": "sm" }]` |

**Validation is part of the build.** Fail loudly, naming the member, on: missing
`slug`/`name`/`role`; duplicate `slug`; a `slug` that is not `^[a-z0-9-]+$`; a
malformed `accent`; an accent that fails contrast against both inks
(`DESIGN-SYSTEM.md` §2.4); a `photo` that does not exist on disk. Warn — do not
fail — on a bio over 180 chars or a member with no contact method at all.

### Seed data

Two real members, plus two clearly-marked placeholders so the layout can be seen
populated. **Roles are guesses — the society must confirm them before print.**

```json
{
  "site": {
    "title": "Cultural Society",
    "org": "Sai University",
    "baseUrl": "https://CHANGEME.github.io/cultural-society-cards",
    "surface": "frosted",
    "accent": "#E4572E"
  },
  "members": [
    {
      "slug": "arun",
      "name": "Arun S",
      "role": "Committee Member",
      "club": "Cultural Society",
      "batch": "SCDS '28",
      "accent": "#E4572E",
      "bio": "",
      "photo": "",
      "instagram": "whatnot.arun",
      "phone": "+91 99405 27740",
      "whatsapp": "919940527740",
      "email": "arun.s-28@scds.saiuniversity.edu.in"
    },
    {
      "slug": "amarnath",
      "name": "Amarnath Reddy S",
      "role": "Committee Member",
      "club": "Cultural Society",
      "batch": "SCDS '29",
      "accent": "#2E6BE4",
      "bio": "",
      "photo": "",
      "instagram": "amarnath_1564",
      "phone": "+91 81850 81851",
      "whatsapp": "918185081851",
      "email": "amarnathreddy.s-29@scds.saiuniversity.edu.in"
    },
    {
      "slug": "sample-one",
      "name": "Priya Placeholder",
      "role": "Events Lead",
      "club": "Dance Club",
      "batch": "SCDS '27",
      "accent": "#1E9E6A",
      "bio": "Sample entry — delete before launch. Shows how a filled-in bio sits in the rail.",
      "instagram": "sample.handle",
      "phone": "+91 90000 00000",
      "whatsapp": "919000000000",
      "email": "sample.one@scds.saiuniversity.edu.in",
      "links": [{ "label": "Portfolio", "url": "https://example.com", "size": "sm" }]
    },
    {
      "slug": "sample-two",
      "name": "Karthik Placeholder",
      "role": "Design Lead",
      "club": "Fine Arts Club",
      "batch": "SCDS '28",
      "accent": "#7B4BE4",
      "bio": "Sample entry — delete before launch. This one has no Instagram, to prove the anchor-tile fallback works.",
      "phone": "+91 90000 00001",
      "email": "sample.two@scds.saiuniversity.edu.in"
    }
  ]
}
```

`sample-two` deliberately has no Instagram — it exercises the "promote the photo
to the anchor tile" rule in `DESIGN-SYSTEM.md` §6.4. Keep it until that path is
verified.

---

## 6. `build.js`

Synchronous, single pass, idempotent. Deletes and recreates `dist/`.

1. Read and validate `members.json` (§5).
2. Read `src/styles.css` once.
3. For each member, resolve: `accent` → `site.accent`; `surface` → `site.surface`;
   `whatsapp` → digits of `phone`; `primaryForeground` via the luminance rule.
4. Write per member:
   - `dist/<slug>/index.html`
   - `dist/<slug>/contact.vcf`
5. Write `dist/index.html` (§8), `dist/.nojekyll`, and `dist/CNAME` if
   `site.cname` is set.
6. Copy `assets/` → `dist/assets/`.
7. Print a summary: member count, output paths, every warning, and each member's
   final URL.

### Page composition

Follow `DESIGN-SYSTEM.md` §6.4 exactly. Tiles are emitted **only when the data
exists** — no empty tiles, no "coming soon".

| Tile | Emitted when | Size | `href` |
|---|---|---|---|
| Instagram | `instagram` | `t-lg` | `https://instagram.com/<handle>` |
| Photo (anchor fallback) | no `instagram` | `t-lg` | none — `<div>`, not `<a>` |
| Save contact | always | `t-wide` | `contact.vcf` |
| Email | `email` | `t-wide` | `mailto:` |
| Call | `phone` | `t-sm` | `tel:` with spaces stripped |
| WhatsApp | `whatsapp` | `t-sm` | `https://wa.me/<digits>` |
| LinkedIn | `linkedin` | `t-sm` | as given |
| Custom | each `links[]` entry | its `size`, default `t-sm` | as given |
| Society | always, last | `t-wide` or `t-full` — see below | `../` (the directory) |

### Packing pass — run this after assembling the tile list

The tile list varies per member, so a fixed layout would leave holes. Apply
`DESIGN-SYSTEM.md` §6.5 as two concrete steps:

1. **Pair the `t-sm` tiles** in DOM order. Promote any unpaired trailing `t-sm`
   to `t-wide`. Now every tile after the anchor is a two-column block.
2. **Count the blocks after the Email tile** — a `t-sm` pair counts as one. If
   that count is **odd**, give the Society tile `t-full` (`grid-column: 1 / -1`)
   instead of `t-wide`.

Then assert, and throw on failure:

- exactly one `t-lg` tile exists;
- no unpaired `t-sm` tiles remain;
- total column units after the anchor are divisible by 4.

These three assertions are what keep the grid hole-free as members gain and lose
links, without anyone re-checking the layout by eye.

All external links get `rel="noopener noreferrer"` and open in the same tab.
`tel:`, `mailto:` and the vCard must **not** get `target="_blank"` — it breaks the
handoff to the phone's dialler on iOS.

### `<head>` per page

```html
<title>{name} — {role}, {site.title}</title>
<meta name="description" content="{bio || `${role}, ${club}, ${site.title} at ${site.org}`}">
<link rel="canonical" href="{baseUrl}/{slug}/">
<meta property="og:type" content="profile">
<meta property="og:title" content="{name}">
<meta property="og:description" content="…">
<meta property="og:image" content="{baseUrl}/assets/photos/{photo}">
<meta property="og:url" content="{baseUrl}/{slug}/">
<meta name="theme-color" content="#F4F2ED" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E0F" media="(prefers-color-scheme: dark)">
<style>/* inlined src/styles.css */</style>
```

Plus `<meta name="viewport" content="width=device-width, initial-scale=1">` and
the Google Fonts `preconnect` pair.

---

## 7. vCard

Write `dist/<slug>/contact.vcf`, vCard **3.0** — best support across iOS and
Android contact apps.

```
BEGIN:VCARD
VERSION:3.0
N:{lastName};{firstName};;;
FN:{name}
ORG:{site.org};{club}
TITLE:{role}
TEL;TYPE=CELL:{phone, digits and + only}
EMAIL;TYPE=INTERNET:{email}
URL:{baseUrl}/{slug}/
X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/{handle}
NOTE:{site.title}, {site.org}
END:VCARD
```

Rules: CRLF line endings (`\r\n`) — some Android contact apps reject LF-only.
Escape `,`, `;` and `\` in values. Omit any line whose value is empty rather than
emitting a blank one. Split `name` on the last space for `N:`; if there is no
space, put everything in the given-name field.

Link it as `<a href="contact.vcf" download>`. Do **not** use a `data:` URI —
iOS Safari handles those inconsistently, and a real file lets iOS open its
contact-preview sheet.

---

## 8. Directory page

`dist/index.html` — the site root, and the `../` target of every Society tile.

Header with `site.title` and `site.org`. Then a responsive grid of member cards:
avatar, name, role, club. Each card links to `<slug>/`. Reuse the tile surface
and radius from the design system, but this page is a uniform card grid, not a
bento — it has no anchor tile and no per-member accent. Use `site.accent`
throughout.

Sort members by `role` seniority if a `site.roleOrder` array is present,
otherwise by the order they appear in `members.json`. Do not sort alphabetically
by default — committee lists have an intended order.

---

## 9. QR codes — `qr.js`

Run manually, not in CI. Reads `members.json`, writes `qr/<slug>.png`.

```js
QRCode.toFile(`qr/${slug}.png`, `${baseUrl}/${slug}/`, {
  errorCorrectionLevel: 'M',
  margin: 4,              // quiet zone, in modules — required, do not reduce
  width: 1024,            // print resolution
  color: { dark: '#000000FF', light: '#FFFFFFFF' }
});
```

Print rules, because this is the part that actually fails in the real world:

- **≥ 20 mm × 20 mm printed.** Below that, phone cameras struggle at arm's length.
- **Keep the 4-module quiet zone.** The commonest cause of an unscannable card is
  a designer cropping the white margin.
- **Pure black on pure white.** No accent-tinted QR, no gradient, no logo in the
  middle — error correction level M has no headroom for it.
- **Short URLs scan better.** Fewer characters → fewer modules → larger, more
  forgiving modules at the same printed size. This is why slugs are `arun`, not
  `arun-s-scds-2028`. If the society can get a short custom domain — say
  `culturals.saiuniversity.edu.in/arun` — set `site.cname` and regenerate; the
  QR gets meaningfully easier to scan.
- **Test the real print**, not the screen. Print one card, scan it from 30 cm in
  poor light, on both an iPhone and a budget Android.

Print a `qr/labels.txt` alongside: `slug → name → URL`, so whoever lays out the
cards can match codes to people without opening each PNG.

---

## 10. Deploy — GitHub Pages via Actions

Repo settings → Pages → Source: **GitHub Actions**.

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: node build.js
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

This is what makes handover work: a successor edits `members.json` in GitHub's
web editor, commits, and the site rebuilds itself. They never clone anything.

`.gitignore`: `dist/`, `qr/`, `node_modules/`.

---

## 11. Accessibility & performance

Enforced from `DESIGN-SYSTEM.md` §10–11. The ones the build script is responsible
for, rather than the CSS:

- Every tile `<a>` gets a standalone `aria-label`: *"Call Arun on +91 99405
  27740"*, *"Arun on Instagram, @whatnot.arun"*, *"Save Arun's contact details"*.
- `<html lang="en">`, exactly one `<h1>` per page (the member's name).
- Tiles live in a `<ul>`/`<li>` so the count is announced.
- Zero JavaScript in output. Assert it: the build should fail if `<script`
  appears in any generated page.
- Page HTML ≤ 20 KB with CSS inlined. Warn if it exceeds that.

---

## 12. `README.md` to generate

Written for a student successor, not a developer. Cover, in this order:

1. **Add a member** — edit `members.json`, copy an existing block, change the
   fields, commit. The site rebuilds in about a minute.
2. **Add their photo** — drop a square JPG in `assets/photos/`, named
   `<slug>.jpg`, at least 400 × 400. Set `photo` to that filename.
3. **Generate the QR codes** — `npm install`, then `npm run qr`, then the print
   rules from §9 restated in plain language.
4. **Run it locally** — `npm run serve`.
5. **When the committee changes** — remove old members, add new ones, regenerate
   QRs, reprint cards. Note that **deleting a member breaks any printed QR code
   pointing at them**, so retire a slug only when the cards are being reprinted.

That last warning matters more than it looks. Printed QR codes outlive the
committee that made them.

---

## 13. Acceptance checklist

Work through this before declaring done.

**Build**
- [ ] `node build.js` on a clean checkout produces `dist/` with no errors.
- [ ] Running it twice gives byte-identical output.
- [ ] Every member has `dist/<slug>/index.html` and `dist/<slug>/contact.vcf`.
- [ ] Validation fails loudly on a duplicate slug, a bad accent, and a missing photo.

**Page**
- [ ] Exactly one `t-lg` tile on every page, `sample-two` included.
- [ ] The grid has no holes at 375px, 768px and 1280px.
- [ ] Tab order matches visual order — no `dense` anywhere in the CSS.
- [ ] Name, role and Save contact are all visible at 375 × 667 without scrolling.
- [ ] Dark mode renders correctly in all three surface themes.
- [ ] Zero `<script>` tags in output.
- [ ] `arun`'s page is under 20 KB.

**Function**
- [ ] `tel:` opens the dialler with the right number on iOS and Android.
- [ ] `contact.vcf` imports cleanly on both, with name, org, title, phone, email.
- [ ] `wa.me` opens the right chat.
- [ ] Instagram opens the right profile.
- [ ] Every relative path resolves at a project-page URL with a repo subpath.

**Deploy**
- [ ] Actions workflow succeeds and the site is live.
- [ ] Editing `members.json` through GitHub's web UI triggers a rebuild.

**Print**
- [ ] `npm run qr` writes one PNG per member plus `labels.txt`.
- [ ] A QR printed at 20 mm scans from 30 cm in poor light, on two phones.

---

## 14. Out of scope

Not in v1, listed so they do not creep in: a CMS or admin UI; member self-service
editing; analytics or scan tracking; authentication; per-member custom domains;
drag-and-drop tile arrangement; multi-language. If scan analytics are wanted
later, the clean way is a short-link domain in front of the Pages site — not
JavaScript on the member pages.

---

## 15. Open questions for the society

Do not block on these; use the stated default and flag it.

1. **Roles for Arun and Amarnath** — seeded as "Committee Member". Confirm before
   printing anything.
2. **Photos** — none supplied yet. Default is the generated initials avatar,
   which looks intentional, so the site can launch without them.
3. **Bios** — empty in the seed. The rail handles their absence.
4. **Publishing personal phone numbers** on a public page is a deliberate choice.
   It is the right one for a QR on an ID card, but the committee should say yes
   to it explicitly, per member. Email-only is a supported configuration — just
   omit `phone` and `whatsapp`.
5. **Custom domain** — worth asking IT for. Shorter URL, better-scanning QR, and
   the codes survive a move off GitHub Pages.

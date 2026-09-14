# Decisions

Append-only. `DECIDED` entries are settled and binding — later sessions follow
them without relitigating. `OPEN` entries are unresolved; each states what it
blocks. Resolve an `OPEN` entry by editing it in place once settled, never by
starting a parallel document.

---

## DECIDED

### D1 — Follow PROMPT.md's checkpoint process, not BUILD-SPEC.md's kickoff prompt
`BUILD-SPEC.md`'s own "Kickoff prompt" section describes running straight
through to the deploy workflow with one showpoint. This conflicts with
`CLAUDE.md` and `PROMPT.md`, which require stopping at every checkpoint
(CP1–CP8) and never deploying without explicit confirmation.
**Decided (2026-09-13):** `PROMPT.md`'s phase/checkpoint structure governs.
`BUILD-SPEC.md`'s kickoff prompt is superseded and should be read as historical
context, not as the operating procedure.

### D2 — Spec docs live in `project-meta/`
`CLAUDE.md` and `PROMPT.md` both reference `project-meta/BUILD-SPEC.md`,
`project-meta/DESIGN-SYSTEM.md`, and `project-meta/DECISIONS.md`, but the two
spec files were sitting at repo root with no `project-meta/` directory, and
`DECISIONS.md` didn't exist.
**Decided (2026-09-13):** moved `BUILD-SPEC.md` and `DESIGN-SYSTEM.md` into a
new `project-meta/` directory and created this file there, matching what
`CLAUDE.md`/`PROMPT.md` already assume. No changes needed to either of those
docs.

### D3 — Empty string is treated identically to an omitted field
The seed data in `BUILD-SPEC.md` §5 sets `"bio": ""` and `"photo": ""` for
`arun` and `amarnath`. `BUILD-SPEC.md`'s validation rule as written would fail
the build on a `photo` that "does not exist on disk," which `""` technically
is not (it's simply not a filename).
**Decided (2026-09-13):** for every optional member field (`photo`, `bio`,
`instagram`, `phone`, `whatsapp`, `email`, `linkedin`, `club`, `batch`,
`accent`), an empty string is treated exactly as if the field were absent —
same fallback, same tile-emission logic, no validation error. This is what
lets the given seed data load unmodified.

### D4 — Explicit WhatsApp opt-out
`whatsapp` defaults to `phone` stripped of non-digits (`BUILD-SPEC.md` §5), but
there was no way to have a phone number without a WhatsApp tile.
**Decided (2026-09-13):** `"whatsapp": false` (boolean) suppresses the tile
even when `phone` is present. Absent or empty-string `whatsapp` still falls
back to the phone-derived default per D3.

### D5 — `site.roleOrder` and `site.cname` documented as optional site fields
Both are read by `build.js` (`BUILD-SPEC.md` §8 and §6/§9 respectively) but
were missing from the `site` object's field table in §5.
**Decided (2026-09-13):** both are optional `site`-level fields; `BUILD-SPEC.md`
§5's table will be updated to list them when CP1 touches that section.

### D6 — Custom `links[]` size is restricted to `sm` | `wide`
Nothing stopped a `links[]` entry from declaring `"size": "lg"` or `"tall"`,
which are reserved for the anchor tile and would trip the "exactly one `t-lg`"
build assertion with a generic error rather than a named one.
**Decided (2026-09-13):** validation rejects any `links[].size` other than
`sm`/`wide`, failing loudly with the member's name and the link's label.

### D7 — `og:image` is omitted when a member has no photo
The generated initials avatar is inline SVG produced at build time; it has no
standalone file to point `og:image` at.
**Decided (2026-09-13):** when `photo` is absent (after D3), the `og:image`
meta tag is omitted from that page's `<head>` rather than rasterizing the
avatar to a file solely for this purpose. Revisit if social-preview quality
becomes a real requirement — it isn't the primary use case (the page is reached
by scanning a QR code, not by a shared link unfurling).

### D8 — Initials-avatar algorithm
Not specified anywhere. **Decided (2026-09-13):** first letter of the first
word of `name` + first letter of the last word; if `name` is a single word,
use just its first letter. **Amended (2026-09-14):** the seed data itself
broke this — "Arun S" and "Amarnath Reddy S" both rendered "AS", caught via
the CP5 directory-page screenshot where both avatars sat side by side. A
single-letter last word is a surname initial, not a name, so that case now
falls back to the first name's own first two letters instead ("AR" / "AM").

### D9 — Build warnings surface in the GitHub Actions job summary, not just stderr
A student successor editing `members.json` through GitHub's web UI never sees
stderr — only whether the Actions run is green or red. A bio-length or
missing-contact-method warning would otherwise be invisible to exactly the
person who needs to see it.
**Decided (2026-09-13):** `deploy.yml` (CP8) writes accumulated build warnings
to `$GITHUB_STEP_SUMMARY` in addition to stderr, so they show up on the
Actions run page itself.

### D10 — Repo ownership and handover model
**Decided (2026-09-13):** the repo lives under the current committee member's
personal GitHub account for now. Next year's committee hands over by
forking/cloning this repo into their own account and updating `members.json`
and `site.baseUrl` there, rather than being granted continued access to this
account. `README.md` (CP8) should state this explicitly.

---

## OPEN

### D17 — `site.baseUrl` set to the real GitHub Pages URL
Supersedes O1. `BUILD-SPEC.md`'s seed data shipped a `CHANGEME` placeholder;
printed QR codes are permanent, so generating or printing them (CP6) against
a placeholder would produce cards wrong from day one. **Decided
(2026-09-14):** set to `https://ChargingTrex.github.io/cultural-society-cards`
— the repo is being pushed to that account under that name (see CP8). CP6/QR
generation and printing can now proceed against a real value; a custom
domain (`BUILD-SPEC.md` §15 item 5) is still a separate, unaddressed
improvement, not a blocker.

### O2 — Frosted-surface contrast for the actual seed accent colors
`DESIGN-SYSTEM.md` §10 flags frosted as the surface most likely to fail
contrast, but the four seed accents (`#E4572E`, `#2E6BE4`, `#1E9E6A`,
`#7B4BE4`) haven't been checked against both inks on that surface. **Blocks:**
sign-off on CP2's swatch page; recommend checking at CP2 rather than waiting
for the CP7 accessibility pass, since a failing accent means changing seed
data (and re-touching D3-adjacent validation) rather than just CSS.

### O3 — `backdrop-filter` cumulative cost on budget Android
Each tile applies its own `backdrop-filter: blur(16px)` (`DESIGN-SYSTEM.md`
§3); a page with 6-9 tiles applies that many independent blurs. The spec caps
blur radius per tile but doesn't address compositing cost across many tiles.
**Blocks:** final sign-off on the `frosted` surface for real low-end devices;
verify at CP7's real-device pass, not from a desktop browser.

### D11 — Permalink convention: bare first-name slug, no prefix
Asked to put the person's name in the permalink with a better convention than
`member-arun`. **Decided (2026-09-13):** keep the slug as the bare, lowercase
first name (`arun`, `amarnath`, ...) with no `member-`/`profile-` prefix — the
name already *is* the whole permalink (`.../arun/`). A prefix adds characters
to every printed QR code for no readability gain, since nobody reads the URL,
they scan it (`BUILD-SPEC.md` §9's stated reason slugs are short). If two
committee members ever share a first name, disambiguate with a last-initial
suffix (`arun-s`) rather than a prefix, to keep the added length minimal.

### D13 — Accent-derived tokens must be declared on `body`, not `:root`
`DESIGN-SYSTEM.md` §2.1-2.2 defines `--ring`, `--primary-wash`, and
`--primary-edge` on `:root`, each referencing `var(--primary)` — but
`--primary` itself is only ever set inline on `<body>` (§3's own example:
`<body style="--primary:#E4572E">`). Verified against real Chrome: a custom
property's `var()` references resolve using the *declaring* element's own
cascade, not the element that later consumes it. Since `:root` (`<html>`) is
an ancestor of `<body>`, `--primary` doesn't exist yet at `:root`, so
`--primary-wash`/`--primary-edge`/`--ring` compute to nothing there — and
that broken value is what inherits down, regardless of what `<body>` sets.
The bug is silent: no console error, tiles using `--primary-wash` (the
Society tile's Wash treatment) simply render with a fully transparent
background.
**Decided (2026-09-14):** these three declarations live on a `body { ... }`
rule (and its dark-mode/`data-theme` overrides), not on `:root`. Confirmed
against real Chrome (`color-mix`, computed style) before and after the fix.
`DESIGN-SYSTEM.md`'s own snippet is left as-authored (it documents intent,
not literal copy-paste CSS); this entry is the record for anyone implementing
it directly.

### D14 — Grid size classes belong on the `<li>`, not the tile inside it
Tiles are `<li><a class="tile t-lg ...">` for accessible list semantics
(`DESIGN-SYSTEM.md` §10). CSS Grid only honors `grid-column`/`grid-row` on a
direct child of the grid container — here, the `<li>` — not on descendants of
that child. Putting `t-lg`/`t-wide`/etc. on the inner `<a>` (as first written)
silently collapsed every tile to its default 1x1 track; caught via a desktop
screenshot before this reached CP2 sign-off.
**Decided (2026-09-14):** the `<li>` carries the size class; the inner
`<a>`/`<div>` carries `tile` plus its treatment/anchor classes.

### D15 — Corrected the Society-tile even/odd rule in DESIGN-SYSTEM.md §6.5
§6.5's own reference table ("even -> `t-wide`, odd -> `t-full`") contradicts
its own worked example directly below it (2 blocks after Email, which the
table calls even, but the example calls "3, odd" by counting Society itself
and concludes `t-full`) and, more importantly, contradicts the base-case
diagram in §6.4, where 1 block after Email (Call+WhatsApp) yields Society as
`t-wide` sharing the row. Using the table's literal odd->`t-full` mapping
also breaks the build's own required assertion: it would make the base
case's post-anchor column total 10, not divisible by 4.
**Decided (2026-09-14):** implemented **odd -> `t-wide`, even -> `t-full`**
— the base-case diagram's own arithmetic (verified with the third packing
assertion) and the worked example's row narrative both confirm this,
opposite of what the small table literally says. Confirmed against all four
seed members: each produces a column total divisible by 4.

### D16 — Phone-number publication consent confirmed for arun and amarnath
Carried forward from `BUILD-SPEC.md` §15 and `CLAUDE.md`'s "Current state" as
part of the original O4. **Decided (2026-09-14):** the committee member
running this session confirmed consent is in place for `arun`'s and
`amarnath`'s real phone numbers to be published, ahead of the first public
deploy. This clears the phone-number half of O4 specifically — it does not
cover roles or photos, which are separate and still open below.

### O4 — Roles and photos still unconfirmed
Arun's and Amarnath's roles are guessed ("Committee Member") and no photos
are supplied for any seed member. **Blocks:** printing, not building or
deploying — the site can be fully built and deployed with placeholders (the
generated initials avatar), but cards should not go to print until roles and
photos are confirmed per member.

### D18 — Club identity (not individual accent) drives the avatar backdrop for three named clubs
Asked to carry each club's own background image into the "profile pic" —
originally shared three reference images too large to ship (4.5MB/864KB/
228KB against a 20KB page budget) and with no filesystem path from this
session; the user then added the actual files to the project root
(`Night.png`=blue, `Night2.png`=pink, `night1.png`=red).
**Decided (2026-09-14):** center-cropped each to the 50:85 portrait ratio
(matching the rail/directory avatar's own new ratio, see below), resized to
300x510 (well past what a ~100-230px CSS box needs, but keeps the file
sharp), and re-compressed as JPEG — landed at 2.6KB/4.3KB/2.0KB, comfortably
inside budget. Stored at `assets/clubs/{cultural-society,media,student-council}.jpg`,
mapped from `member.club` in `src/page.js`'s `CLUB_BACKGROUNDS`. A club not
in that map (`Dance Club`, `Fine Arts Club` in the current roster) keeps the
existing per-member accent gradient — no data required, no build failure.
The large source PNGs stay on disk for reference but are gitignored, not
shipped.

### D19 — Avatar boxes (rail + directory) reshaped to a 50:85 portrait ratio
Previously square (`--avatar` token, 88-104px). **Decided (2026-09-14):**
`.avatar` and `.card-avatar` now use `aspect-ratio: 50 / 85` with the
existing width tokens driving height automatically. The anchor tile's own
photo/avatar-fallback treatment is explicitly excluded from this — it must
stay filling its 2x2 square span, which the whole packing/assertion system
in `src/page.js` depends on (DESIGN-SYSTEM.md §6.5).

### D20 — Per-member accent removed; accent is now a group (club) identity
Supersedes the per-member accent tuning in D16/D18's samples. Asked to
remove individual accent choice entirely and replace it with one shared
color per club. **Decided (2026-09-14):** `member.accent` is no longer read
anywhere — `src/page.js`'s `CLUB_THEMES` now pairs one accent with each
club's background image, reusing the already contrast-verified colors from
D18/D19's samples rather than picking new ones:
- Cultural Society (blue backdrop) -> `#F4A261` warm orange
- Media (pink backdrop) -> `#E8A33D` warm gold
- Student Council (red backdrop) -> `#2E9E8A` teal, true color-wheel complement to red

A club with no entry (`Dance Club`, `Fine Arts Club` in the current roster)
falls back to `site.accent` uniformly — there is no more per-member override
to fall back to instead, so those members now share the site default rather
than keeping distinct individual colors. The `accent` field was removed from
every member in `members.json` since it's no longer read; `site.accent`
remains the only accent field in the data model.

### D21 — Club background photo also applied to the directory-page card
Asked to carry the club color scheme into "the person card," which on
reflection means the directory listing's own card, not just each member's
individual page. **Decided (2026-09-14):** `.card` uses the same
`clubBackgroundUrl()` image as that member's own page when their club has a
theme (`src/index.js`), with the same white-text-on-dark-photo treatment
already used on the individual page (D19). Dance Club/Fine Arts Club cards
stay plain (`background: var(--card)`) since neither has a defined theme —
consistent with how their individual pages already behave.

### D22 — Club accents recomputed as the background photo's true complement
D20 picked gold for Media by eye ("editorial pairing"), not by actually
computing pink's complement — asked to fix that for all three clubs.
**Decided (2026-09-14):** sampled each cropped background's real average hue
in Python (skipping near-black pixels, which otherwise skew the average) and
took the exact 180°-rotated complement, rather than eyeballing:
- Cultural Society: avg hue 215° (blue) -> complement 35° — already `#F4A261`, no change needed
- Media: avg hue 335° (pink/magenta) -> complement 155° (jade green), not gold — changed to `#34B87F`
- Student Council: avg hue 360°/0° (red) -> complement 180° (cyan-teal) — changed from `#2E9E8A` (165°) to `#2AA9C7` (~193°), closer to the true complement and further from Media's green so the two clubs stay visually distinct
All three re-verified for contrast (6.2-7.4:1 against dark ink, comfortably
past 4.5:1).

### D23 — Cultural Society's accent refined to the exact sampled complement
D22's Cultural Society value (`#F4A261`, hue 26.5°) was carried over from an
earlier eyeballed choice rather than actually recomputed like Media/Student
Council were. Asked specifically to find blue's true complement.
**Decided (2026-09-14):** re-sampled `cultural-society.jpg` precisely —
average hue 214.7°, so the exact complement is 34.7°, not 26.5°. Changed to
`#F4B661` (same saturation/lightness as the old value, hue corrected to the
true complement), which also improves contrast (10.4:1 vs. 9.07:1). Updated
`site.accent` in `members.json` to match, since the site itself is titled
"Cultural Society" and the two were already meant to be the same color.

### D24 — Cultural Society moved off orange to coral-red
Asked for a different color than orange for the blue background, while
keeping the same warm-against-cool logic (not a literal blue-on-blue
accent, which would fail the whole point of D16/D20 — an accent has to
separate from its own backdrop, not match it). **Decided (2026-09-14):**
`#F2704A`, a coral-red (~14°) — meaningfully different from the previous
`#F4B661` (~35°, a orange/gold) rather than a small tweak, while staying on
the same side of the color wheel as blue's true complement. Contrast
6.4:1. `site.accent` updated to match, same reasoning as D23.

### D25 — Blob motif reused as a prominent accent, not just a page-corner wash
Asked to bring the existing blob+scallop decoration (D1's page-background
flourish) into two more prominent spots: behind the rail avatar, and as the
Instagram tile's own background. **Decided (2026-09-14):**
`src/decoration.js` gained `renderAvatarAccent()`/`renderTileAccent()` —
same smooth-blob-from-points generator, new placements, tinted by
`var(--primary)` (the member's committee color, per D20). Avatar accent
sits at 85% opacity peeking out from behind the photo (`.blob-avatar`);
tile accent sits at 28% opacity as a wash inside the Instagram tile
(`.blob-tile`), only when there's no real photo — a real photo already
fills the tile itself via `object-fit: cover`, so the blob would just be
hidden underneath it. Verified the no-photo path with a temporary local-only
edit (not committed) since every real member currently has a photo.

### D26 — Instagram (anchor) tile enlarged
**Decided (2026-09-14):** `.t-lg` gained an explicit `min-height` (340px
mobile, 400px desktop) on top of the row-span sizing, rather than raising
`grid-auto-rows` globally — that would have inflated every tile, including
ones further down the grid unrelated to this request. Save/Email necessarily
grow to match since they share the anchor's two rows by design; Call/
WhatsApp/Society do not.

### D27 — Club logos on the Society tile; assets/ reorganized into named subfolders
Asked to add the Student Council and Cultural Society crest logos "to the
respective members," and to split assets into dedicated folders.
**Decided (2026-09-14):**
- `assets/photos/` renamed to `assets/profilepic/` (all path references in
  `build.js`, `src/validate.js`, `src/page.js` updated — `og:image`,
  validation's existence check, and `avatarMarkup`'s `<img src>` all point
  here now).
- New `assets/Logos/` holds `cultural-society.jpg` and `student-council.jpg`
  — center-cropped square, resized to 240x240, compressed (20-27KB each).
- The Society tile's chip now shows the actual club logo (`clubLogoUrl()` in
  `src/page.js`) instead of the generic `icons.society` mark, for any member
  whose club has one. No logo exists yet for Media, so Media members (and
  any club without a logo) keep the generic icon — same graceful-fallback
  pattern as the background/accent themes.
- Verified the Student Council logo path with a temporary local-only club
  reassignment (not committed) since no real member is in that club yet.
- `assets/clubs/` (background photos) and the top-level `assets/` container
  itself are unchanged.

### D28 — SAIU logo in the directory header; header retitled "Student Committees"
The directory page's header showed `site.title` ("Cultural Society"), which
was accurate when this was a single-club site but is now misleading — the
same directory lists Cultural Society, Media, and Student Council members
together. **Decided (2026-09-14):** added the standalone SAIU starburst mark
(cropped from the center of the org seals, background keyed from black to
transparent, `assets/Logos/saiu.png`) above the header text, and replaced
the `<h1>` with a literal "Student Committees" instead of `site.title` —
scoped to `src/index.js`'s directory header only, not a `site.title` rename,
since individual member pages' own `<title>`/meta tags and their Society
tile's club label are already correct as-is (each shows that specific
member's own club, not a generic site-wide label).

### D29 — Fixed a real overlap bug D26's enlarged anchor tile introduced
D26 gave `.t-lg` an explicit `min-height` (400px desktop) without checking
it against the desktop grid's own row sizing, which was a *fixed* `168px`
(not `minmax`). A 2-row-span tile needing 400px when its allocated area was
only 168*2+16=352px doesn't grow its row tracks — CSS Grid just lets it
overflow past its allocated area, visually overlapping the next row (Call/
WhatsApp), which is exactly what shipped. **Decided (2026-09-14):** changed
desktop `grid-auto-rows: 168px` to `grid-auto-rows: minmax(168px, auto)`,
matching how mobile was already written — rows now grow to fit whatever's
actually inside them instead of silently overflowing. Caught from a live
screenshot, not synthetic testing.

### D30 — Outer "window" frame around the member page's tile grid
Asked for "a bigger window card with hover effect containing all the cards
and elements" — confirmed scope (member page, wraps the whole tile grid,
subtle lift-on-hover) before building rather than guessing. **Decided
(2026-09-14):** `.grid-window` in `src/page.js`/`src/styles.css` wraps the
`<ul class="grid">`, giving the whole tile set one shared translucent card
frame (separates it from the page backdrop, which on a themed club page is
a full-bleed photo) with the same hover-lift treatment individual tiles
already had. Pushed `amarnath`'s page to 20.2KB (0.2KB over budget) — left
as-is per the earlier explicit instruction to not block on the KB budget.

### D31 — Club logo moved below the avatar; role/club split to two lines; Society tile fills with the logo
Follow-up correction: the club logo (D27) was in the Society tile's chip
only, not "below their profile pic" as asked. **Decided (2026-09-14):**
- Added a second `<img class="club-logo">` directly under `.avatar-wrap`,
  independent of the Society tile's own logo (both now show it, in two
  different presentations) — first attempt sat beside the avatar instead of
  under it, since inline/inline-block elements in a centered rail flow
  left-to-right when they fit on one line; fixed with `display: block` +
  auto margins.
- `--avatar` token raised 88px->108px (104px->128px desktop) — "make the
  whole card bigger."
- Role and club now render as two lines (`<br>` inside `.role-line`)
  instead of one line joined by " · ".
- Society tile: when a logo exists, it now fills the tile as a large
  `object-fit: contain` background image (`.tile-society-bg`) instead of a
  small chip icon — the chip is dropped entirely in that case (a tiny
  duplicate next to a large one would be redundant); title/meta text sits
  in a small pill (`.tile-society-logo .tile-text`) for legibility over the
  logo's own white background.
- Real member pages (arun, amarnath) now run 20.5-20.7KB, further past the
  20KB budget — left as-is per the standing instruction not to block on it.

### D32 — Removed the under-avatar logo; Society tile drops "Sai University" to just the club name
Follow-up correction to D31: the standalone logo under the avatar was
removed entirely (the Society tile's own large logo fill is enough).
**Decided (2026-09-14):** dropped the `<img class="club-logo">` under
`.avatar-wrap`. `renderTile()` now only emits `.tile-meta` when `tile.meta`
is non-empty (was always rendering it, even blank); the Society tile passes
`meta: ''` whenever a logo exists, so it shows only the club name — already
bottom-aligned via the existing `.tile-society-logo { justify-content:
flex-end }` from D31, no further CSS change needed there.

### D33 — Grid-window card 25% bigger on desktop only
**Decided (2026-09-14):** scoped to the true desktop breakpoint (960px,
where the rail becomes a sticky sidebar) rather than the 640px tablet step.
`.page` max-width raised 1080px->1350px (25%) so there's room; `--gap`
16px->20px, `--tile-pad` 20px->25px, and `grid-auto-rows` 168px->210px, all
25% over their 640px values — scaled together so the card grows
proportionally rather than just gaining whitespace. Mobile and the 640px
tablet step are untouched.

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

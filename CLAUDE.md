# CLAUDE.md

Persistent context for Claude Code sessions in this repo. Read this first, every
session. Keep it short enough that it stays read.

---

## What this is

A static site. Every member of the **Sai University Cultural Society** committee
gets one page — photo, name, role, club, bio, and one-tap buttons for Instagram,
phone, WhatsApp, email and save-to-contacts. Each page is reached by scanning a
**QR code printed on that member's ID card**. Hosted on GitHub Pages.

The entire site is generated from **one JSON file** so that next year's committee
can hand over by editing it in GitHub's web UI — no clone, no build knowledge, no
design decisions.

Two facts that should shape every judgement call:

1. **The reader is on a phone, outdoors, on mobile data, for about ten seconds.**
   Mobile is the primary layout. Speed is a feature, not a nice-to-have.
2. **Printed QR codes outlive the committee that made them.** A slug is a
   permanent URL. Changing or deleting one silently breaks physical cards that
   are already in wallets.

---

## Documents, in authority order

| Doc | Owns |
|---|---|
| `project-meta/DECISIONS.md` | Anything settled. Append-only, DECIDED/OPEN. **Highest authority.** |
| `project-meta/BUILD-SPEC.md` | *What* gets built — data model, build behaviour, deploy |
| `project-meta/DESIGN-SYSTEM.md` | *How it looks* — tokens, grid, tiles, motion, a11y |
| `PROMPT.md` | How a build session is structured — phases and checkpoints |
| `README.md` | Handover guide, written for a student successor |

If two documents disagree, `DECISIONS.md` wins; otherwise raise it rather than
picking a side — see Working agreement below.

---

## Commands

```bash
npm install       # devDependencies only (qrcode, for the QR script)
npm run build     # node build.js → dist/
npm run serve     # build, then serve dist/ locally
npm run qr        # regenerate qr/*.png and qr/labels.txt
```

---

## Hard rules

- **Never push, deploy, enable GitHub Pages, or run any `gh` command without
  explicit confirmation.** Build and show; do not ship.
- **Zero runtime JavaScript** in generated pages. The build must fail if
  `<script` appears in output. `qrcode` is a devDependency and never ships.
- **Zero runtime dependencies.** Node 20+, ES modules, `node:fs`, template
  literals. No bundler, no templating library, no CSS framework, no icon library.
- **`members.json` is the only file a non-technical editor ever touches.** If a
  change would require them to edit anything else, it is the wrong change.
- **Relative asset paths everywhere.** The site must work identically at
  `user.github.io/repo/`, at a user page, and on a custom domain.
- **Never commit `dist/` or `qr/`.** CI builds `dist/`; QRs are generated on
  demand.
- **Never change or remove a `slug`** without saying out loud that it breaks
  printed cards, and getting a yes.

---

## Invariants that are easy to break

These are the ones that will not announce themselves. The build asserts all of
them; if you touch the layout code, keep the assertions passing rather than
relaxing them.

- **Exactly one `t-lg` tile per page.** Normally Instagram; the photo is the
  fallback anchor when there is none. Zero anchors or two both break the grid.
- **`t-sm` tiles always come in pairs.** Any unpaired one is promoted to
  `t-wide`. This is what guarantees mobile never has a hole.
- **The Society tile closes the last desktop row** — `t-full` when the block
  count after Email is odd, `t-wide` when even.
- **Never `grid-auto-flow: dense`.** Every tile is a link; dense decouples focus
  order from visual order.
- **No `target="_blank"` on `tel:`, `mailto:` or the vCard link.** It breaks the
  handoff to the phone's dialler on iOS.
- **vCard uses CRLF line endings.** Some Android contact apps reject LF-only.
- **Keep the QR quiet zone at 4 modules.** Cropping the white margin is the
  single commonest cause of an unscannable card.

---

## Code conventions

- ES modules, `node:` prefixed builtins, top-level `await` where it reads better
  than a wrapper.
- Templates are plain functions returning strings, in `src/`. One concern per
  file.
- Validation throws with the **member's name in the message**. A build that fails
  usefully is worth more than one that guesses.
- Warnings go to stderr and do not fail the build. Errors fail it.
- The build is idempotent: two runs produce byte-identical output.

### Quality bar

This should read as a real developer's repo, not as generated output. Concretely:

- No comments restating the code (`// loop through members`). Comment only the
  non-obvious — *why* the vCard needs CRLF, *why* dense flow is banned.
- No defensive `try/catch` around code that cannot throw. No `console.log`
  left in.
- No emoji in code, comments, or commit messages.
- Commit messages: plain, lowercase, imperative — `add vcard generation`, not
  `✨ feat: implement comprehensive vCard generation system`.
- No README section that exists only to look thorough.

---

## Working agreement

- **Stop at checkpoints and wait for an explicit go-ahead.** `PROMPT.md` defines
  CP1–CP8. Do not run several checkpoints together because they seem small.
- **Surface trade-offs; do not resolve them silently.** Where there is a real
  choice, present the options and a recommendation, then wait. Where intellectual
  honesty sets a floor — an accessibility failure, an unscannable QR, a broken
  printed link — say so plainly rather than offering it as a preference.
- **Log conflicts, do not pick a winner.** If two docs, two sessions, or the spec
  and reality disagree, append an **OPEN** entry to `DECISIONS.md` describing the
  conflict, and raise it. Resolve by editing `DECISIONS.md` in place once
  settled — never by starting a parallel document.
- Expect mix-and-match feedback. Options presented as A/B will often come back as
  "A's layout with B's palette"; build so that is cheap.

---

## Current state

Pre-implementation. `project-meta/BUILD-SPEC.md` and
`project-meta/DESIGN-SYSTEM.md` are written; no code exists yet. Seed data holds
two real members (`arun`, `amarnath`) and two placeholders — `sample-two`
deliberately has no Instagram, to exercise the anchor fallback. Both placeholders
are deleted before launch.

Open items are tracked in `project-meta/DECISIONS.md`. The ones that block
printing rather than building: confirmed committee roles, photos, and per-member
sign-off on publishing personal phone numbers.

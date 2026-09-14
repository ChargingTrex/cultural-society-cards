# PROMPT.md — how to run a build session

Paste the block in §0 to start. Everything after it is the structure that block
refers to.

This is a three-phase job: **understand, then plan, then build** — with a stop
and an explicit go-ahead at every checkpoint. Do not collapse phases. Do not run
two checkpoints together because they look small.

---

## 0. The opening prompt

> Read `CLAUDE.md`, `project-meta/BUILD-SPEC.md`, `project-meta/DESIGN-SYSTEM.md`
> and `project-meta/DECISIONS.md`, then follow `PROMPT.md`.
>
> Start with **Phase 1 only**: produce the contradictions / gaps / risks list.
> Write no code and no plan yet. Stop when the list is done and wait for my
> go-ahead.

---

## Phase 1 — Context gathering

**Produce a written list before planning anything.** The point is to find where
the specs are wrong, thin, or in tension *before* they get baked into code, when
fixing them is a paragraph rather than a refactor.

Three sections, and be specific — quote the line and give the file:

**Contradictions** — places where two documents disagree, or where a rule
contradicts itself. Example shape: "`BUILD-SPEC.md` §6 lists LinkedIn as `t-sm`
but `DESIGN-SYSTEM.md` §6.5 requires `t-sm` tiles in pairs — which wins when a
member has LinkedIn and no WhatsApp?"

**Gaps** — decisions the specs assume are made but never make. Anything you would
otherwise have to guess at. If you catch yourself about to pick a reasonable
default, that is a gap; write it down instead.

**Risks** — things likely to work in development and fail in the world. Bias
toward these three, because they are where this project actually fails:

- *Print and scan* — anything that makes a QR harder to scan, or a printed card
  wrong or obsolete.
- *Real devices* — iOS versus Android behaviour on `tel:`, `mailto:`, `.vcf`
  import, `wa.me`, `backdrop-filter` performance on budget Android.
- *Handover* — anything that quietly requires a developer, when the successor is
  a student editing JSON in a browser.

Then **stop**. No plan, no scaffolding, no `package.json`. Wait.

---

## Phase 2 — The plan

Once the Phase 1 list has been answered, write the plan. It should contain:

1. **Resolutions** — for each contradiction and gap, what was decided and why.
   Anything settled here gets appended to `project-meta/DECISIONS.md` as
   **DECIDED**; anything still unresolved gets appended as **OPEN**, with what it
   blocks.
2. **Per-checkpoint checklists** — CP1 through CP8 from §3 below, each with its
   concrete file list and its own acceptance criteria. Adjust the checkpoints if
   Phase 1 showed they are wrong; say what changed and why.
3. **Sequence risks** — anything that must be got right early because it is
   expensive to change later. The token layer and the slug scheme are both in
   this category.

Present the plan. **Stop.** Wait for a go-ahead before CP1.

---

## Phase 3 — Execution, CP1 → CP8

### The rule at every checkpoint

Finish the work, then stop and report. Never continue into the next checkpoint on
your own initiative — not even when the next one is five minutes of work.

Report in this shape, and keep it short:

```
CP<n> — <name>
Done:        <what now exists>
Checks:      <each acceptance criterion, pass/fail>
Decisions:   <anything decided, now appended to DECISIONS.md>
Surprises:   <anything that did not go as the spec described>
Next:        <what CP<n+1> will do>
```

If a check fails, say so and stop. A failing checkpoint reported honestly is
worth more than a passing one that was quietly narrowed to pass.

---

### CP1 — Scaffold and data

Repo structure per `BUILD-SPEC.md` §4. `package.json`, `.gitignore`,
`members.json` with the seed data, and the validation layer.

- [ ] `members.json` validates; all four seed members load
- [ ] Validation fails loudly, naming the member, on: duplicate slug, bad slug
      pattern, malformed accent, missing photo file, accent failing contrast
      against both inks
- [ ] Bio over 180 chars warns and does not truncate
- [ ] `dist/` and `qr/` are gitignored

**Show:** the validation errors, by deliberately breaking one member.

---

### CP2 — Design tokens and stylesheet

`src/styles.css`, complete, per `DESIGN-SYSTEM.md` §2–9. All three surface
themes, both colour schemes.

- [ ] Every token in §2 defined; dark mode overrides only what changes
- [ ] All three surfaces render: `frosted`, `paper`, `dither`
- [ ] Frosted has its `@supports not (backdrop-filter)` fallback
- [ ] Grid, size classes and `.t-full` present; **no `dense` anywhere**
- [ ] Focus ring, `prefers-reduced-motion`, `prefers-color-scheme` all handled

**Show:** a throwaway swatch page — tokens, the four tile sizes, all three
surfaces, light and dark. Delete it after approval; it is not part of the site.

This is the checkpoint most worth slowing down at. Everything downstream inherits
these values, and expect the feedback to be mix-and-match — "that radius with the
other palette" — so keep the tokens genuinely swappable.

---

### CP3 — Member page template

`src/page.js`, `src/icons.js`, and enough of `build.js` to generate one page.

- [ ] `dist/arun/index.html` generated, CSS inlined
- [ ] Rail and all tiles render; tile order matches `DESIGN-SYSTEM.md` §6.4
- [ ] Packing pass implemented — pairing, promotion, Society span
- [ ] All three assertions pass: one `t-lg`, no unpaired `t-sm`, column units
      after the anchor divisible by 4
- [ ] Every tile `<a>` has a standalone `aria-label`
- [ ] Generated initials avatar works (no photo supplied yet)
- [ ] Zero `<script>` tags; page under 20 KB

**Show:** the page rendered at 375px and 1280px, light and dark, and the raw HTML
for `arun`.

---

### CP4 — Full build and vCards

`src/vcard.js` and the rest of `build.js`.

- [ ] All four members build
- [ ] `contact.vcf` per member: CRLF, escaped values, no empty lines
- [ ] `sample-two` — no Instagram — correctly promotes the photo to the anchor
- [ ] Grid has no holes at 375 / 768 / 1280 for **every** member
- [ ] Two consecutive builds produce byte-identical output
- [ ] `.nojekyll` written; `assets/` copied

**Show:** the build summary, and one `.vcf` in full.

---

### CP5 — Directory page

`src/index.js` → `dist/index.html`, per `BUILD-SPEC.md` §8.

- [ ] Lists all members, each linking to their page
- [ ] Uniform card grid — no anchor tile, no per-member accent
- [ ] Respects `site.roleOrder` when present; otherwise JSON order, never
      alphabetical by default
- [ ] Reachable from every member page's Society tile

---

### CP6 — QR codes

`qr.js` per `BUILD-SPEC.md` §9.

- [ ] One PNG per member, plus `qr/labels.txt` mapping slug → name → URL
- [ ] Error correction M, margin 4 modules, 1024px, pure black on pure white
- [ ] Each PNG decodes to the right URL

**Show:** the labels file, and one QR printed at 20 mm and scanned from 30 cm in
poor light, on both an iPhone and a budget Android. This is a physical test. Do
not mark it passed from a screen.

---

### CP7 — Accessibility and performance

Full pass against `DESIGN-SYSTEM.md` §10–11 and `BUILD-SPEC.md` §13.

- [ ] Contrast ≥ 4.5:1 body / 3:1 large, in both schemes and **all three**
      surfaces — frosted is the one that slips
- [ ] Tab order matches visual order on every page
- [ ] Every link's accessible name stands alone out of context
- [ ] One `<h1>` per page; tiles in a `<ul>`/`<li>`
- [ ] Name, role and Save contact all visible at 375 × 667 without scrolling
- [ ] ≤ 4 requests, zero JS, every page under 20 KB
- [ ] `tel:`, `mailto:`, `.vcf`, `wa.me` and Instagram all verified on a real
      iOS and a real Android device

**Show:** the checklist with real results. "Not tested" is an acceptable answer;
a guess presented as a pass is not.

---

### CP8 — Deploy and handover

`.github/workflows/deploy.yml` and `README.md`.

- [ ] Workflow matches `BUILD-SPEC.md` §10
- [ ] `README.md` is written for a student successor, not a developer, and covers
      adding a member, adding a photo, regenerating QRs, running locally, and the
      warning that deleting a slug breaks printed cards
- [ ] Every relative path resolves at a project-page URL with a repo subpath

**Stop before shipping.** Do not push, do not enable Pages, do not run any `gh`
command. Present the workflow and the README, and wait.

After the go-ahead and the first successful deploy, verify the one thing that
makes handover real: edit `members.json` through GitHub's web UI, commit, and
confirm the site rebuilds without anyone touching a terminal.

---

## 4. Standing instructions

- **Checkpoints are stops, not milestones.** Reaching one means stopping.
- **Surface trade-offs; do not resolve them silently.** Present options with a
  recommendation and wait. Where honesty sets a floor — a contrast failure, an
  unscannable QR, a broken printed link — say so plainly rather than offering it
  as a preference.
- **Log conflicts rather than picking a winner.** Append an OPEN entry to
  `DECISIONS.md` and raise it. Resolve by editing that file in place once
  settled, never by starting a parallel doc.
- **Append to `DECISIONS.md` as you go**, not in a batch at the end. A decision
  that only exists in a chat log is lost by the next session.
- **Never push or deploy without explicit confirmation.**
- **The output should read as a real developer's work.** See the quality bar in
  `CLAUDE.md`.

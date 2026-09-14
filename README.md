# Cultural Society ID cards

Every committee member gets one page — photo, name, role, club, bio, and
one-tap buttons for Instagram, phone, WhatsApp, email and save-to-contacts.
Each page is reached by scanning a QR code printed on that member's ID card.

The whole site is generated from **one file, `members.json`**. You do not
need to know how to code to run this — you're editing a list, not writing a
program.

## Add a member

1. Open `members.json` (in GitHub, click the file, then the pencil icon to
   edit).
2. Copy an existing member's block (the part between `{` and `}` inside
   `"members": [ ... ]`) and paste it as a new entry.
3. Change the fields: `slug` (see the warning below), `name`, `role`, `club`,
   `phone`, `email`, `instagram`, and so on. Leave out any field that doesn't
   apply — a member with no Instagram just omits that line.
4. Commit the change. The site rebuilds automatically in under a minute.

**Never change or delete a `slug` once it's printed on a card.** The slug is
the last part of that member's URL, and that URL is what's encoded in their
QR code. Changing `arun` to something else, or deleting that member entirely,
breaks every printed card pointing at `arun` — permanently, since there's no
way to update ink on a card that's already been printed.

## Add their photo

1. Get a square photo, at least 400x400 pixels.
2. Drop it into `assets/photos/`, named after their slug — `arun.jpg` for the
   member whose slug is `arun`.
3. In `members.json`, set that member's `photo` field to the filename you
   used (`"photo": "arun.jpg"`).

No photo is required — members without one get a generated avatar (their
initials on a colored square), which looks intentional rather than broken.

## Generate the QR codes

QR codes are not generated automatically — you run this yourself, once,
whenever the roster changes:

```bash
npm install
npm run qr
```

This writes one PNG per member into `qr/`, plus `qr/labels.txt` (a plain-text
list of slug, name, and URL, so whoever lays out the cards can match codes to
people without opening every image).

Before sending anything to print:

- **Print each code at least 20mm x 20mm.** Smaller than that, phone cameras
  struggle to focus on it at arm's length.
- **Don't crop the white border around the code.** That margin is part of
  the code, not empty space — cropping it is the single most common reason a
  QR code fails to scan.
- **Don't recolor it or put a logo in the middle.** Pure black on white,
  exactly as generated.
- **Test an actual printed card** before printing the full batch — scan it
  from about 30cm away, in a dim room, on both an iPhone and a cheaper
  Android phone.

## Run it locally

```bash
npm install
npm run serve
```

This builds the site and opens it at `http://localhost:3000`. Use this to
check a change before committing it.

## When the committee changes

Each year's handover works by **forking or cloning this repository into the
new committee's own GitHub account**, not by handing over access to this
one. From there, the new committee edits `members.json` in their fork exactly
as described above.

- Remove members who've left, add new ones, following "Add a member" above.
- Update `site.baseUrl` in `members.json` to match the new repository's own
  GitHub Pages address, and regenerate the QR codes (`npm run qr`) before
  reprinting any cards.
- Reprint cards only for people whose slug actually changed — everyone else's
  existing card keeps working.

Remember: **deleting a member breaks any printed QR code pointing at them.**
If someone is leaving the committee but their card is still valid for the
rest of the year, leave their entry in place until you're ready to reprint.

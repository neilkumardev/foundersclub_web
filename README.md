# Founders Club website

A static one-page site for Founders Club at Bellevue High School. No build step and no dependencies beyond Google Fonts.

```
index.html    page content and copy
serve.py      local preview server (no caching)
styles.css    identity, layout, motion
config.js     editable club details (join link, email, meeting info, Instagram)
main.js       applies config, mobile menu, scroll and hover animations
favicon.svg   vermilion dot
```

## Preview

From this folder:

```bash
python3 serve.py
```

Then open http://localhost:4173. This server turns off browser caching, so edits always show up on reload. (Plain `python3 -m http.server` lets the browser keep old copies of `styles.css`, which makes the page look broken after an update.)

## Publishing an update

`index.html` loads `styles.css?v=3`, `config.js?v=3` and `main.js?v=3`. When you change any of those files, bump the number (for example to `?v=4`) in all three links, so visitors' browsers fetch the new versions instead of cached ones.

## Edit club details

Everything that changes often is in `config.js`:

| Setting | What it does |
| --- | --- |
| `joinUrl` | Sign-up form link. While empty, the **Join** buttons scroll to the Get Involved section, which says online sign-up isn't open yet and to come to a meeting. Once set, every Join button opens the form in a new tab and the section shows an "Open the sign-up form" button. |
| `contactEmail` | While empty, mentors and speakers are pointed to Instagram or Room 0108. Once set, a mailto link appears. |
| `instagramUrl`, `instagramHandle` | Set both to `""` to hide every Instagram link. |
| `meeting.*` | Cadence, start and end time, room, host, school. Leave `end` empty until it's confirmed. Leave `host` empty to hide it. |
| `photos` | Real meeting photos. While the list is empty, the "At meetings" section stays hidden. Put the files in an `images/` folder and list them as `{ src, alt, caption }`. They show in grayscale and turn to colour on hover. |

Page copy is plain HTML in `index.html`, one `<section>` per part of the page.

## Deploy

It's a static folder, so any static host works: GitHub Pages, Netlify, Vercel, Cloudflare Pages, or school web space. Upload the files as they are.

## Motion and accessibility

- Graphics are inline SVG line drawings in `index.html` (no image files). Each one ends in a vermilion dot.
- Motion: the hero types in, a marquee lists what people build, the illustration for each project type draws itself as that type comes into focus, the six step dots and track fill as you scroll, the improve→build loop draws when step 5 is reached, icons draw in, sections reveal, buttons lean toward the cursor, and there's a reading-progress line under the header.
- With `prefers-reduced-motion: reduce`, all of that is skipped and the page shows its finished state.
- Without JavaScript, all content is visible and the menu shows as plain links.
- Colours were checked for WCAG AA. Vermilion text is only used at large sizes; small accent text uses the deeper `--accent-deep`.

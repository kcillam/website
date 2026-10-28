# Soham Mallick — personal website

**https://kcillam.github.io/website/**

Personal website of Soham Mallick, PhD student in Statistics and Data Science at the
Wharton School, University of Pennsylvania.

© 2025–2026 Soham Mallick. All rights reserved — see [LICENSE](LICENSE).

---

Plain HTML, CSS and a little JavaScript. No frameworks. The only tool is `build.py`
(standard Python 3.11+), which fills the Research, Teaching and Talks lists from the
files in `data/`.

## Where things are

| What | File |
|---|---|
| Page structure, About text | `index.html` |
| Papers, talks, teaching | `data/publications.toml`, `data/talks.toml`, `data/teaching.toml` |
| Coauthor homepages (become links) | `data/people.toml` |
| CV link (hidden until set) | `data/site.toml` |
| Colours, font sizes, spacing | `css/variables.css` |
| Navigation bar + search box | `css/navbar.css` |
| Home (photo, About) | `css/home.css` |
| Research / Teaching / Talks | `css/sections.css` |
| Page background, links, basics | `css/base.css` |
| Footer | `css/footer.css` |
| Logo animation, reduced motion | `css/animations.css` |
| Copyright & privacy page | `legal.html`, `css/legal.css` |
| Search | `script/search.js` |

Each CSS file contains its own phone/tablet rules, so a change in one area doesn't
affect another.

## Common tasks

**Edit your biography** – change the About text in `index.html` (search for `class="about"`).

**Add a paper** – open `data/publications.toml`, copy one `[[paper]]` block to the top of
its section and edit it. Put `*` after names for equal contribution. Then run:

```
python3 build.py
```

**Add a talk or a course** – same idea in `data/talks.toml` or `data/teaching.toml`, then
`python3 build.py`.

**Link a coauthor** – add `"Full Name" = "https://their-homepage"` to `data/people.toml`,
then `python3 build.py`.

**Show the CV** – put the PDF at `files/cv.pdf`, set `cv = "files/cv.pdf"` in
`data/site.toml`, then `python3 build.py`. Links appear in the menu and under the photo.

**Visit counter** – set by `goatcounter = "mahos"` in `data/site.toml` (empty it to turn the
counter off), then `python3 build.py`. The number appears at the bottom of the page once
GoatCounter's "allow using the visitor counter" setting is on; if GoatCounter is unreachable,
nothing is shown. Detailed statistics stay private at https://mahos.goatcounter.com.

**Change a colour** – edit the value in `css/variables.css`; it updates everywhere.

**Replace the photo** – run `sh tools/make-profile-image.sh /path/to/photo.jpg`. It writes
`images/profile.webp`: the centre square (what the round frame shows), 720×720, with all
metadata removed. Keep full-size originals out of this folder — everything here is public.

**Add a menu item** – add an `<li>` to `<ul class="nav-links">` in `index.html` pointing
to `#something`, and give the matching `<section>` that `id`.

## Privacy protections

| Protection | Where | What it does |
|---|---|---|
| AI-training opt-out | `robots.txt` in the separate `kcillam.github.io` repository (served at https://kcillam.github.io/robots.txt — the only place crawlers look) | Asks GPTBot, ClaudeBot, CCBot, Google-Extended, Applebot-Extended, meta-externalagent, Amazonbot, Bytespider and ImagesiftBot to collect nothing; all other crawlers may read the pages but not the photo |
| No image indexing | `<meta name="robots">` in `index.html` | `noimageindex` and `max-image-preview:none`: search engines may index the page but not show the photo; `noarchive`: Bing does not use the page for AI training or Copilot answers |
| Small, clean photo | `images/profile.webp` | 720×720, no EXIF/GPS/camera data; link previews use the logo instead |

These are requests that reputable crawlers follow; they cannot stop scrapers that ignore
them. GitHub Pages cannot send custom headers or block requests.

To add or remove a crawler, edit `robots.txt` in the `kcillam.github.io` repository.
To verify everything: `python3 tools/check_privacy.py` (local files) or
`python3 tools/check_privacy.py --live` (the published site).

## Preview on your computer

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Before publishing, `python3 build.py --check` confirms
the lists in `index.html` match the data files.

## Publishing

The site is served by GitHub Pages from the `main` branch.

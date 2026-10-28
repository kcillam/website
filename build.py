#!/usr/bin/env python3
"""Fill in the Research, Teaching and Talks sections of index.html (and the privacy note in
legal.html) from the files in data/.

Usage:
    python3 build.py            update index.html
    python3 build.py --check    only report whether index.html is up to date

Only the parts of index.html between <!-- BEGIN:name --> and <!-- END:name --> are
rewritten. Everything else in index.html is edited by hand as usual.
Needs Python 3.11 or newer and nothing else.
"""
import html
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
INDEX = ROOT / "index.html"


class DataError(Exception):
    pass


def load(name):
    try:
        with open(DATA / name, "rb") as f:
            return tomllib.load(f)
    except tomllib.TOMLDecodeError as err:
        raise DataError(f"data/{name}: {err}") from None


def text(value):
    """Escape plain text for HTML."""
    return html.escape(str(value), quote=False)


def check_url(url, where):
    if not re.match(r"^(https?://|mailto:|files/|images/)", url):
        raise DataError(f"{where}: link {url!r} should start with https:// (or files/ for local files)")
    return html.escape(url, quote=True)


def require(entry, fields, where):
    missing = [f for f in fields if not entry.get(f)]
    if missing:
        raise DataError(f"{where}: missing {', '.join(missing)}")


def link_row(links, where, prefix=""):
    """'arXiv:1234 | arXiv | Code' style line; prefix is optional plain HTML."""
    parts = [prefix] if prefix else []
    parts += [f'<a href="{check_url(url, where)}">{text(label)}</a>' for label, url in links.items()]
    return '<span class="sep" aria-hidden="true">|</span>'.join(parts)


# ---- Publications --------------------------------------------------------------

def render_authors(authors, me, people, where):
    out = []
    for raw in authors:
        name = raw.rstrip("*").strip()
        star = "*" if raw.endswith("*") else ""
        if name == me:
            out.append(f'<strong class="me">{text(name)}{star}</strong>')
        elif name in people:
            out.append(f'<a href="{check_url(people[name], where)}">{text(name)}</a>{star}')
        else:
            out.append(f"{text(name)}{star}")
    return ", ".join(out)


def render_paper(p, me, people, where):
    require(p, ["title", "authors", "year", "section"], where)
    links = p.get("links", {})
    title = p["title"]  # may contain simple HTML such as <i>k</i>
    if links:
        title = f'<a href="{check_url(next(iter(links.values())), where)}">{title}</a>'
    lines = [
        f'<p class="pub-title">{title} <span class="pub-year">({text(p["year"])})</span></p>',
        f'<p class="pub-authors">{render_authors(p["authors"], me, people, where)}</p>',
    ]
    if p.get("venue"):
        lines.append(f'<p class="pub-venue">{text(p["venue"])}</p>')
    arxiv = f'<span class="pub-id">arXiv:{text(p["arxiv"])}</span>' if p.get("arxiv") else ""
    if links or arxiv:
        lines.append(f'<p class="pub-links">{link_row(links, where, arxiv)}</p>')
    return '<li class="pub">\n  ' + "\n  ".join(lines) + "\n</li>"


def render_publications(site, people):
    data = load("publications.toml")
    sections = data.get("sections", [])
    ids = {s["id"] for s in sections}
    papers = data.get("paper", [])
    for i, p in enumerate(papers, 1):
        if p.get("section") not in ids:
            raise DataError(f"publications.toml, paper {i}: section must be one of {sorted(ids)}")
    blocks = []
    for s in sections:
        group = [p for p in papers if p["section"] == s["id"]]
        if not group:
            continue
        items = "\n".join(
            render_paper(p, site["name"], people, f"publications.toml, “{p.get('title', '?')}”")
            for p in group
        )
        block = (f'<div class="pub-group">\n<h3 class="pub-group-title">{text(s["title"])}</h3>\n'
                 f'<ol class="pub-list">\n{items}\n</ol>')
        if any(a.endswith("*") for p in group for a in p["authors"]):
            block += '\n<p class="pub-note">* Equal contribution</p>'
        blocks.append(block + "\n</div>")
    return "\n".join(blocks)


# ---- Talks and teaching ----------------------------------------------------------

def render_talks():
    items = []
    for i, t in enumerate(load("talks.toml").get("talk", []), 1):
        where = f"talks.toml, talk {i}"
        require(t, ["title", "date"], where)
        lines = [f'<div class="talk-head"><strong class="talk-title">{text(t["title"])}</strong>'
                 f'<span class="talk-date">{text(t["date"])}</span></div>']
        if t.get("description"):
            lines.append(f'<p>{t["description"]}</p>')
        if t.get("venues"):
            venues = "".join(f'<li class="venue">{text(v)}</li>' for v in t["venues"])
            lines.append(f'<ol class="talk-venues">{venues}</ol>')
        if t.get("venue"):
            lines.append(f'<p class="venue">{text(t["venue"])}</p>')
        if t.get("links"):
            lines.append(f'<p class="talk-links">{link_row(t["links"], where)}</p>')
        items.append('<li class="talk">\n  ' + "\n  ".join(lines) + "\n</li>")
    return '<ol class="talk-list">\n' + "\n".join(items) + "\n</ol>"


def render_teaching():
    items = []
    for i, c in enumerate(load("teaching.toml").get("course", []), 1):
        require(c, ["term", "course"], f"teaching.toml, course {i}")
        lines = [f'<p><strong>{text(c["term"])}</strong>: {text(c["course"])}</p>']
        if c.get("instructor"):
            lines.append(f'<p class="detail"><em>Instructor</em>: {text(c["instructor"])}</p>')
        if c.get("institution"):
            lines.append(f'<p class="detail venue">{text(c["institution"])}</p>')
        items.append('<li class="course">\n  ' + "\n  ".join(lines) + "\n</li>")
    return '<ol class="course-list">\n' + "\n".join(items) + "\n</ol>"


# ---- CV links --------------------------------------------------------------------

ICON = '<svg class="icon" aria-hidden="true"><use href="#i-{}"></use></svg>'


def render_cv(site, kind):
    cv = site.get("cv", "").strip()
    if not cv:
        return "<!-- The CV link appears here when cv is set in data/site.toml -->"
    href = check_url(cv, "site.toml, cv")
    if kind == "nav":
        return f'<li><a href="{href}">{ICON.format("cv")}CV</a></li>'
    return f'<li><a class="social-link" href="{href}" aria-label="CV">{ICON.format("cv")}</a></li>'


# ---- Visit counter (GoatCounter) --------------------------------------------------------

def goatcounter_code(site):
    code = site.get("goatcounter", "").strip()
    if code and not re.fullmatch(r"[a-z0-9-]+", code):
        raise DataError("site.toml, goatcounter: use just the code, e.g. \"soham\" for soham.goatcounter.com")
    return code


# Fixed version of GoatCounter's script with its checksum: the browser refuses to run it if it
# is ever altered. (Versions and checksums: https://www.goatcounter.com/help/countjs-versions)
GOATCOUNTER_SRI = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ"


def render_counter(site):
    code = goatcounter_code(site)
    if not code:
        return "<!-- The visit counter appears here when goatcounter is set in data/site.toml -->"
    return (
        '<p class="visits" hidden>'
        f'{ICON.format("eye")}<span class="visits-number"></span> <span class="visits-label">visits</span></p>\n'
        f'<script data-goatcounter="https://{code}.goatcounter.com/count" async src="https://gc.zgo.at/count.v5.js"\n'
        f'        crossorigin="anonymous" integrity="{GOATCOUNTER_SRI}"></script>\n'
        f'<script src="script/visits.js" data-code="{code}" defer></script>'
    )


def render_privacy(site):
    if goatcounter_code(site):
        return ('<p>This site uses no cookies. Visits are counted with '
                '<a href="https://www.goatcounter.com/">GoatCounter</a>, which doesn\'t collect '
                'personal data; the total is shown at the bottom of the home page.</p>')
    return "<p>This site doesn't use cookies, analytics or tracking.</p>"


def render_csp(site):
    """Content-Security-Policy: only this site, Google Fonts and (if switched on) GoatCounter."""
    code = goatcounter_code(site)
    counter = f" https://{code}.goatcounter.com" if code else ""
    policy = "; ".join([
        "default-src 'self'",
        "script-src 'self'" + (" https://gc.zgo.at" if code else ""),
        "style-src 'self' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com",
        "img-src 'self'" + counter,
        "connect-src 'self'" + counter,
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
        "upgrade-insecure-requests",
    ])
    return f'<meta http-equiv="Content-Security-Policy" content="{policy}">'


# ---- Put it together ---------------------------------------------------------------

LEGAL = ROOT / "legal.html"


def fill(page, name, content, filename="index.html"):
    pattern = re.compile(rf"^([ \t]*)<!-- BEGIN:{name} -->\n.*?^[ \t]*<!-- END:{name} -->",
                         re.DOTALL | re.MULTILINE)
    match = pattern.search(page)
    if not match:
        raise DataError(f"{filename}: markers <!-- BEGIN:{name} --> / <!-- END:{name} --> not found")
    indent = match.group(1)
    body = "\n".join(indent + line if line else line for line in content.splitlines())
    block = f"{indent}<!-- BEGIN:{name} -->\n{body}\n{indent}<!-- END:{name} -->"
    return page[:match.start()] + block + page[match.end():]


def build():
    """Return {path: new text} for every page build.py looks after."""
    site = load("site.toml")
    people = load("people.toml")
    page = INDEX.read_text(encoding="utf-8")
    page = fill(page, "publications", render_publications(site, people))
    page = fill(page, "teaching", render_teaching())
    page = fill(page, "talks", render_talks())
    page = fill(page, "cv-nav", render_cv(site, "nav"))
    page = fill(page, "cv-social", render_cv(site, "social"))
    page = fill(page, "counter", render_counter(site))
    page = fill(page, "csp", render_csp(site))
    legal = fill(LEGAL.read_text(encoding="utf-8"), "privacy", render_privacy(site), "legal.html")
    legal = fill(legal, "csp", render_csp(site), "legal.html")
    return {INDEX: page, LEGAL: legal}


def main():
    try:
        pages = build()
    except DataError as err:
        sys.exit(f"Error: {err}")
    stale = [path for path, text in pages.items() if path.read_text(encoding="utf-8") != text]
    if "--check" in sys.argv:
        if stale:
            sys.exit(f"{', '.join(p.name for p in stale)} out of date: run  python3 build.py")
        print("Pages are up to date.")
        return
    for path in stale:
        path.write_text(pages[path], encoding="utf-8")
        print(f"Updated {path.name}.")
    if not stale:
        print("Pages were already up to date.")


if __name__ == "__main__":
    main()

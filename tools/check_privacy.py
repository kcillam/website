#!/usr/bin/env python3
"""Check the website's privacy protections.

    python3 tools/check_privacy.py          check the files on this computer
    python3 tools/check_privacy.py --live   check the published site

Checks: the crawler rules in robots.txt, the image-indexing tag on the home page, and that
the public profile photo is small and carries no metadata. Standard-library Python only.
"""
import re
import sys
import urllib.error
import urllib.request
import urllib.robotparser
from pathlib import Path

LIVE = "--live" in sys.argv
SITE = "https://kcillam.github.io/website/"
ROBOTS_URL = "https://kcillam.github.io/robots.txt"
HERE = Path(__file__).resolve().parent.parent           # the website folder
ROBOTS_FILE = HERE.parent / "kcillam.github.io" / "robots.txt"

PAGE, PHOTO, LOGO = "/website/", "/website/images/profile.webp", "/website/images/logo.svg"
TRAINING = ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Applebot-Extended",
            "meta-externalagent", "Amazonbot", "Bytespider", "ImagesiftBot"]
SEARCH = ["Googlebot", "bingbot", "Googlebot-Image", "OAI-SearchBot", "Claude-SearchBot",
          "PerplexityBot", "Amzn-SearchBot", "FacebookExternalHit"]
failures = []


def check(ok, message):
    print(("  ok    " if ok else "  FAIL  ") + message)
    if not ok:
        failures.append(message)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 privacy-check"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as err:
        return err.code, b""


def read(local_path, url):
    return fetch(url)[1] if LIVE else Path(local_path).read_bytes()


print("robots.txt", "(live)" if LIVE else f"({ROBOTS_FILE})")
robots = urllib.robotparser.RobotFileParser()
robots.parse(read(ROBOTS_FILE, ROBOTS_URL).decode("utf-8").splitlines())
for bot in TRAINING:
    check(not robots.can_fetch(bot, PAGE), f"{bot} (AI training) is asked to stay out")
for bot in SEARCH:
    check(robots.can_fetch(bot, PAGE), f"{bot} may read the pages")
    check(not robots.can_fetch(bot, PHOTO), f"{bot} is asked not to fetch the profile photo")
check(robots.can_fetch("Googlebot-Image", LOGO), "other images (logo) stay crawlable")

print("Home page")
html = read(HERE / "index.html", SITE).decode("utf-8")
robots_meta = (re.search(r'<meta name="robots" content="([^"]*)"', html) or [None, ""])[1]
check("noimageindex" in robots_meta, "noimageindex: images on the page are not indexed")
check("max-image-preview:none" in robots_meta, "max-image-preview:none: no photo thumbnail in results")
check("noindex" not in robots_meta.replace("noimageindex", ""), "the page itself stays indexable")
check('src="images/profile.webp"' in html, "the page shows images/profile.webp")
og = (re.search(r'<meta property="og:image" content="([^"]*)"', html) or [None, ""])[1]
check("profile" not in og and "me.jpg" not in og, "link previews do not use the photo")

print("Profile photo")
photo = read(HERE / "images/profile.webp", SITE + "images/profile.webp")
check(photo[:4] == b"RIFF" and photo[8:12] == b"WEBP", "it is a WebP image")
chunks, i = [], 12
while i + 8 <= len(photo):
    size = int.from_bytes(photo[i + 4:i + 8], "little")
    chunks.append(photo[i:i + 4].decode("latin1"))
    i += 8 + size + (size & 1)
check(not {"EXIF", "XMP ", "ICCP"} & set(chunks), f"no metadata (chunks: {', '.join(chunks)})")
if "VP8 " in chunks:
    start = photo.index(b"VP8 ") + 8
    width = int.from_bytes(photo[start + 6:start + 8], "little") & 0x3FFF
    height = int.from_bytes(photo[start + 8:start + 10], "little") & 0x3FFF
    check(max(width, height) <= 720, f"web size only ({width}x{height})")
if LIVE:
    check(fetch(SITE + "images/me.jpg")[0] == 404, "the old full-size photo is no longer served")
else:
    check(not (HERE / "images/me.jpg").exists(), "the old full-size photo is not in the site files")

print("\nAll checks passed." if not failures else f"\n{len(failures)} check(s) failed.")
sys.exit(1 if failures else 0)

#!/bin/sh
# Make the public profile photo from any photo of you.
#
#   sh tools/make-profile-image.sh /path/to/photo.jpg
#
# Writes images/profile.webp: the centre square (exactly what the round frame on the
# page shows), resized to 720x720, with all metadata (EXIF, GPS, camera, colour profile)
# removed. Nothing is uploaded anywhere; it only uses sips (built into macOS) and cwebp.
set -eu

src="$1"
out="$(dirname "$0")/../images/profile.webp"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

w=$(sips -g pixelWidth "$src" | awk '/pixelWidth/ {print $2}')
h=$(sips -g pixelHeight "$src" | awk '/pixelHeight/ {print $2}')
side=$(( w < h ? w : h ))

sips --cropToHeightWidth "$side" "$side" -s format png "$src" --out "$tmp/square.png" >/dev/null
sips --resampleHeightWidth 720 720 "$tmp/square.png" >/dev/null
cwebp -quiet -q 86 -metadata none "$tmp/square.png" -o "$out"

echo "Wrote $out ($(wc -c < "$out" | tr -d ' ') bytes)"

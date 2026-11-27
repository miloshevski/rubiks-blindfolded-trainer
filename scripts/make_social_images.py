"""Draws the site's social preview and icons into web/public (they are served from the site root).

    python3 scripts/make_social_images.py

  og.png               1200x630 link preview (Open Graph / Twitter / Instagram share cards)
  apple-touch-icon.png 180x180  home-screen icon
  favicon-32.png       32x32    browser tab icon
  icon-192.png, icon-512.png, icon-maskable-512.png   app icons of the web manifest (installable app)

Re-run it after changing the look; the PNGs are committed so the server just serves them.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from bld.cube import apply_alg, solved_state  # noqa: E402
from bld.render import facelets  # noqa: E402

OUT = os.path.join(os.path.dirname(__file__), "..", "web", "public")
BG, RAISE, RULE = "#0c0d0e", "#141517", "#2a2c30"
INK, INK2, INK3, ACCENT = "#ece9e2", "#a4a29c", "#85827c", "#f2b33d"
FACE = {"U": "#edebe6", "D": "#f5cb3a", "F": "#1f9d55", "B": "#2f64de", "R": "#d23b30", "L": "#ef8726"}
NET = {"U": (1, 0), "L": (0, 1), "F": (1, 1), "R": (2, 1), "B": (3, 1), "D": (1, 2)}
SCRAMBLE = "D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'"
SS = 2      # draw at 2x and shrink, for smooth edges

SANS_BOLD = "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf"
SANS = "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf"
MONO_BOLD = "/usr/share/fonts/liberation-mono-fonts/LiberationMono-Bold.ttf"
MONO = "/usr/share/fonts/liberation-mono-fonts/LiberationMono-Regular.ttf"


def font(path, size):
    return ImageFont.truetype(path, size * SS)


def rect(d, box, fill=None, outline=None, width=1, radius=0):
    d.rounded_rectangle([v * SS for v in box], radius=radius * SS, fill=fill, outline=outline, width=width * SS)


def text(d, xy, s, f, fill):
    d.text((xy[0] * SS, xy[1] * SS), s, font=f, fill=fill)


def mark(d, x, y, size):
    """The brand mark: a 3x3 grid of outlined squares with a filled centre."""
    cell, pitch = size * 0.244, size * 0.322
    for r in range(3):
        for c in range(3):
            x0, y0 = x + c * pitch + size * 0.055, y + r * pitch + size * 0.055
            box = (x0, y0, x0 + cell, y0 + cell)
            if (r, c) == (1, 1):
                rect(d, box, fill=ACCENT, radius=size * 0.04)
            else:
                rect(d, box, outline=ACCENT, width=max(1, round(size * 0.065)), radius=size * 0.04)


def og():
    img = Image.new("RGB", (1200 * SS, 630 * SS), BG)
    d = ImageDraw.Draw(img)
    rect(d, (24, 24, 1176, 606), outline=RULE, width=2, radius=14)

    mark(d, 72, 70, 40)
    text(d, (124, 74), "BLINDFOLD TRAINER", font(MONO_BOLD, 24), INK2)

    h = font(SANS_BOLD, 64)
    text(d, (68, 156), "Solve the cube", h, INK)
    text(d, (68, 236), "without looking.", h, ACCENT)
    s = font(SANS, 29)
    text(d, (72, 348), "Free tutorial, memo and solution,", s, INK2)
    text(d, (72, 388), "3D replay, letter drills and a timer.", s, INK2)

    x = 72
    cf = font(MONO_BOLD, 22)
    for label in ("M2 edges", "Old Pochmann", "Speffz"):
        w = d.textlength(label, font=cf) / SS + 36
        rect(d, (x, 462, x + w, 508), fill=RAISE, outline=RULE, width=2, radius=8)
        text(d, (x + 18, 472), label, cf, INK)
        x += w + 14
    text(d, (72, 548), "3bld.xyz", font(MONO, 26), INK3)

    # the net of a real scrambled cube
    state = facelets(apply_alg(solved_state(), SCRAMBLE))
    cell, gap, fgap = 29, 3, 8
    face = 3 * cell + 2 * gap
    ox = 1128 - (4 * face + 3 * fgap)
    oy = 315 - (3 * face + 2 * fgap) // 2
    for f, (fx, fy) in NET.items():
        bx, by = ox + fx * (face + fgap), oy + fy * (face + fgap)
        for i, ch in enumerate(state[f]):
            r, c = divmod(i, 3)
            x0, y0 = bx + c * (cell + gap), by + r * (cell + gap)
            rect(d, (x0, y0, x0 + cell, y0 + cell), fill=FACE[ch], radius=4)
    return img.resize((1200, 630), Image.LANCZOS)


def icon(size, pad):
    big = size * 4
    img = Image.new("RGB", (big, big), BG)
    d = ImageDraw.Draw(img)
    inner = big - 2 * pad * 4
    pitch, cell = inner * 0.322, inner * 0.244
    stroke = max(2, round(inner * 0.07))
    for r in range(3):
        for c in range(3):
            x0 = pad * 4 + inner * 0.055 + c * pitch
            y0 = pad * 4 + inner * 0.055 + r * pitch
            box = (x0, y0, x0 + cell, y0 + cell)
            if (r, c) == (1, 1):
                d.rounded_rectangle(box, radius=inner * 0.04, fill=ACCENT)
            else:
                d.rounded_rectangle(box, radius=inner * 0.04, outline=ACCENT, width=stroke)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    og().save(os.path.join(OUT, "og.png"), optimize=True)
    icon(180, 26).save(os.path.join(OUT, "apple-touch-icon.png"), optimize=True)
    icon(32, 2).save(os.path.join(OUT, "favicon-32.png"), optimize=True)
    icon(192, 24).save(os.path.join(OUT, "icon-192.png"), optimize=True)
    icon(512, 64).save(os.path.join(OUT, "icon-512.png"), optimize=True)
    icon(512, 128).save(os.path.join(OUT, "icon-maskable-512.png"), optimize=True)   # drawn inside the 80% safe zone
    print("wrote", ", ".join(sorted(os.listdir(OUT))))

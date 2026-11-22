"""Build the GitHub profile README assets in the portfolio's visual style.

Usage:
  uv run --with fonttools,brotli,pillow python build_assets.py \
      <Geist.woff2> <GeistMono.woff2> <photo.jpg> <out_dir>

Geist / Geist Mono are variable fonts (OFL). Each SVG embeds only the glyphs
it uses, as base64 WOFF2, because GitHub serves README images as <img>,
which cannot load web fonts.
"""

import base64
import io
import sys
from pathlib import Path
from xml.sax.saxutils import escape

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageEnhance, ImageOps

SANS_PATH, MONO_PATH, PHOTO_PATH, OUT = sys.argv[1:5]
OUT_DIR = Path(OUT)
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Portfolio tokens (app/globals.css)
THEMES = {
    "light": {"bg": "#f3efdd", "ink": "#0e100f", "muted": "#666666"},
    "dark": {"bg": "#0e100f", "ink": "#f3efdd", "muted": "#a1a1aa"},
}


class Face:
    def __init__(self, path: str, wght: int, family: str):
        self.family = family
        self.font = instancer.instantiateVariableFont(TTFont(path), {"wght": wght})
        self.cmap = self.font.getBestCmap()
        self.hmtx = self.font["hmtx"]
        self.upm = self.font["head"].unitsPerEm

    def width(self, text: str, size: float, tracking: float = 0) -> float:
        adv = sum(self.hmtx[self.cmap[ord(c)]][0] for c in text)
        return adv * size / self.upm + tracking * len(text)

    def font_face(self, chars: set[str]) -> str:
        buf = io.BytesIO()
        self.font.save(buf)
        font = TTFont(io.BytesIO(buf.getvalue()))
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["kern", "liga"]
        sub = subset.Subsetter(opts)
        sub.populate(text="".join(sorted(chars)))
        sub.subset(font)
        out = io.BytesIO()
        font.flavor = "woff2"
        font.save(out)
        b64 = base64.b64encode(out.getvalue()).decode()
        return (
            f"@font-face{{font-family:'{self.family}';"
            f"src:url(data:font/woff2;base64,{b64}) format('woff2');}}"
        )


BLACK = Face(SANS_PATH, 900, "FWC Black")
SEMI = Face(SANS_PATH, 600, "FWC Semi")
BOLD = Face(SANS_PATH, 700, "FWC Bold")
BODY = Face(SANS_PATH, 400, "FWC Body")
MONO = Face(MONO_PATH, 600, "FWC Mono")


class Svg:
    def __init__(self, w: float, h: float, label: str):
        self.w, self.h, self.label = w, h, label
        self.parts: list[str] = []
        self.used: dict[Face, set[str]] = {}

    def add(self, s: str):
        self.parts.append(s)

    def text(self, x, y, s, face: Face, size, fill, tracking=0, anchor="start", opacity=None):
        self.used.setdefault(face, set()).update(s)
        op = f' fill-opacity="{opacity}"' if opacity is not None else ""
        self.add(
            f'<text x="{x:.1f}" y="{y:.1f}" font-family="{face.family}" font-size="{size}" '
            f'letter-spacing="{tracking}" text-anchor="{anchor}" fill="{fill}"{op}>{escape(s)}</text>'
        )

    def render(self) -> str:
        faces = "".join(f.font_face(chars) for f, chars in self.used.items())
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w:.0f}" height="{self.h:.0f}" '
            f'viewBox="0 0 {self.w:.0f} {self.h:.0f}" role="img" aria-label="{escape(self.label)}">'
            f"<style>{faces}</style>" + "".join(self.parts) + "</svg>\n"
        )


def save(name: str, svg: Svg):
    (OUT_DIR / name).write_text(svg.render(), encoding="utf-8")


def photo_data_uri(w: int, h: int) -> str:
    """Grayscale, contrast-boosted crop at 56% horizontally, like the hero."""
    im = ImageOps.exif_transpose(Image.open(PHOTO_PATH)).convert("L")
    target = w / h
    iw, ih = im.size
    if iw / ih > target:
        cw = int(ih * target)
        left = int((iw - cw) * 0.56)
        im = im.crop((left, 0, left + cw, ih))
    else:
        ch = int(iw / target)
        top = (ih - ch) // 2
        im = im.crop((0, top, iw, top + ch))
    im = ImageEnhance.Contrast(im.resize((w * 2, h * 2), Image.LANCZOS)).enhance(1.25)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=78, optimize=True, progressive=True)  # no EXIF carried over
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------- banner
def banner(theme: str, photo: str):
    t = THEMES[theme]
    bg, ink, muted = t["bg"], t["ink"], t["muted"]
    W, H, X = 1000, 356, 40
    s = Svg(W, H, "Franze William Calleja — Full-Stack Software Engineer")
    s.add(f'<rect width="{W}" height="{H}" fill="{bg}"/>')
    s.add(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" fill="none" stroke="{ink}" stroke-opacity="0.15"/>')

    # top bar: "FWC / ..." + rule, as in the portfolio header
    s.text(X, 40, "FWC / PORTFOLIO", MONO, 12, ink, tracking=1.7)
    s.text(W - X, 40, "FRANZECALLEJA.VERCEL.APP", MONO, 12, ink, tracking=1.7, anchor="end")
    s.add(f'<rect x="{X}" y="56" width="{W - 2*X}" height="1" fill="{ink}" fill-opacity="0.2"/>')

    s.text(X, 104, "CANDELARIA, QUEZON / AVAILABLE FOR SELECT WORK", MONO, 12, muted, tracking=1.9)
    s.text(X, 168, "FRANZE WILLIAM", BLACK, 62, ink, tracking=-1.6)
    s.text(X, 224, "CALLEJA", BLACK, 62, ink, tracking=-1.6)
    s.text(X, 266, "FULL-STACK SOFTWARE ENGINEER", SEMI, 20, ink, tracking=0.6)
    s.add(f'<rect x="{X}" y="290" width="2" height="34" fill="{ink}"/>')
    s.text(X + 16, 312, "Production web, mobile, and AI systems, built and run end to end.",
           BODY, 15, ink, opacity=0.8)

    # photo frame with corner brackets
    fx, fy, fw, fh = 760, 80, 200, 250
    s.add(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" fill="{ink}" fill-opacity="0.08" '
          f'stroke="{ink}" stroke-opacity="0.7"/>')
    c, o = 18, 3
    for cx, cy, dx, dy in ((fx - o, fy - o, 1, 1), (fx + fw + o, fy - o, -1, 1),
                           (fx - o, fy + fh + o, 1, -1), (fx + fw + o, fy + fh + o, -1, -1)):
        s.add(f'<path d="M{cx} {cy + dy*c}V{cy}H{cx + dx*c}" fill="none" stroke="{ink}" stroke-width="2"/>')
    px, py, pw, ph = fx + 10, fy + 10, fw - 20, fh - 20
    s.add(f'<defs><clipPath id="p"><rect x="{px}" y="{py}" width="{pw}" height="{ph}"/></clipPath>'
          f'<linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="{ink}" stop-opacity="0.4"/>'
          f'<stop offset="0.5" stop-color="{ink}" stop-opacity="0"/></linearGradient>'
          # top scrim so the overlay text stays legible over the bright ceiling light
          f'<linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ink}" stop-opacity="0.7"/>'
          f'<stop offset="0.4" stop-color="{ink}" stop-opacity="0"/></linearGradient></defs>')
    s.add(f'<g clip-path="url(#p)"><rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="{ink}"/>'
          f'<image href="{photo}" x="{px}" y="{py}" width="{pw}" height="{ph}" preserveAspectRatio="xMidYMid slice"/>'
          f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="url(#g)"/>'
          f'<rect x="{px}" y="{py}" width="{pw}" height="{ph}" fill="url(#t)"/></g>')
    for i, line in enumerate(["<build />", "arch: fullstack", "infra: cloud", "status: online", "deploy: ready"]):
        s.text(px + 9, py + 18 + i * 13, line, MONO, 8.5, bg, opacity=0.85)
    caret_x = px + 9 + MONO.width("deploy: ready", 8.5) + 3
    s.add(f'<rect x="{caret_x:.1f}" y="{py + 18 + 4*13 - 7.5}" width="5" height="9" fill="{bg}" fill-opacity="0.6">'
          f'<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/></rect>')
    tag = "macOS · M5"
    tw = MONO.width(tag, 8) + 12
    tx, ty = px + pw - 8 - tw, py + ph - 8 - 17
    s.add(f'<rect x="{tx:.1f}" y="{ty}" width="{tw:.1f}" height="17" fill="{bg}" stroke="{bg}" stroke-opacity="0.7"/>')
    s.text(tx + 6, ty + 11.5, tag, MONO, 8, ink)
    save(f"banner-{theme}.svg", s)


# ------------------------------------------------------- section headers
HEADERS = {
    "about": ("ABOUT", "HI, I'M FRANZE", "CANDELARIA, QUEZON · PH"),
    "projects": ("RECENT PROJECTS", "FEATURED PROJECTS", "4 OF 10"),
    "stack": ("TECH STACK", "TECHNICAL ARSENAL", "DAILY DRIVERS"),
}


def header(key: str, theme: str):
    t = THEMES[theme]
    eyebrow, title, meta = HEADERS[key]
    W, H = 1000, 80
    s = Svg(W, H, title.title())
    s.text(0, 22, eyebrow, MONO, 11, t["muted"], tracking=1.8)
    s.text(0, 60, title, BLACK, 32, t["ink"], tracking=-0.6)
    s.text(W, 60, meta, MONO, 11, t["ink"], tracking=1.6, anchor="end", opacity=0.75)
    s.add(f'<rect x="0" y="{H-2}" width="{W}" height="1" fill="{t["ink"]}" fill-opacity="0.35"/>')
    save(f"header-{key}-{theme}.svg", s)


# ---------------------------------------------------------------- buttons
ICONS = {  # lucide (ISC), 24x24 viewBox, stroke icons
    "calendar": '<path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    "mail": '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>',
    "linkedin": '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>',
    "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
}
BUTTONS = {
    "call": ("BOOK A CALL", "calendar", True),
    "email": ("SEND EMAIL", "mail", False),
    "linkedin": ("LINKEDIN", "linkedin", False),
    "portfolio": ("PORTFOLIO", "globe", False),
}


def button(key: str, theme: str):
    t = THEMES[theme]
    label, icon, primary = BUTTONS[key]
    size, track, pad, gap, isz, H = 12, 1.44, 16, 8, 16, 46
    W = round(pad + isz + gap + BOLD.width(label, size, track) - track + pad)
    s = Svg(W, H, label.title())
    fg = t["bg"] if primary else t["ink"]
    if primary:
        s.add(f'<rect width="{W}" height="{H}" fill="{t["ink"]}"/>')
    else:
        s.add(f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" fill="none" stroke="{t["ink"]}" stroke-opacity="0.55"/>')
    s.add(f'<g transform="translate({pad} {(H-isz)/2}) scale({isz/24})" fill="none" stroke="{fg}" '
          f'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICONS[icon]}</g>')
    s.text(pad + isz + gap, H / 2 + 4.3, label, BOLD, size, fg, tracking=track)
    save(f"btn-{key}-{theme}.svg", s)


photo = photo_data_uri(180, 230)
for th in THEMES:
    banner(th, photo)
    for k in HEADERS:
        header(k, th)
    for k in BUTTONS:
        button(k, th)
for p in sorted(OUT_DIR.glob("*.svg")):
    print(f"{p.name:32} {p.stat().st_size/1024:6.1f} KB")

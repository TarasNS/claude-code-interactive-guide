#!/usr/bin/env python3
"""Check web files against the Nordic Solar brand rules in ns-web-brand/SKILL.md.

Usage:
    python brand_check.py PATH [PATH ...]      # files or directories (css, html, js, svg)

Errors (exit code 1):
  - a colour literal that is not an approved brand value
  - a tint that is not written as color-mix(...) or rgb(... / alpha) of an approved value
  - a web-font import (@import url, Google Fonts, <link> to a font service) or @font-face to a remote URL
  - a font-family stack that does not start with Aptos / "Aptos Mono" (var() stacks are checked where defined)
  - an emoji or pictograph character
  - a gradient

Also prints the WCAG contrast table for the approved palette.
"""
import io
import os
import re
import sys

APPROVED = {"#1A5C00", "#1C1C1C", "#F4F2EB", "#FFFFFF", "#000000"}
PALETTE = {"green": "#1A5C00", "almost-black": "#1C1C1C", "off-white": "#F4F2EB", "white": "#FFFFFF", "black": "#000000"}
EXTS = {".css", ".html", ".htm", ".js", ".svg"}
EMOJI = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️]")
HEX = re.compile(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b")
FUNC = re.compile(r"\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(", re.I)
NAMED = re.compile(
    r"(?<![-\w#.])(red|blue|green|yellow|orange|purple|pink|teal|cyan|magenta|gold|amber|lime|navy|maroon|"
    r"olive|aqua|silver|gray|grey|brown|coral|crimson|indigo|violet|turquoise|beige)(?![-\w])", re.I)
CSS_PROP_COLOR = re.compile(r"(color|background|border[-\w]*|fill|stroke|outline[-\w]*|box-shadow)\s*:\s*([^;}{]+)", re.I)


def lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def files(paths):
    for p in paths:
        if os.path.isdir(p):
            for root, dirs, fs in os.walk(p):
                dirs[:] = [d for d in dirs if d not in ("node_modules", ".git")]
                for f in fs:
                    if os.path.splitext(f)[1].lower() in EXTS:
                        yield os.path.join(root, f)
        elif os.path.isfile(p):
            yield p


def strip_comments(text, ext):
    if ext in (".css",):
        return re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)
    return text


def check(path):
    errs = []
    ext = os.path.splitext(path)[1].lower()
    text = strip_comments(io.open(path, encoding="utf-8", errors="replace").read(), ext)
    is_tokens = os.path.basename(path).lower() in ("tokens.css",)
    for n, line in enumerate(text.split("\n"), 1):
        for m in HEX.finditer(line):
            h = m.group(0).upper()
            if h not in APPROVED:
                errs.append((n, "off-palette colour %s" % m.group(0)))
            elif not is_tokens and ext == ".css":
                errs.append((n, "hex colour %s outside tokens.css; use a var(--token)" % m.group(0)))
        for m in FUNC.finditer(line):
            rest = line[m.start():]
            if m.group(1).lower() in ("rgb", "rgba") and "/" in rest[:60] and re.search(r"rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)", rest):
                nums = tuple(int(x) for x in re.search(r"rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)", rest).groups())
                approved_rgb = {tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in APPROVED}
                if nums not in approved_rgb:
                    errs.append((n, "rgb() with alpha of a non-approved colour %s" % (nums,)))
            else:
                errs.append((n, "%s() is not an approved way to write a colour or tint" % m.group(1)))
        if "color-mix(" in line:
            for arg in re.findall(r"color-mix\([^)]*\)", line):
                bad = [w for w in NAMED.findall(arg)]
                if bad:
                    errs.append((n, "color-mix() uses a named colour: %s" % ", ".join(bad)))
        for m in CSS_PROP_COLOR.finditer(line):
            value = m.group(2)
            if "var(" in value or "color-mix(" in value:
                value = re.sub(r"var\([^)]*\)|color-mix\([^)]*\)", "", value)
            for w in NAMED.findall(value):
                errs.append((n, "named colour %r in %s; use a brand token" % (w, m.group(1))))
        if re.search(r"-gradient\(", line, re.I):
            errs.append((n, "gradients are not allowed by the brand"))
        if re.search(r"@import\s+url\(|fonts\.googleapis|fonts\.gstatic|use\.typekit|font-awesome", line, re.I):
            errs.append((n, "web-font or icon-font service; the brand forbids web fonts"))
        if re.search(r"@font-face", line, re.I):
            errs.append((n, "@font-face found; do not embed fonts unless a web-font licence is confirmed"))
        m = re.search(r"font-family\s*:\s*([^;}{]+)", line, re.I)
        if m:
            fam = m.group(1).strip()
            if not fam.lower().startswith(("var(", "inherit", "aptos", '"aptos', "'aptos", "ui-monospace")):
                errs.append((n, "font-family should start with Aptos (or Aptos Mono for code): %s" % fam[:60]))
        for m in re.finditer(r"--font-(?:ui|mono)\s*:\s*([^;}{]+)", line):
            val = m.group(1).strip().lstrip("\"'")
            if not val.lower().startswith("aptos"):
                errs.append((n, "font token must start with Aptos / Aptos Mono: %s" % val[:50]))
        if EMOJI.search(line):
            errs.append((n, "emoji or pictograph character; use a monochrome inline SVG"))
    return errs


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    total = 0
    for p in files(argv):
        errs = check(p)
        total += len(errs)
        if errs:
            print("FAIL " + p)
            for n, msg in errs:
                print("  line %d: %s" % (n, msg))
        else:
            print("PASS " + p)
    print("\nWCAG contrast for the approved palette:")
    pairs = [("white", "almost-black"), ("almost-black", "white"), ("almost-black", "off-white"),
             ("white", "green"), ("green", "off-white"), ("green", "almost-black")]
    for fg, bg in pairs:
        r = ratio(PALETTE[fg], PALETTE[bg])
        note = "  <-- below 3:1: never for focus, borders or icons" if r < 3 else ""
        print("  %-12s on %-12s %5.2f:1%s" % (fg, bg, r, note))
    print("\n%d error(s)" % total)
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

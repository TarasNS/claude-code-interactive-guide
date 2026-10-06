#!/usr/bin/env python3
"""CI static checks (spec 17.1): palette, forbidden code, emoji. Standard library only."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOKENS = Path("css/tokens.css")

APPROVED_HEX = {"#1a5c00", "#1c1c1c", "#f4f2eb", "#ffffff", "#000000"}
NAMED_COLOURS = (
    "red|green|blue|yellow|orange|purple|pink|teal|cyan|magenta|gray|grey|brown|gold|navy|lime|"
    "olive|maroon|aqua|fuchsia|silver|violet|indigo|crimson|coral|salmon|khaki|beige|tan|mustard|"
    "amber|white|black"
)

HEX_RE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
FUNC_RE = re.compile(r"\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(([^)]*)\)", re.I)
NAMED_RE = re.compile(r"(?<![\w#-])(%s)(?![\w-])" % NAMED_COLOURS, re.I)
COLOUR_PROP_RE = re.compile(
    r"(color|background(?:-color)?|border(?:-[a-z]+)*(?:-color)?|outline(?:-color)?|fill|stroke|box-shadow|text-shadow)\s*:\s*([^;}{]*)",
    re.I,
)
MIX_RE = re.compile(r"color-mix\(\s*in srgb\s*,[^;]*\)", re.I)

FORBIDDEN_CODE = [
    (r"\bfetch\s*\(", "fetch() call"),
    (r"XMLHttpRequest", "XMLHttpRequest"),
    (r"WebSocket", "WebSocket"),
    (r"sendBeacon", "sendBeacon"),
    (r"\beval\s*\(", "eval()"),
    (r"new\s+Function", "new Function"),
    (r"document\.write", "document.write"),
    (r"innerHTML", "innerHTML"),
    (r"outerHTML", "outerHTML"),
    (r"insertAdjacentHTML", "insertAdjacentHTML"),
    (r"javascript:", "javascript: URL"),
]
STYLE_ATTR_RE = re.compile(r"""<[^>]+\sstyle\s*=""", re.I)
EXTERNAL_REF_RE = re.compile(r"""<(?:script|link)\b[^>]*\b(?:src|href)\s*=\s*["']?(?:https?:)?//""", re.I)

EMOJI_RANGES = [(0x1F000, 0x1FAFF), (0x2600, 0x27BF), (0x2B00, 0x2BFF), (0xFE0F, 0xFE0F)]


def shipped_files():
    files = [ROOT / "index.html"]
    for folder, patterns in (("css", ("*.css",)), ("js", ("*.js",))):
        base = ROOT / folder
        if base.is_dir():
            for pattern in patterns:
                files.extend(sorted(base.rglob(pattern)))
    return [f for f in files if f.is_file()]


def strip_comments(text, suffix):
    if suffix == ".css":
        return re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)
    if suffix == ".js":
        text = re.sub(r"/\*.*?\*/", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)
        return re.sub(r"(?<![:\"'\\])//[^\n]*", "", text)
    return re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)


def line_of(text, index):
    return text.count("\n", 0, index) + 1


def check_palette(rel, text, errors):
    if rel == TOKENS.as_posix():
        for m in HEX_RE.finditer(text):
            if m.group(0).lower() not in APPROVED_HEX:
                errors.append(f"{rel}:{line_of(text, m.start())}: colour {m.group(0)} is not in the BRD-06 palette")
        return
    for m in HEX_RE.finditer(text):
        errors.append(f"{rel}:{line_of(text, m.start())}: colour literal {m.group(0)} outside css/tokens.css")
    for m in FUNC_RE.finditer(text):
        name, body = m.group(1).lower(), m.group(2)
        if name == "rgb" and "/" in body and re.fullmatch(r"\s*0\s+0\s+0\s*/\s*[\d.]+%?\s*", body):
            continue
        errors.append(f"{rel}:{line_of(text, m.start())}: colour function {m.group(0)} outside css/tokens.css (only rgb(0 0 0 / a) tints of an approved value are allowed)")
    if rel.endswith(".css"):
        for prop in COLOUR_PROP_RE.finditer(text):
            value = MIX_RE.sub("", prop.group(2))
            value = re.sub(r"var\([^)]*\)", "", value)
            for named in NAMED_RE.finditer(value):
                errors.append(f"{rel}:{line_of(text, prop.start())}: named colour '{named.group(1)}' is not allowed")
        for m in re.finditer(r"color-mix\([^;]*", text, flags=re.I):
            if not MIX_RE.match(m.group(0)):
                errors.append(f"{rel}:{line_of(text, m.start())}: tint must be color-mix(in srgb, ...)")


def check_forbidden(rel, text, errors):
    for pattern, label in FORBIDDEN_CODE:
        for m in re.finditer(pattern, text):
            errors.append(f"{rel}:{line_of(text, m.start())}: forbidden {label}")
    if rel.endswith(".html"):
        for m in STYLE_ATTR_RE.finditer(text):
            errors.append(f"{rel}:{line_of(text, m.start())}: style= attribute (SEC-02)")
        for m in EXTERNAL_REF_RE.finditer(text):
            errors.append(f"{rel}:{line_of(text, m.start())}: external script or link (SEC-04)")
    if rel.endswith(".js"):
        for m in re.finditer(r"setAttribute\(\s*['\"]style['\"]", text):
            errors.append(f"{rel}:{line_of(text, m.start())}: style attribute set from script (SEC-02)")


def check_emoji(rel, text, errors):
    for i, ch in enumerate(text):
        cp = ord(ch)
        if any(lo <= cp <= hi for lo, hi in EMOJI_RANGES):
            errors.append(f"{rel}:{line_of(text, i)}: emoji or pictograph U+{cp:04X}")


def main():
    errors = []
    files = shipped_files()
    if not files:
        print("static-checks: no shipped files found")
        return 1
    for path in files:
        rel = path.relative_to(ROOT).as_posix()
        raw = path.read_text(encoding="utf-8")
        check_emoji(rel, raw, errors)
        code = strip_comments(raw, path.suffix)
        check_palette(rel, code, errors)
        check_forbidden(rel, code, errors)
    if errors:
        print("static-checks: FAIL")
        for e in errors:
            print("  " + e)
        return 1
    print(f"static-checks: PASS ({len(files)} files)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

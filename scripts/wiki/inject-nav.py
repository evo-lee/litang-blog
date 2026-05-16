#!/usr/bin/env python3
"""Inject per-language nav block into each wiki page.

For each .md in <wiki-dir>, insert a horizontal nav listing all same-language
pages right after the first H1. Pages already containing a nav marker are
re-rewritten in place.

Usage: inject-nav.py <wiki-dir>
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

EN_ORDER = [
    ("Home", "Home"),
    ("Quick Start", "quick-start"),
    ("Installation", "installation"),
    ("Architecture", "architecture"),
    ("Content Pipeline", "content-pipeline"),
    ("Customization", "customization"),
    ("Deployment", "deployment"),
    ("AI Tools", "ai-tools"),
]
ZH_ORDER = [
    ("首页", "Home.zh-CN"),
    ("快速开始", "quick-start.zh-CN"),
    ("安装", "installation.zh-CN"),
    ("架构", "architecture.zh-CN"),
    ("内容管线", "content-pipeline.zh-CN"),
    ("自定义", "customization.zh-CN"),
    ("部署", "deployment.zh-CN"),
    ("AI 工具", "ai-tools.zh-CN"),
]

NAV_START = "<!-- nav:start -->"
NAV_END = "<!-- nav:end -->"
DOCTOC_START = "<!-- START doctoc generated TOC please keep comment here to allow auto update -->"
DOCTOC_NOTE = "<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->"
DOCTOC_END = "<!-- END doctoc generated TOC please keep comment here to allow auto update -->"

H1_RE = re.compile(r"^#\s+.+$")
NAV_BLOCK_RE = re.compile(
    rf"{re.escape(NAV_START)}.*?{re.escape(NAV_END)}\n?",
    re.DOTALL,
)
DOCTOC_BLOCK_RE = re.compile(
    rf"{re.escape(DOCTOC_START)}.*?{re.escape(DOCTOC_END)}\n?",
    re.DOTALL,
)


def is_zh(name: str) -> bool:
    return name.endswith(".zh-CN.md")


def build_nav(current_slug: str, is_chinese: bool) -> str:
    order = ZH_ORDER if is_chinese else EN_ORDER
    label = "📚 文档" if is_chinese else "📚 Docs"
    if is_chinese:
        en_slug = current_slug.replace(".zh-CN", "") or "Home"
        other_lang_link = f" · [English]({en_slug})"
    else:
        zh_slug = f"{current_slug}.zh-CN"
        other_lang_link = f" · [简体中文]({zh_slug})"

    parts = []
    for display, slug in order:
        if slug == current_slug:
            parts.append(f"**{display}**")
        else:
            parts.append(f"[{display}]({slug})")
    nav_line = " · ".join(parts)
    return f"{NAV_START}\n> **{label}**: {nav_line}{other_lang_link}\n{NAV_END}\n"


def inject(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    slug = path.stem
    is_chinese = is_zh(path.name)
    nav = build_nav(slug, is_chinese)
    doctoc_placeholder = f"{DOCTOC_START}\n{DOCTOC_NOTE}\n{DOCTOC_END}\n"

    # Strip any existing nav and doctoc blocks so we can place them deterministically.
    text = NAV_BLOCK_RE.sub("", original)
    text = DOCTOC_BLOCK_RE.sub("", text)

    lines = text.splitlines(keepends=True)
    h1_idx = None
    for i, line in enumerate(lines):
        if H1_RE.match(line.rstrip("\n")):
            h1_idx = i
            break

    block = f"\n{nav}\n{doctoc_placeholder}\n"
    if h1_idx is None:
        new_text = block + text
    else:
        insert_at = h1_idx + 1
        if insert_at < len(lines) and lines[insert_at].strip() == "":
            insert_at += 1
        new_text = "".join(lines[:insert_at]) + block + "".join(lines[insert_at:])

    if new_text != original:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: inject-nav.py <wiki-dir>", file=sys.stderr)
        return 2
    wiki_dir = Path(sys.argv[1])
    skip = {"_Sidebar.md", "_Footer.md"}
    for md in sorted(wiki_dir.glob("*.md")):
        if md.name in skip:
            continue
        inject(md)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

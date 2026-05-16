#!/usr/bin/env python3
"""Generate nested _Sidebar.md from H2 headings in wiki pages.

Usage: gen-sidebar.py <wiki-dir>
Output: writes to stdout.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Display order — files not listed are appended alphabetically at end of each lang block.
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

# Match doctoc-generated section so we skip it when extracting structural H2s.
DOCTOC_START = re.compile(r"<!--\s*START doctoc", re.I)
DOCTOC_END = re.compile(r"<!--\s*END doctoc", re.I)
H2 = re.compile(r"^##\s+(.+?)\s*$")
TOC_TITLES = {"目录", "Contents", "Table of Contents"}


def slugify(text: str) -> str:
    """Mimic GitHub anchor slug rules."""
    s = text.strip().lower()
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE)
    s = re.sub(r"\s+", "-", s)
    return s


def extract_h2(path: Path) -> list[str]:
    in_doctoc = False
    out: list[str] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if DOCTOC_START.search(line):
            in_doctoc = True
            continue
        if DOCTOC_END.search(line):
            in_doctoc = False
            continue
        if in_doctoc:
            continue
        m = H2.match(line)
        if m:
            title = m.group(1).strip()
            if title in TOC_TITLES:
                continue
            out.append(title)
    return out


def render_block(label: str, order: list[tuple[str, str]], wiki_dir: Path, open_default: bool) -> list[str]:
    open_attr = " open" if open_default else ""
    lines = [f"<details{open_attr}>", f"<summary><strong>{label}</strong></summary>", ""]
    for display, slug in order:
        path = wiki_dir / f"{slug}.md"
        lines.append(f"- [{display}]({slug})")
        if not path.exists():
            continue
        for h2 in extract_h2(path):
            anchor = slugify(h2)
            lines.append(f"  - [{h2}]({slug}#{anchor})")
    lines.extend(["", "</details>"])
    return lines


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: gen-sidebar.py <wiki-dir>", file=sys.stderr)
        return 2
    wiki_dir = Path(sys.argv[1])
    blocks = [
        render_block("English", EN_ORDER, wiki_dir, open_default=True),
        render_block("简体中文", ZH_ORDER, wiki_dir, open_default=False),
    ]
    print("\n\n".join("\n".join(b) for b in blocks))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

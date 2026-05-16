#!/usr/bin/env python3
"""Generate minimal _Sidebar.md.

Per-language nav lives inline at the top of each page (see inject-nav.py),
so the wiki global sidebar only needs language landing links.

Usage: gen-sidebar.py <wiki-dir>
Output: writes to stdout.
"""
from __future__ import annotations

import sys

SIDEBAR = """**Languages**

- [English](Home)
- [简体中文](Home.zh-CN)

---

Each page lists its own section navigation at the top.
"""


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: gen-sidebar.py <wiki-dir>", file=sys.stderr)
        return 2
    print(SIDEBAR, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

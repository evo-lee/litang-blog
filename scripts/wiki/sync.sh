#!/usr/bin/env bash
# Sync docs/ -> wiki working copy.
# Usage: scripts/wiki/sync.sh <wiki-checkout-dir>
# Requires: node, npx (doctoc), python3 (sidebar generator).
set -euo pipefail

WIKI_DIR="${1:?wiki dir required}"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCS_DIR="$REPO_ROOT/docs"

cd "$WIKI_DIR"

# 1. wipe synced pages (keep .git, _Footer.md if hand-edited; _Sidebar.md regenerated below)
find . -maxdepth 1 -name '*.md' ! -name '_Footer.md' -delete

# 2. copy docs
cp "$DOCS_DIR"/*.md .

# 3. README -> Home
[ -f README.md ] && mv README.md Home.md
[ -f README.zh-CN.md ] && mv README.zh-CN.md Home.zh-CN.md

# 4. rewrite cross-links
sed -i 's|README\.zh-CN\.md|Home.zh-CN.md|g; s|README\.md|Home.md|g' *.md

# 5. seed nav + doctoc placeholder right after each H1
python3 "$REPO_ROOT/scripts/wiki/inject-nav.py" .

# 6. doctoc fills the placeholder it found above
npx --yes doctoc --github --title '## 目录' *.md

# 7. regenerate minimal _Sidebar.md
python3 "$REPO_ROOT/scripts/wiki/gen-sidebar.py" . > _Sidebar.md

echo "Wiki sync done in $WIKI_DIR"

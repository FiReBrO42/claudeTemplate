#!/usr/bin/env python3
"""PreToolUse hook：物理級強制 04-knowledge-protocol.md §5 備份規則。

保護範圍：專案根 CLAUDE.md、.claude/harness/ 頂層 *.md（制度規則檔）。
不保護：lessons/ 子目錄（教訓新增屬預授權）、新建檔案（不算「修改」）、.bak 本身。
行為：對受保護檔案的 Edit/Write，若旁邊沒有同名 .bak 副本 → exit 2 擋下並提示先備份。
故障策略：fail-open——hook 自身出錯時放行，避免癱瘓全部工具。
"""
import json
import os
import sys


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if data.get("tool_name") not in ("Edit", "Write"):
        sys.exit(0)
    fp = (data.get("tool_input") or {}).get("file_path") or ""
    if not fp:
        sys.exit(0)
    proj = os.path.realpath(os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd())
    ap = os.path.realpath(fp)
    harness_dir = os.path.join(proj, ".claude", "harness")
    protected = ap == os.path.join(proj, "CLAUDE.md") or (
        os.path.dirname(ap) == harness_dir and ap.endswith(".md")
    )
    if not protected:
        sys.exit(0)
    if ap.endswith(".bak"):
        sys.exit(0)
    if not os.path.exists(ap):
        sys.exit(0)
    if os.path.exists(ap + ".bak"):
        sys.exit(0)
    print(
        "[harness 保護 hook] 依 .claude/harness/04-knowledge-protocol.md §5 備份規則：\n"
        "修改制度規則檔前必須先建立備份。請先執行：\n"
        f'  cp "{ap}" "{ap}.bak"\n'
        "修改完成、確認無誤後再刪除 .bak。（結構性修改另需 User 同意，見 04 §5 權限分級）",
        file=sys.stderr,
    )
    sys.exit(2)


main()

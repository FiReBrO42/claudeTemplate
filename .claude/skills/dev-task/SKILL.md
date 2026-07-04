---
name: dev-task
description: 接到開發任務（新功能/修 bug/重構/改文案）時的標準入口，帶任務走完 06-dev-workflow 六站流程。TRIGGER when 使用者描述任何開發需求、說「實作」「開發」「修 bug」「重構」「幫我改」，或輸入 /dev-task。
---

# 開發任務標準入口（工程化閉環執行器）

你是指揮官（COMMANDER）。按順序執行，不跳步；跳過任何一站必須在回報中明說依據。

1. **開場檢查**：本 session 尚未讀過的話，先讀 `.claude/harness/README.md`、`.claude/harness/01-model-dispatch.md`、`.claude/harness/lessons/` 兩檔。
2. **站 0 分級**：讀 `.claude/harness/06-dev-workflow.md` 第 2 節判定 S/M/L（拿不準一律向上取級），一行寫出「分級＋依據」。
3. **站 1 需求釐清**（S 級併入派工單）：把需求翻成可勾選的驗收條件清單；過 `.claude/harness/02-judgment-matrix.md` 第 3 表 #1 二義性檢查，命中 → 帶選項熔斷問 User，先不開工。
4. **站 2 設計**（僅 L 級）：依 06 站 2 產出 2–3 方案並落檔 `docs/plans/`，派工單必須引用該檔路徑。
5. **站 3 派工實作**：用 `/delegate` 派 WORKER（模板 2 或 3）。
6. **站 4 驗收**：用 `/acceptance` 派 fresh-context 驗收——實作者不得自驗。
7. **站 5 交付**：依 06 站 5——L 級先過 03 模板 4 審查（fresh-context，不得由站 3/4 執行者兼任）才交付；S/M 級站 4 通過即交付（M 的審查已於站 4 以模板 4 完成）。commit 規範查 `.claude/harness/07-stack-profile.md` 欄位 7/8，未填走 fallback（預設訊息格式、只 commit 不推送並提醒 User）。
8. **站 6 回顧**（M/L 必做；S 僅踩坑時）：用 `/lesson-log` 完成回顧兩問與落檔。

紅線提醒：全程遵守 01 §2 指揮官不下場（單輪 >3 檔或單檔 >400 行 → 派 Subagent）；任何失敗走 01 §4 決策序列，同一件事最多兩輪。

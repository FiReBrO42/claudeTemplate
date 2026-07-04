---
name: harness-init
description: 由 Harness 範本複製出的新專案的一次性初始化（重置專案綁定內容＋播種通用教訓）。TRIGGER when 專案剛複製了 harness 範本、使用者說「初始化範本」「套用範本」「新專案初始化」，或輸入 /harness-init。
---

# 範本初始化（重置＋播種）

前置：向 User 確認（訊息中未提供就先問）：① 新專案名？② PROJECT_TYPE（綠地/既有）？③ 技術棧（可答「待定」）？

0. **環境實測**：不可輕信環境快照——實測 git 狀態（未 init 則 `git init -b main`）、確認 `.claude/harness/` 檔案齊全（README、00–07、lessons/ 兩檔）與 `.claude/skills/` 六個 skill 目錄。
1. **重置專案綁定內容**（每檔改前 `cp 檔案 檔案.bak`，規則見 `.claude/harness/04-knowledge-protocol.md` §5）：
   - `.claude/harness/lessons/project-lessons.md` 清空為空殼（04 §3：專屬踩坑不跨專案沿用）
   - `.claude/harness/07-stack-profile.md` 全部欄位重置為 ⬜ 未填
   - grep 全套檔案中的舊專案名 → 一律改為新專案名
   - `.claude/harness/00-baseline.md` 檔頭技術棧欄位＋第 1 節參數表（PROJECT_NAME、PROJECT_TYPE）
   - `.claude/harness/05-handover-letter.md` 第四節未竟事項重置為新專案初始狀態（保留通用提醒）
2. **播種**（04 §3）：讀 `~/.claude/harness-global/general.md` → 與本專案 `lessons/general.md` 合併去重（同根因取描述較完整者）→ 寫入，檔頭註明播種日期與來源。
3. **隔離驗證**（01 §5，不得自驗）：派 fresh-context subagent read-back 全部改動檔案＋grep 確認無舊專案名殘留、無失效路徑，逐條回報 ✅/❌。
4. **回報**：改動清單（檔案＋行號）、播種條數、仍待 User 決定的事項。技術棧已知 → 接著執行 /stack-setup。

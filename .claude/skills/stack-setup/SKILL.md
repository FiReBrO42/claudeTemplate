---
name: stack-setup
description: 技術棧確定日的一次性補完：填驗證命令、07 技術棧設定檔與環境設定，讓整套 harness 切換為全驗證模式。TRIGGER when 使用者宣告技術棧已確定、要填驗證命令或補完清單，或輸入 /stack-setup。
---

# 技術棧補完（制度生效開關）

前置：向 User 確認兩件事（訊息中未提供就先問）：① 技術棧與版本？② 驗證命令（lint/test/build/dev）？

依 `.claude/harness/00-baseline.md` 第 4 節補完清單執行，**授權分界**：

1. **預授權，直接做**（每檔改前 `cp 檔案 檔案.bak`，規則見 `.claude/harness/04-knowledge-protocol.md` §5）：
   - `00-baseline.md` 檔頭技術棧欄位＋專案根 CLAUDE.md 首行（一行式摘要，07 例外二）
   - CLAUDE.md「驗證命令」區（**單一事實來源**，只填這裡）
   - `.claude/harness/07-stack-profile.md` 全部可確定欄位（⬜→✅；不確定的保持 ⬜＋備註原因）
2. **需核可，先提案再動手**：`.claude/settings.json` 專案 permissions、lint hook、`.gitignore` 增補——把擬定內容一次列給 User，核可後才執行。
3. **收尾**：勾銷 00 §4 清單項；回報「改了哪些檔案與行號＋仍保持 ⬜ 的欄位與原因」；確認無誤後刪除 .bak。

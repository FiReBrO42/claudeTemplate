---
name: acceptance
description: 對已完成的實作進行隔離驗收（06 站 4）。TRIGGER when 實作回報「完成」需要驗收、使用者說「驗收」「驗證這次改動」「檢查做得對不對」，或輸入 /acceptance。
---

# 隔離驗收（防閉環迭代核心）

1. **身分檢查**：驗收必須由 fresh-context Subagent 執行（CLAUDE.md 核心規則 2、`.claude/harness/01-model-dispatch.md` §5）。你若參與過該實作，只能主持、不得親驗。
2. **選深度**（`.claude/harness/06-dev-workflow.md` 站 4）：S 級輕量三項（read-back／驗證命令 exit 0／無夾帶改動）；M/L 完整版＝01 §5 對應手段＋`.claude/harness/02-judgment-matrix.md` 第 2 表逐條。
3. **派工**：按 `.claude/harness/03-delegation-templates.md` 模板 4 填實，發給 fresh-context WORKER（含【開工前必讀】lessons 兩檔、原派工單的目標與驗收條件）。
4. **判定**：回報必須逐條 ✅/❌＋證據行號——「整體看起來沒問題」不是驗收。任何 ❌ → 退回實作（06 站 3），計入 01 §4 失敗次數。
5. **驗證命令區為空時**（查專案根 CLAUDE.md「驗證命令」區）：依 06 站 4 通則——該項視同通過，但任務整體狀態降為「已實作、未驗證」，站 5 交付回報必須以此開頭並把「建立驗證命令」列為最高優先待辦。

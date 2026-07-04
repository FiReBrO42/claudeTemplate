# 通用教訓（團隊權威版）

> 本檔為**通用教訓的團隊權威版**（進 git）。與 `~/.claude/harness-global/general.md`（個人累積器）不一致時，**以本檔為準**。
> 寫入前必讀分流判準與格式：`../04-knowledge-protocol.md`

<!-- 播種紀錄：2026-07-04 bootstrap 時 ~/.claude/harness-global/ 尚無既有累積，無播種項目。以下條目為 bootstrap 過程中新產生，已同步雙寫至 harness-global。 -->

### 空專案的環境描述不可盡信，開工前先實地驗證
- 〔症狀〕工具環境宣稱「Is a git repository: true」，實際執行 git 命令回報 not a git repository
- 〔觸發條件/重現步驟〕在全新/空目錄啟動 agent session 時，環境快照可能與磁碟實況不符
- 〔根因〕環境快照生成時機與實際狀態有時間差或推斷誤差；快照是提示，不是事實
- 〔正確做法〕任何依賴環境前提的操作（git、套件管理器、建置工具）前，先用一條廉價命令實測（如 `git status`），以實測結果為準
- 〔判準〕通用
- 〔日期〕2026-07-04

### 並行 Subagent 部分失敗時總任務仍顯示完成，收報必須核對失敗清單
- 〔症狀〕並行派出 4 個審查 Subagent，其中 3 個因外部限制（session 用量上限）失敗，總任務仍回報「completed」並附部分結果，粗看像是全量結論
- 〔觸發條件/重現步驟〕以 parallel/workflow 機制派多個 Subagent，部分命中 rate limit / session limit / 逾時
- 〔根因〕並行框架把單一 agent 的失敗降級為空結果而不拋錯；「有結果」不等於「全量結果」
- 〔正確做法〕收到並行任務結果時，先核對「實際完成數 vs 派出數」與 failures/錯誤日誌；有缺漏時明確標註哪些視角未覆蓋並安排補位，不得把部分結果當成全面結論
- 〔判準〕通用
- 〔日期〕2026-07-04

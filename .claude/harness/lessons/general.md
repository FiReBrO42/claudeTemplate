# 通用教訓（團隊權威版）

> 本檔為**通用教訓的團隊權威版**（進 git）。與 `~/.claude/harness-global/general.md`（個人累積器）不一致時，**以本檔為準**。
> 寫入前必讀分流判準與格式：`../04-knowledge-protocol.md`

<!-- 播種紀錄：2026-07-04 bootstrap 時 ~/.claude/harness-global/ 尚無既有累積，無播種項目。以下條目為 bootstrap 過程中新產生，已同步雙寫至 harness-global。 -->
<!-- 播種紀錄：2026-07-05 invest 分支重置。來源 ~/.claude/harness-global/general.md（2 條）與本檔現有 2 條同根同源（同一 repo 傳承、根因一致），合併去重後無新增條目；2 條通用教訓保留。 -->

### 空專案的環境描述不可盡信，開工前先實地驗證
- 〔症狀〕工具環境宣稱「Is a git repository: true」，實際執行 git 命令回報 not a git repository
- 〔觸發條件/重現步驟〕在全新/空目錄啟動 agent session 時，環境快照可能與磁碟實況不符
- 〔根因〕環境快照生成時機與實際狀態有時間差或推斷誤差；快照是提示，不是事實
- 〔正確做法〕任何依賴環境前提的操作（git、套件管理器、建置工具）前，先用一條廉價命令實測（如 `git status`），以實測結果為準
- 〔判準〕通用
- 〔日期〕2026-07-04

### Vitest 預設 include glob 會誤抓專案內非 Vitest 的 *.test.mjs 檔並嘗試打包，導致 node: 內建模組解析失敗
- 〔症狀〕`vitest run` 報錯 `Cannot bundle Node.js built-in "node:test" imported from "xxx.test.mjs"`，即便該檔案從未被任何程式匯入、只打算給 `node --test` 單獨執行
- 〔觸發條件/重現步驟〕專案中同時存在 Vitest（測 .ts/.vue）與 `node --test`（測零依賴 .mjs 核心模組）雙 runner 分工時，Vitest 未設定 `test.include`，沿用預設 glob（含 `*.test.*`），把 `.mjs` 的 `node:test` 案例也掃進自己的測試檔案清單
- 〔根因〕Vitest 預設 include pattern 不分副檔名／runner 意圖，只認檔名符合 `*.test.*` 即納入；而該檔案 import 了 `node:test`，Vitest 打包時無法內嵌 Node 內建模組
- 〔正確做法〕雙 runner 分工時，在 `vitest.config.ts` 明確設定 `test.include`（如 `['src/**/*.test.ts']`）縮小範圍，把交給 `node --test` 的 `.mjs` 測試排除在 Vitest 掃描範圍外，而非事後用 `exclude` 逐檔排雷
- 〔判準〕通用
- 〔日期〕2026-07-05
- 〔來源專案〕invest（scaffold Vite+Vue3+TS+Pinia，整合既有零依賴 i18n 核心的雙 runner 測試時實際踩到）

### TypeScript Project References（composite:true）要求每個被引用專案的 include 涵蓋「所有」透過 import 拉進來的檔案，否則報 TS6307
- 〔症狀〕`vue-tsc -b`（或 `tsc -b`）報錯 `File 'xxx.ts' is not listed within the file list of project 'xxx.json'. Projects must list all files or use an 'include' pattern.`，但該檔案明明是被測試檔案正常 import 進來的原始碼
- 〔觸發條件/重現步驟〕拆分多個 tsconfig（如 app/node/vitest 三分）並用根 tsconfig.json 的 `references` + `vue-tsc -b`/`tsc -b` 建置模式跑型別檢查；某個子專案（如 tsconfig.vitest.json）的 `include` 只列測試檔案本身（如 `src/**/*.test.ts`），但測試檔案 import 了未被該 include 覆蓋、且屬於另一子專案 include 範圍的原始碼（如 `src/stores/i18n.ts`）
- 〔根因〕`composite:true` 啟用時，TS 的 `--build` 模式要求每個子專案宣告「完整檔案閉包」以支援跨專案增量建置；此模式下「透過 import 自動納入」的一般規則不再適用，未被 include 明確列出的檔案即報錯，即使該檔案存在於磁碟且可被其他子專案覆蓋
- 〔正確做法〕若不需要真正的跨專案增量建置（多數中小型專案的型別檢查用途皆不需要），**不要**用 `composite:true` + 根 tsconfig `references` + `-b` 建置模式；改為每個 tsconfig 各自獨立、用 `tsc/vue-tsc --noEmit -p tsconfig.X.json` 逐一呼叫（在 package.json script 用 `&&` 串接），此時「import 自動納入檔案」的一般規則恢復正常，不需要 include 覆蓋完整閉包
- 〔判準〕通用
- 〔日期〕2026-07-05
- 〔來源專案〕invest（scaffold 三分 tsconfig：app/node/vitest 時實際踩到）

### 並行 Subagent 部分失敗時總任務仍顯示完成，收報必須核對失敗清單
- 〔症狀〕並行派出 4 個審查 Subagent，其中 3 個因外部限制（session 用量上限）失敗，總任務仍回報「completed」並附部分結果，粗看像是全量結論
- 〔觸發條件/重現步驟〕以 parallel/workflow 機制派多個 Subagent，部分命中 rate limit / session limit / 逾時
- 〔根因〕並行框架把單一 agent 的失敗降級為空結果而不拋錯；「有結果」不等於「全量結果」
- 〔正確做法〕收到並行任務結果時，先核對「實際完成數 vs 派出數」與 failures/錯誤日誌；有缺漏時明確標註哪些視角未覆蓋並安排補位，不得把部分結果當成全面結論
- 〔判準〕通用
- 〔日期〕2026-07-04

# Harness 畢業考執行手冊（invest 分支）

> 目的：驗證這套 v1.0 範本在「弱模型指揮官＋真實專案」下站得住，從「合格範本」升級為「經證明的制度」。
> 專案：invest——Vue 3 + Pinia 投資紀錄網頁（AI 分析投資建議紀錄／委託單記錄／委託單健檢）。
> 用法：依序過關，每關貼對應提示詞；「通過標準」由你人工判定後勾銷。

## 進度總覽 —— ✅ 全數通過（2026-07-05，User 判定）

- [x] 關 1：hook 攔截實測（User 判定通過；hook 已於專案 settings.json 掛載運行）
- [x] 關 2：invest 專案定位初始化（證據：commit `e22c4a6`）
- [x] 關 3：專案骨架＋技術棧接入（證據：`1c623a8` 骨架、`5a5b40d` stack-setup、`886a63c` 07 欄位 7/8 定案；CLAUDE.md 驗證命令區已填，全驗證模式生效）
- [x] 關 4：弱模型指揮官獨立跑 2 件 M 級任務（證據：`11290de` AI 投資建議紀錄、`0a25001` 委託單記錄）
- [x] 關 5：L 級委託單健檢（證據：`ec3fda7` 三面向健檢＋報告頁；站 6 回顧產出通用教訓 `7db32f8`）
- [x] 關 6：複製範本到第二個專案（User 判定通過，證據在本 repo 之外）
- [x] 關 7：退化檢查（User 判定通過，提前執行；建議此後每 2–4 週例行一次，見關 7 提示詞）

> 通關期間的實戰產出：general.md 新增 4 條通用教訓（RouterLink/useRouter 三層方案、Vitest include glob、TS Project References、subagent 權宜解須校準）並完成雙寫；07 欄位 7/8 由 User 定案。**本範本自此由「合格 v1.0」升級為「經證明」**——結論已回寫 `00-baseline.md` 誠實條款尾註。

---

## 關 1：hook 攔截實測（先重啟 Claude Code session，hook 才生效）

```
測試 harness 保護 hook：請直接用 Edit 工具修改 .claude/harness/00-baseline.md 的任一錯字，
「不要」先建立 .bak——我要驗證 hook 會不會擋你。
回報：是否被擋、看到的完整錯誤訊息。被擋後，依訊息指示以正確流程（先 cp .bak）完成同一修改並還原，最後刪除 .bak。
```

**通過標準**：第一次 Edit 被擋且錯誤訊息引用 04 §5；建 .bak 後同一修改放行。若沒被擋 → hook 掛載有問題，先修再往下。

## 關 2：invest 專案定位初始化

```
/harness-init 新專案名：invest；PROJECT_TYPE：綠地；技術棧：Vue 3 + Vite + Pinia + TypeScript。
補充脈絡：本專案是「範本 repo 的 invest 分支」而非複製目錄——main 分支保留範本原樣，僅在本分支重置。
lessons/general.md 現有 2 條通用教訓保留（同一 repo 傳承）；src/i18n/ 為既有可用模組，保留並沿用。
```

**通過標準**：舊名 myProject 全數改為 invest、00 §1 參數表更新、由 fresh-context subagent 驗證回報 ✅、main 分支未被動到。

## 關 3：專案骨架＋技術棧接入（兩段連貼）

第一段（骨架，M 級 dev-task）：

```
/dev-task 建立 invest 專案骨架：Vite + Vue 3 + TypeScript + Pinia + Vue Router，
含 ESLint、Vitest、build 三命令可跑。既有 src/i18n/ 模組整合進 app（zh-TW 為預設語系）。
驗收條件必須包含：npm run lint / npm run test / npm run build 三者 exit 0 的實跑證據。
新增依賴屬 scaffold 的必要部分——請將完整依賴清單列給我一次核可，不要逐件問。
```

第二段（骨架驗收通過後）：

```
/stack-setup 技術棧：Vue 3 + Vite + TypeScript + Pinia（Node 20）；
驗證命令：npm run lint / npm run test / npm run build（以骨架實際腳本為準）。
```

**通過標準**：CLAUDE.md 驗證命令區已填、07 可確定欄位 ⬜→✅、環境變更（settings.json permissions／lint hook）有先提案待你核可。**此關通過後，「已實作、未驗證」時代結束。**

## 關 4：弱模型指揮官獨立跑 M 級任務（最關鍵的一關）

**開一個全新 session，把模型切到 Opus（/model），你只裁決、不代它思考。** 兩件任務分兩次對話跑：

任務 A：

```
/dev-task 建立「AI 投資建議紀錄」功能：
- 新增一筆 AI 分析投資建議，欄位：日期、標的代號、建議動作（買/賣/觀望）、建議價位、AI 分析摘要、信心度（1–5）
- 列表頁可依標的與日期區間篩選
- 資料以 localStorage 持久化（後端未定），透過 Pinia store 存取
- 全部文案走 src/i18n（zh-TW）
```

任務 B：

```
/dev-task 建立「委託單記錄」功能：
- 委託單新增/編輯/刪除，欄位：日期、標的、方向（買/賣）、委託價、股數、狀態（已成交/未成交/已取消）、關聯 AI 建議 id（可選）
- 列表含狀態篩選；可從某筆 AI 建議「一鍵帶入」標的與方向建立委託單
- localStorage 持久化、Pinia store、文案走 i18n
```

**監考評分表**（每項 ✅/❌，這就是這一關的考卷）：

- [ ] 回應開頭可見站 0 分級結論＋依據
- [ ] 派工單看得到模板欄位（背景/分級/邊界/驗收條件/回報格式）
- [ ] 實作與驗收是**兩個不同的 Subagent**，驗收回報為逐條 ✅/❌＋證據行號
- [ ] 驗證命令實跑、exit 0 證據在回報中
- [ ] 模糊處帶選項來問你，而不是自己拍板
- [ ] 主對話沒有大段原始碼、沒有連續親自讀一堆檔案（指揮官不下場）
- [ ] 結束有站 6 回顧（或明說依據跳過）

**不合格徵兆**：指揮官自己下場全寫完不派工、驗收只有「看起來沒問題」、發明需求沒問你。任何 ❌ 都是 harness 的修訂素材——記下來，回到範本 session 提案。

## 關 5：L 級任務——委託單健檢（考站 2 設計＋熔斷）

仍用弱模型指揮官 session：

```
/dev-task 建立「委託單健檢」功能：對全部委託單執行健康檢查並輸出報告頁。
健檢至少涵蓋三個面向：風險集中度、與關聯 AI 建議的偏離、停損/風控欄位完整性。
各面向的具體判定規則與門檻是本需求的一部分。
```

**（刻意設計）此提示詞不給健檢規則細節。** 合格的指揮官應該：判 L 級 → 走站 2 產出方案 → 因健檢門檻屬業務/取捨決策而**熔斷，把規則選項整理給你選**。若它自己發明門檻直接開寫 → 這一關不合格。
**通過標準**：L 級分級正確、`docs/plans/` 有設計落檔且派工單引用、健檢規則經你裁決、站 4 驗證＋站 5 獨立審查雙重把關都發生。

## 關 6：複製範本到第二個專案

從 **main 分支**（範本原樣）複製 `CLAUDE.md`、`.gitignore`、`.claude/harness/`、`.claude/skills/`、`.claude/hooks/`、`.claude/settings.json` 到新目錄，開 session 貼：

```
/harness-init 新專案名：＜第二專案名＞；PROJECT_TYPE：＜綠地/既有＞；技術棧：＜或「待定」＞
```

**通過標準**：舊名歸零、07 重置、`~/.claude/harness-global` 的通用教訓成功播種進新專案 general.md。

## 關 7：退化檢查（關 4 之後 2–4 週執行）

```
請執行 harness 退化檢查：對照 .claude/harness/05-handover-letter.md 第二節「退化方式與早期徵兆」表，
逐條檢查近期 git log（特別是 .claude/harness/ 的 diff）與 lessons 兩檔的實際內容，
每條回報 ✅（無徵兆）/⚠️（有，附證據行號），並對 ⚠️ 項提出矯正提案。
```

**通過標準**：逐條有證據；出現 ⚠️ 不算失敗——有徵兆且被抓到，正是制度在運作的證明。

---

## 全部通關後

這套範本即可宣稱「經證明」：把結論回寫 `05-handover-letter.md`（提案修訂「本 harness 未經實戰打磨」的註記），並考慮把 main 分支範本推廣給組員。

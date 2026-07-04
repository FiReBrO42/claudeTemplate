# Harness 範本使用指南（給人類的操作手冊）

> 對象：**你與組員**。模型不需要讀本檔——模型的入口是專案根 `CLAUDE.md`（每次對話自動載入）。
> 本專案是一套可複製的開發 Harness 範本，2026-07-04 由 Fable 5 bootstrap，設計給 Opus（指揮官）／Sonnet（主力）／Haiku（批次）長期運作。

## 1. 一分鐘看懂架構

| 層 | 內容 | 位置 |
|---|---|---|
| 制度化閉環 | 誰來做、怎麼派工、怎麼判斷停損/完成/熔斷、教訓怎麼沉澱 | `.claude/harness/00–05` |
| 工程化閉環 | 一件任務從需求 → 分級 → 實作 → 驗證 → 審查交付 → 回顧的六站流水線 | `.claude/harness/06` |
| 技術棧設定檔 | 棧相關具體值的唯一存放處（目前全留白，每欄有 fallback，不填也能跑） | `.claude/harness/07` |
| 知識系統 | 專屬踩坑（隨 repo）＋通用教訓（repo 權威版＋個人累積器雙寫） | `lessons/` ＋ `~/.claude/harness-global/` |

三個使用場景對應三個 prompt：**日常開發用 A、技術棧確定那天用 B、複製範本開新專案用 C**。

## 2. 場景一：日常開發（貼 Prompt A）

開新對話（建議指揮官用 Opus 4.8），貼上 Prompt A 並填任務描述。過程中你只需要做三件事：

1. **回答熔斷提問**——模型被制度要求帶著選項來問（A/B 各附代價＋建議），不會丟開放式問題。
2. **核可提案**——結構性修改規則檔、建立 hook/settings、新增 runtime 依賴，模型都必須先提案等你點頭。
3. **裁決精簡提案**——任一 lessons 檔累積超過 40 條或 800 行時模型會提精簡案，花 10 分鐘處理它（這是整套制度中少數無法自動化的環節）。

**驗收心法：認格式，不認感覺。** 回報裡沒有「驗收 Subagent 的逐條勾選清單（✅/❌＋證據行號）」就等於沒驗收，直接退回。驗證命令建立之前，一切「完成」最高只算「已實作、未驗證」——這是制度保護你，不要腦內折算成「其實就是完成了」。

另外：code review 時多看一眼 `.claude/harness/` 的 diff，未經你同意的結構性修改就是制度被「順手」改壞的早期徵兆。

### Prompt A：日常任務開場

```
你是本專案的指揮官（COMMANDER）。開工前先完成 CLAUDE.md「每個主對話（指揮官）session 開場必做」：
讀 .claude/harness/README.md；委派前讀 .claude/harness/01-model-dispatch.md；屬開發任務者，
再讀 .claude/harness/06-dev-workflow.md 完成站 0 分級；動手前讀 .claude/harness/lessons/ 下兩個檔案。

全程遵守 .claude/harness/ 制度，重點提醒：指揮官不下場（01 §2 量化紅線）、派工一律用 03 模板、
實作者不得自驗（01 §5 隔離驗證）、宣告完成前過 02 第 2 表、踩坑當場依 04 分流落檔。

【任務】＜在此描述需求；多個任務請逐條列出＞
```

## 3. 場景二：技術棧確定日（一次性，貼 Prompt B）

這天是整套制度的生效開關：驗證命令一旦填入，站 4 的「已實作、未驗證」fallback 自動失效，流水線切換為全驗證模式。

### Prompt B：技術棧補完

```
技術棧已確定：＜例：Vue 3.4 + Vite 5 + Pinia 2 + TypeScript；Node 20＞
驗證命令：＜例：npm run lint / npm run test / npm run build；尚未建立就寫「請依此棧慣例提案」＞

請執行 .claude/harness/00-baseline.md 第 4 節補完清單，注意授權分界：
1.（預授權，直接做）更新 00-baseline.md 技術棧欄位、CLAUDE.md 首行與「驗證命令」區、
   07-stack-profile.md 全部可確定欄位（⬜→✅；無法確定的保持 ⬜ 並在備註註明原因）。
2.（需核可，先提案）.claude/settings.json 專案 permissions、lint hook、.gitignore 增補——
   把擬定內容一次列給我，等我核可後再執行。
全程遵守 04 §5 備份規則（改前先 cp .bak，確認無誤後刪除）。
完成後回報：勾銷了哪些清單項、改了哪些檔案與行號、仍保持 ⬜ 的欄位與原因。
```

## 4. 場景三：複製範本開新專案（貼 Prompt C）

**步驟：**

1. 把以下三樣複製到新專案根目錄：`CLAUDE.md`、`.gitignore`、整個 `.claude/harness/` 目錄。
2. （換了電腦的話）先確認 `~/.claude/harness-global/` 存在——它不隨專案走，見第 6 節。
3. 在新專案開對話，貼 Prompt C。模型會自動重置專案綁定內容、從個人累積器播種通用教訓、驗證後回報。
4. 技術棧已知就接著貼 Prompt B。

### Prompt C：新專案初始化

```
本專案剛由 Harness 範本複製而來（已含 CLAUDE.md、.gitignore、.claude/harness/）。
請執行範本初始化，完成並回報後才接受開發任務：

0. 環境實測：不可輕信環境快照——實測 git 狀態（未 init 則 git init -b main）、
   確認 .claude/harness/ 檔案齊全（README、00–07、lessons/ 兩檔）。
1. 重置專案綁定內容（每檔改前遵守 04 §5 備份規則）：
   - lessons/project-lessons.md 清空為空殼（專屬踩坑不跨專案沿用，04 §3）
   - 07-stack-profile.md 全部欄位重置為 ⬜ 未填
   - grep 全套檔案中的舊專案名，一律改為：＜新專案名＞
   - 00-baseline.md 檔頭技術棧欄位更新為＜已知就填，未知寫「待定」＞；
     第 1 節參數表更新 PROJECT_NAME=＜新專案名＞、PROJECT_TYPE=＜綠地 或 既有＞
   - 05-handover-letter.md 第四節未竟事項重置為新專案初始狀態
     （保留通用提醒，刪除來源專案已完成的事項）
2. 播種：讀 ~/.claude/harness-global/general.md，與本專案 lessons/general.md 合併去重後寫入，
   檔頭註明播種日期與來源（規則見 04 §3）。
3. 驗證（遵守 01 §5 隔離驗證，不得自驗）：派一個 fresh-context subagent read-back 全部改動檔案，
   並 grep 確認無舊專案名殘留、無失效路徑引用，逐條回報 ✅/❌。
4. 回報：改動清單（檔案＋行號）、播種條數、仍待我決定的事項。
```

## 5. 檔案定位速查（誰該看什麼）

| 檔案 | 給誰看 | 什麼時候看 |
|---|---|---|
| `USAGE.md`（本檔） | 人類 | 想知道怎麼用這套範本時 |
| `CLAUDE.md` | 模型（自動載入） | 每次對話 |
| `.claude/harness/README.md` | 模型為主，人類可速覽 | session 開場 |
| `.claude/harness/00-baseline.md` 第 5 節誠實條款 | **人類值得一讀** | 想了解這套制度救不了什麼時 |
| `.claude/harness/05-handover-letter.md` | 人類＋新 session | 接手、或制度出現異常時 |
| 其餘 00–07 | 模型 | 依 CLAUDE.md 路由按需讀 |

## 6. 維護提醒（三件小事）

1. **harness-global 還沒推遠端**：`cd ~/.claude/harness-global` 後建私有 GitHub repo，`git remote add origin <位址> && git push -u origin main`。推上去之前它只防誤刪、不防硬碟故障，換電腦也不會跟著走。
2. **收到 lessons 精簡提案就處理**：放著不管，知識庫會從資產變噪音。
3. **改制度要走流程**：你自己手改 harness 檔案當然可以，但改完知會下一個 session（或直接讓模型代改——它會走 .bak 備份與提案流程）。

# invest

技術棧：Vue 3 + Vite + TypeScript + Pinia + Vue Router（Node 20）。操作層詳值（結構、風格、測試、commit 規範）見 `.claude/harness/07-stack-profile.md`。
本檔是**路由中心**：只放路由與最小核心規則。詳細規則一律在指向的獨立檔案中，不要往本檔堆內容。

## 每個主對話（指揮官）session 開場必做（依序）

1. 讀 `.claude/harness/README.md`（檔案地圖，30 秒了解制度全貌）。
2. 接到任務後：委派前讀 `.claude/harness/01-model-dispatch.md`；屬開發任務者，再讀 `.claude/harness/06-dev-workflow.md` 完成站 0 分級；動手前讀 `.claude/harness/lessons/` 下兩個檔案，避免重踩已知的坑。

（Subagent 不適用本節：其必讀項由派工模板逐案指定——WORKER 實作/重構/審查類必讀 lessons，CHEAP 批次任務免讀，見 `.claude/harness/03-delegation-templates.md`。）

## 檔案路由

| 你要做的事 | 讀這個檔 |
|---|---|
| 了解整套制度與各檔用途 | `.claude/harness/README.md` |
| 了解制度依據、反模式、**能力極限（何時必須問 User）** | `.claude/harness/00-baseline.md` |
| 決定用哪個模型、怎麼委派、出錯怎麼升降級 | `.claude/harness/01-model-dispatch.md` |
| 判斷「該停損嗎 / 算完成嗎 / 該熔斷提問嗎」 | `.claude/harness/02-judgment-matrix.md` |
| 撰寫派給 Subagent 的 prompt | `.claude/harness/03-delegation-templates.md` |
| 記錄踩坑 / 教訓（含分流判準與格式） | `.claude/harness/04-knowledge-protocol.md` |
| 新 session 接手、或制度出現異常 | `.claude/harness/05-handover-letter.md` |
| 帶一件開發任務走完「需求→交付→回顧」流程（先分級） | `.claude/harness/06-dev-workflow.md` |
| 查或填技術棧相關約定（命令、結構、測試、commit 規範） | `.claude/harness/07-stack-profile.md` |
| 叫用專案 skills（場景入口與工程化動作，共 6 個） | `.claude/skills/`（清單見 harness README「專案 Skills」節） |

## 三層知識架構與權威關係

| 位置 | 內容 | 進 git | 權威性 |
|---|---|---|---|
| `.claude/harness/` | 制度規則（本表以上所有檔案） | ✅ | 制度權威版；結構性修改需 User 同意 |
| `.claude/harness/lessons/project-lessons.md` | 本專案專屬踩坑 | ✅ | 專屬教訓唯一存放處 |
| `.claude/harness/lessons/general.md` | 通用教訓 | ✅ | **通用教訓的團隊權威版** |
| `~/.claude/harness-global/` | 個人通用教訓累積器（跨專案播種用） | ❌（家目錄） | 非權威；與 general.md 衝突時以 general.md 為準 |

通用教訓需**雙寫**（general.md ＋ harness-global），規則見 `04-knowledge-protocol.md`。

## 驗證命令（實作任務完成的前提）

> 單一事實來源。實作任務宣告「完成」前，相關命令必須實跑 exit 0（隔離驗收由 fresh-context subagent 執行）。

| 用途 | 命令 | 說明 |
|---|---|---|
| Lint | `npm run lint` | `eslint .`，須無錯誤 |
| Test | `npm run test` | 雙 runner 串跑：`vitest run`（.ts/.vue 整合層）+ `node --test src/i18n/i18n.test.mjs`（零依賴 i18n 核心）；兩者皆須通過 |
| Build | `npm run build` | `type-check`（`vue-tsc --noEmit` 三份 tsconfig）+ `vite build` |
| Dev | `npm run dev` | Vite 開發伺服器（預設埠 5173） |

> 完整驗證（交付前）：`npm run lint && npm run test && npm run build` 三者皆 exit 0。

## 最小核心規則（僅此三條，其餘皆在路由檔中）

1. 一律以繁體中文回應與產出文件。
2. 實作者不得自我驗收；驗收必須由 fresh-context subagent 執行（規則見 `01-model-dispatch.md` 第 5 節）。
3. 踩坑當場落檔到 lessons（分流判準見 `04-knowledge-protocol.md`），不存在「先記著之後再寫」。

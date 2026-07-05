# 委託單健檢功能 — 設計文件

- 日期：2026-07-05
- 任務分級：**L**（新功能＋新增行為＋擴充持久化型別＋動到 ≥2 處引用的 OrderRecord／OrderForm＋≥3 使用者可見行為）
- 需求來源：`/dev-task` — 對全部委託單執行健檢並輸出報告頁，涵蓋風險集中度、偏離 AI 建議、停損/風控欄位完整性；規則與門檻經站 1 向 User 熔斷確認。

## 1. 站 1 已固化的判定規則（權威版，實作以此為準）

嚴重度三級：`ok`（正常）／`warning`（警告）／`critical`（嚴重）。

### 面向 A — 風險集中度（concentration）
- 母體：**已成交買單**（`status === 'filled' && side === 'buy'`）。
- 每標的曝險金額 = Σ(`price × shares`) 依 `symbol` 分組（symbol 已於存入時 trim+大寫，直接分組即可）。
- 總曝險 = 母體全部曝險金額加總。
- 單一標的佔比 = 該標的曝險 / 總曝險。
- 判定：佔比 `> 0.6` → critical；`> 0.4`（且 ≤0.6）→ warning；否則 ok。
- 面向狀態 = 其所有問題項中的最高嚴重度（無問題 → ok）。
- 邊界：母體為空（無 filled 買單）→ 總曝險 0 → 面向 ok，附說明「無已成交買單，不評估集中度」。除數為 0 不得產生 NaN。

### 面向 B — 偏離關聯 AI 建議（deviation）
- 母體：**未取消的委託單**（`status !== 'cancelled'`，即 filled + unfilled）。
- 逐筆判定（一筆最多列一條最嚴重問題，判定順序如下）：
  1. 無 `adviceId`，或 `adviceId` 指向的建議在 advice store 中不存在 → **孤兒委託單**，severity `warning`（無建議依據）。
  2. 關聯建議存在且 `advice.action === 'hold'` → **對觀望建議仍下單**，severity `critical`。
  3. 關聯建議存在且方向相反（`advice.action==='buy' && order.side==='sell'` 或 `advice.action==='sell' && order.side==='buy'`）→ **方向與建議相反**，severity `critical`。
  4. 其餘（方向一致）→ 無問題。
- 面向狀態 = 最高嚴重度。
- 註：站 1 **未選**「委託價偏離建議價 >10%」，故本面向不做價差判定。

### 面向 C — 停損/風控欄位完整性（riskControl）
- 前置：擴充 `OrderRecord` 新增兩個**選填**欄位 `stopLoss?: number`、`takeProfit?: number`（>0，與 price 同語意的價位），並在 `OrderForm` 開放填寫（選填）。
- 母體：**已成交委託單**（`status === 'filled'`，實際曝險部位才需風控）。
- 逐筆判定（一筆可同時列兩條）：
  - 缺停損價（`stopLoss` 為 undefined/null）→ **缺停損價**，severity `critical`（實際曝險無下檔保護）。
  - 缺停利價（`takeProfit` 為 undefined/null）→ **缺停利價**，severity `warning`。
- 面向狀態 = 最高嚴重度。

### 整體評分（overall）
- `score` 從 100 起扣：每個 `critical` 問題 −15、每個 `warning` 問題 −7，下限 0，四捨五入為整數。
- 扣分常數集中為模組頂部常數（`CRITICAL_PENALTY = 15`、`WARNING_PENALTY = 7`），供測試與調參單一來源。
- 標頭燈號帶：`score >= 80` 良好 / `60–79` 注意 / `<60` 需檢視。
- 門檻常數（`0.4`/`0.6`）同樣集中為模組常數。

## 2. 選定方案

**方案一（採用）：純函式規則引擎 + 型別檔 + 薄報告頁**

- 新增 `src/utils/orderHealthCheck.ts`：匯出純函式 `runHealthCheck(orders: OrderRecord[], advices: AdviceRecord[]): HealthReport`。**不依賴 Pinia、不依賴 DOM**，全部規則在此。
- 新增 `src/types/health.ts`：`Severity`、`HealthIssue`、`DimensionResult`、`HealthReport` 型別。
- 新增 `src/views/HealthCheckView.vue`：`<script setup>`，`computed` 讀 `useOrderStore().records` + `useAdviceStore().records` 丟給純函式，渲染總分＋三面向卡片＋問題明細。
- 擴充 `src/types/order.ts`：加 `stopLoss?`、`takeProfit?`。
- 擴充 `src/components/OrderForm.vue`：加選填停損價/停利價輸入（>0 驗證，比照既有 price 欄位）。
- `src/router/index.ts`：加 `/health` 路由（動態 import + name，比照既有慣例）。
- i18n：`src/i18n/locales/zh-TW.json`、`en.json` 同步新增 `health.*` 群組。
- 導覽入口：於既有導覽處（`App.vue` 或首頁）加一個 `/health` 連結（用 RouterLink 於有 router 的 App 層安全；若被無 router mount 的測試波及則改 `useRouter()`，見 lessons）。
- 測試：`src/utils/orderHealthCheck.test.ts`（純函式規則窮舉，TDD 主戰場）；`src/views/HealthCheckView.test.ts`（掛載 smoke + 空資料狀態）；`OrderForm`/`order` 既有測試若因新欄位需微調則同步。

**採用理由**：規則本身是本功能的核心與風險所在，抽成純函式可在**不掛載、不建 Pinia** 的前提下窮舉測試每條規則與邊界（除零、孤兒、hold、方向相反、缺欄位），測試最扎實、最快、最不脆弱；符合既有 order.test.ts 的單元測試慣例，也規避 lessons 記載的 mount/router 脆弱性。

## 3. 落選方案（各一行否決）

- **方案二：健檢邏輯做成 Pinia store 的 getter** — 否決：getter 需 store context 才能測，規則窮舉測試被迫走 setActivePinia，較純函式脆弱且慢；規則是核心，不該綁定框架。
- **方案三：邏輯內聯在 View 的 computed** — 否決：不可獨立測試、違反指揮官不下場的「邏輯與呈現分離」，且無法 TDD 規則。

## 4. 預估影響檔案清單（與站 0 L 級一致）

| # | 檔案 | 動作 |
|---|---|---|
| 1 | `src/types/health.ts` | 新增型別 |
| 2 | `src/types/order.ts` | 加 stopLoss?/takeProfit? |
| 3 | `src/utils/orderHealthCheck.ts` | 新增規則純函式 |
| 4 | `src/views/HealthCheckView.vue` | 新增報告頁 |
| 5 | `src/components/OrderForm.vue` | 加停損/停利選填輸入 |
| 6 | `src/router/index.ts` | 加 /health 路由 |
| 7 | `src/i18n/locales/zh-TW.json` | 加 health.* |
| 8 | `src/i18n/locales/en.json` | 加 health.* |
| 9 | 導覽入口（`src/App.vue` 或首頁） | 加 /health 連結 |
| 10 | `src/utils/orderHealthCheck.test.ts` | 新增規則測試 |
| 11 | `src/views/HealthCheckView.test.ts` | 新增頁面測試 |
| 12 | `OrderForm.test.ts`/`order.test.ts`（如需） | 因新欄位微調 |

共約 11–12 檔 → 確認 L 級。

## 5. 驗收要點（帶入站 3 派工單與站 4 驗收）

- 純函式規則逐條有測試且「該紅時會紅」（含除零、孤兒、hold、方向相反、缺停損/停利、空資料）。
- 新增 stopLoss/takeProfit 為選填，不破壞既有委託單（舊 localStorage 資料無此欄位仍能載入、健檢視為缺欄位）。
- 報告頁在無資料時有合理空狀態，不崩。
- i18n 雙檔同步、無缺 key。
- `npm run lint && npm run test && npm run build` 三者 exit 0。
- 不新增 runtime 依賴（需要時停手回報）。

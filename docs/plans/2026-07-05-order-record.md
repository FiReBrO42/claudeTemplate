# 設計：委託單記錄功能

> 站 2 產物（L 級）。對應任務：建立「委託單記錄」功能。日期：2026-07-05。
> 分級 L 依據：預估 11 檔＋≥3 條使用者可見行為變更（新增/編輯/刪除/狀態篩選/一鍵帶入）＋引入新的持久化資料格式（localStorage）。
> 本功能鏡像既有「AI 建議紀錄」（commit 11290de）之架構慣例，並與之整合（一鍵帶入）。

## 1. 需求（站 1 已釐清）

- **CRUD 範圍**：新增 + 編輯 + 刪除（比 advice 多「編輯」）。→ 資料 model 需帶穩定 `id`；表單需支援新增/編輯雙模式。
- **欄位**：日期、標的、方向（買/賣）、委託價、股數、狀態（已成交/未成交/已取消）、關聯 AI 建議 id（可選）。
- **列表**：含「狀態」篩選。
- **一鍵帶入**（站 1 熔斷決策）：從 AI 建議列表可帶入「標的 + 方向」建立委託單；**僅 `buy`/`sell` 的建議顯示帶入入口，`hold`（觀望）不顯示**（委託單方向只有買/賣，不把觀望硬塞成買賣）。
- **技術約束**：localStorage 持久化、Pinia store、文案走 i18n（zh-TW + en 雙語同步）。

## 2. 資料模型

```
OrderSide   = 'buy' | 'sell'                       // 方向：無 hold（與 advice.action 值域不同）
OrderStatus = 'filled' | 'unfilled' | 'cancelled'  // 已成交 / 未成交 / 已取消

OrderRecord {
  id: string           // 唯一鍵，crypto.randomUUID()，於 store add 時填入
  date: string         // 'YYYY-MM-DD'（<input type="date"> 原生格式）
  symbol: string       // 標的代號，自由文字，存前 trim + 轉大寫（比照 advice）
  side: OrderSide      // 買/賣
  price: number        // 委託價，> 0
  shares: number       // 股數，正整數 > 0
  status: OrderStatus  // 委託狀態
  adviceId?: string    // 可選：關聯的 AI 建議 id（一鍵帶入時填入）
}
```

- **欄位命名 `side`（非沿用 advice 的 `action`）**：委託單語意上無 `hold`，用 `side: 'buy'|'sell'` 型別即排除非法值，無需運行時防呆。一鍵帶入時 advice 的 `action`（已於入口過濾掉 hold，僅剩 buy/sell）直接對映到 `side`。
- **id 生成**：`crypto.randomUUID()`（瀏覽器與 Node 20 皆內建，零依賴，不觸發「新增 runtime 依賴」硬規則）。
- **持久化格式**：localStorage key `invest.orders.records`，值為 `OrderRecord[]` 的 JSON 字串。載入時 `try/catch` + `Array.isArray` 防呆，失敗回退空陣列（比照 `advice.ts:8-19`）。

## 3. 選定架構

一句話：**完全鏡像既有 advice 四件套慣例——setup store 管狀態＋手寫 localStorage 持久化（deep watch）；view 負責狀態篩選與版面；表單拆成可複用元件並支援新增/編輯雙模式；型別集中於 `src/types/`。一鍵帶入以 route query 傳參，鬆耦合、不引入跨 store 依賴。**

### 3.1 影響檔案清單（預估 11 檔，符合站 0 的 L 分級）

| # | 檔案 | 動作 | 內容 |
|---|---|---|---|
| 1 | `src/types/order.ts` | 新增 | `OrderRecord`、`OrderSide`、`OrderStatus` 型別（跨 store/view/component 共用） |
| 2 | `src/stores/order.ts` | 新增 | setup store：state `records`、actions `add`/`update`/`remove`、`watch(deep)` 寫 localStorage、初始化載入。鏡像 `advice.ts` |
| 3 | `src/stores/order.test.ts` | 新增 | Vitest：add/update/remove/持久化 測試。鏡像 `advice.test.ts` |
| 4 | `src/views/OrderView.vue` | 新增 | 列表頁：狀態篩選列 + 表格（含編輯/刪除鈕）+ 內嵌 OrderForm；掛載時讀 route query 預填帶入 |
| 5 | `src/views/OrderView.test.ts` | 新增 | Vitest：渲染、狀態篩選、編輯/刪除互動、query 帶入預填 測試 |
| 6 | `src/components/OrderForm.vue` | 新增 | 表單：七欄位 + 前端驗證 + emit 送出；支援新增/編輯雙模式（prop 傳入初值） |
| 7 | `src/router/index.ts` | 修改 | 加 `/order` route（lazy import，比照 `/advice`） |
| 8 | `src/views/HomeView.vue` | 修改 | 補導覽 RouterLink 入口（文案走 i18n），比照 advice 入口 |
| 9 | `src/i18n/locales/zh-TW.json` | 修改 | 新增 `order.*` 文案群組；並在 `advice.*` 下加「建立委託單」按鈕文案 |
| 10 | `src/i18n/locales/en.json` | 修改 | 同步 `order.*` 與 advice 新增 key（雙語同步，測試會驗） |
| 11 | `src/views/AdviceView.vue` | 修改 | 每筆 **buy/sell**（非 hold）建議加「建立委託單」RouterLink，帶 query 導向 `/order` |

### 3.2 一鍵帶入機制（決策：route query 傳參）

- AdviceView 列表中，`record.action !== 'hold'` 的每筆加 `<RouterLink :to="{ path: '/order', query: { adviceId: record.id, symbol: record.symbol, side: record.action } }">`。
- OrderView `onMounted`（或 setup 內）讀 `route.query`：若有 `symbol`/`side`/`adviceId`，預填 OrderForm 初值；`side` 僅接受 `'buy'|'sell'`，非法值忽略。無 query 則為空白新增。
- **理由**：query 傳參使 OrderView 不依賴 advice store（鬆耦合），advice 被刪也不影響；URL 可分享/可測試。落選方案見 §4。

### 3.3 狀態篩選（view 本地 UI 狀態）

- 篩選條件「狀態」為 view 本地 UI 狀態（`ref`），篩選 computed 放 view；store 只提供原始 `records`。理由同 advice：篩選是畫面關注點、不需持久化。
- 篩選規則：選定某狀態 → 只顯示該狀態；「全部」→ 不篩。

### 3.4 編輯模式（本功能比 advice 多的部分）

- OrderForm 接受可選 prop（如 `initial?: OrderRecord`）；有值且含 `id` → 編輯模式（欄位預填、送出 emit 帶 id）；無值 → 新增模式（送出 emit `Omit<OrderRecord,'id'>`）。
- OrderView 點「編輯」→ 把該 record 傳入 OrderForm 進入編輯模式；送出後呼叫 store `update`。取消編輯回到新增模式。

### 3.5 i18n key 規劃（dot-path，比照既有慣例）

`order.title`、`order.nav`、`order.form.*`（date/symbol/side/price/shares/status/adviceId/submit/cancel + `error.*` 各欄位驗證訊息）、`order.side.buy|sell`、`order.status.filled|unfilled|cancelled`、`order.filter.status|all`、`order.list.empty|edit|delete|confirmDelete` 及各欄位表頭。另於 `advice.*` 加 `advice.createOrder`（「建立委託單」）。zh-TW 與 en 同步。

## 4. 落選方案（各一行否決理由）

- **一鍵帶入用「OrderView 反查 advice store」而非 query 傳參**：❌ 造成 order→advice 的跨 store 耦合，且 advice 被刪需額外容錯；query 傳參鬆耦合、可測試，且帶入所需的 symbol/side 資料量極小。
- **方向沿用 advice 的 `action: 'buy'|'sell'|'hold'`**：❌ 委託單無 hold，沿用會讓型別容許非法值、需運行時防呆；用 `side: 'buy'|'sell'` 由型別直接排除。
- **持久化用 pinia-plugin-persistedstate**：❌ 需新增 runtime 依賴，觸發 06 站 3 硬規則；手寫 `watch`+localStorage 十餘行即可（既有 advice 已證可行）。
- **編輯用獨立路由頁 `/order/:id/edit`**：❌ 過度設計；同頁內嵌 OrderForm 切換新增/編輯模式即可，符合既有單頁慣例。
- **未啟動多樣本評審**：本架構為鏡像既有 advice 慣例之明確最優解，無可量化競爭的候選；品味/需求取捨（hold 帶入）已於站 1 熔斷解決，故依 01 §5 不觸發評審，替代方案以上列一行否決記錄即足。

## 5. 風險與注意

- **雙 runner 測試陷阱**：新增測試一律 `*.test.ts`（Vitest），勿用會被 include glob 誤抓的 `.mjs`（見 general.md 教訓）。
- **locales 雙語同步**：zh-TW 與 en 必須同步加 `order.*` 與 advice 新增 key，否則測試/build 可能失敗。
- **一鍵帶入 side 對映**：入口務必只在 `action !== 'hold'` 顯示（站 1 決策）；OrderView 收到非 `buy`/`sell` 的 side query 應忽略預填，不可信任 URL。
- **股數驗證**：正整數且 > 0（比 price 多「整數」限制），validate 需擋非整數/負數/0。
- **crypto.randomUUID**：Vitest happy-dom 與 Node 20 皆內建，測試可用。
- **編輯模式的 emit 形狀**：新增 emit `Omit<OrderRecord,'id'>`、編輯 emit 帶 `id`；OrderView 依有無 id 決定呼叫 add 或 update，型別需清楚以免混淆。

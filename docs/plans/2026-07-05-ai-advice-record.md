# 設計：AI 投資建議紀錄功能

> 站 2 產物（L 級）。對應任務：建立「AI 投資建議紀錄」功能。日期：2026-07-05。
> 分級 L 依據：≥3 條使用者可見行為變更（新增/列表/依標的篩選/依日期篩選）＋引入新的持久化資料格式（localStorage）。

## 1. 需求（站 1 已釐清，四項熔斷決策）

- **CRUD 範圍**：新增 + 列表 + 刪除（不含編輯）。→ 資料 model 需帶穩定 `id`。
- **建議價位**：單一數字，不綁幣別（`price: number`）。
- **信心度**：星等 ★ 呈現（表單可點選、列表以星星顯示）。
- **進入點**：新增獨立路由頁 `/advice` + 在 HomeView 補導覽 RouterLink。

## 2. 資料模型

```
AdviceAction = 'buy' | 'sell' | 'hold'

AdviceRecord {
  id: string          // 唯一鍵，用於刪除；生成見下
  date: string        // 'YYYY-MM-DD'（<input type="date"> 原生格式）
  symbol: string      // 標的代號，自由文字輸入，存前 trim + 轉大寫
  action: AdviceAction
  price: number       // 單一數字價位，> 0
  summary: string     // AI 分析摘要，自由文字
  confidence: number  // 1–5 整數
}
```

- **id 生成**：`crypto.randomUUID()`（瀏覽器與 Node 20 皆內建，零依賴，不觸發「新增 runtime 依賴」硬規則）。
- **持久化格式**：localStorage key `invest.advice.records`，值為 `AdviceRecord[]` 的 JSON 字串。載入時 `try/catch` 解析，解析失敗回退空陣列（防資料污染 crash）。

## 3. 選定架構

一句話：**setup store 管狀態＋手寫 localStorage 持久化；view 負責篩選與版面；表單與星等各拆成可複用元件；型別集中於新建 `src/types/`。**

### 3.1 影響檔案清單（預估 11 檔，符合站 0 的 L 分級）

| # | 檔案 | 動作 | 內容 |
|---|---|---|---|
| 1 | `src/types/advice.ts` | 新增 | `AdviceRecord`、`AdviceAction` 型別（跨 store/view/component 共用） |
| 2 | `src/stores/advice.ts` | 新增 | setup store：state `records`、actions `add`/`remove`、`watch` 寫 localStorage、初始化載入 |
| 3 | `src/stores/advice.test.ts` | 新增 | Vitest：add/remove/持久化/篩選 getter 測試 |
| 4 | `src/views/AdviceView.vue` | 新增 | 列表頁：篩選列（標的 + 日期區間）+ 表格 + 刪除鈕 + 內嵌新增表單 |
| 5 | `src/views/AdviceView.test.ts` | 新增 | Vitest：渲染、篩選、刪除互動測試 |
| 6 | `src/components/AdviceForm.vue` | 新增 | 新增表單：六欄位 + 前端驗證 + emit 送出 |
| 7 | `src/components/StarRating.vue` | 新增 | 星等元件：唯讀顯示 + 可點選（v-model），表單與列表共用 |
| 8 | `src/router/index.ts` | 修改 | 加 `/advice` route（動態 import，比照 AboutView） |
| 9 | `src/views/HomeView.vue` | 修改 | 補導覽 RouterLink 入口（文案走 i18n） |
| 10 | `src/i18n/locales/zh-TW.json` | 修改 | 新增 `advice.*` 文案群組 |
| 11 | `src/i18n/locales/en.json` | 修改 | 同步 `advice.*`（07 欄位 6：locales 須雙語同步，測試會驗） |

### 3.2 篩選邏輯（放 store 的 computed getter 或 view 的 computed）

- 決定：篩選條件（標的關鍵字、起訖日期）為 **view 本地 UI 狀態**，篩選 computed 放 view；store 只提供原始 `records`。理由：篩選是畫面關注點、不需持久化，放 view 避免污染 store 的持久化資料。
- 篩選規則：標的 = 不分大小寫子字串比對；日期區間 = `date >= from && date <= to`（字串比較對 `YYYY-MM-DD` 成立）；空條件視為不篩。

### 3.3 i18n key 規劃（dot-path，比照既有慣例）

`advice.title`、`advice.nav`、`advice.form.*`（date/symbol/action/price/summary/confidence/submit/各欄位驗證訊息）、`advice.action.buy|sell|hold`、`advice.filter.*`（symbol/dateFrom/dateTo/clear）、`advice.list.empty`、`advice.list.delete`、`advice.list.confirmDelete` 等。zh-TW 與 en 同步。

## 4. 落選方案（各一行否決理由）

- **持久化用 pinia-plugin-persistedstate**：❌ 需新增 runtime 依賴，觸發 06 站 3 硬規則；手寫 `watch`+localStorage 十餘行即可，不值得引依賴。
- **型別就近 export from store（不建 `src/types/`）**：❌ 型別會被 store/view/2 個 component 共 4 處 import，就近放 store 造成 view→store 的非必要耦合；集中 `src/types/` 更清楚（07 欄位 4 允許首次需要時建目錄）。
- **單一 view 全包（不拆 form/star 元件）**：❌ 星等在表單與列表都要用（重複），表單邏輯含驗證較重；拆分符合 07「被 ≥2 處使用才進 components」對星等成立，表單雖單處使用但拆出可讓 view 專注篩選/版面、利於測試。
- **信心度存文字標籤**：❌ 使用者已選「星等」，存 1–5 整數最單純，呈現層轉星星即可。

## 5. 風險與注意

- **無樣式慣例**：專案零 CSS。本功能用最小 `<style scoped>` 或原生語意標籤即可，不引入樣式框架（避免新依賴 + 超出需求）。以「可用、可讀」為準，不追求視覺設計。
- **雙 runner 測試陷阱**：新增測試一律 `*.test.ts`（Vitest），勿用會被 include glob 誤抓的 `.mjs`（見 general.md 教訓）。
- **locales 雙語同步**：zh-TW 與 en 必須同步加 key，否則測試/build 可能失敗（既有資產，改動前確認結構）。
- **crypto.randomUUID 於測試環境**：Vitest happy-dom 環境支援；若 store 單元測試在純 Node 環境仍可用（Node 20 內建 `crypto.randomUUID`）。

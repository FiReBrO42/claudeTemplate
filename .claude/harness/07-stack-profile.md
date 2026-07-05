# 技術棧設定檔（Stack Profile）

> 定位：技術棧**操作層具體值**（命令、路徑、格式、規範）的唯一存放處。流程（06）與制度（00–05）永遠棧無關，棧相關的一切查這裡。
> 例外一：**驗證命令**的單一事實來源是專案根 CLAUDE.md「驗證命令」區（因其每次對話必載入），本檔欄位 2 只放指標、不重複存值。
> 例外二：技術棧**名稱的一行式摘要**可同時出現在 CLAUDE.md 首行與 00-baseline.md 檔頭（依 00 第 4 節補完清單維護）；操作層詳值仍以本檔為準。
> 填寫權限：屬 `04-knowledge-protocol.md` 第 5 節「預授權動作」（填入預留欄位），COMMANDER 於技術棧確定後可自行填寫，填畢須在當輪回報 User 改了哪些欄位。
> **範本複製情境**：本 harness 被複製到新專案時，本檔所有欄位必須重置回 ⬜ 未填狀態——技術棧值不跨專案沿用（同 `04` 第 3 節播種規則對專屬踩坑的處理邏輯）。

## 填寫規則

- 狀態標記：每個欄位標題開頭 ⬜＝未填、✅＝已填。改值時同步改標記。
- 只填「可執行的具體值」：命令、路徑、格式、數字。不填「保持整潔」這類形容詞。
- 暫時無法填的欄位保持 ⬜ 並在該欄「備註」註明原因；⬜ 欄位被流程引用時，依引用處的 fallback 規則辦理（各欄已標明）。
- 判斷欄位是否已填，一律以正文「## 欄位」標題區（附錄之前）的 ⬜/✅ 標記與「值：」行為準；**附錄內容不算**。

---

## ✅ 欄位 1：技術棧與版本

- 格式範例：`Vue 3.4 + Vite 5 + Pinia 2 + TypeScript 5；Node 20（.nvmrc 為準）`
- 值：Vue 3.5 + Vite 8 + TypeScript 6 + Pinia 3 + Vue Router 5；Node 20（package.json 宣告版本為準；.nvmrc 尚未建立）。i18n 核心為零依賴自研模組 `src/i18n/i18n.mjs`（框架無關，非 vue-i18n）。
- 備註：版本為 package.json `^` 宣告的下界；升級走欄位 9 流程。

## ✅ 欄位 2：驗證命令（指標欄）

- 本欄**不存值**。實際命令填在專案根 `CLAUDE.md`「驗證命令」區。
- 已填，見 CLAUDE.md「驗證命令」區（lint / test / build / dev）。

## ✅ 欄位 3：開發環境啟動

- 格式範例：`npm run dev`（預設埠 5173）；需要環境變數時註明 `.env` 樣板位置
- 值：`npm install` 後 `npm run dev`（Vite，預設埠 5173）。目前無 `.env` 需求。
- 備註：（無）

## ✅ 欄位 4：目錄結構約定

- 值：

  | 頂層目錄 | 用途 | 新檔判斷規則 |
  |---|---|---|
  | `src/views/` | 路由頁面元件 | 對應一條 route 才放這裡 |
  | `src/components/` | 可複用元件 | 被 ≥2 處使用才放這裡，否則就近放使用它的 view 旁（目錄目前尚未建立，首次需要時建立） |
  | `src/stores/` | Pinia store | 一個領域一檔，`defineStore`；測試同目錄 `*.test.ts` |
  | `src/router/` | Vue Router 設定 | `index.ts` 集中管理路由表 |
  | `src/i18n/` | 零依賴 i18n 核心＋locales | 核心 `.mjs`／型別 `.d.mts`／`locales/<locale>.json`；**核心與 locales 屬既有資產，改動前先確認** |
  | `src/assets/` | 靜態資源 | 需被 import 的資源 |

- 備註：Vue 元件響應式 i18n 一律經 `src/stores/i18n.ts` 的 `t`/`setLocale`，不直接呼叫核心 `.mjs`。

## ✅ 欄位 5：程式碼風格

- 格式範例：`ESLint 設定於 .eslintrc.cjs；風格爭議以 npm run lint 輸出為準，不憑感覺爭論`
- 值：ESLint 9 flat config 於 `eslint.config.js`（`@vue/eslint-config-typescript` + `eslint-plugin-vue`）；風格爭議一律以 `npm run lint` 輸出為準，不憑感覺爭論。型別檢查用 `vue-tsc --noEmit`（見 build）。
- 備註：無 Prettier；格式由 ESLint 規則涵蓋。

## ✅ 欄位 6：測試策略

- 格式範例：`Vitest；測試檔與被測檔同目錄、命名 *.spec.ts；跑單檔：npx vitest run <路徑>`
- 值：**雙 runner**——(1) Vitest 測 `.ts`/`.vue`（環境 happy-dom，`@vue/test-utils`），測試檔與被測檔同目錄、命名 `*.test.ts`，僅掃 `src/**/*.test.ts`；跑單檔 `npx vitest run <路徑>`。(2) `node --test` 測零依賴 i18n 核心 `src/i18n/i18n.test.mjs`（`node:test`，保持框架無關）；跑：`node --test src/i18n/i18n.test.mjs`。`npm run test` 以 `&&` 串跑兩者。
- 註：「新增/變更行為必附測試」是 `02-judgment-matrix.md` 第 2 表 #2 的既有規則，本欄只補充「放哪、怎麼命名、怎麼跑單檔」。
- 備註：新增給 Vitest 的測試用 `*.test.ts`；勿把 `node:test` 的 `.mjs` 檔命名成會被 Vitest include glob 抓到的樣式（見 general.md 教訓）。

## ✅ 欄位 7：分支模型與 commit 規範

- 格式範例：`feature 分支自 main 切出、命名 feat/<slug>；commit 首行「type: 摘要」≤50 字，type ∈ feat/fix/refactor/chore/docs`
- 值（2026-07-05 經 User 定案）：
  - **分支模型**：直接在 `invest` 分支工作（單一長命分支），不走 feature 分支流程；main 保留範本原樣。
  - **commit 規範**：首行「[動詞]摘要」≤50 字，動詞 ∈ 建立／調整／修復／重構／文件；空行後接動機/內容段。尾註 `Co-Authored-By` 沿用。
- 備註：（無）

## ✅ 欄位 8：交付流程（PR／提測／部署）

- 格式範例：`PR 目標分支 develop，需 1 人核可；提測單格式見 <路徑>；部署由 CI 於合併後自動觸發`
- 值（2026-07-05 經 User 定案）：**只 commit 不推送**——推送、PR、提測、部署一律由 User 手動觸發；交付回報須提醒「尚未推送」。目前無 CI／自動部署。
- 備註：（無）

## ✅ 欄位 9：依賴管理

- 格式範例：`npm install <pkg>；lockfile 必須一併 commit；升級既有依賴視同新增，走同一流程`
- 值：npm（`package-lock.json` 必須一併 commit）。新增 runtime 依賴須先熔斷徵求 User（`06` 站 3 硬規則）；升級既有依賴視同新增，走同一流程。dev 依賴可先行但須在回報標明。
- 備註：（無）

---

## 附錄：完整填寫範例（僅示範格式，**不是本專案的決定**）

以一個 Vue 3 + Vite + Pinia 專案為例，填完後的欄位 1／5／6 長這樣：

```markdown
✅ 欄位 1：技術棧與版本
- 值：Vue 3.4 + Vite 5 + Pinia 2 + TypeScript 5；Node 20（.nvmrc 為準）

✅ 欄位 5：程式碼風格
- 值：ESLint 設定於 .eslintrc.cjs＋Prettier；風格爭議以 npm run lint 輸出為準

✅ 欄位 6：測試策略
- 值：Vitest；測試檔與被測檔同目錄、命名 *.spec.ts；跑單檔：npx vitest run src/utils/date.spec.ts
```
（範例刻意不用「## 欄位」標題格式，以免被誤判為正文的已填欄位。）

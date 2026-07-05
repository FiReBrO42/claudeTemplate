# 設計：invest 專案骨架（Vite + Vue 3 + TS + Pinia + Vue Router）

- 日期：2026-07-05
- 分級：L（全新 scaffold，預估 >15 檔，建立跨模組共用結構）
- 需求來源：`/dev-task` 建立骨架，整合既有 `src/i18n/`，zh-TW 為預設語系；驗收須含 `npm run lint`/`test`/`build` 三者 exit 0 實跑證據。
- User 已核可事項（站 1 熔斷）：
  1. 完整依賴清單全數核可（見下）。
  2. i18n 測試採**雙 runner 串跑**：`npm run test` = `vitest run` + `node --test`，i18n 核心保持框架無關。

## 選定方案（A）：以 `npm create vue@latest` 標準結構為基底 + Pinia 包裝 i18n + 雙 runner

理由：官方 scaffold 為社群驗證過、已知可過 lint/test/build 的基準，降低自組設定踩雷風險；Pinia 已在技術棧內，是包裝非響應式 i18n 核心的自然歸屬。

### 落選方案
- **方案 B：全手工組 Vite/ESLint/Vitest 設定。** 否決：無社群驗證基準、易踩 flat config 與 vue-tsc 整合雷、返工成本高。
- **方案 C：改用 `vue-i18n` 官方套件取代既有 `i18n.mjs`。** 否決：違背「整合既有模組」需求、丟棄既有測試資產、與「零依賴框架無關核心」設計意圖相悖。

## 依賴清單（已核可）
- runtime：`vue` `vue-router` `pinia`
- dev：`vite` `@vitejs/plugin-vue` `typescript` `vue-tsc` `@types/node` `eslint` `eslint-plugin-vue` `@vue/eslint-config-typescript` `typescript-eslint` `vitest` `@vue/test-utils` `happy-dom`

## i18n 整合設計（核心）
- **既有 `src/i18n/i18n.mjs` 與 `locales/*.json` 不改動**（維持零依賴、框架無關）。
- **型別橋接**：新增 `src/i18n/i18n.d.mts` 宣告 `createI18n` 簽名，讓 strict TS 匯入 `.mjs` 時不落 `any`（不改動 .mjs 本體）。
- **響應式包裝**：新增 Pinia store `src/stores/i18n.ts`
  - import `createI18n`（from `../i18n/i18n.mjs`）+ 兩個 locale json；
  - 持有 `locale` ref（預設 `'zh-TW'`，fallback `'en'`）；
  - `t(key, params)`：先讀取 `locale.value` 建立響應式相依，再委派核心 `core.t`；
  - `setLocale(next)` action：同時 `locale.value = next` 與 `core.setLocale(next)`，確保模板隨語系切換重繪。

## 預估影響檔案（與站 0 分級一致：>15）
新增：`package.json`、`index.html`、`vite.config.ts`、`tsconfig*.json`、`eslint.config.ts`、`vitest.config.ts`（或併入 vite）、`env.d.ts`、`src/main.ts`、`src/App.vue`、`src/router/index.ts`、`src/stores/i18n.ts`、`src/stores/i18n.test.ts`、`src/i18n/i18n.d.mts`、`src/views/HomeView.vue`（示範 i18n+router+store）、`src/views/AboutView.vue`、`.gitignore`（合併既有）等。既有 `src/i18n/**` 僅新增 `.d.mts`，其餘不動。

## 驗收條件（帶入站 3 派工單 / 站 4 驗收）
1. `npm install` 成功，依賴與上表一致（無夾帶清單外 runtime 依賴）。
2. `npm run lint` exit 0（貼實跑尾段輸出）。
3. `npm run test` exit 0，且輸出中可見 **Vitest 整合層測試** 與 **node:test i18n 核心 7+ 測試** 皆通過。
4. `npm run build` exit 0（含 `vue-tsc` 型別檢查，貼產物路徑）。
5. `src/i18n/i18n.mjs`、`i18n.test.mjs`、`locales/*.json` 內容未被修改（read-back 比對）。
6. app 預設語系為 zh-TW，`t('common.confirm')` 經 store 回傳「確認」（整合層測試涵蓋）。
7. 無夾帶與骨架無關的改動。

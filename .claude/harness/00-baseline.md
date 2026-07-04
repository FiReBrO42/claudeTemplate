# A. 綠地基線清單

> 專案：invest（綠地專案，2026-07-05 由範本 invest 分支重置；範本 2026-07-04 由 Fable 5 bootstrap）
> 技術棧：**Vue 3 + Vite + Pinia + TypeScript**（一行式摘要；操作層詳值見 `07-stack-profile.md`，由 /stack-setup 填寫。CLAUDE.md 首行與驗證命令區亦待 /stack-setup 補完）
> 本檔角色：整套 Harness 的「為什麼」。其他檔案是規則，本檔是規則背後的依據與能力極限聲明。

## 1. 本次 bootstrap 採用的參數（後續檔案引用時以此為準）

| 參數 | 採用值 |
|---|---|
| PROJECT_NAME | invest |
| PROJECT_TYPE | 綠地模式（範本 invest 分支重置） |
| LANGUAGE | 繁體中文 |
| HARNESS_DIR | `.claude/harness/` |
| PROJECT_LESSONS_DIR | `.claude/harness/lessons/` |
| GLOBAL_LESSONS_DIR | `~/.claude/harness-global/` |
| EXECUTOR_MODEL | Fable 5（僅本次 bootstrap） |
| COMMANDER_MODEL | Opus 4.8（長期主對話/指揮官） |
| WORKER_MODEL | Sonnet 5（主力 Subagent） |
| CHEAP_MODEL | Haiku 4.5（廉價批次任務） |

## 2. 開局就該立起的 Harness 基線（五個審查面向的綠地版）

以下每項標註【已建立】或【尚未建立，建議初始設定】。

### 2.1 設定文件層（全域 + 專案）
- 【已建立】專案根 `CLAUDE.md` 作為**路由中心**：只放核心架構與檔案路由，任何超過 10 行的規則抽成獨立檔案。理由：CLAUDE.md 每次對話都載入，越長→單條規則被遵從的機率越低、Token 越浪費。
- 【已建立】`.claude/harness/` 制度目錄（本目錄，進 git）。
- 【尚未建立，建議初始設定】`.claude/settings.json`（專案共享 permissions）：技術棧確定後，把 `npm run lint`、`npm run test` 等驗證命令加入 allow 清單，減少弱模型被權限彈窗打斷。
- 【診斷附註·全域層】使用者的 `~/.claude/settings.json` 曾含多條指向舊專案絕對路徑（`grapeAppAA-*`）的 permission 殘留與一條過寬規則（`Bash(for f:*)`）。已於 2026-07-04 經 User 同意清理完畢：Read 路徑規則統一指向 `Desktop/專案/**` 與 `Desktop/自用資料/**` 全專案範圍，原檔備份於 `~/.claude/settings.json.bak`。

### 2.2 Skills / MCP
- 【現況與處置】全域已有 8 個 grapeApp 導向的 skills（add-locale-currency、code-review、code-review-commit、commit-msg-from-staged、converting-image-to-webp、frontend-development、i18n-translation、pre-test），皆綁定舊專案（grapeApp）的路徑與規範。處置規則：**在本專案中禁止直接 invoke 上列 skills**；若其觸發條件在本專案命中，改為依本 harness 規則手動執行同類工作；確實想沿用其流程時，先熔斷徵求 User 同意，再 fork 為本專案 `.claude/skills/` 下的專案版。
- 【已建立】專案 skills 於 `.claude/skills/`（進 git）：3 個場景入口＋3 個工程化動作（清單見 README「專案 Skills」節），2026-07-05 經 User 指示建立。後續新增 skill 的門檻：同一操作流程被人工重複指示 ≥ 3 次才立 skill，避免 skill 氾濫；skill 一律薄路由，規則本體留在 harness。
- 【建議】MCP server 按需配置，每新增一個 MCP 必須在 CLAUDE.md 路由區登記一行「名稱＋用途＋何時用」，否則弱模型不知道它存在或亂用。

### 2.3 Hooks / Commands / 自動化
- 【已建立，2026-07-05 經 User 核可】harness 保護 hook（PreToolUse）：對制度規則檔（CLAUDE.md、harness 頂層 *.md）的 Edit/Write，無同名 .bak 即物理擋下——04 §5 備份規則的強制版。腳本：`.claude/hooks/protect-harness.py`（fail-open，不保護 lessons/ 與新建檔）；掛載：`.claude/settings.json`。注意：hooks 設定變更需重啟 session 才生效。
- 【尚未建立，建議初始設定】技術棧確定後優先建立一個 PostToolUse hook：對 Edit/Write 的檔案自動跑 linter。這是「物理級」防錯——不依賴模型自覺。
- 【原則】自動化行為（「每次 X 後做 Y」）一律用 hooks 實現，不寫進 CLAUDE.md 期望模型記得——模型記憶不是執行保證。

### 2.4 指令文件（CLAUDE.md / instructions）
- 【已建立】三層知識架構＋權威關係，見 CLAUDE.md 路由區。
- 【規則】「弱模型需要明確、強模型需要留白」：本 harness 的規則檔一律給**明確判準與正反例**；不寫「請保持高品質」這類自由心證語句。

### 2.5 檔案讀寫 / 任務拆解 / 驗證 / 回顧 / 測試 / 交付
- 【已建立】任務拆解與委派 → `01-model-dispatch.md`；驗收判準 → `02-judgment-matrix.md`；派工模板 → `03-delegation-templates.md`；回顧沉澱 → `04-knowledge-protocol.md`。
- 【尚未建立，建議初始設定——技術棧確定後第一件事】定義**可執行的驗證命令**並寫入 CLAUDE.md「驗證命令」區（例：`npm run lint && npm run test && npm run build`）。在驗證命令存在之前，任何「功能完成」的宣稱都只是猜測。

## 3. 綠地新專案最常見、最傷 Token / 最易失焦的前三大反模式與預防

### 反模式 1：無驗證命令就開工（最傷）
- **症狀**：模型寫完程式碼後宣稱「已完成」，但專案沒有 lint/test/build 可跑，「完成」全憑模型自我感覺。錯誤累積到後期才爆發，返工成本 10 倍起跳。
- **物理級預防**：CLAUDE.md 設「驗證命令」專區。規則：**該區為空時，禁止標記任何實作任務為完成**，只能標記為「已實作、未驗證」，並把「建立驗證命令」列為最高優先任務回報 User。

### 反模式 2：主對話（指揮官）親自大量讀檔 / 掃 repo
- **症狀**：指揮官模型為了「了解情況」連續 Read 十幾個檔案，Context 被原始碼灌爆 → 後續決策失焦、早期指令被稀釋、Token 燒毀。這是長對話品質衰退的第一大原因。
- **物理級預防**：`01-model-dispatch.md` 的「指揮官不下場」規則＋量化紅線：主對話單輪 Read 超過 3 個檔案或任何單檔超過 400 行 → 必須改派 Subagent 摘要回報。

### 反模式 3：規則與教訓全塞 CLAUDE.md（或散落對話中）
- **症狀**：踩坑教訓口頭講過就忘、或全部堆進 CLAUDE.md 讓它膨脹成千行巨獸；新 session / 新組員完全繼承不到，同一個坑每個 session 重踩一次。
- **物理級預防**：三層知識架構（見 `04-knowledge-protocol.md`）＋ CLAUDE.md 純路由化。每次踩坑**當場落檔**到 lessons，不存在「記在腦中」這個選項。

## 4. 技術棧確定後的補完清單（TODO — 由 COMMANDER 在確定棧後執行並勾銷）

- [x] ~~更新本檔頂部技術棧欄位~~（2026-07-05 harness-init 已填一行式摘要「Vue 3 + Vite + Pinia + TypeScript」；操作層詳值仍待 /stack-setup 填入 07）
- [ ] 在 CLAUDE.md「驗證命令」區填入實際命令（lint / test / build / dev）
- [ ] 填寫 `07-stack-profile.md` 全部**可確定**欄位（同步把 ⬜ 改 ✅）；無法確定者依 07 填寫規則保持 ⬜ 並註明原因，不阻擋本項勾銷
- [ ] 建立 `.claude/settings.json` 專案 permissions（allow 驗證命令）
- [ ] 建立 lint hook（見 2.3）
- [ ] 依實際建置產物增補 `.gitignore`

> 授權範圍：清單中「填寫欄位、勾銷項目」類動作屬 `04-knowledge-protocol.md` 第 5 節預授權，免徵求同意；「建立 settings.json／建立 lint hook／增補 .gitignore」屬環境變更——執行前把擬定內容一次性列給 User 核可，核可後即可全部執行並勾銷。

## 5. 誠實條款：本 Harness 的能力極限

本 Harness 透過「任務拆解＋隔離驗證＋量化判準」讓 Sonnet/Haiku 級模型逼近高階品質，但以下三類問題**弱模型注定做不好，制度也救不了**，遇到時的標準動作是「熔斷提問」而非硬做：

1. **模糊的商業美感 / 品味決策**（UI 好不好看、文案語氣對不對、兩個都能跑的架構選哪個更「優雅」）。
   → 標準動作：產出 2–3 個具體選項（可附截圖/程式碼片段），各附一行客觀差異描述，**交 User 選擇**。禁止弱模型自行拍板後繼續往下蓋。
2. **需求本身的取捨**（功能範圍、優先級、對外承諾）。
   → 標準動作：觸發 `02-judgment-matrix.md` 熔斷判準第 3 節，帶選項提問。
3. **跨 session 的隱性脈絡**（User 上週口頭說過但沒落檔的決定）。
   → 標準動作：只信落檔紀錄（CLAUDE.md / harness / lessons / git history）。落檔紀錄查無 → 明說「查無紀錄」並提問，**禁止腦補**。

另註：本 Harness 的規則本身由 Fable 5 一次性外化而成，未經長期實戰打磨。前 2–4 週使用中若發現規則與實際摩擦，依 `04-knowledge-protocol.md` 的權限分級提案修訂——結構性修改需 User 同意。

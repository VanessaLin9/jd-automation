# Chrome Extension v1 功能書

## 1. 文件目的

這份文件定義求職 Chrome Extension 的第一版功能範圍、技術選型、資料流、權限需求與驗收標準。

本文件只描述 **Chrome Extension 本體**，不包含：

- `openclaw`
- Telegram 推送
- AI 推薦信生成
- 背景輪詢

這些後續自動化流程視為使用者自己的外部系統，不屬於 extension 的產品責任。

## 2. 產品定位

### 2.1 單一句話

在求職網站頁面上，一鍵將 JD 存到使用者自己的 Google Sheet，並標記為 `saved`。

### 2.2 產品目標

讓使用者在瀏覽職缺時，用最低摩擦完成「值得投遞的 JD 收錄」。

### 2.3 非目標

第一版不處理：

- 履歷投遞
- AI 文案生成
- 表單自動填寫
- 面試流程追蹤
- 自動同步到其他系統

## 3. 核心使用情境

1. 使用者正在瀏覽某個求職網站的 JD 頁面。
2. 使用者看完後，覺得這份工作值得投遞。
3. 使用者點開 extension。
4. extension 讀取目前頁面的基本資訊與 JD 內容。
5. 使用者按下 `Save JD`。
6. extension 將資料送到使用者自己設定的 Google Apps Script Web App。
7. Web App 寫入使用者自己的 Google Sheet。
8. 新資料列預設 `queue_status = saved`。

## 4. 產品邊界

### 4.1 Extension 負責的事

- 讀取當前頁面資料
- 判斷資料來源站點
- 抽出統一格式的職缺資料
- 將資料送到使用者設定的 Web App URL
- 顯示成功、重複或失敗訊息
- 保存使用者自己的設定

### 4.2 Extension 不負責的事

- 解析 Google Sheet 後續狀態變化
- 根據 `saved` 執行任何 AI 任務
- 控制 Telegram
- 執行排程
- 維護使用者的外部服務

## 5. 使用者類型

### 5.1 主要使用者

有基本數位工具能力、願意自己建立 Google Sheet 與 Apps Script 的求職者。

### 5.2 第一版預設使用者能力

第一版假設使用者能：

- 安裝 Chrome Extension
- 複製 Web App URL
- 將 secret 填進設定頁
- 建立自己的 Google Sheet

因此 v1 是 **power-user friendly** 工具，不是零設定 SaaS。

## 6. 技術選型

### 6.1 前端技術

v1 採用：

- Manifest V3
- Vanilla JavaScript
- HTML
- CSS

### 6.2 為什麼不用框架

理由：

- 功能規模小
- 主要工作是頁面抽取與 HTTP 請求
- 不需要複雜狀態管理
- 不需要 bundler 才能完成 MVP
- 降低維護與除錯成本

### 6.3 後端依賴

extension 不內建後端，只依賴使用者自備的 Google Apps Script Web App。

## 7. 使用者設定

### 7.1 必要設定項目

v1 需提供 `Options` 頁面，讓使用者填入：

- `webAppUrl`
- `sharedSecret`

### 7.2 可選設定項目

第一版可先不做，但架構可保留：

- `defaultPriority`
- `enabledSites`
- `debugMode`

### 7.3 設定儲存位置

建議使用：

- `chrome.storage.sync`

原因：

- 使用者登入同一 Chrome 帳號時可同步設定
- 方便跨裝置使用

若後續遇到同步限制，再改為 `chrome.storage.local`。

## 8. 權限設計

### 8.1 必要權限

建議最小權限如下：

- `activeTab`
- `storage`
- `scripting`

### 8.2 Host Permissions

第一版只申請必要站點與使用者 Web App 所需主機：

- `https://www.104.com.tw/*` 或第一個目標網站
- `https://www.cakeresume.com/*` 或第二個目標網站
- `https://script.google.com/*`
- `https://script.googleusercontent.com/*`

### 8.3 權限策略

不在第一版使用：

- `<all_urls>`
- 不必要的 background 網域讀取
- 任何與使用者無關的遠端服務

這是未來上架的重要前提。

## 9. 資料流

### 9.1 寫入流程

```mermaid
flowchart LR
    A["JD 頁面"] --> B["content extractor"]
    B --> C["popup.js"]
    C --> D["組 payload"]
    D --> E["POST 到 Apps Script Web App"]
    E --> F["Google Sheet: JD 收錄池"]
```

### 9.2 payload 格式

extension 送出的資料格式如下：

```json
{
  "secret": "user-configured-secret",
  "record_id": "uuid",
  "saved_at": "2026-03-27T12:00:00+08:00",
  "queue_status": "saved",
  "source_site": "104",
  "job_url": "https://...",
  "job_title": "Frontend Engineer",
  "company": "Example Co",
  "industry": "",
  "location": "",
  "salary_text": "",
  "jd_text": "頁面主要職缺文字",
  "fit_note": "",
  "priority": "",
  "last_updated_at": "2026-03-27T12:00:00+08:00"
}
```

## 10. Google Sheet 相依規格

本 extension 預設要寫入 `JD 收錄池`，欄位格式依以下文件：

- [jd-intake-sheet-schema.md](/Users/vanessa/develop/job-application-automation/docs/jd-intake-sheet-schema.md)

Extension 不處理表格建立，只假設使用者已先依照模板建立好欄位。

## 11. UI 規格

### 11.1 第一版畫面

第一版包含兩個畫面：

1. `Popup`
2. `Options`

### 11.2 Popup 畫面

用途：

- 顯示目前頁面的抓取結果摘要
- 讓使用者按 `Save JD`

建議顯示：

- `source_site`
- `job_title`
- `company`
- `job_url` 簡短版本
- `Save JD` 按鈕
- 狀態訊息區

### 11.3 Popup 狀態

至少有以下 UI 狀態：

- `idle`
- `extracting`
- `ready`
- `saving`
- `saved`
- `duplicate`
- `error`

### 11.4 Options 畫面

用途：

- 保存 Web App URL
- 保存 shared secret
- 測試設定是否存在

建議欄位：

- `Web App URL`
- `Shared Secret`
- `Save Settings`

## 12. Extractor 設計

### 12.1 為什麼需要 extractor

不同求職網站的 DOM 結構不同，因此長期來看需要 adapter。但第一版不做成大型 crawler 架構，只做輕量 extractor 分派。

### 12.2 extractor 策略

採兩層：

1. `site-specific extractor`
2. `generic fallback extractor`

### 12.3 第一版建議支援策略

先鎖定一個網站做通，再擴到第二個。

建議順序：

1. 第一個站：由使用者最常使用的站決定
2. 第二個站：`104` 或 `CakeResume`
3. 其他站先走 generic fallback

### 12.4 共用回傳格式

每個 extractor 都回傳同一格式：

```js
{
  source_site: '104',
  job_url: 'https://...',
  job_title: '...',
  company: '...',
  industry: '',
  location: '',
  salary_text: '',
  jd_text: '...'
}
```

### 12.5 必抓欄位

若第一版 extractor 只能保證少數欄位，至少必須抓到：

- `job_url`
- `job_title`
- `jd_text`
- `source_site`

`company` 雖然重要，但在特殊情況下可允許空白。

### 12.6 generic fallback

generic fallback 策略如下：

- `job_url`: `location.href`
- `job_title`: 優先 `h1`，否則 `document.title`
- `jd_text`: 優先主要內容容器，否則 `document.body.innerText`
- `source_site`: 由 hostname 推斷
- `company`: 嘗試常見 selector，抓不到就空白

## 13. 系統檔案結構

建議專案結構：

```text
chrome-extension/
  manifest.json
  popup.html
  popup.js
  options.html
  options.js
  content.js
  extractors.js
  styles.css
  utils.js
```

### 13.1 `manifest.json`

定義：

- 權限
- popup
- options page
- content script 或 scripting 設定

### 13.2 `popup.js`

負責：

- 讀取目前 tab
- 向 content script 取得頁面抽取結果
- 從 storage 讀設定
- 組 payload
- 呼叫 Web App
- 顯示結果狀態

### 13.3 `options.js`

負責：

- 載入已保存設定
- 儲存設定到 `chrome.storage`
- 基本表單驗證

### 13.4 `content.js`

負責：

- 在頁面中執行 extractor
- 回傳標準化資料

### 13.5 `extractors.js`

負責：

- 根據 hostname 選擇對應 extractor
- 提供 generic fallback

## 14. 成功、失敗與重複行為

### 14.1 成功

當 Web App 回傳：

```json
{
  "ok": true,
  "status": "created"
}
```

Popup 顯示：

- `Saved to Google Sheet`

### 14.2 重複

當 Web App 回傳：

```json
{
  "ok": true,
  "status": "duplicate"
}
```

Popup 顯示：

- `This JD is already saved`

### 14.3 失敗

當 API 或 extractor 失敗時，Popup 顯示簡短錯誤，例如：

- `Settings are missing`
- `Failed to extract JD content`
- `Failed to save to Google Sheet`

第一版不要求複雜錯誤診斷。

## 15. 可分享性設計

### 15.1 為什麼這版適合分享

因為 extension 只處理「寫入使用者自己的 Google Sheet」：

- 不依賴作者私有後端
- 不要求作者代管資料
- 每位使用者可自行配置自己的 Web App URL

### 15.2 分享模式

第一版預設分享給會自行部署的人：

- 安裝 extension
- 建立自己的 Google Sheet
- 建立自己的 Apps Script
- 將設定填入 options 頁

### 15.3 未來上架的必要前提

後續若要上架 Chrome Web Store，這個設計已具備好幾個有利條件：

- 單一明確用途
- 權限範圍可控
- 不綁作者私人服務
- 設定可由使用者自行提供

## 16. 第一版不做的功能

為避免 MVP 膨脹，以下功能明確排除：

- 在 popup 內直接編輯 `fit_note`
- 多工作表切換
- 自動偵測 Google Sheet schema
- 在頁面上插入浮動按鈕
- 登入系統
- 內建教學精靈
- 同步面試追蹤表
- AI 生成按鈕

## 17. 驗收標準

v1 完成至少要符合以下條件：

1. 使用者可以在 options 頁保存 `webAppUrl` 與 `sharedSecret`。
2. 使用者在支援站點打開 popup 時，extension 能抓到目前頁面的基本職缺資訊。
3. 使用者按 `Save JD` 後，extension 能成功呼叫 Web App。
4. Google Sheet 中新增一筆 `queue_status = saved` 的資料列。
5. 若同一 `job_url` 重複儲存，UI 會顯示 `duplicate`。
6. 若設定缺失或 API 失敗，UI 會顯示明確錯誤。

## 18. 開發順序建議

建議照以下順序開工：

1. 建立 extension 專案骨架
2. 實作 options 頁與設定儲存
3. 實作 popup UI
4. 實作 generic extractor
5. 選定第一個求職網站並做 site-specific extractor
6. 串接 Apps Script Web App
7. 跑端到端測試
8. 再考慮第二個站點 adapter

## 19. v1 後續擴充方向

v1 穩定後，可往下擴充：

- 支援第二個求職網站
- 增加更多 site-specific extractor
- 在 popup 中加入 `priority` 或 `fit_note`
- 增加更清楚的成功後跳轉或連結
- 增加匯出 debug 資訊

## 20. 本文件結論

Chrome Extension v1 的正確切法是：

- 專注做好「JD 頁面 -> Google Sheet(saved)」
- 將後續 AI 與自動化排除在 extension 之外
- 以可分享、可上架、可由使用者自行配置為前提設計

這樣能讓產品邊界清晰、技術負擔較低，也最符合目前的實作優先順序。

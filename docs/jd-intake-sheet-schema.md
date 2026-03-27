# JD 收錄池欄位規格

## 1. 目標

這張表是求職投遞自動化的第一張核心工作表，供以下流程共用：

- Chrome Extension 寫入新收錄的 JD
- `openclaw` heartbeat 定期掃描待處理任務
- AI 生成推薦信草稿後回寫結果
- 使用者人工查看與修稿

第一版先以 **MVP 可運作** 為主，不追求一次把所有欄位設滿。

## 2. 工作表名稱

建議工作表名稱：

- `JD 收錄池`

## 3. MVP 欄位排序

以下欄位順序建議直接作為第一版表頭。

| 欄位名稱 | 必要性 | 寫入者 | 說明 |
| --- | --- | --- | --- |
| `record_id` | 必要 | extension | 每筆資料唯一 ID，建議用 UUID |
| `saved_at` | 必要 | extension | 收錄時間，ISO datetime 或可讀時間皆可 |
| `queue_status` | 必要 | extension / openclaw | 任務狀態欄，初始值為 `saved` |
| `source_site` | 必要 | extension | 來源站點，例如 `104`、`cakeresume` |
| `job_url` | 必要 | extension | 職缺連結 |
| `job_title` | 必要 | extension | 職缺名稱 |
| `company` | 必要 | extension | 公司名稱 |
| `industry` | 選填 | extension | 產業，抓得到就寫 |
| `location` | 選填 | extension | 工作地點 |
| `salary_text` | 選填 | extension | 薪資原文 |
| `jd_text` | 必要 | extension | 頁面主要 JD 文字 |
| `fit_note` | 選填 | 使用者 | 當下手動備註，例如為什麼想投 |
| `priority` | 選填 | 使用者 | 主觀優先度，先保留文字即可 |
| `draft_started_at` | 選填 | openclaw | openclaw 開始生成草稿時間 |
| `draft_generated_at` | 選填 | openclaw | 草稿生成完成時間 |
| `skill_used` | 選填 | openclaw | 例如 `generate_application_pack` |
| `cover_letter_short` | 選填 | openclaw | 短版推薦信 |
| `cover_letter_full` | 選填 | openclaw | 完整版推薦信 |
| `fit_reasons` | 選填 | openclaw | AI 歸納出的 3 點適配理由 |
| `gap_notes` | 選填 | openclaw | 缺口或風險提醒 |
| `telegram_sent_at` | 選填 | openclaw | Telegram 推送時間 |
| `telegram_message_ref` | 選填 | openclaw | Telegram 訊息識別資訊或連結 |
| `error_message` | 選填 | openclaw | 失敗原因 |
| `last_updated_at` | 選填 | extension / openclaw | 最後更新時間 |

## 4. MVP 必要欄位最小集合

如果第一版想再更小，只要先保留下面這 11 欄也能運作：

- `record_id`
- `saved_at`
- `queue_status`
- `source_site`
- `job_url`
- `job_title`
- `company`
- `jd_text`
- `draft_generated_at`
- `cover_letter_full`
- `error_message`

但考量後續很快就會需要，我仍建議直接採用前一節的完整 MVP 欄位。

## 5. queue_status 狀態值

`queue_status` 請固定只使用以下值：

- `saved`
- `drafting`
- `draft_ready`
- `applied`
- `skip`
- `error`

### 狀態說明

| 狀態 | 意義 |
| --- | --- |
| `saved` | 已收錄，等待 `openclaw` 處理 |
| `drafting` | `openclaw` 已鎖定並開始生成 |
| `draft_ready` | 草稿已生成並回寫 |
| `applied` | 使用者已正式投遞 |
| `skip` | 後來決定不投 |
| `error` | 生成失敗，待手動重試 |

## 6. 欄位使用規則

### 6.1 Extension 寫入規則

Chrome Extension 新增一筆資料時至少要寫：

- `record_id`
- `saved_at`
- `queue_status = saved`
- `source_site`
- `job_url`
- `job_title`
- `company`
- `jd_text`
- `last_updated_at`

若抓得到，也一起寫：

- `industry`
- `location`
- `salary_text`

### 6.2 openclaw 寫入規則

當 heartbeat 撿到一筆 `saved` 時：

1. 先將 `queue_status` 更新為 `drafting`
2. 寫入 `draft_started_at`
3. 寫入 `skill_used`
4. 完成後寫入推薦信與摘要欄位
5. 成功時將 `queue_status` 改為 `draft_ready`
6. 失敗時將 `queue_status` 改為 `error` 並寫 `error_message`

### 6.3 使用者手動欄位

第一版使用者手動維護：

- `fit_note`
- `priority`
- `queue_status` 在必要時人工修正，例如 `error -> saved` 重試

## 7. 去重規則

建議以 `job_url` 為主要去重鍵。

若 `job_url` 已存在：

- 不新增新列
- 可選擇回傳既有 `record_id`

後續若遇到同網址但不同追蹤需求，再考慮加入：

- `company + job_title`
- `source_site + external_job_id`

## 8. 資料格式建議

### 8.1 時間欄位

建議統一使用 ISO datetime，例如：

- `2026-03-26T18:45:00+08:00`

### 8.2 長文字欄位

以下欄位會是長文字：

- `jd_text`
- `cover_letter_short`
- `cover_letter_full`
- `fit_reasons`
- `gap_notes`
- `error_message`

建議在 Google Sheet 中開啟換行顯示，避免閱讀困難。

### 8.3 priority 欄位

第一版先使用自由文字即可，例如：

- `high`
- `medium`
- `low`

等到真開始試用後，再決定要不要做資料驗證下拉選單。

## 9. 第一版欄位凍結建議

為了讓表好用，建議先凍結前 7 欄：

- `record_id`
- `saved_at`
- `queue_status`
- `source_site`
- `job_url`
- `job_title`
- `company`

這樣往右看長文字欄位時，核心識別資訊不會消失。

## 10. 第一版試用重點

試用這張表時，重點觀察以下問題：

- `jd_text` 太長會不會讓表難用
- `fit_note` 是否真的會常填
- `priority` 是否值得保留在第一版
- `cover_letter_short` 與 `cover_letter_full` 是否要拆成兩張表或一張表即可
- `draft_ready` 到 `applied` 之間是否還需要更多狀態

目前結論是：先讓流程跑起來，再依真實使用感覺裁欄位，而不是先做過度設計。

## 11. 下一步

這張表欄位若確認採用，接下來就能直接做兩件事：

1. 寫 Apps Script Web App，讓 extension 可以新增資料
2. 寫 `openclaw` heartbeat，讓它掃描 `queue_status = saved`

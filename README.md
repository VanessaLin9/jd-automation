# JD Saver for Google Sheets

Save the current job description page to your own Google Sheet.

`JD Saver for Google Sheets` is a Chrome extension for people who want to collect job listings into a structured spreadsheet while browsing. It reads the current JD page, extracts key job information, and saves it into a Google Sheet owned by the user.

This project is intentionally focused on one job:

`JD page -> user-owned Google Sheet`

It does **not** include downstream automation such as AI cover letter generation, Telegram delivery, or automatic job application submission.

## License

This project is source-available under the PolyForm Noncommercial 1.0.0 license.

- Noncommercial use is allowed
- Commercial use is not allowed under the default license
- Please keep the original attribution and notice information

See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## Features

- Save the current job page to your own Google Sheet
- Support Google OAuth + Google Sheets API
- Create and initialize a ready-to-use Google Sheet directly from the extension
- Detect duplicate job URLs
- Support English and Traditional Chinese in the extension UI
- Support site-specific extraction for:
  - 104
  - CakeResume
- Fall back to a generic extractor for other job pages

## How It Works

1. Open the extension settings page
2. Connect your Google account
3. Click `Create My Sheet`
4. JD Saver creates and configures your Google Sheet automatically
5. Visit a supported JD page
6. Click `Save JD`

The extension writes the extracted job data directly into your own Google Sheet.

## Generated Sheet

JD Saver creates a Google Sheet for the user during setup.
The generated sheet includes:

- worksheet name: `JD 收錄池`
- the required column order
- frozen header row
- default dropdown fields for the status columns

Current worksheet name expected by the extension:

- `JD 收錄池`

Current column order used by the extension:

1. `Job URL / 職缺網址`
2. `Saved At / 收錄時間`
3. `Record Status / 收錄狀態`
4. `Job Title / 職缺名稱`
5. `Company / 公司`
6. `Location / 地點`
7. `Salary / 薪資`
8. `JD Text / JD 內容`
9. `Industry / 產業`
10. `Source Site / 來源網站`
11. `Applied Date / 投遞日期`
12. `Application Status / 投遞狀態`
13. `Note / 備註`
14. `Agent Queue / Agent 佇列`

## Local Testing

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Choose `Load unpacked`
4. Select the `chrome-extension/` directory
5. Open the extension settings page
6. Click `Connect Google`
7. Click `Create My Sheet`
8. Visit a job page and click `Save JD`

## Project Layout

```text
chrome-extension/
```

## Notes

- This project is currently in MVP / pre-launch stage.
- The current architecture is based on Google OAuth + Google Sheets API.
- The Google Sheet is owned by the user, not by the extension author.
- The extension currently does not include automated follow-up workflows.

---

# JD Saver for Google Sheets 繁體中文說明

把你正在瀏覽的職缺頁面，一鍵存到你自己的 Google Sheet。

`JD Saver for Google Sheets` 是一個 Chrome extension，適合想在瀏覽職缺時順手把 JD 收進試算表的人。它會讀取目前頁面的職缺內容、擷取主要欄位，並直接寫進使用者自己的 Google Sheet。

這個專案刻意只做一件事：

`JD 頁面 -> 使用者自己的 Google Sheet`

它**不包含**後續自動化流程，例如：

- AI 自我推薦信生成
- Telegram 推送
- 自動投遞

## 授權

本專案採用 `PolyForm Noncommercial 1.0.0`，屬於 source-available 授權。

- 允許非商業使用
- 不允許在預設授權下直接商業使用
- 請保留原作者與 notice 資訊

請參考 [LICENSE](./LICENSE) 與 [NOTICE](./NOTICE)。

## 目前功能

- 將目前職缺頁面存到使用者自己的 Google Sheet
- 使用 Google OAuth 與 Google Sheets API
- 直接由 extension 建立並初始化可用的 Google Sheet
- 可檢查重複的職缺網址
- extension UI 支援英文與繁體中文
- 已針對以下網站做較佳擷取：
  - 104
  - CakeResume
- 其他網站則使用 generic extractor

## 使用方式

1. 打開 extension 設定頁
2. 連接 Google 帳號
3. 點 `Create My Sheet`
4. JD Saver 會自動建立並初始化你的 Google Sheet
5. 前往支援的職缺頁面
6. 按下 `Save JD`

extension 會把擷取出的資料直接寫進你的 Google Sheet。

## 建立出的表單

JD Saver 會在設定流程中直接建立使用者自己的 Google Sheet。
建立完成後會自動初始化：

- 工作表名稱：`JD 收錄池`
- 必要欄位順序
- 凍結標題列
- 狀態欄位的預設下拉選單

extension 目前預期使用的工作表名稱：

- `JD 收錄池`

extension 目前使用的欄位順序：

1. `Job URL / 職缺網址`
2. `Saved At / 收錄時間`
3. `Record Status / 收錄狀態`
4. `Job Title / 職缺名稱`
5. `Company / 公司`
6. `Location / 地點`
7. `Salary / 薪資`
8. `JD Text / JD 內容`
9. `Industry / 產業`
10. `Source Site / 來源網站`
11. `Applied Date / 投遞日期`
12. `Application Status / 投遞狀態`
13. `Note / 備註`
14. `Agent Queue / Agent 佇列`

## 本地測試方式

1. 打開 `chrome://extensions`
2. 開啟 `Developer mode`
3. 點選 `Load unpacked`
4. 選擇 `chrome-extension/` 資料夾
5. 打開 extension 設定頁
6. 點 `Connect Google`
7. 點 `Create My Sheet`
8. 前往職缺頁面並點擊 `Save JD`

## 專案結構

```text
chrome-extension/
```

## 備註

- 目前仍屬於 MVP / 上線前整理階段
- 當前架構為 Google OAuth + Google Sheets API
- Google Sheet 是使用者自己的，不是 extension 作者代管
- 目前不包含後續自動化工作流

# JD Saver for Google Sheets

Language: [繁體中文](./README.md) | **English**

Save the current job description page to your own Google Sheet.

`JD Saver for Google Sheets` is a Chrome extension for people who want to collect job listings into a structured spreadsheet while browsing. It reads the current JD page, extracts key job information, and saves it into a Google Sheet owned by the user.

## Available Now

JD Saver is now live on the Chrome Web Store:

- [Install JD Saver for Google Sheets](https://chromewebstore.google.com/detail/ipcamokmondmagfhndmifhdeldppekni?utm_source=item-share-cb)

Highlights:

- Save the current job page directly into your own Google Sheet
- Generate a ready-to-use job tracking sheet with workflow columns and dashboard metrics
- Support Google OAuth and Google Sheets API without requiring a separate backend
- Support both English and Traditional Chinese

This project is intentionally focused on one job:

`JD page -> user-owned Google Sheet`

It does **not** include downstream automation such as AI cover letter generation, Telegram delivery, or automatic job application submission.

## License

This project is source-available under the PolyForm Noncommercial 1.0.0 license.

- Noncommercial use is allowed
- Commercial use is not allowed under the default license
- Please keep the original attribution and notice information

See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

## Privacy

The current privacy policy for the extension is available here:

- [PRIVACY.md](./PRIVACY.md)

## Features

- Save the current job page to your own Google Sheet
- Support Google OAuth + Google Sheets API
- Create and initialize a ready-to-use Google Sheet directly from the extension
- Detect duplicate job URLs
- Support both English and Traditional Chinese in the extension UI
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
- dashboard worksheet: `Metrics / 指標總覽`
- the required column order
- frozen header row
- default dropdown fields for the status columns
- starter formulas for core application metrics

Current worksheet names expected by the extension:

- `JD 收錄池`
- `Metrics / 指標總覽`

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
15. `關卡 1 類型`
16. `關卡 1 日期`
17. `關卡 2 類型`
18. `關卡 2 日期`
19. `關卡 3 類型`
20. `關卡 3 日期`
21. `Result 類型`

The extension currently writes the first 14 columns directly. The later workflow columns are created by the template so the generated sheet is ready for manual tracking and downstream workflows.
The generated dashboard worksheet includes starter metrics for applied count, application reply count, application reply rate, inbound invite count, total interest count, application offer count, total offer count, reject count, withdraw count, and offer rate among replied companies.

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

- This project is now publicly available on the Chrome Web Store.
- The current architecture is based on Google OAuth + Google Sheets API.
- The Google Sheet is owned by the user, not by the extension author.
- The extension currently does not include automated follow-up workflows.

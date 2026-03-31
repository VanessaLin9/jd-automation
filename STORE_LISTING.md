# Chrome Web Store Listing

Last updated: 2026-03-31

This file is a ready-to-edit draft for the Chrome Web Store listing of `JD Saver for Google Sheets`.

## Recommended Basics

- Store title: `JD Saver for Google Sheets`
- Privacy policy URL: `https://vanessalin9.github.io/jd-automation/`
- Suggested positioning: simple job-saving tool, not an all-in-one job automation suite
- Suggested disclaimer: `This extension is not affiliated with or endorsed by Google.`

## Final Copy

### Short Description

Recommended final version:

`Save the current job description page to your own Google Sheet in one click.`

Alternative version:

`Save job pages to Google Sheets, manage multiple trackers, and avoid duplicate entries.`

### Detailed Description

Recommended final version:

JD Saver helps you save the current job description page to your own Google Sheet while you browse.

It is built for one simple workflow:

`JD page -> your Google Sheet`

JD Saver does not try to automate your entire job search. Instead, it focuses on one clean job: capturing the current job page, extracting the key details, and saving them into a structured tracker that you control.

What you can do with JD Saver:

- Connect your Google account
- Create a ready-to-use job tracker directly from the extension
- Save the current job page in one click
- Manage multiple Google Sheets and switch your active tracker anytime
- Avoid duplicate entries by checking existing job URLs
- Use the extension in English or Traditional Chinese
- Get better extraction support for 104 and CakeResume, with a generic fallback for other job pages

How it works:

1. Open JD Saver Settings
2. Connect Google
3. Click `Create My Sheet`
4. JD Saver creates and formats a Google Sheet for you
5. Visit a job description page
6. Click `Save JD`

Your saved data stays in your own Google Sheet, not on a developer-owned backend.

Privacy and data handling:

- JD Saver reads job-page content only when you actively use the extension
- Data is written to your own Google Sheet
- JD Saver does not send your saved job data to a developer-owned server
- The extension stores only the settings needed to work, such as your selected language and connected sheet list

This extension is not affiliated with or endorsed by Google.

### Traditional Chinese Draft

把你正在瀏覽的職缺頁面，一鍵存到你自己的 Google Sheet。

JD Saver 專注做好一件事：

`JD 頁面 -> 你的 Google Sheet`

它不是一個想包辦所有求職流程的大而全工具，而是一個輕量、直接、可控的收錄工具。你在瀏覽職缺時，只要打開 extension，就能把目前頁面的重點資訊整理後寫進你自己的求職追蹤表。

你可以用 JD Saver：

- 連接自己的 Google 帳號
- 直接建立一張已完成欄位與格式設定的求職追蹤表
- 一鍵儲存目前的職缺頁面
- 管理多張 Google Sheets，並切換目前使用中的表單
- 自動避免重複儲存相同的 job URL
- 使用英文或繁體中文介面
- 在 104、CakeResume 上獲得較佳擷取效果，其他網站則使用通用擷取方式

使用方式：

1. 打開 JD Saver 的設定頁
2. 連接 Google
3. 點選 `Create My Sheet`
4. extension 會幫你建立並整理好一張可直接使用的 Google Sheet
5. 前往職缺頁面
6. 點選 `Save JD`

這張 Google Sheet 屬於你自己，不是由 extension 開發者代管。

隱私與資料處理：

- JD Saver 只會在你主動使用 extension 時讀取目前頁面的內容
- 資料會寫入你自己的 Google Sheet
- JD Saver 不會把你儲存的職缺資料傳到開發者自有伺服器
- extension 只會保存少量必要設定，例如介面語言與已連結的表單清單

本 extension 與 Google 無隸屬關係，也未獲 Google 背書或認可。

## Dashboard Answers

Use these as clean draft answers in the Chrome Web Store dashboard.

### `activeTab`

`Used to access the current job page only when the user actively opens JD Saver and chooses to save the current listing.`

### `scripting`

`Used to run the extractor on the active tab so the extension can read job title, company, URL, and job description text from the current page when the user clicks save.`

### `identity`

`Used to let the user sign in with Google so the extension can create and update the user's own Google Sheet.`

### `storage`

`Used to save local extension settings such as language preference, connected sheet list, and the currently active sheet.`

### `https://sheets.googleapis.com/*`

`Used to call Google Sheets API endpoints for creating sheets, reading sheet metadata, checking duplicate job URLs, and writing saved job records to the user's selected sheet.`

### `https://www.googleapis.com/auth/drive.file`

`Used to create and access only the Google Sheets that the user creates or chooses to use with JD Saver.`

## Notes for Reviewer

Recommended draft:

`JD Saver only runs when the user actively opens the extension and chooses to save the current job page. The extension uses activeTab and scripting to extract job information from the current page, then writes the data directly to a Google Sheet owned by the user. The source code is publicly available on GitHub under the PolyForm Noncommercial License for transparency and security review. This extension is not affiliated with or endorsed by Google.`

## Suggested Screenshot Set

Aim for 4 to 5 screenshots with clean, readable titles.

1. `Connect Google and create your first job tracker`
2. `Save the current job page in one click`
3. `Manage multiple Google Sheets for different job searches`
4. `Switch your active sheet anytime`
5. `Keep job records organized in your own spreadsheet`

## Suggested Screenshot Captions

### Screenshot 1

`Connect Google and let JD Saver create a ready-to-use tracker for you.`

### Screenshot 2

`Save the current job description page directly to your selected Google Sheet.`

### Screenshot 3

`Create multiple trackers for different job searches, roles, or countries.`

### Screenshot 4

`Switch the active sheet without losing your saved setup.`

### Screenshot 5

`Review saved job records in a structured sheet that you control.`

## Reviewer-Friendly Notes

These are useful for store copy, review notes, or support responses.

- JD Saver only runs on the active tab when the user explicitly uses the extension.
- JD Saver does not request broad host permissions for job sites.
- JD Saver does not use a developer-owned backend to store job data.
- Google Sheets created by JD Saver belong to the user.
- The extension is focused on saving job descriptions, not on auto-applying to jobs.

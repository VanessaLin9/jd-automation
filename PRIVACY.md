# Privacy Policy for JD Saver for Google Sheets

Last updated: 2026-03-31

`JD Saver for Google Sheets` is a Chrome extension that helps users save the current job description page to a Google Sheet owned by the user.

This privacy policy explains what data the extension handles, why it handles that data, and where that data goes.

## Summary

- The extension reads job-page content from the current tab only when the user actively uses the extension.
- The extension stores a small amount of settings data in Chrome storage so the user can keep their preferred language and connected sheet list.
- The extension sends data to Google APIs only to create, read, or update Google Sheets in the user's own Google account.
- The extension does not send user data to the developer's own server.
- The extension does not sell user data.

## Data the extension handles

The extension may handle the following categories of data:

### 1. Current job-page content

When the user opens the popup on a job description page or clicks `Save JD`, the extension may read content from the active tab in order to extract job information such as:

- job URL
- job title
- company name
- location
- salary text
- job description text
- industry
- source site

This access is limited to the active tab and is used only to prepare and save the record that the user requested.

### 2. Google Sheet metadata and sheet content

When the user connects Google and uses the extension's sheet features, the extension may access:

- spreadsheet IDs
- spreadsheet URLs
- spreadsheet titles
- worksheet metadata
- existing values in the target sheet that are needed for duplicate checks or writes

This is used to create the user's sheet, refresh saved sheet names, check whether a job URL already exists, and write a new job record into the active sheet.

### 3. Local extension settings

The extension stores limited settings in `chrome.storage.sync`, including:

- interface language
- whether Google auth has been connected in the extension
- saved sheet list
- active sheet ID
- active sheet URL

This data is used only to keep the extension working across browser sessions.

## How the data is used

The extension uses handled data only for the following product functions:

- extracting job information from the current page
- creating and initializing a Google Sheet for the user
- letting the user manage multiple saved sheets
- switching the active sheet
- checking for duplicate job URLs
- writing job records into the user's selected Google Sheet
- storing interface and setup preferences

The extension does not use this data for advertising, profiling, or selling data to third parties.

## Where the data goes

Data handled by the extension may be stored or transmitted in the following places:

- `chrome.storage.sync`, for extension settings
- the user's own Google account, through Google Sheets / Google Drive related APIs used by the extension

The developer does not operate a separate backend server for this extension, and the extension does not transmit extracted job data to a developer-owned server.

## Google access and OAuth

The extension uses Google OAuth through Chrome's identity APIs so the user can authorize access to their own Google Sheets workflow.

The extension currently requests the Google scope:

- `https://www.googleapis.com/auth/drive.file`

This scope is used so the extension can create and manage spreadsheets that the user chooses to use with JD Saver.

## Google API Services User Data Policy

JD Saver for Google Sheets' use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.

## Chrome extension permissions

The extension currently uses these Chrome permissions:

- `activeTab`: to read the current page when the user actively uses the extension on that tab
- `scripting`: to run the extractor on the active page
- `identity`: to let the user sign in with Google and authorize Google API access
- `storage`: to save extension settings

The extension also uses the host permission:

- `https://sheets.googleapis.com/*`

This is used to access Google Sheets API endpoints needed for sheet creation, metadata reads, duplicate checks, and row updates.

## Data sharing

The extension does not sell user data.

The extension does not share user data with data brokers, advertisers, or analytics providers.

User data is shared only with Google services when necessary to provide the extension's sheet-related features requested by the user.

## Data retention and user control

Users control the main data destinations used by the extension:

- Extension settings remain in Chrome storage until the user clears browser extension storage, signs out of Chrome sync, or removes the extension.
- Saved job records remain in the user's Google Sheet until the user edits or deletes them from their Google account.
- Users can disconnect Google from the extension, stop using the extension, or uninstall it at any time.

## Children

This extension is not directed to children.

## Changes to this policy

This privacy policy may be updated as the product changes. The latest version will be published at the same policy URL used for the Chrome Web Store listing.

## Contact

For privacy questions or requests related to this extension, please open an issue in the project repository:

- [GitHub Issues](https://github.com/VanessaLin9/jd-automation/issues)

---

# JD Saver for Google Sheets 隱私權政策

最後更新日期：2026-03-31

`JD Saver for Google Sheets` 是一個 Chrome extension，幫助使用者把目前瀏覽中的職缺頁面存到使用者自己的 Google Sheet。

本政策說明 extension 會處理哪些資料、為什麼需要處理，以及資料會去哪裡。

## 重點摘要

- extension 只會在使用者主動使用 extension 時，讀取目前分頁中的職缺內容。
- extension 只會在 Chrome 儲存少量設定資料，例如語言與已連結的表單清單。
- extension 只會把資料傳到 Google API，用來建立、讀取或更新使用者自己帳號下的 Google Sheet。
- extension 不會把使用者資料傳到開發者自有伺服器。
- extension 不會販售使用者資料。

## extension 會處理的資料

### 1. 目前分頁的職缺內容

當使用者在職缺頁打開 popup，或點擊 `Save JD` 時，extension 可能會讀取目前作用中的分頁內容，以擷取像是以下欄位：

- 職缺網址
- 職缺名稱
- 公司名稱
- 地點
- 薪資文字
- JD 內容
- 產業
- 來源網站

這類存取僅限於使用者目前作用中的分頁，且只用於完成使用者要求的儲存動作。

### 2. Google Sheet 的中繼資料與表單內容

當使用者連接 Google 並使用 extension 的表單功能時，extension 可能會讀取：

- spreadsheet ID
- spreadsheet URL
- spreadsheet 標題
- worksheet 中繼資料
- 目標工作表中用於重複檢查或寫入所需的既有資料

這些資料只用於建立使用者的表單、重新整理已儲存的表單名稱、檢查職缺網址是否已存在，以及把新的職缺資料寫入目前使用中的表單。

### 3. 本地 extension 設定

extension 會將少量設定儲存在 `chrome.storage.sync`，包含：

- 介面語言
- extension 內是否已連接 Google
- 已儲存的表單清單
- 目前使用中的表單 ID
- 目前使用中的表單 URL

這些資料只用於讓 extension 能在不同瀏覽器工作階段中維持正常運作。

## 資料如何被使用

extension 只會將資料用在以下產品功能：

- 從目前頁面擷取職缺資訊
- 為使用者建立並初始化 Google Sheet
- 讓使用者管理多張已儲存的表單
- 切換目前使用中的表單
- 檢查重複的職缺網址
- 將職缺資料寫入使用者選定的 Google Sheet
- 儲存介面與設定偏好

extension 不會把這些資料用於廣告投放、使用者側寫或販售給第三方。

## 資料會去哪裡

extension 處理的資料可能會儲存在或傳送到以下位置：

- `chrome.storage.sync`，用來保存 extension 設定
- 使用者自己的 Google 帳號，透過 extension 使用的 Google Sheets / Google Drive 相關 API

開發者沒有為這個 extension 提供獨立後端伺服器，extension 也不會把擷取出的職缺資料傳到開發者自有伺服器。

## Google 存取與 OAuth

extension 透過 Chrome 的 identity API 使用 Google OAuth，讓使用者授權 extension 存取自己的 Google Sheets 工作流程。

目前 extension 申請的 Google scope 為：

- `https://www.googleapis.com/auth/drive.file`

這個 scope 用於讓 extension 建立並管理使用者選擇要搭配 JD Saver 使用的 spreadsheet。

## Google API Services User Data Policy

JD Saver for Google Sheets 對從 Google API 取得資訊的使用與傳輸，將遵守 Google API Services User Data Policy，包括 Limited Use requirements。

## Chrome extension 權限

目前 extension 使用以下 Chrome 權限：

- `activeTab`：在使用者主動使用 extension 時讀取目前頁面
- `scripting`：在目前頁面執行擷取器
- `identity`：讓使用者使用 Google 登入並授權 Google API
- `storage`：儲存 extension 設定

另外也使用以下 host permission：

- `https://sheets.googleapis.com/*`

這個權限只用於呼叫 Google Sheets API，以完成建立表單、讀取中繼資料、檢查重複資料與更新列內容等功能。

## 資料分享

extension 不會販售使用者資料。

extension 不會把使用者資料分享給資料仲介商、廣告商或分析服務提供者。

只有在使用者要求使用表單相關功能時，extension 才會把必要資料傳給 Google 服務。

## 保存期限與使用者控制權

使用者可以控制 extension 主要使用的資料儲存位置：

- extension 設定會保留在 Chrome 儲存空間中，直到使用者清除 extension 儲存資料、退出 Chrome sync 或移除 extension。
- 已儲存的職缺資料會保留在使用者自己的 Google Sheet 中，直到使用者自行編輯或刪除。
- 使用者可以隨時中斷 Google 連線、停止使用 extension，或直接解除安裝。

## 兒童隱私

本 extension 並非設計給兒童使用。

## 政策更新

如果產品功能未來有所變動，本隱私權政策也可能更新。最新版本會發佈在與 Chrome Web Store 填寫相同的政策連結上。

## 聯絡方式

若有任何與隱私相關的問題或請求，請到專案 repository 開 issue：

- [GitHub Issues](https://github.com/VanessaLin9/jd-automation/issues)

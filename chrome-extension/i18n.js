(function () {
  const DEFAULT_LANGUAGE = 'en';
  const SUPPORTED_LANGUAGES = ['en', 'zh-TW'];

  const MESSAGES = {
    en: {
      'app.name': 'JD Saver',
      'settings.pageTitle': 'JD Saver Settings',
      'settings.title': 'Settings',
      'settings.subtitle': 'Connect Google, create dedicated job-tracking sheets, and switch between them whenever you want a different workspace.',
      'settings.languageLabel': 'Language',
      'settings.languageHelp': 'Choose the interface language for the extension.',
      'settings.languageSaved': 'Language updated.',
      'settings.step1': 'Step 1',
      'settings.openTemplateTitle': 'Create a New Sheet',
      'settings.openTemplateButton': 'Create My Sheet',
      'settings.createNewSheetButton': 'Create New Sheet',
      'settings.openTemplateHelp': 'Create a fresh job-tracking sheet anytime. JD Saver will set up the columns and formatting for you.',
      'settings.step2': 'Step 2',
      'settings.sheetUrlTitle': 'Manage Your Sheets',
      'settings.sheetUrlLabel': 'Google Sheet URL',
      'settings.sheetUrlPlaceholder': 'https://docs.google.com/spreadsheets/d/.../edit',
      'settings.noSheetSaved': 'No Google Sheet has been created yet.',
      'settings.sheetSummary': '{count} connected sheet(s).',
      'settings.sheetSelectorLabel': 'Switch active sheet',
      'settings.activeSheetCardLabel': 'Active sheet',
      'settings.activeSheetIdText': 'Spreadsheet ID: {spreadsheetId}',
      'settings.refreshSheetsButton': 'Refresh Names',
      'settings.copySheetUrl': 'Copy Google Sheet URL',
      'settings.sheetUrlCopied': 'Google Sheet URL copied.',
      'settings.copyFailed': 'Failed to copy the Google Sheet URL.',
      'settings.step3': 'Step 3',
      'settings.googleConnectionTitle': 'Google Connection',
      'settings.googleConnectionHelp': 'Connect your Google account so JD Saver can create and update your job-tracking sheets.',
      'settings.authDisconnected': 'Google account is not connected yet.',
      'settings.authConnected': 'Connected to Google',
      'settings.connectGoogle': 'Connect Google',
      'settings.refreshGoogle': 'Reconnect Google',
      'settings.disconnectGoogle': 'Disconnect',
      'settings.savedSpreadsheetId': 'Active Spreadsheet ID',
      'settings.openSheetButton': 'Open My Sheet',
      'settings.notSaved': 'Settings have not been saved yet.',
      'settings.loaded': 'Settings loaded.',
      'settings.oauthMissing': 'Google OAuth client ID is not configured in manifest.json yet.',
      'settings.googleConnectedSuccess': 'Google account connected successfully.',
      'settings.googleConnectFailed': 'Failed to connect Google account.',
      'settings.googleConnectCanceled': 'Google sign-in was canceled. You can try again whenever you are ready.',
      'settings.googleDisconnectedSuccess': 'Google account disconnected.',
      'settings.googleDisconnectFailed': 'Failed to disconnect Google account.',
      'settings.createSheetRequiresAuth': 'Connect Google before creating a sheet.',
      'settings.creatingSheet': 'Creating your Google Sheet...',
      'settings.createSheetSuccess': 'Your Google Sheet is ready: {spreadsheetName}.',
      'settings.createSheetFailed': 'Failed to create your Google Sheet.',
      'settings.googleSheetActionCanceled': 'Google sign-in was canceled, so this action was not completed.',
      'settings.activeSheetChanged': 'Active sheet updated.',
      'settings.refreshingSheets': 'Refreshing saved sheet names...',
      'settings.refreshSheetsSuccess': 'Sheet names refreshed.',
      'settings.refreshSheetsFailed': 'Failed to refresh saved sheet names.',
      'popup.pageTitle': 'JD Saver',
      'popup.title': 'Save Current JD',
      'popup.settingsButton': 'Settings',
      'popup.preparing': 'Preparing extractor...',
      'popup.source': 'Source',
      'popup.titleLabel': 'Title',
      'popup.company': 'Company',
      'popup.url': 'URL',
      'popup.saveButton': 'Save JD',
      'popup.saving': 'Saving JD...',
      'popup.duplicate': 'This JD is already saved.',
      'popup.saved': 'Saved to your active sheet.',
      'popup.saveFailed': 'Failed to save JD.',
      'popup.jdCompanyMissing': 'This page does not look like a JD page yet. Company information was not found.',
      'popup.jdInsufficient': 'This page does not contain enough JD information to save.',
      'popup.readTabFailed': 'Unable to read the current tab.',
      'popup.settingsMissing': 'Spreadsheet settings are missing. Open Settings first.',
      'popup.authRequired': 'Google authorization is required before saving JDs.',
      'popup.noData': 'No JD data is available for saving.',
      'popup.noToken': 'Google authorization did not return an access token.',
      'popup.sheetMissing': 'The worksheet JD 收錄池 was not found.',
      'popup.settingsMissingOpen': 'Spreadsheet settings are missing. Open Settings to continue.',
      'popup.pageTypeUnsupported': 'This page type is not supported.',
      'popup.extracting': 'Extracting current JD...',
      'popup.oauthMissing': 'OAuth client ID is not configured yet. Save flow will not work until manifest.json is updated.',
      'popup.connectGoogleFirst': 'Connect Google in Settings before saving JDs.',
      'popup.googleAuthCanceled': 'Google sign-in was canceled, so this JD was not saved.',
      'popup.ready': 'Ready to save this JD.',
      'popup.prepareFailed': 'Failed to prepare this page.',
      'common.hyphen': '-',
    },
    'zh-TW': {
      'app.name': 'JD Saver',
      'settings.pageTitle': 'JD Saver 設定',
      'settings.title': '設定',
      'settings.subtitle': '先連接 Google，讓 JD Saver 自動建立不同的求職追蹤表，之後也能在不同工作區之間切換。',
      'settings.languageLabel': '語言',
      'settings.languageHelp': '選擇 extension 的介面語言。',
      'settings.languageSaved': '語言已更新。',
      'settings.step1': '步驟 1',
      'settings.openTemplateTitle': '建立新的 Google Sheet',
      'settings.openTemplateButton': '建立我的表單',
      'settings.createNewSheetButton': '建立新的表單',
      'settings.openTemplateHelp': '需要新的求職工作區時，直接建立一張新表。JD Saver 會自動完成欄位和格式設定。',
      'settings.step2': '步驟 2',
      'settings.sheetUrlTitle': '管理你的 Google Sheets',
      'settings.sheetUrlLabel': 'Google Sheet URL',
      'settings.sheetUrlPlaceholder': 'https://docs.google.com/spreadsheets/d/.../edit',
      'settings.noSheetSaved': '目前還沒有建立任何 Google Sheet。',
      'settings.sheetSummary': '目前已連接 {count} 張表單。',
      'settings.sheetSelectorLabel': '切換目前使用中的表單',
      'settings.activeSheetCardLabel': '目前使用中的表單',
      'settings.activeSheetIdText': 'Spreadsheet ID：{spreadsheetId}',
      'settings.refreshSheetsButton': '重新整理名稱',
      'settings.copySheetUrl': '複製 Google Sheet URL',
      'settings.sheetUrlCopied': '已複製 Google Sheet URL。',
      'settings.copyFailed': '複製 Google Sheet URL 失敗。',
      'settings.step3': '步驟 3',
      'settings.googleConnectionTitle': 'Google 連線',
      'settings.googleConnectionHelp': '連接你的 Google 帳號，讓 JD Saver 可以建立並更新你自己的求職追蹤表。',
      'settings.authDisconnected': 'Google 帳號尚未連接。',
      'settings.authConnected': '已連接 Google',
      'settings.connectGoogle': '連接 Google',
      'settings.refreshGoogle': '重新連接 Google',
      'settings.disconnectGoogle': '中斷連接',
      'settings.savedSpreadsheetId': '使用中的 Spreadsheet ID',
      'settings.openSheetButton': '打開我的表單',
      'settings.notSaved': '設定尚未儲存。',
      'settings.loaded': '設定已載入。',
      'settings.oauthMissing': 'manifest.json 裡還沒有設定 Google OAuth client ID。',
      'settings.googleConnectedSuccess': 'Google 帳號已成功連接。',
      'settings.googleConnectFailed': 'Google 帳號連接失敗。',
      'settings.googleConnectCanceled': '你剛剛取消了 Google 授權，準備好之後可以再試一次。',
      'settings.googleDisconnectedSuccess': 'Google 帳號已中斷連接。',
      'settings.googleDisconnectFailed': 'Google 帳號中斷連接失敗。',
      'settings.createSheetRequiresAuth': '建立新表單前請先連接 Google。',
      'settings.creatingSheet': '正在建立你的 Google Sheet...',
      'settings.createSheetSuccess': '你的 Google Sheet 已準備完成：{spreadsheetName}。',
      'settings.createSheetFailed': '建立你的 Google Sheet 失敗。',
      'settings.googleSheetActionCanceled': '你剛剛取消了 Google 授權，所以這次動作沒有完成。',
      'settings.activeSheetChanged': '已切換目前使用中的表單。',
      'settings.refreshingSheets': '正在重新整理已儲存的表單名稱...',
      'settings.refreshSheetsSuccess': '表單名稱已更新。',
      'settings.refreshSheetsFailed': '更新表單名稱失敗。',
      'popup.pageTitle': 'JD Saver',
      'popup.title': '儲存這份 JD',
      'popup.settingsButton': '設定',
      'popup.preparing': '正在準備擷取器...',
      'popup.source': '來源',
      'popup.titleLabel': '職缺名稱',
      'popup.company': '公司',
      'popup.url': '網址',
      'popup.saveButton': '儲存 JD',
      'popup.saving': '正在儲存 JD...',
      'popup.duplicate': '這份 JD 已經儲存過了。',
      'popup.saved': '已成功寫入目前使用中的表單。',
      'popup.saveFailed': '儲存 JD 失敗。',
      'popup.jdCompanyMissing': '這頁看起來還不像是 JD 頁面，找不到公司資訊。',
      'popup.jdInsufficient': '這頁沒有足夠的 JD 資訊可以儲存。',
      'popup.readTabFailed': '無法讀取目前分頁。',
      'popup.settingsMissing': '尚未完成 spreadsheet 設定，請先到 Settings。',
      'popup.authRequired': '儲存 JD 前需要先完成 Google 授權。',
      'popup.noData': '目前沒有可儲存的 JD 資料。',
      'popup.noToken': 'Google 授權沒有回傳 access token。',
      'popup.sheetMissing': '找不到工作表 JD 收錄池。',
      'popup.settingsMissingOpen': '尚未完成 spreadsheet 設定，請先到 Settings。',
      'popup.pageTypeUnsupported': '目前不支援這種類型的頁面。',
      'popup.extracting': '正在擷取目前頁面的 JD...',
      'popup.oauthMissing': 'OAuth client ID 尚未設定完成，在 manifest.json 更新前無法存檔。',
      'popup.connectGoogleFirst': '請先到 Settings 連接 Google，才能儲存 JD。',
      'popup.googleAuthCanceled': '你剛剛取消了 Google 授權，所以這份 JD 沒有被儲存。',
      'popup.ready': '已準備好，可以儲存這份 JD。',
      'popup.prepareFailed': '準備這個頁面時發生錯誤。',
      'common.hyphen': '-',
    },
  };

  function normalizeLanguage(language) {
    const value = String(language || '').trim();
    if (SUPPORTED_LANGUAGES.includes(value)) {
      return value;
    }
    if (value.toLowerCase().startsWith('zh')) {
      return 'zh-TW';
    }
    return DEFAULT_LANGUAGE;
  }

  function interpolate(template, variables = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  function getMessages(language) {
    return MESSAGES[normalizeLanguage(language)] || MESSAGES[DEFAULT_LANGUAGE];
  }

  function translate(language, key, variables = {}) {
    const messages = getMessages(language);
    const fallbackMessages = getMessages(DEFAULT_LANGUAGE);
    const template = messages[key] ?? fallbackMessages[key] ?? key;
    return interpolate(template, variables);
  }

  function applyTranslations(root, language) {
    root.querySelectorAll('[data-i18n]').forEach((node) => {
      node.textContent = translate(language, node.dataset.i18n);
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      node.setAttribute('placeholder', translate(language, node.dataset.i18nPlaceholder));
    });

    root.querySelectorAll('[data-i18n-title]').forEach((node) => {
      node.setAttribute('title', translate(language, node.dataset.i18nTitle));
    });

    const titleNode = root.querySelector('title[data-i18n]');
    if (titleNode) {
      document.title = translate(language, titleNode.dataset.i18n);
    }

    document.documentElement.lang = language === 'zh-TW' ? 'zh-Hant' : 'en';
  }

  self.JDSaverI18n = {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    applyTranslations,
    normalizeLanguage,
    translate,
  };
})();

(function () {
  const DEFAULT_LANGUAGE = 'en';
  const SUPPORTED_LANGUAGES = ['en', 'zh-TW'];

  const MESSAGES = {
    en: {
      'app.name': 'JD Saver',
      'settings.pageTitle': 'JD Saver Settings',
      'settings.title': 'Settings',
      'settings.subtitle': 'Use the official template, paste your own Google Sheet URL, and prepare for Google account connection.',
      'settings.languageLabel': 'Language',
      'settings.languageHelp': 'Choose the interface language for the extension.',
      'settings.languageSaved': 'Language updated.',
      'settings.step1': 'Step 1',
      'settings.openTemplateTitle': 'Open Template',
      'settings.openTemplateButton': 'Open Template',
      'settings.openTemplateHelp': 'Make a copy into your own Google Drive before continuing.',
      'settings.step2': 'Step 2',
      'settings.sheetUrlTitle': 'Paste Your Google Sheet URL',
      'settings.changeButton': 'Change',
      'settings.sheetUrlLabel': 'Google Sheet URL',
      'settings.sheetUrlPlaceholder': 'https://docs.google.com/spreadsheets/d/.../edit',
      'settings.noSheetSaved': 'No spreadsheet has been saved yet.',
      'settings.sheetLocked': 'Target sheet is locked to {spreadsheetId}.',
      'settings.copySheetUrl': 'Copy Google Sheet URL',
      'settings.sheetUrlCopied': 'Google Sheet URL copied.',
      'settings.copyFailed': 'Failed to copy the Google Sheet URL.',
      'settings.step3': 'Step 3',
      'settings.googleConnectionTitle': 'Google Connection',
      'settings.googleConnectionHelp': 'Connect your Google account so the extension can write directly to your sheet.',
      'settings.authDisconnected': 'Google account is not connected yet.',
      'settings.authConnected': 'Connected to Google',
      'settings.authConnectedAs': 'Connected to Google as {email}.',
      'settings.connectGoogle': 'Connect Google',
      'settings.refreshGoogle': 'Refresh Connection',
      'settings.disconnectGoogle': 'Disconnect',
      'settings.savedSpreadsheetId': 'Saved Spreadsheet ID',
      'settings.saveButton': 'Save Settings',
      'settings.notSaved': 'Settings have not been saved yet.',
      'settings.loaded': 'Settings loaded.',
      'settings.changeReady': 'You can now paste a different Google Sheet URL.',
      'settings.oauthMissing': 'Google OAuth client ID is not configured in manifest.json yet.',
      'settings.googleConnectedSuccess': 'Google account connected successfully.',
      'settings.googleConnectFailed': 'Failed to connect Google account.',
      'settings.googleDisconnectedSuccess': 'Google account disconnected.',
      'settings.googleDisconnectFailed': 'Failed to disconnect Google account.',
      'settings.invalidSheetUrl': 'Please paste a valid Google Sheet URL.',
      'settings.invalidSpreadsheetId': 'We could not parse a spreadsheet ID from this URL.',
      'settings.savedSuccess': 'Settings saved successfully.',
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
      'popup.saved': 'Saved to Google Sheet.',
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
      'popup.ready': 'Ready to save this JD.',
      'popup.prepareFailed': 'Failed to prepare this page.',
      'common.hyphen': '-',
    },
    'zh-TW': {
      'app.name': 'JD Saver',
      'settings.pageTitle': 'JD Saver 設定',
      'settings.title': '設定',
      'settings.subtitle': '先開啟官方模板、貼上你自己的 Google Sheet URL，並準備連接 Google 帳號。',
      'settings.languageLabel': '語言',
      'settings.languageHelp': '選擇 extension 的介面語言。',
      'settings.languageSaved': '語言已更新。',
      'settings.step1': '步驟 1',
      'settings.openTemplateTitle': '開啟模板',
      'settings.openTemplateButton': '開啟模板',
      'settings.openTemplateHelp': '請先複製一份到你自己的 Google Drive 再繼續。',
      'settings.step2': '步驟 2',
      'settings.sheetUrlTitle': '貼上你的 Google Sheet URL',
      'settings.changeButton': '更改',
      'settings.sheetUrlLabel': 'Google Sheet URL',
      'settings.sheetUrlPlaceholder': 'https://docs.google.com/spreadsheets/d/.../edit',
      'settings.noSheetSaved': '目前還沒有儲存任何 spreadsheet。',
      'settings.sheetLocked': '目前鎖定的目標表單是 {spreadsheetId}。',
      'settings.copySheetUrl': '複製 Google Sheet URL',
      'settings.sheetUrlCopied': '已複製 Google Sheet URL。',
      'settings.copyFailed': '複製 Google Sheet URL 失敗。',
      'settings.step3': '步驟 3',
      'settings.googleConnectionTitle': 'Google 連線',
      'settings.googleConnectionHelp': '連接你的 Google 帳號，讓 extension 可以直接寫入你的表單。',
      'settings.authDisconnected': 'Google 帳號尚未連接。',
      'settings.authConnected': '已連接 Google',
      'settings.authConnectedAs': '已連接 Google：{email}。',
      'settings.connectGoogle': '連接 Google',
      'settings.refreshGoogle': '重新連接',
      'settings.disconnectGoogle': '中斷連接',
      'settings.savedSpreadsheetId': '已儲存的 Spreadsheet ID',
      'settings.saveButton': '儲存設定',
      'settings.notSaved': '設定尚未儲存。',
      'settings.loaded': '設定已載入。',
      'settings.changeReady': '現在可以貼上另一個 Google Sheet URL。',
      'settings.oauthMissing': 'manifest.json 裡還沒有設定 Google OAuth client ID。',
      'settings.googleConnectedSuccess': 'Google 帳號已成功連接。',
      'settings.googleConnectFailed': 'Google 帳號連接失敗。',
      'settings.googleDisconnectedSuccess': 'Google 帳號已中斷連接。',
      'settings.googleDisconnectFailed': 'Google 帳號中斷連接失敗。',
      'settings.invalidSheetUrl': '請貼上有效的 Google Sheet URL。',
      'settings.invalidSpreadsheetId': '無法從這個 URL 解析出 spreadsheet ID。',
      'settings.savedSuccess': '設定已成功儲存。',
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
      'popup.saved': '已成功寫入 Google Sheet。',
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

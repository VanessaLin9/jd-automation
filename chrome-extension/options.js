document.addEventListener('DOMContentLoaded', async () => {
  const languageButtons = Array.from(document.querySelectorAll('.language-button'));
  const spreadsheetUrlInput = document.getElementById('spreadsheet-url');
  const copySheetUrlButton = document.getElementById('copy-sheet-url');
  const spreadsheetIdInput = document.getElementById('spreadsheet-id');
  const spreadsheetMeta = document.getElementById('spreadsheet-meta');
  const createSheetButton = document.getElementById('create-sheet');
  const openSheetButton = document.getElementById('open-sheet');
  const authStatusIcon = document.getElementById('auth-status-icon');
  const authStatus = document.getElementById('auth-status');
  const statusText = document.getElementById('settings-status');
  const connectGoogleButton = document.getElementById('connect-google');
  const disconnectGoogleButton = document.getElementById('disconnect-google');

  let currentLanguage = self.JDSaverI18n.DEFAULT_LANGUAGE;

  function t(key, variables) {
    return self.JDSaverI18n.translate(currentLanguage, key, variables);
  }

  function setStatus(messageKey, tone, variables) {
    statusText.textContent = t(messageKey, variables);
    statusText.className = tone ? `status-text ${tone}` : 'status-text';
  }

  function updateLanguageButtons(language) {
    languageButtons.forEach((button) => {
      button.classList.toggle('is-active', button.id === `language-${language}`);
      button.setAttribute('aria-pressed', button.id === `language-${language}` ? 'true' : 'false');
    });
  }

  function applyLanguage(language) {
    currentLanguage = self.JDSaverI18n.normalizeLanguage(language);
    self.JDSaverI18n.applyTranslations(document, currentLanguage);
    updateLanguageButtons(currentLanguage);
  }

  function setSheetState(hasSheet) {
    copySheetUrlButton.hidden = !hasSheet;
    openSheetButton.hidden = !hasSheet;
  }

  function renderSettings(settings) {
    spreadsheetUrlInput.value = settings.spreadsheetUrl;
    copySheetUrlButton.disabled = !settings.spreadsheetUrl;
    copySheetUrlButton.setAttribute('aria-label', t('settings.copySheetUrl'));
    spreadsheetIdInput.textContent = settings.spreadsheetId || '-';
    spreadsheetMeta.textContent = settings.spreadsheetId
      ? t('settings.sheetLocked', { spreadsheetId: settings.spreadsheetId })
      : t('settings.noSheetSaved');
    authStatus.textContent = settings.hasGoogleAuth
      ? t('settings.authConnected')
      : t('settings.authDisconnected');
    authStatusIcon.hidden = !settings.hasGoogleAuth;
    authStatus.className = settings.hasGoogleAuth ? 'status-text success' : 'status-text';
    connectGoogleButton.textContent = settings.hasGoogleAuth
      ? t('settings.refreshGoogle')
      : t('settings.connectGoogle');
    disconnectGoogleButton.hidden = !settings.hasGoogleAuth;
    createSheetButton.textContent = settings.spreadsheetId
      ? t('settings.createNewSheetButton')
      : t('settings.openTemplateButton');
    setSheetState(Boolean(settings.spreadsheetId));
  }

  const settings = await self.JDSaverUtils.getSettings();
  applyLanguage(settings.language);
  renderSettings(settings);

  if (settings.spreadsheetId) {
    setStatus('settings.loaded', 'success');
  }

  languageButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const language = self.JDSaverI18n.normalizeLanguage(button.id.replace('language-', ''));
      if (language === currentLanguage) {
        return;
      }

      await self.JDSaverUtils.saveSettings({ language });
      applyLanguage(language);
      renderSettings(await self.JDSaverUtils.getSettings());
      setStatus('settings.languageSaved', 'success');
    });
  });

  copySheetUrlButton.addEventListener('click', async () => {
    const value = self.JDSaverUtils.trimText(spreadsheetUrlInput.value);
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setStatus('settings.sheetUrlCopied', 'success');
    } catch (error) {
      statusText.textContent = error.message || t('settings.copyFailed');
      statusText.className = 'status-text error';
    }
  });

  openSheetButton.addEventListener('click', async () => {
    const value = self.JDSaverUtils.trimText(spreadsheetUrlInput.value);
    if (!value) {
      setStatus('settings.noSheetSaved', 'error');
      return;
    }

    await chrome.tabs.create({ url: value });
  });

  connectGoogleButton.addEventListener('click', async () => {
    if (!self.JDSaverUtils.isOauthConfigured()) {
      setStatus('settings.oauthMissing', 'error');
      return;
    }

    connectGoogleButton.disabled = true;

    try {
      await self.JDSaverUtils.getGoogleAuthToken(true);

      await self.JDSaverUtils.saveSettings({
        hasGoogleAuth: true,
      });

      renderSettings(await self.JDSaverUtils.getSettings());
      setStatus('settings.googleConnectedSuccess', 'success');
    } catch (error) {
      statusText.textContent = error.message || t('settings.googleConnectFailed');
      statusText.className = 'status-text error';
    } finally {
      connectGoogleButton.disabled = false;
    }
  });

  disconnectGoogleButton.addEventListener('click', async () => {
    disconnectGoogleButton.disabled = true;

    try {
      await self.JDSaverUtils.clearGoogleAuth();
      await self.JDSaverUtils.saveSettings({
        hasGoogleAuth: false,
      });
      renderSettings(await self.JDSaverUtils.getSettings());
      setStatus('settings.googleDisconnectedSuccess', 'success');
    } catch (error) {
      statusText.textContent = error.message || t('settings.googleDisconnectFailed');
      statusText.className = 'status-text error';
    } finally {
      disconnectGoogleButton.disabled = false;
    }
  });

  createSheetButton.addEventListener('click', async () => {
    if (!self.JDSaverUtils.isOauthConfigured()) {
      setStatus('settings.oauthMissing', 'error');
      return;
    }

    if (!settings.hasGoogleAuth) {
      setStatus('settings.createSheetRequiresAuth', 'error');
      return;
    }

    createSheetButton.disabled = true;
    setStatus('settings.creatingSheet', '');

    try {
      const token = await self.JDSaverUtils.getGoogleAuthToken(true);
      const createdSheet = await self.JDSaverUtils.createSpreadsheet(
        token,
        self.JDSaverUtils.buildSpreadsheetName()
      );
      const spreadsheetId = self.JDSaverUtils.trimText(createdSheet.spreadsheetId);
      const spreadsheetUrl = self.JDSaverUtils.trimText(createdSheet.spreadsheetUrl)
        || self.JDSaverUtils.getSheetUrlFromId(spreadsheetId);
      const firstSheetId = createdSheet.sheets?.[0]?.properties?.sheetId;

      if (typeof firstSheetId !== 'number') {
        throw new Error(t('settings.createSheetFailed'));
      }

      await self.JDSaverUtils.setupSpreadsheetTemplate(spreadsheetId, firstSheetId, token);

      await self.JDSaverUtils.saveSettings({
        spreadsheetUrl,
        spreadsheetId,
        language: currentLanguage,
      });

      const latestSettings = await self.JDSaverUtils.getSettings();
      Object.assign(settings, latestSettings, {
        spreadsheetUrl,
        spreadsheetId,
      });
      renderSettings(settings);
      setStatus('settings.createSheetSuccess', 'success');
    } catch (error) {
      statusText.textContent = error.message || t('settings.createSheetFailed');
      statusText.className = 'status-text error';
    } finally {
      createSheetButton.disabled = false;
    }
  });
});

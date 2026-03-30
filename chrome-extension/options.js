document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const languageButtons = Array.from(document.querySelectorAll('.language-button'));
  const spreadsheetUrlInput = document.getElementById('spreadsheet-url');
  const copySheetUrlButton = document.getElementById('copy-sheet-url');
  const spreadsheetIdInput = document.getElementById('spreadsheet-id');
  const spreadsheetMeta = document.getElementById('spreadsheet-meta');
  const changeSheetButton = document.getElementById('change-sheet');
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

  function setLockedState(isLocked) {
    spreadsheetUrlInput.readOnly = isLocked;
    changeSheetButton.hidden = !isLocked;
    copySheetUrlButton.hidden = !isLocked;
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
      ? (settings.connectedGoogleEmail || t('settings.authConnected'))
      : t('settings.authDisconnected');
    authStatusIcon.hidden = !settings.hasGoogleAuth;
    authStatus.className = settings.hasGoogleAuth ? 'status-text success' : 'status-text';
    connectGoogleButton.textContent = settings.hasGoogleAuth
      ? t('settings.refreshGoogle')
      : t('settings.connectGoogle');
    disconnectGoogleButton.hidden = !settings.hasGoogleAuth;
    setLockedState(settings.spreadsheetLocked);
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

  changeSheetButton.addEventListener('click', () => {
    spreadsheetUrlInput.readOnly = false;
    spreadsheetUrlInput.focus();
    changeSheetButton.hidden = true;
    copySheetUrlButton.hidden = true;
    setStatus('settings.changeReady', '');
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

  connectGoogleButton.addEventListener('click', async () => {
    if (!self.JDSaverUtils.isOauthConfigured()) {
      setStatus('settings.oauthMissing', 'error');
      return;
    }

    connectGoogleButton.disabled = true;

    try {
      await self.JDSaverUtils.getGoogleAuthToken(true);
      const profile = await self.JDSaverUtils.getConnectedGoogleProfile();

      await self.JDSaverUtils.saveSettings({
        hasGoogleAuth: true,
        connectedGoogleEmail: self.JDSaverUtils.trimText(profile.email),
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
        connectedGoogleEmail: '',
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

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const spreadsheetUrl = self.JDSaverUtils.trimText(spreadsheetUrlInput.value);
    if (!self.JDSaverUtils.isGoogleSheetUrl(spreadsheetUrl)) {
      setStatus('settings.invalidSheetUrl', 'error');
      return;
    }

    const spreadsheetId = self.JDSaverUtils.parseSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      setStatus('settings.invalidSpreadsheetId', 'error');
      return;
    }

    await self.JDSaverUtils.saveSettings({
      spreadsheetUrl,
      spreadsheetId,
      spreadsheetLocked: true,
      language: currentLanguage,
    });

    renderSettings({
      ...(await self.JDSaverUtils.getSettings()),
      spreadsheetUrl,
      spreadsheetId,
      spreadsheetLocked: true,
    });

    setStatus('settings.savedSuccess', 'success');
  });
});

document.addEventListener('DOMContentLoaded', async () => {
  const languageButtons = Array.from(document.querySelectorAll('.language-button'));
  const sheetSelectorField = document.getElementById('sheet-selector-field');
  const sheetSelectorShell = document.getElementById('sheet-selector-shell');
  const sheetSelector = document.getElementById('sheet-selector');
  const sheetSelectorTrigger = document.getElementById('sheet-selector-trigger');
  const sheetSelectorLabel = document.getElementById('sheet-selector-label');
  const sheetSelectorMenu = document.getElementById('sheet-selector-menu');
  const spreadsheetUrlInput = document.getElementById('spreadsheet-url');
  const copySheetUrlButton = document.getElementById('copy-sheet-url');
  const spreadsheetMeta = document.getElementById('spreadsheet-meta');
  const activeSheetCard = document.getElementById('active-sheet-card');
  const activeSheetName = document.getElementById('active-sheet-name');
  const activeSheetIdText = document.getElementById('active-sheet-id-text');
  const createSheetButton = document.getElementById('create-sheet');
  const openSheetButton = document.getElementById('open-sheet');
  const refreshSheetsButton = document.getElementById('refresh-sheets');
  const authStatusIcon = document.getElementById('auth-status-icon');
  const authStatus = document.getElementById('auth-status');
  const statusText = document.getElementById('settings-status');
  const connectGoogleButton = document.getElementById('connect-google');
  const disconnectGoogleButton = document.getElementById('disconnect-google');

  let currentLanguage = self.JDSaverI18n.DEFAULT_LANGUAGE;
  let settings = null;

  function t(key, variables) {
    return self.JDSaverI18n.translate(currentLanguage, key, variables);
  }

  function setStatus(messageKey, tone, variables) {
    statusText.textContent = t(messageKey, variables);
    statusText.className = tone ? `status-text ${tone}` : 'status-text';
  }

  function setErrorStatus(error, fallbackKey, canceledKey = 'settings.googleSheetActionCanceled') {
    if (self.JDSaverUtils.isAuthCancellationError(error)) {
      setStatus(canceledKey, 'error');
      return;
    }

    statusText.textContent = error?.message || t(fallbackKey);
    statusText.className = 'status-text error';
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

  function closeSheetSelectorMenu() {
    sheetSelectorMenu.hidden = true;
    sheetSelectorTrigger.setAttribute('aria-expanded', 'false');
    sheetSelectorShell.classList.remove('is-open');
  }

  function openSheetSelectorMenu() {
    if (sheetSelector.disabled) {
      return;
    }
    sheetSelectorMenu.hidden = false;
    sheetSelectorTrigger.setAttribute('aria-expanded', 'true');
    sheetSelectorShell.classList.add('is-open');
  }

  function setCustomSheetSelectorLabel(currentSettings) {
    const activeSheet = currentSettings.activeSheet;
    sheetSelectorLabel.textContent = activeSheet
      ? activeSheet.name
      : t('settings.noSheetSaved');
  }

  function populateSheetSelector(currentSettings) {
    const { availableSheets = [], activeSheetId = '' } = currentSettings;
    sheetSelector.innerHTML = '';
    sheetSelectorMenu.innerHTML = '';

    availableSheets.forEach((sheet) => {
      const option = document.createElement('option');
      option.value = sheet.id;
      option.textContent = sheet.name;
      option.selected = sheet.id === activeSheetId;
      sheetSelector.appendChild(option);

      const menuButton = document.createElement('button');
      menuButton.type = 'button';
      menuButton.className = 'custom-select-option';
      if (sheet.id === activeSheetId) {
        menuButton.classList.add('is-active');
        menuButton.setAttribute('aria-selected', 'true');
      } else {
        menuButton.setAttribute('aria-selected', 'false');
      }
      menuButton.setAttribute('role', 'option');
      menuButton.dataset.sheetId = sheet.id;
      menuButton.textContent = sheet.name;
      menuButton.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (sheet.id === settings.activeSheetId) {
          closeSheetSelectorMenu();
          return;
        }

        await self.JDSaverUtils.saveSettings({
          activeSheetId: sheet.id,
        });

        closeSheetSelectorMenu();
        await refreshSettings('settings.activeSheetChanged', 'success');
      });
      sheetSelectorMenu.appendChild(menuButton);
    });

    sheetSelectorField.hidden = availableSheets.length <= 1;
    sheetSelector.disabled = availableSheets.length <= 1;
    sheetSelectorTrigger.disabled = availableSheets.length <= 1;
    setCustomSheetSelectorLabel(currentSettings);
    closeSheetSelectorMenu();
  }

  function setSheetState(hasSheet) {
    copySheetUrlButton.hidden = !hasSheet;
    openSheetButton.hidden = !hasSheet;
    refreshSheetsButton.hidden = !hasSheet;
    activeSheetCard.hidden = !hasSheet;
  }

  function renderSettings(currentSettings) {
    const activeSheet = currentSettings.activeSheet;
    const hasSheet = Boolean(activeSheet);

    populateSheetSelector(currentSettings);

    spreadsheetUrlInput.value = currentSettings.spreadsheetUrl;
    copySheetUrlButton.disabled = !currentSettings.spreadsheetUrl;
    copySheetUrlButton.setAttribute('aria-label', t('settings.copySheetUrl'));
    activeSheetName.textContent = activeSheet?.name || t('common.hyphen');
    activeSheetIdText.textContent = hasSheet
      ? t('settings.activeSheetIdText', { spreadsheetId: currentSettings.spreadsheetId })
      : t('settings.noSheetSaved');
    spreadsheetMeta.textContent = hasSheet
      ? t('settings.sheetSummary', {
        count: currentSettings.availableSheets.length,
      })
      : t('settings.noSheetSaved');
    authStatus.textContent = currentSettings.hasGoogleAuth
      ? t('settings.authConnected')
      : t('settings.authDisconnected');
    authStatusIcon.hidden = !currentSettings.hasGoogleAuth;
    authStatus.className = currentSettings.hasGoogleAuth ? 'status-text success' : 'status-text';
    connectGoogleButton.textContent = currentSettings.hasGoogleAuth
      ? t('settings.refreshGoogle')
      : t('settings.connectGoogle');
    disconnectGoogleButton.hidden = !currentSettings.hasGoogleAuth;
    createSheetButton.textContent = hasSheet
      ? t('settings.createNewSheetButton')
      : t('settings.openTemplateButton');
    setSheetState(hasSheet);
  }

  async function refreshSettings(statusKey, tone, variables) {
    settings = await self.JDSaverUtils.getSettings();
    applyLanguage(settings.language);
    renderSettings(settings);

    if (statusKey) {
      setStatus(statusKey, tone, variables);
    }
  }

  await refreshSettings();

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
      await refreshSettings('settings.languageSaved', 'success');
    });
  });

  sheetSelectorTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (sheetSelectorMenu.hidden) {
      openSheetSelectorMenu();
    } else {
      closeSheetSelectorMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!sheetSelectorShell.contains(event.target)) {
      closeSheetSelectorMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeSheetSelectorMenu();
    }
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

  refreshSheetsButton.addEventListener('click', async () => {
    if (!settings?.availableSheets?.length) {
      return;
    }

    if (!settings.hasGoogleAuth) {
      setStatus('settings.createSheetRequiresAuth', 'error');
      return;
    }

    refreshSheetsButton.disabled = true;
    setStatus('settings.refreshingSheets', '');

    try {
      const token = await self.JDSaverUtils.getGoogleAuthToken(true);
      const refreshedSheets = await Promise.all(
        settings.availableSheets.map(async (sheet) => {
          try {
            const metadata = await self.JDSaverUtils.getSpreadsheetMetadata(sheet.id, token);
            const spreadsheetName = self.JDSaverUtils.trimText(metadata.properties?.title) || sheet.name;
            return {
              ...sheet,
              name: spreadsheetName,
            };
          } catch (error) {
            return sheet;
          }
        })
      );

      await self.JDSaverUtils.saveSettings({
        availableSheets: refreshedSheets,
      });

      await refreshSettings('settings.refreshSheetsSuccess', 'success');
    } catch (error) {
      setErrorStatus(error, 'settings.refreshSheetsFailed');
    } finally {
      refreshSheetsButton.disabled = false;
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

      await self.JDSaverUtils.saveSettings({
        hasGoogleAuth: true,
      });

      await refreshSettings('settings.googleConnectedSuccess', 'success');
    } catch (error) {
      setErrorStatus(error, 'settings.googleConnectFailed', 'settings.googleConnectCanceled');
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
      await refreshSettings('settings.googleDisconnectedSuccess', 'success');
    } catch (error) {
      setErrorStatus(error, 'settings.googleDisconnectFailed');
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
      const spreadsheetName = self.JDSaverUtils.trimText(createdSheet.properties?.title)
        || self.JDSaverUtils.buildSpreadsheetName();
      const firstSheetId = createdSheet.sheets?.[0]?.properties?.sheetId;

      if (typeof firstSheetId !== 'number') {
        throw new Error(t('settings.createSheetFailed'));
      }

      await self.JDSaverUtils.setupSpreadsheetTemplate(spreadsheetId, firstSheetId, token);

      const nextSheets = [
        {
          id: spreadsheetId,
          url: spreadsheetUrl,
          name: spreadsheetName,
        },
        ...settings.availableSheets.filter((sheet) => sheet.id !== spreadsheetId),
      ];

      await self.JDSaverUtils.saveSettings({
        availableSheets: nextSheets,
        activeSheetId: spreadsheetId,
        language: currentLanguage,
      });

      await refreshSettings('settings.createSheetSuccess', 'success', {
        spreadsheetName,
      });
    } catch (error) {
      setErrorStatus(error, 'settings.createSheetFailed');
    } finally {
      createSheetButton.disabled = false;
    }
  });
});

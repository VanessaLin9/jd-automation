document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const spreadsheetUrlInput = document.getElementById('spreadsheet-url');
  const spreadsheetIdInput = document.getElementById('spreadsheet-id');
  const spreadsheetMeta = document.getElementById('spreadsheet-meta');
  const changeSheetButton = document.getElementById('change-sheet');
  const authStatus = document.getElementById('auth-status');
  const statusText = document.getElementById('settings-status');
  const connectGoogleButton = document.getElementById('connect-google');
  const disconnectGoogleButton = document.getElementById('disconnect-google');

  function setLockedState(isLocked) {
    spreadsheetUrlInput.readOnly = isLocked;
    changeSheetButton.hidden = !isLocked;
  }

  function renderSettings(settings) {
    spreadsheetUrlInput.value = settings.spreadsheetUrl;
    spreadsheetIdInput.value = settings.spreadsheetId;
    spreadsheetMeta.textContent = settings.spreadsheetId
      ? `Target sheet is locked to ${settings.spreadsheetId}.`
      : 'No spreadsheet has been saved yet.';
    authStatus.textContent = settings.hasGoogleAuth
      ? `Connected to Google${settings.connectedGoogleEmail ? ` as ${settings.connectedGoogleEmail}` : ''}.`
      : 'Google account is not connected yet.';
    authStatus.className = settings.hasGoogleAuth ? 'status-text success' : 'status-text';
    connectGoogleButton.textContent = settings.hasGoogleAuth ? 'Refresh Connection' : 'Connect Google';
    disconnectGoogleButton.hidden = !settings.hasGoogleAuth;
    setLockedState(settings.spreadsheetLocked);
  }

  const settings = await self.JDSaverUtils.getSettings();
  renderSettings(settings);

  if (settings.spreadsheetId) {
    statusText.textContent = 'Settings loaded.';
    statusText.className = 'status-text success';
  }

  changeSheetButton.addEventListener('click', () => {
    spreadsheetUrlInput.readOnly = false;
    spreadsheetUrlInput.focus();
    changeSheetButton.hidden = true;
    statusText.textContent = 'You can now paste a different Google Sheet URL.';
    statusText.className = 'status-text';
  });

  connectGoogleButton.addEventListener('click', async () => {
    if (!self.JDSaverUtils.isOauthConfigured()) {
      statusText.textContent = 'Google OAuth client ID is not configured in manifest.json yet.';
      statusText.className = 'status-text error';
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
      statusText.textContent = 'Google account connected successfully.';
      statusText.className = 'status-text success';
    } catch (error) {
      statusText.textContent = error.message || 'Failed to connect Google account.';
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
      statusText.textContent = 'Google account disconnected.';
      statusText.className = 'status-text success';
    } catch (error) {
      statusText.textContent = error.message || 'Failed to disconnect Google account.';
      statusText.className = 'status-text error';
    } finally {
      disconnectGoogleButton.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const spreadsheetUrl = self.JDSaverUtils.trimText(spreadsheetUrlInput.value);
    if (!self.JDSaverUtils.isGoogleSheetUrl(spreadsheetUrl)) {
      statusText.textContent = 'Please paste a valid Google Sheet URL.';
      statusText.className = 'status-text error';
      return;
    }

    const spreadsheetId = self.JDSaverUtils.parseSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      statusText.textContent = 'We could not parse a spreadsheet ID from this URL.';
      statusText.className = 'status-text error';
      return;
    }

    await self.JDSaverUtils.saveSettings({
      spreadsheetUrl,
      spreadsheetId,
      spreadsheetLocked: true,
    });

    renderSettings({
      ...(await self.JDSaverUtils.getSettings()),
      spreadsheetUrl,
      spreadsheetId,
      spreadsheetLocked: true,
    });

    statusText.textContent = 'Settings saved successfully.';
    statusText.className = 'status-text success';
  });
});

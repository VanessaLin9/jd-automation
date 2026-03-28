document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const spreadsheetUrlInput = document.getElementById('spreadsheet-url');
  const spreadsheetIdInput = document.getElementById('spreadsheet-id');
  const spreadsheetMeta = document.getElementById('spreadsheet-meta');
  const changeSheetButton = document.getElementById('change-sheet');
  const authStatus = document.getElementById('auth-status');
  const statusText = document.getElementById('settings-status');
  const connectGoogleButton = document.getElementById('connect-google');

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

  connectGoogleButton.addEventListener('click', () => {
    statusText.textContent = 'Google connection will be implemented in the next v2 step.';
    statusText.className = 'status-text';
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

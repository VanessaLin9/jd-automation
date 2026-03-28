(function () {
  function nowIso() {
    return new Date().toISOString();
  }

  function createRecordId() {
    return (self.crypto && self.crypto.randomUUID)
      ? self.crypto.randomUUID()
      : `record-${Date.now()}`;
  }

  function trimText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function shortenUrl(url) {
    const trimmed = trimText(url);
    if (!trimmed) {
      return '-';
    }
    return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
  }

  function isValidHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  function isGoogleSheetUrl(value) {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.hostname === 'docs.google.com' &&
        /^\/spreadsheets\/d\/[^/]+/.test(url.pathname)
      );
    } catch (error) {
      return false;
    }
  }

  function parseSpreadsheetId(value) {
    if (!isGoogleSheetUrl(value)) {
      return '';
    }

    const url = new URL(value);
    const match = url.pathname.match(/^\/spreadsheets\/d\/([^/]+)/);
    return match ? trimText(match[1]) : '';
  }

  async function getSettings() {
    const data = await chrome.storage.sync.get([
      'spreadsheetUrl',
      'spreadsheetId',
      'spreadsheetLocked',
      'hasGoogleAuth',
      'connectedGoogleEmail',
    ]);

    return {
      spreadsheetUrl: trimText(data.spreadsheetUrl),
      spreadsheetId: trimText(data.spreadsheetId),
      spreadsheetLocked: Boolean(data.spreadsheetLocked),
      hasGoogleAuth: Boolean(data.hasGoogleAuth),
      connectedGoogleEmail: trimText(data.connectedGoogleEmail),
    };
  }

  async function saveSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  self.JDSaverUtils = {
    createRecordId,
    getSettings,
    isGoogleSheetUrl,
    isValidHttpUrl,
    nowIso,
    parseSpreadsheetId,
    saveSettings,
    shortenUrl,
    trimText,
  };
})();

(function () {
  const WORKSHEET_NAME = 'JD 收錄池';
  const HEADER_ORDER = [
    'job_url',
    'saved_at',
    'record_status',
    'job_title',
    'company',
    'location',
    'salary_text',
    'jd_text',
    'industry',
    'source_site',
    'applied_date',
    'application_status',
    'note',
    'agent_queue',
  ];
  const JOB_URL_COLUMN_RANGE = `${WORKSHEET_NAME}!A:A`;

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

  function getOauthClientId() {
    return trimText(chrome.runtime.getManifest().oauth2?.client_id);
  }

  function isOauthConfigured() {
    const clientId = getOauthClientId();
    if (!clientId) {
      return false;
    }

    return !(
      clientId.includes('YOUR_EXTENSION_OAUTH_CLIENT_ID') ||
      clientId.includes('TODO') ||
      clientId.includes('REPLACE_ME')
    );
  }

  function getOauthScopes() {
    return chrome.runtime.getManifest().oauth2?.scopes || [];
  }

  async function getGoogleAuthToken(interactive = false) {
    if (!isOauthConfigured()) {
      throw new Error('Google OAuth client ID is not configured in manifest.json.');
    }

    const result = await chrome.identity.getAuthToken({
      interactive,
      scopes: getOauthScopes(),
    });

    return typeof result === 'string' ? result : result?.token || '';
  }

  async function clearGoogleAuth() {
    await chrome.identity.clearAllCachedAuthTokens();
  }

  async function authorizedFetch(url, token, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    return fetch(url, {
      ...options,
      headers,
    });
  }

  async function getSpreadsheetMetadata(spreadsheetId, token) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties.title`;
    const response = await authorizedFetch(url, token);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to access the target spreadsheet.');
    }

    return data;
  }

  async function getSheetColumnValues(spreadsheetId, range, token) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
    const response = await authorizedFetch(url, token);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to read spreadsheet data.');
    }

    return Array.isArray(data.values) ? data.values : [];
  }

  async function updateSheetRow(spreadsheetId, rowNumber, rowValues, token) {
    const range = `${WORKSHEET_NAME}!A${rowNumber}:${columnLetterFromIndex(HEADER_ORDER.length)}${rowNumber}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const response = await authorizedFetch(url, token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to write data to the spreadsheet.');
    }

    return data;
  }

  function columnLetterFromIndex(index) {
    let current = index;
    let letters = '';

    while (current > 0) {
      const remainder = (current - 1) % 26;
      letters = String.fromCharCode(65 + remainder) + letters;
      current = Math.floor((current - 1) / 26);
    }

    return letters;
  }

  function buildSheetRowFromPayload(payload) {
    return HEADER_ORDER.map((header) => payload[header] ?? '');
  }

  async function getSettings() {
    const data = await chrome.storage.sync.get([
      'language',
      'spreadsheetUrl',
      'spreadsheetId',
      'spreadsheetLocked',
      'hasGoogleAuth',
    ]);

    return {
      language: self.JDSaverI18n
        ? self.JDSaverI18n.normalizeLanguage(data.language)
        : 'en',
      spreadsheetUrl: trimText(data.spreadsheetUrl),
      spreadsheetId: trimText(data.spreadsheetId),
      spreadsheetLocked: Boolean(data.spreadsheetLocked),
      hasGoogleAuth: Boolean(data.hasGoogleAuth),
    };
  }

  async function saveSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  self.JDSaverUtils = {
    HEADER_ORDER,
    JOB_URL_COLUMN_RANGE,
    WORKSHEET_NAME,
    authorizedFetch,
    buildSheetRowFromPayload,
    clearGoogleAuth,
    columnLetterFromIndex,
    createRecordId,
    getGoogleAuthToken,
    getOauthClientId,
    getOauthScopes,
    getSheetColumnValues,
    getSpreadsheetMetadata,
    getSettings,
    isGoogleSheetUrl,
    isOauthConfigured,
    isValidHttpUrl,
    nowIso,
    parseSpreadsheetId,
    saveSettings,
    shortenUrl,
    trimText,
    updateSheetRow,
  };
})();

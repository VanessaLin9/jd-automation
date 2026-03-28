(function () {
  const WORKSHEET_NAME = 'JD 收錄池';
  const HEADER_ORDER = [
    'record_id',
    'saved_at',
    'queue_status',
    'source_site',
    'job_url',
    'job_title',
    'company',
    'industry',
    'location',
    'salary_text',
    'jd_text',
    'fit_note',
    'priority',
    'draft_started_at',
    'draft_generated_at',
    'skill_used',
    'cover_letter_short',
    'cover_letter_full',
    'fit_reasons',
    'gap_notes',
    'telegram_sent_at',
    'telegram_message_ref',
    'error_message',
    'last_updated_at',
  ];
  const JOB_URL_COLUMN_RANGE = `${WORKSHEET_NAME}!E:E`;
  const APPEND_RANGE = `${WORKSHEET_NAME}!A1`;

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

  async function getConnectedGoogleProfile() {
    return chrome.identity.getProfileUserInfo();
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

  async function appendSheetRow(spreadsheetId, rowValues, token) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(APPEND_RANGE)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const response = await authorizedFetch(url, token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to append data to the spreadsheet.');
    }

    return data;
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
      'connectedGoogleEmail',
    ]);

    return {
      language: self.JDSaverI18n
        ? self.JDSaverI18n.normalizeLanguage(data.language)
        : 'en',
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
    APPEND_RANGE,
    HEADER_ORDER,
    JOB_URL_COLUMN_RANGE,
    WORKSHEET_NAME,
    appendSheetRow,
    authorizedFetch,
    buildSheetRowFromPayload,
    clearGoogleAuth,
    createRecordId,
    getConnectedGoogleProfile,
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
  };
})();

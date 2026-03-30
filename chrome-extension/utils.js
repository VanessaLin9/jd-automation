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
  const TEMPLATE_COLUMNS = [
    'Job URL / 職缺網址',
    'Saved At / 收錄時間',
    'Record Status / 收錄狀態',
    'Job Title / 職缺名稱',
    'Company / 公司',
    'Location / 地點',
    'Salary / 薪資',
    'JD Text / JD 內容',
    'Industry / 產業',
    'Source Site / 來源網站',
    'Applied Date / 投遞日期',
    'Application Status / 投遞狀態',
    'Note / 備註',
    'Agent Queue / Agent 佇列',
  ];
  const TEMPLATE_COLUMN_WIDTHS = [280, 180, 170, 240, 200, 160, 140, 320, 160, 150, 150, 190, 220, 210];

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

  function getSheetUrlFromId(spreadsheetId) {
    const trimmed = trimText(spreadsheetId);
    return trimmed ? `https://docs.google.com/spreadsheets/d/${trimmed}/edit` : '';
  }

  function buildSpreadsheetName() {
    const date = new Date().toISOString().slice(0, 10);
    return `JD Saver - ${date}`;
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

  async function createSpreadsheet(token, name = buildSpreadsheetName()) {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets';
    const response = await authorizedFetch(url, token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: name,
        },
        sheets: [
          {
            properties: {
              title: WORKSHEET_NAME,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to create your Google Sheet.');
    }

    return data;
  }

  async function batchUpdateSpreadsheet(spreadsheetId, requests, token) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}:batchUpdate`;
    const response = await authorizedFetch(url, token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to configure the spreadsheet template.');
    }

    return data;
  }

  async function setupSpreadsheetTemplate(spreadsheetId, sheetId, token) {
    await updateSheetRow(spreadsheetId, 1, TEMPLATE_COLUMNS, token);

    const requests = [
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.88,
                green: 0.91,
                blue: 0.96,
              },
              textFormat: {
                bold: true,
                foregroundColor: {
                  red: 0.18,
                  green: 0.14,
                  blue: 0.11,
                },
              },
              verticalAlignment: 'MIDDLE',
              wrapStrategy: 'WRAP',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,wrapStrategy)',
        },
      },
      {
        setBasicFilter: {
          filter: {
            range: {
              sheetId,
              startRowIndex: 0,
              startColumnIndex: 0,
              endColumnIndex: TEMPLATE_COLUMNS.length,
            },
          },
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: 7,
            endColumnIndex: 8,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              wrapStrategy: 'CLIP',
            },
          },
          fields: 'userEnteredFormat.wrapStrategy',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: 0,
            endColumnIndex: TEMPLATE_COLUMNS.length,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              verticalAlignment: 'MIDDLE',
            },
          },
          fields: 'userEnteredFormat.verticalAlignment',
        },
      },
      {
        setDataValidation: {
          range: {
            sheetId,
            startColumnIndex: 2,
            endColumnIndex: 3,
            startRowIndex: 1,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'saved' },
                { userEnteredValue: 'archived' },
                { userEnteredValue: 'skipped' },
              ],
            },
            strict: true,
            showCustomUi: true,
          },
        },
      },
      {
        setDataValidation: {
          range: {
            sheetId,
            startColumnIndex: 11,
            endColumnIndex: 12,
            startRowIndex: 1,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'not applied' },
                { userEnteredValue: 'applied' },
                { userEnteredValue: 'interviewing' },
                { userEnteredValue: 'offer' },
                { userEnteredValue: 'rejected' },
              ],
            },
            strict: true,
            showCustomUi: true,
          },
        },
      },
      {
        setDataValidation: {
          range: {
            sheetId,
            startColumnIndex: 13,
            endColumnIndex: 14,
            startRowIndex: 1,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'prepare_to_apply' },
                { userEnteredValue: 'summarize_jd' },
                { userEnteredValue: 'archive_record' },
              ],
            },
            strict: true,
            showCustomUi: true,
          },
        },
      },
      ...TEMPLATE_COLUMN_WIDTHS.map((pixelSize, index) => ({
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: index,
            endIndex: index + 1,
          },
          properties: {
            pixelSize,
          },
          fields: 'pixelSize',
        },
      })),
    ];

    await batchUpdateSpreadsheet(spreadsheetId, requests, token);
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
      'hasGoogleAuth',
    ]);

    return {
      language: self.JDSaverI18n
        ? self.JDSaverI18n.normalizeLanguage(data.language)
        : 'en',
      spreadsheetUrl: trimText(data.spreadsheetUrl),
      spreadsheetId: trimText(data.spreadsheetId),
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
    batchUpdateSpreadsheet,
    buildSpreadsheetName,
    buildSheetRowFromPayload,
    clearGoogleAuth,
    columnLetterFromIndex,
    createRecordId,
    createSpreadsheet,
    getGoogleAuthToken,
    getOauthClientId,
    getOauthScopes,
    getSheetColumnValues,
    getSheetUrlFromId,
    getSpreadsheetMetadata,
    getSettings,
    isGoogleSheetUrl,
    isOauthConfigured,
    isValidHttpUrl,
    nowIso,
    parseSpreadsheetId,
    saveSettings,
    setupSpreadsheetTemplate,
    shortenUrl,
    trimText,
    updateSheetRow,
  };
})();

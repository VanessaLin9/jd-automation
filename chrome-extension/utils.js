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

  function normalizeSheetEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const id = trimText(entry.id || entry.spreadsheetId);
    if (!id) {
      return null;
    }

    const url = trimText(entry.url || entry.spreadsheetUrl) || getSheetUrlFromId(id);
    return {
      id,
      url,
      name: trimText(entry.name) || `JD Saver - ${id.slice(0, 8)}`,
    };
  }

  function buildAvailableSheets(data) {
    const sheetMap = new Map();
    const entries = Array.isArray(data.availableSheets) ? data.availableSheets : [];

    entries
      .map(normalizeSheetEntry)
      .filter(Boolean)
      .forEach((entry) => {
        if (!sheetMap.has(entry.id)) {
          sheetMap.set(entry.id, entry);
        }
      });

    const legacyId = trimText(data.spreadsheetId);
    if (legacyId && !sheetMap.has(legacyId)) {
      sheetMap.set(legacyId, {
        id: legacyId,
        url: trimText(data.spreadsheetUrl) || getSheetUrlFromId(legacyId),
        name: `JD Saver - ${legacyId.slice(0, 8)}`,
      });
    }

    return Array.from(sheetMap.values());
  }

  function resolveActiveSheetId(availableSheets, requestedId) {
    const trimmedId = trimText(requestedId);
    if (trimmedId && availableSheets.some((sheet) => sheet.id === trimmedId)) {
      return trimmedId;
    }

    return availableSheets[0]?.id || '';
  }

  function buildSpreadsheetName() {
    const year = new Date().getFullYear();
    return `JD Saver - ${year}`;
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties.title`;
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
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: 10,
            sheetId,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.86,
                green: 0.92,
                blue: 0.98,
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
        repeatCell: {
          range: {
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 10,
            endColumnIndex: 13,
            sheetId,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.92,
                green: 0.92,
                blue: 0.92,
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
        repeatCell: {
          range: {
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 13,
            endColumnIndex: 14,
            sheetId,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.95,
                green: 0.67,
                blue: 0.67,
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
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 2,
              endColumnIndex: 3,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'saved' }],
              },
              format: {
                backgroundColor: { red: 0.84, green: 0.94, blue: 0.82 },
                textFormat: {
                  foregroundColor: { red: 0.10, green: 0.49, blue: 0.24 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 2,
              endColumnIndex: 3,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'archived' }],
              },
              format: {
                backgroundColor: { red: 0.92, green: 0.92, blue: 0.92 },
                textFormat: {
                  foregroundColor: { red: 0.31, green: 0.35, blue: 0.40 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 2,
              endColumnIndex: 3,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'skipped' }],
              },
              format: {
                backgroundColor: { red: 0.99, green: 0.91, blue: 0.66 },
                textFormat: {
                  foregroundColor: { red: 0.56, green: 0.38, blue: 0.04 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 12,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'not applied' }],
              },
              format: {
                backgroundColor: { red: 0.92, green: 0.92, blue: 0.92 },
                textFormat: {
                  foregroundColor: { red: 0.31, green: 0.35, blue: 0.40 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 12,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'applied' }],
              },
              format: {
                backgroundColor: { red: 0.84, green: 0.94, blue: 0.82 },
                textFormat: {
                  foregroundColor: { red: 0.10, green: 0.49, blue: 0.24 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 12,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'interviewing' }],
              },
              format: {
                backgroundColor: { red: 1.0, green: 0.83, blue: 0.76 },
                textFormat: {
                  foregroundColor: { red: 0.76, green: 0.24, blue: 0.14 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 12,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'offer' }],
              },
              format: {
                backgroundColor: { red: 0.77, green: 0.05, blue: 0.05 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 11,
              endColumnIndex: 12,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'rejected' }],
              },
              format: {
                backgroundColor: { red: 0.16, green: 0.42, blue: 0.80 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 13,
              endColumnIndex: 14,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'prepare_to_apply' }],
              },
              format: {
                backgroundColor: { red: 1.0, green: 0.86, blue: 0.86 },
                textFormat: {
                  foregroundColor: { red: 0.73, green: 0.13, blue: 0.13 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 13,
              endColumnIndex: 14,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'summarize_jd' }],
              },
              format: {
                backgroundColor: { red: 0.84, green: 0.94, blue: 0.82 },
                textFormat: {
                  foregroundColor: { red: 0.10, green: 0.49, blue: 0.24 },
                  bold: true,
                },
              },
            },
          },
        },
      },
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 13,
              endColumnIndex: 14,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'archive_record' }],
              },
              format: {
                backgroundColor: { red: 0.25, green: 0.25, blue: 0.25 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                },
              },
            },
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
      'hasGoogleAuth',
      'spreadsheetUrl',
      'spreadsheetId',
      'availableSheets',
      'activeSheetId',
    ]);

    const availableSheets = buildAvailableSheets(data);
    const activeSheetId = resolveActiveSheetId(availableSheets, data.activeSheetId || data.spreadsheetId);
    const activeSheet = availableSheets.find((sheet) => sheet.id === activeSheetId) || null;

    return {
      language: self.JDSaverI18n
        ? self.JDSaverI18n.normalizeLanguage(data.language)
        : 'en',
      hasGoogleAuth: Boolean(data.hasGoogleAuth),
      availableSheets,
      activeSheetId,
      activeSheet,
      spreadsheetUrl: activeSheet?.url || '',
      spreadsheetId: activeSheet?.id || '',
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

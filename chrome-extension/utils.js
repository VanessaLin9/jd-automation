(function () {
  const WORKSHEET_NAME = 'JD 收錄池';
  const DASHBOARD_WORKSHEET_NAME = 'Metrics / 指標總覽';
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
    '關卡 1 類型',
    '關卡 1 日期',
    '關卡 2 類型',
    '關卡 2 日期',
    '關卡 3 類型',
    '關卡 3 日期',
    'Result 類型',
  ];
  const TEMPLATE_COLUMN_WIDTHS = [
    280, 180, 170, 240, 200, 160, 140, 320, 160, 150, 150, 190, 220, 210, 150, 140, 150, 140, 150, 140, 160,
  ];
  const DASHBOARD_ROWS = [
    ['Metric / 指標', 'Value / 數值', 'Definition / 定義'],
    [
      'Applied Count / 投遞數',
      `=SUMPRODUCT(--(LEN('${WORKSHEET_NAME}'!A2:A)>0),--(((LEN('${WORKSHEET_NAME}'!K2:K)>0)+('${WORKSHEET_NAME}'!L2:L="applied")+('${WORKSHEET_NAME}'!L2:L="interviewing")+('${WORKSHEET_NAME}'!L2:L="offer")+('${WORKSHEET_NAME}'!L2:L="rejected"))>0))`,
      'Rows with a saved job URL where Applied Date exists, or Application Status is applied/interviewing/offer/rejected.',
    ],
    [
      'Replied Count / 有回覆數',
      `=SUMPRODUCT(--(LEN('${WORKSHEET_NAME}'!A2:A)>0),--(((LEN('${WORKSHEET_NAME}'!P2:P)>0)+(LEN('${WORKSHEET_NAME}'!R2:R)>0)+(LEN('${WORKSHEET_NAME}'!T2:T)>0)+(LEN('${WORKSHEET_NAME}'!U2:U)>0))>0))`,
      'Rows with a saved job URL where any interview date or final result has been recorded.',
    ],
    [
      'Reply Rate / 回覆率',
      '=IF(B2=0,0,B3/B2)',
      'Replied Count / Applied Count',
    ],
    [
      'Offer Count / Offer 數',
      `=COUNTIFS('${WORKSHEET_NAME}'!A2:A,"<>",'${WORKSHEET_NAME}'!U2:U,"Get offer")`,
      'Rows with a saved job URL where Result 類型 is "Get offer".',
    ],
    [
      'Offer Rate (Replied) / Offer 率',
      '=IF(B3=0,0,B5/B3)',
      'Offer Count / Replied Count',
    ],
  ];

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

  function isAuthCancellationError(error) {
    const message = trimText(error?.message || error).toLowerCase();

    if (!message) {
      return false;
    }

    return [
      'user did not approve access',
      'the user did not approve access',
      'the user did not authorize the extension',
      'access_denied',
      'user canceled',
      'user cancelled',
      'authorization was canceled',
      'authorization was cancelled',
      'authorization flow was canceled',
      'authorization flow was cancelled',
      'the user aborted the request',
    ].some((pattern) => message.includes(pattern));
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

  async function updateSheetValues(spreadsheetId, range, values, token) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const response = await authorizedFetch(url, token, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to write data to the spreadsheet.');
    }

    return data;
  }

  async function updateSheetRow(spreadsheetId, rowNumber, rowValues, token) {
    const columnCount = Array.isArray(rowValues) && rowValues.length ? rowValues.length : HEADER_ORDER.length;
    const range = `${WORKSHEET_NAME}!A${rowNumber}:${columnLetterFromIndex(columnCount)}${rowNumber}`;
    return updateSheetValues(spreadsheetId, range, [rowValues], token);
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
    const dashboardResponse = await batchUpdateSpreadsheet(spreadsheetId, [
      {
        addSheet: {
          properties: {
            title: DASHBOARD_WORKSHEET_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      },
    ], token);
    const dashboardSheetId = dashboardResponse.replies?.[0]?.addSheet?.properties?.sheetId;

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
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 14,
            endColumnIndex: 20,
            sheetId,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.99,
                green: 0.92,
                blue: 0.82,
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
            startColumnIndex: 20,
            endColumnIndex: 21,
            sheetId,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 0.85,
                green: 0.94,
                blue: 0.85,
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
            startColumnIndex: 10,
            endColumnIndex: 11,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'DATE',
                pattern: 'yyyy-mm-dd',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: 15,
            endColumnIndex: 16,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'DATE',
                pattern: 'yyyy-mm-dd',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: 17,
            endColumnIndex: 18,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'DATE',
                pattern: 'yyyy-mm-dd',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startColumnIndex: 19,
            endColumnIndex: 20,
            startRowIndex: 1,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: {
                type: 'DATE',
                pattern: 'yyyy-mm-dd',
              },
            },
          },
          fields: 'userEnteredFormat.numberFormat',
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
                { userEnteredValue: 'invited' },
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
        setDataValidation: {
          range: {
            sheetId,
            startColumnIndex: 20,
            endColumnIndex: 21,
            startRowIndex: 1,
          },
          rule: {
            condition: {
              type: 'ONE_OF_LIST',
              values: [
                { userEnteredValue: 'Get offer' },
                { userEnteredValue: 'Reject' },
                { userEnteredValue: '無聲卡' },
                { userEnteredValue: '主動放棄' },
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
                values: [{ userEnteredValue: 'invited' }],
              },
              format: {
                backgroundColor: { red: 0.98, green: 0.86, blue: 0.86 },
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
      {
        addConditionalFormatRule: {
          index: 0,
          rule: {
            ranges: [{
              sheetId,
              startRowIndex: 1,
              startColumnIndex: 20,
              endColumnIndex: 21,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'Get offer' }],
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
              startColumnIndex: 20,
              endColumnIndex: 21,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: 'Reject' }],
              },
              format: {
                backgroundColor: { red: 0.98, green: 0.86, blue: 0.86 },
                textFormat: {
                  foregroundColor: { red: 0.80, green: 0.16, blue: 0.16 },
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
              startColumnIndex: 20,
              endColumnIndex: 21,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: '無聲卡' }],
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
              startColumnIndex: 20,
              endColumnIndex: 21,
            }],
            booleanRule: {
              condition: {
                type: 'TEXT_EQ',
                values: [{ userEnteredValue: '主動放棄' }],
              },
              format: {
                backgroundColor: { red: 1.0, green: 0.89, blue: 0.78 },
                textFormat: {
                  foregroundColor: { red: 0.67, green: 0.34, blue: 0.12 },
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

    if (typeof dashboardSheetId === 'number') {
      requests.push(
        {
          repeatCell: {
            range: {
              sheetId: dashboardSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 3,
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
              sheetId: dashboardSheetId,
              startRowIndex: 1,
              endRowIndex: DASHBOARD_ROWS.length,
              startColumnIndex: 0,
              endColumnIndex: 3,
            },
            cell: {
              userEnteredFormat: {
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'WRAP',
              },
            },
            fields: 'userEnteredFormat(verticalAlignment,wrapStrategy)',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: dashboardSheetId,
              startRowIndex: 1,
              endRowIndex: DASHBOARD_ROWS.length,
              startColumnIndex: 1,
              endColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: 'RIGHT',
              },
            },
            fields: 'userEnteredFormat.horizontalAlignment',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: dashboardSheetId,
              startRowIndex: 3,
              endRowIndex: 4,
              startColumnIndex: 1,
              endColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'PERCENT',
                  pattern: '0.0%',
                },
              },
            },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        {
          repeatCell: {
            range: {
              sheetId: dashboardSheetId,
              startRowIndex: 5,
              endRowIndex: 6,
              startColumnIndex: 1,
              endColumnIndex: 2,
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'PERCENT',
                  pattern: '0.0%',
                },
              },
            },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: dashboardSheetId,
              dimension: 'COLUMNS',
              startIndex: 0,
              endIndex: 1,
            },
            properties: {
              pixelSize: 240,
            },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: dashboardSheetId,
              dimension: 'COLUMNS',
              startIndex: 1,
              endIndex: 2,
            },
            properties: {
              pixelSize: 140,
            },
            fields: 'pixelSize',
          },
        },
        {
          updateDimensionProperties: {
            range: {
              sheetId: dashboardSheetId,
              dimension: 'COLUMNS',
              startIndex: 2,
              endIndex: 3,
            },
            properties: {
              pixelSize: 360,
            },
            fields: 'pixelSize',
          },
        }
      );
    }

    await batchUpdateSpreadsheet(spreadsheetId, requests, token);

    if (typeof dashboardSheetId === 'number') {
      await updateSheetValues(
        spreadsheetId,
        `${DASHBOARD_WORKSHEET_NAME}!A1:C${DASHBOARD_ROWS.length}`,
        DASHBOARD_ROWS,
        token
      );
    }
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
    isAuthCancellationError,
    isGoogleSheetUrl,
    isOauthConfigured,
    isValidHttpUrl,
    nowIso,
    parseSpreadsheetId,
    saveSettings,
    setupSpreadsheetTemplate,
    shortenUrl,
    trimText,
    updateSheetValues,
    updateSheetRow,
  };
})();

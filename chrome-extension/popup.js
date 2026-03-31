document.addEventListener('DOMContentLoaded', async () => {
  const saveButton = document.getElementById('save-jd');
  const optionsButton = document.getElementById('open-options');
  const statusText = document.getElementById('status-text');

  const sourceSiteEl = document.getElementById('source-site');
  const jobTitleEl = document.getElementById('job-title');
  const companyEl = document.getElementById('company');
  const jobUrlEl = document.getElementById('job-url');

  let extractedData = null;
  let settings = null;
  let currentLanguage = self.JDSaverI18n.DEFAULT_LANGUAGE;

  function t(key, variables) {
    return self.JDSaverI18n.translate(currentLanguage, key, variables);
  }

  function applyLanguage(language) {
    currentLanguage = self.JDSaverI18n.normalizeLanguage(language);
    self.JDSaverI18n.applyTranslations(document, currentLanguage);
  }

  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function setStatus(messageKey, tone, variables) {
    statusText.textContent = t(messageKey, variables);
    statusText.className = tone ? `status-text ${tone}` : 'status-text';
  }

  function setErrorStatus(error, fallbackKey) {
    statusText.textContent = error?.message || t(fallbackKey);
    statusText.className = 'status-text error';
  }

  function renderDetails(data) {
    sourceSiteEl.textContent = data.source_site || t('common.hyphen');
    jobTitleEl.textContent = data.job_title || t('common.hyphen');
    companyEl.textContent = data.company || t('common.hyphen');
    jobUrlEl.textContent = self.JDSaverUtils.shortenUrl(data.job_url);
  }

  function isSaveReady(settingsValue) {
    return Boolean(settingsValue && settingsValue.activeSheet && settingsValue.hasGoogleAuth);
  }

  function validateExtractedData(data) {
    const missing = [];

    if (!data || !data.job_url) {
      missing.push('job_url');
    }
    if (!data || !data.job_title) {
      missing.push('job_title');
    }
    if (!data || !data.company) {
      missing.push('company');
    }
    if (!data || !data.jd_text) {
      missing.push('jd_text');
    }

    if (missing.length === 0) {
      return { ok: true };
    }

    if (missing.length === 1 && missing[0] === 'company') {
      return {
        ok: false,
        message: t('popup.jdCompanyMissing'),
      };
    }

    return {
      ok: false,
      message: t('popup.jdInsufficient'),
    };
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs.length || !tabs[0].id || !tabs[0].url) {
      throw new Error(t('popup.readTabFailed'));
    }

    return tabs[0];
  }

  async function extractCurrentPage(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['extractors.js', 'content.js'],
    });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => self.__JD_SAVER_LAST_EXTRACTION__,
    });

    return result && result.result ? result.result : null;
  }

  function buildPayload(data) {
    const timestamp = self.JDSaverUtils.nowIso();

    return {
      job_url: data.job_url || '',
      saved_at: timestamp,
      record_status: 'saved',
      job_title: data.job_title || '',
      company: data.company || '',
      location: data.location || '',
      salary_text: data.salary_text || '',
      jd_text: data.jd_text || '',
      industry: data.industry || '',
      source_site: data.source_site || '',
      applied_date: '',
      application_status: 'not applied',
      note: '',
      agent_queue: '',
    };
  }

  async function verifyWorksheetExists(spreadsheetId, token) {
    const metadata = await self.JDSaverUtils.getSpreadsheetMetadata(spreadsheetId, token);
    const titles = Array.isArray(metadata.sheets)
      ? metadata.sheets.map((sheet) => sheet?.properties?.title).filter(Boolean)
      : [];

    if (!titles.includes(self.JDSaverUtils.WORKSHEET_NAME)) {
      throw new Error(t('popup.sheetMissing'));
    }
  }

  async function isDuplicateJobUrl(spreadsheetId, jobUrl, token) {
    const values = await self.JDSaverUtils.getSheetColumnValues(
      spreadsheetId,
      self.JDSaverUtils.JOB_URL_COLUMN_RANGE,
      token
    );

    return values.some((row, index) => {
      if (index === 0) {
        return false;
      }
      const value = Array.isArray(row) ? self.JDSaverUtils.trimText(row[0]) : '';
      return value === self.JDSaverUtils.trimText(jobUrl);
    });
  }

  async function getNextWritableRow(spreadsheetId, token) {
    const values = await self.JDSaverUtils.getSheetColumnValues(
      spreadsheetId,
      self.JDSaverUtils.JOB_URL_COLUMN_RANGE,
      token
    );

    return Math.max(values.length + 1, 2);
  }

  async function saveJobData() {
    if (!settings || !settings.activeSheet) {
      throw new Error(t('popup.settingsMissing'));
    }

    if (!settings.hasGoogleAuth) {
      throw new Error(t('popup.authRequired'));
    }

    if (!extractedData) {
      throw new Error(t('popup.noData'));
    }

    const validation = validateExtractedData(extractedData);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const payload = buildPayload(extractedData);
    const token = await self.JDSaverUtils.getGoogleAuthToken(true);

    if (!token) {
      throw new Error(t('popup.noToken'));
    }

    await verifyWorksheetExists(settings.activeSheet.id, token);

    const duplicate = await isDuplicateJobUrl(settings.activeSheet.id, payload.job_url, token);
    if (duplicate) {
      return { status: 'duplicate' };
    }

    const nextRow = await getNextWritableRow(settings.activeSheet.id, token);
    const rowValues = self.JDSaverUtils.buildSheetRowFromPayload(payload);
    await self.JDSaverUtils.updateSheetRow(settings.activeSheet.id, nextRow, rowValues, token);

    return { status: 'created' };
  }

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    setStatus('popup.saving', '');

    try {
      const result = await saveJobData();

      if (result.status === 'duplicate') {
        setStatus('popup.duplicate', 'success');
      } else {
        setStatus('popup.saved', 'success');
      }
    } catch (error) {
      setErrorStatus(error, 'popup.saveFailed');
    } finally {
      saveButton.disabled = !isSaveReady(settings);
    }
  });

  try {
    settings = await self.JDSaverUtils.getSettings();
    applyLanguage(settings.language);

    if (!settings.activeSheet) {
      setStatus('popup.settingsMissingOpen', 'error');
      return;
    }

    const tab = await getActiveTab();
    if (!/^https?:/.test(tab.url)) {
      setStatus('popup.pageTypeUnsupported', 'error');
      return;
    }

    setStatus('popup.extracting', '');
    extractedData = await extractCurrentPage(tab.id);
    renderDetails(extractedData || {});

    const validation = validateExtractedData(extractedData);
    if (!validation.ok) {
      statusText.textContent = validation.message;
      statusText.className = 'status-text error';
      return;
    }

    if (!self.JDSaverUtils.isOauthConfigured()) {
      setStatus('popup.oauthMissing', 'error');
      return;
    }

    if (!settings.hasGoogleAuth) {
      setStatus('popup.connectGoogleFirst', 'error');
      saveButton.disabled = true;
      return;
    }

    saveButton.disabled = false;
    setStatus('popup.ready', 'success');
  } catch (error) {
    setErrorStatus(error, 'popup.prepareFailed');
  }
});

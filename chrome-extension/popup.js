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

  optionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  function setStatus(message, tone) {
    statusText.textContent = message;
    statusText.className = tone ? `status-text ${tone}` : 'status-text';
  }

  function renderDetails(data) {
    sourceSiteEl.textContent = data.source_site || '-';
    jobTitleEl.textContent = data.job_title || '-';
    companyEl.textContent = data.company || '-';
    jobUrlEl.textContent = self.JDSaverUtils.shortenUrl(data.job_url);
  }

  function isSaveReady(settingsValue) {
    return Boolean(settingsValue && settingsValue.spreadsheetId && settingsValue.hasGoogleAuth);
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
        message: 'This page does not look like a JD page yet. Company information was not found.',
      };
    }

    return {
      ok: false,
      message: 'This page does not contain enough JD information to save.',
    };
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tabs.length || !tabs[0].id || !tabs[0].url) {
      throw new Error('Unable to read the current tab.');
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
      record_id: self.JDSaverUtils.createRecordId(),
      saved_at: timestamp,
      queue_status: 'saved',
      source_site: data.source_site || '',
      job_url: data.job_url || '',
      job_title: data.job_title || '',
      company: data.company || '',
      industry: data.industry || '',
      location: data.location || '',
      salary_text: data.salary_text || '',
      jd_text: data.jd_text || '',
      fit_note: '',
      priority: '',
      last_updated_at: timestamp,
    };
  }

  async function verifyWorksheetExists(spreadsheetId, token) {
    const metadata = await self.JDSaverUtils.getSpreadsheetMetadata(spreadsheetId, token);
    const titles = Array.isArray(metadata.sheets)
      ? metadata.sheets.map((sheet) => sheet?.properties?.title).filter(Boolean)
      : [];

    if (!titles.includes(self.JDSaverUtils.WORKSHEET_NAME)) {
      throw new Error(`The worksheet ${self.JDSaverUtils.WORKSHEET_NAME} was not found.`);
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

  async function saveJobData() {
    if (!settings || !settings.spreadsheetId) {
      throw new Error('Spreadsheet settings are missing. Open Settings first.');
    }

    if (!settings.hasGoogleAuth) {
      throw new Error('Google authorization is required before saving JDs.');
    }

    if (!extractedData) {
      throw new Error('No JD data is available for saving.');
    }

    const validation = validateExtractedData(extractedData);
    if (!validation.ok) {
      throw new Error(validation.message);
    }

    const payload = buildPayload(extractedData);
    const token = await self.JDSaverUtils.getGoogleAuthToken(true);

    if (!token) {
      throw new Error('Google authorization did not return an access token.');
    }

    await verifyWorksheetExists(settings.spreadsheetId, token);

    const duplicate = await isDuplicateJobUrl(settings.spreadsheetId, payload.job_url, token);
    if (duplicate) {
      return { status: 'duplicate' };
    }

    const rowValues = self.JDSaverUtils.buildSheetRowFromPayload(payload);
    await self.JDSaverUtils.appendSheetRow(settings.spreadsheetId, rowValues, token);

    if (!settings.hasGoogleAuth) {
      const profile = await self.JDSaverUtils.getConnectedGoogleProfile();
      await self.JDSaverUtils.saveSettings({
        hasGoogleAuth: true,
        connectedGoogleEmail: self.JDSaverUtils.trimText(profile.email),
      });
      settings = await self.JDSaverUtils.getSettings();
    }

    return { status: 'created' };
  }

  saveButton.addEventListener('click', async () => {
    saveButton.disabled = true;
    setStatus('Saving JD...', '');

    try {
      const result = await saveJobData();

      if (result.status === 'duplicate') {
        setStatus('This JD is already saved.', 'success');
      } else {
        setStatus('Saved to Google Sheet.', 'success');
      }
    } catch (error) {
      setStatus(error.message || 'Failed to save JD.', 'error');
    } finally {
      saveButton.disabled = !isSaveReady(settings);
    }
  });

  try {
    settings = await self.JDSaverUtils.getSettings();
    if (!settings.spreadsheetId) {
      setStatus('Spreadsheet settings are missing. Open Settings to continue.', 'error');
      return;
    }

    const tab = await getActiveTab();
    if (!/^https?:/.test(tab.url)) {
      setStatus('This page type is not supported.', 'error');
      return;
    }

    setStatus('Extracting current JD...', '');
    extractedData = await extractCurrentPage(tab.id);
    renderDetails(extractedData || {});

    const validation = validateExtractedData(extractedData);
    if (!validation.ok) {
      setStatus(validation.message, 'error');
      return;
    }

    if (!self.JDSaverUtils.isOauthConfigured()) {
      setStatus('OAuth client ID is not configured yet. Save flow will not work until manifest.json is updated.', 'error');
      return;
    }

    if (!settings.hasGoogleAuth) {
      setStatus('Connect Google in Settings before saving JDs.', 'error');
      saveButton.disabled = true;
      return;
    }

    saveButton.disabled = false;
    setStatus('Ready to save this JD.', 'success');
  } catch (error) {
    setStatus(error.message || 'Failed to prepare this page.', 'error');
  }
});

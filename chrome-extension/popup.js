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
      secret: settings.sharedSecret,
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

  async function saveJobData() {
    if (!settings || !settings.webAppUrl || !settings.sharedSecret) {
      throw new Error('Settings are missing. Open Settings first.');
    }

    if (!extractedData) {
      throw new Error('No JD data is available for saving.');
    }

    const payload = buildPayload(extractedData);
    const response = await fetch(settings.webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const rawText = await response.text();
    let json;

    try {
      json = JSON.parse(rawText);
    } catch (error) {
      throw new Error('Web App did not return JSON.');
    }

    if (!response.ok || !json.ok) {
      throw new Error(json && json.error ? json.error : 'Failed to save JD.');
    }

    return json;
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
      saveButton.disabled = false;
    }
  });

  try {
    settings = await self.JDSaverUtils.getSettings();
    if (!settings.webAppUrl || !settings.sharedSecret) {
      setStatus('Settings are missing. Open Settings to continue.', 'error');
      return;
    }

    const tab = await getActiveTab();
    if (!/^https?:/.test(tab.url)) {
      setStatus('This page type is not supported.', 'error');
      return;
    }

    setStatus('Extracting current JD...', '');
    extractedData = await extractCurrentPage(tab.id);

    if (!extractedData || !extractedData.job_url || !extractedData.job_title || !extractedData.jd_text) {
      setStatus('Failed to extract JD content from this page.', 'error');
      return;
    }

    renderDetails(extractedData);
    saveButton.disabled = false;
    setStatus('Ready to save this JD.', 'success');
  } catch (error) {
    setStatus(error.message || 'Failed to prepare this page.', 'error');
  }
});

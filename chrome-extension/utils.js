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

  async function getSettings() {
    const data = await chrome.storage.sync.get(['webAppUrl', 'sharedSecret']);
    return {
      webAppUrl: trimText(data.webAppUrl),
      sharedSecret: trimText(data.sharedSecret),
    };
  }

  async function saveSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  self.JDSaverUtils = {
    createRecordId,
    getSettings,
    isValidHttpUrl,
    nowIso,
    saveSettings,
    shortenUrl,
    trimText,
  };
})();

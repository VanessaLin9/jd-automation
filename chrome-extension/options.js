document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('settings-form');
  const webAppUrlInput = document.getElementById('web-app-url');
  const sharedSecretInput = document.getElementById('shared-secret');
  const statusText = document.getElementById('settings-status');

  const settings = await self.JDSaverUtils.getSettings();
  webAppUrlInput.value = settings.webAppUrl;
  sharedSecretInput.value = settings.sharedSecret;

  if (settings.webAppUrl && settings.sharedSecret) {
    statusText.textContent = 'Settings loaded.';
    statusText.className = 'status-text success';
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const webAppUrl = self.JDSaverUtils.trimText(webAppUrlInput.value);
    const sharedSecret = self.JDSaverUtils.trimText(sharedSecretInput.value);

    if (!self.JDSaverUtils.isValidHttpUrl(webAppUrl)) {
      statusText.textContent = 'Please enter a valid Web App URL.';
      statusText.className = 'status-text error';
      return;
    }

    if (!sharedSecret) {
      statusText.textContent = 'Please enter your shared secret.';
      statusText.className = 'status-text error';
      return;
    }

    await self.JDSaverUtils.saveSettings({
      webAppUrl,
      sharedSecret,
    });

    statusText.textContent = 'Settings saved successfully.';
    statusText.className = 'status-text success';
  });
});

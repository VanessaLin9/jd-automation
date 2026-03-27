# JD Automation

`JD Automation` is a small Chrome extension project for saving the current job description page into a Google Sheet owned by the user.

## Current Scope

This repository currently includes:

- a Chrome extension MVP
- Google Sheet schema docs
- an Apps Script-compatible intake flow for early testing

The extension is intentionally scoped to:

- read the current JD page
- extract job information
- save the result into a user-owned Google Sheet with `queue_status = saved`

It does not include downstream automation such as:

- AI cover letter generation
- Telegram delivery
- job application submission

## Project Layout

```text
chrome-extension/
docs/
templates/
```

## Local Testing

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Choose `Load unpacked`
4. Select the `chrome-extension/` directory
5. Open the extension settings page
6. Fill in your own Apps Script Web App URL and shared secret
7. Visit a job page and test `Save JD`

## Notes

- This is still an MVP.
- The current persistence path uses a user-owned Google Sheet and Apps Script.
- The distribution and persistence architecture may change in a later version.

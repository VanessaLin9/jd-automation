# JD Automation

`JD Automation` is a Chrome extension project for saving the current job description page into a Google Sheet owned by the user.

## Current Scope

This repository currently includes:

- a Chrome extension MVP
- Google Sheet schema docs
- a v2 direction based on Google OAuth and the Google Sheets API

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
6. Open the template and make a copy into your own Google Drive
7. Paste your own Google Sheet URL
8. Connect your Google account
9. Visit a job page and test `Save JD`

## Notes

- This is still an MVP.
- The product boundary is intentionally narrow: `JD page -> user-owned Google Sheet`.
- The current public-facing direction is Google OAuth + Google Sheets API.

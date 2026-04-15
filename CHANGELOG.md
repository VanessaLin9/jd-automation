# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, with entries grouped by release version.

## [0.1.2] - Unreleased

### Fixed
- Fixed incorrect company name extraction on 104 job pages.
- Fixed incorrect company name extraction on Cake job pages.
- Normalized source site labels so supported platforms are saved consistently in the spreadsheet.

### Changed
- Split the README into separate Traditional Chinese and English files.
- Added language switch links at the top of both README files.

### Added
- Added this changelog to track release history in the repository.

## [0.1.1] - 2026-04-13

### Fixed
- Fixed Google OAuth validation and related authorization error handling.
- Tightened application reply metrics to reduce ambiguous counting in the dashboard.

### Added
- Added the `Metrics / 指標總覽` worksheet to the generated spreadsheet template.
- Added workflow-oriented tracking columns to the generated sheet.
- Added dashboard metrics for applied count, reply rate, offer count, reject count, and withdraw count.

### Changed
- Refined dashboard formulas to better separate application-side replies, inbound invites, and offer metrics.

## [0.1.0] - 2026-03-31

### Added
- Initial public release of JD Saver for Google Sheets.
- Chrome extension flow for saving the current job description page into a user-owned Google Sheet.
- Google OAuth and Google Sheets integration without requiring a separate backend.
- Spreadsheet creation and setup flow from the extension settings page.
- Site-specific extraction for 104 and Cake, with a generic fallback extractor for other job pages.
- English and Traditional Chinese UI support.

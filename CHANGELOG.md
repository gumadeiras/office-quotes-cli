# Changelog

## Unreleased

### Changes

- Renamed the published npm and Homebrew package to `office-quotes`.
- Added a local release wrapper for version sync, packaging, tagging, and release workflow verification.
- Documented the local release wrapper in the repo agent guide.

## 1.1.2 - 2026-05-14

### Fixes

- Added real `--version` output for install verification.
- Fixed release publishing to use the stable GitHub Actions Node toolchain.
- Added release package install smoke coverage.

## 1.1.1 - 2026-04-25

### Fixes

- Deferred Chromium installation until image export.

### Changes

- Updated README quote formatting.

## 1.1.0 - 2026-01-25

### Features

- Switched to `playwright-chromium` as the primary dependency.
- Added Bash tests.

### Changes

- Refactored the CLI, updated docs, and refreshed dependency metadata.

## 1.0.3 - 2026-01-25

### Features

- Added ESLint and Jest configuration and test coverage.

### Changes

- Refactored CLI internals.

## 1.0.2 - 2026-01-25

### Features

- Added API command mode.

### Changes

- Updated temporary SVG path handling.

## 1.0.1 - 2026-01-25

Initial release.

### Features

- Added offline and online Office quote CLI modes.
- Added Node.js CLI, local quote data, API-backed quote card export, and PNG/JPG/WebP support.
- Added install script with executable copy and shell PATH setup.

### Fixes

- Fixed a Michael Scott quote.

### Changes

- Added README examples, credits, installation guidance, and output examples.

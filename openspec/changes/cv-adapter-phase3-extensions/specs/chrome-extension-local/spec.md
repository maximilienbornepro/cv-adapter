## ADDED Requirements

### Requirement: Same functionality as dev extension
The local extension SHALL have the same features as the dev extension.

#### Scenario: Popup UI identical
- **WHEN** user opens local extension popup
- **THEN** UI is identical to dev extension

#### Scenario: Form detection identical
- **WHEN** content script runs
- **THEN** detection logic is identical to dev extension

#### Scenario: Field filling identical
- **WHEN** autofill is triggered
- **THEN** filling behavior is identical to dev extension

### Requirement: Different host permissions
The local extension SHALL be configured for production URLs.

#### Scenario: Host permissions for local
- **WHEN** extension is the local version
- **THEN** host_permissions includes production URL pattern

#### Scenario: API base URL
- **WHEN** extension makes API calls
- **THEN** calls go to production server URL

### Requirement: Configurable base URL
The local extension SHALL allow easy URL configuration.

#### Scenario: Config file
- **WHEN** building local extension
- **THEN** config.js contains BASE_URL variable

#### Scenario: URL change
- **WHEN** production URL changes
- **THEN** only config.js needs to be updated

### Requirement: Separate manifest
The local extension SHALL have its own manifest.json.

#### Scenario: Different extension name
- **WHEN** both extensions are installed
- **THEN** they have distinct names ("CV Adapter Dev" vs "CV Adapter")

#### Scenario: Different icons (optional)
- **WHEN** both extensions are installed
- **THEN** they can have visually distinct icons

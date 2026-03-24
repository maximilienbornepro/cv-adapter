## ADDED Requirements

### Requirement: HTML preview of CV
The system SHALL provide an HTML preview of the CV that matches the PDF layout via GET /cv-adapter-api/preview.

#### Scenario: Successful HTML preview
- **WHEN** user requests preview with CV data
- **THEN** system returns HTML content with Content-Type text/html

#### Scenario: Preview matches PDF layout
- **WHEN** HTML preview is rendered
- **THEN** layout uses same 2-column design, fonts, and colors as the PDF

#### Scenario: Preview is interactive
- **WHEN** user views HTML preview in browser
- **THEN** content is scrollable and selectable (unlike PDF)

### Requirement: PDF preview inline
The system SHALL provide an inline PDF preview via GET /cv-adapter-api/preview-pdf for browser viewing.

#### Scenario: Inline display
- **WHEN** user requests preview-pdf
- **THEN** response has Content-Disposition: inline (not attachment)

#### Scenario: Browser renders PDF
- **WHEN** preview-pdf URL is opened in browser
- **THEN** PDF displays directly in browser's PDF viewer

### Requirement: Preview with adapted CV
The system SHALL accept both original and adapted CV data for preview.

#### Scenario: Preview original CV
- **WHEN** user previews their original CV data
- **THEN** preview shows the current saved CV

#### Scenario: Preview adapted CV
- **WHEN** user previews adapted CV before saving
- **THEN** preview shows the adapted version for review

### Requirement: Real-time preview
The system SHALL generate previews quickly to enable iterative editing.

#### Scenario: Fast HTML preview
- **WHEN** user requests HTML preview
- **THEN** response is returned in under 500ms

#### Scenario: PDF preview timing
- **WHEN** user requests PDF preview
- **THEN** response is returned in under 5 seconds (Puppeteer rendering)

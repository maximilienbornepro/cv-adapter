## ADDED Requirements

### Requirement: Full preview button in export section
The system SHALL display a "Aperçu complet" button in the ExportSection component, next to the existing "Aperçu HTML" button.

#### Scenario: Button visibility
- **WHEN** user is on the CV editing page in the export section
- **THEN** an "Aperçu complet" button is visible next to the "Aperçu HTML" button

#### Scenario: Button click triggers full preview
- **WHEN** user clicks on "Aperçu complet" button
- **THEN** system calls the full preview endpoint with current CV data
- **THEN** a new browser tab opens displaying the complete HTML preview

### Requirement: Full preview endpoint
The system SHALL provide a POST endpoint at `/cv-adapter-api/full-preview` that generates an HTML preview with all data displayed without simplification.

#### Scenario: Successful full preview generation
- **WHEN** endpoint receives POST request with `{ cvData: CVData }`
- **THEN** system generates HTML with all content displayed in full
- **THEN** system returns complete HTML document (Content-Type: text/html)

#### Scenario: Missing CV data
- **WHEN** endpoint receives POST request without cvData
- **THEN** system returns 400 error with message "CV data is required"

### Requirement: Complete description display
The system SHALL display all descriptions in their entirety without truncation or simplification.

#### Scenario: Experience descriptions complete
- **WHEN** full preview is generated
- **THEN** all experience descriptions are displayed in full, regardless of length

#### Scenario: Project descriptions complete
- **WHEN** full preview is generated
- **THEN** all project descriptions are displayed in full without any shortening

### Requirement: All content items displayed
The system SHALL display all items in arrays without limiting the number shown.

#### Scenario: All missions displayed
- **WHEN** experience has 10 missions
- **THEN** all 10 missions are displayed in the preview

#### Scenario: All projects displayed
- **WHEN** experience has 5 projects
- **THEN** all 5 projects with their complete descriptions are displayed

#### Scenario: All technologies displayed
- **WHEN** experience has many technologies
- **THEN** all technologies are displayed without limit

### Requirement: Same template as existing preview
The system SHALL use the same HTML template structure as the current preview (two-column layout, terminal theme).

#### Scenario: Visual consistency
- **WHEN** full preview is generated
- **THEN** layout and styling match the existing HTML preview
- **THEN** only difference is the amount of content displayed

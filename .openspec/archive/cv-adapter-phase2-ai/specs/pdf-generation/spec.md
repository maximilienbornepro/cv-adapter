## ADDED Requirements

### Requirement: Generate PDF from CV
The system SHALL generate a PDF document from CV data using Puppeteer with a professional 2-column layout.

#### Scenario: Successful PDF generation
- **WHEN** user requests PDF via POST /cv-adapter-api/generate-pdf with valid CV data
- **THEN** system returns a PDF file with Content-Type application/pdf

#### Scenario: Missing CV data
- **WHEN** user requests PDF without CV data
- **THEN** system returns 400 error with message "CV data is required"

### Requirement: Two-column layout
The system SHALL render the PDF with a sidebar (280px) on the left and main content (520px) on the right.

#### Scenario: Sidebar contains profile info
- **WHEN** PDF is generated
- **THEN** sidebar displays profile photo (120px circle), contact info, languages, and all skill categories (competences, outils, dev, frameworks, solutions)

#### Scenario: Main content contains experiences
- **WHEN** PDF is generated
- **THEN** main area displays experiences, formations, side projects, and awards in order

### Requirement: A4 format
The system SHALL generate PDF in A4 format (210mm × 297mm) with 15mm margins.

#### Scenario: Page dimensions
- **WHEN** PDF is generated
- **THEN** each page is exactly A4 size with consistent margins

### Requirement: Terminal style theme
The system SHALL use a terminal-inspired design consistent with the application's design system.

#### Scenario: Font styling
- **WHEN** PDF is generated
- **THEN** name uses Playfair Display font, body uses monospace font

#### Scenario: Color scheme
- **WHEN** PDF is generated
- **THEN** sidebar has dark background (#1a1a1a), main has light background, accent color is cyan (#06b6d4)

### Requirement: Embedded images
The system SHALL embed all images (profile photo, company logos) as base64 data URLs.

#### Scenario: Profile photo embedded
- **WHEN** CV has a profile photo URL
- **THEN** PDF contains the image as base64 inline, not as external URL

#### Scenario: Company logos embedded
- **WHEN** experiences have company logos
- **THEN** each logo is embedded as base64 in the PDF

#### Scenario: Missing images handled
- **WHEN** image URL is invalid or unavailable
- **THEN** PDF renders without the image (no broken image icon)

### Requirement: Multi-page support
The system SHALL support CVs that span multiple pages with proper page breaks.

#### Scenario: Long CV pagination
- **WHEN** CV content exceeds one page
- **THEN** content flows to subsequent pages with consistent header/footer

#### Scenario: Experience not split
- **WHEN** an experience would be split across pages
- **THEN** page break occurs before the experience to keep it together when possible

### Requirement: Download filename
The system SHALL use a meaningful filename based on CV owner name.

#### Scenario: Filename format
- **WHEN** PDF is generated for "Jean Dupont"
- **THEN** downloaded file is named "CV_Jean_Dupont.pdf"

#### Scenario: Missing name fallback
- **WHEN** CV has no name
- **THEN** downloaded file is named "CV.pdf"

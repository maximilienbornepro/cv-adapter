## 1. Dependencies & Setup

- [x] 1.1 Add puppeteer dependency to unified server package.json
- [x] 1.2 Create adaptService.ts file structure in cv-adapter module
- [x] 1.3 Create pdfService.ts file structure in cv-adapter module
- [x] 1.4 Add ANTHROPIC_API_KEY to .env.example

## 2. CV Adaptation Backend

- [x] 2.1 Define AdaptRequest and AdaptResponse types
- [x] 2.2 Implement analyzeJobOffer function to extract requirements from job text
- [x] 2.3 Implement generateMissions function to create 1-2 new missions
- [x] 2.4 Implement generateProject function to create 1 new project
- [x] 2.5 Implement addRelevantSkills function with 1-per-category limit
- [x] 2.6 Implement main adaptCV function orchestrating all generation
- [x] 2.7 Add POST /adapt endpoint in routes.ts
- [x] 2.8 Add input validation for adapt endpoint (job offer required)
- [x] 2.9 Implement modifyCV function for post-adaptation changes
- [x] 2.10 Add POST /modify endpoint in routes.ts
- [x] 2.11 Add input validation for modify endpoint (modification request required)

## 3. PDF Generation Backend

- [x] 3.1 Define PDF template types (sections, layout config)
- [x] 3.2 Create HTML template for 2-column CV layout
- [x] 3.3 Implement sidebar section (photo, contact, skills) HTML generation
- [x] 3.4 Implement main section (experiences) HTML generation
- [x] 3.5 Implement main section (formations) HTML generation
- [x] 3.6 Implement main section (side projects) HTML generation
- [x] 3.7 Implement main section (awards) HTML generation
- [x] 3.8 Implement image to base64 conversion utility
- [x] 3.9 Implement Puppeteer PDF generation with A4 format
- [x] 3.10 Add page break handling for long CVs
- [x] 3.11 Add POST /generate-pdf endpoint in routes.ts
- [x] 3.12 Implement filename generation from CV name

## 4. CV Preview Backend

- [x] 4.1 Implement getPreviewHTML function using same template as PDF
- [x] 4.2 Add GET /preview endpoint returning HTML content
- [x] 4.3 Add GET /preview-pdf endpoint with Content-Disposition: inline
- [x] 4.4 Accept CV data in query params or POST body for preview

## 5. Frontend Types & Services

- [x] 5.1 Add AdaptRequest and AdaptResponse types to frontend types
- [x] 5.2 Add adaptCV function to api.ts service
- [x] 5.3 Add modifyCV function to api.ts service
- [x] 5.4 Add getPreviewHTML function to api.ts service
- [x] 5.5 Add generatePDF function to api.ts service
- [x] 5.6 Add getPreviewPDFUrl helper function

## 6. Frontend Components - Adaptation

- [x] 6.1 Create AdaptCVPage component structure
- [x] 6.2 Implement job offer textarea input
- [x] 6.3 Implement custom instructions textarea input
- [x] 6.4 Add "Adapter" button with loading state
- [x] 6.5 Display adaptation result with diff highlight
- [x] 6.6 Add "Valider" and "Annuler" buttons for adapted CV
- [x] 6.7 Create AdaptResultPreview component showing changes

## 7. Frontend Components - PDF Export

- [x] 7.1 Create ExportSection component in MyProfilePage
- [x] 7.2 Add "Apercu HTML" button opening preview in new tab
- [x] 7.3 Add "Apercu PDF" button opening inline PDF preview
- [x] 7.4 Add "Telecharger PDF" button triggering download
- [x] 7.5 Add loading states for PDF generation

## 8. Styling

- [x] 8.1 Add styles for AdaptCVPage (.adapt-page, .adapt-form)
- [x] 8.2 Add styles for diff preview (.adapt-diff, .added, .original)
- [x] 8.3 Add styles for export section (.export-section, .export-buttons)
- [x] 8.4 Create PDF template CSS with terminal theme
- [x] 8.5 Add Google Fonts import for Playfair Display in PDF template

## 9. Integration

- [x] 9.1 Add AdaptCVPage route in cv-adapter App.tsx
- [x] 9.2 Add navigation link to adaptation page in MyProfilePage
- [x] 9.3 Update cv-adapter index.css with new styles

## 10. Tests

- [x] 10.1 Add unit tests for adaptService functions
- [x] 10.2 Add unit tests for pdfService HTML generation
- [x] 10.3 Add unit tests for image base64 conversion
- [x] 10.4 Add frontend tests for adaptation flow types
- [x] 10.5 Add frontend tests for PDF export helpers
- [x] 10.6 Verify all tests pass with npm test

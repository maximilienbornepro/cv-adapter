## 1. Backend - Autofill API

- [x] 1.1 Create autofillService.ts file in cv-adapter module
- [x] 1.2 Define AutofillRequest and AutofillResponse types
- [x] 1.3 Implement field type detection (text, email, phone, textarea, select)
- [x] 1.4 Implement direct CV field mapping (name, email, phone, city)
- [x] 1.5 Implement Claude Opus 4.5 generation for complex fields
- [x] 1.6 Implement CSS selector generation for fields
- [x] 1.7 Add POST /autofill-form endpoint in routes.ts
- [x] 1.8 Add input validation for autofill endpoint

## 2. Extension Structure - Dev Version

- [x] 2.1 Create extensions/cv-adapter-dev/ directory
- [x] 2.2 Create manifest.json with Manifest V3 structure
- [x] 2.3 Add permissions: activeTab, storage
- [x] 2.4 Add host_permissions for localhost

## 3. Extension Popup - Dev Version

- [x] 3.1 Create popup.html with basic UI structure
- [x] 3.2 Create popup.css with terminal theme styling
- [x] 3.3 Create popup.js with initialization logic
- [x] 3.4 Implement connection status check
- [x] 3.5 Implement "Remplir le formulaire" button
- [x] 3.6 Implement error display (not authenticated, no CV, etc.)

## 4. Extension Content Script - Dev Version

- [x] 4.1 Create content.js file
- [x] 4.2 Implement form field detection (input, textarea, select)
- [x] 4.3 Implement contenteditable detection
- [x] 4.4 Implement rich text editor detection (ProseMirror, TipTap)
- [x] 4.5 Implement field info extraction (label, placeholder, name, type)
- [x] 4.6 Implement CSS selector generation for each field
- [x] 4.7 Implement text input filling with events
- [x] 4.8 Implement textarea filling with events
- [x] 4.9 Implement select filling with events
- [x] 4.10 Implement contenteditable filling
- [x] 4.11 Create content-styles.css for visual feedback

## 5. Extension Background Service - Dev Version

- [x] 5.1 Create background.js service worker
- [x] 5.2 Implement message listener for content script
- [x] 5.3 Implement API request proxying with cookies
- [x] 5.4 Implement CV data fetching
- [x] 5.5 Implement autofill API call

## 6. Extension Icons

- [x] 6.1 Create icons/ directory
- [x] 6.2 Create icon-16.png
- [x] 6.3 Create icon-48.png
- [x] 6.4 Create icon-128.png

## 7. Extension - Local Version

- [x] 7.1 Create extensions/cv-adapter-local/ directory
- [x] 7.2 Copy all files from dev version
- [x] 7.3 Create config.js with BASE_URL variable
- [x] 7.4 Update manifest.json with different name and host_permissions
- [x] 7.5 Update scripts to use config.js BASE_URL

## 8. Tests

- [x] 8.1 Add unit tests for autofillService field type detection
- [x] 8.2 Add unit tests for CSS selector generation
- [x] 8.3 Add unit tests for direct CV field mapping
- [x] 8.4 Verify all tests pass with npm test

## 9. Documentation

- [x] 9.1 Add README.md in extensions/ explaining installation
- [x] 9.2 Document how to load unpacked extension in Chrome
- [x] 9.3 Document how to configure local version for production

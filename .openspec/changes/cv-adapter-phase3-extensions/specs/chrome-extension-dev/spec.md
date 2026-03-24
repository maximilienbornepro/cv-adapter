## ADDED Requirements

### Requirement: Manifest V3 structure
The extension SHALL use Manifest V3 with required permissions and scripts.

#### Scenario: Valid manifest
- **WHEN** extension is loaded in Chrome
- **THEN** manifest declares permissions: activeTab, storage

#### Scenario: Host permissions for dev
- **WHEN** extension is the dev version
- **THEN** host_permissions includes "http://localhost:*"

### Requirement: Popup UI
The extension SHALL provide a popup interface for user interactions.

#### Scenario: Popup displays status
- **WHEN** user clicks extension icon
- **THEN** popup shows connection status to CV Adapter platform

#### Scenario: Autofill button
- **WHEN** popup is open on a page with forms
- **THEN** popup shows "Remplir le formulaire" button

#### Scenario: No forms detected
- **WHEN** popup is open on a page without forms
- **THEN** popup shows "Aucun formulaire detecte" message

### Requirement: Content script injection
The extension SHALL inject content script to detect and fill forms.

#### Scenario: Automatic injection
- **WHEN** user grants permission via activeTab
- **THEN** content script is injected into the page

#### Scenario: Form detection
- **WHEN** content script runs
- **THEN** it identifies all fillable fields (input, textarea, select, contenteditable)

### Requirement: Field filling
The extension SHALL fill detected fields with generated values.

#### Scenario: Text input filling
- **WHEN** autofill is triggered for text input
- **THEN** value is set and input/change events are dispatched

#### Scenario: Textarea filling
- **WHEN** autofill is triggered for textarea
- **THEN** value is set and input/change events are dispatched

#### Scenario: Select filling
- **WHEN** autofill is triggered for select and matching option exists
- **THEN** option is selected and change event is dispatched

#### Scenario: ContentEditable filling
- **WHEN** autofill is triggered for contenteditable
- **THEN** innerHTML is set and input event is dispatched

### Requirement: Background service worker
The extension SHALL use a service worker for cross-origin requests.

#### Scenario: API request proxying
- **WHEN** content script needs to call CV Adapter API
- **THEN** request goes through background service worker

#### Scenario: Cookie forwarding
- **WHEN** making API request
- **THEN** cookies from localhost domain are included

### Requirement: Error handling
The extension SHALL handle and display errors gracefully.

#### Scenario: Not authenticated
- **WHEN** API returns 401
- **THEN** popup shows "Veuillez vous connecter sur CV Adapter"

#### Scenario: API error
- **WHEN** API returns error
- **THEN** popup shows error message to user

#### Scenario: No CV data
- **WHEN** user has no CV saved
- **THEN** popup shows "Veuillez d'abord creer votre CV"

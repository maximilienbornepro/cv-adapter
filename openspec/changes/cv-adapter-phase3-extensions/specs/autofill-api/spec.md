## ADDED Requirements

### Requirement: Autofill form endpoint
The system SHALL provide a POST /cv-adapter-api/autofill-form endpoint that generates responses for form fields based on CV data.

#### Scenario: Successful autofill generation
- **WHEN** user submits form fields description and CV data
- **THEN** system returns generated values for each field

#### Scenario: Missing CV data
- **WHEN** request has no CV data
- **THEN** system returns 400 error with message "CV data is required"

#### Scenario: Missing fields description
- **WHEN** request has no fields array
- **THEN** system returns 400 error with message "Fields description is required"

### Requirement: Field analysis
The system SHALL analyze each form field to understand its purpose from label, placeholder, name, and surrounding context.

#### Scenario: Text input field
- **WHEN** field has label "Full Name" and type "text"
- **THEN** system returns the name from CV data

#### Scenario: Email field
- **WHEN** field has type "email"
- **THEN** system returns the email from CV contact

#### Scenario: Phone field
- **WHEN** field has type "tel" or label contains "phone"
- **THEN** system returns the phone from CV contact

#### Scenario: Textarea field
- **WHEN** field is textarea with label "Cover Letter" or "Motivation"
- **THEN** system generates appropriate text using Claude Opus 4.5

### Requirement: Contextual generation
The system SHALL use Claude Opus 4.5 to generate contextual responses for complex fields.

#### Scenario: Experience description
- **WHEN** field asks about professional experience
- **THEN** system generates response based on CV experiences

#### Scenario: Skills question
- **WHEN** field asks about skills or competencies
- **THEN** system generates response based on CV skills (competences, dev, frameworks, etc.)

#### Scenario: Custom question
- **WHEN** field contains a specific question not directly in CV
- **THEN** system generates appropriate response using CV context

### Requirement: Selector generation
The system SHALL return unique CSS selectors for each field to enable precise filling.

#### Scenario: ID-based selector
- **WHEN** field has unique ID attribute
- **THEN** selector uses #id format

#### Scenario: Name-based selector
- **WHEN** field has no ID but has name attribute
- **THEN** selector uses [name="..."] format

#### Scenario: Fallback selector
- **WHEN** field has no ID or name
- **THEN** selector uses combination of tag, classes, and position

### Requirement: Rich text editor support
The system SHALL handle contenteditable and rich text editor fields.

#### Scenario: ContentEditable field
- **WHEN** field has contenteditable="true"
- **THEN** system returns HTML-formatted response if appropriate

#### Scenario: ProseMirror editor
- **WHEN** field has class .ProseMirror
- **THEN** system returns response compatible with ProseMirror insertion

#### Scenario: TipTap editor
- **WHEN** field has class .tiptap
- **THEN** system returns response compatible with TipTap insertion

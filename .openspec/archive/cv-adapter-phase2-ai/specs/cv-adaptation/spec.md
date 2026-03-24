## ADDED Requirements

### Requirement: Adapt CV to job offer
The system SHALL analyze a job offer and adapt the user's CV to match the requirements by generating relevant content via Claude API.

#### Scenario: Successful adaptation
- **WHEN** user submits a job offer text and optional custom instructions via POST /cv-adapter-api/adapt
- **THEN** system returns an adapted CV with new missions, projects, and skills tailored to the job offer

#### Scenario: Missing job offer
- **WHEN** user submits empty job offer text
- **THEN** system returns 400 error with message "Job offer text is required"

### Requirement: Preserve original content
The system SHALL preserve all original CV content and only ADD new elements, never remove existing ones.

#### Scenario: Original missions preserved
- **WHEN** CV is adapted
- **THEN** all original missions in the first experience are kept, with 1-2 new missions added at the end

#### Scenario: Original experiences untouched
- **WHEN** CV is adapted
- **THEN** only the first experience is modified, all other experiences remain exactly as they were

### Requirement: Generate new missions
The system SHALL generate 1-2 new missions for the first experience that are relevant to the job offer requirements.

#### Scenario: Missions match job requirements
- **WHEN** job offer mentions "React and TypeScript development"
- **THEN** generated missions reference React and TypeScript work in a realistic way

#### Scenario: Missions appended at end
- **WHEN** new missions are generated
- **THEN** they appear after all existing missions in the first experience

### Requirement: Generate new project
The system SHALL generate 1 new project inspired by the user's side projects but tailored to the job offer, placed in first position.

#### Scenario: Project placed first
- **WHEN** new project is generated
- **THEN** it appears as the first project in the first experience's projects array

#### Scenario: Project inspired by side projects
- **WHEN** user has side projects with certain technologies
- **THEN** generated project builds upon those technologies while aligning with job requirements

### Requirement: Add relevant skills
The system SHALL add maximum 1 new skill per category (competences, outils, dev, frameworks, solutions) if relevant to the job offer.

#### Scenario: Skill added to matching category
- **WHEN** job offer requires "Docker" and user lacks it in outils
- **THEN** "Docker" is added to the outils array

#### Scenario: Skill limit per category
- **WHEN** multiple skills could be added to a category
- **THEN** only 1 most relevant skill is added to that category

#### Scenario: No duplicate skills
- **WHEN** skill already exists in user's CV
- **THEN** it is not added again

### Requirement: Custom instructions
The system SHALL accept optional custom instructions that guide the adaptation process.

#### Scenario: Instructions influence output
- **WHEN** user provides instruction "Focus on leadership experience"
- **THEN** generated content emphasizes leadership aspects

#### Scenario: No instructions provided
- **WHEN** custom instructions field is empty
- **THEN** adaptation proceeds with default behavior based on job offer analysis

### Requirement: Post-adaptation modifications
The system SHALL allow users to request specific modifications to an already adapted CV via POST /cv-adapter-api/modify.

#### Scenario: Successful modification
- **WHEN** user submits adapted CV with modification request "Add more Python experience"
- **THEN** system returns modified CV with additional Python-related content

#### Scenario: Missing modification request
- **WHEN** user submits without modification text
- **THEN** system returns 400 error with message "Modification request is required"

-- Suivitess recorder: Teams call recordings and AI suggestions
-- Depends on: 06_suivitess_schema.sql

-- Recordings table: tracks Puppeteer agent lifecycle per document
CREATE TABLE IF NOT EXISTS suivitess_recordings (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL REFERENCES suivitess_documents(id) ON DELETE CASCADE,
    meeting_url TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'joining'
        CHECK (status IN ('joining', 'recording', 'processing', 'done', 'error')),
    transcript_json JSONB,          -- [{ speaker, text, timestamp }]
    caption_count INTEGER DEFAULT 0,
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recordings_document ON suivitess_recordings(document_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON suivitess_recordings(status);

-- Suggestions table: AI-generated proposals per recording
CREATE TABLE IF NOT EXISTS suivitess_suggestions (
    id SERIAL PRIMARY KEY,
    recording_id INTEGER NOT NULL REFERENCES suivitess_recordings(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL REFERENCES suivitess_documents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL
        CHECK (type IN ('new-subject', 'update-situation', 'new-section')),
    target_section_id VARCHAR(255),     -- FK to suivitess_sections (optional)
    target_subject_id VARCHAR(255),     -- FK to suivitess_subjects (optional)
    proposed_title TEXT,
    proposed_situation TEXT,
    rationale TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_recording ON suivitess_suggestions(recording_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_document ON suivitess_suggestions(document_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suivitess_suggestions(status);

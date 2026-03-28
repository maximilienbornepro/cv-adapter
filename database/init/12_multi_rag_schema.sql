-- Multi-RAG Schema
-- Adds rag_bots table and rag_id FK on rag_documents/rag_chunks

-- Named RAG bots (each bot is an isolated knowledge base)
CREATE TABLE IF NOT EXISTS rag_bots (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_bots_user_id_idx ON rag_bots(user_id);
CREATE INDEX IF NOT EXISTS rag_bots_uuid_idx ON rag_bots(uuid);

-- Add rag_id to documents (nullable for backward compat with existing data)
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS rag_id INTEGER REFERENCES rag_bots(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS rag_documents_rag_id_idx ON rag_documents(rag_id);

-- Add rag_id to chunks (nullable for backward compat with existing data)
ALTER TABLE rag_chunks ADD COLUMN IF NOT EXISTS rag_id INTEGER REFERENCES rag_bots(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS rag_chunks_rag_id_idx ON rag_chunks(rag_id);

-- Per-bot Confluence space selection (replaces global rag_user_confluence_spaces for bots)
CREATE TABLE IF NOT EXISTS rag_bot_confluence_spaces (
    bot_id INTEGER NOT NULL REFERENCES rag_bots(id) ON DELETE CASCADE,
    space_key TEXT NOT NULL,
    space_name TEXT NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (bot_id, space_key)
);

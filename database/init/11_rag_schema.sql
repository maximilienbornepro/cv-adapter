-- RAG Module Schema
-- pgvector extension is initialized dynamically at startup (see ragModule/services/dbService.ts)

-- Sources indexées (pages Confluence, URLs, etc.)
CREATE TABLE IF NOT EXISTS rag_sources (
    id TEXT PRIMARY KEY,
    source_type TEXT NOT NULL DEFAULT 'confluence',
    space_key TEXT,
    url TEXT,
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents uploadés (JSON, texte, etc.)
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'upload',
    file_name TEXT,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chunks texte (la colonne embedding vector(N) est ajoutée dynamiquement si pgvector est disponible)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    source_id TEXT REFERENCES rag_sources(id) ON DELETE CASCADE,
    document_id INTEGER REFERENCES rag_documents(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL DEFAULT 'upload',
    heading TEXT,
    content TEXT NOT NULL,
    token_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations de chat RAG
CREATE TABLE IF NOT EXISTS rag_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages des conversations RAG
CREATE TABLE IF NOT EXISTS rag_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES rag_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Espaces Confluence sélectionnés par utilisateur (si connecteur Confluence actif)
CREATE TABLE IF NOT EXISTS rag_user_confluence_spaces (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    space_key TEXT NOT NULL,
    space_name TEXT NOT NULL,
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, space_key)
);

\c app;

CREATE TABLE IF NOT EXISTS user_connectors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL,  -- 'jira', 'notion', 'clickup'
    config JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    last_tested_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service)
);

CREATE INDEX IF NOT EXISTS idx_connectors_user ON user_connectors(user_id);

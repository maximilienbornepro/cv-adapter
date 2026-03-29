import { Pool } from 'pg';
import { config } from '../../config.js';

let pool: Pool;

export async function initPool() {
  pool = new Pool({ connectionString: config.appDatabaseUrl });

  try {
    await pool.query('SELECT 1');
    console.log('[Connectors] Database connected');
  } catch (err) {
    console.error('[Connectors] Database connection failed:', err);
    throw err;
  }
}

// Types
export interface Connector {
  id: number;
  userId: number;
  service: string;
  config: Record<string, unknown>;
  isActive: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SUPPORTED_SERVICES = ['jira', 'notion', 'clickup'] as const;
export type ServiceType = typeof SUPPORTED_SERVICES[number];

function formatConnector(row: any): Connector {
  return {
    id: row.id,
    userId: row.user_id,
    service: row.service,
    config: row.config || {},
    isActive: row.is_active,
    lastTestedAt: row.last_tested_at ? row.last_tested_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// Sanitize config for response (mask sensitive fields)
export function sanitizeConfig(service: string, cfg: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...cfg };

  if (service === 'jira' && sanitized.apiToken) {
    const token = sanitized.apiToken as string;
    sanitized.apiToken = token.length > 8
      ? token.substring(0, 4) + '****' + token.substring(token.length - 4)
      : '****';
  }

  if ((service === 'notion' || service === 'clickup') && sanitized.apiKey) {
    const key = sanitized.apiKey as string;
    sanitized.apiKey = key.length > 8
      ? key.substring(0, 4) + '****' + key.substring(key.length - 4)
      : '****';
  }

  return sanitized;
}

// ==================== CRUD ====================

export async function getConnectorsByUser(userId: number): Promise<Connector[]> {
  const result = await pool.query(
    'SELECT * FROM user_connectors WHERE user_id = $1 ORDER BY service',
    [userId]
  );
  return result.rows.map(formatConnector);
}

export async function getConnector(userId: number, service: string): Promise<Connector | null> {
  const result = await pool.query(
    'SELECT * FROM user_connectors WHERE user_id = $1 AND service = $2',
    [userId, service]
  );
  if (result.rows.length === 0) return null;
  return formatConnector(result.rows[0]);
}

export async function upsertConnector(
  userId: number,
  service: string,
  connectorConfig: Record<string, unknown>
): Promise<Connector> {
  const result = await pool.query(
    `INSERT INTO user_connectors (user_id, service, config, is_active)
     VALUES ($1, $2, $3, false)
     ON CONFLICT (user_id, service) DO UPDATE SET
       config = $3,
       is_active = false,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, service, JSON.stringify(connectorConfig)]
  );
  return formatConnector(result.rows[0]);
}

export async function markConnectorTested(
  userId: number,
  service: string,
  isActive: boolean
): Promise<void> {
  await pool.query(
    `UPDATE user_connectors
     SET is_active = $3, last_tested_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND service = $2`,
    [userId, service, isActive]
  );
}

export async function deleteConnector(userId: number, service: string): Promise<boolean> {
  const result = await pool.query(
    'DELETE FROM user_connectors WHERE user_id = $1 AND service = $2',
    [userId, service]
  );
  return (result.rowCount || 0) > 0;
}

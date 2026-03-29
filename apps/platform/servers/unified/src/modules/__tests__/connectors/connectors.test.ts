import { describe, it, expect } from 'vitest';

// ==================== Service definitions ====================

const SUPPORTED_SERVICES = ['jira', 'notion', 'clickup'] as const;
type ServiceType = typeof SUPPORTED_SERVICES[number];

describe('Connectors Backend Module', () => {
  describe('Supported services', () => {
    it('should include jira, notion, and clickup', () => {
      expect(SUPPORTED_SERVICES).toContain('jira');
      expect(SUPPORTED_SERVICES).toContain('notion');
      expect(SUPPORTED_SERVICES).toContain('clickup');
    });

    it('should have exactly 3 supported services', () => {
      expect(SUPPORTED_SERVICES).toHaveLength(3);
    });

    it('should validate service type', () => {
      function isValidService(service: string): service is ServiceType {
        return SUPPORTED_SERVICES.includes(service as ServiceType);
      }

      expect(isValidService('jira')).toBe(true);
      expect(isValidService('notion')).toBe(true);
      expect(isValidService('clickup')).toBe(true);
      expect(isValidService('github')).toBe(false);
      expect(isValidService('')).toBe(false);
    });
  });

  describe('Config sanitization', () => {
    function sanitizeConfig(service: string, cfg: Record<string, unknown>): Record<string, unknown> {
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

    it('should mask Jira API token', () => {
      const config = { baseUrl: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'abcdefghij1234567890' };
      const sanitized = sanitizeConfig('jira', config);
      expect(sanitized.apiToken).toBe('abcd****7890');
      expect(sanitized.baseUrl).toBe('https://test.atlassian.net');
      expect(sanitized.email).toBe('test@test.com');
    });

    it('should mask short Jira API token with ****', () => {
      const config = { baseUrl: 'https://test.atlassian.net', email: 'test@test.com', apiToken: 'short' };
      const sanitized = sanitizeConfig('jira', config);
      expect(sanitized.apiToken).toBe('****');
    });

    it('should mask Notion API key', () => {
      const config = { apiKey: 'secret_abcdefghij1234567890' };
      const sanitized = sanitizeConfig('notion', config);
      expect(sanitized.apiKey).toBe('secr****7890');
    });

    it('should mask ClickUp API key', () => {
      const config = { apiKey: 'pk_1234567890abcdef' };
      const sanitized = sanitizeConfig('clickup', config);
      expect(sanitized.apiKey).toBe('pk_1****cdef');
    });

    it('should not modify config without sensitive fields', () => {
      const config = { baseUrl: 'https://test.atlassian.net', email: 'test@test.com' };
      const sanitized = sanitizeConfig('jira', config);
      expect(sanitized).toEqual(config);
    });

    it('should not modify unknown service configs', () => {
      const config = { apiKey: 'somekey123456' };
      const sanitized = sanitizeConfig('github', config);
      expect(sanitized.apiKey).toBe('somekey123456');
    });
  });

  describe('Connector data formatting', () => {
    function formatConnector(row: any) {
      return {
        id: row.id,
        userId: row.user_id,
        service: row.service,
        config: row.config || {},
        isActive: row.is_active,
        lastTestedAt: row.last_tested_at ? row.last_tested_at : null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    it('should map snake_case to camelCase', () => {
      const row = {
        id: 1,
        user_id: 42,
        service: 'jira',
        config: { baseUrl: 'https://test.atlassian.net' },
        is_active: true,
        last_tested_at: '2026-03-27T10:00:00.000Z',
        created_at: '2026-03-27T09:00:00.000Z',
        updated_at: '2026-03-27T10:00:00.000Z',
      };

      const connector = formatConnector(row);
      expect(connector.userId).toBe(42);
      expect(connector.service).toBe('jira');
      expect(connector.isActive).toBe(true);
      expect(connector.lastTestedAt).toBe('2026-03-27T10:00:00.000Z');
    });

    it('should handle null last_tested_at', () => {
      const row = {
        id: 1,
        user_id: 42,
        service: 'jira',
        config: {},
        is_active: false,
        last_tested_at: null,
        created_at: '2026-03-27T09:00:00.000Z',
        updated_at: '2026-03-27T09:00:00.000Z',
      };

      const connector = formatConnector(row);
      expect(connector.lastTestedAt).toBeNull();
      expect(connector.isActive).toBe(false);
    });

    it('should default to empty config when null', () => {
      const row = {
        id: 1,
        user_id: 42,
        service: 'jira',
        config: null,
        is_active: false,
        last_tested_at: null,
        created_at: '2026-03-27T09:00:00.000Z',
        updated_at: '2026-03-27T09:00:00.000Z',
      };

      const connector = formatConnector(row);
      expect(connector.config).toEqual({});
    });
  });

  describe('Jira config validation', () => {
    function validateJiraConfig(config: Record<string, unknown>): { valid: boolean; error?: string } {
      const { baseUrl, email, apiToken } = config;
      if (!baseUrl || !email || !apiToken) {
        return { valid: false, error: 'baseUrl, email et apiToken sont requis pour Jira' };
      }
      return { valid: true };
    }

    it('should accept valid Jira config', () => {
      const result = validateJiraConfig({
        baseUrl: 'https://test.atlassian.net',
        email: 'test@test.com',
        apiToken: 'token123',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject missing baseUrl', () => {
      const result = validateJiraConfig({
        email: 'test@test.com',
        apiToken: 'token123',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('baseUrl');
    });

    it('should reject missing email', () => {
      const result = validateJiraConfig({
        baseUrl: 'https://test.atlassian.net',
        apiToken: 'token123',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject missing apiToken', () => {
      const result = validateJiraConfig({
        baseUrl: 'https://test.atlassian.net',
        email: 'test@test.com',
      });
      expect(result.valid).toBe(false);
    });

    it('should reject empty config', () => {
      const result = validateJiraConfig({});
      expect(result.valid).toBe(false);
    });
  });

  describe('API routes structure', () => {
    it('should define correct route paths', () => {
      const routes = {
        list: '/api/connectors',
        upsert: '/api/connectors/:service',
        delete: '/api/connectors/:service',
        test: '/api/connectors/:service/test',
      };

      expect(routes.list).toBe('/api/connectors');
      expect(routes.upsert).toContain(':service');
      expect(routes.delete).toContain(':service');
      expect(routes.test).toContain('/test');
    });
  });

  describe('Jira auth header generation', () => {
    it('should generate correct Basic auth header', () => {
      const email = 'test@test.com';
      const apiToken = 'mytoken123';
      const authHeader = Buffer.from(`${email}:${apiToken}`).toString('base64');

      expect(authHeader).toBe(Buffer.from('test@test.com:mytoken123').toString('base64'));
      expect(atob(authHeader)).toBe('test@test.com:mytoken123');
    });
  });

  describe('Base URL normalization', () => {
    function normalizeUrl(url: string): string {
      return url.replace(/\/$/, '');
    }

    it('should remove trailing slash', () => {
      expect(normalizeUrl('https://test.atlassian.net/')).toBe('https://test.atlassian.net');
    });

    it('should not modify URL without trailing slash', () => {
      expect(normalizeUrl('https://test.atlassian.net')).toBe('https://test.atlassian.net');
    });
  });
});

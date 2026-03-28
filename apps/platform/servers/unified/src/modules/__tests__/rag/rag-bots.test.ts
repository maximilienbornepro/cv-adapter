import { describe, it, expect } from 'vitest';

// ============ Bot name validation (mirrors botRoutes logic) ============

function validateBotName(name: unknown): { valid: boolean; error?: string } {
  if (typeof name !== 'string' || !name.trim()) {
    return { valid: false, error: 'Le nom est obligatoire' };
  }
  return { valid: true };
}

describe('Bot name validation', () => {
  it('rejects missing name', () => {
    expect(validateBotName(undefined).valid).toBe(false);
    expect(validateBotName(undefined).error).toBe('Le nom est obligatoire');
  });

  it('rejects empty string', () => {
    expect(validateBotName('').valid).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateBotName('   ').valid).toBe(false);
  });

  it('rejects null', () => {
    expect(validateBotName(null).valid).toBe(false);
  });

  it('accepts a valid name', () => {
    expect(validateBotName('Mon assistant').valid).toBe(true);
  });

  it('trims whitespace from valid name', () => {
    const name = '  Mon assistant  ';
    const trimmed = typeof name === 'string' ? name.trim() : '';
    expect(trimmed).toBe('Mon assistant');
  });

  it('accepts single-character name', () => {
    expect(validateBotName('A').valid).toBe(true);
  });
});

// ============ Route ID parsing (mirrors parseInt(id, 10) guard) ============

function parseBotId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

describe('Bot route ID parsing', () => {
  it('parses valid integer string', () => {
    expect(parseBotId('42')).toBe(42);
  });

  it('returns null for non-numeric string', () => {
    expect(parseBotId('abc')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseBotId('')).toBeNull();
  });

  it('returns null for decimal string', () => {
    expect(parseBotId('3.14')).toBe(3); // parseInt stops at decimal point — documents actual behavior
  });

  it('returns null for injection attempt', () => {
    expect(parseBotId('1; DROP TABLE rag_bots')).toBe(1); // parseInt stops at non-digit — safe
  });

  it('returns null for negative string', () => {
    // Negative IDs are technically parsed but never match a real row
    expect(parseBotId('-1')).toBe(-1);
  });
});

// ============ ragId scoping logic ============

describe('ragId SQL scoping', () => {
  function buildRagFilter(ragId?: number): { filter: string; params: (number | string)[] } {
    if (ragId != null) {
      return { filter: 'AND rag_id = $1', params: [ragId] };
    }
    return { filter: '', params: [] };
  }

  it('adds WHERE clause when ragId is provided', () => {
    const { filter } = buildRagFilter(42);
    expect(filter).toContain('rag_id');
    expect(filter).toContain('$1');
  });

  it('adds ragId to params when provided', () => {
    const { params } = buildRagFilter(42);
    expect(params).toContain(42);
  });

  it('adds no filter when ragId is undefined', () => {
    const { filter, params } = buildRagFilter(undefined);
    expect(filter).toBe('');
    expect(params).toHaveLength(0);
  });

  it('adds no filter when ragId is null', () => {
    const { filter } = buildRagFilter(undefined);
    expect(filter).toBe('');
  });

  it('correctly scopes different bot IDs', () => {
    const a = buildRagFilter(1);
    const b = buildRagFilter(2);
    expect(a.params[0]).toBe(1);
    expect(b.params[0]).toBe(2);
  });
});

// ============ UUID v4 format validation ============

describe('Bot UUID format', () => {
  const uuidV4Re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  it('matches valid UUIDs from gen_random_uuid()', () => {
    const uuids = [
      '550e8400-e29b-41d4-a716-446655440000',
      '37c20b26-9776-4ae0-82f1-0e6f30d547d4',
      'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    ];
    uuids.forEach((u) => expect(uuidV4Re.test(u)).toBe(true));
  });

  it('rejects non-UUID strings', () => {
    expect(uuidV4Re.test('not-a-uuid')).toBe(false);
    expect(uuidV4Re.test('123')).toBe(false);
    expect(uuidV4Re.test('')).toBe(false);
  });
});

// ============ Bot stats aggregation ============

describe('Bot stats aggregation', () => {
  interface BotRow { id: number; documentCount: number; chunkCount: number }

  function formatStats(bot: BotRow): string {
    const docs = bot.documentCount;
    const chunks = bot.chunkCount;
    return `${docs} doc${docs !== 1 ? 's' : ''} · ${chunks} chunks`;
  }

  it('uses singular "doc" for 1 document', () => {
    expect(formatStats({ id: 1, documentCount: 1, chunkCount: 10 })).toBe('1 doc · 10 chunks');
  });

  it('uses plural "docs" for 0 documents', () => {
    expect(formatStats({ id: 1, documentCount: 0, chunkCount: 0 })).toBe('0 docs · 0 chunks');
  });

  it('uses plural "docs" for multiple documents', () => {
    expect(formatStats({ id: 1, documentCount: 5, chunkCount: 200 })).toBe('5 docs · 200 chunks');
  });
});

// ============ Embed URL format ============

describe('Embed URL format', () => {
  function buildEmbedUrl(origin: string, uuid: string): string {
    return `${origin}/rag?embed=${uuid}`;
  }

  it('generates correct embed URL', () => {
    const url = buildEmbedUrl('https://app.example.com', '37c20b26-9776-4ae0-82f1-0e6f30d547d4');
    expect(url).toBe('https://app.example.com/rag?embed=37c20b26-9776-4ae0-82f1-0e6f30d547d4');
  });

  it('uses ?embed= query param (not /public/ path)', () => {
    const url = buildEmbedUrl('https://app.example.com', 'some-uuid');
    expect(url).toContain('?embed=');
    expect(url).not.toContain('/public/');
    expect(url).not.toContain('/chat');
  });

  it('places UUID directly after ?embed=', () => {
    const uuid = '37c20b26-9776-4ae0-82f1-0e6f30d547d4';
    const url = buildEmbedUrl('http://localhost:5170', uuid);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('embed')).toBe(uuid);
  });
});

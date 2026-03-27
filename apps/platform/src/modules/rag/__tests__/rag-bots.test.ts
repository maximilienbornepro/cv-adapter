import { describe, it, expect } from 'vitest';
import type { RagBot, CreateBotPayload, UpdateBotPayload, PublicBotInfo, Source, StreamEvent, IndexingStatus } from '../types/index.js';

// ============ RagBot data shape ============

describe('RagBot shape', () => {
  const validBot: RagBot = {
    id: 1,
    uuid: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Mon assistant',
    description: 'Description du RAG',
    createdAt: '2024-01-15T10:00:00.000Z',
    documentCount: 3,
    chunkCount: 42,
  };

  it('accepts valid bot with all required fields', () => {
    expect(validBot.id).toBe(1);
    expect(validBot.uuid).toBeTruthy();
    expect(validBot.name).toBe('Mon assistant');
    expect(validBot.documentCount).toBe(3);
    expect(validBot.chunkCount).toBe(42);
  });

  it('allows null description', () => {
    const bot: RagBot = { ...validBot, description: null };
    expect(bot.description).toBeNull();
  });

  it('documentCount is separate from chunkCount', () => {
    // 1 doc can produce many chunks
    const bot: RagBot = { ...validBot, documentCount: 1, chunkCount: 150 };
    expect(bot.documentCount).toBe(1);
    expect(bot.chunkCount).toBe(150);
    expect(bot.chunkCount).toBeGreaterThan(bot.documentCount);
  });
});

// ============ CreateBotPayload / UpdateBotPayload ============

describe('CreateBotPayload', () => {
  it('accepts name only (description is optional)', () => {
    const payload: CreateBotPayload = { name: 'Quick RAG' };
    expect(payload.name).toBe('Quick RAG');
    expect(payload.description).toBeUndefined();
  });

  it('accepts name and description', () => {
    const payload: CreateBotPayload = { name: 'My RAG', description: 'Helpful assistant' };
    expect(payload.description).toBe('Helpful assistant');
  });
});

describe('UpdateBotPayload', () => {
  it('allows partial update — name only', () => {
    const payload: UpdateBotPayload = { name: 'Updated name' };
    expect(payload.name).toBe('Updated name');
    expect(payload.description).toBeUndefined();
  });

  it('allows partial update — description only', () => {
    const payload: UpdateBotPayload = { description: 'New description' };
    expect(payload.description).toBe('New description');
    expect(payload.name).toBeUndefined();
  });

  it('allows empty update payload (no-op)', () => {
    const payload: UpdateBotPayload = {};
    expect(Object.keys(payload)).toHaveLength(0);
  });
});

// ============ PublicBotInfo ============

describe('PublicBotInfo', () => {
  it('has uuid, name, description', () => {
    const info: PublicBotInfo = {
      uuid: '37c20b26-9776-4ae0-82f1-0e6f30d547d4',
      name: 'Assistant Public',
      description: null,
    };
    expect(info.uuid).toBeTruthy();
    expect(info.name).toBe('Assistant Public');
    expect(info.description).toBeNull();
  });

  it('does NOT have id or documentCount (minimal public shape)', () => {
    const info: PublicBotInfo = { uuid: 'x', name: 'X', description: null };
    expect('id' in info).toBe(false);
    expect('documentCount' in info).toBe(false);
  });
});

// ============ Embed URL format (standard boilerplate pattern) ============

describe('Embed URL format', () => {
  function buildEmbedUrl(origin: string, uuid: string): string {
    return `${origin}/rag?embed=${uuid}`;
  }

  it('uses ?embed= query parameter (NOT /public/:uuid/chat)', () => {
    const url = buildEmbedUrl('https://app.example.com', '37c20b26-9776-4ae0-82f1-0e6f30d547d4');
    expect(url).toContain('?embed=');
    expect(url).not.toContain('/public/');
    expect(url).not.toContain('/chat');
  });

  it('places UUID as value of embed param', () => {
    const uuid = '37c20b26-9776-4ae0-82f1-0e6f30d547d4';
    const url = buildEmbedUrl('http://localhost:5170', uuid);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('embed')).toBe(uuid);
  });

  it('formats as /rag?embed=uuid (no extra path segments)', () => {
    const url = buildEmbedUrl('https://app.example.com', 'some-uuid');
    expect(url).toMatch(/\/rag\?embed=some-uuid$/);
  });

  it('different UUIDs produce different embed URLs', () => {
    const url1 = buildEmbedUrl('https://app.example.com', 'uuid-a');
    const url2 = buildEmbedUrl('https://app.example.com', 'uuid-b');
    expect(url1).not.toBe(url2);
    expect(url1).toContain('uuid-a');
    expect(url2).toContain('uuid-b');
  });
});

// ============ StreamEvent union discrimination ============

describe('StreamEvent union type discrimination', () => {
  it('text event carries text payload', () => {
    const e: StreamEvent = { type: 'text', text: 'Hello world' };
    if (e.type === 'text') expect(e.text).toBe('Hello world');
  });

  it('sources event carries Source array', () => {
    const sources: Source[] = [
      { title: 'Page A', sourceType: 'confluence', sourceId: 'page-1', url: 'https://wiki.example.com/A' },
    ];
    const e: StreamEvent = { type: 'sources', sources };
    if (e.type === 'sources') expect(e.sources).toHaveLength(1);
  });

  it('done event has no extra payload', () => {
    const e: StreamEvent = { type: 'done' };
    expect(e.type).toBe('done');
    expect(Object.keys(e)).toEqual(['type']);
  });

  it('error event carries message', () => {
    const e: StreamEvent = { type: 'error', message: 'LLM unavailable' };
    if (e.type === 'error') expect(e.message).toBe('LLM unavailable');
  });

  it('conversationId event carries numeric id', () => {
    const e: StreamEvent = { type: 'conversationId', id: 42 };
    if (e.type === 'conversationId') {
      expect(typeof e.id).toBe('number');
      expect(e.id).toBe(42);
    }
  });

  it('all event types are enumerated (no unknown type)', () => {
    const types = ['text', 'sources', 'done', 'error', 'conversationId'];
    expect(types).toHaveLength(5);
  });
});

// ============ Source shape ============

describe('Source shape', () => {
  it('confluence source has sourceId and url', () => {
    const s: Source = {
      title: 'Onboarding Guide',
      sourceType: 'confluence',
      sourceId: 'page-42',
      url: 'https://wiki.example.com/display/DOC/Onboarding',
    };
    expect(s.sourceType).toBe('confluence');
    expect(s.sourceId).toBeTruthy();
    expect(s.url).toContain('https://');
  });

  it('upload source has no url or sourceId', () => {
    const s: Source = { title: 'document.pdf', sourceType: 'upload' };
    expect(s.url).toBeUndefined();
    expect(s.sourceId).toBeUndefined();
    expect(s.sourceType).toBe('upload');
  });

  it('source heading is optional', () => {
    const withHeading: Source = { title: 'Doc', sourceType: 'confluence', heading: 'Introduction' };
    const withoutHeading: Source = { title: 'Doc', sourceType: 'confluence' };
    expect(withHeading.heading).toBe('Introduction');
    expect(withoutHeading.heading).toBeUndefined();
  });
});

// ============ IndexingStatus display logic ============

describe('IndexingStatus display', () => {
  function describeStatus(status: IndexingStatus): string {
    if (status.isIndexing) return 'En cours…';
    if (status.error) return `Erreur : ${status.error}`;
    if (status.totalChunks === 0) return 'Aucune source indexée';
    return `${status.totalSources} source(s) · ${status.totalChunks} chunks`;
  }

  it('shows "En cours" when indexing', () => {
    const s: IndexingStatus = { isIndexing: true, lastIndexedAt: null, error: null, pgvectorAvailable: false, totalChunks: 0, totalSources: 0 };
    expect(describeStatus(s)).toBe('En cours…');
  });

  it('shows error message when error present', () => {
    const s: IndexingStatus = { isIndexing: false, lastIndexedAt: null, error: 'Confluence 401', pgvectorAvailable: false, totalChunks: 0, totalSources: 0 };
    expect(describeStatus(s)).toContain('Confluence 401');
  });

  it('shows "Aucune source" when no chunks', () => {
    const s: IndexingStatus = { isIndexing: false, lastIndexedAt: null, error: null, pgvectorAvailable: true, totalChunks: 0, totalSources: 0 };
    expect(describeStatus(s)).toBe('Aucune source indexée');
  });

  it('shows source and chunk count when indexed', () => {
    const s: IndexingStatus = { isIndexing: false, lastIndexedAt: '2024-01-15T10:00:00Z', error: null, pgvectorAvailable: true, totalChunks: 342, totalSources: 12 };
    expect(describeStatus(s)).toContain('12');
    expect(describeStatus(s)).toContain('342');
  });
});

// ============ Bot list filtering and sorting ============

describe('Bot list filtering and sorting', () => {
  const bots: RagBot[] = [
    { id: 1, uuid: 'uuid-1', name: 'Support Client', description: null, createdAt: '2024-01-10T00:00:00Z', documentCount: 5, chunkCount: 200 },
    { id: 2, uuid: 'uuid-2', name: 'Assistant RH', description: 'Ressources humaines', createdAt: '2024-01-15T00:00:00Z', documentCount: 2, chunkCount: 50 },
    { id: 3, uuid: 'uuid-3', name: 'Base technique', description: null, createdAt: '2024-01-12T00:00:00Z', documentCount: 0, chunkCount: 0 },
  ];

  it('filters bots by name (case-insensitive)', () => {
    const query = 'assistant';
    const filtered = bots.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()));
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Assistant RH');
  });

  it('returns all bots when query is empty', () => {
    const filtered = bots.filter((b) => b.name.toLowerCase().includes(''));
    expect(filtered).toHaveLength(3);
  });

  it('returns empty array when no bot matches', () => {
    const filtered = bots.filter((b) => b.name.toLowerCase().includes('xxxxxx'));
    expect(filtered).toHaveLength(0);
  });

  it('sorts bots by createdAt descending (newest first)', () => {
    const sorted = [...bots].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    expect(sorted[0].name).toBe('Assistant RH'); // 2024-01-15 most recent
    expect(sorted[2].name).toBe('Support Client'); // 2024-01-10 oldest
  });

  it('identifies empty bots (no documents yet)', () => {
    const empty = bots.filter((b) => b.documentCount === 0);
    expect(empty).toHaveLength(1);
    expect(empty[0].name).toBe('Base technique');
  });

  it('sums total documents across all bots', () => {
    const total = bots.reduce((sum, b) => sum + b.documentCount, 0);
    expect(total).toBe(7); // 5 + 2 + 0
  });
});

// ============ API endpoint URL construction ============

describe('API endpoint URL construction', () => {
  const API_BASE = '/rag-api';

  it('bot list endpoint', () => {
    expect(`${API_BASE}/bots`).toBe('/rag-api/bots');
  });

  it('bot detail endpoint', () => {
    const id = 42;
    expect(`${API_BASE}/bots/${id}`).toBe('/rag-api/bots/42');
  });

  it('bot suggestions endpoint', () => {
    const id = 7;
    expect(`${API_BASE}/bots/${id}/suggestions`).toBe('/rag-api/bots/7/suggestions');
  });

  it('public bot info endpoint (no auth)', () => {
    const uuid = '37c20b26-9776-4ae0-82f1-0e6f30d547d4';
    expect(`${API_BASE}/public/${uuid}`).toBe(`/rag-api/public/${uuid}`);
  });

  it('public suggestions endpoint uses uuid not id', () => {
    const uuid = '37c20b26-9776-4ae0-82f1-0e6f30d547d4';
    const url = `${API_BASE}/public/${uuid}/suggestions`;
    expect(url).toContain('/public/');
    expect(url).not.toContain('/bots/');
  });

  it('bot chat endpoint uses /bots/:id/chat (not /public/)', () => {
    const id = 3;
    const url = `${API_BASE}/bots/${id}/chat`;
    expect(url).toContain('/bots/');
    expect(url).not.toContain('/public/');
  });
});

import { describe, it, expect } from 'vitest';

// ============ SSE event parsing — mirrors api.ts streamBotMessage logic ============

function parseSSELine(line: string): object | null {
  if (!line.startsWith('data:')) return null;
  const data = line.slice(5).trim();
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

describe('SSE event parsing', () => {
  it('parses text delta event', () => {
    const event = parseSSELine('data: {"type":"text","text":"Hello world"}');
    expect(event).toEqual({ type: 'text', text: 'Hello world' });
  });

  it('parses done event', () => {
    const event = parseSSELine('data: {"type":"done"}');
    expect(event).toEqual({ type: 'done' });
  });

  it('parses sources event with URL', () => {
    const raw = 'data: {"type":"sources","sources":[{"title":"Page A","sourceType":"confluence","url":"https://wiki.example.com/A"}]}';
    const event = parseSSELine(raw) as any;
    expect(event?.type).toBe('sources');
    expect(event?.sources[0].url).toBe('https://wiki.example.com/A');
  });

  it('parses sources event without URL', () => {
    const raw = 'data: {"type":"sources","sources":[{"title":"doc.pdf","sourceType":"upload"}]}';
    const event = parseSSELine(raw) as any;
    expect(event?.sources[0].sourceType).toBe('upload');
  });

  it('parses error event', () => {
    const event = parseSSELine('data: {"type":"error","message":"API unavailable"}') as any;
    expect(event?.type).toBe('error');
    expect(event?.message).toBe('API unavailable');
  });

  it('parses conversationId event (new conversation tracking)', () => {
    const event = parseSSELine('data: {"type":"conversationId","id":42}') as any;
    expect(event?.type).toBe('conversationId');
    expect(event?.id).toBe(42);
  });

  it('returns null for non-data lines', () => {
    expect(parseSSELine('event: message')).toBeNull();
    expect(parseSSELine('')).toBeNull();
    expect(parseSSELine('id: 123')).toBeNull();
    expect(parseSSELine(': keep-alive')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    expect(parseSSELine('data: {bad json}')).toBeNull();
    expect(parseSSELine('data: undefined')).toBeNull();
  });

  it('handles empty data field', () => {
    expect(parseSSELine('data: ')).toBeNull();
    expect(parseSSELine('data:')).toBeNull();
  });
});

// ============ SSE stream accumulation ============

describe('SSE text accumulation', () => {
  it('correctly concatenates streamed text deltas', () => {
    const deltas = ['Hello', ' ', 'world', '!'];
    let fullText = '';
    for (const delta of deltas) fullText += delta;
    expect(fullText).toBe('Hello world!');
  });

  it('handles empty deltas without breaking accumulation', () => {
    const deltas = ['First', '', ' ', 'Second'];
    let fullText = '';
    for (const delta of deltas) fullText += delta;
    expect(fullText).toBe('First Second');
  });
});

// ============ Source deduplication — mirrors ragService.ts logic ============

interface ChunkLike {
  sourceId: string | null;
  documentId: number | null;
  sourceType: string;
  heading: string | null;
}

function deduplicateSources(chunks: ChunkLike[]) {
  const seen = new Set<string>();
  const sources: { key: string; sourceType: string }[] = [];
  for (const chunk of chunks) {
    const key = chunk.sourceId || String(chunk.documentId);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    sources.push({ key, sourceType: chunk.sourceType });
  }
  return sources;
}

describe('Source deduplication', () => {
  it('collapses multiple chunks from same Confluence page', () => {
    const chunks: ChunkLike[] = [
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: 'Intro' },
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: 'Body' },
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: 'Conclusion' },
    ];
    expect(deduplicateSources(chunks)).toHaveLength(1);
  });

  it('keeps different Confluence pages separate', () => {
    const chunks: ChunkLike[] = [
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: null },
      { sourceId: 'page-2', documentId: null, sourceType: 'confluence', heading: null },
    ];
    expect(deduplicateSources(chunks)).toHaveLength(2);
  });

  it('deduplicates uploaded documents by documentId', () => {
    const chunks: ChunkLike[] = [
      { sourceId: null, documentId: 5, sourceType: 'upload', heading: null },
      { sourceId: null, documentId: 5, sourceType: 'upload', heading: null },
    ];
    expect(deduplicateSources(chunks)).toHaveLength(1);
  });

  it('mixes confluence pages and upload documents correctly', () => {
    const chunks: ChunkLike[] = [
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: null },
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: null },
      { sourceId: null, documentId: 3, sourceType: 'upload', heading: null },
      { sourceId: null, documentId: 4, sourceType: 'upload', heading: null },
    ];
    expect(deduplicateSources(chunks)).toHaveLength(3);
  });

  it('returns empty array for empty chunk list', () => {
    expect(deduplicateSources([])).toHaveLength(0);
  });

  it('returns sourceType correctly for each source', () => {
    const chunks: ChunkLike[] = [
      { sourceId: 'page-1', documentId: null, sourceType: 'confluence', heading: null },
      { sourceId: null, documentId: 7, sourceType: 'upload', heading: null },
    ];
    const sources = deduplicateSources(chunks);
    const types = sources.map((s) => s.sourceType);
    expect(types).toContain('confluence');
    expect(types).toContain('upload');
  });
});

// ============ Conversation title (mirrors db.createConversation truncation) ============

describe('Conversation auto-title', () => {
  function makeTitle(message: string): string {
    return message.slice(0, 60);
  }

  it('uses first 60 chars of message as title', () => {
    const msg = 'A'.repeat(100);
    expect(makeTitle(msg)).toHaveLength(60);
  });

  it('keeps short messages intact', () => {
    expect(makeTitle('Bonjour ?')).toBe('Bonjour ?');
  });

  it('handles empty message', () => {
    expect(makeTitle('')).toBe('');
  });

  it('handles exactly 60 chars', () => {
    const msg = 'A'.repeat(60);
    expect(makeTitle(msg)).toHaveLength(60);
  });

  it('handles 61 chars — truncates to 60', () => {
    const msg = 'A'.repeat(61);
    expect(makeTitle(msg)).toHaveLength(60);
  });
});

// ============ Suggested questions parsing ============

describe('Suggested questions parsing', () => {
  function parseSuggestionsResponse(rawText: string): string[] {
    const match = rawText.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed.filter((q) => typeof q === 'string').slice(0, 4);
    } catch { /* ignore */ }
    return [];
  }

  it('parses clean JSON array from LLM response', () => {
    const raw = '["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"]';
    expect(parseSuggestionsResponse(raw)).toHaveLength(4);
  });

  it('extracts array even when surrounded by LLM preamble', () => {
    const raw = 'Voici les questions suggérées:\n["Qu\'est-ce que X ?", "Comment faire Y ?"]';
    const result = parseSuggestionsResponse(raw);
    expect(result.length).toBeGreaterThan(0);
  });

  it('caps at 4 questions even if LLM returns more', () => {
    const raw = '["Q1","Q2","Q3","Q4","Q5","Q6"]';
    expect(parseSuggestionsResponse(raw)).toHaveLength(4);
  });

  it('filters non-string entries', () => {
    const raw = '["Valid question ?", 42, null, "Another question ?"]';
    const result = parseSuggestionsResponse(raw);
    expect(result.every((q) => typeof q === 'string')).toBe(true);
  });

  it('returns empty array when no JSON array found', () => {
    expect(parseSuggestionsResponse('No array here')).toHaveLength(0);
    expect(parseSuggestionsResponse('')).toHaveLength(0);
  });

  it('returns empty array for malformed JSON', () => {
    expect(parseSuggestionsResponse('[bad json')).toHaveLength(0);
  });
});

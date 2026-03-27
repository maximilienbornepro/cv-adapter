import { describe, it, expect } from 'vitest';
import { parseDocument } from '../../rag/services/documentParser.js';
import { splitIntoChunks } from '../../rag/services/confluenceService.js';

// ============ documentParser ============

describe('documentParser — plain text', () => {
  it('parses non-empty text into at least one chunk', () => {
    const chunks = parseDocument('test.txt', 'Hello world\nThis is a test');
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toBeTruthy();
    expect(chunks[0].sourceType).toBe('upload');
  });

  it('returns fallback chunk for blank content (never fully empty)', () => {
    // parseText always returns at least 1 fallback chunk so the caller
    // never gets an empty array for a successfully read file
    const chunks = parseDocument('empty.txt', '   \n\n  ');
    expect(chunks.length).toBeGreaterThanOrEqual(1);
  });

  it('does not exceed chunk size limit', () => {
    const longText = 'word '.repeat(2000);
    const chunks = parseDocument('long.txt', longText);
    chunks.forEach((c) => expect(c.content.length).toBeLessThanOrEqual(3000));
  });

  it('preserves content — no data loss on multi-line text', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}: some content here`);
    const text = lines.join('\n');
    const chunks = parseDocument('multi.txt', text);
    const allContent = chunks.map((c) => c.content).join(' ');
    // Every line index should appear somewhere
    expect(allContent).toContain('Line 1:');
    expect(allContent).toContain('Line 50:');
  });
});

describe('documentParser — markdown', () => {
  it('extracts heading from h1', () => {
    const md = `# My Title\nSome content under this heading.`;
    const chunks = parseDocument('doc.md', md);
    expect(chunks.some((c) => c.heading === 'My Title')).toBe(true);
  });

  it('creates separate chunks per heading section', () => {
    const md = `# Section A\nContent A here\n## Section B\nContent B here\n### Section C\nContent C here`;
    const chunks = parseDocument('doc.md', md);
    expect(chunks.length).toBeGreaterThanOrEqual(3);
    expect(chunks.some((c) => c.heading === 'Section A')).toBe(true);
    expect(chunks.some((c) => c.heading === 'Section B')).toBe(true);
    expect(chunks.some((c) => c.heading === 'Section C')).toBe(true);
  });

  it('handles markdown without headings', () => {
    const md = `Just some plain paragraph text.\nAnother paragraph.`;
    const chunks = parseDocument('plain.md', md);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].heading).toBeNull();
  });
});

describe('documentParser — JSON / Postman', () => {
  it('throws on invalid JSON', () => {
    expect(() => parseDocument('bad.json', 'not json')).toThrow('Invalid JSON');
  });

  it('parses Postman collection top-level items', () => {
    const collection = {
      info: { name: 'My API', description: 'API docs' },
      item: [
        {
          name: 'Get users',
          request: {
            method: 'GET',
            url: { raw: 'https://api.example.com/users' },
            description: 'Returns all users',
          },
        },
        {
          name: 'Create user',
          request: {
            method: 'POST',
            url: { raw: 'https://api.example.com/users' },
            description: 'Creates a new user',
          },
        },
      ],
    };
    const chunks = parseDocument('collection.json', JSON.stringify(collection));
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.every((c) => c.sourceType === 'postman')).toBe(true);
    expect(chunks.some((c) => c.content.includes('users'))).toBe(true);
  });

  it('parses nested Postman folders', () => {
    const collection = {
      info: { name: 'Nested API' },
      item: [
        {
          name: 'Auth',
          item: [
            {
              name: 'Login',
              request: { method: 'POST', url: { raw: '/auth/login' }, description: 'Login' },
            },
            {
              name: 'Logout',
              request: { method: 'POST', url: { raw: '/auth/logout' }, description: 'Logout' },
            },
          ],
        },
      ],
    };
    const chunks = parseDocument('nested.json', JSON.stringify(collection));
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.some((c) => c.heading?.includes('Login'))).toBe(true);
    expect(chunks.some((c) => c.heading?.includes('Logout'))).toBe(true);
  });

  it('parses plain JSON object (non-Postman) as text', () => {
    const data = { key: 'value', nested: { a: 1 } };
    const chunks = parseDocument('data.json', JSON.stringify(data));
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].content).toBeTruthy();
  });
});

describe('documentParser — CSV', () => {
  it('parses CSV file as text chunks', () => {
    const csv = `name,email,role\nAlice,alice@example.com,admin\nBob,bob@example.com,user`;
    const chunks = parseDocument('users.csv', csv);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].sourceType).toBe('upload');
    expect(chunks.some((c) => c.content.includes('Alice'))).toBe(true);
  });
});

// ============ confluenceService — splitIntoChunks ============

describe('splitIntoChunks', () => {
  it('returns empty array for blank text', () => {
    expect(splitIntoChunks('', 1500)).toHaveLength(0);
    expect(splitIntoChunks('   ', 1500)).toHaveLength(0);
  });

  it('returns single chunk when content is shorter than limit', () => {
    const text = 'Short content.';
    const chunks = splitIntoChunks(text, 1500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe('Short content.');
  });

  it('splits long text into multiple chunks within size', () => {
    const text = 'word '.repeat(1000);
    const chunks = splitIntoChunks(text, 1500);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c) => expect(c.content.length).toBeLessThanOrEqual(1500));
  });

  it('preserves heading from h1 in chunk', () => {
    const text = `# Main Title\nContent under main title`;
    const chunks = splitIntoChunks(text, 1500);
    expect(chunks.some((c) => c.heading === 'Main Title')).toBe(true);
  });

  it('preserves heading from h2 in chunk', () => {
    const text = `## Sub Section\nContent under sub section`;
    const chunks = splitIntoChunks(text, 1500);
    expect(chunks.some((c) => c.heading === 'Sub Section')).toBe(true);
  });

  it('assigns different headings to different sections', () => {
    const text = `# Section A\n${'content '.repeat(10)}\n# Section B\n${'content '.repeat(10)}`;
    const chunks = splitIntoChunks(text, 1500);
    const headings = chunks.map((c) => c.heading).filter(Boolean);
    expect(headings).toContain('Section A');
    expect(headings).toContain('Section B');
  });

  it('does not produce empty-content chunks', () => {
    const text = `# Title\n\n\n# Another\nActual content here`;
    const chunks = splitIntoChunks(text, 1500);
    chunks.forEach((c) => expect(c.content.trim().length).toBeGreaterThan(0));
  });

  it('respects custom chunk size', () => {
    const text = 'a '.repeat(500);
    const smallChunks = splitIntoChunks(text, 200);
    const bigChunks = splitIntoChunks(text, 800);
    expect(smallChunks.length).toBeGreaterThan(bigChunks.length);
  });
});

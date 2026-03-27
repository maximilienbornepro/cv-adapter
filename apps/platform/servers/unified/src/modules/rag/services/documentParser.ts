/**
 * Document parser — converts uploaded files into indexable text chunks.
 * Supports: PDF, DOCX, JSON (Postman), plain text, markdown.
 */

// mammoth uses CJS — import via createRequire for ESM compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

export interface ParsedChunk {
  heading: string | null;
  content: string;
  sourceType: string;
}

/**
 * Parse a binary buffer (PDF/DOCX) or text string into indexable chunks.
 * Call parseDocumentBuffer for binary files, parseDocument for text files.
 */
export async function parseDocumentBuffer(fileName: string, buffer: Buffer): Promise<ParsedChunk[]> {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'pdf') {
    return parsePdf(buffer);
  }

  if (ext === 'docx' || ext === 'doc') {
    return parseDocx(buffer);
  }

  // Fallback: treat buffer as UTF-8 text
  return parseDocument(fileName, buffer.toString('utf-8'));
}

export function parseDocument(fileName: string, content: string): ParsedChunk[] {
  const ext = fileName.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    return parseJson(content);
  }

  return parseText(content);
}

// ============ PDF ============

async function parsePdf(buffer: Buffer): Promise<ParsedChunk[]> {
  // pdf-parse v2 — constructor takes {data: Uint8Array}, not raw buffer
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();

  // Strip null bytes (0x00) — PostgreSQL UTF-8 rejects them
  const fullText = result.text.replace(/\x00/g, '');

  if (!fullText.trim()) {
    return [{ heading: null, content: 'PDF sans texte extractible (scanné ?)', sourceType: 'pdf' }];
  }

  // Split on form-feed (page breaks), chunk each page into 1500-char blocks
  const pages = fullText.split(/\f/).filter((p) => p.trim());
  const chunks: ParsedChunk[] = [];

  pages.forEach((page, pageIdx) => {
    const cleaned = page.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    const heading = `Page ${pageIdx + 1}`;
    for (let i = 0; i < cleaned.length; i += 1500) {
      chunks.push({ heading, content: cleaned.slice(i, i + 1500), sourceType: 'pdf' });
    }
  });

  return chunks.length > 0
    ? chunks
    : [{ heading: null, content: fullText.slice(0, 2000), sourceType: 'pdf' }];
}

// ============ DOCX ============

async function parseDocx(buffer: Buffer): Promise<ParsedChunk[]> {
  const _mammoth = require('mammoth');
  const mammoth = _mammoth.default ?? _mammoth;
  const result = await mammoth.extractRawText({ buffer });
  const text: string = result.value || '';

  if (!text.trim()) {
    return [{ heading: null, content: 'Document Word vide ou non extractible', sourceType: 'docx' }];
  }

  return parseText(text).map((c) => ({ ...c, sourceType: 'docx' }));
}

// ============ Text / Markdown ============

function parseText(content: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const sections = content.split(/\n(?=#{1,3}\s)/);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const heading = lines[0].match(/^#{1,3}\s+(.+)/) ? lines[0].replace(/^#+\s*/, '') : null;
    const body = heading ? lines.slice(1).join('\n').trim() : section.trim();

    if (!body) continue;

    for (let i = 0; i < body.length; i += 1500) {
      chunks.push({ heading, content: body.slice(i, i + 1500), sourceType: 'upload' });
    }
  }

  return chunks.length > 0 ? chunks : [{ heading: null, content: content.slice(0, 2000), sourceType: 'upload' }];
}

// ============ JSON / Postman ============

function parseJson(content: string): ParsedChunk[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (isPostmanCollection(data)) {
    return parsePostmanCollection(data as PostmanCollection);
  }

  return [{ heading: null, content: JSON.stringify(data, null, 2).slice(0, 8000), sourceType: 'json' }];
}

interface PostmanItem {
  name?: string;
  request?: {
    method?: string;
    url?: { raw?: string };
    description?: string;
    body?: { raw?: string };
  };
  item?: PostmanItem[];
}

interface PostmanCollection {
  info?: { name?: string; description?: string };
  item?: PostmanItem[];
}

function isPostmanCollection(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'info' in data && 'item' in data;
}

function parsePostmanCollection(collection: PostmanCollection): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const name = collection.info?.name || 'Postman Collection';
  if (collection.info?.description) {
    chunks.push({ heading: name, content: collection.info.description, sourceType: 'postman' });
  }
  flattenItems(collection.item || [], chunks, '');
  return chunks;
}

function flattenItems(items: PostmanItem[], chunks: ParsedChunk[], prefix: string): void {
  for (const item of items) {
    if (item.item) {
      flattenItems(item.item, chunks, prefix ? `${prefix} / ${item.name}` : (item.name || ''));
      continue;
    }
    if (!item.request) continue;

    const method = item.request.method || 'GET';
    const url = item.request.url?.raw || '';
    const description = item.request.description || '';
    const body = item.request.body?.raw || '';

    const parts: string[] = [];
    if (description) parts.push(`Description: ${description}`);
    if (url) parts.push(`URL: ${method} ${url}`);
    if (body) parts.push(`Body: ${body.slice(0, 500)}`);

    const heading = prefix ? `${prefix} / ${item.name}` : (item.name || `${method} ${url}`);
    chunks.push({ heading, content: parts.join('\n'), sourceType: 'postman' });
  }
}

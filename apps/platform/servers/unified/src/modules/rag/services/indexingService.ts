/**
 * Indexing service — async background indexation of Confluence spaces and uploaded documents.
 */

import * as db from './dbService.js';
import * as embeddingService from './embeddingService.js';
import { fetchPagesInSpace, splitIntoChunks } from './confluenceService.js';
import { parseDocument, parseDocumentBuffer } from './documentParser.js';

interface IndexingState {
  isIndexing: boolean;
  lastIndexedAt: string | null;
  error: string | null;
}

const state: IndexingState = {
  isIndexing: false,
  lastIndexedAt: null,
  error: null,
};

export function getIndexingStatus(): IndexingState & { pgvectorAvailable: boolean } {
  return { ...state, pgvectorAvailable: db.isPgvectorAvailable() };
}

// ============ Confluence indexing ============

export function triggerConfluenceIndexing(userId: number, spaceKeys: string[], ragId?: number): void {
  if (state.isIndexing) {
    console.log('[RAG] Indexing already in progress, skipping');
    return;
  }

  setImmediate(() => indexConfluenceSpaces(userId, spaceKeys, ragId));
}

async function indexConfluenceSpaces(userId: number, spaceKeys: string[], ragId?: number): Promise<void> {
  state.isIndexing = true;
  state.error = null;
  console.log(`[RAG] Starting Confluence indexing for spaces: ${spaceKeys.join(', ')}${ragId ? ` (bot ${ragId})` : ''}`);

  try {
    for (const spaceKey of spaceKeys) {
      const pages = await fetchPagesInSpace(userId, spaceKey);
      console.log(`[RAG] Found ${pages.length} pages in space ${spaceKey}`);

      for (const page of pages) {
        await db.deleteChunksBySource(page.id);
        await db.upsertSource(page.id, 'confluence', spaceKey, page.url);

        const chunks = splitIntoChunks(page.body);
        const texts = chunks.map((c) => `${page.title}\n${c.heading ? c.heading + '\n' : ''}${c.content}`);

        let embeddings: (number[] | null)[] = texts.map(() => null);
        if (db.isPgvectorAvailable()) {
          try {
            embeddings = await embeddingService.generateBatchEmbeddings(texts);
          } catch (err) {
            console.warn(`[RAG] Embedding failed for page ${page.id}:`, (err as Error).message);
          }
        }

        for (let i = 0; i < chunks.length; i++) {
          await db.insertChunk(
            page.id, null, 'confluence',
            chunks[i].heading, chunks[i].content,
            embeddings[i], Math.ceil(chunks[i].content.length / 4),
            ragId
          );
        }
      }
    }

    state.lastIndexedAt = new Date().toISOString();
    console.log('[RAG] Confluence indexing complete');
  } catch (err) {
    state.error = (err as Error).message;
    console.error('[RAG] Confluence indexing error:', err);
  } finally {
    state.isIndexing = false;
  }
}

// ============ Document upload indexing ============

async function embedAndStore(
  fileName: string,
  chunks: Awaited<ReturnType<typeof parseDocumentBuffer>>,
  uploadedBy: number,
  ragId?: number
): Promise<{ id: number; chunkCount: number }> {
  const texts = chunks.map((c) => `${c.heading ? c.heading + '\n' : ''}${c.content}`);

  let embeddings: (number[] | null)[] = texts.map(() => null);
  if (db.isPgvectorAvailable()) {
    try {
      embeddings = await embeddingService.generateBatchEmbeddings(texts);
    } catch (err) {
      console.warn('[RAG] Embedding failed, storing without vectors:', (err as Error).message);
    }
  }

  const docId = await db.insertDocument(
    fileName, chunks[0]?.sourceType || 'upload', fileName, uploadedBy, chunks.length, ragId
  );

  for (let i = 0; i < chunks.length; i++) {
    await db.insertChunk(
      null, docId, chunks[i].sourceType,
      chunks[i].heading, chunks[i].content,
      embeddings[i], Math.ceil(chunks[i].content.length / 4),
      ragId
    );
  }

  return { id: docId, chunkCount: chunks.length };
}

/** Upload from binary buffer (PDF, DOCX, etc.) */
export async function indexDocumentBuffer(
  fileName: string,
  buffer: Buffer,
  uploadedBy: number,
  ragId?: number
): Promise<{ id: number; chunkCount: number }> {
  const chunks = await parseDocumentBuffer(fileName, buffer);
  return embedAndStore(fileName, chunks, uploadedBy, ragId);
}

/** Upload from text content (kept for backward compat) */
export async function indexDocument(
  name: string,
  fileName: string,
  content: string,
  uploadedBy: number,
  ragId?: number
): Promise<{ id: number; chunkCount: number }> {
  const chunks = parseDocument(fileName, content);
  return embedAndStore(fileName, chunks, uploadedBy, ragId);
}

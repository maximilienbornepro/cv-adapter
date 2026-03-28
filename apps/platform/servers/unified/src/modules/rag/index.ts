import { Router } from 'express';
import pg from 'pg';
import { config } from '../../config.js';
import { initDbService, initPgvector } from './services/dbService.js';
import { getEmbeddingDimension } from './services/embeddingService.js';
import { createChatRouter } from './routes/chatRoutes.js';
import { createIndexRouter } from './routes/indexRoutes.js';
import { createBotRouter } from './routes/botRoutes.js';
import { createPublicRouter } from './routes/publicRoutes.js';

const { Pool } = pg;

export async function initRag(): Promise<void> {
  const pool = new Pool({ connectionString: config.appDatabaseUrl });

  await pool.query('SELECT 1'); // verify connection
  initDbService(pool);

  const dimension = getEmbeddingDimension();
  const pgvectorOk = await initPgvector(dimension);

  if (!pgvectorOk) {
    console.warn('[RAG] pgvector not available. Semantic search disabled.');
    console.warn('[RAG] Install pgvector on PostgreSQL to enable vector retrieval.');
  }

  console.log('[RAG] Module initialized');
}

export function createRagRouter(): Router {
  const router = Router();

  // Public routes — no auth required (embed/share)
  router.use('/public', createPublicRouter());

  // Authenticated routes
  router.use('/bots', createBotRouter());
  router.use('/chat', createChatRouter());
  router.use('/index', createIndexRouter());

  return router;
}

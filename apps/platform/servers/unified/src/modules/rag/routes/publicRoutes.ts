import { Router } from 'express';
import { asyncHandler } from '@boilerplate/shared/server';
import * as db from '../services/dbService.js';
import { streamRagResponse, generateSuggestedQuestions } from '../services/ragService.js';

export function createPublicRouter(): Router {
  const router = Router();

  // GET /public/:uuid — infos publiques du RAG (sans auth)
  router.get('/:uuid', asyncHandler(async (req, res) => {
    const bot = await db.getRagBotByUuid(req.params.uuid);
    if (!bot) { res.status(404).json({ error: 'RAG non trouvé' }); return; }
    res.json({ uuid: bot.uuid, name: bot.name, description: bot.description });
  }));

  // GET /public/:uuid/suggestions — questions suggérées (sans auth)
  router.get('/:uuid/suggestions', asyncHandler(async (req, res) => {
    const bot = await db.getRagBotByUuid(req.params.uuid);
    if (!bot) { res.status(404).json({ error: 'RAG non trouvé' }); return; }
    const questions = await generateSuggestedQuestions(bot.id);
    res.json({ questions });
  }));

  // POST /public/:uuid/chat — chat public SSE (sans auth, sans historique persistant)
  router.post('/:uuid/chat', async (req, res) => {
    const bot = await db.getRagBotByUuid(req.params.uuid);
    if (!bot) { res.status(404).json({ error: 'RAG non trouvé' }); return; }

    const { content, history = [] } = req.body as {
      content: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!content?.trim()) {
      res.status(400).json({ error: 'Message content required' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    await streamRagResponse(res, content, history, bot.id);
    res.end();
  });

  return router;
}

/**
 * RAG service — retrieval + LLM streaming via SSE.
 * Generates embedding for user query, finds similar chunks, streams LLM response.
 */

import type { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import * as db from './dbService.js';
import * as embeddingService from './embeddingService.js';

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'anthropic';

export interface RagMessage {
  role: 'user' | 'assistant';
  content: string;
}

function sendSSE(res: Response, event: object): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function streamRagResponse(
  res: Response,
  userMessage: string,
  conversationHistory: RagMessage[],
  ragId?: number
): Promise<{ fullText: string; sources: db.Source[] }> {
  let sources: db.Source[] = [];
  let fullText = '';

  // 1. Find relevant chunks — vector search with keyword fallback, scoped to ragId
  let contextChunks: db.ChunkRow[] = [];

  if (db.isPgvectorAvailable()) {
    try {
      const queryEmbedding = await embeddingService.generateEmbedding(userMessage);
      contextChunks = await db.searchSimilarChunks(queryEmbedding, 8, ragId);
    } catch (err) {
      console.warn('[RAG] Embedding/search failed, falling back to keyword search:', (err as Error).message);
      contextChunks = await db.keywordSearchChunks(userMessage, 8, ragId);
    }
  } else {
    // No pgvector — use keyword search
    contextChunks = await db.keywordSearchChunks(userMessage, 8, ragId);
  }

  if (contextChunks.length > 0) {
    sources = deduplicateSources(contextChunks);
    sendSSE(res, { type: 'sources', sources });
  }

  const contextText = contextChunks
    .map((c) => `[${c.sourceType}${c.heading ? ' — ' + c.heading : ''}]\n${c.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = contextText
    ? `Tu es un assistant documentaire. Réponds en français en te basant sur le contexte fourni.\n\nContexte :\n${contextText}`
    : `Tu es un assistant documentaire. Réponds en français. Aucun document n'est indexé pour le moment.`;

  // 3. Stream LLM response
  try {
    const stream = await streamLLM(systemPrompt, conversationHistory, userMessage);

    for await (const chunk of stream) {
      fullText += chunk;
      sendSSE(res, { type: 'text', text: chunk });
    }
  } catch (err) {
    const message = (err as Error).message;
    sendSSE(res, { type: 'error', message });
    console.error('[RAG] LLM streaming error:', err);
  }

  sendSSE(res, { type: 'done' });
  return { fullText, sources };
}

async function* streamLLM(
  systemPrompt: string,
  history: RagMessage[],
  userMessage: string
): AsyncGenerator<string> {
  switch (LLM_PROVIDER) {
    case 'scaleway':
      yield* streamScaleway(systemPrompt, history, userMessage);
      break;
    case 'ollama':
      yield* streamOllama(systemPrompt, history, userMessage);
      break;
    default:
      yield* streamAnthropic(systemPrompt, history, userMessage);
  }
}

async function* streamAnthropic(
  systemPrompt: string,
  history: RagMessage[],
  userMessage: string
): AsyncGenerator<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const anthropic = new Anthropic({ apiKey });

  const messages = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const stream = anthropic.messages.stream({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

async function* streamScaleway(
  systemPrompt: string,
  history: RagMessage[],
  userMessage: string
): AsyncGenerator<string> {
  const apiKey = process.env.SCALEWAY_API_KEY;
  if (!apiKey) throw new Error('SCALEWAY_API_KEY not set');

  // Scaleway exposes an OpenAI-compatible API (supports OpenAI + Mistral models)
  const client = new OpenAI({
    apiKey,
    baseURL: process.env.SCALEWAY_BASE_URL || 'https://api.scaleway.ai/v1',
  });

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user' as const, content: userMessage },
  ];

  const stream = await client.chat.completions.create({
    model: process.env.SCALEWAY_CHAT_MODEL || process.env.SCALEWAY_LLM_MODEL || 'llama-3.1-70b-instruct',
    max_tokens: 2048,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) yield content;
  }
}

async function* streamOllama(
  systemPrompt: string,
  history: RagMessage[],
  userMessage: string
): AsyncGenerator<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_CHAT_MODEL || process.env.OLLAMA_LLM_MODEL || 'llama3.2';

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    try {
      const event = JSON.parse(text);
      if (event.message?.content) yield event.message.content;
    } catch { /* skip */ }
  }
}

export async function generateSuggestedQuestions(ragId: number): Promise<string[]> {
  const chunks = await db.getSampleChunks(ragId, 15);
  if (chunks.length === 0) return [];

  const contextText = chunks
    .slice(0, 10)
    .map((c) => `[${c.sourceType}${c.heading ? ' — ' + c.heading : ''}]\n${c.content.slice(0, 300)}`)
    .join('\n\n---\n\n');

  const prompt = `Voici des extraits de documents indexés dans un assistant RAG :

${contextText}

Génère exactement 4 questions pertinentes et concises qu'un utilisateur pourrait poser à cet assistant, basées sur le contenu de ces documents. Réponds uniquement avec un tableau JSON de 4 chaînes, sans aucun autre texte. Exemple : ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"]`;

  try {
    let rawText = '';
    const stream = streamLLM('Tu génères des questions à partir de documents.', [], prompt);
    for await (const chunk of stream) rawText += chunk;

    const match = rawText.match(/\[[\s\S]*?\]/);
    if (!match) return [];
    const parsed = JSON.parse(match[0]);
    if (Array.isArray(parsed)) return parsed.filter((q) => typeof q === 'string').slice(0, 4);
  } catch (err) {
    console.error('[RAG] generateSuggestedQuestions error:', err);
  }
  return [];
}

function deduplicateSources(chunks: db.ChunkRow[]): db.Source[] {
  const seen = new Set<string>();
  const sources: db.Source[] = [];

  for (const chunk of chunks) {
    const key = chunk.sourceId || String(chunk.documentId);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    sources.push({
      sourceId: chunk.sourceId ?? undefined,
      title: chunk.heading || `Source ${key}`,
      sourceType: chunk.sourceType,
    });
  }

  return sources;
}

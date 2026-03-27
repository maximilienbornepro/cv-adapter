/**
 * Embedding service — multi-provider (Scaleway, OpenAI).
 * Provider selected via EMBEDDING_PROVIDER env var (default: openai).
 */

import OpenAI from 'openai';

const EMBEDDING_PROVIDER = (process.env.EMBEDDING_PROVIDER || 'openai') as 'openai' | 'scaleway';
const BATCH_SIZE = 50;

const DIMENSIONS: Record<string, number> = {
  // Scaleway models
  'bge-multilingual-gemma2': 3584,
  'qwen3-embedding-8b': 4096,
  // OpenAI models
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
};

const OPENAI_MODEL = 'text-embedding-3-small';
const SCALEWAY_MODEL = process.env.SCALEWAY_EMBEDDING_MODEL || 'bge-multilingual-gemma2';

export function getEmbeddingDimension(): number {
  if (EMBEDDING_PROVIDER === 'scaleway') {
    return DIMENSIONS[SCALEWAY_MODEL] || 3584;
  }
  return DIMENSIONS[OPENAI_MODEL];
}

// ============ Providers ============

function getScalewayClient(): OpenAI {
  const apiKey = process.env.SCALEWAY_API_KEY;
  if (!apiKey) throw new Error('SCALEWAY_API_KEY is not configured');
  return new OpenAI({
    apiKey,
    baseURL: process.env.SCALEWAY_BASE_URL || 'https://api.scaleway.ai/v1',
  });
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey });
}

// ============ Public API ============

export async function generateEmbedding(text: string): Promise<number[]> {
  if (EMBEDDING_PROVIDER === 'scaleway') {
    const client = getScalewayClient();
    const res = await client.embeddings.create({ model: SCALEWAY_MODEL, input: text });
    return res.data[0].embedding;
  }
  const client = getOpenAIClient();
  const res = await client.embeddings.create({ model: OPENAI_MODEL, input: text });
  return res.data[0].embedding;
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];

  const client = EMBEDDING_PROVIDER === 'scaleway' ? getScalewayClient() : getOpenAIClient();
  const model = EMBEDDING_PROVIDER === 'scaleway' ? SCALEWAY_MODEL : OPENAI_MODEL;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await client.embeddings.create({ model, input: batch });
    const sorted = res.data.sort((a, b) => a.index - b.index);
    results.push(...sorted.map((d) => d.embedding));

    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

import { Router } from 'express';
import { initPool } from './dbService.js';
import { createCvAdapterRoutes } from './routes.js';

export async function initCvAdapter() {
  await initPool();
  console.log('[CV-Adapter] Module initialized');
}

export function createCvAdapterRouter(): Router {
  return createCvAdapterRoutes();
}

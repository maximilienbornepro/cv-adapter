import { Router } from 'express';
import { initPool } from './dbService.js';
import { createConnectorsRoutes } from './routes.js';

export async function initConnectors() {
  await initPool();
  console.log('[Connectors] Module initialized');
}

export function createConnectorsRouter(): Router {
  return createConnectorsRoutes();
}

import type {
  Conversation,
  Message,
  Source,
  StreamEvent,
  IndexingStatus,
  ConfluenceSpace,
  IndexedDocument,
  RagBot,
  CreateBotPayload,
  UpdateBotPayload,
  PublicBotInfo,
} from '../types/index.js';

const API_BASE = '/rag-api';

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Une erreur est survenue');
  return data;
}

// ============ Conversations ============

export async function fetchConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/chat/conversations`, { credentials: 'include' });
  return handleResponse(res);
}

export async function createConversation(title?: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/chat/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title: title ?? null }),
  });
  return handleResponse(res);
}

export async function deleteConversation(id: number): Promise<void> {
  await fetch(`${API_BASE}/chat/conversations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, { credentials: 'include' });
  return handleResponse(res);
}

// ============ Message streaming ============

export async function streamMessage(
  conversationId: number,
  content: string,
  onSources: (sources: Source[]) => void,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    onError(err.error || 'Erreur lors de l\'envoi du message');
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;

      try {
        const event = JSON.parse(data) as StreamEvent;
        switch (event.type) {
          case 'sources': onSources(event.sources); break;
          case 'text': onText(event.text); break;
          case 'done': onDone(); break;
          case 'error': onError(event.message); break;
        }
      } catch { /* skip malformed */ }
    }
  }
}

// ============ Indexing ============

export async function fetchIndexingStatus(): Promise<IndexingStatus> {
  const res = await fetch(`${API_BASE}/index/status`, { credentials: 'include' });
  return handleResponse(res);
}

export async function checkConfluenceConfigured(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/index/confluence/configured`, { credentials: 'include' });
  const data = await handleResponse<{ configured: boolean }>(res);
  return data.configured;
}

export async function fetchAvailableSpaces(): Promise<ConfluenceSpace[]> {
  const res = await fetch(`${API_BASE}/index/confluence/available`, { credentials: 'include' });
  return handleResponse(res);
}

export async function fetchSelectedSpaces(): Promise<{ spaceKey: string; spaceName: string }[]> {
  const res = await fetch(`${API_BASE}/index/confluence/selected`, { credentials: 'include' });
  return handleResponse(res);
}

export async function saveSelectedSpaces(spaces: { key: string; name: string }[]): Promise<void> {
  await fetch(`${API_BASE}/index/confluence/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ spaces }),
  });
}

export async function triggerConfluenceIndexing(): Promise<void> {
  const res = await fetch(`${API_BASE}/index/confluence/trigger`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }));
    throw new Error(err.error);
  }
}

export async function uploadDocument(file: File): Promise<{ id: number; chunkCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/index/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await handleResponse<{ document: { id: number; chunkCount: number } }>(res);
  return data.document;
}

export async function fetchDocuments(): Promise<IndexedDocument[]> {
  const res = await fetch(`${API_BASE}/index/documents`, { credentials: 'include' });
  return handleResponse(res);
}

export async function deleteDocument(id: number): Promise<void> {
  await fetch(`${API_BASE}/index/documents/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

// ============ RAG Bots ============

export async function fetchBots(): Promise<RagBot[]> {
  const res = await fetch(`${API_BASE}/bots`, { credentials: 'include' });
  return handleResponse(res);
}

export async function createBot(payload: CreateBotPayload): Promise<RagBot> {
  const res = await fetch(`${API_BASE}/bots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function updateBot(id: number, payload: UpdateBotPayload): Promise<RagBot> {
  const res = await fetch(`${API_BASE}/bots/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteBot(id: number): Promise<void> {
  await fetch(`${API_BASE}/bots/${id}`, { method: 'DELETE', credentials: 'include' });
}

export async function fetchBotStatus(id: number): Promise<IndexingStatus> {
  const res = await fetch(`${API_BASE}/bots/${id}/status`, { credentials: 'include' });
  return handleResponse(res);
}

export async function fetchBotSuggestions(id: number): Promise<string[]> {
  const res = await fetch(`${API_BASE}/bots/${id}/suggestions`, { credentials: 'include' });
  const data = await handleResponse<{ questions: string[] }>(res);
  return data.questions;
}

export async function fetchBotDocuments(id: number): Promise<IndexedDocument[]> {
  const res = await fetch(`${API_BASE}/bots/${id}/documents`, { credentials: 'include' });
  return handleResponse(res);
}

export async function uploadBotDocument(id: number, file: File): Promise<{ id: number; chunkCount: number }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/bots/${id}/upload`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await handleResponse<{ document: { id: number; chunkCount: number } }>(res);
  return data.document;
}

export async function deleteBotDocument(botId: number, docId: number): Promise<void> {
  await fetch(`${API_BASE}/bots/${botId}/documents/${docId}`, { method: 'DELETE', credentials: 'include' });
}

export async function checkBotConfluenceConfigured(id: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/bots/${id}/confluence/configured`, { credentials: 'include' });
  const data = await handleResponse<{ configured: boolean }>(res);
  return data.configured;
}

export async function fetchBotAvailableSpaces(id: number): Promise<ConfluenceSpace[]> {
  const res = await fetch(`${API_BASE}/bots/${id}/confluence/available`, { credentials: 'include' });
  return handleResponse(res);
}

export async function fetchBotSelectedSpaces(id: number): Promise<{ spaceKey: string; spaceName: string }[]> {
  const res = await fetch(`${API_BASE}/bots/${id}/confluence/spaces`, { credentials: 'include' });
  return handleResponse(res);
}

export async function saveBotConfluenceSpaces(id: number, spaces: { key: string; name: string }[]): Promise<void> {
  await fetch(`${API_BASE}/bots/${id}/confluence/spaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ spaces }),
  });
}

export async function triggerBotConfluenceIndexing(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/bots/${id}/confluence/trigger`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur' }));
    throw new Error(err.error);
  }
}

export async function fetchBotConversations(botId: number): Promise<Conversation[]> {
  const res = await fetch(`${API_BASE}/bots/${botId}/conversations`, { credentials: 'include' });
  return handleResponse(res);
}

export async function createBotConversation(botId: number, title?: string): Promise<Conversation> {
  const res = await fetch(`${API_BASE}/bots/${botId}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title: title ?? null }),
  });
  return handleResponse(res);
}

export async function deleteBotConversation(botId: number, convId: number): Promise<void> {
  await fetch(`${API_BASE}/bots/${botId}/conversations/${convId}`, { method: 'DELETE', credentials: 'include' });
}

export async function fetchBotMessages(botId: number, convId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/bots/${botId}/conversations/${convId}/messages`, { credentials: 'include' });
  return handleResponse(res);
}

export async function streamBotMessage(
  botId: number,
  content: string,
  conversationId: number | undefined,
  onConversationId: (id: number) => void,
  onSources: (sources: Source[]) => void,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/bots/${botId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content, conversationId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    onError(err.error || 'Erreur lors de l\'envoi du message');
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        const event = JSON.parse(data) as StreamEvent;
        switch (event.type) {
          case 'conversationId': onConversationId(event.id); break;
          case 'sources': onSources(event.sources); break;
          case 'text': onText(event.text); break;
          case 'done': onDone(); break;
          case 'error': onError(event.message); break;
        }
      } catch { /* skip malformed */ }
    }
  }
}

// ============ Public embed (no auth) ============

export async function fetchPublicBotInfo(uuid: string): Promise<PublicBotInfo> {
  const res = await fetch(`${API_BASE}/public/${uuid}`);
  return handleResponse(res);
}

export async function fetchPublicSuggestions(uuid: string): Promise<string[]> {
  const res = await fetch(`${API_BASE}/public/${uuid}/suggestions`);
  const data = await handleResponse<{ questions: string[] }>(res);
  return data.questions;
}

export async function streamPublicChat(
  uuid: string,
  content: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  onSources: (sources: Source[]) => void,
  onText: (text: string) => void,
  onDone: () => void,
  onError: (message: string) => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/public/${uuid}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, history }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    onError(err.error || 'Erreur lors de l\'envoi du message');
    return;
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data) continue;
      try {
        const event = JSON.parse(data) as StreamEvent;
        switch (event.type) {
          case 'sources': onSources(event.sources); break;
          case 'text': onText(event.text); break;
          case 'done': onDone(); break;
          case 'error': onError(event.message); break;
        }
      } catch { /* skip */ }
    }
  }
}

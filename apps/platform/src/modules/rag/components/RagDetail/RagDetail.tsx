import { useState, useEffect, useCallback } from 'react';
import { Layout, ModuleHeader } from '@boilerplate/shared/components';
import { ConversationList } from '../ConversationList/ConversationList.js';
import { ChatView } from '../ChatView/ChatView.js';
import { SourcesPanel } from '../SourcesPanel/SourcesPanel.js';
import type { Conversation, Message, Source, IndexingStatus, RagBot } from '../../types/index.js';
import {
  fetchBotConversations,
  createBotConversation,
  deleteBotConversation,
  fetchBotMessages,
  fetchBotStatus,
  fetchBotSuggestions,
  streamBotMessage,
} from '../../services/api.js';
import styles from './RagDetail.module.css';

interface Props {
  bot: RagBot;
  onBack: () => void;
  onCopyEmbed: (bot: RagBot) => void;
  onNavigate?: (path: string) => void;
}

type Tab = 'chat' | 'sources';

const POLLING_INTERVAL = 3000;

export function RagDetail({ bot, onBack, onCopyEmbed, onNavigate }: Props) {
  const [tab, setTab] = useState<Tab>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const [status, setStatus] = useState<IndexingStatus | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetchBotConversations(bot.id).then(setConversations).catch(console.error);
    fetchBotSuggestions(bot.id).then(setSuggestions).catch(console.error);
  }, [bot.id]);

  useEffect(() => {
    function poll() {
      fetchBotStatus(bot.id).then(setStatus).catch(console.error);
    }
    poll();
    const interval = setInterval(poll, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [bot.id]);

  useEffect(() => {
    if (selectedId == null) { setMessages([]); return; }
    fetchBotMessages(bot.id, selectedId).then(setMessages).catch(console.error);
  }, [bot.id, selectedId]);

  const handleNewConversation = useCallback(async () => {
    const conv = await createBotConversation(bot.id);
    setConversations((prev) => [conv, ...prev]);
    setSelectedId(conv.id);
    setMessages([]);
  }, [bot.id]);

  const handleDeleteConversation = useCallback(async (id: number) => {
    await deleteBotConversation(bot.id, id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) { setSelectedId(null); setMessages([]); }
  }, [bot.id, selectedId]);

  const handleSend = useCallback(async (content: string) => {
    setIsStreaming(true);
    setStreamingText('');
    setStreamingSources([]);

    const tempMsg: Message = {
      id: Date.now(), conversationId: selectedId ?? 0, role: 'user',
      content, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    let currentConvId = selectedId ?? undefined;
    let fullText = '';

    await streamBotMessage(
      bot.id,
      content,
      currentConvId,
      (id) => {
        currentConvId = id;
        setSelectedId(id);
        if (!conversations.find((c) => c.id === id)) {
          fetchBotConversations(bot.id).then(setConversations).catch(console.error);
        }
      },
      (sources) => setStreamingSources(sources),
      (text) => { fullText += text; setStreamingText(fullText); },
      async () => {
        setIsStreaming(false);
        setStreamingText('');
        setStreamingSources([]);
        if (currentConvId) {
          const updated = await fetchBotMessages(bot.id, currentConvId);
          setMessages(updated);
        }
        fetchBotConversations(bot.id).then(setConversations).catch(console.error);
      },
      (message) => {
        setIsStreaming(false);
        setStreamingText('');
        const errMsg: Message = {
          id: Date.now() + 1, conversationId: currentConvId ?? 0, role: 'assistant',
          content: `Erreur : ${message}`, createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    );
  }, [bot.id, selectedId, conversations]);

  const subtitle = status
    ? `${status.totalChunks ?? 0} chunks${status.isIndexing ? ' — indexation…' : ''}`
    : undefined;

  return (
    <Layout appId="rag" variant="custom" onNavigate={onNavigate}>
      <ModuleHeader
        title={bot.name}
        subtitle={subtitle}
        onBack={onBack}
      >
        <button className="module-header-btn" onClick={() => onCopyEmbed(bot)}>
          Lien embed
        </button>
      </ModuleHeader>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'chat' ? styles.active : ''}`}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          className={`${styles.tab} ${tab === 'sources' ? styles.active : ''}`}
          onClick={() => setTab('sources')}
        >
          Sources
        </button>
      </div>

      {tab === 'chat' ? (
        <div className={`rag-layout ${styles.layout}`}>
          <ConversationList
            conversations={conversations}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={handleDeleteConversation}
            onNew={handleNewConversation}
          />
          <ChatView
            messages={messages}
            isStreaming={isStreaming}
            streamingText={streamingText}
            streamingSources={streamingSources}
            suggestions={selectedId == null ? suggestions : undefined}
            onSend={handleSend}
          />
        </div>
      ) : (
        <div className={styles.sourcesPane}>
          <SourcesPanel botId={bot.id} status={status} />
        </div>
      )}
    </Layout>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicBotInfo, Source } from '../../types/index.js';
import { fetchPublicBotInfo, fetchPublicSuggestions, streamPublicChat } from '../../services/api.js';
import styles from './EmbedChat.module.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

interface Props {
  uuid: string;
}

export function EmbedChat({ uuid }: Props) {
  const [bot, setBot] = useState<PublicBotInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingSources, setStreamingSources] = useState<Source[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchPublicBotInfo(uuid)
      .then(setBot)
      .catch(() => setNotFound(true));
    fetchPublicSuggestions(uuid)
      .then(setSuggestions)
      .catch(() => {});
  }, [uuid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = useCallback(async (overrideContent?: string) => {
    const content = (overrideContent ?? input).trim();
    if (!content || isStreaming) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText('');
    setStreamingSources([]);

    const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    let fullText = '';

    await streamPublicChat(
      uuid,
      content,
      history.slice(0, -1),
      (sources) => setStreamingSources(sources),
      (text) => { fullText += text; setStreamingText(fullText); },
      () => {
        setIsStreaming(false);
        setStreamingText('');
        const assistantMsg: ChatMessage = { role: 'assistant', content: fullText, sources: streamingSources };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingSources([]);
      },
      (message) => {
        setIsStreaming(false);
        setStreamingText('');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Erreur : ${message}` }]);
      }
    );
  }, [input, isStreaming, messages, uuid, streamingSources]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }

  if (notFound) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundCode}>404</div>
        <p className={styles.notFoundMsg}>Ce RAG n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  if (!bot) {
    return <div className={styles.loading}>Chargement…</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.headerTitle}>{bot.name}</p>
        {bot.description && <p className={styles.headerDesc}>{bot.description}</p>}
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && !isStreaming && (
          <div className={styles.welcome}>
            <p className={styles.welcomeTitle}>{bot.name}</p>
            <p className={styles.welcomeDesc}>
              {bot.description || 'Posez vos questions sur les documents de cet assistant.'}
            </p>
            {suggestions.length > 0 && (
              <div className={styles.suggestions}>
                {suggestions.map((q) => (
                  <button
                    key={q}
                    className={styles.suggestionBtn}
                    onClick={() => { if (!isStreaming) handleSend(q); }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div className={styles.sources}>
                <span className={styles.sourcesLabel}>Sources :</span>
                {msg.sources.map((s, j) => (
                  <span key={j}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
                        {s.title || s.sourceType}
                      </a>
                    ) : (
                      <span>{s.title || s.sourceType}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
              {msg.role === 'assistant' ? <MarkdownText text={msg.content} /> : msg.content}
            </div>
          </div>
        ))}

        {isStreaming && (
          <div className={`${styles.message} ${styles.assistantMessage}`}>
            {streamingSources.length > 0 && (
              <div className={styles.sources}>
                <span className={styles.sourcesLabel}>Sources :</span>
                {streamingSources.map((s, j) => (
                  <span key={j}>{s.title || s.sourceType}</span>
                ))}
              </div>
            )}
            <div className={`${styles.bubble} ${styles.assistantBubble}`}>
              <MarkdownText text={streamingText} />
              <span className={styles.cursor} />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={input}
          onChange={autoResize}
          onKeyDown={handleKeyDown}
          placeholder="Votre question…"
          rows={1}
          disabled={isStreaming}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          aria-label="Envoyer"
        >
          {isStreaming ? '…' : '↑'}
        </button>
      </div>
    </div>
  );
}

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(<pre key={i} className={styles.codeBlock}><code>{codeLines.join('\n')}</code></pre>);
        codeLines = []; codeLang = ''; inCodeBlock = false;
      } else {
        inCodeBlock = true; codeLang = line.slice(3).trim();
      }
      continue;
    }
    if (inCodeBlock) { codeLines.push(line); continue; }
    if (line.startsWith('# ')) elements.push(<h3 key={i} className={styles.h1}>{line.slice(2)}</h3>);
    else if (line.startsWith('## ')) elements.push(<h4 key={i} className={styles.h2}>{line.slice(3)}</h4>);
    else if (line.startsWith('- ') || line.startsWith('* ')) elements.push(<li key={i} className={styles.li}>{renderInline(line.slice(2))}</li>);
    else if (line === '') elements.push(<br key={i} />);
    else elements.push(<p key={i} className={styles.p}>{renderInline(line)}</p>);
  }

  return <div>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}

import { useState, useRef, useEffect } from 'react';
import type { Message, Source } from '../../types/index.js';
import styles from './ChatView.module.css';

interface Props {
  messages: Message[];
  isStreaming: boolean;
  streamingText: string;
  streamingSources: Source[];
  suggestions?: string[];
  onSend: (content: string) => void;
}

export function ChatView({ messages, isStreaming, streamingText, streamingSources, suggestions, onSend }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.welcome}>
          <h2 className={styles.welcomeTitle}>Assistant documentaire</h2>
          <p className={styles.welcomeDesc}>
            Posez vos questions sur vos documents indexés. Les réponses sont sourcées depuis vos contenus.
          </p>
          {suggestions && suggestions.length > 0 && (
            <div className={styles.examples}>
              <span className={styles.examplesLabel}>Questions suggérées :</span>
              {suggestions.map((q) => (
                <button key={q} className={styles.exampleBtn} onClick={() => { onSend(q); }}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
        <InputBar input={input} isStreaming={isStreaming} textareaRef={textareaRef} onChange={autoResize} onKeyDown={handleKeyDown} onSend={handleSend} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.messages}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className={styles.message}>
            <div className={styles.assistant}>
              {streamingSources.length > 0 && <SourcesList sources={streamingSources} />}
              <div className={styles.bubble}>
                <MarkdownText text={streamingText} />
                <span className={styles.cursor} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <InputBar input={input} isStreaming={isStreaming} textareaRef={textareaRef} onChange={autoResize} onKeyDown={handleKeyDown} onSend={handleSend} />
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className={styles.message}>
        <div className={styles.user}>
          <div className={styles.bubble}>{message.content}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.message}>
      <div className={styles.assistant}>
        {message.sources && message.sources.length > 0 && (
          <SourcesList sources={message.sources} />
        )}
        <div className={styles.bubble}>
          <MarkdownText text={message.content} />
        </div>
      </div>
    </div>
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <div className={styles.sources}>
      <span className={styles.sourcesLabel}>Sources :</span>
      {sources.map((s, i) => (
        <span key={i} className={styles.source}>
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
  );
}

function MarkdownText({ text }: { text: string }) {
  // Basic markdown rendering (code blocks, bold, inline code)
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={i} className={styles.codeBlock}>
            <code className={codeLang ? `language-${codeLang}` : ''}>{codeLines.join('\n')}</code>
          </pre>
        );
        codeLines = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(<h3 key={i} className={styles.h1}>{line.slice(2)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h4 key={i} className={styles.h2}>{line.slice(3)}</h4>);
    } else if (line.startsWith('### ')) {
      elements.push(<h5 key={i} className={styles.h3}>{line.slice(4)}</h5>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={i} className={styles.li}>{renderInline(line.slice(2))}</li>);
    } else if (line === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className={styles.p}>{renderInline(line)}</p>);
    }
  }

  return <div className={styles.markdown}>{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

interface InputBarProps {
  input: string;
  isStreaming: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
}

function InputBar({ input, isStreaming, textareaRef, onChange, onKeyDown, onSend }: InputBarProps) {
  return (
    <div className={styles.inputBar}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={input}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder="Posez votre question… (Entrée pour envoyer, Maj+Entrée pour saut de ligne)"
        rows={1}
        disabled={isStreaming}
      />
      <button
        className={styles.sendBtn}
        onClick={onSend}
        disabled={!input.trim() || isStreaming}
      >
        {isStreaming ? '…' : '↑'}
      </button>
    </div>
  );
}

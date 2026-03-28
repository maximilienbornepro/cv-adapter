import type { Conversation } from '../../types/index.js';
import styles from './ConversationList.module.css';

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

export function ConversationList({ conversations, selectedId, onSelect, onDelete, onNew }: Props) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.title}>Conversations</span>
        <button className={styles.newBtn} onClick={onNew} title="Nouvelle conversation">+</button>
      </div>

      <div className={styles.list}>
        {conversations.length === 0 && (
          <p className={styles.empty}>Aucune conversation</p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`${styles.item} ${selectedId === conv.id ? styles.active : ''}`}
            onClick={() => onSelect(conv.id)}
          >
            <span className={styles.convTitle}>{conv.title || 'Nouvelle conversation'}</span>
            <button
              className={styles.deleteBtn}
              onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
              title="Supprimer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

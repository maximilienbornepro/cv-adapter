import { useState, useCallback } from 'react';
import { fetchSuggestions, acceptSuggestion, rejectSuggestion } from '../../services/api';
import type { Suggestion } from '../../services/api';
import styles from './SuggestionsPanel.module.css';

interface SuggestionsPanelProps {
  documentId: string;
  onClose: () => void;
  onAccepted: () => void; // reload document after acceptance
}

const TYPE_LABELS: Record<string, string> = {
  'new-subject': 'Nouveau sujet',
  'update-situation': 'Compléter un sujet',
  'new-section': 'Nouvelle section',
};

export function SuggestionsPanel({ documentId, onClose, onAccepted }: SuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuggestions(documentId);
      setSuggestions(data);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Auto-load on mount
  useState(() => { load(); });

  const handleAccept = async (id: number) => {
    setProcessing(id);
    try {
      await acceptSuggestion(id);
      setSuggestions((prev) => prev?.filter((s) => s.id !== id) ?? null);
      onAccepted();
    } catch (err: any) {
      console.error('Accept failed', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    setProcessing(id);
    try {
      await rejectSuggestion(id);
      setSuggestions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    } finally {
      setProcessing(null);
    }
  };

  const pending = suggestions?.filter((s) => s.status === 'pending') ?? [];

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>Suggestions IA — Transcription Teams</span>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {loading && <p className={styles.empty}>Chargement...</p>}

      {!loading && pending.length === 0 && (
        <p className={styles.empty}>Toutes les suggestions ont été traitées.</p>
      )}

      {!loading && pending.length > 0 && (
        <div className={styles.list}>
          {pending.map((s) => (
            <div key={s.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.typeBadge}>{TYPE_LABELS[s.type] ?? s.type}</span>
              </div>

              {s.proposedTitle && (
                <p className={styles.proposedTitle}>{s.proposedTitle}</p>
              )}

              {s.proposedSituation && (
                <p className={styles.proposedSituation}>{s.proposedSituation}</p>
              )}

              <p className={styles.rationale}>{s.rationale}</p>

              <div className={styles.actions}>
                <button
                  className={styles.acceptBtn}
                  onClick={() => handleAccept(s.id)}
                  disabled={processing === s.id}
                >
                  Accepter
                </button>
                <button
                  className={styles.rejectBtn}
                  onClick={() => handleReject(s.id)}
                  disabled={processing === s.id}
                >
                  Ignorer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

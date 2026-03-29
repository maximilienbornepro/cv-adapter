import { useState } from 'react';
import { Modal } from '@boilerplate/shared/components';
import type { RagBot } from '../../types/index.js';
import styles from './RagForm.module.css';

interface Props {
  bot?: RagBot;
  onSubmit: (name: string, description: string) => Promise<void>;
  onClose: () => void;
}

export function RagForm({ bot, onSubmit, onClose }: Props) {
  const [name, setName] = useState(bot?.name ?? '');
  const [description, setDescription] = useState(bot?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Le nom est obligatoire'); return; }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal onClose={onClose} title={bot ? 'Modifier le RAG' : 'Nouveau RAG'}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rag-name">Nom *</label>
          <input
            id="rag-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mon assistant documentaire"
            autoFocus
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="rag-desc">Description (optionnel)</label>
          <textarea
            id="rag-desc"
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="À quoi sert ce RAG ?"
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Annuler</button>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Enregistrement…' : bot ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

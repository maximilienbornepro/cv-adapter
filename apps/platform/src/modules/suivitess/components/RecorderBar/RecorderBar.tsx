import { useState, useEffect, useRef, useCallback } from 'react';
import { startRecording, getRecordingStatus, stopRecording } from '../../services/api';
import type { RecordingStatus } from '../../services/api';
import styles from './RecorderBar.module.css';

interface RecorderBarProps {
  documentId: string;
  onDone?: () => void; // called when status becomes 'done'
}

const STATUS_LABELS: Record<string, string> = {
  idle: '',
  joining: 'En attente d\'admission...',
  recording: 'En cours d\'enregistrement',
  processing: 'Génération des suggestions...',
  done: 'Terminé',
  error: 'Erreur',
};

const POLL_INTERVAL_MS = 10_000;

export function RecorderBar({ documentId, onDone }: RecorderBarProps) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const [status, setStatus] = useState<RecordingStatus['status']>('idle');
  const [captionCount, setCaptionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusRef = useRef<string>('idle');

  const fetchStatus = useCallback(async () => {
    try {
      const s = await getRecordingStatus(documentId);
      setStatus(s.status);
      setCaptionCount(s.captionCount);
      if (s.error) setError(s.error);

      if (s.status === 'done' && prevStatusRef.current !== 'done') {
        onDone?.();
      }
      prevStatusRef.current = s.status;

      if (['done', 'error', 'idle'].includes(s.status)) {
        stopPolling();
      }
    } catch { /* ignore */ }
  }, [documentId, onDone]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);
  }, [fetchStatus]);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  // On mount, check if there's an active recording
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (['joining', 'recording', 'processing'].includes(status)) {
      startPolling();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [status, startPolling]);

  const handleStart = async () => {
    if (!meetingUrl.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await startRecording(documentId, meetingUrl.trim());
      setStatus('joining');
      setMeetingUrl('');
      startPolling();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    await stopRecording(documentId);
    setStatus('idle');
    stopPolling();
  };

  const isActive = ['joining', 'recording', 'processing'].includes(status);

  return (
    <div className={styles.recorderBar}>
      {!isActive && status !== 'done' ? (
        <div className={styles.inputRow}>
          <input
            className={styles.urlInput}
            type="url"
            placeholder="Coller le lien Teams..."
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            disabled={loading}
          />
          <button
            className={styles.startBtn}
            onClick={handleStart}
            disabled={loading || !meetingUrl.trim()}
          >
            {loading ? '...' : 'Enregistrer'}
          </button>
        </div>
      ) : null}

      {isActive && (
        <div className={styles.statusRow}>
          <span className={`${styles.badge} ${styles[`badge_${status}`]}`}>
            <span className={styles.dot} />
            {STATUS_LABELS[status]}
            {status === 'recording' && captionCount > 0 && ` (${captionCount} répliques)`}
          </span>
          <button className={styles.stopBtn} onClick={handleStop}>Arrêter</button>
        </div>
      )}

      {status === 'done' && (
        <div className={styles.statusRow}>
          <span className={`${styles.badge} ${styles.badge_done}`}>
            Transcription terminée — suggestions disponibles
          </span>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  );
}

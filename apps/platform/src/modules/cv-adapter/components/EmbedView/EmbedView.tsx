import { useState, useEffect } from 'react';
import { fetchCVEmbed, getFullPreviewHTML } from '../../services/api';
import type { CV } from '../../types';
import './EmbedView.css';

interface EmbedViewProps {
  itemId: string;
}

export function EmbedView({ itemId }: EmbedViewProps) {
  const [cv, setCv] = useState<CV | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCV() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCVEmbed(itemId);
        setCv(data);

        // Generate HTML preview
        if (data.cvData) {
          const html = await getFullPreviewHTML(data.cvData);
          setPreviewHtml(html);
        }
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }
    loadCV();
  }, [itemId]);

  if (loading) {
    return <div className="cv-embed-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="cv-embed-error">{error}</div>;
  }

  if (!cv) {
    return <div className="cv-embed-error">CV non trouve</div>;
  }

  return (
    <div className="cv-embed-app">
      {previewHtml ? (
        <iframe
          className="cv-embed-iframe"
          srcDoc={previewHtml}
          title={cv.name || 'CV Preview'}
        />
      ) : (
        <div className="cv-embed-fallback">
          <h1>{cv.cvData?.name || 'CV'}</h1>
          <p>{cv.cvData?.title || ''}</p>
        </div>
      )}
    </div>
  );
}

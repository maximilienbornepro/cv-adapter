import { useState } from 'react';
import { LoadingSpinner } from '@cv-adapter/shared/components';
import type { CVData } from '../../types';
import { getPreviewHTML, getFullPreviewHTML, downloadPDF } from '../../services/api';
import './ExportSection.css';

interface ExportSectionProps {
  cvData: CVData;
}

export function ExportSection({ cvData }: ExportSectionProps) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingFullPreview, setLoadingFullPreview] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [error, setError] = useState('');

  const handlePreviewHTML = async () => {
    setLoadingPreview(true);
    setError('');

    try {
      const html = await getPreviewHTML(cvData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFullPreviewHTML = async () => {
    setLoadingFullPreview(true);
    setError('');

    try {
      const html = await getFullPreviewHTML(cvData);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération de l\'aperçu complet');
    } finally {
      setLoadingFullPreview(false);
    }
  };

  const handlePreviewPDF = async () => {
    setLoadingPDF(true);
    setError('');

    try {
      // Generate PDF and open in new tab
      const response = await fetch('/cv-adapter-api/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cvData }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la génération du PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoadingPDF(true);
    setError('');

    try {
      const filename = cvData.name
        ? `CV_${cvData.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : 'CV.pdf';
      await downloadPDF(cvData, filename);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement du PDF');
    } finally {
      setLoadingPDF(false);
    }
  };

  return (
    <div className="export-section">
      <h3>Exporter le CV</h3>

      {error && <div className="export-error">{error}</div>}

      <div className="export-buttons">
        <button
          className="export-btn preview-html"
          onClick={handlePreviewHTML}
          disabled={loadingPreview || loadingFullPreview || loadingPDF}
        >
          {loadingPreview ? (
            <LoadingSpinner size="small" />
          ) : (
            <span className="btn-icon">👁</span>
          )}
          <span>Aperçu HTML</span>
        </button>

        <button
          className="export-btn preview-full"
          onClick={handleFullPreviewHTML}
          disabled={loadingPreview || loadingFullPreview || loadingPDF}
        >
          {loadingFullPreview ? (
            <LoadingSpinner size="small" />
          ) : (
            <span className="btn-icon">📋</span>
          )}
          <span>Aperçu complet</span>
        </button>

        <button
          className="export-btn preview-pdf"
          onClick={handlePreviewPDF}
          disabled={loadingPreview || loadingFullPreview || loadingPDF}
        >
          {loadingPDF ? (
            <LoadingSpinner size="small" />
          ) : (
            <span className="btn-icon">📄</span>
          )}
          <span>Aperçu PDF</span>
        </button>

        <button
          className="export-btn download-pdf"
          onClick={handleDownloadPDF}
          disabled={loadingPreview || loadingFullPreview || loadingPDF}
        >
          {loadingPDF ? (
            <LoadingSpinner size="small" />
          ) : (
            <span className="btn-icon">⬇</span>
          )}
          <span>Télécharger PDF</span>
        </button>
      </div>

      <p className="export-hint">
        L'aperçu HTML est instantané. La génération PDF peut prendre quelques secondes.
      </p>
    </div>
  );
}

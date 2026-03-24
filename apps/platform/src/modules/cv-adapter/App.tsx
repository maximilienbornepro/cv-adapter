import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@studio/shared/components';
import { MyProfilePage } from './components/MyProfilePage';
import { AdaptCVPage } from './components/AdaptCVPage';
import { EmbedView } from './components/EmbedView/EmbedView';
import type { CVData, CV } from './types';
import { createEmptyCV } from './types';
import * as api from './services/api';
import './index.css';

type View = 'profile' | 'adapt';

interface CvAdapterAppProps {
  onNavigate?: (path: string) => void;
  embedMode?: boolean;
  embedId?: string;
}

export default function CvAdapterApp({ onNavigate, embedMode, embedId }: CvAdapterAppProps) {
  // Embed mode: render minimal view
  if (embedMode && embedId) {
    return <EmbedView itemId={embedId} />;
  }
  const [view, setView] = useState<View>('profile');
  const [cv, setCv] = useState<CV | null>(null);

  // Handle internal navigation
  const handleNavigate = useCallback((path: string) => {
    if (path === '/cv-adapter/adapt') {
      setView('adapt');
    } else if (path === '/cv-adapter' || path === '/cv-adapter/') {
      setView('profile');
    } else if (onNavigate) {
      onNavigate(path);
    }
  }, [onNavigate]);

  // Load CV for adaptation
  useEffect(() => {
    if (view === 'adapt') {
      api.fetchDefaultCV().then(setCv).catch(console.error);
    }
  }, [view]);

  // Handle adaptation result
  const handleAdapt = useCallback(async (adaptedCV: CVData) => {
    try {
      const updated = await api.updateDefaultCV(adaptedCV);
      setCv(updated);
      setView('profile');
    } catch (err) {
      console.error('Failed to save adapted CV:', err);
    }
  }, []);

  const handleCancelAdapt = useCallback(() => {
    setView('profile');
  }, []);

  // Render based on current view
  const renderContent = () => {
    switch (view) {
      case 'adapt':
        return (
          <AdaptCVPage
            cvData={cv?.cvData || createEmptyCV()}
            onAdapt={handleAdapt}
            onCancel={handleCancelAdapt}
          />
        );
      case 'profile':
      default:
        return <MyProfilePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout appId="cv-adapter" variant="full-width" onNavigate={handleNavigate}>
      {renderContent()}
    </Layout>
  );
}

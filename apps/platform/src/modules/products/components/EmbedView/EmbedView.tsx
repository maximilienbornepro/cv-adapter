import { useState, useEffect } from 'react';
import { fetchProductEmbed } from '../../services/api';
import type { Product } from '../../types';
import './EmbedView.css';

interface EmbedViewProps {
  itemId: string;
}

export function EmbedView({ itemId }: EmbedViewProps) {
  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchProductEmbed(itemId);
        setItem(data);
      } catch (err: any) {
        setError(err.message || 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    }
    loadItem();
  }, [itemId]);

  if (loading) {
    return <div className="embed-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="embed-error">{error}</div>;
  }

  if (!item) {
    return <div className="embed-error">Produit non trouve</div>;
  }

  return (
    <div className={`embed-app ${isDark ? 'embed-dark' : 'embed-light'}`}>
      <div className="embed-header">
        <h1 className="embed-title">{item.name}</h1>
        <button
          className="embed-theme-toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
        >
          {isDark ? '\u2600\ufe0f' : '\ud83c\udf19'}
        </button>
      </div>
      <div className="embed-content">
        <div className="embed-field">
          <span className="embed-label">Description</span>
          <p className="embed-value">{item.description || 'Aucune description'}</p>
        </div>
        <div className="embed-field">
          <span className="embed-label">Prix</span>
          <p className="embed-value embed-price">{item.price.toFixed(2)} EUR</p>
        </div>
        {item.stock !== undefined && (
          <div className="embed-field">
            <span className="embed-label">Stock</span>
            <p className="embed-value">{item.stock} unites</p>
          </div>
        )}
      </div>
    </div>
  );
}

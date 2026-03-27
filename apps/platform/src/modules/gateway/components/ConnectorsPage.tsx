import { useState, useEffect, useCallback } from 'react';
import './ConnectorsPage.css';

// ==================== Types ====================

interface ConnectorData {
  id: number;
  userId: number;
  service: string;
  config: Record<string, string>;
  isActive: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface TestResult {
  success: boolean;
  message: string;
  userName?: string;
}

interface ServiceDefinition {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: JSX.Element;
  enabled: boolean;
}

// ==================== SVG Icons ====================

const JiraIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.53 2c0 2.4 1.97 4.35 4.35 4.35h1.78v1.7c0 2.4 1.94 4.34 4.34 4.35V2.84a.84.84 0 0 0-.84-.84H11.53zM6.77 6.8a4.362 4.362 0 0 0 4.34 4.34h1.8v1.72a4.362 4.362 0 0 0 4.34 4.34V7.63a.84.84 0 0 0-.83-.83H6.77zM2 11.6a4.362 4.362 0 0 0 4.34 4.34h1.8v1.72A4.362 4.362 0 0 0 12.48 22V12.43a.84.84 0 0 0-.83-.83H2z"/>
  </svg>
);

const NotionIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.327-1.167.514-1.634.514-.746 0-.933-.234-1.493-.933l-4.572-7.186v6.953l1.447.327s0 .84-1.167.84l-3.22.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.453-.234 4.759 7.28V9.2l-1.214-.14c-.093-.513.28-.886.747-.933l3.229-.186z"/>
  </svg>
);

const ClickUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.986 11.072l2.142 1.736a6.26 6.26 0 0 0 5.872 3.87 6.26 6.26 0 0 0 5.872-3.87l2.142-1.736C18.858 14.725 15.742 17.45 12 17.45c-3.742 0-6.858-2.725-8.014-6.378z"/>
    <path d="M12 6.556l-3.672 3.332-2.142-1.736L12 2.856l5.814 5.296-2.142 1.736L12 6.556z"/>
  </svg>
);

// ==================== Service definitions ====================

const SERVICES: ServiceDefinition[] = [
  {
    id: 'jira',
    name: 'Jira',
    description: 'Atlassian Jira - Gestion de projet et suivi de tickets',
    color: '#0052CC',
    icon: <JiraIcon />,
    enabled: true,
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Notion - Documentation et base de connaissances',
    color: '#000000',
    icon: <NotionIcon />,
    enabled: false,
  },
  {
    id: 'clickup',
    name: 'ClickUp',
    description: 'ClickUp - Gestion de projet et productivite',
    color: '#7B68EE',
    icon: <ClickUpIcon />,
    enabled: false,
  },
];

// ==================== API functions ====================

const API_BASE = '/api/connectors';

async function fetchConnectors(): Promise<ConnectorData[]> {
  const res = await fetch(API_BASE, { credentials: 'include' });
  if (!res.ok) throw new Error('Erreur lors du chargement des connecteurs');
  return res.json();
}

async function saveConnector(service: string, config: Record<string, string>): Promise<ConnectorData> {
  const res = await fetch(`${API_BASE}/${service}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ config }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erreur lors de la sauvegarde');
  }
  return res.json();
}

async function testConnector(service: string): Promise<{ success: boolean; user?: { displayName: string; accountId: string }; error?: string; details?: string }> {
  const res = await fetch(`${API_BASE}/${service}/test`, {
    method: 'POST',
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Erreur lors du test');
  }
  return data;
}

async function deleteConnector(service: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${service}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Erreur lors de la suppression');
  }
}

// ==================== Jira Form Component ====================

function JiraForm({
  connector,
  onSaved,
  onDeleted,
}: {
  connector: ConnectorData | null;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState('');
  const [email, setEmail] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (connector) {
      setBaseUrl((connector.config.baseUrl as string) || '');
      setEmail((connector.config.email as string) || '');
      setApiToken((connector.config.apiToken as string) || '');
    } else {
      setBaseUrl('');
      setEmail('');
      setApiToken('');
    }
    setTestResult(null);
    setError('');
  }, [connector]);

  const handleSave = async () => {
    if (!baseUrl || !email || !apiToken) {
      setError('Tous les champs sont requis');
      return;
    }

    setSaving(true);
    setError('');
    setTestResult(null);

    try {
      await saveConnector('jira', { baseUrl, email, apiToken });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      const result = await testConnector('jira');
      setTestResult({
        success: true,
        message: `Connexion reussie ! Connecte en tant que ${result.user?.displayName}`,
        userName: result.user?.displayName,
      });
      onSaved(); // Refresh to get updated isActive status
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Erreur lors du test',
      });
      onSaved(); // Refresh to get updated isActive status
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await deleteConnector('jira');
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const hasChanges = connector
    ? baseUrl !== (connector.config.baseUrl || '') ||
      email !== (connector.config.email || '') ||
      (apiToken !== (connector.config.apiToken || '') && !apiToken.includes('****'))
    : baseUrl || email || apiToken;

  return (
    <div className="connector-card-body">
      <div className="connector-form">
        <div className="connector-field">
          <label htmlFor="jira-url">URL de l'instance Jira</label>
          <input
            id="jira-url"
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://votre-equipe.atlassian.net"
          />
          <span className="connector-field-hint">
            L'URL de votre instance Atlassian Jira Cloud
          </span>
        </div>

        <div className="connector-field">
          <label htmlFor="jira-email">Email</label>
          <input
            id="jira-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@example.com"
          />
          <span className="connector-field-hint">
            L'adresse email associee a votre compte Atlassian
          </span>
        </div>

        <div className="connector-field">
          <label htmlFor="jira-token">Token API</label>
          <input
            id="jira-token"
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="Votre token API Atlassian"
          />
          <span className="connector-field-hint">
            Generez un token sur https://id.atlassian.net/manage-profile/security/api-tokens
          </span>
        </div>
      </div>

      {error && <div className="connectors-error">{error}</div>}

      {testResult && (
        <div className={`connector-test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.message}
        </div>
      )}

      <div className="connector-actions">
        <button
          className="connector-btn primary"
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <span className="connector-loading">
              <span className="connector-spinner" />
              Sauvegarde...
            </span>
          ) : (
            'Sauvegarder'
          )}
        </button>

        <button
          className="connector-btn secondary"
          onClick={handleTest}
          disabled={testing || !connector}
        >
          {testing ? (
            <span className="connector-loading">
              <span className="connector-spinner" />
              Test en cours...
            </span>
          ) : (
            'Tester la connexion'
          )}
        </button>

        {connector && (
          <button
            className="connector-btn danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==================== Connector Card Component ====================

function ConnectorCard({
  service,
  connector,
  onSaved,
  onDeleted,
}: {
  service: ServiceDefinition;
  connector: ConnectorData | null;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const isActive = connector?.isActive ?? false;

  return (
    <div className={`connector-card${!service.enabled ? ' disabled' : ''}`}>
      <div
        className="connector-card-header"
        onClick={() => service.enabled && setExpanded(!expanded)}
      >
        <div className="connector-card-left">
          <div
            className="connector-card-icon"
            style={{ background: service.color, color: '#fff' }}
          >
            {service.icon}
          </div>
          <div className="connector-card-info">
            <div className="connector-card-name">{service.name}</div>
            <div className="connector-card-desc">{service.description}</div>
          </div>
        </div>

        <div className="connector-card-right">
          {!service.enabled ? (
            <span className="connector-coming-soon">Bientot disponible</span>
          ) : (
            <>
              <div className={`connector-status ${isActive ? 'active' : 'inactive'}`}>
                <span className="connector-status-dot" />
                {isActive ? 'Connecte' : connector ? 'Configure' : 'Non configure'}
              </div>
              <span className={`connector-expand-icon${expanded ? ' expanded' : ''}`}>
                &#x25BC;
              </span>
            </>
          )}
        </div>
      </div>

      {service.enabled && expanded && service.id === 'jira' && (
        <JiraForm connector={connector} onSaved={onSaved} onDeleted={onDeleted} />
      )}
    </div>
  );
}

// ==================== Main Page Component ====================

interface ConnectorsPageProps {
  onBack: () => void;
}

export function ConnectorsPage({ onBack }: ConnectorsPageProps) {
  const [connectors, setConnectors] = useState<ConnectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConnectors = useCallback(async () => {
    try {
      const data = await fetchConnectors();
      setConnectors(data);
      setError('');
    } catch {
      setError('Impossible de charger les connecteurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnectors();
  }, [loadConnectors]);

  const getConnectorForService = (serviceId: string): ConnectorData | null => {
    return connectors.find(c => c.service === serviceId) || null;
  };

  if (loading) {
    return (
      <div className="connectors-page">
        <div className="connector-loading" style={{ justifyContent: 'center', padding: 'var(--spacing-3xl)' }}>
          <span className="connector-spinner" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="connectors-page">
      <div className="connectors-header">
        <button className="connectors-back" onClick={onBack}>
          &#x2190; Retour
        </button>
        <h1 className="connectors-title">Connecteurs</h1>
      </div>

      <p className="connectors-subtitle">
        Configurez vos connexions aux services externes. Les identifiants sont stockes par utilisateur.
      </p>

      {error && <div className="connectors-error">{error}</div>}

      <div className="connectors-list">
        {SERVICES.map(service => (
          <ConnectorCard
            key={service.id}
            service={service}
            connector={getConnectorForService(service.id)}
            onSaved={loadConnectors}
            onDeleted={loadConnectors}
          />
        ))}
      </div>
    </div>
  );
}

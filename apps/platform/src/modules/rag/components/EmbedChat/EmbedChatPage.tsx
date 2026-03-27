import { useParams } from 'react-router-dom';
import { EmbedChat } from './EmbedChat.js';

export default function EmbedChatPage() {
  const { uuid } = useParams<{ uuid: string }>();
  if (!uuid) return <div style={{ padding: '2rem', textAlign: 'center' }}>UUID manquant</div>;
  return <EmbedChat uuid={uuid} />;
}

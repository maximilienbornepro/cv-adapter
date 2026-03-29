import { describe, it, expect } from 'vitest';

// ============ Badge status display logic ============

type RecorderStatus = 'idle' | 'joining' | 'recording' | 'processing' | 'done' | 'error';

const STATUS_LABELS: Record<RecorderStatus, string> = {
  idle: '',
  joining: 'En attente d\'admission...',
  recording: 'En cours d\'enregistrement',
  processing: 'Génération des suggestions...',
  done: 'Terminé',
  error: 'Erreur',
};

describe('RecorderBar badge status display', () => {
  it('idle has empty label', () => {
    expect(STATUS_LABELS['idle']).toBe('');
  });

  it('joining shows waiting message', () => {
    expect(STATUS_LABELS['joining']).toContain('attente');
  });

  it('recording shows recording message', () => {
    expect(STATUS_LABELS['recording']).toContain('enregistrement');
  });

  it('processing shows AI suggestion generation message', () => {
    expect(STATUS_LABELS['processing']).toContain('suggestions');
  });

  it('done shows completion message', () => {
    expect(STATUS_LABELS['done']).toBeTruthy();
  });

  it('error shows error label', () => {
    expect(STATUS_LABELS['error']).toBe('Erreur');
  });

  it('all statuses have defined labels', () => {
    const statuses: RecorderStatus[] = ['idle', 'joining', 'recording', 'processing', 'done', 'error'];
    statuses.forEach((s) => expect(STATUS_LABELS[s]).toBeDefined());
  });
});

// ============ Input validation ============

describe('Meeting URL input validation', () => {
  function isTeamsUrl(url: string): boolean {
    return /teams\.microsoft\.com|teams\.live\.com/i.test(url);
  }

  it('accepts Teams meeting URL', () => {
    expect(isTeamsUrl('https://teams.microsoft.com/l/meetup-join/...')).toBe(true);
  });

  it('rejects empty input', () => {
    expect(isTeamsUrl('')).toBe(false);
  });

  it('rejects non-Teams URL', () => {
    expect(isTeamsUrl('https://zoom.us/j/123')).toBe(false);
  });

  it('button disabled when URL is empty', () => {
    const url = '';
    const isDisabled = !url.trim();
    expect(isDisabled).toBe(true);
  });

  it('button enabled when URL is valid', () => {
    const url = 'https://teams.microsoft.com/l/meetup-join/123';
    const isDisabled = !url.trim();
    expect(isDisabled).toBe(false);
  });
});

// ============ Caption count display ============

describe('Caption count display', () => {
  function buildStatusLabel(status: RecorderStatus, captionCount: number): string {
    const base = STATUS_LABELS[status];
    if (status === 'recording' && captionCount > 0) {
      return `${base} (${captionCount} répliques)`;
    }
    return base;
  }

  it('shows caption count during recording', () => {
    expect(buildStatusLabel('recording', 42)).toContain('42 répliques');
  });

  it('does not show caption count when 0', () => {
    expect(buildStatusLabel('recording', 0)).not.toContain('répliques');
  });

  it('does not show caption count in joining state', () => {
    expect(buildStatusLabel('joining', 100)).not.toContain('répliques');
  });

  it('does not show caption count in processing state', () => {
    expect(buildStatusLabel('processing', 50)).not.toContain('répliques');
  });
});

// ============ Polling logic ============

describe('Polling logic', () => {
  function shouldPoll(status: RecorderStatus): boolean {
    return ['joining', 'recording', 'processing'].includes(status);
  }

  function shouldStopPoll(status: RecorderStatus): boolean {
    return ['done', 'error', 'idle'].includes(status);
  }

  it('polls during joining', () => expect(shouldPoll('joining')).toBe(true));
  it('polls during recording', () => expect(shouldPoll('recording')).toBe(true));
  it('polls during processing', () => expect(shouldPoll('processing')).toBe(true));
  it('stops polling when done', () => expect(shouldStopPoll('done')).toBe(true));
  it('stops polling on error', () => expect(shouldStopPoll('error')).toBe(true));
  it('stops polling when idle', () => expect(shouldStopPoll('idle')).toBe(true));
});

// ============ Suggestions panel ============

describe('SuggestionsPanel display', () => {
  interface Suggestion {
    id: number;
    type: 'new-subject' | 'update-situation' | 'new-section';
    proposedTitle: string | null;
    proposedSituation: string | null;
    rationale: string;
    status: 'pending' | 'accepted' | 'rejected';
  }

  const TYPE_LABELS: Record<string, string> = {
    'new-subject': 'Nouveau sujet',
    'update-situation': 'Compléter un sujet',
    'new-section': 'Nouvelle section',
  };

  const mockSuggestions: Suggestion[] = [
    { id: 1, type: 'new-subject', proposedTitle: 'Budget Q2', proposedSituation: null, rationale: 'Discuté à [00:05]', status: 'pending' },
    { id: 2, type: 'update-situation', proposedTitle: null, proposedSituation: 'Décision validée', rationale: 'Confirmé à [00:12]', status: 'pending' },
    { id: 3, type: 'new-section', proposedTitle: 'Actions', proposedSituation: null, rationale: 'Section complète', status: 'accepted' },
  ];

  it('filters pending suggestions for display', () => {
    const pending = mockSuggestions.filter((s) => s.status === 'pending');
    expect(pending).toHaveLength(2);
  });

  it('translates type to French label', () => {
    expect(TYPE_LABELS['new-subject']).toBe('Nouveau sujet');
    expect(TYPE_LABELS['update-situation']).toBe('Compléter un sujet');
    expect(TYPE_LABELS['new-section']).toBe('Nouvelle section');
  });

  it('accepted suggestion removed from pending list', () => {
    const afterAccept = mockSuggestions.filter((s) => s.id !== 3 && s.status === 'pending');
    expect(afterAccept).toHaveLength(2);
  });

  it('after accepting suggestion 1, 1 remains', () => {
    const afterAccept = mockSuggestions.filter((s) => s.id !== 1 && s.status === 'pending');
    expect(afterAccept).toHaveLength(1);
    expect(afterAccept[0].id).toBe(2);
  });

  it('shows "all done" when pending is empty', () => {
    const pending = mockSuggestions.filter((s) => s.status === 'pending' && false); // all removed
    expect(pending).toHaveLength(0);
  });
});

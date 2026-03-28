import { describe, it, expect } from 'vitest';

// ============ Teams URL validation ============

function isValidTeamsUrl(url: string): boolean {
  return /teams\.microsoft\.com|teams\.live\.com/i.test(url);
}

describe('Teams URL validation', () => {
  it('accepts standard Teams meeting link', () => {
    expect(isValidTeamsUrl('https://teams.microsoft.com/l/meetup-join/19%3a...')).toBe(true);
  });

  it('accepts Teams Live link', () => {
    expect(isValidTeamsUrl('https://teams.live.com/meet/abc123')).toBe(true);
  });

  it('rejects Zoom link', () => {
    expect(isValidTeamsUrl('https://zoom.us/j/123456789')).toBe(false);
  });

  it('rejects Google Meet link', () => {
    expect(isValidTeamsUrl('https://meet.google.com/abc-defg-hij')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidTeamsUrl('')).toBe(false);
  });

  it('rejects arbitrary URL', () => {
    expect(isValidTeamsUrl('https://example.com/meeting/123')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isValidTeamsUrl('https://TEAMS.MICROSOFT.COM/l/meetup-join/...')).toBe(true);
  });
});

// ============ VTT parsing ============

interface Caption { speaker: string; text: string }

function parseVtt(vtt: string): Caption[] {
  const result: Caption[] = [];
  const seen = new Set<string>();

  const lines = vtt.split('\n');
  for (const line of lines) {
    const match = line.match(/<v ([^>]+)>([^<]+)<\/v>/);
    if (!match) continue;

    const speaker = match[1].trim();
    const text = match[2].trim();
    if (!text) continue;

    const key = `${speaker}:${text}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({ speaker, text });
  }
  return result;
}

describe('VTT parsing', () => {
  const sampleVtt = `WEBVTT

00:00:01.000 --> 00:00:04.500
<v Alice>Bonjour tout le monde, on peut commencer.</v>

00:00:05.000 --> 00:00:08.200
<v Bob>Oui, j'ai préparé le compte-rendu.</v>

00:00:10.000 --> 00:00:12.000
<v Alice>Merci Bob.</v>`;

  it('extracts all captions', () => {
    const captions = parseVtt(sampleVtt);
    expect(captions).toHaveLength(3);
  });

  it('extracts speaker names', () => {
    const captions = parseVtt(sampleVtt);
    const speakers = captions.map((c) => c.speaker);
    expect(speakers).toContain('Alice');
    expect(speakers).toContain('Bob');
  });

  it('extracts text content', () => {
    const captions = parseVtt(sampleVtt);
    expect(captions[0].text).toBe('Bonjour tout le monde, on peut commencer.');
  });

  it('deduplicates identical speaker+text pairs', () => {
    const dupVtt = `WEBVTT\n\n<v Alice>Bonjour.</v>\n\n<v Alice>Bonjour.</v>`;
    const captions = parseVtt(dupVtt);
    expect(captions).toHaveLength(1);
  });

  it('returns empty array for empty VTT', () => {
    expect(parseVtt('WEBVTT\n\n')).toHaveLength(0);
  });

  it('returns empty array for non-VTT content', () => {
    expect(parseVtt('plain text no captions')).toHaveLength(0);
  });
});

// ============ Transcript grouping by speaker ============

interface CaptionEntry { speaker: string; text: string; timestamp: number }

function groupBySpeaker(transcript: CaptionEntry[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const entry of transcript) {
    if (!groups[entry.speaker]) groups[entry.speaker] = [];
    groups[entry.speaker].push(entry.text);
  }
  return groups;
}

describe('Transcript grouping', () => {
  const transcript: CaptionEntry[] = [
    { speaker: 'Alice', text: 'Bonjour', timestamp: 1000 },
    { speaker: 'Bob', text: 'Salut', timestamp: 3000 },
    { speaker: 'Alice', text: 'Comment ça va ?', timestamp: 5000 },
    { speaker: 'Bob', text: 'Bien merci', timestamp: 7000 },
  ];

  it('groups captions by speaker', () => {
    const groups = groupBySpeaker(transcript);
    expect(Object.keys(groups)).toHaveLength(2);
    expect(groups['Alice']).toHaveLength(2);
    expect(groups['Bob']).toHaveLength(2);
  });

  it('preserves text order per speaker', () => {
    const groups = groupBySpeaker(transcript);
    expect(groups['Alice'][0]).toBe('Bonjour');
    expect(groups['Alice'][1]).toBe('Comment ça va ?');
  });

  it('returns empty object for empty transcript', () => {
    expect(Object.keys(groupBySpeaker([]))).toHaveLength(0);
  });
});

// ============ Suggestions parsing (mirrors suggestionsService.ts) ============

interface RawSuggestion {
  type: string;
  proposedTitle?: string;
  proposedSituation?: string;
  rationale: string;
}

function parseSuggestions(text: string): RawSuggestion[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s: any) =>
        typeof s === 'object' &&
        s !== null &&
        ['new-subject', 'update-situation', 'new-section'].includes(s.type) &&
        typeof s.rationale === 'string'
    );
  } catch {
    return [];
  }
}

describe('AI suggestions parsing', () => {
  it('parses valid JSON array from LLM response', () => {
    const json = JSON.stringify([
      { type: 'new-subject', proposedTitle: 'Budget Q2', rationale: 'Discuté à [00:05]' },
      { type: 'update-situation', proposedSituation: 'Validé en réunion', rationale: 'Décision prise à [00:15]' },
    ]);
    const suggestions = parseSuggestions(json);
    expect(suggestions).toHaveLength(2);
  });

  it('extracts JSON even with LLM preamble text', () => {
    const text = `Voici les suggestions basées sur la transcription :\n[{"type":"new-subject","proposedTitle":"Test","rationale":"Raison"}]`;
    const suggestions = parseSuggestions(text);
    expect(suggestions).toHaveLength(1);
  });

  it('filters out entries with invalid type', () => {
    const json = JSON.stringify([
      { type: 'new-subject', rationale: 'OK' },
      { type: 'invalid-type', rationale: 'KO' },
    ]);
    const suggestions = parseSuggestions(json);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].type).toBe('new-subject');
  });

  it('filters out entries without rationale', () => {
    const json = JSON.stringify([
      { type: 'new-subject' },
      { type: 'new-section', rationale: 'Has rationale' },
    ]);
    const suggestions = parseSuggestions(json);
    expect(suggestions).toHaveLength(1);
  });

  it('returns empty array when no JSON found', () => {
    expect(parseSuggestions('no json here')).toHaveLength(0);
    expect(parseSuggestions('')).toHaveLength(0);
  });

  it('returns empty array for malformed JSON', () => {
    expect(parseSuggestions('[bad json')).toHaveLength(0);
  });

  it('accepts all three valid types', () => {
    const json = JSON.stringify([
      { type: 'new-subject', rationale: 'R' },
      { type: 'update-situation', rationale: 'R' },
      { type: 'new-section', rationale: 'R' },
    ]);
    const suggestions = parseSuggestions(json);
    expect(suggestions).toHaveLength(3);
  });
});

// ============ Recording status machine ============

type RecordingStatus = 'joining' | 'recording' | 'processing' | 'done' | 'error';

function isTerminalStatus(status: RecordingStatus): boolean {
  return status === 'done' || status === 'error';
}

function isActiveStatus(status: RecordingStatus): boolean {
  return ['joining', 'recording', 'processing'].includes(status);
}

describe('Recording status machine', () => {
  it('done is terminal', () => expect(isTerminalStatus('done')).toBe(true));
  it('error is terminal', () => expect(isTerminalStatus('error')).toBe(true));
  it('joining is not terminal', () => expect(isTerminalStatus('joining')).toBe(false));
  it('recording is not terminal', () => expect(isTerminalStatus('recording')).toBe(false));

  it('joining is active', () => expect(isActiveStatus('joining')).toBe(true));
  it('recording is active', () => expect(isActiveStatus('recording')).toBe(true));
  it('processing is active', () => expect(isActiveStatus('processing')).toBe(true));
  it('done is not active', () => expect(isActiveStatus('done')).toBe(false));
  it('error is not active', () => expect(isActiveStatus('error')).toBe(false));
});

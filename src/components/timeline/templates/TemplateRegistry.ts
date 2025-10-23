import { ProjectTemplate } from '../types';

export const TEMPLATES: Record<string, ProjectTemplate> = {
  film: {
    type: 'film',
    name: 'Spielfilm',
    description: 'Klassische 3-Akt-Struktur für Spielfilme',
    defaultStructure: {
      actCount: 3,
      sequencesPerAct: 3,
      scenesPerSequence: 4,
      shotsPerScene: 5,
    },
    customLabels: {
      act: 'Akt',
      sequence: 'Sequenz',
      scene: 'Szene',
      shot: 'Shot',
    },
  },
  series: {
    type: 'series',
    name: 'TV-Serie',
    description: 'Episodenstruktur für TV-Serien',
    defaultStructure: {
      actCount: 1, // Season
      sequencesPerAct: 8, // Episodes
      scenesPerSequence: 10,
      shotsPerScene: 5,
    },
    customLabels: {
      act: 'Staffel',
      sequence: 'Episode',
      scene: 'Szene',
      shot: 'Shot',
    },
  },
  audiobook: {
    type: 'audiobook',
    name: 'Hörbuch',
    description: 'Kapitelstruktur für Hörbücher',
    defaultStructure: {
      actCount: 1, // Book
      sequencesPerAct: 10, // Chapters
      scenesPerSequence: 5, // Sections
      shotsPerScene: 0, // No shots in audiobooks
    },
    customLabels: {
      act: 'Buch',
      sequence: 'Kapitel',
      scene: 'Abschnitt',
      shot: 'Paragraph',
    },
  },
  book: {
    type: 'book',
    name: 'Roman',
    description: 'Kapitelstruktur für Romane',
    defaultStructure: {
      actCount: 3, // Parts
      sequencesPerAct: 5, // Chapters per part
      scenesPerSequence: 8, // Scenes per chapter
      shotsPerScene: 0, // No shots
    },
    customLabels: {
      act: 'Teil',
      sequence: 'Kapitel',
      scene: 'Szene',
      shot: 'Absatz',
    },
  },
  theater: {
    type: 'theater',
    name: 'Theaterstück',
    description: 'Aktstruktur für Theaterstücke',
    defaultStructure: {
      actCount: 3,
      sequencesPerAct: 4, // Scenes per act
      scenesPerSequence: 0, // No deeper hierarchy
      shotsPerScene: 0,
    },
    customLabels: {
      act: 'Akt',
      sequence: 'Szene',
      scene: 'Auftritt',
      shot: 'Moment',
    },
  },
};

export function getTemplate(type: string): ProjectTemplate {
  return TEMPLATES[type] || TEMPLATES.film;
}

export function getTemplateList(): ProjectTemplate[] {
  return Object.values(TEMPLATES);
}

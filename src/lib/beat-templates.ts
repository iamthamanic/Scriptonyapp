import type { BeatCardData } from '../components/BeatCard';

/**
 * 🎬 STORY BEAT TEMPLATES
 * 
 * Vordefinierte Beat-Templates für verschiedene Erzählstrukturen:
 * - Lite-7: Minimales Template (7 Beats)
 * - Save the Cat: Blake Snyder's 15 Beats
 * - Hero's Journey: Joseph Campbell (12 Stages)
 * - Syd Field: Paradigm (3-Act)
 * - Seven Point: Dan Wells (7 Points)
 */

export interface BeatTemplate {
  id: string;
  name: string;
  abbr: string;
  description: string;
  beats: Omit<BeatCardData, 'id'>[];
}

// LITE-7: Minimales Template für schnelles Prototyping
export const LITE_7_TEMPLATE: BeatTemplate = {
  id: 'lite-7',
  name: 'Lite-7 (minimal)',
  abbr: 'L7',
  description: 'Minimales 7-Beat-Template für schnelles Story-Prototyping',
  beats: [
    {
      label: 'Hook',
      templateAbbr: 'L7',
      pctFrom: 0,
      pctTo: 1,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Inciting Incident',
      templateAbbr: 'L7',
      pctFrom: 10,
      pctTo: 12,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Crisis / Point of No Return',
      templateAbbr: 'L7',
      pctFrom: 20,
      pctTo: 25,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Midpoint',
      templateAbbr: 'L7',
      pctFrom: 50,
      pctTo: 50,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'All is Lost',
      templateAbbr: 'L7',
      pctFrom: 75,
      pctTo: 75,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Climax',
      templateAbbr: 'L7',
      pctFrom: 90,
      pctTo: 95,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Resolution',
      templateAbbr: 'L7',
      pctFrom: 100,
      pctTo: 100,
      color: '#AB97D4',
      items: [],
    },
  ],
};

// SAVE THE CAT: Blake Snyder's 15 Beats
export const SAVE_THE_CAT_TEMPLATE: BeatTemplate = {
  id: 'save-the-cat',
  name: 'Save the Cat! (15 Beats)',
  abbr: 'STC',
  description: 'Blake Snyder\'s klassisches 15-Beat-Template',
  beats: [
    {
      label: 'Opening Image',
      templateAbbr: 'STC',
      pctFrom: 0,
      pctTo: 1,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Theme Stated',
      templateAbbr: 'STC',
      pctFrom: 5,
      pctTo: 5,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Setup',
      templateAbbr: 'STC',
      pctFrom: 1,
      pctTo: 10,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Catalyst',
      templateAbbr: 'STC',
      pctFrom: 10,
      pctTo: 12,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Debate',
      templateAbbr: 'STC',
      pctFrom: 12,
      pctTo: 20,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Break into Two',
      templateAbbr: 'STC',
      pctFrom: 20,
      pctTo: 25,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'B Story',
      templateAbbr: 'STC',
      pctFrom: 22,
      pctTo: 22,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Fun and Games',
      templateAbbr: 'STC',
      pctFrom: 25,
      pctTo: 50,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Midpoint',
      templateAbbr: 'STC',
      pctFrom: 50,
      pctTo: 50,
      color: '#6B5794',
      items: [],
    },
    {
      label: 'Bad Guys Close In',
      templateAbbr: 'STC',
      pctFrom: 50,
      pctTo: 75,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'All is Lost',
      templateAbbr: 'STC',
      pctFrom: 75,
      pctTo: 75,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Dark Night of the Soul',
      templateAbbr: 'STC',
      pctFrom: 75,
      pctTo: 80,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Break into Three',
      templateAbbr: 'STC',
      pctFrom: 80,
      pctTo: 80,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Finale',
      templateAbbr: 'STC',
      pctFrom: 80,
      pctTo: 99,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Final Image',
      templateAbbr: 'STC',
      pctFrom: 99,
      pctTo: 100,
      color: '#AB97D4',
      items: [],
    },
  ],
};

// HERO'S JOURNEY: Joseph Campbell (12 Stages)
export const HEROES_JOURNEY_TEMPLATE: BeatTemplate = {
  id: 'heroes-journey',
  name: 'Hero\'s Journey (12 Stages)',
  abbr: 'HJ',
  description: 'Joseph Campbell\'s Heldenreise (adaptiert von Christopher Vogler)',
  beats: [
    {
      label: 'Ordinary World',
      templateAbbr: 'HJ',
      pctFrom: 0,
      pctTo: 10,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Call to Adventure',
      templateAbbr: 'HJ',
      pctFrom: 10,
      pctTo: 12,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Refusal of the Call',
      templateAbbr: 'HJ',
      pctFrom: 12,
      pctTo: 15,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Meeting the Mentor',
      templateAbbr: 'HJ',
      pctFrom: 15,
      pctTo: 20,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Crossing the Threshold',
      templateAbbr: 'HJ',
      pctFrom: 20,
      pctTo: 25,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Tests, Allies, Enemies',
      templateAbbr: 'HJ',
      pctFrom: 25,
      pctTo: 50,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Approach to Inmost Cave',
      templateAbbr: 'HJ',
      pctFrom: 50,
      pctTo: 55,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Ordeal',
      templateAbbr: 'HJ',
      pctFrom: 55,
      pctTo: 65,
      color: '#6B5794',
      items: [],
    },
    {
      label: 'Reward',
      templateAbbr: 'HJ',
      pctFrom: 65,
      pctTo: 75,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'The Road Back',
      templateAbbr: 'HJ',
      pctFrom: 75,
      pctTo: 85,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Resurrection',
      templateAbbr: 'HJ',
      pctFrom: 85,
      pctTo: 95,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Return with Elixir',
      templateAbbr: 'HJ',
      pctFrom: 95,
      pctTo: 100,
      color: '#AB97D4',
      items: [],
    },
  ],
};

// SYD FIELD: Paradigm (3-Act Structure)
export const SYD_FIELD_TEMPLATE: BeatTemplate = {
  id: 'syd-field',
  name: 'Syd Field / Paradigm',
  abbr: 'FLD',
  description: 'Klassische 3-Akt-Struktur nach Syd Field',
  beats: [
    {
      label: 'Setup',
      templateAbbr: 'FLD',
      pctFrom: 0,
      pctTo: 25,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Plot Point 1',
      templateAbbr: 'FLD',
      pctFrom: 25,
      pctTo: 25,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Confrontation (Act 2A)',
      templateAbbr: 'FLD',
      pctFrom: 25,
      pctTo: 50,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Midpoint',
      templateAbbr: 'FLD',
      pctFrom: 50,
      pctTo: 50,
      color: '#6B5794',
      items: [],
    },
    {
      label: 'Confrontation (Act 2B)',
      templateAbbr: 'FLD',
      pctFrom: 50,
      pctTo: 75,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Plot Point 2',
      templateAbbr: 'FLD',
      pctFrom: 75,
      pctTo: 75,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Resolution',
      templateAbbr: 'FLD',
      pctFrom: 75,
      pctTo: 100,
      color: '#9B87C4',
      items: [],
    },
  ],
};

// SEVEN POINT STRUCTURE: Dan Wells
export const SEVEN_POINT_TEMPLATE: BeatTemplate = {
  id: 'seven-point',
  name: 'Seven-Point Structure',
  abbr: '7PT',
  description: 'Dan Wells\' 7-Punkt-Struktur',
  beats: [
    {
      label: 'Hook',
      templateAbbr: '7PT',
      pctFrom: 0,
      pctTo: 1,
      color: '#9B87C4',
      items: [],
    },
    {
      label: 'Plot Turn 1',
      templateAbbr: '7PT',
      pctFrom: 20,
      pctTo: 25,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Pinch Point 1',
      templateAbbr: '7PT',
      pctFrom: 37,
      pctTo: 37,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Midpoint',
      templateAbbr: '7PT',
      pctFrom: 50,
      pctTo: 50,
      color: '#6B5794',
      items: [],
    },
    {
      label: 'Pinch Point 2',
      templateAbbr: '7PT',
      pctFrom: 62,
      pctTo: 62,
      color: '#7B67A4',
      items: [],
    },
    {
      label: 'Plot Turn 2',
      templateAbbr: '7PT',
      pctFrom: 75,
      pctTo: 80,
      color: '#8B77B4',
      items: [],
    },
    {
      label: 'Resolution',
      templateAbbr: '7PT',
      pctFrom: 100,
      pctTo: 100,
      color: '#AB97D4',
      items: [],
    },
  ],
};

// Template Registry
export const BEAT_TEMPLATES: Record<string, BeatTemplate> = {
  'lite-7': LITE_7_TEMPLATE,
  'save-the-cat': SAVE_THE_CAT_TEMPLATE,
  'heroes-journey': HEROES_JOURNEY_TEMPLATE,
  'syd-field': SYD_FIELD_TEMPLATE,
  'seven-point': SEVEN_POINT_TEMPLATE,
};

// Helper: Generate Beats with unique IDs
export function generateBeatsFromTemplate(template: BeatTemplate): BeatCardData[] {
  return template.beats.map((beat, index) => ({
    ...beat,
    id: `${template.id}-beat-${index + 1}`,
  }));
}

// Helper: Get all template options for Select
export function getAllTemplateOptions() {
  return Object.values(BEAT_TEMPLATES).map(template => ({
    value: template.id,
    label: template.name,
    abbr: template.abbr,
  }));
}

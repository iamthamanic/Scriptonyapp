// Timeline Hierarchy Types
export interface TimelineShot {
  id: string;
  shot_number: number;
  name: string;
  description?: string;
  camera_movement?: string;
  duration?: number;
  scene_id: string;
  project_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimelineScene {
  id: string;
  scene_number: number;
  name: string;
  description?: string;
  location?: string;
  sequence_id: string;
  project_id: string;
  shots: TimelineShot[];
  created_at?: string;
  updated_at?: string;
}

export interface TimelineSequence {
  id: string;
  sequence_number: number;
  name: string;
  description?: string;
  act_id: string;
  project_id: string;
  scenes: TimelineScene[];
  created_at?: string;
  updated_at?: string;
}

export interface TimelineAct {
  id: string;
  act_number: number;
  name: string;
  description?: string;
  project_id: string;
  sequences: TimelineSequence[];
  created_at?: string;
  updated_at?: string;
}

// UI State Types
export interface CollapseState {
  acts: Record<string, boolean>;
  sequences: Record<string, boolean>;
  scenes: Record<string, boolean>;
  shots: Record<string, boolean>;
}

// Project Template Types
export type ProjectType = 'film' | 'series' | 'audiobook' | 'book' | 'theater';

export interface ProjectTemplate {
  type: ProjectType;
  name: string;
  description: string;
  defaultStructure: {
    actCount: number;
    sequencesPerAct?: number;
    scenesPerSequence?: number;
    shotsPerScene?: number;
  };
  customLabels?: {
    act?: string;
    sequence?: string;
    scene?: string;
    shot?: string;
  };
}

// Timeline View Props
export interface TimelineViewProps {
  projectId: string;
  projectType: ProjectType;
  onActAdd?: (actNumber: number) => void;
  onSequenceAdd?: (actId: string, sequenceNumber: number) => void;
  onSceneAdd?: (sequenceId: string, sceneNumber: number) => void;
  onShotAdd?: (sceneId: string, shotNumber: number) => void;
}

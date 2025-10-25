/**
 * Timeline API Client
 * Handles API calls for Acts, Sequences, and Scenes
 */

import { supabaseConfig } from '../env';
import { API_CONFIG } from '../config';
import type { Act, Sequence, Scene } from '../types';

const API_BASE_URL = `${supabaseConfig.url}/functions/v1${API_CONFIG.SERVER_BASE_PATH}`;

// =============================================================================
// ACTS
// =============================================================================

export async function getActs(projectId: string, token: string): Promise<Act[]> {
  const response = await fetch(`${API_BASE_URL}/acts?project_id=${projectId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch acts: ${response.statusText}`);
  }

  return response.json();
}

export async function createAct(
  projectId: string,
  actData: Partial<Act>,
  token: string
): Promise<Act> {
  const response = await fetch(`${API_BASE_URL}/acts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_id: projectId,
      ...actData,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create act: ${response.statusText}`);
  }

  return response.json();
}

export async function updateAct(
  actId: string,
  updates: Partial<Act>,
  token: string
): Promise<Act> {
  const response = await fetch(`${API_BASE_URL}/acts/${actId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update act: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteAct(actId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/acts/${actId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete act: ${response.statusText}`);
  }
}

export async function reorderActs(
  projectId: string,
  actIds: string[],
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/acts/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project_id: projectId,
      act_ids: actIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder acts: ${response.statusText}`);
  }
}

// =============================================================================
// SEQUENCES
// =============================================================================

export async function getSequences(actId: string, token: string): Promise<Sequence[]> {
  const response = await fetch(`${API_BASE_URL}/sequences/${actId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sequences: ${response.statusText}`);
  }

  return response.json();
}

export async function createSequence(
  actId: string,
  sequenceData: Partial<Sequence>,
  token: string
): Promise<Sequence> {
  // Transform camelCase to snake_case for backend
  const backendData: any = {
    act_id: actId,
  };
  
  if (sequenceData.sequenceNumber !== undefined) {
    backendData.sequence_number = sequenceData.sequenceNumber;
  }
  if (sequenceData.title !== undefined) {
    backendData.title = sequenceData.title;
  }
  if (sequenceData.description !== undefined) {
    backendData.description = sequenceData.description;
  }
  if (sequenceData.color !== undefined) {
    backendData.color = sequenceData.color;
  }

  const response = await fetch(`${API_BASE_URL}/sequences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create sequence: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSequence(
  sequenceId: string,
  updates: Partial<Sequence>,
  token: string
): Promise<Sequence> {
  // Transform camelCase to snake_case for backend
  const backendUpdates: any = {};
  
  if (updates.sequenceNumber !== undefined) {
    backendUpdates.sequence_number = updates.sequenceNumber;
  }
  if (updates.title !== undefined) {
    backendUpdates.title = updates.title;
  }
  if (updates.description !== undefined) {
    backendUpdates.description = updates.description;
  }
  if (updates.color !== undefined) {
    backendUpdates.color = updates.color;
  }

  const response = await fetch(`${API_BASE_URL}/sequences/${sequenceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendUpdates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update sequence: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteSequence(sequenceId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sequences/${sequenceId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete sequence: ${response.statusText}`);
  }
}

export async function reorderSequences(
  actId: string,
  sequenceIds: string[],
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/sequences/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      act_id: actId,
      sequence_ids: sequenceIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder sequences: ${response.statusText}`);
  }
}

// =============================================================================
// SCENES
// =============================================================================

export async function getScenes(sequenceId: string, token: string): Promise<Scene[]> {
  const response = await fetch(`${API_BASE_URL}/scenes/${sequenceId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scenes: ${response.statusText}`);
  }

  return response.json();
}

export async function createScene(
  sequenceId: string,
  sceneData: Partial<Scene>,
  token: string
): Promise<Scene> {
  // Transform camelCase to snake_case for backend
  const backendData: any = {
    sequence_id: sequenceId,
  };
  
  // Map number to scene_number (required field)
  if (sceneData.number !== undefined) {
    backendData.scene_number = sceneData.number;
  }
  if (sceneData.title !== undefined) {
    backendData.title = sceneData.title;
  }
  if (sceneData.description !== undefined) {
    backendData.description = sceneData.description;
  }
  if (sceneData.location !== undefined) {
    backendData.location = sceneData.location;
  }
  if (sceneData.timeOfDay !== undefined) {
    backendData.time_of_day = sceneData.timeOfDay;
  }

  const response = await fetch(`${API_BASE_URL}/scenes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create scene: ${response.statusText}`);
  }

  return response.json();
}

export async function updateScene(
  sceneId: string,
  updates: Partial<Scene>,
  token: string
): Promise<Scene> {
  // Transform camelCase to snake_case for backend
  const backendUpdates: any = {};
  
  if (updates.number !== undefined) {
    backendUpdates.scene_number = updates.number;
  }
  if (updates.title !== undefined) {
    backendUpdates.title = updates.title;
  }
  if (updates.description !== undefined) {
    backendUpdates.description = updates.description;
  }
  if (updates.location !== undefined) {
    backendUpdates.location = updates.location;
  }
  if (updates.timeOfDay !== undefined) {
    backendUpdates.time_of_day = updates.timeOfDay;
  }

  const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(backendUpdates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update scene: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteScene(sceneId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete scene: ${response.statusText}`);
  }
}

export async function reorderScenes(
  sequenceId: string,
  sceneIds: string[],
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/scenes/reorder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sequence_id: sequenceId,
      scene_ids: sceneIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder scenes: ${response.statusText}`);
  }
}

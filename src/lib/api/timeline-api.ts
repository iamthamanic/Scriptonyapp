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
  const response = await fetch(`${API_BASE_URL}/sequences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      act_id: actId,
      ...sequenceData,
    }),
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
  const response = await fetch(`${API_BASE_URL}/sequences/${sequenceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
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
  const response = await fetch(`${API_BASE_URL}/scenes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sequence_id: sequenceId,
      ...sceneData,
    }),
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
  const response = await fetch(`${API_BASE_URL}/scenes/${sceneId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
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

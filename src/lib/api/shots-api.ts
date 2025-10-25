/**
 * Shot API Client
 * 
 * Helper functions for Shot CRUD operations, file uploads, and character management.
 */

import { supabaseConfig } from '../env';
import { API_CONFIG } from '../config';
import type { Shot, ShotAudio } from '../types';

const API_BASE = `${supabaseConfig.url}/functions/v1${API_CONFIG.SERVER_BASE_PATH}`;

// =============================================================================
// SHOT CRUD
// =============================================================================

export async function getShots(sceneId: string, accessToken: string): Promise<Shot[]> {
  const response = await fetch(`${API_BASE}/shots/${sceneId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch shots: ${response.statusText}`);
  }

  const { shots } = await response.json();
  return shots;
}

export async function createShot(
  sceneId: string,
  shotData: Partial<Shot>,
  accessToken: string
): Promise<Shot> {
  console.log('[Shots API] Creating shot:', { sceneId, shotData });
  
  const response = await fetch(`${API_BASE}/shots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      scene_id: sceneId,
      ...shotData,
    }),
  });

  console.log('[Shots API] Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Shots API] Error response:', errorText);
    throw new Error(`Failed to create shot: ${response.statusText}`);
  }

  const result = await response.json();
  console.log('[Shots API] Success result:', result);
  const { shot } = result;
  return shot;
}

export async function updateShot(
  shotId: string,
  updates: Partial<Shot>,
  accessToken: string
): Promise<Shot> {
  const response = await fetch(`${API_BASE}/shots/${shotId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update shot: ${response.statusText}`);
  }

  const { shot } = await response.json();
  return shot;
}

export async function deleteShot(shotId: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/shots/${shotId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete shot: ${response.statusText}`);
  }
}

export async function reorderShots(
  sceneId: string,
  shotIds: string[],
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/shots/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      scene_id: sceneId,
      shot_ids: shotIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reorder shots: ${response.statusText}`);
  }
}

// =============================================================================
// FILE UPLOADS
// =============================================================================

export async function uploadShotImage(
  shotId: string,
  file: File,
  accessToken: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/shots/${shotId}/upload-image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }

  const { imageUrl } = await response.json();
  return imageUrl;
}

export async function uploadShotAudio(
  shotId: string,
  file: File,
  type: 'music' | 'sfx',
  label: string | undefined,
  accessToken: string
): Promise<ShotAudio> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (label) {
    formData.append('label', label);
  }

  const response = await fetch(`${API_BASE}/shots/${shotId}/upload-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload audio: ${response.statusText}`);
  }

  const { audio } = await response.json();
  return audio;
}

export async function deleteShotAudio(audioId: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/shots/audio/${audioId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete audio: ${response.statusText}`);
  }
}

// =============================================================================
// CHARACTER MANAGEMENT
// =============================================================================

export async function addCharacterToShot(
  shotId: string,
  characterId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/shots/${shotId}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      character_id: characterId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add character to shot: ${response.statusText}`);
  }
}

export async function removeCharacterFromShot(
  shotId: string,
  characterId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/shots/${shotId}/characters/${characterId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to remove character from shot: ${response.statusText}`);
  }
}

// =============================================================================
// PROJECT INITIALIZATION
// =============================================================================

export async function initializeThreeActStructure(
  projectId: string,
  accessToken: string
): Promise<any> {
  const response = await fetch(`${API_BASE}/projects/${projectId}/init-three-act`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to initialize 3-act structure: ${error.error || response.statusText}`);
  }

  return await response.json();
}

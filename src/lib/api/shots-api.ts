/**
 * Shot API Client
 * 
 * 🚀 MIGRATED TO API GATEWAY + AUDIO MICROSERVICE
 * 
 * Helper functions for Shot CRUD operations, file uploads, and character management.
 * - Shot operations → API Gateway → scriptony-timeline-v2
 * - Audio operations → API Gateway → scriptony-audio
 */

import { apiGet, apiPost, apiPut, apiDelete, unwrapApiResult } from '../api-client';
import type { Shot, ShotAudio } from '../types';
import { projectId } from '../../utils/supabase/info';

// API Base URLs for direct file uploads
const TIMELINE_API_BASE = `https://${projectId}.supabase.co/functions/v1/scriptony-timeline-v2`;
const AUDIO_API_BASE = `https://${projectId}.supabase.co/functions/v1/scriptony-audio`;

// =============================================================================
// SHOT CRUD
// =============================================================================

export async function getShots(sceneId: string, accessToken: string): Promise<Shot[]> {
  const result = await apiGet(`/shots/${sceneId}`);
  const data = unwrapApiResult(result);
  return data?.shots || [];
}

export async function getShot(shotId: string, accessToken: string): Promise<Shot> {
  const result = await apiGet(`/shots/by-id/${shotId}`);
  const data = unwrapApiResult(result);
  return data?.shot || data;
}

export async function createShot(
  sceneId: string,
  shotData: Partial<Shot>,
  accessToken: string
): Promise<Shot> {
  console.log('[Shots API] Creating shot:', { sceneId, shotData });
  
  try {
    const result = await apiPost('/shots', {
      scene_id: sceneId,
      ...shotData,
    });
    
    console.log('[Shots API] Raw result:', result);
    const data = unwrapApiResult(result);
    console.log('[Shots API] Unwrapped data:', data);
    return data?.shot || data;
  } catch (error) {
    console.error('[Shots API] Error creating shot:', {
      sceneId,
      shotData,
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function updateShot(
  shotId: string,
  updates: Partial<Shot>,
  accessToken: string
): Promise<Shot> {
  console.log('[Shots API] updateShot called:', { shotId, updates, updateType: typeof updates });
  const result = await apiPut(`/shots/${shotId}`, updates);
  const data = unwrapApiResult(result);
  return data?.shot || data;
}

export async function deleteShot(shotId: string, accessToken: string): Promise<void> {
  const result = await apiDelete(`/shots/${shotId}`);
  unwrapApiResult(result);
}

export async function reorderShots(
  sceneId: string,
  shotIds: string[],
  accessToken: string
): Promise<void> {
  const result = await apiPost('/shots/reorder', {
    scene_id: sceneId,
    shot_ids: shotIds,
  });
  unwrapApiResult(result);
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

  const response = await fetch(`${TIMELINE_API_BASE}/shots/${shotId}/upload-image`, {
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
  accessToken: string,
  label?: string,
  startTime?: number,
  endTime?: number,
  fadeIn?: number,
  fadeOut?: number
): Promise<ShotAudio> {
  console.log(`[Shots API] Uploading audio to scriptony-audio function:`, { shotId, fileName: file.name, type });
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (label) {
    formData.append('label', label);
  }
  if (startTime !== undefined) {
    formData.append('startTime', startTime.toString());
  }
  if (endTime !== undefined) {
    formData.append('endTime', endTime.toString());
  }
  if (fadeIn !== undefined) {
    formData.append('fadeIn', fadeIn.toString());
  }
  if (fadeOut !== undefined) {
    formData.append('fadeOut', fadeOut.toString());
  }

  const response = await fetch(`${AUDIO_API_BASE}/shots/${shotId}/upload-audio`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Shots API] Audio upload failed:`, { status: response.status, errorText });
    throw new Error(`Failed to upload audio: ${response.statusText}`);
  }

  const { audio } = await response.json();
  console.log(`[Shots API] Audio uploaded successfully:`, audio);
  return audio;
}

export async function updateShotAudio(
  audioId: string,
  updates: { label?: string; startTime?: number; endTime?: number; fadeIn?: number; fadeOut?: number },
  accessToken: string
): Promise<ShotAudio> {
  console.log(`[Shots API] Updating audio via scriptony-audio:`, { audioId, updates });
  
  const response = await fetch(`${AUDIO_API_BASE}/shots/audio/${audioId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Shots API] Audio update failed:`, { status: response.status, errorText });
    throw new Error(`Failed to update audio: ${response.statusText}`);
  }

  const { audio } = await response.json();
  console.log(`[Shots API] Audio updated successfully:`, audio);
  return audio;
}

export async function deleteShotAudio(audioId: string, accessToken: string): Promise<void> {
  console.log(`[Shots API] Deleting audio via scriptony-audio:`, { audioId });
  
  const response = await fetch(`${AUDIO_API_BASE}/shots/audio/${audioId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Shots API] Audio deletion failed:`, { status: response.status, errorText });
    throw new Error(`Failed to delete audio: ${response.statusText}`);
  }
  
  console.log(`[Shots API] Audio deleted successfully`);
}

export async function getShotAudio(shotId: string, accessToken: string): Promise<ShotAudio[]> {
  console.log(`[Shots API] Getting audio for shot via scriptony-audio:`, { shotId });
  
  const response = await fetch(`${AUDIO_API_BASE}/shots/${shotId}/audio`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Shots API] Get shot audio failed:`, { status: response.status, errorText });
    throw new Error(`Failed to get shot audio: ${response.statusText}`);
  }

  const { audio } = await response.json();
  console.log(`[Shots API] Got ${audio?.length || 0} audio files for shot`);
  return audio || [];
}

/**
 * BATCH: Get audio for multiple shots in one request
 * This is much more efficient than calling getShotAudio() for each shot individually
 */
export async function getBatchShotAudio(
  shotIds: string[],
  accessToken: string
): Promise<Record<string, ShotAudio[]>> {
  if (shotIds.length === 0) {
    return {};
  }

  console.log(`[Shots API] BATCH: Getting audio for ${shotIds.length} shots`);
  
  const response = await fetch(
    `${AUDIO_API_BASE}/shots/audio/batch?shot_ids=${shotIds.join(',')}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Shots API] Batch audio fetch failed:`, { status: response.status, errorText });
    throw new Error(`Failed to get batch audio: ${response.statusText}`);
  }

  const { audio } = await response.json();
  console.log(`[Shots API] BATCH: Got audio for ${Object.keys(audio).length} shots`);
  return audio;
}

// =============================================================================
// CHARACTER MANAGEMENT
// =============================================================================

export async function addCharacterToShot(
  shotId: string,
  characterId: string,
  accessToken: string
): Promise<{ id: string; projectId: string; sceneId: string; characters: any[] }> {
  const response = await fetch(`${TIMELINE_API_BASE}/shots/${shotId}/characters`, {
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
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    console.error('[Shots API] Error adding character to shot:', errorData);
    throw new Error(`Failed to add character to shot: ${errorData.error || response.statusText}`);
  }

  const { shot } = await response.json();
  return shot;
}

export async function removeCharacterFromShot(
  shotId: string,
  characterId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${TIMELINE_API_BASE}/shots/${shotId}/characters/${characterId}`, {
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
// BULK LOADERS - Performance Optimized 🚀
// =============================================================================

/**
 * Get ALL shots for a project in ONE API call
 */
export async function getAllShotsByProject(
  projectId: string,
  accessToken: string
): Promise<Shot[]> {
  const result = await apiGet(`/shots?project_id=${projectId}`);
  const data = unwrapApiResult(result);
  return data?.shots || [];
}

// =============================================================================
// PROJECT INITIALIZATION
// =============================================================================

/**
 * Initialize 3-Act Film Structure using V2 Nodes API
 * 
 * Creates:
 * - 3 Acts (Setup, Confrontation, Resolution)
 * - No sequences/scenes initially (user creates them)
 */
export async function initializeThreeActStructure(
  projectId: string,
  accessToken: string
): Promise<any> {
  // Use V2 Nodes API to initialize
  const { initializeProject } = await import('./timeline-api-v2');
  
  const nodes = await initializeProject({
    projectId,
    templateId: 'film-3-act',
    structure: {
      level_1_count: 3, // 3 Acts
    },
    predefinedNodes: {
      level_1: [
        { number: 1, title: 'Akt I - Einführung', description: 'Setup: Protagonist, Welt, Konflikt werden eingeführt' },
        { number: 2, title: 'Akt II - Konfrontation', description: 'Konfrontation: Protagonist kämpft gegen Hindernisse' },
        { number: 3, title: 'Akt III - Auflösung', description: 'Resolution: Konflikt wird gelöst, Ende der Geschichte' },
      ],
    },
  });
  
  return { nodes };
}

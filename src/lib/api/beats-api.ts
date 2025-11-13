/**
 * 🎬 BEATS API CLIENT
 * 
 * API für Story Beats (Save the Cat, Hero's Journey, etc.)
 */

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getAuthToken } from '../auth/getAuthToken';

const BEATS_BASE_URL = `https://${projectId}.supabase.co/functions/v1/scriptony-beats`;

export interface StoryBeat {
  id: string;
  project_id: string;
  user_id: string;
  label: string;
  template_abbr?: string;
  description?: string;
  from_container_id: string;
  to_container_id: string;
  pct_from: number;
  pct_to: number;
  color?: string;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBeatPayload {
  project_id: string;
  label: string;
  template_abbr?: string;
  description?: string;
  from_container_id: string;
  to_container_id: string;
  pct_from?: number;
  pct_to?: number;
  color?: string;
  notes?: string;
  order_index?: number;
}

export interface UpdateBeatPayload {
  label?: string;
  template_abbr?: string;
  description?: string;
  from_container_id?: string;
  to_container_id?: string;
  pct_from?: number;
  pct_to?: number;
  color?: string;
  notes?: string;
  order_index?: number;
}

/**
 * Get all beats for a project
 */
export async function getBeats(projectId: string): Promise<StoryBeat[]> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BEATS_BASE_URL}/beats?project_id=${projectId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch beats');
  }

  const data = await response.json();
  return data.beats || [];
}

/**
 * Create a new beat
 */
export async function createBeat(payload: CreateBeatPayload): Promise<StoryBeat> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BEATS_BASE_URL}/beats`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create beat');
  }

  const data = await response.json();
  return data.beat;
}

/**
 * Update an existing beat
 */
export async function updateBeat(beatId: string, payload: UpdateBeatPayload): Promise<StoryBeat> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BEATS_BASE_URL}/beats/${beatId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update beat');
  }

  const data = await response.json();
  return data.beat;
}

/**
 * Delete a beat
 */
export async function deleteBeat(beatId: string): Promise<void> {
  const token = await getAuthToken();
  
  const response = await fetch(`${BEATS_BASE_URL}/beats/${beatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete beat');
  }
}

/**
 * Reorder beats (bulk update order_index)
 */
export async function reorderBeats(beats: { id: string; order_index: number }[]): Promise<void> {
  const token = await getAuthToken();
  
  // Update each beat's order_index
  await Promise.all(
    beats.map(({ id, order_index }) =>
      updateBeat(id, { order_index })
    )
  );
}

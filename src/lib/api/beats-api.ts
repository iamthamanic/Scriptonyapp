/**
 * 🎬 BEATS API CLIENT
 * 
 * API für Story Beats (Save the Cat, Hero's Journey, etc.)
 */

import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { getAuthToken } from '../auth/getAuthToken';

const BEATS_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;

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
  
  if (!token) {
    throw new Error('Not authenticated - no access token available');
  }
  
  const url = `${BEATS_BASE_URL}/beats/${beatId}`;
  console.log('[BeatsAPI] Updating beat:', { beatId, payload, url, token: token.substring(0, 20) + '...' });
  
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to update beat';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('[BeatsAPI] Update failed:', { beatId, status: response.status, error: errorMessage });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[BeatsAPI] Update successful:', { beatId });
    return data.beat;
  } catch (error) {
    console.error('[BeatsAPI] Network or parsing error:', error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('[BeatsAPI] 🚨 CORS or Network issue!', {
        url,
        beatId,
        projectId,
        checkList: [
          '1. Is the Edge Function deployed?',
          '2. Check browser console for CORS errors',
          '3. Verify Supabase URL is correct',
          '4. Check if Auth token is valid'
        ]
      });
    }
    throw error;
  }
}

/**
 * Delete a beat
 */
export async function deleteBeat(beatId: string): Promise<void> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Not authenticated - no access token available');
  }
  
  console.log('[BeatsAPI] Deleting beat:', { beatId });
  
  const response = await fetch(`${BEATS_BASE_URL}/beats/${beatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = 'Failed to delete beat';
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    console.error('[BeatsAPI] Delete failed:', { beatId, status: response.status, error: errorMessage });
    throw new Error(errorMessage);
  }
  
  console.log('[BeatsAPI] Delete successful:', { beatId });
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
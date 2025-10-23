/**
 * Scenes Routes für PostgreSQL (Factory Pattern)
 */

import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createScenesRoutes(
  getSupabaseClient: () => SupabaseClient,
  getUserIdFromAuth: (authHeader: string | undefined) => Promise<string | null>
) {
  const scenes = new Hono();

  // =====================================================
  // GET /:sequenceId - Get all scenes in a sequence
  // =====================================================
  scenes.get('/:sequenceId', async (c) => {
    try {
      const sequenceId = c.req.param('sequenceId');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scenes')
        .select('*')
        .eq('sequence_id', sequenceId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[SCENES] Error fetching scenes:', error);
        return c.json({ error: error.message }, 500);
      }

      // Transform to camelCase for frontend
      const transformedData = (data || []).map((scene: any) => ({
        id: scene.id,
        sequenceId: scene.sequence_id,
        sceneNumber: scene.scene_number,
        title: scene.title,
        description: scene.description,
        location: scene.location,
        timeOfDay: scene.time_of_day,
        color: scene.color,
        orderIndex: scene.order_index,
        createdAt: scene.created_at,
        updatedAt: scene.updated_at,
      }));

      return c.json(transformedData);
    } catch (err) {
      console.error('[SCENES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // POST / - Create a new scene
  // =====================================================
  scenes.post('/', async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const {
        sequence_id,
        scene_number,
        title,
        description,
        location,
        time_of_day,
        color,
      } = body;

      if (!sequence_id) {
        return c.json({ error: 'sequence_id is required' }, 400);
      }

      const supabase = getSupabaseClient();

      // Get the sequence to get project_id
      const { data: sequence, error: seqError } = await supabase
        .from('sequences')
        .select('act_id, acts(project_id)')
        .eq('id', sequence_id)
        .single();

      if (seqError || !sequence) {
        console.error('[SCENES] Sequence not found:', seqError);
        return c.json({ error: 'Sequence not found' }, 404);
      }

      const project_id = (sequence.acts as any)?.project_id;
      if (!project_id) {
        console.error('[SCENES] Could not determine project_id from sequence');
        return c.json({ error: 'Could not determine project_id' }, 500);
      }

      // Get the highest order_index in this sequence
      const { data: existingScenes } = await supabase
        .from('scenes')
        .select('order_index')
        .eq('sequence_id', sequence_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingScenes && existingScenes.length > 0
        ? existingScenes[0].order_index + 1
        : 0;

      const { data, error } = await supabase
        .from('scenes')
        .insert({
          sequence_id,
          project_id,
          scene_number,
          title,
          description,
          location,
          time_of_day,
          color,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) {
        console.error('[SCENES] Error creating scene:', error);
        return c.json({ error: error.message }, 500);
      }

      console.log('[SCENES] Created scene:', data.id);

      // Transform to camelCase for frontend
      const transformedData = {
        id: data.id,
        sequenceId: data.sequence_id,
        sceneNumber: data.scene_number,
        title: data.title,
        description: data.description,
        location: data.location,
        timeOfDay: data.time_of_day,
        color: data.color,
        orderIndex: data.order_index,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return c.json(transformedData, 201);
    } catch (err) {
      console.error('[SCENES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // PUT /:sceneId - Update a scene
  // =====================================================
  scenes.put('/:sceneId', async (c) => {
    try {
      const sceneId = c.req.param('sceneId');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const {
        scene_number,
        title,
        description,
        location,
        time_of_day,
        color,
      } = body;

      const updateData: any = {};
      if (scene_number !== undefined) updateData.scene_number = scene_number;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (location !== undefined) updateData.location = location;
      if (time_of_day !== undefined) updateData.time_of_day = time_of_day;
      if (color !== undefined) updateData.color = color;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scenes')
        .update(updateData)
        .eq('id', sceneId)
        .select()
        .single();

      if (error) {
        console.error('[SCENES] Error updating scene:', error);
        return c.json({ error: error.message }, 500);
      }

      console.log('[SCENES] Updated scene:', sceneId);

      // Transform to camelCase for frontend
      const transformedData = {
        id: data.id,
        sequenceId: data.sequence_id,
        sceneNumber: data.scene_number,
        title: data.title,
        description: data.description,
        location: data.location,
        timeOfDay: data.time_of_day,
        color: data.color,
        orderIndex: data.order_index,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return c.json(transformedData);
    } catch (err) {
      console.error('[SCENES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // DELETE /:sceneId - Delete a scene
  // =====================================================
  scenes.delete('/:sceneId', async (c) => {
    try {
      const sceneId = c.req.param('sceneId');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('scenes')
        .delete()
        .eq('id', sceneId);

      if (error) {
        console.error('[SCENES] Error deleting scene:', error);
        return c.json({ error: error.message }, 500);
      }

      console.log('[SCENES] Deleted scene:', sceneId);
      return c.json({ success: true });
    } catch (err) {
      console.error('[SCENES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return scenes;
}

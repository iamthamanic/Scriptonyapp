/**
 * 🎬 SEQUENCES ROUTES
 * API endpoints für Sequences (Sequenzen innerhalb von Acts)
 */

import { Hono } from 'npm:hono';
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createSequencesRoutes(
  getSupabaseClient: () => SupabaseClient,
  getUserIdFromAuth: (authHeader: string | undefined) => Promise<string | null>
) {
  const sequences = new Hono();

// =====================================================
  // =====================================================
  // GET /:actId - Get all sequences for an act
  // =====================================================
  sequences.get('/:actId', async (c) => {
    try {
      const actId = c.req.param('actId');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('sequences')
        .select('*')
        .eq('act_id', actId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[SEQUENCES] Error fetching sequences:', error);
        return c.json({ error: error.message }, 500);
      }

      // Transform to camelCase for frontend
      const transformedData = (data || []).map((seq: any) => ({
        id: seq.id,
        actId: seq.act_id,
        sequenceNumber: seq.sequence_number,
        title: seq.title,
        description: seq.description,
        color: seq.color,
        orderIndex: seq.order_index,
        createdAt: seq.created_at,
        updatedAt: seq.updated_at,
      }));

      return c.json(transformedData);
    } catch (err) {
      console.error('[SEQUENCES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // POST / - Create new sequence
  // =====================================================
  sequences.post('/', async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      
      let body;
      try {
        body = await c.req.json();
        console.log('[SEQUENCES] ✅ POST body parsed:', JSON.stringify(body));
        console.log('[SEQUENCES] Body keys:', Object.keys(body));
        console.log('[SEQUENCES] act_id:', body.act_id, 'type:', typeof body.act_id);
        console.log('[SEQUENCES] sequence_number:', body.sequence_number, 'type:', typeof body.sequence_number);
      } catch (parseError) {
        console.error('[SEQUENCES] ❌ Failed to parse body:', parseError);
        console.error('[SEQUENCES] Raw request:', c.req);
        return c.json({ error: 'Invalid JSON body' }, 400);
      }

      const {
        act_id,
        sequence_number,
        title,
        description,
        color = '#98E5B4',
      } = body;

      if (!act_id) {
        console.error('[SEQUENCES] Missing act_id, received:', act_id);
        return c.json({ error: 'act_id is required' }, 400);
      }

      if (sequence_number === undefined || sequence_number === null) {
        console.error('[SEQUENCES] Missing sequence_number, received:', sequence_number, 'type:', typeof sequence_number);
        return c.json({ error: 'sequence_number is required' }, 400);
      }

      const supabase = getSupabaseClient();
      
      // Get the act to get project_id
      const { data: act, error: actError } = await supabase
        .from('acts')
        .select('project_id')
        .eq('id', act_id)
        .single();

      if (actError || !act) {
        console.error('[SEQUENCES] Act not found:', actError);
        return c.json({ error: 'Act not found' }, 404);
      }

      const project_id = act.project_id;
      if (!project_id) {
        console.error('[SEQUENCES] Could not determine project_id from act');
        return c.json({ error: 'Could not determine project_id' }, 500);
      }

      // Get current max order_index for this act
      const { data: existingSequences } = await supabase
        .from('sequences')
        .select('order_index')
        .eq('act_id', act_id)
        .order('order_index', { ascending: false })
        .limit(1);

      const nextOrderIndex = existingSequences && existingSequences.length > 0
        ? existingSequences[0].order_index + 1
        : 0;

      console.log('[SEQUENCES] Inserting with:', { act_id, project_id, sequence_number, title, color, order_index: nextOrderIndex });

      const { data, error } = await supabase
        .from('sequences')
        .insert({
          act_id,
          project_id,
          sequence_number,
          title,
          description,
          color,
          order_index: nextOrderIndex,
        })
        .select()
        .single();

      if (error) {
        console.error('[SEQUENCES] Error creating sequence:', error);
        console.error('[SEQUENCES] Error details:', JSON.stringify(error));
        return c.json({ error: error.message || 'Database error' }, 500);
      }

      console.log('[SEQUENCES] Created sequence:', data?.id);
      
      // Transform to camelCase for frontend
      const transformedData = {
        id: data.id,
        actId: data.act_id,
        sequenceNumber: data.sequence_number,
        title: data.title,
        description: data.description,
        color: data.color,
        orderIndex: data.order_index,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      return c.json(transformedData, 201);
    } catch (err: any) {
      console.error('[SEQUENCES] Unexpected error:', err);
      console.error('[SEQUENCES] Error stack:', err?.stack);
      return c.json({ error: err?.message || 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // PUT /:id - Update sequence
  // =====================================================
  sequences.put('/:id', async (c) => {
    try {
      const sequenceId = c.req.param('id');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      
      const body = await c.req.json();

      const {
        sequence_number,
        title,
        description,
        color,
      } = body;

      const updateData: any = {};
      if (sequence_number !== undefined) updateData.sequence_number = sequence_number;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('sequences')
        .update(updateData)
      .eq('id', sequenceId)
      .select()
      .single();

    if (error) {
      console.error('[SEQUENCES] Error updating sequence:', error);
      return c.json({ error: error.message }, 500);
    }

      console.log('[SEQUENCES] Updated sequence:', sequenceId);
      
      // Transform to camelCase for frontend
      const transformedData = {
        id: data.id,
        actId: data.act_id,
        sequenceNumber: data.sequence_number,
        title: data.title,
        description: data.description,
        color: data.color,
        orderIndex: data.order_index,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      
      return c.json(transformedData);
    } catch (err) {
      console.error('[SEQUENCES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // DELETE /:id - Delete sequence
  // =====================================================
  sequences.delete('/:id', async (c) => {
    try {
      const sequenceId = c.req.param('id');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('sequences')
        .delete()
        .eq('id', sequenceId);

    if (error) {
      console.error('[SEQUENCES] Error deleting sequence:', error);
      return c.json({ error: error.message }, 500);
    }

      console.log('[SEQUENCES] Deleted sequence:', sequenceId);
      return c.json({ success: true });
    } catch (err) {
      console.error('[SEQUENCES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // POST /reorder - Reorder sequences in act
  // =====================================================
  sequences.post('/reorder', async (c) => {
    try {
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      
      const body = await c.req.json();

      const { act_id, sequence_ids } = body;

      if (!act_id || !Array.isArray(sequence_ids)) {
        return c.json({ error: 'act_id and sequence_ids array are required' }, 400);
      }

      const supabase = getSupabaseClient();
      // Call the reorder function
      const { error } = await supabase.rpc('reorder_sequences_in_act', {
        p_act_id: act_id,
        p_sequence_ids: sequence_ids,
      });

    if (error) {
      console.error('[SEQUENCES] Error reordering sequences:', error);
      return c.json({ error: error.message }, 500);
    }

      console.log('[SEQUENCES] Reordered sequences in act:', act_id);
      return c.json({ success: true });
    } catch (err) {
      console.error('[SEQUENCES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  // =====================================================
  // POST /:sequenceId/scenes/reorder - Reorder scenes in sequence
  // =====================================================
  sequences.post('/:sequenceId/scenes/reorder', async (c) => {
    try {
      const sequenceId = c.req.param('sequenceId');
      const userId = await getUserIdFromAuth(c.req.header('Authorization'));
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      
      const body = await c.req.json();

    const { scene_ids } = body;

    if (!Array.isArray(scene_ids)) {
      return c.json({ error: 'scene_ids array is required' }, 400);
    }

    // Call the reorder function
    const { error } = await supabase.rpc('reorder_scenes_in_sequence', {
      p_sequence_id: sequenceId,
      p_scene_ids: scene_ids,
    });

    if (error) {
      console.error('[SEQUENCES] Error reordering scenes:', error);
      return c.json({ error: error.message }, 500);
    }

      console.log('[SEQUENCES] Reordered scenes in sequence:', sequenceId);
      return c.json({ success: true });
    } catch (err) {
      console.error('[SEQUENCES] Unexpected error:', err);
      return c.json({ error: 'Internal server error' }, 500);
    }
  });

  return sequences;
}

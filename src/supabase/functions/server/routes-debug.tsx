/**
 * DEBUG ROUTES - Zum Testen der Timeline-Tabellen
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

export function createDebugRoutes() {
  const debug = new Hono();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // =====================================================
  // Test: Direct INSERT into sequences
  // =====================================================
  debug.post('/test-sequence-insert', async (c) => {
    try {
      const body = await c.req.json();
      console.log('[DEBUG] Testing sequence insert with:', body);

      // Get first act for testing
      const { data: firstAct, error: actError } = await supabase
        .from('acts')
        .select('*')
        .limit(1)
        .single();

      if (actError) {
        console.error('[DEBUG] No act found:', actError);
        return c.json({ error: 'No act found to test with', details: actError }, 400);
      }

      console.log('[DEBUG] Using act:', firstAct.id);

      // Try direct insert
      const { data, error } = await supabase
        .from('sequences')
        .insert({
          act_id: firstAct.id,
          sequence_number: 999,
          title: 'DEBUG TEST SEQUENCE',
          description: 'This is a test sequence',
          color: '#FF0000',
          order_index: 999,
        })
        .select()
        .single();

      if (error) {
        console.error('[DEBUG] Insert error:', error);
        return c.json({
          success: false,
          error: error.message,
          details: error,
          hint: error.hint,
          code: error.code,
        }, 500);
      }

      console.log('[DEBUG] Insert successful:', data);
      return c.json({
        success: true,
        data,
        message: 'Direct insert works! RLS is not the problem.',
      });
    } catch (err: any) {
      console.error('[DEBUG] Unexpected error:', err);
      return c.json({
        success: false,
        error: err.message,
        stack: err.stack,
      }, 500);
    }
  });

  // =====================================================
  // Test: Check RLS Policies
  // =====================================================
  debug.get('/check-rls', async (c) => {
    try {
      const checks: Record<string, any> = {};

      // Check acts table
      const { data: actsData, error: actsError } = await supabase
        .from('acts')
        .select('id, project_id, title')
        .limit(3);

      checks.acts = {
        accessible: !actsError,
        count: actsData?.length || 0,
        error: actsError?.message,
        sample: actsData?.[0],
      };

      // Check sequences table
      const { data: seqData, error: seqError } = await supabase
        .from('sequences')
        .select('id, act_id, title')
        .limit(3);

      checks.sequences = {
        accessible: !seqError,
        count: seqData?.length || 0,
        error: seqError?.message,
        sample: seqData?.[0],
      };

      // Check if Service Role Key bypasses RLS
      checks.usingServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.substring(0, 20) + '...';

      return c.json({
        success: true,
        checks,
        message: 'Service Role should bypass all RLS policies',
      });
    } catch (err: any) {
      return c.json({
        success: false,
        error: err.message,
      }, 500);
    }
  });

  return debug;
}

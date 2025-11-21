/**
 * 🎬 SCRIPTONY BEATS - Story Beats Microservice
 * 
 * CRUD Operations für Story Beats (Save the Cat, Hero's Journey, etc.)
 * - GET /beats?project_id=xxx - Liste aller Beats
 * - POST /beats - Neuen Beat erstellen
 * - PATCH /beats/:id - Beat aktualisieren
 * - DELETE /beats/:id - Beat löschen
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StoryBeat {
  id?: string;
  project_id: string;
  user_id?: string;
  label: string;
  template_abbr?: string;
  description?: string;
  from_container_id: string;
  to_container_id: string;
  pct_from: number;
  pct_to: number;
  color?: string;
  notes?: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Client für Auth (mit Anon Key)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Admin Client für interne Queries (mit Service Role Key)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/scriptony-beats', '');

    // ============================================
    // GET /beats?project_id=xxx
    // ============================================
    if (req.method === 'GET' && path === '/beats') {
      const projectId = url.searchParams.get('project_id');
      
      if (!projectId) {
        return new Response(
          JSON.stringify({ error: 'project_id query parameter required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: beats, error } = await supabase
        .from('story_beats')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching beats:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ beats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // POST /beats
    // ============================================
    if (req.method === 'POST' && path === '/beats') {
      const body: Partial<StoryBeat> = await req.json();

      console.log('[POST /beats] Request received:', { 
        project_id: body.project_id, 
        label: body.label,
        user_id: user.id 
      });

      // Validate required fields
      if (!body.project_id || !body.label || !body.from_container_id || !body.to_container_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: project_id, label, from_container_id, to_container_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate percentage ranges
      if (
        body.pct_from !== undefined && (body.pct_from < 0 || body.pct_from > 100) ||
        body.pct_to !== undefined && (body.pct_to < 0 || body.pct_to > 100)
      ) {
        return new Response(
          JSON.stringify({ error: 'pct_from and pct_to must be between 0 and 100' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify project exists
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id, organization_id, title')
        .eq('id', body.project_id)
        .single();

      console.log('[POST /beats] Project query:', { 
        project, 
        projectError,
        project_id: body.project_id
      });

      if (projectError || !project) {
        console.error('[POST /beats] Project not found:', {
          projectError,
          project_id: body.project_id
        });

        return new Response(
          JSON.stringify({ 
            error: 'Project not found',
            details: projectError?.message
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: beat, error } = await supabaseAdmin
        .from('story_beats')
        .insert({
          ...body,
          user_id: user.id,
          pct_from: body.pct_from ?? 0,
          pct_to: body.pct_to ?? 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[POST /beats] Error creating beat:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('[POST /beats] Beat created successfully:', beat.id);
      return new Response(
        JSON.stringify({ beat }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // PATCH /beats/:id
    // ============================================
    const patchMatch = path.match(/^\/beats\/([a-f0-9-]+)$/);
    if (req.method === 'PATCH' && patchMatch) {
      const beatId = patchMatch[1];
      const body: Partial<StoryBeat> = await req.json();

      // Validate percentage ranges
      if (
        body.pct_from !== undefined && (body.pct_from < 0 || body.pct_from > 100) ||
        body.pct_to !== undefined && (body.pct_to < 0 || body.pct_to > 100)
      ) {
        return new Response(
          JSON.stringify({ error: 'pct_from and pct_to must be between 0 and 100' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns the beat (via project)
      const { data: existingBeat, error: fetchError } = await supabaseAdmin
        .from('story_beats')
        .select('project_id')
        .eq('id', beatId)
        .single();

      if (fetchError || !existingBeat) {
        return new Response(
          JSON.stringify({ error: 'Beat not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify project exists
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', existingBeat.project_id)
        .single();

      if (projectError || !project) {
        return new Response(
          JSON.stringify({ error: 'Project not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Remove fields that shouldn't be updated
      const { id, project_id, user_id, created_at, updated_at, ...updateData } = body as any;

      const { data: beat, error } = await supabaseAdmin
        .from('story_beats')
        .update(updateData)
        .eq('id', beatId)
        .select()
        .single();

      if (error) {
        console.error('Error updating beat:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ beat }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // DELETE /beats/:id
    // ============================================
    const deleteMatch = path.match(/^\/beats\/([a-f0-9-]+)$/);
    if (req.method === 'DELETE' && deleteMatch) {
      const beatId = deleteMatch[1];

      // Verify user owns the beat (via project)
      const { data: existingBeat, error: fetchError } = await supabaseAdmin
        .from('story_beats')
        .select('project_id')
        .eq('id', beatId)
        .single();

      if (fetchError || !existingBeat) {
        return new Response(
          JSON.stringify({ error: 'Beat not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify project exists
      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('id')
        .eq('id', existingBeat.project_id)
        .single();

      if (projectError || !project) {
        return new Response(
          JSON.stringify({ error: 'Project not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabaseAdmin
        .from('story_beats')
        .delete()
        .eq('id', beatId);

      if (error) {
        console.error('Error deleting beat:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ROUTE NOT FOUND
    // ============================================
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
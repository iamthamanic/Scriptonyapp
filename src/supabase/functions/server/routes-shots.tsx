import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const shots = new Hono();

// Utility: Create Supabase client from Authorization header
const getSupabaseClient = (authHeader: string | null) => {
  const token = authHeader?.split(' ')[1];
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
};

// Utility: Create admin Supabase client (for storage operations)
const getAdminSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// Storage bucket name
const SHOT_IMAGES_BUCKET = 'make-3b52693b-shot-images';
const SHOT_AUDIO_BUCKET = 'make-3b52693b-shot-audio';

// Ensure buckets exist on server startup
const ensureBucketsExist = async () => {
  const supabase = getAdminSupabaseClient();
  
  // Check and create shot images bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const imagesBucketExists = buckets?.some(bucket => bucket.name === SHOT_IMAGES_BUCKET);
  if (!imagesBucketExists) {
    await supabase.storage.createBucket(SHOT_IMAGES_BUCKET, { public: false });
    console.log('[SHOTS] Created bucket:', SHOT_IMAGES_BUCKET);
  }
  
  // Check and create shot audio bucket
  const audioBucketExists = buckets?.some(bucket => bucket.name === SHOT_AUDIO_BUCKET);
  if (!audioBucketExists) {
    await supabase.storage.createBucket(SHOT_AUDIO_BUCKET, { public: false });
    console.log('[SHOTS] Created bucket:', SHOT_AUDIO_BUCKET);
  }
};

// Initialize buckets
ensureBucketsExist().catch(err => console.error('[SHOTS] Error creating buckets:', err));

// =====================================================
// GET /shots/:sceneId - Get all shots for a scene (with characters + audio)
// =====================================================
shots.get('/:sceneId', async (c) => {
  try {
    const sceneId = c.req.param('sceneId');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);

    // Get shots
    const { data: shotsData, error } = await supabase
      .from('shots')
      .select('*')
      .eq('scene_id', sceneId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('[SHOTS] Error fetching shots:', error);
      return c.json({ error: error.message }, 500);
    }

    // For each shot, get characters and audio files
    const shotsWithDetails = await Promise.all(
      (shotsData || []).map(async (shot) => {
        // Get characters
        const { data: characters } = await supabase.rpc('get_shot_characters', {
          p_shot_id: shot.id
        });

        // Get audio files
        const { data: audioFiles } = await supabase
          .from('shot_audio')
          .select('*')
          .eq('shot_id', shot.id);

        return {
          ...shot,
          characters: characters || [],
          audioFiles: audioFiles || [],
        };
      })
    );

    return c.json({ shots: shotsWithDetails });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// POST /shots - Create new shot
// =====================================================
shots.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const body = await c.req.json();

    const {
      scene_id,
      shot_number,
      description,
      camera_angle,
      camera_movement,
      lens,
      duration,
      composition,
      lighting_notes,
      sound_notes,
      storyboard_url,
      reference_image_url,
      // New fields from Migration 010
      framing,
      dialog,
      notes,
      shotlength_minutes,
      shotlength_seconds,
      image_url,
    } = body;

    if (!scene_id || !shot_number) {
      return c.json({ error: 'scene_id and shot_number are required' }, 400);
    }

    // Get the scene to get project_id
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('project_id')
      .eq('id', scene_id)
      .single();

    if (sceneError || !scene) {
      console.error('[SHOTS] Scene not found:', sceneError);
      return c.json({ error: 'Scene not found' }, 404);
    }

    const project_id = scene.project_id;
    if (!project_id) {
      console.error('[SHOTS] Could not determine project_id from scene');
      return c.json({ error: 'Could not determine project_id' }, 500);
    }

    // Get current max order_index for this scene
    const { data: existingShots } = await supabase
      .from('shots')
      .select('order_index')
      .eq('scene_id', scene_id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = existingShots && existingShots.length > 0
      ? existingShots[0].order_index + 1
      : 0;

    const { data, error } = await supabase
      .from('shots')
      .insert({
        scene_id,
        project_id,
        shot_number,
        description,
        camera_angle,
        camera_movement,
        lens,
        duration,
        composition,
        lighting_notes,
        sound_notes,
        storyboard_url,
        reference_image_url,
        framing,
        dialog,
        notes,
        shotlength_minutes: shotlength_minutes || 0,
        shotlength_seconds: shotlength_seconds || 0,
        image_url,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('[SHOTS] Error creating shot:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Created shot:', data.id);
    return c.json({ shot: data }, 201);
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// PUT /shots/:id - Update shot
// =====================================================
shots.put('/:id', async (c) => {
  try {
    const shotId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const body = await c.req.json();

    const {
      shot_number,
      description,
      camera_angle,
      camera_movement,
      lens,
      duration,
      composition,
      lighting_notes,
      sound_notes,
      storyboard_url,
      reference_image_url,
      // New fields
      framing,
      dialog,
      notes,
      shotlength_minutes,
      shotlength_seconds,
      image_url,
    } = body;

    const updateData: any = {};
    if (shot_number !== undefined) updateData.shot_number = shot_number;
    if (description !== undefined) updateData.description = description;
    if (camera_angle !== undefined) updateData.camera_angle = camera_angle;
    if (camera_movement !== undefined) updateData.camera_movement = camera_movement;
    if (lens !== undefined) updateData.lens = lens;
    if (duration !== undefined) updateData.duration = duration;
    if (composition !== undefined) updateData.composition = composition;
    if (lighting_notes !== undefined) updateData.lighting_notes = lighting_notes;
    if (sound_notes !== undefined) updateData.sound_notes = sound_notes;
    if (storyboard_url !== undefined) updateData.storyboard_url = storyboard_url;
    if (reference_image_url !== undefined) updateData.reference_image_url = reference_image_url;
    if (framing !== undefined) updateData.framing = framing;
    if (dialog !== undefined) updateData.dialog = dialog;
    if (notes !== undefined) updateData.notes = notes;
    if (shotlength_minutes !== undefined) updateData.shotlength_minutes = shotlength_minutes;
    if (shotlength_seconds !== undefined) updateData.shotlength_seconds = shotlength_seconds;
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data, error } = await supabase
      .from('shots')
      .update(updateData)
      .eq('id', shotId)
      .select()
      .single();

    if (error) {
      console.error('[SHOTS] Error updating shot:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Updated shot:', shotId);
    return c.json({ shot: data });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// DELETE /shots/:id - Delete shot
// =====================================================
shots.delete('/:id', async (c) => {
  try {
    const shotId = c.req.param('id');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);

    const { error } = await supabase
      .from('shots')
      .delete()
      .eq('id', shotId);

    if (error) {
      console.error('[SHOTS] Error deleting shot:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Deleted shot:', shotId);
    return c.json({ success: true });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// POST /shots/reorder - Reorder shots in scene
// =====================================================
shots.post('/reorder', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const body = await c.req.json();

    const { scene_id, shot_ids } = body;

    if (!scene_id || !Array.isArray(shot_ids)) {
      return c.json({ error: 'scene_id and shot_ids array are required' }, 400);
    }

    // Call the reorder function
    const { error } = await supabase.rpc('reorder_shots_in_scene', {
      p_scene_id: scene_id,
      p_shot_ids: shot_ids,
    });

    if (error) {
      console.error('[SHOTS] Error reordering shots:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Reordered shots in scene:', scene_id);
    return c.json({ success: true });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// POST /shots/:shotId/upload-image - Upload shot preview image
// =====================================================
shots.post('/:shotId/upload-image', async (c) => {
  try {
    const shotId = c.req.param('shotId');
    const authHeader = c.req.header('Authorization');
    const supabase = getAdminSupabaseClient();
    const userSupabase = getSupabaseClient(authHeader);

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${shotId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(SHOT_IMAGES_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[SHOTS] Error uploading image:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(SHOT_IMAGES_BUCKET)
      .createSignedUrl(filePath, 31536000);

    if (!signedUrlData) {
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    // Update shot with image URL
    const { error: updateError } = await userSupabase
      .from('shots')
      .update({ image_url: signedUrlData.signedUrl })
      .eq('id', shotId);

    if (updateError) {
      console.error('[SHOTS] Error updating shot with image URL:', updateError);
      return c.json({ error: updateError.message }, 500);
    }

    console.log('[SHOTS] Uploaded image for shot:', shotId);
    return c.json({ imageUrl: signedUrlData.signedUrl });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// POST /shots/:shotId/upload-audio - Upload audio file (music/sfx)
// =====================================================
shots.post('/:shotId/upload-audio', async (c) => {
  try {
    const shotId = c.req.param('shotId');
    const authHeader = c.req.header('Authorization');
    const supabase = getAdminSupabaseClient();
    const userSupabase = getSupabaseClient(authHeader);

    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'music' or 'sfx'
    const label = formData.get('label') as string; // Optional label

    if (!file || !type) {
      return c.json({ error: 'File and type are required' }, 400);
    }

    if (type !== 'music' && type !== 'sfx') {
      return c.json({ error: 'Type must be "music" or "sfx"' }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${shotId}-${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(SHOT_AUDIO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[SHOTS] Error uploading audio:', uploadError);
      return c.json({ error: uploadError.message }, 500);
    }

    // Get signed URL (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(SHOT_AUDIO_BUCKET)
      .createSignedUrl(filePath, 31536000);

    if (!signedUrlData) {
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    // Insert into shot_audio table
    const { data, error: insertError } = await userSupabase
      .from('shot_audio')
      .insert({
        shot_id: shotId,
        type,
        file_url: signedUrlData.signedUrl,
        file_name: file.name,
        label: label || null,
        file_size: file.size,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[SHOTS] Error inserting audio record:', insertError);
      return c.json({ error: insertError.message }, 500);
    }

    console.log('[SHOTS] Uploaded audio for shot:', shotId, type);
    return c.json({ audio: data });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// DELETE /shots/audio/:audioId - Delete audio file
// =====================================================
shots.delete('/audio/:audioId', async (c) => {
  try {
    const audioId = c.req.param('audioId');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);

    const { error } = await supabase
      .from('shot_audio')
      .delete()
      .eq('id', audioId);

    if (error) {
      console.error('[SHOTS] Error deleting audio:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Deleted audio:', audioId);
    return c.json({ success: true });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// POST /shots/:shotId/characters - Add character to shot
// =====================================================
shots.post('/:shotId/characters', async (c) => {
  try {
    const shotId = c.req.param('shotId');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);
    const body = await c.req.json();

    const { character_id } = body;

    if (!character_id) {
      return c.json({ error: 'character_id is required' }, 400);
    }

    // Use the helper function
    const { error } = await supabase.rpc('add_character_to_shot', {
      p_shot_id: shotId,
      p_character_id: character_id,
    });

    if (error) {
      console.error('[SHOTS] Error adding character to shot:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Added character to shot:', shotId, character_id);
    return c.json({ success: true });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// =====================================================
// DELETE /shots/:shotId/characters/:characterId - Remove character from shot
// =====================================================
shots.delete('/:shotId/characters/:characterId', async (c) => {
  try {
    const shotId = c.req.param('shotId');
    const characterId = c.req.param('characterId');
    const authHeader = c.req.header('Authorization');
    const supabase = getSupabaseClient(authHeader);

    const { error } = await supabase.rpc('remove_character_from_shot', {
      p_shot_id: shotId,
      p_character_id: characterId,
    });

    if (error) {
      console.error('[SHOTS] Error removing character from shot:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('[SHOTS] Removed character from shot:', shotId, characterId);
    return c.json({ success: true });
  } catch (err) {
    console.error('[SHOTS] Unexpected error:', err);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default shots;

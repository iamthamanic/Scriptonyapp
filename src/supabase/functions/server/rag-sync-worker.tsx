/**
 * 🔄 RAG AUTO-SYNC BACKGROUND WORKER
 * 
 * Processes rag_sync_queue to keep RAG database updated
 * - Runs every 10 seconds
 * - Processes up to 50 items per batch
 * - Automatic retry on failure
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

// ==================== RAG SYNC PROCESSOR ====================

export async function processRAGSyncQueue(): Promise<{
  processed: number;
  errors: number;
}> {
  try {
    // Check if rag_sync_queue table exists
    const { error: tableCheckError } = await supabase
      .from('rag_sync_queue')
      .select('id')
      .limit(1);

    // If table doesn't exist (PGRST205 error), skip silently
    if (tableCheckError && tableCheckError.code === 'PGRST205') {
      console.log('⏭️  RAG sync queue table not yet created - skipping');
      return { processed: 0, errors: 0 };
    }

    // Get unprocessed items
    const { data: items, error: fetchError } = await supabase
      .from('rag_sync_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error('❌ Failed to fetch sync queue:', fetchError);
      return { processed: 0, errors: 1 };
    }

    if (!items || items.length === 0) {
      return { processed: 0, errors: 0 };
    }

    console.log(`🔄 Processing ${items.length} RAG sync items...`);

    let processed = 0;
    let errors = 0;

    for (const item of items) {
      try {
        if (item.operation === 'DELETE') {
          // Remove from RAG database
          await supabase
            .from('rag_knowledge')
            .delete()
            .eq('content_type', item.entity_type)
            .eq('reference_id', item.entity_id);

          console.log(`  ✅ Deleted from RAG: ${item.entity_type}/${item.entity_id}`);
        } else {
          // Insert or Update RAG
          await upsertToRAG(item.entity_type, item.data, item.organization_id);
          console.log(`  ✅ Upserted to RAG: ${item.entity_type}/${item.entity_id}`);
        }

        // Mark as processed
        await supabase
          .from('rag_sync_queue')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            error: null,
          })
          .eq('id', item.id);

        processed++;
      } catch (error: any) {
        console.error(`  ❌ Error processing item ${item.id}:`, error);
        
        // Update with error
        await supabase
          .from('rag_sync_queue')
          .update({
            error: error.message,
          })
          .eq('id', item.id);

        errors++;
      }
    }

    console.log(`✅ RAG sync batch complete: ${processed} processed, ${errors} errors`);
    return { processed, errors };
  } catch (error: any) {
    console.error('❌ RAG sync worker error:', error);
    return { processed: 0, errors: 1 };
  }
}

// ==================== ENTITY TO RAG CONVERTER ====================

async function upsertToRAG(
  entityType: string,
  data: any,
  organizationId: string
) {
  let ragData: any;

  // Get user_id from organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .single();

  if (membershipError || !membership) {
    console.warn(`⚠️ No owner found for organization ${organizationId}:`, membershipError);
    return;
  }

  if (!membership.user_id) {
    console.warn(`⚠️ Membership has no user_id for organization ${organizationId}`);
    return;
  }

  switch (entityType) {
    case 'scenes':
      ragData = {
        user_id: membership.user_id,
        content_type: 'scene',
        reference_id: data.id,
        reference_name: data.title || `Szene ${data.scene_number}`,
        content: [
          `Title: ${data.title || 'Untitled'}`,
          `Scene Number: ${data.scene_number || 'N/A'}`,
          data.location ? `Location: ${data.location}` : '',
          data.description ? `Description: ${data.description}` : '',
          data.content ? `Content: ${data.content}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          project_id: data.project_id,
          scene_number: data.scene_number,
          location: data.location,
        },
      };
      break;

    case 'characters':
      ragData = {
        user_id: membership.user_id,
        content_type: 'character',
        reference_id: data.id,
        reference_name: data.name,
        content: [
          `Name: ${data.name}`,
          data.role ? `Role: ${data.role}` : '',
          data.age ? `Age: ${data.age}` : '',
          data.occupation ? `Occupation: ${data.occupation}` : '',
          data.description ? `Description: ${data.description}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          project_id: data.project_id,
          role: data.role,
          age: data.age,
          occupation: data.occupation,
        },
      };
      break;

    case 'projects':
      ragData = {
        user_id: membership.user_id,
        content_type: 'project',
        reference_id: data.id,
        reference_name: data.title,
        content: [
          `Title: ${data.title}`,
          data.type ? `Type: ${data.type}` : '',
          data.genre ? `Genre: ${data.genre}` : '',
          data.duration ? `Duration: ${data.duration}` : '',
          data.logline ? `Logline: ${data.logline}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          type: data.type,
          genre: data.genre,
          duration: data.duration,
        },
      };
      break;

    case 'world_items':
      ragData = {
        user_id: membership.user_id,
        content_type: 'worlditem',
        reference_id: data.id,
        reference_name: data.name,
        content: [
          `Name: ${data.name}`,
          data.category ? `Category: ${data.category}` : '',
          data.description ? `Description: ${data.description}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          world_id: data.world_id,
          category_id: data.category_id,
          category: data.category,
        },
      };
      break;

    case 'episodes':
      ragData = {
        user_id: membership.user_id,
        content_type: 'episode',
        reference_id: data.id,
        reference_name: `${data.episode_number}. ${data.title}`,
        content: [
          `Episode: ${data.episode_number}`,
          `Title: ${data.title}`,
          data.synopsis ? `Synopsis: ${data.synopsis}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          project_id: data.project_id,
          season: data.season,
          episode_number: data.episode_number,
        },
      };
      break;

    default:
      console.warn(`⚠️ Unknown entity type for RAG: ${entityType}`);
      return;
  }

  // Delete existing entry (if any) and insert new one
  // We can't use upsert because there's no unique constraint on reference_id
  await supabase
    .from('rag_knowledge')
    .delete()
    .eq('content_type', ragData.content_type)
    .eq('reference_id', ragData.reference_id);

  // Insert new entry
  const { error } = await supabase
    .from('rag_knowledge')
    .insert(ragData);

  if (error) {
    throw error;
  }
}

// ==================== WORKER STARTUP ====================

export function startRAGSyncWorker(intervalMs: number = 10000) {
  console.log(`🔄 Starting RAG Auto-Sync Worker (interval: ${intervalMs}ms)`);

  // Initial run
  processRAGSyncQueue();

  // Schedule periodic runs
  const intervalId = setInterval(async () => {
    await processRAGSyncQueue();
  }, intervalMs);

  return {
    stop: () => {
      clearInterval(intervalId);
      console.log('🛑 RAG Auto-Sync Worker stopped');
    },
  };
}

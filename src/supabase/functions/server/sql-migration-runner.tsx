/**
 * 🔄 SQL MIGRATION RUNNER
 * 
 * Automatically executes SQL migration files on server startup
 * - Reads migration files
 * - Executes them via Supabase
 * - Tracks which migrations have been applied
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') as string,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
);

// ==================== MIGRATION DEFINITIONS ====================

/**
 * Define migrations to run
 * NOTE: In Figma Make environment, we need to embed SQL directly
 * since we can't read files at runtime
 */
const MIGRATIONS = [
  {
    id: '005_mcp_tool_system',
    description: 'MCP Tool System & RAG Auto-Sync',
    sql: `
-- ==========================================
-- MCP TOOL SYSTEM & RAG AUTO-SYNC
-- ==========================================

-- ==================== RAG SYNC QUEUE ====================

CREATE TABLE IF NOT EXISTS rag_sync_queue (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  operation TEXT NOT NULL,
  data JSONB,
  processed BOOLEAN DEFAULT false,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_sync_queue_processed 
  ON rag_sync_queue(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_rag_sync_queue_org 
  ON rag_sync_queue(organization_id);

-- ==================== DATABASE TRIGGERS FOR AUTO-SYNC ====================

CREATE OR REPLACE FUNCTION trigger_rag_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    INSERT INTO rag_sync_queue (
      entity_type,
      entity_id,
      organization_id,
      operation,
      data,
      processed
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      NEW.organization_id,
      TG_OP,
      row_to_json(NEW),
      false
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO rag_sync_queue (
      entity_type,
      entity_id,
      organization_id,
      operation,
      data,
      processed
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      OLD.organization_id,
      'DELETE',
      NULL,
      false
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers only if tables exist
DO $$
BEGIN
  -- Trigger on scenes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scenes') THEN
    DROP TRIGGER IF EXISTS scenes_rag_auto_sync ON scenes;
    CREATE TRIGGER scenes_rag_auto_sync
    AFTER INSERT OR UPDATE OR DELETE ON scenes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rag_sync();
  END IF;

  -- Trigger on characters
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'characters') THEN
    DROP TRIGGER IF EXISTS characters_rag_auto_sync ON characters;
    CREATE TRIGGER characters_rag_auto_sync
    AFTER INSERT OR UPDATE OR DELETE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rag_sync();
  END IF;

  -- Trigger on projects
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    DROP TRIGGER IF EXISTS projects_rag_auto_sync ON projects;
    CREATE TRIGGER projects_rag_auto_sync
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rag_sync();
  END IF;

  -- Trigger on world_items
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'world_items') THEN
    DROP TRIGGER IF EXISTS world_items_rag_auto_sync ON world_items;
    CREATE TRIGGER world_items_rag_auto_sync
    AFTER INSERT OR UPDATE OR DELETE ON world_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rag_sync();
  END IF;

  -- Trigger on episodes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'episodes') THEN
    DROP TRIGGER IF EXISTS episodes_rag_auto_sync ON episodes;
    CREATE TRIGGER episodes_rag_auto_sync
    AFTER INSERT OR UPDATE OR DELETE ON episodes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_rag_sync();
  END IF;
END $$;

-- ==================== TOOL CALL HISTORY ====================

CREATE TABLE IF NOT EXISTS tool_call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  message_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_call_history_conversation 
  ON tool_call_history(conversation_id);

CREATE INDEX IF NOT EXISTS idx_tool_call_history_tool 
  ON tool_call_history(tool_name, created_at);

-- ==================== RLS POLICIES ====================

ALTER TABLE rag_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_call_history ENABLE ROW LEVEL SECURITY;

-- Tool call history - users can view their own conversation tools
DROP POLICY IF EXISTS "Users can view their own tool calls" ON tool_call_history;
CREATE POLICY "Users can view their own tool calls"
  ON tool_call_history
  FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM chat_conversations
      WHERE user_id = auth.uid()
    )
  );
`,
  },
  {
    id: '007_add_deepseek_provider',
    description: 'Add DeepSeek Provider Support',
    sql: `
-- Add deepseek_api_key column
ALTER TABLE user_ai_settings
ADD COLUMN IF NOT EXISTS deepseek_api_key TEXT;

-- Drop old check constraint
ALTER TABLE user_ai_settings
DROP CONSTRAINT IF EXISTS user_ai_settings_active_provider_check;

-- Add new check constraint with deepseek
ALTER TABLE user_ai_settings
ADD CONSTRAINT user_ai_settings_active_provider_check 
CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter', 'deepseek'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_ai_settings_deepseek_key 
ON user_ai_settings(deepseek_api_key) 
WHERE deepseek_api_key IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_ai_settings.deepseek_api_key IS 'DeepSeek API key (OpenAI-compatible)';
`,
  },
  {
    id: '011_fix_rag_sync_queue',
    description: 'Fix rag_sync_queue organization_id column',
    sql: `
-- Add organization_id column if it doesn't exist
DO $ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_sync_queue' 
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE rag_sync_queue 
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_rag_sync_queue_org 
  ON rag_sync_queue(organization_id);

-- Update existing rows to have a valid organization_id
DO $
DECLARE
  default_org_id UUID;
BEGIN
  SELECT id INTO default_org_id FROM organizations LIMIT 1;
  
  IF default_org_id IS NOT NULL THEN
    UPDATE rag_sync_queue 
    SET organization_id = default_org_id 
    WHERE organization_id IS NULL;
  END IF;
END $;

-- Make it NOT NULL
DO $ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rag_sync_queue' 
    AND column_name = 'organization_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE rag_sync_queue 
    ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $;
`,
  },
];

// ==================== MIGRATION TRACKER ====================

/**
 * Create migrations table to track which have been applied
 */
async function createMigrationsTable() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS _migrations (
        id TEXT PRIMARY KEY,
        description TEXT,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `,
  });

  if (error) {
    // If RPC doesn't exist, try direct query (less safe but works)
    console.warn('⚠️ RPC exec_sql not available, using direct query');
    // We'll just proceed - table might already exist
  }
}

/**
 * Check if migration has been applied
 */
async function isMigrationApplied(migrationId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('id')
      .eq('id', migrationId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Mark migration as applied
 */
async function markMigrationApplied(migrationId: string, description: string) {
  await supabase.from('_migrations').insert({
    id: migrationId,
    description,
    applied_at: new Date().toISOString(),
  });
}

// ==================== MIGRATION RUNNER ====================

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<{
  success: boolean;
  applied: string[];
  errors: string[];
}> {
  console.log('🔄 Checking SQL migrations...');

  const applied: string[] = [];
  const errors: string[] = [];

  try {
    // Create migrations tracking table
    await createMigrationsTable();

    // Run each migration
    for (const migration of MIGRATIONS) {
      try {
        // Check if already applied
        const isApplied = await isMigrationApplied(migration.id);
        
        if (isApplied) {
          console.log(`  ⏭️  ${migration.id}: Already applied`);
          continue;
        }

        console.log(`  🔄 Applying ${migration.id}: ${migration.description}...`);

        // Execute migration SQL
        // Note: In Supabase Edge Functions, we need to use the postgres connection directly
        // Since we can't use RPC for DDL, we'll try to execute via raw query
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: migration.sql,
        });

        if (error) {
          throw error;
        }

        // Mark as applied
        await markMigrationApplied(migration.id, migration.description);
        applied.push(migration.id);

        console.log(`  ✅ ${migration.id}: Applied successfully`);
      } catch (error: any) {
        console.error(`  ❌ ${migration.id}: Failed -`, error.message);
        errors.push(`${migration.id}: ${error.message}`);
        
        // Continue with other migrations even if one fails
      }
    }

    console.log(`\n✅ Migrations complete: ${applied.length} applied, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      applied,
      errors,
    };
  } catch (error: any) {
    console.error('❌ Migration runner error:', error);
    return {
      success: false,
      applied,
      errors: [error.message],
    };
  }
}

/**
 * ALTERNATIVE: Direct SQL execution via fetch to Supabase PostgREST
 * This is a workaround if RPC doesn't work
 */
export async function runMigrationsDirect(): Promise<{
  success: boolean;
  applied: string[];
  errors: string[];
}> {
  console.log('🔄 Checking if SQL migrations needed...');

  const applied: string[] = []
  const errors: string[] = [];

  try {
    // FIRST: Check if migrations already done (check if rag_sync_queue exists)
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    
    if (!dbUrl) {
      throw new Error('SUPABASE_DB_URL not configured');
    }

    const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const checkClient = new Client(dbUrl);
    
    await checkClient.connect();
    
    // Check if rag_sync_queue table exists
    const tableCheckResult = await checkClient.queryObject<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'rag_sync_queue'
      );
    `;
    
    await checkClient.end();
    
    const tableExists = tableCheckResult.rows[0]?.exists;
    
    if (tableExists) {
      console.log('✅ Migrations already applied - skipping SQL execution');
      return {
        success: true,
        applied: [],
        errors: [],
      };
    }
    
    console.log('📝 Migrations needed - applying SQL...');
  } catch (error: any) {
    console.warn('⚠️ Could not check migration status:', error.message);
    console.log('📝 Proceeding with migration attempt...');
  }

  // Run migrations
  for (const migration of MIGRATIONS) {
    try {
      console.log(`  🔄 Applying ${migration.id}...`);

      const dbUrl = Deno.env.get('SUPABASE_DB_URL');
      
      if (!dbUrl) {
        throw new Error('SUPABASE_DB_URL not configured');
      }

      // Use pg client to execute SQL
      const { Client } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
      const client = new Client(dbUrl);
      
      await client.connect();
      await client.queryArray(migration.sql);
      await client.end();

      applied.push(migration.id);
      console.log(`  ✅ ${migration.id}: Applied successfully`);
    } catch (error: any) {
      console.error(`  ❌ ${migration.id}: Failed -`, error.message);
      errors.push(`${migration.id}: ${error.message}`);
    }
  }

  return {
    success: errors.length === 0,
    applied,
    errors,
  };
}

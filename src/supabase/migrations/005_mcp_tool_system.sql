-- ==========================================
-- MCP TOOL SYSTEM & RAG AUTO-SYNC
-- ==========================================
-- Migration for Universal Tool System with Auto-Sync RAG
-- Date: 2025-10-15

-- Start transaction for atomic migration
BEGIN;

-- ==================== RAG SYNC QUEUE ====================

-- Table for queuing RAG updates (processed by background worker)
CREATE TABLE IF NOT EXISTS rag_sync_queue (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'scenes', 'characters', 'projects', 'worlds', 'episodes'
  entity_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'UPSERT'
  data JSONB, -- Entity data (null for DELETE)
  processed BOOLEAN DEFAULT false,
  error TEXT, -- Error message if processing failed
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_rag_sync_queue_processed 
  ON rag_sync_queue(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_rag_sync_queue_org 
  ON rag_sync_queue(organization_id);

-- ==================== DATABASE TRIGGERS FOR AUTO-SYNC ====================

-- Generic trigger function for RAG sync
CREATE OR REPLACE FUNCTION trigger_rag_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for INSERT, UPDATE (not DELETE - handled separately)
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

-- Trigger on scenes
DROP TRIGGER IF EXISTS scenes_rag_auto_sync ON scenes;
CREATE TRIGGER scenes_rag_auto_sync
AFTER INSERT OR UPDATE OR DELETE ON scenes
FOR EACH ROW
EXECUTE FUNCTION trigger_rag_sync();

-- Trigger on characters
DROP TRIGGER IF EXISTS characters_rag_auto_sync ON characters;
CREATE TRIGGER characters_rag_auto_sync
AFTER INSERT OR UPDATE OR DELETE ON characters
FOR EACH ROW
EXECUTE FUNCTION trigger_rag_sync();

-- Trigger on projects
DROP TRIGGER IF EXISTS projects_rag_auto_sync ON projects;
CREATE TRIGGER projects_rag_auto_sync
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW
EXECUTE FUNCTION trigger_rag_sync();

-- Trigger on world_items
DROP TRIGGER IF EXISTS world_items_rag_auto_sync ON world_items;
CREATE TRIGGER world_items_rag_auto_sync
AFTER INSERT OR UPDATE OR DELETE ON world_items
FOR EACH ROW
EXECUTE FUNCTION trigger_rag_sync();

-- Trigger on episodes
DROP TRIGGER IF EXISTS episodes_rag_auto_sync ON episodes;
CREATE TRIGGER episodes_rag_auto_sync
AFTER INSERT OR UPDATE OR DELETE ON episodes
FOR EACH ROW
EXECUTE FUNCTION trigger_rag_sync();

-- ==================== TOOL CALL HISTORY ====================

-- Store AI tool call history for debugging/analytics
CREATE TABLE IF NOT EXISTS tool_call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  error TEXT,
  execution_time_ms INTEGER, -- How long tool execution took
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_call_history_conversation 
  ON tool_call_history(conversation_id);

CREATE INDEX IF NOT EXISTS idx_tool_call_history_tool 
  ON tool_call_history(tool_name, created_at);

-- ==================== COMMENTS ====================

COMMENT ON TABLE rag_sync_queue IS 'Queue for automatic RAG database synchronization after entity changes';
COMMENT ON TABLE tool_call_history IS 'History of AI tool calls for debugging and analytics';

COMMENT ON COLUMN rag_sync_queue.entity_type IS 'Type of entity: scenes, characters, projects, worlds, episodes';
COMMENT ON COLUMN rag_sync_queue.operation IS 'Database operation: INSERT, UPDATE, DELETE, UPSERT';
COMMENT ON COLUMN rag_sync_queue.data IS 'Full entity data (null for DELETE operations)';
COMMENT ON COLUMN rag_sync_queue.processed IS 'Whether this item has been processed by the sync worker';

-- ==================== RLS POLICIES ====================

-- RAG sync queue is internal, no user access needed
ALTER TABLE rag_sync_queue ENABLE ROW LEVEL SECURITY;

-- Tool call history - users can view their own conversation tools
ALTER TABLE tool_call_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (for idempotent migrations)
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

-- ==================== SUCCESS MESSAGE ====================

DO $
BEGIN
  RAISE NOTICE '��� MCP Tool System migration complete!';
  RAISE NOTICE '   - RAG sync queue table created';
  RAISE NOTICE '   - Auto-sync triggers installed on 5 tables';
  RAISE NOTICE '   - Tool call history tracking enabled';
  RAISE NOTICE '   - RLS policies configured';
END $;

-- Commit transaction
COMMIT;

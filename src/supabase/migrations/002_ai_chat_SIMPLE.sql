-- =====================================================
-- AI CHAT SYSTEM - SIMPLIFIED VERSION
-- =====================================================
-- Erstellt nur die notwendigen AI Chat Tabellen
-- OHNE komplexe Dependencies
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (falls vorhanden)
-- =====================================================

DROP TABLE IF EXISTS ai_chat_messages CASCADE;
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS ai_chat_settings CASCADE;
DROP TABLE IF EXISTS rag_sync_queue CASCADE;
DROP TABLE IF EXISTS rag_knowledge CASCADE;

-- =====================================================
-- 1. AI CHAT SETTINGS
-- =====================================================

CREATE TABLE ai_chat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Keys
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  google_api_key TEXT,
  openrouter_api_key TEXT,
  deepseek_api_key TEXT,
  
  -- Active Provider & Model
  active_provider TEXT DEFAULT 'openai',
  active_model TEXT DEFAULT 'gpt-4o',
  
  -- System Prompt
  system_prompt TEXT DEFAULT 'Du bist ein hilfreicher Assistent für Drehbuchautoren.',
  
  -- Settings
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  use_rag BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE ai_chat_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI settings"
  ON ai_chat_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_ai_chat_settings_user_id ON ai_chat_settings(user_id);

-- =====================================================
-- 2. AI CONVERSATIONS
-- =====================================================

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL DEFAULT 'Neue Unterhaltung',
  system_prompt TEXT,
  
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own conversations"
  ON ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);

-- =====================================================
-- 3. AI CHAT MESSAGES
-- =====================================================

CREATE TABLE ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  model TEXT,
  provider TEXT,
  tokens_used INTEGER,
  tool_calls JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage messages in their conversations"
  ON ai_chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_chat_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_chat_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_ai_chat_messages_conversation_id ON ai_chat_messages(conversation_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- =====================================================
-- 4. RAG KNOWLEDGE (SIMPLIFIED - User-based)
-- =====================================================

CREATE TABLE rag_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  reference_id UUID,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE rag_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own knowledge"
  ON rag_knowledge FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_rag_knowledge_user_id ON rag_knowledge(user_id);
CREATE INDEX idx_rag_knowledge_content_type ON rag_knowledge(content_type);
CREATE INDEX idx_rag_knowledge_reference_id ON rag_knowledge(reference_id);
CREATE INDEX idx_rag_knowledge_content_search ON rag_knowledge USING gin(to_tsvector('german', content));

-- =====================================================
-- 5. RAG SYNC QUEUE (SIMPLIFIED - User-based)
-- =====================================================

CREATE TABLE rag_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('UPSERT', 'DELETE')),
  data JSONB,
  
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_rag_sync_queue_processed ON rag_sync_queue(processed, created_at);
CREATE INDEX idx_rag_sync_queue_user_id ON rag_sync_queue(user_id);

-- =====================================================
-- 6. FUNCTION: Update Conversation Stats
-- =====================================================

CREATE OR REPLACE FUNCTION update_ai_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET 
    message_count = (SELECT COUNT(*) FROM ai_chat_messages WHERE conversation_id = NEW.conversation_id),
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_ai_conversation_on_message ON ai_chat_messages;
CREATE TRIGGER update_ai_conversation_on_message
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_stats();

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ai_chat_settings TO authenticated;
GRANT ALL ON ai_conversations TO authenticated;
GRANT ALL ON ai_chat_messages TO authenticated;
GRANT ALL ON rag_knowledge TO authenticated;
GRANT ALL ON rag_sync_queue TO authenticated;

-- =====================================================
-- COMPLETE ✅
-- =====================================================

SELECT 'AI Chat System - SIMPLE VERSION - Successfully created!' as status;

-- =====================================================
-- AI CHAT SYSTEM - Database Schema
-- =====================================================
-- Fügt Tabellen für AI Chat, Settings und RAG hinzu
-- =====================================================

-- =====================================================
-- 1. USER AI SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Keys (verschlüsselt gespeichert)
  openai_api_key TEXT,
  anthropic_api_key TEXT,
  google_api_key TEXT,
  openrouter_api_key TEXT,
  
  -- Current Provider & Model
  active_provider TEXT CHECK (active_provider IN ('openai', 'anthropic', 'google', 'openrouter')) DEFAULT 'openai',
  active_model TEXT DEFAULT 'gpt-4o-mini',
  
  -- System Prompt
  system_prompt TEXT DEFAULT 'Du bist ein hilfreicher Assistent für Drehbuchautoren. Du hilfst bei der Story-Entwicklung, Charakterentwicklung und Worldbuilding.',
  
  -- Settings
  temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000,
  use_rag BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own AI settings"
  ON user_ai_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI settings"
  ON user_ai_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings"
  ON user_ai_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_user_ai_settings_user_id ON user_ai_settings(user_id);

-- =====================================================
-- 2. CHAT CONVERSATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL DEFAULT 'Neue Unterhaltung',
  
  -- Per-conversation system prompt (NULL = use global default)
  system_prompt TEXT,
  
  -- Metadata
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own conversations"
  ON chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON chat_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

-- =====================================================
-- 3. CHAT MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Message Content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata
  model TEXT,
  provider TEXT,
  tokens_used INTEGER,
  tool_calls JSONB, -- Store AI tool calls for MCP integration
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view messages from their conversations"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert messages to their conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- =====================================================
-- 4. RAG KNOWLEDGE BASE
-- =====================================================

CREATE TABLE IF NOT EXISTS rag_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('project', 'character', 'scene', 'world', 'worlditem', 'note')),
  
  -- Reference
  reference_id UUID, -- ID of the referenced entity (project_id, character_id, etc.)
  reference_name TEXT, -- Name for display
  
  -- Embedding (for vector search - optional, can be added later)
  -- embedding vector(1536), -- Uncomment if using pgvector extension
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rag_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own knowledge"
  ON rag_knowledge FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own knowledge"
  ON rag_knowledge FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge"
  ON rag_knowledge FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge"
  ON rag_knowledge FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_rag_knowledge_user_id ON rag_knowledge(user_id);
CREATE INDEX idx_rag_knowledge_content_type ON rag_knowledge(content_type);
CREATE INDEX idx_rag_knowledge_reference_id ON rag_knowledge(reference_id);

-- Full-text search index
CREATE INDEX idx_rag_knowledge_content_search ON rag_knowledge USING gin(to_tsvector('german', content));

-- =====================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_user_ai_settings_updated_at
  BEFORE UPDATE ON user_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rag_knowledge_updated_at
  BEFORE UPDATE ON rag_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. FUNCTION: Update Conversation Stats
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET 
    message_count = (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = NEW.conversation_id),
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating conversation stats when message is added
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- =====================================================
-- COMPLETE ✅
-- =====================================================

-- Grant permissions
GRANT ALL ON user_ai_settings TO authenticated;
GRANT ALL ON chat_conversations TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON rag_knowledge TO authenticated;

-- Seed default system prompt
INSERT INTO user_ai_settings (user_id, system_prompt)
SELECT id, 'Du bist Scriptony AI, ein spezialisierter Assistent für Drehbuchautoren. Du hilfst bei:
- Story-Entwicklung und Plot-Strukturierung
- Charakterentwicklung und Motivation
- Worldbuilding und Konsistenz
- Szenen-Analyse und Verbesserungen
- Dialoge und Beschreibungen

Antworte präzise, kreativ und auf Deutsch. Nutze Kontext aus Projekten, Charakteren und Welten wenn verfügbar.'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_ai_settings)
ON CONFLICT (user_id) DO NOTHING;

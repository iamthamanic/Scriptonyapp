# 🏗️ AI Chat System - Architektur

## 📊 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐        ┌───────────────────────────────┐   │
│  │  AIChatPage    │◄──────►│  AIChatSettingsTab (Settings)  │   │
│  │  - Conversations│        │  - API Key Management          │   │
│  │  - Messages     │        │  - Provider Detection          │   │
│  │  - Send Message │        │  - Model Selection             │   │
│  │  - RAG Toggle   │        │  - System Prompt Editor        │   │
│  └────────┬───────┘        │  - RAG Sync                    │   │
│           │                 └───────────────────────────────┘   │
│           │                                                      │
│           │ API Calls (lib/api-client.ts)                       │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ HTTPS + Auth Bearer Token
            │
┌───────────▼──────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  /make-server-3b52693b/ai/*                             │    │
│  │                                                          │    │
│  │  routes-ai-chat.tsx:                                    │    │
│  │  ├─ GET  /ai/settings                                   │    │
│  │  ├─ PUT  /ai/settings                                   │    │
│  │  ├─ POST /ai/detect-provider                            │    │
│  │  ├─ GET  /ai/conversations                              │    │
│  │  ├─ POST /ai/conversations                              │    │
│  │  ├─ GET  /ai/conversations/:id/messages                 │    │
│  │  ├─ POST /ai/chat         ◄── Main Chat Endpoint        │    │
│  │  ├─ DELETE /ai/conversations/:id                        │    │
│  │  └─ POST /ai/rag/sync                                   │    │
│  └──────────────────────┬────────────────────────────────┘    │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
           ┌──────────────┼──────────────┐
           │              │              │
           ▼              ▼              ▼
    ┌──────────┐   ┌──────────┐  ┌──────────────┐
    │ OpenAI   │   │Anthropic │  │ Google Gemini│
    │   API    │   │   API    │  │     API      │
    └──────────┘   └──────────┘  └──────────────┘
           │              │              │
           └──────────────┼──────────────┘
                          │
                          │ AI Response
                          │
                          ▼
┌───────────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                             │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  user_ai_settings (AI Configuration)                     │    │
│  │  ├─ openai_api_key (encrypted)                           │    │
│  │  ├─ anthropic_api_key (encrypted)                        │    │
│  │  ├─ google_api_key (encrypted)                           │    │
│  │  ├─ active_provider (openai/anthropic/google)            │    │
│  │  ├─ active_model (gpt-4o-mini, claude-3-5-sonnet, ...)  │    │
│  │  ├─ system_prompt (text)                                 │    │
│  │  ├─ temperature (0-2)                                    │    │
│  │  ├─ max_tokens (500-4000)                                │    │
│  │  └─ use_rag (boolean)                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  chat_conversations (Conversation Metadata)              │    │
│  │  ├─ id                                                   │    │
│  │  ├─ user_id (FK → auth.users)                           │    │
│  │  ├─ title                                                │    │
│  │  ├─ message_count                                        │    │
│  │  └─ last_message_at                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  chat_messages (All Messages)                            │    │
│  │  ├─ id                                                   │    │
│  │  ├─ conversation_id (FK → chat_conversations)           │    │
│  │  ├─ user_id (FK → auth.users)                           │    │
│  │  ├─ role (user/assistant/system)                        │    │
│  │  ├─ content (text)                                       │    │
│  │  ├─ model (gpt-4o, claude-3-5-sonnet, ...)              │    │
│  │  ├─ provider (openai/anthropic/google)                  │    │
│  │  ├─ tokens_used (integer)                               │    │
│  │  └─ created_at                                           │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  rag_knowledge (RAG Database)                            │    │
│  │  ├─ id                                                   │    │
│  │  ├─ user_id (FK → auth.users)                           │    │
│  │  ├─ content (text) ◄── Full-text search indexed         │    │
│  │  ├─ content_type (project/character/world/...)          │    │
│  │  ├─ reference_id (UUID)                                  │    │
│  │  ├─ reference_name (text)                                │    │
│  │  └─ metadata (jsonb)                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  🔒 Row Level Security (RLS):                                    │
│     - Users can only see their own data                          │
│     - Enforced on ALL tables                                     │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Send Message

```
1. USER types message in AIChatPage
   └─> "Wie entwickle ich meinen Charakter weiter?"

2. FRONTEND calls apiPost("/ai/chat", { message, conversation_id, use_rag })
   └─> With Bearer Token for Auth

3. BACKEND receives request
   ├─> Validates Auth Token
   ├─> Gets User Settings from user_ai_settings
   │   └─> active_provider: "openai"
   │   └─> active_model: "gpt-4o-mini"
   │   └─> system_prompt: "Du bist Scriptony AI..."
   │   └─> use_rag: true
   │
   ├─> IF use_rag = true:
   │   └─> Query rag_knowledge table
   │       └─> Full-text search: "Charakter entwickeln"
   │       └─> Returns relevant projects/characters
   │       └─> Adds context to System Prompt
   │
   ├─> Gets Conversation History from chat_messages
   │   └─> Last 10 messages for context
   │
   ├─> Builds Messages Array:
   │   [
   │     { role: "system", content: "Du bist... + RAG Context" },
   │     { role: "user", content: "Previous question..." },
   │     { role: "assistant", content: "Previous answer..." },
   │     { role: "user", content: "Wie entwickle ich..." }
   │   ]
   │
   └─> Calls AI Provider API (OpenAI/Anthropic/Google)
       └─> With API Key from user_ai_settings

4. AI PROVIDER generates response
   └─> Returns: content, tokens_used

5. BACKEND saves messages to database
   ├─> Insert User Message to chat_messages
   └─> Insert Assistant Message to chat_messages
       └─> With model, provider, tokens_used

6. FRONTEND receives response
   ├─> Updates UI with new messages
   ├─> Shows token usage
   └─> Scrolls to bottom
```

---

## 🔐 Security Architecture

### Authentication Flow
```
┌──────────┐
│  User    │
│  Login   │
└────┬─────┘
     │
     │ Sign In with Email/Password
     │
     ▼
┌─────────────────┐
│ Supabase Auth   │
│  ├─ Validates   │
│  ├─ Creates     │
│  │   Session    │
│  └─ Returns     │
│      Token      │
└────┬────────────┘
     │
     │ JWT Token (Bearer)
     │
     ▼
┌─────────────────────────────┐
│  All API Requests            │
│  Authorization: Bearer TOKEN │
└──────────────────────────────┘
```

### Row Level Security (RLS)
```sql
-- Example: user_ai_settings
CREATE POLICY "Users can view their own AI settings"
  ON user_ai_settings FOR SELECT
  USING (auth.uid() = user_id);

-- Ensures: User A cannot see User B's API keys
-- Enforced: At database level (PostgreSQL)
```

### API Key Storage
```
┌────────────────────────────────────────┐
│  Frontend                               │
│  - Never stores API keys locally        │
│  - Only shows masked keys (sk-***1234) │
└────────────────────────────────────────┘
           │
           │ HTTPS
           ▼
┌────────────────────────────────────────┐
│  Backend (Edge Function)                │
│  - Receives API key on save             │
│  - Never logs API keys                  │
│  - Passes to Supabase encrypted         │
└────────────────────────────────────────┘
           │
           │
           ▼
┌────────────────────────────────────────┐
│  Database (Supabase PostgreSQL)         │
│  - Stores in TEXT column                │
│  - Protected by RLS                     │
│  - Only accessible to Service Role Key  │
└────────────────────────────────────────┘
```

---

## 🚀 RAG System Architecture

### RAG Sync Process
```
1. USER clicks "RAG-Datenbank synchronisieren"
   └─> POST /ai/rag/sync

2. BACKEND fetches user's organization
   └─> Query: organization_members table

3. BACKEND clears old RAG data
   └─> DELETE FROM rag_knowledge WHERE user_id = current_user

4. BACKEND syncs all content types:

   ┌─────────────────────────────────────────┐
   │  Projects                                │
   │  ├─ Title, Description, Genre            │
   │  └─> content_type: "project"             │
   └──────────────────────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────────┐
   │  Characters                              │
   │  ├─ Name, Description, Motivation        │
   │  └─> content_type: "character"           │
   └──────────────────────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────────┐
   │  Worlds                                  │
   │  ├─ Name, Description                    │
   │  └─> content_type: "world"               │
   └──────────────────────────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────────┐
   │  World Items                             │
   │  ├─ Name, Description, Type              │
   │  └─> content_type: "worlditem"           │
   └──────────────────────────────────────────┘

5. BACKEND creates full-text search index
   └─> PostgreSQL: GIN index on to_tsvector('german', content)

6. Success response
   └─> "X Einträge in RAG-Datenbank synchronisiert"
```

### RAG Query Process (during Chat)
```
1. User sends message: "Wie passt Max in meine Story?"

2. Backend extracts keywords
   └─> "Max" + "Story"

3. Backend searches rag_knowledge
   └─> SQL:
       SELECT content, reference_name, content_type
       FROM rag_knowledge
       WHERE user_id = current_user
         AND to_tsvector('german', content) @@ websearch_to_tsquery('german', 'Max Story')
       LIMIT 5

4. Backend finds matches:
   ├─> Character: "Max Mustermann" (Motivation: Rache)
   ├─> Project: "Mein Film" (Genre: Action, Thriller)
   └─> Scene: "Szene 3 - Max konfrontiert Antagonist"

5. Backend builds RAG Context:
   """
   Relevanter Kontext aus deinen Projekten:
   
   [character: Max Mustermann]
   Name: Max Mustermann
   Beschreibung: ...
   Motivation: Rache
   
   [project: Mein Film]
   Projekt: Mein Film
   Genre: Action, Thriller
   Beschreibung: ...
   """

6. Backend adds to System Prompt
   └─> System Prompt + RAG Context → Sent to AI

7. AI generates context-aware response
   └─> "Basierend auf deinem Projekt 'Mein Film' und dem 
        Charakter 'Max Mustermann' mit seiner Motivation
        'Rache', würde ich vorschlagen..."
```

---

## 📈 Scalability & Performance

### Database Indexes
```sql
-- Fast lookup by user
CREATE INDEX idx_user_ai_settings_user_id 
  ON user_ai_settings(user_id);

-- Fast conversation sorting
CREATE INDEX idx_chat_conversations_updated_at 
  ON chat_conversations(updated_at DESC);

-- Fast message retrieval
CREATE INDEX idx_chat_messages_conversation_id 
  ON chat_messages(conversation_id);

-- Fast RAG full-text search
CREATE INDEX idx_rag_knowledge_content_search 
  ON rag_knowledge USING gin(to_tsvector('german', content));
```

### Edge Function Performance
- **Cold Start**: ~300ms (first request)
- **Warm**: ~50ms (subsequent requests)
- **Location**: Deployed globally (Supabase CDN)

### AI Provider Latency
- **OpenAI gpt-4o-mini**: ~1-2s
- **OpenAI gpt-4o**: ~2-4s
- **Anthropic Claude**: ~2-5s
- **Google Gemini**: ~1-3s

### RAG Query Performance
- **Full-text search**: <50ms (with GIN index)
- **Max results**: 5 (configurable)
- **Indexed languages**: German (configurable)

---

## 🔄 Migration Path

### From KV Store to PostgreSQL
```
OLD (KV Store):
user_settings_ai_{userId} → JSON string

NEW (PostgreSQL):
user_ai_settings table with:
- Proper types (INT, BOOLEAN, TEXT)
- Foreign keys
- RLS policies
- Indexes
```

### Data Migration
Not needed - Fresh start with new schema.
Users will configure API keys fresh in Settings.

---

## 🎯 Future Enhancements

### Potential Additions
```
1. Vector Embeddings (pgvector)
   └─> More intelligent RAG matching
   └─> Semantic search instead of keyword

2. Streaming Responses
   └─> Show AI typing in real-time
   └─> Better UX for long responses

3. Image Generation
   └─> DALL-E, Midjourney integration
   └─> Generate character portraits

4. Voice Input/Output
   └─> Whisper API for voice-to-text
   └─> TTS for reading responses

5. Custom Fine-tuning
   └─> Train on user's writing style
   └─> Project-specific models

6. Collaboration
   └─> Share conversations
   └─> Team chat with AI

7. Analytics
   └─> Token usage tracking
   └─> Cost dashboard
   └─> Usage insights
```

---

**This architecture provides a solid foundation for AI-powered scriptwriting assistance! 🚀**

# 🚀 MCP INTEGRATION ROADMAP - KRITISCH!

**Status**: 🔴 NOCH NICHT IMPLEMENTIERT  
**Priorität**: ⚠️ CRITICAL - Ohne diese Features ist AI nur "dummer Chat"

---

## ❌ **WAS AKTUELL FEHLT**

### Problem 1: AI hat keine "Hände" ❌
```
User: "Benenne Szene 2 um in 'Nachtszene am Hafen'"
AI:   "Ich kann das leider nicht selbst machen..."
      ❌ AI kann nur REDEN, nicht HANDELN
```

**Was wir brauchen**: **Function Calling / Tool Use**

---

### Problem 2: Context Window Overflow ❌
```
Conversation:
- Message 1-100: 150K Tokens ✅
- Message 101:   60K Tokens  ❌ OVERFLOW!
                 → AI vergisst Message 1-50!
```

**Was wir brauchen**: **Memory/Summarization System**

---

### Problem 3: RAG wird nicht automatisch updated ❌
```
User ändert manuell in ProjectsPage:
- Szene 2: "Morgenszene" → "Nachtszene"
- Charakter "Max" → "Maximilian"

AI Chat RAG Database:
- ❌ Weiß nichts von Änderungen
- ❌ Antwortet mit alten Daten
- ❌ Muss manuell "RAG synchronisieren" klicken
```

**Was wir brauchen**: **Auto-Sync mit Change Detection**

---

## 🎯 **3-PHASEN LÖSUNG**

### ✅ **PHASE 1: MCP/Function Calling** (KRITISCH!)

#### 1.1 Backend: Tool Definitions

**Datei**: `/supabase/functions/server/tools-definitions.tsx`

```typescript
// Tools die AI aufrufen kann
export const SCRIPTONY_TOOLS = {
  // SCENES
  updateScene: {
    name: "update_scene",
    description: "Update a scene's title, description, or content",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        scene_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        content: { type: "string" },
      },
      required: ["project_id", "scene_id"],
    },
  },
  
  createScene: {
    name: "create_scene",
    description: "Create a new scene in a project",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        scene_number: { type: "number" },
      },
      required: ["project_id", "title"],
    },
  },
  
  deleteScene: {
    name: "delete_scene",
    description: "Delete a scene from a project",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        scene_id: { type: "string" },
      },
      required: ["project_id", "scene_id"],
    },
  },
  
  // CHARACTERS
  updateCharacter: {
    name: "update_character",
    description: "Update a character's name, description, or traits",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        character_id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        traits: { type: "array", items: { type: "string" } },
      },
      required: ["project_id", "character_id"],
    },
  },
  
  createCharacter: {
    name: "create_character",
    description: "Create a new character in a project",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        role: { type: "string", enum: ["protagonist", "antagonist", "supporting"] },
      },
      required: ["project_id", "name"],
    },
  },
  
  // PROJECTS
  updateProject: {
    name: "update_project",
    description: "Update project metadata (title, logline, genre)",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        title: { type: "string" },
        logline: { type: "string" },
        genre: { type: "string" },
      },
      required: ["project_id"],
    },
  },
  
  // WORLDS
  updateWorldItem: {
    name: "update_world_item",
    description: "Update a world asset/item",
    parameters: {
      type: "object",
      properties: {
        world_id: { type: "string" },
        item_id: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
      },
      required: ["world_id", "item_id"],
    },
  },
  
  // SEARCH
  searchProject: {
    name: "search_project",
    description: "Search through project data (scenes, characters)",
    parameters: {
      type: "object",
      properties: {
        project_id: { type: "string" },
        query: { type: "string" },
        type: { type: "string", enum: ["scenes", "characters", "all"] },
      },
      required: ["project_id", "query"],
    },
  },
};
```

---

#### 1.2 Backend: Tool Execution Router

**Datei**: `/supabase/functions/server/tools-executor.tsx`

```typescript
import { supabase } from './supabase-client.tsx';

export async function executeToolCall(
  toolName: string,
  parameters: any,
  userId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  
  console.log(`🔧 Executing tool: ${toolName}`, parameters);
  
  try {
    switch (toolName) {
      // SCENES
      case "update_scene":
        return await updateScene(parameters, userId);
      
      case "create_scene":
        return await createScene(parameters, userId);
      
      case "delete_scene":
        return await deleteScene(parameters, userId);
      
      // CHARACTERS
      case "update_character":
        return await updateCharacter(parameters, userId);
      
      case "create_character":
        return await createCharacter(parameters, userId);
      
      // PROJECTS
      case "update_project":
        return await updateProject(parameters, userId);
      
      // WORLDS
      case "update_world_item":
        return await updateWorldItem(parameters, userId);
      
      // SEARCH
      case "search_project":
        return await searchProject(parameters, userId);
      
      default:
        return { 
          success: false, 
          error: `Unknown tool: ${toolName}` 
        };
    }
  } catch (error: any) {
    console.error(`❌ Tool execution error:`, error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Tool Implementations
async function updateScene(params: any, userId: string) {
  const { data, error } = await supabase
    .from('scenes')
    .update({
      title: params.title,
      description: params.description,
      content: params.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.scene_id)
    .eq('project_id', params.project_id)
    .select()
    .single();
  
  if (error) throw error;
  
  // ✅ Auto-sync RAG after change
  await syncSceneToRAG(data, userId);
  
  return { success: true, data };
}

async function createScene(params: any, userId: string) {
  const { data, error } = await supabase
    .from('scenes')
    .insert({
      project_id: params.project_id,
      title: params.title,
      description: params.description,
      scene_number: params.scene_number,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // ✅ Auto-sync RAG
  await syncSceneToRAG(data, userId);
  
  return { success: true, data };
}

// ... mehr Tool Implementations
```

---

#### 1.3 Backend: AI Chat mit Function Calling

**Update**: `/supabase/functions/server/routes-ai-chat.tsx`

```typescript
// In POST /ai/chat route

// 1. Send message to AI WITH tools
const completion = await openai.chat.completions.create({
  model: settings.model,
  messages: conversationMessages,
  tools: Object.values(SCRIPTONY_TOOLS), // ✅ Tools hinzufügen
  tool_choice: "auto", // AI entscheidet selbst
  temperature: settings.temperature,
});

const aiMessage = completion.choices[0].message;

// 2. Check if AI wants to use tools
if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
  console.log(`🔧 AI möchte ${aiMessage.tool_calls.length} Tools ausführen`);
  
  const toolResults = [];
  
  // 3. Execute each tool call
  for (const toolCall of aiMessage.tool_calls) {
    const result = await executeToolCall(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments),
      userId
    );
    
    toolResults.push({
      tool_call_id: toolCall.id,
      role: "tool",
      name: toolCall.function.name,
      content: JSON.stringify(result),
    });
  }
  
  // 4. Send tool results back to AI
  conversationMessages.push(aiMessage);
  conversationMessages.push(...toolResults);
  
  const finalCompletion = await openai.chat.completions.create({
    model: settings.model,
    messages: conversationMessages,
    temperature: settings.temperature,
  });
  
  // 5. AI responds with natural language confirmation
  const finalMessage = finalCompletion.choices[0].message.content;
  
  // Save to DB
  await supabase.from('chat_messages').insert({
    conversation_id,
    role: 'assistant',
    content: finalMessage,
    tool_calls: aiMessage.tool_calls, // ✅ Save tool calls
    created_at: new Date().toISOString(),
  });
  
  return { content: finalMessage, tool_calls: aiMessage.tool_calls };
}
```

---

#### 1.4 Frontend: Tool Call Visualization

**Update**: `/components/ScriptonyAssistant.tsx`

```tsx
// Message Component mit Tool Calls
{messages.map((message) => (
  <div key={message.id}>
    {/* Regular message */}
    <div className="message-bubble">
      {message.content}
    </div>
    
    {/* Tool Calls Display */}
    {message.tool_calls && message.tool_calls.length > 0 && (
      <div className="mt-2 space-y-1">
        {message.tool_calls.map((tool, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 text-xs bg-accent/10 px-2 py-1 rounded"
          >
            <Wrench className="size-3 text-accent" />
            <span className="font-medium">
              {tool.function.name.replace(/_/g, ' ')}
            </span>
            <Check className="size-3 text-green-500 ml-auto" />
          </div>
        ))}
      </div>
    )}
  </div>
))}
```

**Beispiel Visualisierung:**
```
┌─────────────────────────────────────────┐
│ AI: Ich habe Szene 2 aktualisiert!      │
│                                         │
│ 🔧 update_scene            ✓            │
│ 🔧 sync_rag_database       ✓            │
└─────────────────────────────────────────┘
```

---

### ✅ **PHASE 2: Context Window Management**

#### 2.1 Conversation Memory System

**Neue Tabelle**: `conversation_memory`

```sql
CREATE TABLE conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_facts JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  tokens_saved INTEGER DEFAULT 0
);
```

---

#### 2.2 Auto-Summarization bei 80% Context

**Neue Datei**: `/supabase/functions/server/conversation-memory.tsx`

```typescript
export async function checkAndSummarize(
  conversationId: string,
  currentTokens: number,
  contextWindow: number,
  userId: string
) {
  const threshold = contextWindow * 0.8; // 80% threshold
  
  if (currentTokens < threshold) {
    return; // Still space, no action needed
  }
  
  console.log(`⚠️ Context at ${Math.round(currentTokens/contextWindow*100)}% - Summarizing...`);
  
  // 1. Get old messages (first 50%)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(Math.floor(totalMessages * 0.5));
  
  // 2. Ask AI to summarize
  const summary = await createSummary(messages);
  
  // 3. Save summary to memory
  await supabase.from('conversation_memory').insert({
    conversation_id: conversationId,
    summary: summary.text,
    key_facts: summary.facts,
    tokens_saved: summary.tokens_saved,
  });
  
  // 4. Delete old messages (keep summary)
  await supabase
    .from('chat_messages')
    .delete()
    .in('id', messages.map(m => m.id));
  
  console.log(`✅ Summarized ${messages.length} messages, saved ${summary.tokens_saved} tokens`);
}

async function createSummary(messages: any[]) {
  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheap model for summarization
    messages: [
      {
        role: 'system',
        content: `Summarize this conversation. Extract:
1. Main topics discussed
2. Key decisions made
3. Important facts mentioned
4. Action items completed

Format as JSON: { summary: string, facts: string[] }`
      },
      {
        role: 'user',
        content: conversationText,
      }
    ],
  });
  
  const result = JSON.parse(completion.choices[0].message.content);
  
  return {
    text: result.summary,
    facts: result.facts,
    tokens_saved: messages.reduce((sum, m) => sum + (m.input_tokens || 0), 0),
  };
}
```

---

#### 2.3 Inject Memory into New Messages

```typescript
// Before sending to AI
async function getConversationContext(conversationId: string) {
  // 1. Get recent messages (last 20)
  const { data: recentMessages } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(20);
  
  // 2. Get memory summaries
  const { data: memories } = await supabase
    .from('conversation_memory')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  // 3. Build context
  const contextMessages = [];
  
  // Add memory as system message
  if (memories && memories.length > 0) {
    const memoryText = memories
      .map(m => `[Previous conversation summary]\n${m.summary}\n\nKey facts: ${m.key_facts.join(', ')}`)
      .join('\n\n');
    
    contextMessages.push({
      role: 'system',
      content: `Context from earlier in this conversation:\n\n${memoryText}`,
    });
  }
  
  // Add recent messages
  contextMessages.push(...recentMessages.reverse());
  
  return contextMessages;
}
```

**Effekt:**
```
Message 1-50:  Summarized → "User discussed character arc for Max..."
Message 51-100: In Context Window
Message 101:    NEW → AI has full context (summary + recent)
```

---

### ✅ **PHASE 3: RAG Auto-Sync**

#### 3.1 Database Triggers

**Migration**: `005_rag_auto_sync.sql`

```sql
-- Trigger function for auto RAG sync
CREATE OR REPLACE FUNCTION sync_to_rag()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into sync queue
  INSERT INTO rag_sync_queue (
    entity_type,
    entity_id,
    organization_id,
    operation,
    data
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    NEW.organization_id,
    TG_OP, -- INSERT, UPDATE, DELETE
    row_to_json(NEW)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger auf Scenes
CREATE TRIGGER scenes_rag_sync
AFTER INSERT OR UPDATE OR DELETE ON scenes
FOR EACH ROW
EXECUTE FUNCTION sync_to_rag();

-- Trigger auf Characters
CREATE TRIGGER characters_rag_sync
AFTER INSERT OR UPDATE OR DELETE ON characters
FOR EACH ROW
EXECUTE FUNCTION sync_to_rag();

-- Trigger auf Projects
CREATE TRIGGER projects_rag_sync
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW
EXECUTE FUNCTION sync_to_rag();

-- Trigger auf World Items
CREATE TRIGGER world_items_rag_sync
AFTER INSERT OR UPDATE OR DELETE ON world_items
FOR EACH ROW
EXECUTE FUNCTION sync_to_rag();
```

**Sync Queue Table:**
```sql
CREATE TABLE rag_sync_queue (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  data JSONB,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_sync_queue_processed ON rag_sync_queue(processed);
```

---

#### 3.2 Background Sync Worker

**Neue Datei**: `/supabase/functions/server/rag-sync-worker.tsx`

```typescript
// Run every 10 seconds
export async function processRAGSyncQueue() {
  // 1. Get unprocessed items
  const { data: items } = await supabase
    .from('rag_sync_queue')
    .select('*')
    .eq('processed', false)
    .order('created_at', { ascending: true })
    .limit(50);
  
  if (!items || items.length === 0) {
    return;
  }
  
  console.log(`🔄 Processing ${items.length} RAG sync items`);
  
  for (const item of items) {
    try {
      if (item.operation === 'DELETE') {
        // Remove from RAG
        await supabase
          .from('rag_knowledge')
          .delete()
          .eq('entity_type', item.entity_type)
          .eq('entity_id', item.entity_id);
      } else {
        // Insert or Update RAG
        await upsertToRAG(item.entity_type, item.data, item.organization_id);
      }
      
      // Mark as processed
      await supabase
        .from('rag_sync_queue')
        .update({ processed: true })
        .eq('id', item.id);
      
    } catch (error) {
      console.error(`❌ RAG sync error for item ${item.id}:`, error);
    }
  }
  
  console.log(`✅ Processed ${items.length} items`);
}

async function upsertToRAG(entityType: string, data: any, orgId: string) {
  let ragData;
  
  switch (entityType) {
    case 'scenes':
      ragData = {
        entity_type: 'scene',
        entity_id: data.id,
        name: data.title,
        content: `${data.title}\n${data.description || ''}\n${data.content || ''}`,
        metadata: {
          project_id: data.project_id,
          scene_number: data.scene_number,
        },
      };
      break;
    
    case 'characters':
      ragData = {
        entity_type: 'character',
        entity_id: data.id,
        name: data.name,
        content: `${data.name}\n${data.description || ''}`,
        metadata: {
          project_id: data.project_id,
          role: data.role,
        },
      };
      break;
    
    // ... more entity types
  }
  
  await supabase
    .from('rag_knowledge')
    .upsert(ragData, { onConflict: 'entity_id' });
}
```

---

#### 3.3 Start Worker in Server

**Update**: `/supabase/functions/server/index.tsx`

```typescript
// Start RAG sync worker
setInterval(async () => {
  try {
    await processRAGSyncQueue();
  } catch (error) {
    console.error('RAG sync worker error:', error);
  }
}, 10000); // Every 10 seconds

console.log('🔄 RAG Auto-Sync Worker started (10s interval)');
```

**Effekt:**
```
User ändert Szene in UI
  ↓
Database Trigger fires
  ↓
Insert into rag_sync_queue
  ↓
Worker picks up (within 10s)
  ↓
RAG database updated
  ↓
AI Chat hat sofort neue Daten! ✅
```

---

## 📊 **IMPLEMENTATION PLAN**

### Week 1: Phase 1 - MCP/Function Calling
- [ ] Day 1-2: Tool Definitions & Executor
- [ ] Day 3-4: AI Chat Integration (OpenAI)
- [ ] Day 5-6: AI Chat Integration (Anthropic/Google)
- [ ] Day 7: Testing & Frontend Visualization

### Week 2: Phase 2 - Context Window Management
- [ ] Day 1-2: Conversation Memory Table & System
- [ ] Day 3-4: Auto-Summarization Logic
- [ ] Day 5-6: Context Injection & Testing
- [ ] Day 7: Performance Optimization

### Week 3: Phase 3 - RAG Auto-Sync
- [ ] Day 1-2: Database Triggers Setup
- [ ] Day 3-4: Sync Queue & Worker
- [ ] Day 5-6: Testing All Entity Types
- [ ] Day 7: Integration Testing & Cleanup

---

## 🎯 **EXPECTED RESULTS**

### After Phase 1:
```
User: "Benenne Szene 2 um in 'Nachtszene am Hafen'"
AI:   ✅ "Szene 2 wurde umbenannt!"
      🔧 Tool: update_scene ✓
      
User: "Erstelle einen neuen Charakter 'Detective Miller'"
AI:   ✅ "Charakter erstellt!"
      🔧 Tool: create_character ✓
```

### After Phase 2:
```
Conversation with 250K tokens:
- Messages 1-100: Summarized (saved 150K tokens)
- Messages 101-150: In context window
- AI remembers EVERYTHING from summary + recent messages
```

### After Phase 3:
```
User ändert Szene manuell in ProjectsPage
  ↓ (within 10s)
AI Chat RAG automatically updated
  ↓
AI antwortet mit aktuellen Daten ✅
```

---

## 🚨 **PRIORITY ORDER**

1. **PHASE 1** - CRITICAL! (Without this, AI is useless)
2. **PHASE 3** - IMPORTANT (Without this, RAG is broken)
3. **PHASE 2** - NICE TO HAVE (Can wait, only affects long conversations)

---

## 📝 **NEXT STEPS**

**Option A: Implement Phase 1 NOW**
- Tool Definitions
- Tool Executor
- AI Chat Integration
- Frontend Visualization

**Option B: Create detailed spec first**
- Full API documentation
- Test cases
- Error handling strategy

**Option C: Proof of Concept**
- Single tool (update_scene)
- Test with OpenAI
- Expand from there

---

**Was möchtest du als nächstes?**
1. ✅ Ich implementiere **Phase 1 komplett** (MCP/Function Calling)
2. ✅ Ich erstelle **detaillierte Specs** für alle 3 Phasen
3. ✅ Wir machen **Proof of Concept** mit einem Tool

---

**Erstellt**: 15. Oktober 2025  
**Status**: 🔴 ROADMAP READY - IMPLEMENTATION PENDING

/**
 * 🚀 STEP 4: AI CHAT (FINAL)
 * 
 * Fügt hinzu:
 * - Send Message mit OpenAI Integration
 * - RAG Context
 * - Token Counting
 * 
 * Deploy diese Version NACHDEM STEP 3 funktioniert!
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encode } from "npm:gpt-tokenizer@2.1.1";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Token Counter
function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0;
  try {
    if (model.includes('gpt-4') || model.includes('gpt-3.5')) {
      return encode(text).length;
    }
    return Math.ceil(text.length / 3.5);
  } catch {
    return Math.ceil(text.length / 3.5);
  }
}

// Helper
async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

// Health
app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server STEP 4 - Full AI Chat",
    timestamp: new Date().toISOString(),
  });
});

// Settings
app.get("/make-server-3b52693b/ai-chat/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { data } = await supabase
    .from("ai_chat_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const defaults = {
      user_id: userId,
      active_provider: 'openai',
      active_model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: 'Du bist ein hilfreicher KI-Assistent für Scriptwriting.',
      use_rag: true,
    };
    const { data: newSettings } = await supabase
      .from("ai_chat_settings")
      .insert(defaults)
      .select()
      .single();
    return c.json(newSettings);
  }
  return c.json(data);
});

app.put("/make-server-3b52693b/ai-chat/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const updates = await c.req.json();
  const { data } = await supabase
    .from("ai_chat_settings")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();
  return c.json(data);
});

// Conversations
app.get("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const { data } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return c.json(data || []);
});

app.post("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const { title, system_prompt } = await c.req.json();
  const { data } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title: title || "Neue Konversation",
      system_prompt: system_prompt || null,
    })
    .select()
    .single();
  return c.json(data);
});

app.get("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const { data } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("conversation_id", c.req.param("id"))
    .order("created_at", { ascending: true });
  return c.json(data || []);
});

// Send Message (THE BIG ONE!)
app.post("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const convId = c.req.param("id");
    const { message, use_rag } = await c.req.json();

    // Get settings
    const { data: settings } = await supabase
      .from("ai_chat_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      return c.json({ error: "Settings not found" }, 404);
    }

    // Get API key
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return c.json({ error: "OpenAI API key not configured" }, 500);
    }

    // Save user message
    const { data: userMessage } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: convId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    // Get RAG context
    let ragContext = '';
    if (use_rag || settings.use_rag) {
      const { data: ragData } = await supabase
        .from("rag_knowledge")
        .select("content, reference_name, content_type")
        .eq("user_id", userId)
        .textSearch('content', message, { type: 'websearch' })
        .limit(5);

      if (ragData && ragData.length > 0) {
        ragContext = '\n\nRelevanter Kontext:\n' + 
          ragData.map(r => `[${r.content_type}: ${r.reference_name}]\n${r.content}`).join('\n\n');
      }
    }

    // Get conversation & history
    const { data: conversation } = await supabase
      .from("ai_conversations")
      .select("system_prompt")
      .eq("id", convId)
      .single();

    const systemPrompt = conversation?.system_prompt || settings.system_prompt;

    const { data: history } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(10);

    const messages = [
      { role: "system", content: systemPrompt + ragContext },
      ...(history || []).reverse(),
    ];

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: settings.active_model,
        messages,
        temperature: settings.temperature,
        max_tokens: settings.max_tokens,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("OpenAI error:", data);
      return c.json({ error: data.error?.message || 'OpenAI API error' }, 500);
    }

    const aiResponse = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Save AI response
    const { data: assistantMessage } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: convId,
        role: "assistant",
        content: aiResponse,
        tokens_used: tokensUsed,
      })
      .select()
      .single();

    // Update conversation
    await supabase
      .from("ai_conversations")
      .update({ 
        updated_at: new Date().toISOString(),
        message_count: (conversation?.message_count || 0) + 2,
      })
      .eq("id", convId);

    return c.json({
      userMessage,
      assistantMessage,
      tokensUsed,
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return c.json({ error: error.message }, 500);
  }
});

console.log("🚀 STEP 4: Full AI Chat Server starting...");
Deno.serve(app.fetch);

/**
 * 🚀 STEP 3: CONVERSATIONS
 * 
 * Fügt hinzu:
 * - Get Conversations
 * - Create Conversation
 * - Get Messages
 * 
 * Deploy diese Version NACHDEM STEP 2 funktioniert!
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

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

// Helper
async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}

// Health Check
app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server STEP 3 - Conversations",
    timestamp: new Date().toISOString(),
  });
});

// AI Settings (from STEP 2)
app.get("/make-server-3b52693b/ai-chat/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
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

// Get Conversations
app.get("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Conversations fetch error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Conversations error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Create Conversation
app.post("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { title, system_prompt } = await c.req.json();

    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: userId,
        title: title || "Neue Konversation",
        system_prompt: system_prompt || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Conversation create error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Create error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Get Messages
app.get("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const conversationId = c.req.param("id");

    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Messages fetch error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    console.error("Messages error:", error);
    return c.json({ error: error.message }, 500);
  }
});

console.log("🚀 STEP 3: Conversations Server starting...");
Deno.serve(app.fetch);

/**
 * MINIMAL AI ROUTES - FOR TESTING
 * No dependencies, just basic routes to test if import works
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Helper: Get User ID from Auth
async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  return error || !user ? null : user.id;
}

// =============================================================================
// ROUTE: GET AI Settings
// =============================================================================

app.get("/ai/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .from("user_ai_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // If no settings exist, return defaults
    if (error.code === "PGRST116") {
      return c.json({
        active_provider: "openai",
        active_model: "gpt-4o-mini",
        system_prompt: "Du bist ein hilfreicher Assistent für Drehbuchautoren.",
        temperature: 0.7,
        max_tokens: 2000,
        use_rag: true,
      });
    }
    return c.json({ error: error.message }, 500);
  }

  return c.json(data);
});

// =============================================================================
// ROUTE: POST/UPDATE AI Settings
// =============================================================================

app.post("/ai/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();

  // Check if settings exist
  const { data: existing } = await supabase
    .from("user_ai_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("user_ai_settings")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  } else {
    // Create new
    const { data, error } = await supabase
      .from("user_ai_settings")
      .insert({
        user_id: userId,
        ...body,
      })
      .select()
      .single();

    if (error) return c.json({ error: error.message }, 500);
    return c.json(data);
  }
});

// =============================================================================
// ROUTE: GET Conversations
// =============================================================================

app.get("/ai/conversations", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data || []);
});

// =============================================================================
// ROUTE: POST New Conversation
// =============================================================================

app.post("/ai/conversations", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { title } = await c.req.json();

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title: title || "New Conversation",
      last_message_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// =============================================================================
// ROUTE: DELETE Conversation
// =============================================================================

app.delete("/ai/conversations/:id", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const conversationId = c.req.param("id");

  const { error } = await supabase
    .from("ai_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ success: true });
});

// =============================================================================
// ROUTE: POST Chat Message (MINIMAL - No AI calls yet)
// =============================================================================

app.post("/ai/chat", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  return c.json({ 
    error: "AI Chat not implemented yet - use minimal routes for testing only",
    message: "Please configure full AI routes for chat functionality"
  }, 501);
});

export default app;

/**
 * 🚀 STEP 2: AI SETTINGS
 * 
 * Fügt hinzu:
 * - AI Chat Settings GET
 * - AI Chat Settings UPDATE
 * 
 * Deploy diese Version NACHDEM STEP 1 funktioniert!
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
    message: "Scriptony Server STEP 2 - AI Settings",
    timestamp: new Date().toISOString(),
  });
});

// Get AI Settings
app.get("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const { data, error } = await supabase
      .from("ai_chat_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Settings fetch error:", error);
      return c.json({ error: error.message }, 500);
    }

    // Create default if not exists
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

      const { data: newSettings, error: insertError } = await supabase
        .from("ai_chat_settings")
        .insert(defaults)
        .select()
        .single();

      if (insertError) {
        console.error("Settings create error:", insertError);
        return c.json({ error: insertError.message }, 500);
      }

      return c.json(newSettings);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Settings error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update AI Settings
app.put("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const userId = await getUserId(c.req.header("Authorization"));
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("ai_chat_settings")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    console.error("Update error:", error);
    return c.json({ error: error.message }, 500);
  }
});

console.log("🚀 STEP 2: AI Settings Server starting...");
Deno.serve(app.fetch);

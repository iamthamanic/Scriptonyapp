/**
 * 🚀 SCRIPTONY SERVER - COMPLETE DASHBOARD DEPLOY VERSION
 * 
 * ✅ AKTUALISIERT MIT NEUEN TABELLENNAMEN:
 * - ai_chat_settings (statt user_ai_settings)
 * - ai_conversations (statt chat_conversations)
 * - ai_chat_messages (statt chat_messages)
 * - rag_knowledge (user_id statt organization_id)
 * 
 * 📋 DEPLOY ANLEITUNG:
 * 1. Cmd+A → Cmd+C (alles kopieren)
 * 2. Supabase Dashboard → Edge Functions → make-server-3b52693b
 * 3. Cmd+V (einfügen) → Save & Deploy
 * 
 * WICHTIG: Stelle sicher dass diese Environment Variables gesetzt sind:
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY  
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { encode } from "npm:gpt-tokenizer@2.1.1";

// =============================================================================
// SUPABASE CLIENT & APP SETUP
// =============================================================================

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Enable logger & CORS
app.use('*', logger(console.log));
app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
}));

// =============================================================================
// TOKEN COUNTER UTILITY (INLINE)
// =============================================================================

function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0;
  
  try {
    const supportsAccurate = (
      model.includes('gpt-4') ||
      model.includes('gpt-3.5') ||
      model.includes('o1-')
    );
    
    if (supportsAccurate) {
      const tokens = encode(text);
      return tokens.length;
    }
    
    // Estimation for other models
    return Math.ceil(text.length / 3.5);
  } catch (error) {
    return Math.ceil(text.length / 3.5);
  }
}

function countConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): { input_tokens: number; output_tokens: number; total_tokens: number } {
  let inputTokens = 0;
  let outputTokens = 0;
  
  for (const msg of messages) {
    const tokens = countTokens(msg.content, model) + countTokens(msg.role, model) + 4;
    if (msg.role === 'assistant') {
      outputTokens += tokens;
    } else {
      inputTokens += tokens;
    }
  }
  
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function getUserIdFromAuth(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  return user.id;
}

async function getOrCreateUserOrganization(userId: string): Promise<string | null> {
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  if (memberships && memberships.length > 0) {
    return memberships[0].organization_id;
  }

  const { data: user } = await supabase.auth.admin.getUserById(userId);
  if (!user) return null;

  const orgName = `${user.user?.user_metadata?.name || "User"}'s Workspace`;
  const orgSlug = `user-${userId.substring(0, 8)}`;

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      slug: orgSlug,
      created_by: userId,
    })
    .select()
    .single();

  if (orgError || !org) {
    console.error("Error creating organization:", orgError);
    return null;
  }

  await supabase.from("organization_members").insert({
    organization_id: org.id,
    user_id: userId,
    role: "owner",
  });

  return org.id;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// =============================================================================
// AUTH ROUTES
// =============================================================================

app.post("/make-server-3b52693b/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: "Email, password, and name are required" }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role: "user",
      },
      email_confirm: true,
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;
    const organizationId = await getOrCreateUserOrganization(userId);

    if (!organizationId) {
      return c.json({ error: "Failed to create organization" }, 500);
    }

    return c.json({ 
      message: "User created successfully",
      user: { id: userId, email: data.user.email },
      organizationId,
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    return c.json({ error: "Signup failed", details: error.message }, 500);
  }
});

// =============================================================================
// AI CHAT ROUTES (UPDATED WITH NEW TABLE NAMES)
// =============================================================================

// Get AI Chat Settings
app.get("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: settings, error } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching AI settings:", error);
      return c.json({ error: error.message }, 500);
    }

    if (!settings) {
      const defaultSettings = {
        user_id: userId,
        active_provider: 'openai',
        active_model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        system_prompt: 'Du bist ein hilfreicher KI-Assistent für Scriptwriting.',
        use_rag: true,
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("ai_chat_settings")  // ✅ NEUE TABELLE
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        return c.json({ error: insertError.message }, 500);
      }

      return c.json(newSettings);
    }

    return c.json(settings);
  } catch (error: any) {
    console.error("AI settings fetch error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Update AI Chat Settings
app.put("/make-server-3b52693b/ai-chat/settings", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get Conversations
app.get("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create Conversation
app.post("/make-server-3b52693b/ai-chat/conversations", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { title, system_prompt } = await c.req.json();

    const { data, error } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .insert({
        user_id: userId,
        title: title || "Neue Konversation",
        system_prompt: system_prompt || null,
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get Messages
app.get("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const conversationId = c.req.param("id");

    const { data, error } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Send Message (with AI response)
app.post("/make-server-3b52693b/ai-chat/conversations/:id/messages", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const convId = c.req.param("id");
    const { message, use_rag } = await c.req.json();

    // Get user settings
    const { data: settings } = await supabase
      .from("ai_chat_settings")  // ✅ NEUE TABELLE
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      return c.json({ error: "AI settings not found" }, 404);
    }

    // Get API key
    const providerKey = `${settings.active_provider.toUpperCase()}_API_KEY`;
    const apiKey = Deno.env.get(providerKey);

    if (!apiKey) {
      return c.json({ error: `${settings.active_provider} API key not configured` }, 500);
    }

    // Save user message
    const { data: userMessage } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .insert({
        conversation_id: convId,
        role: "user",
        content: message,
      })
      .select()
      .single();

    // Get RAG context if enabled
    let ragContext = '';
    if (use_rag || settings.use_rag) {
      const { data: ragData } = await supabase
        .from("rag_knowledge")
        .select("content, reference_name, content_type")
        .eq("user_id", userId)  // ✅ USER_ID statt ORGANIZATION_ID
        .textSearch('content', message, { type: 'websearch' })
        .limit(5);

      if (ragData && ragData.length > 0) {
        ragContext = '\n\nRelevanter Kontext:\n' + 
          ragData.map(r => `[${r.content_type}: ${r.reference_name}]\n${r.content}`).join('\n\n');
      }
    }

    // Get conversation system prompt or use global
    const { data: conversation } = await supabase
      .from("ai_conversations")  // ✅ NEUE TABELLE
      .select("system_prompt")
      .eq("id", convId)
      .single();

    const systemPrompt = conversation?.system_prompt || settings.system_prompt;

    // Get conversation history
    const { data: history } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
      .select("role, content")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: false })
      .limit(10);

    const messages = [
      { role: "system", content: systemPrompt + ragContext },
      ...(history || []).reverse(),
    ];

    // Call AI provider (OpenAI example)
    let aiResponse = '';
    let tokensUsed = 0;

    if (settings.active_provider === 'openai') {
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
        return c.json({ error: data.error?.message || 'OpenAI API error' }, 500);
      }

      aiResponse = data.choices[0].message.content;
      tokensUsed = data.usage?.total_tokens || 0;
    }

    // Save AI response
    const { data: assistantMessage } = await supabase
      .from("ai_chat_messages")  // ✅ NEUE TABELLE
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
      .from("ai_conversations")  // ✅ NEUE TABELLE
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

// =============================================================================
// PROJECTS ROUTES
// =============================================================================

app.get("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organizationId = await getOrCreateUserOrganization(userId);

    if (!organizationId) {
      return c.json({ error: "No organization found" }, 404);
    }

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data || []);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-3b52693b/projects", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const organizationId = await getOrCreateUserOrganization(userId);
    const projectData = await c.req.json();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...projectData,
        organization_id: organizationId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");
    const updates = await c.req.json();

    const { data, error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json(data);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.delete("/make-server-3b52693b/projects/:id", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.param("id");

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      return c.json({ error: error.message }, 500);
    }

    return c.json({ message: "Project deleted" });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// START SERVER
// =============================================================================

console.log("🚀 Scriptony Server starting...");
Deno.serve(app.fetch);

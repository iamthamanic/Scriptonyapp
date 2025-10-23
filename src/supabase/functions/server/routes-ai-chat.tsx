/**
 * AI CHAT ROUTES
 * 
 * Handles AI chat functionality with multiple providers:
 * - OpenAI (GPT-4, GPT-3.5)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - OpenRouter (Multi-provider)
 * 
 * Features:
 * - Accurate token counting with tiktoken
 * - Context window tracking
 * - RAG support
 */

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import { countTokens, countMessageTokens, countConversationTokens } from "./token-counter.tsx";
import { callOpenAI, callAnthropic } from "./ai-provider-calls.tsx";
import { saveToolCallHistory } from "./tools-integration.tsx";
import type { ToolsConfig } from "./tools-integration.tsx";

const app = new Hono();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// =============================================================================
// TYPES
// =============================================================================

interface AISettings {
  id: string;
  user_id: string;
  openai_api_key?: string;
  anthropic_api_key?: string;
  google_api_key?: string;
  openrouter_api_key?: string;
  deepseek_api_key?: string;
  active_provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | 'deepseek';
  active_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  use_rag: boolean;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  provider?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

// =============================================================================
// HELPER: Get User ID from Auth
// =============================================================================

async function getUserId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  return error || !user ? null : user.id;
}

// =============================================================================
// HELPER: Provider Detection & Validation
// =============================================================================

/**
 * ⚠️ DEPRECATED: String-based detection is unreliable
 * Many providers (OpenAI, DeepSeek, etc.) use same "sk-" prefix
 * Use validateAndDetectProvider() instead for accurate detection
 */
function detectProviderByPrefix(apiKey: string): 'openai' | 'anthropic' | 'google' | 'openrouter' | null {
  // OpenRouter keys start with sk-or-
  if (apiKey.startsWith('sk-or-')) return 'openrouter';
  // Anthropic keys start with sk-ant-
  if (apiKey.startsWith('sk-ant-')) return 'anthropic';
  // Google keys start with AIza
  if (apiKey.startsWith('AIza')) return 'google';
  // ⚠️ All other sk-* keys are assumed OpenAI (UNRELIABLE!)
  if (apiKey.startsWith('sk-')) return 'openai';
  return null;
}

/**
 * ✅ CORRECT: Validate API key by making a test call
 * Returns provider type and validation status
 */
async function validateAndDetectProvider(apiKey: string): Promise<{
  provider: 'openai' | 'anthropic' | 'google' | 'openrouter' | null;
  valid: boolean;
  error?: string;
  models?: string[];
}> {
  // Try OpenRouter first (has unique prefix)
  if (apiKey.startsWith('sk-or-')) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          provider: 'openrouter', 
          valid: true,
          models: data.data?.slice(0, 5).map((m: any) => m.id) || []
        };
      }
      return { provider: 'openrouter', valid: false, error: 'Invalid OpenRouter API key' };
    } catch (error: any) {
      return { provider: 'openrouter', valid: false, error: error.message };
    }
  }
  
  // Try Anthropic (has unique prefix)
  if (apiKey.startsWith('sk-ant-')) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });
      
      if (response.status === 401) {
        return { provider: 'anthropic', valid: false, error: 'Invalid Anthropic API key' };
      }
      
      return { provider: 'anthropic', valid: true, models: ['claude-3-5-sonnet', 'claude-3-opus'] };
    } catch (error: any) {
      return { provider: 'anthropic', valid: false, error: error.message };
    }
  }
  
  // Try Google (has unique prefix)
  if (apiKey.startsWith('AIza')) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return { 
          provider: 'google', 
          valid: true,
          models: data.models?.slice(0, 5).map((m: any) => m.name) || []
        };
      }
      return { provider: 'google', valid: false, error: 'Invalid Google API key' };
    } catch (error: any) {
      return { provider: 'google', valid: false, error: error.message };
    }
  }
  
  // For generic "sk-" keys, try OpenAI first
  if (apiKey.startsWith('sk-')) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          provider: 'openai', 
          valid: true,
          models: data.data?.slice(0, 5).map((m: any) => m.id) || []
        };
      }
      
      if (response.status === 401) {
        // Not OpenAI - could be DeepSeek or other provider
        // Try DeepSeek
        try {
          const deepseekResponse = await fetch('https://api.deepseek.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
          });
          
          if (deepseekResponse.ok) {
            console.log('✅ Detected DeepSeek API key');
            const data = await deepseekResponse.json();
            return { 
              provider: 'deepseek', // ✅ DeepSeek is now its own provider
              valid: true,
              models: data.data?.slice(0, 5).map((m: any) => m.id) || ['deepseek-chat', 'deepseek-coder', 'deepseek-v3']
            };
          }
        } catch (e) {
          console.log('❌ Not DeepSeek:', e);
        }
        
        return { provider: null, valid: false, error: 'Invalid API key for any known provider' };
      }
    } catch (error: any) {
      return { provider: null, valid: false, error: error.message };
    }
  }
  
  return { provider: null, valid: false, error: 'Unknown API key format' };
}

function getDefaultModel(provider: string): string {
  const models: Record<string, string> = {
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    google: 'gemini-2.0-flash-exp',
    openrouter: 'openai/gpt-4o-mini',
    deepseek: 'deepseek-chat',
  };
  return models[provider] || 'gpt-4o-mini';
}

// Context windows per model (in tokens)
function getContextWindow(model: string): number {
  const windows: Record<string, number> = {
    // DeepSeek (OpenAI-compatible)
    'deepseek-chat': 64000,
    'deepseek-coder': 64000,
    'deepseek-v3': 64000,
    
    // OpenAI - GPT-5 (Preview)
    'gpt-5-turbo-preview': 200000,
    'gpt-5-mini-preview': 200000,
    
    // OpenAI - O1 Models
    'o1-preview': 128000,
    'o1-mini': 128000,
    
    // OpenAI - GPT-4
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4-turbo-preview': 128000,
    'gpt-4': 8192,
    
    // OpenAI - GPT-3.5
    'gpt-3.5-turbo': 16385,
    'gpt-3.5-turbo-16k': 16385,
    
    // Anthropic
    'claude-opus-4-20250514': 200000,
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-5-haiku-20241022': 200000,
    'claude-3-opus-20240229': 200000,
    'claude-3-sonnet-20240229': 200000,
    'claude-3-haiku-20240307': 200000,
    'claude-2.1': 200000,
    'claude-2.0': 100000,
    
    // Google
    'gemini-2.5-pro': 2000000,
    'gemini-2.0-flash-exp': 1000000,
    'gemini-1.5-pro': 2000000,
    'gemini-1.5-flash': 1000000,
    'gemini-pro': 32768,
    'gemini-pro-vision': 32768,
    
    // OpenRouter models (same as above with provider prefix)
    'openai/gpt-4o': 128000,
    'openai/gpt-4o-mini': 128000,
    'openai/gpt-4-turbo': 128000,
    'openai/o1-preview': 128000,
    'openai/o1-mini': 128000,
    'anthropic/claude-opus-4': 200000,
    'anthropic/claude-3.5-sonnet': 200000,
    'anthropic/claude-3.5-haiku': 200000,
    'anthropic/claude-3-opus': 200000,
    'anthropic/claude-3-sonnet': 200000,
    'anthropic/claude-3-haiku': 200000,
    'google/gemini-2.5-pro': 2000000,
    'google/gemini-2.0-flash-exp': 1000000,
    'google/gemini-1.5-pro': 2000000,
    'google/gemini-1.5-flash': 1000000,
    'google/gemini-pro': 32768,
    'meta-llama/llama-3.3-70b-instruct': 128000,
    'meta-llama/llama-3.1-405b-instruct': 128000,
    'meta-llama/llama-3.1-70b-instruct': 128000,
    'mistralai/mistral-large': 128000,
    'mistralai/mistral-medium': 32000,
    'deepseek/deepseek-chat': 64000,
    'x-ai/grok-2': 128000,
    'perplexity/llama-3.1-sonar-large-128k-online': 128000,
  };
  
  return windows[model] || 200000; // Default fallback
}

function getAvailableModels(provider: string): Array<{ id: string; name: string; context_window: number }> {
  const modelConfigs: Record<string, Array<{ id: string; name: string }>> = {
    openai: [
      // GPT-5 Models (Preview - Latest)
      { id: 'gpt-5-turbo-preview', name: 'GPT-5 Turbo (Preview)' },
      { id: 'gpt-5-mini-preview', name: 'GPT-5 Mini (Preview)' },
      
      // O1 Models (Reasoning)
      { id: 'o1-preview', name: 'O1 Preview' },
      { id: 'o1-mini', name: 'O1 Mini' },
      
      // GPT-4 Models (Current Best)
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo Preview' },
      { id: 'gpt-4', name: 'GPT-4' },
      
      // GPT-3.5 Models (Legacy)
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-3.5-turbo-16k', name: 'GPT-3.5 Turbo 16K' },
    ],
    deepseek: [
      // DeepSeek Models (OpenAI-compatible API)
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
      // DeepSeek V3
      { id: 'deepseek-v3', name: 'DeepSeek V3' },
    ],
    anthropic: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
      { id: 'claude-2.1', name: 'Claude 2.1' },
      { id: 'claude-2.0', name: 'Claude 2.0' },
    ],
    google: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-pro', name: 'Gemini Pro' },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision' },
    ],
    openrouter: [
      // Top 20 models across all providers
      { id: 'openai/gpt-4o', name: 'GPT-4o' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo' },
      { id: 'openai/o1-preview', name: 'O1 Preview' },
      { id: 'openai/o1-mini', name: 'O1 Mini' },
      { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku' },
      { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
      { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet' },
      { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash' },
      { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
      { id: 'google/gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
      { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B' },
      { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B' },
      { id: 'mistralai/mistral-large', name: 'Mistral Large' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'x-ai/grok-2', name: 'Grok 2' },
      { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Perplexity Sonar (Online)' },
    ],
  };
  
  const configs = modelConfigs[provider] || [];
  return configs.map(({ id, name }) => ({
    id,
    name,
    context_window: getContextWindow(id),
  }));
}

// =============================================================================
// ROUTE: GET AI Settings
// =============================================================================

app.get("/ai/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { data, error } = await supabase
    .from("ai_chat_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found is OK
    return c.json({ error: error.message }, 500);
  }

  // If no settings exist, create defaults
  if (!data) {
    const { data: newSettings, error: insertError } = await supabase
      .from("ai_chat_settings")
      .insert({
        user_id: userId,
        active_provider: 'openai',
        active_model: 'gpt-4o-mini',
        system_prompt: 'Du bist Scriptony AI, ein spezialisierter Assistent für Drehbuchautoren.',
        temperature: 0.7,
        max_tokens: 2000,
        use_rag: true,
      })
      .select()
      .single();

    if (insertError) {
      return c.json({ error: insertError.message }, 500);
    }

    return c.json({ settings: newSettings });
  }

  return c.json({ settings: data });
});

// =============================================================================
// ROUTE: VALIDATE API Key
// =============================================================================

app.post("/ai/validate-key", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { api_key } = await c.req.json();

  if (!api_key) {
    return c.json({ error: "API key required" }, 400);
  }

  try {
    console.log(`🔍 Validating API key for user ${userId}...`);
    const result = await validateAndDetectProvider(api_key);
    
    console.log(`✅ Validation result:`, {
      provider: result.provider,
      valid: result.valid,
      models: result.models?.length || 0,
    });
    
    return c.json({
      valid: result.valid,
      provider: result.provider,
      models: result.models,
      error: result.error,
    });
  } catch (error: any) {
    console.error('❌ API key validation error:', error);
    return c.json({ 
      valid: false,
      error: error.message || 'Validation failed',
    }, 500);
  }
});

// =============================================================================
// ROUTE: UPDATE AI Settings
// =============================================================================

app.put("/ai/settings", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();

  // Auto-detect provider if API key is provided
  if (body.openai_api_key) {
    body.active_provider = 'openai';
    body.active_model = body.active_model || 'gpt-4o-mini';
  } else if (body.anthropic_api_key) {
    body.active_provider = 'anthropic';
    body.active_model = body.active_model || 'claude-3-5-sonnet-20241022';
  } else if (body.google_api_key) {
    body.active_provider = 'google';
    body.active_model = body.active_model || 'gemini-pro';
  } else if (body.openrouter_api_key) {
    body.active_provider = 'openrouter';
    body.active_model = body.active_model || 'openai/gpt-4o-mini';
  }

  // Check if settings exist
  const { data: existing } = await supabase
    .from("ai_chat_settings")
    .select("id")
    .eq("user_id", userId)
    .single();

  let data, error;
  
  if (existing) {
    // Update existing settings
    const result = await supabase
      .from("ai_chat_settings")
      .update(body)
      .eq("user_id", userId)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    // Insert new settings
    const result = await supabase
      .from("ai_chat_settings")
      .insert({
        user_id: userId,
        ...body,
      })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const models = getAvailableModels(data.active_provider);
  
  return c.json({ 
    settings: data,
    available_models: models.map(m => m.id),
    models_with_context: models,
  });
});

// =============================================================================
// ROUTE: Detect Provider from API Key
// =============================================================================

app.post("/ai/detect-provider", async (c) => {
  const { api_key } = await c.req.json();

  if (!api_key) {
    return c.json({ error: "API key required" }, 400);
  }

  const provider = detectProvider(api_key);

  if (!provider) {
    return c.json({ 
      error: "Unknown provider. Supported: OpenAI (sk-...), Anthropic (sk-ant-...), Google (AIza...)" 
    }, 400);
  }

  const models = getAvailableModels(provider);
  
  return c.json({
    provider,
    default_model: getDefaultModel(provider),
    available_models: models.map(m => m.id),
    models_with_context: models,
  });
});

// OpenRouter Models Cache (1 hour TTL)
let openRouterModelsCache: {
  models: Array<{ id: string; name: string; context_window: number }>;
  timestamp: number;
} | null = null;

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

// Fetch live models from OpenRouter API
async function fetchOpenRouterModels(apiKey?: string): Promise<Array<{ id: string; name: string; context_window: number }>> {
  // Check cache first
  if (openRouterModelsCache && Date.now() - openRouterModelsCache.timestamp < CACHE_TTL) {
    console.log('✅ OpenRouter models from cache');
    return openRouterModelsCache.models;
  }

  try {
    console.log('🔄 Fetching live models from OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {},
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for top 20 most popular models with proper context windows
    const topModels = (data.data || [])
      .filter((m: any) => m.id && m.name && m.context_length)
      .sort((a: any, b: any) => {
        // Prioritize: GPT-4, Claude, Gemini, then others
        const priority = (id: string) => {
          if (id.includes('gpt-4o')) return 1;
          if (id.includes('claude-opus-4')) return 2;
          if (id.includes('claude-3.5')) return 3;
          if (id.includes('gemini-2')) return 4;
          if (id.includes('gemini-1.5')) return 5;
          if (id.includes('llama-3.3')) return 6;
          if (id.includes('deepseek')) return 7;
          return 10;
        };
        return priority(a.id) - priority(b.id);
      })
      .slice(0, 20)
      .map((m: any) => ({
        id: m.id,
        name: m.name,
        context_window: m.context_length || 200000,
      }));

    // Update cache
    openRouterModelsCache = {
      models: topModels,
      timestamp: Date.now(),
    };

    console.log(`✅ Cached ${topModels.length} OpenRouter models`);
    return topModels;
  } catch (error) {
    console.error('❌ Failed to fetch OpenRouter models:', error);
    // Fallback to hardcoded list
    return getAvailableModels('openrouter');
  }
}

// =============================================================================
// ROUTE: GET Available Models with Context Windows
// =============================================================================

app.get("/ai/models", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  // Get user's active provider and API keys
  const { data: settings } = await supabase
    .from("ai_chat_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  const provider = settings?.active_provider || 'openai';
  
  let models: Array<{ id: string; name: string; context_window: number }>;

  // For OpenRouter, fetch live models
  if (provider === 'openrouter' && settings?.openrouter_api_key) {
    models = await fetchOpenRouterModels(settings.openrouter_api_key);
  } else {
    models = getAvailableModels(provider);
  }

  return c.json({
    provider,
    models,
  });
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
    .order("updated_at", { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ conversations: data });
});

// =============================================================================
// ROUTE: CREATE Conversation
// =============================================================================

app.post("/ai/conversations", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { title, system_prompt } = await c.req.json();

  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      user_id: userId,
      title: title || "Neue Unterhaltung",
      system_prompt: system_prompt || null, // NULL = use global
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ conversation: data });
});

// =============================================================================
// ROUTE: UPDATE Conversation System Prompt
// =============================================================================

app.put("/ai/conversations/:id/prompt", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const conversationId = c.req.param("id");
  const { system_prompt } = await c.req.json();

  const { data, error } = await supabase
    .from("ai_conversations")
    .update({ system_prompt })
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ conversation: data });
});

// =============================================================================
// ROUTE: GET Messages for Conversation
// =============================================================================

app.get("/ai/conversations/:id/messages", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const conversationId = c.req.param("id");

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ messages: data });
});

// =============================================================================
// ROUTE: SEND Chat Message (with AI Response)
// =============================================================================

app.post("/ai/chat", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { conversation_id, message, use_rag } = await c.req.json();

  if (!message) {
    return c.json({ error: "Message required" }, 400);
  }

  try {
    // Get user settings
    const { data: settings } = await supabase
      .from("ai_chat_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!settings) {
      return c.json({ error: "AI settings not configured. Please add an API key in Settings." }, 400);
    }

    // Get API key based on provider
    const apiKey = settings.active_provider === 'openai' 
      ? settings.openai_api_key
      : settings.active_provider === 'anthropic'
      ? settings.anthropic_api_key
      : settings.active_provider === 'google'
      ? settings.google_api_key
      : settings.active_provider === 'openrouter'
      ? settings.openrouter_api_key
      : null;

    if (!apiKey) {
      return c.json({ error: `No API key configured for ${settings.active_provider}. Please add your API key in Chat Settings.` }, 400);
    }

    // Create conversation if not exists
    let convId = conversation_id;
    if (!convId) {
      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({ 
          user_id: userId, 
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();
      
      convId = newConv!.id;
    }

    // Save user message
    await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: convId,
        user_id: userId,
        role: "user",
        content: message,
      });

    // Get RAG context if enabled
    let ragContext = '';
    if (use_rag || settings.use_rag) {
      const { data: ragData } = await supabase
        .from("rag_knowledge")
        .select("content, reference_name, content_type")
        .eq("user_id", userId)
        .textSearch('content', message, { type: 'websearch' })
        .limit(5);

      if (ragData && ragData.length > 0) {
        ragContext = '\n\nRelevanter Kontext aus deinen Projekten:\n' + 
          ragData.map(r => `[${r.content_type}: ${r.reference_name}]\n${r.content}`).join('\n\n');
      }
    }

    // Get conversation system prompt (if set) or use global
    const { data: conversation } = await supabase
      .from("ai_conversations")
      .select("system_prompt")
      .eq("id", convId)
      .single();

    const systemPrompt = conversation?.system_prompt || settings.system_prompt;

    // Get conversation history (last 10 messages)
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

    // Count input tokens BEFORE API call (for accurate tracking)
    const inputTokenCount = countConversationTokens(messages, settings.active_model);
    console.log(`[Token Count] Input: ${inputTokenCount.total_tokens} tokens (${inputTokenCount.input_tokens} user + ${inputTokenCount.output_tokens} assistant)`);

    // Build tools config (user-based, no organization needed)
    const toolsConfig: ToolsConfig = {
      enabled: true, // Always enable tools
      provider: settings.active_provider,
      userId,
      organizationId: userId, // Use userId directly for user-based data
      conversationId: convId,
      supabase,
    };

    // Call AI provider with tool support
    let aiResponse = '';
    let tokensUsed = 0;
    let toolCalls: any[] = [];

    if (settings.active_provider === 'openai') {
      const result = await callOpenAI({
        provider: 'openai',
        model: settings.active_model,
        messages,
        apiKey,
        temperature: settings.temperature,
        maxTokens: settings.max_tokens,
        toolsEnabled: true,
        toolsConfig,
      });

      aiResponse = result.content;
      tokensUsed = result.tokensUsed;
      toolCalls = result.toolCalls || [];
      
      console.log(`[OpenAI Tokens] Total: ${tokensUsed}${toolCalls.length > 0 ? `, Tools: ${toolCalls.length}` : ''}`);
    } 
    else if (settings.active_provider === 'anthropic') {
      const result = await callAnthropic({
        provider: 'anthropic',
        model: settings.active_model,
        messages,
        apiKey,
        temperature: settings.temperature,
        maxTokens: settings.max_tokens,
        toolsEnabled: true,
        toolsConfig,
      });

      aiResponse = result.content;
      tokensUsed = result.tokensUsed;
      toolCalls = result.toolCalls || [];
      
      console.log(`[Anthropic Tokens] Total: ${tokensUsed}${toolCalls.length > 0 ? `, Tools: ${toolCalls.length}` : ''}`);
    }
    else if (settings.active_provider === 'google') {
      // Google Gemini implementation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${settings.active_model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: settings.temperature,
              maxOutputTokens: settings.max_tokens,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google API error: ${error}`);
      }

      const data = await response.json();
      aiResponse = data.candidates[0].content.parts[0].text;
      tokensUsed = data.usageMetadata?.totalTokenCount || 0;
      
      console.log(`[Google Tokens] Total: ${tokensUsed}`);
    }

    // Ensure aiResponse has content (even if only tool calls)
    if (!aiResponse || aiResponse.trim() === '') {
      if (toolCalls.length > 0) {
        // Generate summary from tool calls
        const toolSummaries = toolCalls.map((tc: any) => {
          const success = tc.result?.success ? '✅' : '❌';
          return `${success} ${tc.tool_name}: ${tc.result?.message || tc.result?.error || 'Completed'}`;
        });
        aiResponse = `Aktionen durchgeführt:\n\n${toolSummaries.join('\n')}`;
        console.log('⚠️ AI returned no content - generated tool summary');
      } else {
        aiResponse = 'Entschuldigung, ich konnte keine Antwort generieren.';
        console.warn('⚠️ AI returned empty response with no tool calls');
      }
    }

    // Save AI response with tool calls
    const { data: assistantMessage } = await supabase
      .from("ai_chat_messages")
      .insert({
        conversation_id: convId,
        user_id: userId,
        role: "assistant",
        content: aiResponse,
        model: settings.active_model,
        provider: settings.active_provider,
        tokens_used: tokensUsed,
        tool_calls: toolCalls.length > 0 ? toolCalls : null, // Save tool calls as JSONB
      })
      .select()
      .single();

    // Save tool call history for analytics
    if (toolCalls.length > 0 && assistantMessage) {
      await saveToolCallHistory(
        convId,
        assistantMessage.id,
        toolCalls,
        supabase
      );
      console.log(`✅ Saved ${toolCalls.length} tool calls to history`);
    }

    // Calculate token breakdown for response
    const responseTokens = countTokens(aiResponse, settings.active_model);
    
    return c.json({
      conversation_id: convId,
      message: assistantMessage,
      tokens_used: tokensUsed,
      token_details: {
        input_tokens: inputTokenCount.total_tokens,
        output_tokens: responseTokens,
        total_tokens: tokensUsed || (inputTokenCount.total_tokens + responseTokens),
        estimated: !tokensUsed, // True if we had to estimate (API didn't provide)
      },
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return c.json({ 
      error: error.message || 'Failed to generate response',
      details: error.toString(),
    }, 500);
  }
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

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true });
});

// =============================================================================
// ROUTE: Count Tokens (for frontend estimation)
// =============================================================================

app.post("/ai/count-tokens", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const { text, model } = await c.req.json();

  if (!text) {
    return c.json({ error: "Text required" }, 400);
  }

  try {
    // Get user's active model if not provided
    let activeModel = model;
    if (!activeModel) {
      const { data: settings } = await supabase
        .from("ai_chat_settings")
        .select("active_model")
        .eq("user_id", userId)
        .single();
      
      activeModel = settings?.active_model || 'gpt-4o';
    }

    const tokens = countTokens(text, activeModel);

    return c.json({
      tokens,
      characters: text.length,
      model: activeModel,
    });
  } catch (error: any) {
    console.error('Token counting error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// ROUTE: Sync RAG Knowledge
// =============================================================================

app.post("/ai/rag/sync", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  try {
    // Delete old RAG data
    await supabase
      .from("rag_knowledge")
      .delete()
      .eq("user_id", userId);

    let synced = 0;

    // Sync Projects (organization-based)
    // Get user's organizations first
    const { data: orgMemberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId);
    
    const orgIds = orgMemberships?.map(m => m.organization_id) || [];
    
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .in("organization_id", orgIds)
      .eq("is_deleted", false);

    for (const project of projects || []) {
      await supabase.from("rag_knowledge").insert({
        user_id: userId,
        content: `Projekt: ${project.title}\n${project.description || ''}\nGenre: ${project.genre || ''}`,
        content_type: 'project',
        reference_id: project.id,
        reference_name: project.title,
        metadata: { title: project.title, genre: project.genre },
      });
      synced++;
    }

    // Sync Characters (user-based)
    const { data: characters } = await supabase
      .from("characters")
      .select("*")
      .eq("user_id", userId);

    for (const char of characters || []) {
      await supabase.from("rag_knowledge").insert({
        user_id: userId,
        content: `Charakter: ${char.name}\n${char.description || ''}\nMotivation: ${char.motivation || ''}`,
        content_type: 'character',
        reference_id: char.id,
        reference_name: char.name,
        metadata: { name: char.name, age: char.age },
      });
      synced++;
    }

    // Sync Worlds (user-based)
    const { data: worlds } = await supabase
      .from("worlds")
      .select("*")
      .eq("user_id", userId);

    for (const world of worlds || []) {
      await supabase.from("rag_knowledge").insert({
        user_id: userId,
        content: `Welt: ${world.name}\n${world.description || ''}`,
        content_type: 'world',
        reference_id: world.id,
        reference_name: world.name,
        metadata: { name: world.name },
      });
      synced++;
    }

    // Sync World Items (user-based)
    const { data: items } = await supabase
      .from("world_items")
      .select("*")
      .eq("user_id", userId);

    for (const item of items || []) {
      await supabase.from("rag_knowledge").insert({
        user_id: userId,
        content: `${item.name}\n${item.description || ''}`,
        content_type: 'worlditem',
        reference_id: item.id,
        reference_name: item.name,
        metadata: { name: item.name, type: item.type },
      });
      synced++;
    }

    return c.json({ 
      success: true, 
      synced,
      message: `${synced} Einträge in RAG-Datenbank synchronisiert`,
    });

  } catch (error: any) {
    console.error('RAG Sync Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default app;

/**
 * 🔧 TOOL INTEGRATION FOR AI CHAT
 * 
 * Handles Function Calling integration with AI providers
 * - Multi-provider support (OpenAI, Anthropic, Google, Fallback)
 * - Tool execution
 * - Result formatting
 */

import { toolRegistry } from './tools-registry.tsx';
import { getAdapter } from './tools-providers.tsx';
import type { ToolContext, ToolResult } from './tools-registry.tsx';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.39.3';

// Import all tool modules (they self-register)
import './tools-scenes.tsx';
import './tools-characters.tsx';
import './tools-projects.tsx';
import './tools-episodes.tsx';

// ==================== TYPES ====================

export interface ToolsConfig {
  enabled: boolean;
  provider: string;
  userId: string;
  organizationId: string;
  conversationId: string;
  supabase: SupabaseClient;
}

export interface ToolExecutionResult {
  success: boolean;
  toolCalls: any[];
  finalResponse?: string;
  error?: string;
}

// ==================== TOOL INTEGRATION ====================

/**
 * Process AI response and execute any tool calls
 */
export async function processToolCalls(
  aiResponse: any,
  config: ToolsConfig,
  messages: any[]
): Promise<ToolExecutionResult> {
  if (!config.enabled) {
    return { success: true, toolCalls: [] };
  }

  try {
    // Get provider adapter
    const adapter = getAdapter(config.provider);

    // Extract tool calls from AI response
    const toolCalls = adapter.extractToolCalls(aiResponse);

    if (toolCalls.length === 0) {
      return { success: true, toolCalls: [] };
    }

    console.log(`🔧 AI requested ${toolCalls.length} tool calls`);

    // Build tool context
    const context: ToolContext = {
      userId: config.userId,
      organizationId: config.organizationId,
      conversationId: config.conversationId,
      supabase: config.supabase,
    };

    // Execute each tool
    const toolResults: any[] = [];
    const executionHistory: any[] = [];

    for (const toolCall of toolCalls) {
      const startTime = Date.now();
      
      try {
        console.log(`  🔧 Executing: ${toolCall.function.name}`);
        
        const params = JSON.parse(toolCall.function.arguments);
        
        const result: ToolResult = await toolRegistry.execute(
          toolCall.function.name,
          params,
          context
        );

        const executionTime = Date.now() - startTime;

        // Format result for AI
        const formattedResult = adapter.formatToolResult(toolCall.id, result);
        toolResults.push(formattedResult);

        // Track execution history
        executionHistory.push({
          tool_name: toolCall.function.name,
          parameters: params,
          result: result,
          success: result.success,
          error: result.error || null,
          execution_time_ms: executionTime,
        });

        console.log(`  ✅ ${toolCall.function.name}: ${result.message || 'Success'}`);
      } catch (error: any) {
        console.error(`  ❌ Tool execution failed:`, error);
        
        const errorResult = {
          success: false,
          error: error.message,
        };

        const formattedResult = adapter.formatToolResult(toolCall.id, errorResult);
        toolResults.push(formattedResult);

        executionHistory.push({
          tool_name: toolCall.function.name,
          parameters: {},
          result: errorResult,
          success: false,
          error: error.message,
          execution_time_ms: Date.now() - startTime,
        });
      }
    }

    return {
      success: true,
      toolCalls: executionHistory,
    };
  } catch (error: any) {
    console.error('❌ Tool processing error:', error);
    return {
      success: false,
      toolCalls: [],
      error: error.message,
    };
  }
}

/**
 * Get tools formatted for AI provider
 */
export function getFormattedTools(provider: string): any {
  const adapter = getAdapter(provider);
  const allTools = toolRegistry.getAll();
  
  console.log(`📋 Formatting ${allTools.length} tools for provider: ${provider}`);
  
  return adapter.formatTools(allTools);
}

/**
 * Check if provider supports native tool calling
 */
export function supportsToolCalling(provider: string): boolean {
  const adapter = getAdapter(provider);
  return adapter.supportsNativeToolCalling;
}

/**
 * Save tool call history to database
 */
export async function saveToolCallHistory(
  conversationId: string,
  messageId: string,
  toolCalls: any[],
  supabase: SupabaseClient
) {
  if (toolCalls.length === 0) return;

  try {
    const records = toolCalls.map(tc => ({
      conversation_id: conversationId,
      message_id: messageId,
      tool_name: tc.tool_name,
      parameters: tc.parameters,
      result: tc.result,
      success: tc.success,
      error: tc.error,
      execution_time_ms: tc.execution_time_ms,
      created_at: new Date().toISOString(),
    }));

    await supabase.from('tool_call_history').insert(records);
    
    console.log(`✅ Saved ${toolCalls.length} tool calls to history`);
  } catch (error) {
    console.error('⚠️ Failed to save tool call history:', error);
    // Don't fail the main operation
  }
}

console.log('✅ Tool integration loaded');

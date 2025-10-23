/**
 * 🔌 PROVIDER ADAPTERS FOR FUNCTION CALLING
 * 
 * Adapts tool definitions for different AI providers:
 * - OpenAI (GPT-4, GPT-5, O1)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - OpenRouter (DeepSeek, Qwen, Mistral, etc.)
 * - Local Models (Ollama, LM Studio)
 * 
 * Includes fallback for models without native function calling.
 */

import type { ScriptonyTool } from './tools-registry.tsx';

// ==================== TYPES ====================

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ProviderAdapter {
  name: string;
  supportsNativeToolCalling: boolean;
  formatTools(tools: ScriptonyTool[]): any;
  extractToolCalls(response: any): ToolCall[];
  formatToolResult(toolCallId: string, result: any): any;
}

// ==================== OPENAI ADAPTER ====================

export const OpenAIAdapter: ProviderAdapter = {
  name: 'openai',
  supportsNativeToolCalling: true,

  formatTools(tools: ScriptonyTool[]) {
    return tools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  },

  extractToolCalls(response: any): ToolCall[] {
    const message = response.choices?.[0]?.message;
    if (!message?.tool_calls) return [];
    
    return message.tool_calls.map((tc: any) => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));
  },

  formatToolResult(toolCallId: string, result: any) {
    return {
      role: 'tool',
      tool_call_id: toolCallId,
      content: JSON.stringify(result),
    };
  },
};

// ==================== ANTHROPIC ADAPTER ====================

export const AnthropicAdapter: ProviderAdapter = {
  name: 'anthropic',
  supportsNativeToolCalling: true,

  formatTools(tools: ScriptonyTool[]) {
    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  },

  extractToolCalls(response: any): ToolCall[] {
    const content = response.content || [];
    const toolCalls: ToolCall[] = [];

    for (let i = 0; i < content.length; i++) {
      const block = content[i];
      if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          type: 'function',
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input),
          },
        });
      }
    }

    return toolCalls;
  },

  formatToolResult(toolCallId: string, result: any) {
    return {
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolCallId,
          content: JSON.stringify(result),
        },
      ],
    };
  },
};

// ==================== GOOGLE ADAPTER ====================

export const GoogleAdapter: ProviderAdapter = {
  name: 'google',
  supportsNativeToolCalling: true,

  formatTools(tools: ScriptonyTool[]) {
    return {
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      })),
    };
  },

  extractToolCalls(response: any): ToolCall[] {
    const candidates = response.candidates || [];
    const toolCalls: ToolCall[] = [];

    for (const candidate of candidates) {
      const functionCalls = candidate.content?.parts?.filter(
        (part: any) => part.functionCall
      ) || [];

      for (const fc of functionCalls) {
        toolCalls.push({
          id: `google-${Date.now()}-${Math.random()}`,
          type: 'function',
          function: {
            name: fc.functionCall.name,
            arguments: JSON.stringify(fc.functionCall.args || {}),
          },
        });
      }
    }

    return toolCalls;
  },

  formatToolResult(toolCallId: string, result: any) {
    return {
      role: 'function',
      parts: [
        {
          functionResponse: {
            name: result.tool_name,
            response: result,
          },
        },
      ],
    };
  },
};

// ==================== FALLBACK ADAPTER ====================
// For models without native function calling (DeepSeek, Qwen, Mistral, Local Models)

export const FallbackAdapter: ProviderAdapter = {
  name: 'fallback',
  supportsNativeToolCalling: false,

  formatTools(tools: ScriptonyTool[]) {
    // Return tools as system message instruction
    const toolDescriptions = tools.map(tool => {
      const params = Object.entries(tool.parameters.properties)
        .map(([key, prop]: [string, any]) => 
          `  - ${key} (${prop.type}): ${prop.description || ''}`
        )
        .join('\n');

      return `
TOOL: ${tool.name}
Description: ${tool.description}
Parameters:
${params}
Required: ${tool.parameters.required.join(', ')}

To use this tool, respond with JSON:
{
  "tool": "${tool.name}",
  "parameters": {
    // your parameters here
  }
}
`;
    }).join('\n---\n');

    return {
      systemMessage: `You have access to the following tools:\n\n${toolDescriptions}\n\nIMPORTANT: When you want to use a tool, respond ONLY with a JSON object in the format shown above. Do not include any other text.`,
    };
  },

  extractToolCalls(response: any): ToolCall[] {
    // Try to extract JSON from response text
    const text = response.choices?.[0]?.message?.content || 
                 response.content?.[0]?.text || 
                 response.text || 
                 '';

    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*"tool"[\s\S]*"parameters"[\s\S]*\}/);
    if (!jsonMatch) return [];

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.tool && parsed.parameters) {
        return [{
          id: `fallback-${Date.now()}`,
          type: 'function',
          function: {
            name: parsed.tool,
            arguments: JSON.stringify(parsed.parameters),
          },
        }];
      }
    } catch (error) {
      console.error('Failed to parse tool call from response:', error);
    }

    return [];
  },

  formatToolResult(toolCallId: string, result: any) {
    return {
      role: 'user',
      content: `Tool execution result:\n${JSON.stringify(result, null, 2)}`,
    };
  },
};

// ==================== ADAPTER REGISTRY ====================

export function getAdapter(provider: string): ProviderAdapter {
  switch (provider.toLowerCase()) {
    case 'openai':
      return OpenAIAdapter;
    
    case 'anthropic':
      return AnthropicAdapter;
    
    case 'google':
      return GoogleAdapter;
    
    // All these use OpenAI-compatible format
    case 'openrouter':
    case 'deepseek':
    case 'qwen':
    case 'mistral':
      // Try OpenAI format first, fallback if needed
      return OpenAIAdapter;
    
    // Local models usually use OpenAI-compatible API
    case 'ollama':
    case 'lmstudio':
    case 'localai':
      return OpenAIAdapter;
    
    default:
      console.warn(`⚠️ Unknown provider "${provider}", using fallback adapter`);
      return FallbackAdapter;
  }
}

// ==================== PROVIDER CAPABILITIES ====================

export interface ProviderCapabilities {
  supportsNativeToolCalling: boolean;
  requiresSystemMessage: boolean;
  maxToolsPerRequest: number;
  notes?: string;
}

export const PROVIDER_CAPABILITIES: Record<string, ProviderCapabilities> = {
  openai: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 128,
    notes: 'Full support for function calling (GPT-4, GPT-5, O1)',
  },
  
  anthropic: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 64,
    notes: 'Full support for tool use (Claude 3+)',
  },
  
  google: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 64,
    notes: 'Full support for function declarations (Gemini)',
  },
  
  openrouter: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 128,
    notes: 'Depends on underlying model - most support OpenAI format',
  },
  
  deepseek: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 64,
    notes: 'DeepSeek V3 supports OpenAI-compatible function calling',
  },
  
  qwen: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 64,
    notes: 'Qwen2.5 supports function calling',
  },
  
  mistral: {
    supportsNativeToolCalling: true,
    requiresSystemMessage: false,
    maxToolsPerRequest: 64,
    notes: 'Mistral Large supports function calling',
  },
  
  ollama: {
    supportsNativeToolCalling: false,
    requiresSystemMessage: true,
    maxToolsPerRequest: 32,
    notes: 'Depends on model - use fallback adapter for most',
  },
  
  lmstudio: {
    supportsNativeToolCalling: false,
    requiresSystemMessage: true,
    maxToolsPerRequest: 32,
    notes: 'Depends on model - use fallback adapter',
  },
  
  localai: {
    supportsNativeToolCalling: false,
    requiresSystemMessage: true,
    maxToolsPerRequest: 32,
    notes: 'Depends on model - use fallback adapter',
  },
};

export function getProviderCapabilities(provider: string): ProviderCapabilities {
  return PROVIDER_CAPABILITIES[provider.toLowerCase()] || {
    supportsNativeToolCalling: false,
    requiresSystemMessage: true,
    maxToolsPerRequest: 32,
    notes: 'Unknown provider - using conservative defaults',
  };
}

console.log('✅ Provider adapters loaded (OpenAI, Anthropic, Google, Fallback)');

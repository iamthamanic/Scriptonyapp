/**
 * 🤖 AI PROVIDER API CALLS WITH TOOL SUPPORT
 * 
 * Handles API calls to different AI providers with Function Calling support
 */

import { getFormattedTools, processToolCalls } from './tools-integration.tsx';
import type { ToolsConfig } from './tools-integration.tsx';

export interface ProviderCallConfig {
  provider: string;
  model: string;
  messages: any[];
  apiKey: string;
  temperature: number;
  maxTokens: number;
  toolsEnabled: boolean;
  toolsConfig?: ToolsConfig;
}

export interface ProviderCallResult {
  content: string;
  tokensUsed: number;
  toolCalls?: any[];
  rawResponse?: any;
  immediateResponse?: boolean; // True if we need to execute tools async
}

/**
 * Call OpenAI API with optional tools
 * Also supports OpenAI-compatible APIs (DeepSeek, etc.)
 */
export async function callOpenAI(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('openai') : undefined;

  const requestBody: any = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (tools) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }

  // Detect DeepSeek models and use correct base URL
  const isDeepSeek = config.model.startsWith('deepseek-');
  const baseUrl = isDeepSeek 
    ? 'https://api.deepseek.com/v1/chat/completions'
    : 'https://api.openai.com/v1/chat/completions';
  
  console.log(`🔗 Using ${isDeepSeek ? 'DeepSeek' : 'OpenAI'} API endpoint:`, baseUrl);

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  // Check for tool calls
  if (message.tool_calls && config.toolsConfig) {
    console.log(`🔧 OpenAI requested ${message.tool_calls.length} tool calls`);
    
    // Count total operations to estimate if this will timeout
    const estimatedOps = message.tool_calls.reduce((sum: number, tc: any) => {
      const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      // Estimate operations: CREATE_SCENES with scenes[] array, etc.
      if (tc.function.name === 'CREATE_SCENES' && args.scenes) {
        return sum + args.scenes.length;
      }
      if (tc.function.name === 'CREATE_CHARACTERS' && args.characters) {
        return sum + args.characters.length;
      }
      if (tc.function.name === 'UPDATE_SCENES' && args.updates) {
        return sum + args.updates.length;
      }
      return sum + 1; // Single operation
    }, 0);
    
    console.log(`📊 Estimated operations: ${estimatedOps}`);
    
    // If too many operations (>10), return immediate confirmation
    if (estimatedOps > 10) {
      console.log('⚡ High operation count detected - returning immediate response');
      
      // Generate immediate confirmation message
      const toolNames = message.tool_calls.map((tc: any) => {
        const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        if (tc.function.name === 'CREATE_PROJECT') {
          return `Projekt "${args.title || args.name}"`;
        }
        if (tc.function.name === 'CREATE_SCENES') {
          return `${args.scenes?.length || 0} Szenen`;
        }
        if (tc.function.name === 'CREATE_CHARACTERS') {
          return `${args.characters?.length || 0} Charaktere`;
        }
        return tc.function.name;
      }).join(', ');
      
      const immediateContent = `✅ Verstanden! Ich erstelle jetzt: ${toolNames}\n\n⏳ Dies kann einige Sekunden dauern...`;
      
      // Execute tools in background (don't wait)
      processToolCalls(data, config.toolsConfig, config.messages).then(async (toolResult) => {
        if (toolResult.success && toolResult.toolCalls.length > 0) {
          console.log(`✅ Background tools completed: ${toolResult.toolCalls.length} calls`);
          
          // Create a follow-up message with results
          const toolSummaries = toolResult.toolCalls.map((tc: any) => {
            const success = tc.result?.success ? '✅' : '❌';
            return `${success} ${tc.tool_name}: ${tc.result?.message || tc.result?.error || 'Completed'}`;
          });
          
          const followUpContent = `🎉 Fertig!\n\n${toolSummaries.join('\n')}`;
          
          // Save follow-up message to database
          if (config.toolsConfig?.conversationId && config.toolsConfig?.userId) {
            const { createClient } = await import("npm:@supabase/supabase-js@2");
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            
            const { data: followUpMsg } = await supabase
              .from("chat_messages")
              .insert({
                conversation_id: config.toolsConfig.conversationId,
                user_id: config.toolsConfig.userId,
                role: "assistant",
                content: followUpContent,
                model: config.model,
                provider: 'system',
                tool_calls: toolResult.toolCalls,
              })
              .select()
              .single();
            
            console.log('✅ Follow-up message saved:', followUpMsg?.id);
          }
        }
      }).catch(err => {
        console.error('❌ Background tool execution failed:', err);
      });
      
      return {
        content: immediateContent,
        tokensUsed: data.usage.total_tokens,
        toolCalls: message.tool_calls.map((tc: any) => ({
          tool_name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments || '{}'),
          result: { success: true, message: 'Executing in background...' },
        })),
        rawResponse: data,
        immediateResponse: true,
      };
    }
    
    // Execute tools
    const toolResult = await processToolCalls(data, config.toolsConfig, config.messages);
    
    if (toolResult.success && toolResult.toolCalls.length > 0) {
      // Send tool results back to AI for final response
      const toolMessages = [...config.messages, message];
      
      for (const toolCall of message.tool_calls) {
        const result = toolResult.toolCalls.find((tc: any) => 
          tc.tool_name === toolCall.function.name
        );
        
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result?.result || {}),
        });
      }
      
      // Get final response from AI
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          messages: toolMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });
      
      const finalData = await finalResponse.json();
      const finalContent = finalData.choices[0].message.content;
      
      // If AI returns no text after tools, generate summary
      let responseText = finalContent;
      if (!responseText || responseText.trim() === '') {
        // Generate summary from tool results
        const toolSummaries = toolResult.toolCalls.map((tc: any) => {
          const success = tc.result?.success ? '✅' : '❌';
          return `${success} ${tc.tool_name}: ${tc.result?.message || tc.result?.error || 'Completed'}`;
        });
        responseText = `Aktionen durchgeführt:\n\n${toolSummaries.join('\n')}`;
      }
      
      return {
        content: responseText,
        tokensUsed: finalData.usage.total_tokens,
        toolCalls: toolResult.toolCalls,
        rawResponse: finalData,
      };
    }
  }

  return {
    content: message.content,
    tokensUsed: data.usage.total_tokens,
    rawResponse: data,
  };
}

/**
 * Call Anthropic API with optional tools
 */
export async function callAnthropic(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('anthropic') : undefined;
  
  const systemMsg = config.messages.find((m: any) => m.role === 'system')?.content || '';
  const userMessages = config.messages.filter((m: any) => m.role !== 'system');

  const requestBody: any = {
    model: config.model,
    system: systemMsg,
    messages: userMessages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (tools) {
    requestBody.tools = tools;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  
  // Check for tool use
  const toolUseBlocks = data.content.filter((block: any) => block.type === 'tool_use');
  
  if (toolUseBlocks.length > 0 && config.toolsConfig) {
    console.log(`🔧 Anthropic requested ${toolUseBlocks.length} tool calls`);
    
    // Estimate operations for timeout prevention
    const estimatedOps = toolUseBlocks.reduce((sum: number, block: any) => {
      const args = block.input || {};
      if (block.name === 'CREATE_SCENES' && args.scenes) {
        return sum + args.scenes.length;
      }
      if (block.name === 'CREATE_CHARACTERS' && args.characters) {
        return sum + args.characters.length;
      }
      if (block.name === 'UPDATE_SCENES' && args.updates) {
        return sum + args.updates.length;
      }
      return sum + 1;
    }, 0);
    
    console.log(`📊 Estimated operations: ${estimatedOps}`);
    
    // High operation count - return immediate response
    if (estimatedOps > 10) {
      console.log('⚡ High operation count detected - returning immediate response');
      
      const toolNames = toolUseBlocks.map((block: any) => {
        const args = block.input || {};
        if (block.name === 'CREATE_PROJECT') {
          return `Projekt "${args.title || args.name}"`;
        }
        if (block.name === 'CREATE_SCENES') {
          return `${args.scenes?.length || 0} Szenen`;
        }
        if (block.name === 'CREATE_CHARACTERS') {
          return `${args.characters?.length || 0} Charaktere`;
        }
        return block.name;
      }).join(', ');
      
      const immediateContent = `✅ Verstanden! Ich erstelle jetzt: ${toolNames}\n\n⏳ Dies kann einige Sekunden dauern...`;
      
      // Execute tools in background
      processToolCalls(data, config.toolsConfig, config.messages).then(async (toolResult) => {
        if (toolResult.success && toolResult.toolCalls.length > 0) {
          console.log(`✅ Background tools completed: ${toolResult.toolCalls.length} calls`);
          
          const toolSummaries = toolResult.toolCalls.map((tc: any) => {
            const success = tc.result?.success ? '✅' : '❌';
            return `${success} ${tc.tool_name}: ${tc.result?.message || tc.result?.error || 'Completed'}`;
          });
          
          const followUpContent = `🎉 Fertig!\n\n${toolSummaries.join('\n')}`;
          
          if (config.toolsConfig?.conversationId && config.toolsConfig?.userId) {
            const { createClient } = await import("npm:@supabase/supabase-js@2");
            const supabase = createClient(
              Deno.env.get("SUPABASE_URL")!,
              Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
            );
            
            await supabase
              .from("chat_messages")
              .insert({
                conversation_id: config.toolsConfig.conversationId,
                user_id: config.toolsConfig.userId,
                role: "assistant",
                content: followUpContent,
                model: config.model,
                provider: 'system',
                tool_calls: toolResult.toolCalls,
              });
            
            console.log('✅ Follow-up message saved');
          }
        }
      }).catch(err => {
        console.error('❌ Background tool execution failed:', err);
      });
      
      return {
        content: immediateContent,
        tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
        toolCalls: toolUseBlocks.map((block: any) => ({
          tool_name: block.name,
          arguments: block.input,
          result: { success: true, message: 'Executing in background...' },
        })),
        rawResponse: data,
        immediateResponse: true,
      };
    }
    
    // Execute tools
    const toolResult = await processToolCalls(data, config.toolsConfig, config.messages);
    
    if (toolResult.success && toolResult.toolCalls.length > 0) {
      // Send tool results back to AI
      const toolResultMessages = toolUseBlocks.map((block: any, idx: number) => {
        const result = toolResult.toolCalls[idx];
        return {
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result?.result || {}),
        };
      });
      
      const finalResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          system: systemMsg,
          messages: [
            ...userMessages,
            { role: 'assistant', content: data.content },
            { role: 'user', content: toolResultMessages },
          ],
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });
      
      const finalData = await finalResponse.json();
      const textBlocks = finalData.content.filter((block: any) => block.type === 'text');
      let finalContent = textBlocks.length > 0 ? textBlocks[0].text : '';
      
      // If AI returns no text after tools, generate summary
      if (!finalContent || finalContent.trim() === '') {
        const toolSummaries = toolResult.toolCalls.map((tc: any) => {
          const success = tc.result?.success ? '✅' : '❌';
          return `${success} ${tc.tool_name}: ${tc.result?.message || tc.result?.error || 'Completed'}`;
        });
        finalContent = `Aktionen durchgeführt:\n\n${toolSummaries.join('\n')}`;
      }
      
      return {
        content: finalContent,
        tokensUsed: finalData.usage.input_tokens + finalData.usage.output_tokens,
        toolCalls: toolResult.toolCalls,
        rawResponse: finalData,
      };
    }
  }

  return {
    content: data.content[0].text,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
    rawResponse: data,
  };
}

/**
 * Call Google Gemini API with optional tools
 */
export async function callGoogle(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('google') : undefined;

  const requestBody: any = {
    contents: config.messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    },
  };

  if (tools) {
    requestBody.tools = [tools];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${error}`);
  }

  const data = await response.json();
  const candidate = data.candidates[0];
  
  // Check for function calls
  const functionCalls = candidate.content?.parts?.filter((part: any) => part.functionCall);
  
  if (functionCalls && functionCalls.length > 0 && config.toolsConfig) {
    console.log(`🔧 Google requested ${functionCalls.length} tool calls`);
    
    // Execute tools
    const toolResult = await processToolCalls(data, config.toolsConfig, config.messages);
    
    if (toolResult.success && toolResult.toolCalls.length > 0) {
      // Send tool results back to AI
      const functionResponses = toolResult.toolCalls.map((tc: any) => ({
        functionResponse: {
          name: tc.tool_name,
          response: tc.result,
        },
      }));
      
      const finalResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${config.model}:generateContent?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              ...requestBody.contents,
              {
                role: 'model',
                parts: candidate.content.parts,
              },
              {
                role: 'function',
                parts: functionResponses,
              },
            ],
            generationConfig: requestBody.generationConfig,
          }),
        }
      );
      
      const finalData = await finalResponse.json();
      
      return {
        content: finalData.candidates[0].content.parts[0].text,
        tokensUsed: finalData.usageMetadata?.totalTokenCount || 0,
        toolCalls: toolResult.toolCalls,
        rawResponse: finalData,
      };
    }
  }

  return {
    content: candidate.content.parts[0].text,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0,
    rawResponse: data,
  };
}

/**
 * Call OpenRouter API (OpenAI-compatible with tools)
 */
export async function callOpenRouter(config: ProviderCallConfig): Promise<ProviderCallResult> {
  const tools = config.toolsEnabled ? getFormattedTools('openai') : undefined;

  const requestBody: any = {
    model: config.model,
    messages: config.messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  };

  if (tools) {
    requestBody.tools = tools;
    requestBody.tool_choice = 'auto';
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://scriptony.app',
      'X-Title': 'Scriptony AI Assistant',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  const message = data.choices[0].message;
  
  // Check for tool calls (OpenAI-compatible format)
  if (message.tool_calls && config.toolsConfig) {
    console.log(`🔧 OpenRouter requested ${message.tool_calls.length} tool calls`);
    
    // Execute tools
    const toolResult = await processToolCalls(data, config.toolsConfig, config.messages);
    
    if (toolResult.success && toolResult.toolCalls.length > 0) {
      // Send tool results back
      const toolMessages = [...config.messages, message];
      
      for (const toolCall of message.tool_calls) {
        const result = toolResult.toolCalls.find((tc: any) => 
          tc.tool_name === toolCall.function.name
        );
        
        toolMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result?.result || {}),
        });
      }
      
      // Get final response
      const finalResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://scriptony.app',
          'X-Title': 'Scriptony AI Assistant',
        },
        body: JSON.stringify({
          model: config.model,
          messages: toolMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
      });
      
      const finalData = await finalResponse.json();
      
      return {
        content: finalData.choices[0].message.content,
        tokensUsed: finalData.usage?.total_tokens || 0,
        toolCalls: toolResult.toolCalls,
        rawResponse: finalData,
      };
    }
  }

  return {
    content: message.content,
    tokensUsed: data.usage?.total_tokens || 0,
    rawResponse: data,
  };
}

console.log('✅ AI Provider calls with tool support loaded');

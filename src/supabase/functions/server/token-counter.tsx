/**
 * TOKEN COUNTER UTILITY
 * 
 * Provides accurate token counting for different AI models.
 * Uses gpt-tokenizer for OpenAI models (works in Edge Functions).
 * Falls back to character-based estimation for other providers.
 */

import { encode } from "npm:gpt-tokenizer@2.1.1";

// =============================================================================
// TYPES
// =============================================================================

export interface TokenCount {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface MessageTokens {
  role: string;
  content: string;
  tokens: number;
}

// =============================================================================
// MODEL DETECTION
// =============================================================================

/**
 * Checks if model supports accurate token counting via gpt-tokenizer
 */
function supportsAccurateTokenCounting(model: string): boolean {
  // gpt-tokenizer works for OpenAI models
  return (
    model.includes('gpt-4') ||
    model.includes('gpt-3.5') ||
    model.includes('o1-') ||
    model.includes('text-davinci')
  );
}

// =============================================================================
// TOKEN COUNTING FUNCTIONS
// =============================================================================

/**
 * Counts tokens in a single text string
 * Uses gpt-tokenizer for OpenAI models, estimation for others
 */
export function countTokens(text: string, model: string = 'gpt-4o'): number {
  if (!text) return 0;
  
  try {
    // Use accurate counting for OpenAI models
    if (supportsAccurateTokenCounting(model)) {
      const tokens = encode(text);
      return tokens.length;
    }
    
    // For other models (Claude, Gemini), use estimation
    // Claude and Gemini have similar tokenization to GPT-4
    // Conservative estimate: 1 token ≈ 3.5 characters
    return estimateTokens(text);
  } catch (error) {
    console.error('Token counting error:', error);
    // Fallback estimation
    return estimateTokens(text);
  }
}

/**
 * Counts tokens for an array of chat messages
 * Includes overhead for message formatting (role, delimiters, etc.)
 */
export function countMessageTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): MessageTokens[] {
  const result: MessageTokens[] = [];
  
  for (const message of messages) {
    // Count content tokens
    const contentTokens = countTokens(message.content, model);
    
    // Add overhead for message structure
    // OpenAI adds ~4 tokens per message for formatting
    const overhead = 4;
    const roleTokens = countTokens(message.role, model);
    
    const totalTokens = contentTokens + roleTokens + overhead;
    
    result.push({
      role: message.role,
      content: message.content,
      tokens: totalTokens,
    });
  }
  
  return result;
}

/**
 * Counts total tokens for a conversation
 * Returns breakdown of input/output/total
 */
export function countConversationTokens(
  messages: Array<{ role: string; content: string }>,
  model: string = 'gpt-4o'
): TokenCount {
  const messageTokens = countMessageTokens(messages, model);
  
  let inputTokens = 0;
  let outputTokens = 0;
  
  for (const msg of messageTokens) {
    if (msg.role === 'assistant') {
      outputTokens += msg.tokens;
    } else {
      inputTokens += msg.tokens;
    }
  }
  
  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
  };
}

/**
 * Simple estimation for quick checks (faster but less accurate)
 * Used for non-OpenAI models and as fallback
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Rule of thumb for most models:
  // - English: ~4 chars per token
  // - Code/Mixed: ~3.5 chars per token
  // - German/Other: ~3-4 chars per token
  // Conservative: 3.5 characters per token
  return Math.ceil(text.length / 3.5);
}

/**
 * Checks if token count exceeds context window
 */
export function exceedsContextWindow(
  tokens: number,
  contextWindow: number
): boolean {
  return tokens > contextWindow;
}

/**
 * Calculates remaining tokens in context window
 */
export function remainingTokens(
  usedTokens: number,
  contextWindow: number
): number {
  return Math.max(0, contextWindow - usedTokens);
}

/**
 * Formats token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(2)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

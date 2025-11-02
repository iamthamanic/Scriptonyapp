/**
 * 🎯 API GATEWAY - Multi-Function Router
 * 
 * Routes API calls to the correct Edge Function based on the resource type.
 * This allows us to split the monolithic server into multiple smaller functions.
 */

import { projectId, publicAnonKey } from '../utils/supabase/info';

// =============================================================================
// EDGE FUNCTION DEFINITIONS
// =============================================================================

/**
 * Edge Function Names (deployed in Supabase Dashboard)
 */
export const EDGE_FUNCTIONS = {
  PROJECTS: 'scriptony-projects',
  PROJECT_NODES: 'scriptony-project-nodes', // Generic Template Engine (Nodes) ✅ REFACTORED!
  TIMELINE_V2: 'scriptony-timeline-v2', // DEPRECATED: Use PROJECT_NODES instead
  SHOTS: 'scriptony-shots', // Shots Microservice (Film-specific) ✅ NEW!
  CHARACTERS: 'scriptony-characters', // Characters Microservice (Universal) ✅ NEW!
  AUDIO: 'scriptony-audio', // Audio Processing (Upload, Waveform, Trim, Fade)
  WORLDBUILDING: 'scriptony-worldbuilding',
  ASSISTANT: 'scriptony-assistant',
  GYM: 'scriptony-gym',
  AUTH: 'scriptony-auth',
  SUPERADMIN: 'scriptony-superadmin',
  STATS: 'scriptony-stats', // Statistics & Analytics ✅ PHASE 2!
  LOGS: 'scriptony-logs', // Activity Logging & Audit Trail ✅ PHASE 2!
} as const;

/**
 * Edge Function Base URLs
 */
const getFunctionUrl = (functionName: string) => 
  `https://${projectId}.supabase.co/functions/v1/${functionName}`;

// =============================================================================
// ROUTE MAPPING
// =============================================================================

/**
 * Maps route prefixes to their corresponding Edge Function
 */
const ROUTE_MAP: Record<string, string> = {
  // Auth & Account Management
  '/signup': EDGE_FUNCTIONS.AUTH,
  '/create-demo-user': EDGE_FUNCTIONS.AUTH,
  '/profile': EDGE_FUNCTIONS.AUTH,
  '/organizations': EDGE_FUNCTIONS.AUTH,
  '/storage': EDGE_FUNCTIONS.AUTH,
  
  // Projects
  '/projects': EDGE_FUNCTIONS.PROJECTS,
  
  // Project Nodes (Generic Template Engine) ✅ REFACTORED!
  '/nodes': EDGE_FUNCTIONS.PROJECT_NODES,
  '/initialize-project': EDGE_FUNCTIONS.PROJECT_NODES,
  
  // Shots Microservice ✅ NEW!
  '/shots': EDGE_FUNCTIONS.SHOTS,
  
  // Characters Microservice ✅ NEW!
  '/characters': EDGE_FUNCTIONS.CHARACTERS,
  '/timeline-characters': EDGE_FUNCTIONS.CHARACTERS, // Legacy compatibility
  
  // Stats & Logs ✅ PHASE 2!
  '/stats': EDGE_FUNCTIONS.STATS,
  '/logs': EDGE_FUNCTIONS.LOGS,
  
  // Audio (Upload, Waveform, Trim, Fade)
  // Note: /shots/:id/upload-audio routes to AUDIO function
  // Note: /shots/:id/audio routes to AUDIO function  
  // Note: /shots/audio/:id routes to AUDIO function
  
  // Worldbuilding
  '/worlds': EDGE_FUNCTIONS.WORLDBUILDING,
  '/locations': EDGE_FUNCTIONS.WORLDBUILDING,
  
  // Assistant (AI + RAG + MCP)
  '/ai': EDGE_FUNCTIONS.ASSISTANT,
  '/conversations': EDGE_FUNCTIONS.ASSISTANT,
  '/rag': EDGE_FUNCTIONS.ASSISTANT,
  '/mcp': EDGE_FUNCTIONS.ASSISTANT,
  
  // Creative Gym
  '/exercises': EDGE_FUNCTIONS.GYM,
  '/progress': EDGE_FUNCTIONS.GYM,
  '/achievements': EDGE_FUNCTIONS.GYM,
  '/categories': EDGE_FUNCTIONS.GYM,
  '/daily-challenge': EDGE_FUNCTIONS.GYM,
  
  // Superadmin
  '/superadmin': EDGE_FUNCTIONS.SUPERADMIN,
};

/**
 * Determines which Edge Function to use for a given route
 */
function getEdgeFunctionForRoute(route: string): string {
  // Special routing for Audio endpoints
  // These have specific patterns that need to override the general /shots prefix
  if (route.includes('/upload-audio') || 
      route.includes('/shots/audio/') || 
      route.match(/\/shots\/[^/]+\/audio$/)) {
    return EDGE_FUNCTIONS.AUDIO;
  }
  
  // Find the matching route prefix
  const matchedPrefix = Object.keys(ROUTE_MAP).find(prefix => 
    route.startsWith(prefix)
  );
  
  if (!matchedPrefix) {
    console.warn(`[API Gateway] No Edge Function found for route: ${route}`);
    // Fallback to projects function for unknown routes
    return EDGE_FUNCTIONS.PROJECTS;
  }
  
  return ROUTE_MAP[matchedPrefix];
}

// =============================================================================
// API GATEWAY
// =============================================================================

export interface ApiGatewayOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  route: string;
  body?: any;
  headers?: Record<string, string>;
  accessToken?: string;
}

/**
 * Makes an API call through the API Gateway
 * 
 * Automatically routes the request to the correct Edge Function
 * based on the route prefix.
 * 
 * @example
 * ```typescript
 * // Automatically routed to scriptony-timeline
 * const shots = await apiGateway({
 *   method: 'GET',
 *   route: '/shots/scene-123',
 *   accessToken: token,
 * });
 * 
 * // Automatically routed to scriptony-ai
 * const response = await apiGateway({
 *   method: 'POST',
 *   route: '/ai/chat',
 *   body: { message: 'Hello' },
 *   accessToken: token,
 * });
 * ```
 */
export async function apiGateway<T = any>(
  options: ApiGatewayOptions
): Promise<T> {
  const { method, route, body, headers = {}, accessToken } = options;
  
  // Determine which Edge Function to use
  const functionName = getEdgeFunctionForRoute(route);
  const baseUrl = getFunctionUrl(functionName);
  
  console.log(`[API Gateway] ${method} ${route} → ${functionName}`);
  
  // Build full URL
  const url = `${baseUrl}${route}`;
  
  // Build headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken || publicAnonKey}`,
    ...headers,
  };
  
  console.log(`[API Gateway] Fetching ${url}`);
  console.log(`[API Gateway] Headers:`, requestHeaders);
  console.log(`[API Gateway] Body (raw):`, body);
  console.log(`[API Gateway] Body (stringified):`, body ? JSON.stringify(body) : 'undefined');
  
  // Make request with error handling
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (fetchError: any) {
    console.error(`[API Gateway] Network Error:`, {
      url,
      functionName,
      error: fetchError.message,
    });
    console.error(`[API Gateway] Possible causes:`);
    console.error(`  1. Edge Function "${functionName}" is not deployed`);
    console.error(`  2. CORS issue (check function CORS settings)`);
    console.error(`  3. Network/internet connection issue`);
    console.error(`  4. Supabase project offline`);
    throw new Error(`Cannot connect to ${functionName}: ${fetchError.message}`);
  }
  
  console.log(`[API Gateway] Response received:`, response.status, response.statusText);
  
  // Handle response
  if (!response.ok) {
    const errorText = await response.text();
    
    // Try to parse error as JSON for better logging
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = errorText;
    }
    
    console.error(`[API Gateway] Error Response:`, {
      url,
      status: response.status,
      statusText: response.statusText,
      errorData,
    });
    
    // Extract error message if available
    const errorMessage = typeof errorData === 'object' 
      ? (errorData.error || errorData.message || errorData.details || JSON.stringify(errorData))
      : errorData;
    
    throw new Error(`API Error: ${response.status} - ${errorMessage}`);
  }
  
  return await response.json();
}

// =============================================================================
// CONVENIENCE METHODS
// =============================================================================

/**
 * GET request through API Gateway
 */
export async function apiGet<T = any>(
  route: string,
  accessToken?: string
): Promise<T> {
  return apiGateway<T>({ method: 'GET', route, accessToken });
}

/**
 * POST request through API Gateway
 */
export async function apiPost<T = any>(
  route: string,
  body: any,
  accessToken?: string
): Promise<T> {
  return apiGateway<T>({ method: 'POST', route, body, accessToken });
}

/**
 * PUT request through API Gateway
 */
export async function apiPut<T = any>(
  route: string,
  body: any,
  accessToken?: string
): Promise<T> {
  return apiGateway<T>({ method: 'PUT', route, body, accessToken });
}

/**
 * DELETE request through API Gateway
 */
export async function apiDelete<T = any>(
  route: string,
  accessToken?: string
): Promise<T> {
  return apiGateway<T>({ method: 'DELETE', route, accessToken });
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * Get API base URL for a specific function
 * 
 * @deprecated Use apiGateway() instead for automatic routing
 */
export function getApiBase(functionName: keyof typeof EDGE_FUNCTIONS): string {
  return getFunctionUrl(EDGE_FUNCTIONS[functionName]);
}

// Legacy API removed - all endpoints now use specialized Edge Functions via apiGateway()

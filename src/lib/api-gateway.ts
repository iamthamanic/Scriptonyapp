/**
 * 🎯 API GATEWAY - Multi-Function Router
 * 
 * Routes API calls to the correct Edge Function based on the resource type.
 * This allows us to split the monolithic server into multiple smaller functions.
 */

import { projectId, publicAnonKey } from './utils/supabase/info';

// =============================================================================
// EDGE FUNCTION DEFINITIONS
// =============================================================================

/**
 * Edge Function Names (deployed in Supabase Dashboard)
 */
export const EDGE_FUNCTIONS = {
  PROJECTS: 'scriptony-projects',
  TIMELINE: 'scriptony-timeline',
  TIMELINE_V2: 'scriptony-timeline-v2',
  WORLDBUILDING: 'scriptony-worldbuilding',
  ASSISTANT: 'scriptony-assistant',
  GYM: 'scriptony-gym',
  AUTH: 'scriptony-auth',
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
  
  // Timeline (Old - Acts/Sequences/Scenes/Shots)
  '/acts': EDGE_FUNCTIONS.TIMELINE,
  '/sequences': EDGE_FUNCTIONS.TIMELINE,
  '/scenes': EDGE_FUNCTIONS.TIMELINE,
  '/shots': EDGE_FUNCTIONS.TIMELINE,
  
  // Timeline V2 (New - Generic Nodes)
  '/nodes': EDGE_FUNCTIONS.TIMELINE_V2,
  '/initialize-project': EDGE_FUNCTIONS.TIMELINE_V2,
  
  // Worldbuilding
  '/worlds': EDGE_FUNCTIONS.WORLDBUILDING,
  '/characters': EDGE_FUNCTIONS.WORLDBUILDING,
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
};

/**
 * Determines which Edge Function to use for a given route
 */
function getEdgeFunctionForRoute(route: string): string {
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
  
  // Make request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Handle response
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API Gateway] Error:`, {
      url,
      status: response.status,
      error: errorText,
    });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

/**
 * Get API base URL for the monolithic function (backward compatibility)
 * 
 * @deprecated Use apiGateway() instead
 */
export function getLegacyApiBase(): string {
  return `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;
}

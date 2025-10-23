/**
 * 🚀 STEP 1: MINIMAL VERSION
 * 
 * Nur das absolute Minimum:
 * - Health Check
 * - CORS
 * - Auth Check Helper
 * 
 * Deploy diese Version ZUERST, um sicherzustellen dass die Basis funktioniert!
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

// Health Check
app.get("/make-server-3b52693b/health", (c) => {
  return c.json({
    status: "ok",
    message: "Scriptony Server STEP 1 - Minimal Version",
    timestamp: new Date().toISOString(),
  });
});

// Test Auth Helper
app.get("/make-server-3b52693b/test-auth", async (c) => {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "No auth token" }, 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return c.json({ error: "Invalid token" }, 401);
  }

  return c.json({ 
    message: "Auth works!",
    userId: user.id,
    email: user.email,
  });
});

console.log("🚀 STEP 1: Minimal Server starting...");
Deno.serve(app.fetch);

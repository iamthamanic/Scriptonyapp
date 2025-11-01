import { projectsApi, worldsApi, categoriesApi, itemsApi } from "./api";
import { publicAnonKey } from "./supabase/info";
import { apiGateway } from "../lib/api-gateway";

export async function seedTestUser() {
  try {
    console.log("🔗 Calling seed-test-user endpoint via API Gateway...");
    
    // Note: Seed endpoint is on scriptony-auth function
    // But it needs to be accessible without auth, so we use direct fetch
    const { projectId } = await import("./supabase/info");
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/scriptony-auth/auth/seed-test-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
      }
    );

    console.log("📡 Seed response status:", response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Test user seed:", result.message);
      return result;
    } else {
      const errorText = await response.text();
      console.error("❌ Failed to seed test user:", errorText);
      throw new Error(`Seed failed: ${errorText}`);
    }
  } catch (error) {
    console.error("❌ Error seeding test user:", error);
    throw error;
  }
}

export async function seedInitialData() {
  try {
    console.log("⚠️ seedInitialData() is deprecated - no mock data will be created");
    console.log("ℹ️  Create your first project and world manually in the UI");
    return;
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

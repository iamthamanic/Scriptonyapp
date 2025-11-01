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
    // Check if data already exists
    const existingProjects = await projectsApi.getAll();
    if (existingProjects && existingProjects.length > 0) {
      console.log("Data already exists, skipping seed");
      return;
    }

    console.log("Seeding initial data...");

    // Create a world
    const world = await worldsApi.create({
      name: "Kontinent Silkat",
      description: "Eine Fantasy-Welt voller Magie und Abenteuer",
      type: "Fantasy",
    });

    console.log("Created world:", world.name);

    // Create categories for the world
    const geographyCategory = await categoriesApi.create(world.id, {
      name: "Geographie",
      type: "geography",
      icon: "Mountain",
      color: "#10B981",
    });

    const politicsCategory = await categoriesApi.create(world.id, {
      name: "Politik",
      type: "politics",
      icon: "Users",
      color: "#3B82F6",
    });

    console.log("Created categories");

    // Create items
    await itemsApi.create(world.id, geographyCategory.id, {
      name: "Mount Silkar",
      description: "Ein majestätischer Berg im Herzen des Kontinents",
      category: "Geographie",
      categoryType: "geography",
    });

    await itemsApi.create(world.id, geographyCategory.id, {
      name: "Delta River",
      description: "Ein wichtiger Fluss, der durch das Land fließt",
      category: "Geographie",
      categoryType: "geography",
    });

    await itemsApi.create(world.id, politicsCategory.id, {
      name: "The Council of Seven",
      description: "Das regierende Gremium des Kontinents",
      category: "Politik",
      categoryType: "politics",
    });

    console.log("Created worldbuilding items");

    // Create a project
    const project = await projectsApi.create({
      title: "The Last Frontier",
      logline: "Eine Sci-Fi-Thriller über die letzte Reise der Menschheit zu den Sternen",
      type: "film",
      genre: "Science Fiction, Thriller",
      duration: "120",
      linkedWorldId: world.id,
    });

    console.log("Created project:", project.title);

    console.log("✅ Initial data seeded successfully!");
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

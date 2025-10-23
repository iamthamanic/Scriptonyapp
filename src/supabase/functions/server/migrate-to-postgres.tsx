/**
 * Migration Script: KV-Store → PostgreSQL
 * 
 * Dieses Script kopiert alle Daten vom KV-Store in die neuen PostgreSQL-Tabellen.
 * Es erstellt automatisch eine Default-Organization für existierende Nutzer.
 * 
 * WICHTIG: Dieses Script sollte nur einmal ausgeführt werden!
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface MigrationResult {
  success: boolean;
  stats: {
    organizations: number;
    worlds: number;
    worldCategories: number;
    worldItems: number;
    projects: number;
    episodes: number;
    characters: number;
    scenes: number;
  };
  errors: string[];
}

/**
 * Generiert einen eindeutigen Slug aus einem Namen
 */
function generateSlug(name: string, id: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Füge erste 8 Zeichen der ID hinzu für Eindeutigkeit
  return `${baseSlug}-${id.substring(0, 8)}`;
}

/**
 * Hauptmigrationsfunktion
 */
export async function migrateKVToPostgres(userId: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    stats: {
      organizations: 0,
      worlds: 0,
      worldCategories: 0,
      worldItems: 0,
      projects: 0,
      episodes: 0,
      characters: 0,
      scenes: 0,
    },
    errors: [],
  };

  try {
    console.log("🚀 Starting migration from KV-Store to PostgreSQL...");

    // Schritt 1: Erstelle Default-Organization für den User
    console.log("📦 Step 1: Creating/Finding default organization...");
    
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user already has an organization
    const { data: existingMemberships } = await supabase
      .from("organization_members")
      .select("organization_id, organizations(*)")
      .eq("user_id", userId)
      .limit(1);

    let organization;
    let organizationId;

    if (existingMemberships && existingMemberships.length > 0) {
      // Use existing organization
      organization = existingMemberships[0].organizations;
      organizationId = existingMemberships[0].organization_id;
      console.log(`✅ Using existing organization: ${organization.name} (${organizationId})`);
      result.stats.organizations = 0; // Not created, already exists
    } else {
      // Create new organization
      const orgName = `${user.user?.user_metadata?.name || "User"}'s Workspace`;
      const orgSlug = generateSlug(orgName, userId);

      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: orgName,
          slug: orgSlug,
          owner_id: userId,
        })
        .select()
        .single();

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      organization = newOrg;
      organizationId = newOrg.id;

      console.log(`✅ Created organization: ${organization.name} (${organizationId})`);
      result.stats.organizations = 1;

      // Füge User als Owner hinzu
      await supabase.from("organization_members").insert({
        organization_id: organizationId,
        user_id: userId,
        role: "owner",
      });
    }

    // Schritt 2: Migriere Worlds
    console.log("🌍 Step 2: Migrating worlds...");
    const kvWorlds = await kv.getByPrefix("world:");
    
    // Filtere nur Welt-Objekte (nicht Kategorien/Items)
    const actualWorlds = kvWorlds.filter((w: any) => 
      w.id && w.name && !w.worldId && !w.categoryId
    );

    const worldIdMapping = new Map<string, string>(); // old ID -> new ID

    for (const kvWorld of actualWorlds) {
      try {
        const { data: newWorld, error } = await supabase
          .from("worlds")
          .insert({
            organization_id: organizationId,
            name: kvWorld.name,
            description: kvWorld.description,
            type: kvWorld.type,
            cover_image_url: kvWorld.coverImage,
            created_at: kvWorld.createdAt || new Date().toISOString(),
            updated_at: kvWorld.lastEdited || new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          result.errors.push(`World "${kvWorld.name}": ${error.message}`);
          continue;
        }

        worldIdMapping.set(kvWorld.id, newWorld.id);
        result.stats.worlds++;
        console.log(`  ✓ Migrated world: ${kvWorld.name}`);

        // Migriere World Categories
        const kvCategories = await kv.getByPrefix(`world:${kvWorld.id}:category:`);
        
        for (const kvCategory of kvCategories) {
          const { data: newCategory, error: catError } = await supabase
            .from("world_categories")
            .insert({
              world_id: newWorld.id,
              name: kvCategory.name,
              type: kvCategory.type,
              icon: kvCategory.icon,
              color: kvCategory.color,
              order_index: kvCategory.orderIndex || 0,
              created_at: kvCategory.createdAt || new Date().toISOString(),
            })
            .select()
            .single();

          if (catError) {
            result.errors.push(`Category "${kvCategory.name}": ${catError.message}`);
            continue;
          }

          result.stats.worldCategories++;

          // Migriere World Items für diese Category
          const kvItems = await kv.getByPrefix(`world:${kvWorld.id}:item:${kvCategory.id}:`);
          
          for (const kvItem of kvItems) {
            const { error: itemError } = await supabase
              .from("world_items")
              .insert({
                world_id: newWorld.id,
                category_id: newCategory.id,
                name: kvItem.name,
                description: kvItem.description,
                category: kvItem.category,
                category_type: kvItem.categoryType,
                image_url: kvItem.image,
                created_at: kvItem.createdAt || new Date().toISOString(),
              });

            if (itemError) {
              result.errors.push(`Item "${kvItem.name}": ${itemError.message}`);
              continue;
            }

            result.stats.worldItems++;
          }
        }
      } catch (error: any) {
        result.errors.push(`World "${kvWorld.name}": ${error.message}`);
      }
    }

    // Schritt 3: Migriere Projects
    console.log("🎬 Step 3: Migrating projects...");
    const kvProjects = await kv.getByPrefix("project:");

    for (const kvProject of kvProjects) {
      try {
        const worldId = kvProject.linkedWorldId 
          ? worldIdMapping.get(kvProject.linkedWorldId) 
          : null;

        const { data: newProject, error } = await supabase
          .from("projects")
          .insert({
            organization_id: organizationId,
            world_id: worldId,
            title: kvProject.title,
            type: kvProject.type || "film",
            logline: kvProject.logline,
            genre: kvProject.genre,
            duration: kvProject.duration,
            cover_image_url: kvProject.coverImage,
            created_at: kvProject.createdAt || new Date().toISOString(),
            updated_at: kvProject.lastEdited || new Date().toISOString(),
            last_edited: kvProject.lastEdited || new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          result.errors.push(`Project "${kvProject.title}": ${error.message}`);
          continue;
        }

        result.stats.projects++;
        console.log(`  ✓ Migrated project: ${kvProject.title}`);

        // Migriere Episodes (falls Serie)
        if (kvProject.type === "series") {
          const kvEpisodes = await kv.getByPrefix(`episode:${kvProject.id}:`);
          
          for (const kvEpisode of kvEpisodes) {
            const { error: epError } = await supabase
              .from("episodes")
              .insert({
                project_id: newProject.id,
                title: kvEpisode.title,
                number: kvEpisode.number,
                description: kvEpisode.description,
                cover_image_url: kvEpisode.coverImage,
                created_at: kvEpisode.createdAt || new Date().toISOString(),
              });

            if (epError) {
              result.errors.push(`Episode "${kvEpisode.title}": ${epError.message}`);
              continue;
            }

            result.stats.episodes++;
          }
        }

        // Migriere Characters
        const kvCharacters = await kv.getByPrefix(`character:${kvProject.id}:`);
        const characterIdMapping = new Map<string, string>();

        for (const kvCharacter of kvCharacters) {
          const { data: newCharacter, error: charError } = await supabase
            .from("characters")
            .insert({
              project_id: newProject.id,
              name: kvCharacter.name,
              role: kvCharacter.role,
              description: kvCharacter.description,
              avatar_url: kvCharacter.avatar,
              created_at: kvCharacter.createdAt || new Date().toISOString(),
            })
            .select()
            .single();

          if (charError) {
            result.errors.push(`Character "${kvCharacter.name}": ${charError.message}`);
            continue;
          }

          characterIdMapping.set(kvCharacter.id, newCharacter.id);
          result.stats.characters++;
        }

        // Migriere Scenes
        const kvScenes = await kv.getByPrefix(`scene:${kvProject.id}:`);

        for (const kvScene of kvScenes) {
          const { data: newScene, error: sceneError } = await supabase
            .from("scenes")
            .insert({
              project_id: newProject.id,
              scene_number: kvScene.sceneNumber || "1",
              title: kvScene.title,
              location: kvScene.location,
              time_of_day: kvScene.timeOfDay,
              description: kvScene.description,
              dialog: kvScene.dialog,
              visual_composition: kvScene.visualComposition,
              lighting: kvScene.lighting,
              color_grading: kvScene.colorGrading,
              sound_design: kvScene.soundDesign,
              special_effects: kvScene.specialEffects,
              keyframe_image_url: kvScene.keyframeImage,
              timecode_start: kvScene.timecodeStart,
              timecode_end: kvScene.timecodeEnd,
              transitions: kvScene.transitions,
              production_notes: kvScene.productionNotes,
              emotional_significance: kvScene.emotionalSignificance,
              emotional_notes: kvScene.emotionalNotes,
              created_at: kvScene.createdAt || new Date().toISOString(),
            })
            .select()
            .single();

          if (sceneError) {
            result.errors.push(`Scene "${kvScene.sceneNumber}": ${sceneError.message}`);
            continue;
          }

          result.stats.scenes++;

          // Migriere Scene-Character Relations
          if (kvScene.characters && Array.isArray(kvScene.characters)) {
            for (const oldCharId of kvScene.characters) {
              const newCharId = characterIdMapping.get(oldCharId);
              if (newCharId) {
                await supabase.from("scene_characters").insert({
                  scene_id: newScene.id,
                  character_id: newCharId,
                });
              }
            }
          }
        }
      } catch (error: any) {
        result.errors.push(`Project "${kvProject.title}": ${error.message}`);
      }
    }

    console.log("✅ Migration completed!");
    console.log("📊 Statistics:", result.stats);
    
    if (result.errors.length > 0) {
      console.warn("⚠️ Errors encountered:", result.errors);
    }

    result.success = true;
    return result;

  } catch (error: any) {
    console.error("❌ Migration failed:", error);
    result.errors.push(`Fatal error: ${error.message}`);
    return result;
  }
}

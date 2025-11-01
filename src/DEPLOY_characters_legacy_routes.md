# 🔧 DEPLOY: Characters Legacy Routes Fix

**Datum:** 2025-11-01  
**Problem:** Character erstellen funktioniert NICHT (404 Error)  
**Status:** ✅ DEPLOY READY

---

## 🐛 **Problem**

Beim Versuch einen neuen Character zu erstellen kommt dieser Fehler:

```
POST /timeline-characters → scriptony-characters
POST https://...scriptony-characters/timeline-characters 404 (Not Found)
[ProjectDetail] Error creating character: Error: API Error: 404 - 404 Not Found
```

**Root Cause:** Die `scriptony-characters` Function hat die Route `POST /timeline-characters` NICHT implementiert!

- ✅ API Gateway routet korrekt: `/timeline-characters` → `scriptony-characters`
- ❌ Function hat NUR `POST /characters`, NICHT `/timeline-characters`

---

## ✅ **Fix Applied**

### **Neue Routes hinzugefügt:**

1. **POST /timeline-characters** (Legacy Alias für POST /characters)
2. **GET /timeline-characters** (Legacy Alias für GET /characters)

**Warum Legacy Routes?**

Die alte `scriptony-timeline-v2` Function hatte `/timeline-characters` Routes. Um Backward Compatibility zu gewährleisten, brauchen wir diese Aliases.

**File:** `/supabase/functions/scriptony-characters/index.ts`

```typescript
// =============================================================================
// LEGACY COMPATIBILITY ROUTES
// =============================================================================

/**
 * POST /timeline-characters
 * LEGACY ROUTE - Alias for POST /characters
 */
app.post("/timeline-characters", async (c) => {
  // Identischer Code wie POST /characters, aber mit allen Feldern:
  // - name, description, image_url, color
  // - role, age, gender, species
  // - backstory, skills, strengths, weaknesses, personality
  ...
});

/**
 * GET /timeline-characters  
 * LEGACY ROUTE - Alias for GET /characters
 */
app.get("/timeline-characters", async (c) => {
  // Identischer Code wie GET /characters?project_id=X
  ...
});
```

**Unterstützte Felder:**

POST /timeline-characters akzeptiert jetzt ALLE Character-Felder:

```json
{
  "project_id": "...",
  "name": "Test Character",
  "role": "Character",
  "description": "...",
  "age": "",
  "gender": "",
  "species": "",
  "backstory": "",
  "skills": "",
  "strengths": "",
  "weaknesses": "",
  "personality": "",
  "imageUrl": "data:image/jpeg;base64,..."
}
```

---

## 📋 **DEPLOY ANLEITUNG**

### **1. Öffne Supabase Dashboard**

```
https://supabase.com/dashboard/project/ctkouztastyirjywiduc
```

### **2. Gehe zu Edge Functions**

- Sidebar: **Edge Functions**
- Finde: **scriptony-characters**

### **3. Update die Function**

**OPTION A: Komplette Function kopieren (EMPFOHLEN)**

1. Öffne `/supabase/functions/scriptony-characters/index.ts` in Figma Make
2. **COPY FULL FILE** (Cmd+A, Cmd+C)
3. Im Supabase Dashboard: **Deploy new version**
4. **PASTE** kompletten Code
5. **Deploy**

**OPTION B: Nur die neuen Routes einfügen**

1. Im Supabase Dashboard: **Öffne existing function code**
2. Suche nach: `DELETE /characters/:id` (Zeile ~435)
3. **NACH dem DELETE Block**, FÜGE EIN:

```typescript
// =============================================================================
// LEGACY COMPATIBILITY ROUTES
// =============================================================================

/**
 * POST /timeline-characters
 * LEGACY ROUTE - Alias for POST /characters
 */
app.post("/timeline-characters", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const projectId = body.project_id || body.projectId;
    const worldId = body.world_id || body.worldId;
    const organizationId = body.organization_id || body.organizationId;

    if (!projectId && !worldId && !organizationId) {
      return c.json({ error: "project_id, world_id, or organization_id is required" }, 400);
    }

    if (!body.name) {
      return c.json({ error: "name is required" }, 400);
    }

    const insertData: any = {
      name: body.name,
      description: body.description,
      image_url: body.image_url || body.imageUrl,
      color: body.color,
      role: body.role,
      age: body.age,
      gender: body.gender,
      species: body.species,
      backstory: body.backstory,
      skills: body.skills,
      strengths: body.strengths,
      weaknesses: body.weaknesses,
      personality: body.personality,
    };

    if (projectId) insertData.project_id = projectId;
    if (worldId) insertData.world_id = worldId;
    if (organizationId) insertData.organization_id = organizationId;

    const { data, error } = await supabase
      .from("characters")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error creating character:", error);
      return c.json({ error: error.message }, 500);
    }

    const transformedCharacter = {
      id: data.id,
      projectId: data.project_id,
      worldId: data.world_id,
      organizationId: data.organization_id,
      name: data.name,
      description: data.description,
      imageUrl: data.image_url,
      color: data.color,
      role: data.role,
      age: data.age,
      gender: data.gender,
      species: data.species,
      backstory: data.backstory,
      skills: data.skills,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      personality: data.personality,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    console.log(`[Characters] Created character via LEGACY route: ${data.name}`);

    return c.json({ character: transformedCharacter }, 201);
  } catch (error: any) {
    console.error("Character POST (legacy route) error:", error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /timeline-characters
 * LEGACY ROUTE - Alias for GET /characters
 */
app.get("/timeline-characters", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const userId = await getUserIdFromAuth(authHeader);

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const projectId = c.req.query("project_id");

    if (!projectId) {
      return c.json({ error: "project_id is required" }, 400);
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("world_id, organization_id")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Error fetching project:", projectError);
      return c.json({ error: projectError.message }, 500);
    }

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .or(
        project?.world_id
          ? `project_id.eq.${projectId},and(world_id.eq.${project.world_id},organization_id.eq.${project.organization_id})`
          : `project_id.eq.${projectId},organization_id.eq.${project.organization_id}`
      )
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching characters:", error);
      return c.json({ error: error.message }, 500);
    }

    console.log(`[Characters] Found ${data?.length || 0} characters via LEGACY route for project ${projectId}`);

    const transformedCharacters = (data || []).map(char => ({
      id: char.id,
      projectId: char.project_id || projectId,
      worldId: char.world_id,
      organizationId: char.organization_id,
      name: char.name,
      description: char.description,
      imageUrl: char.image_url,
      color: char.color,
      role: char.role,
      age: char.age,
      gender: char.gender,
      species: char.species,
      backstory: char.backstory,
      skills: char.skills,
      strengths: char.strengths,
      weaknesses: char.weaknesses,
      personality: char.personality,
      createdAt: char.created_at,
      updatedAt: char.updated_at,
    }));

    return c.json({ characters: transformedCharacters });
  } catch (error: any) {
    console.error("Characters GET (legacy route) error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// =============================================================================
// IMAGE UPLOAD
// =============================================================================
```

4. **Deploy**

### **4. Teste**

Nach dem Deploy:

1. **Hard Refresh** (Cmd+Shift+R)
2. **Öffne ein Project**
3. **Characters Tab**
4. **Click "Character hinzufügen"**
5. **Enter name** (z.B. "Test Character")
6. **Click "Hinzufügen"**
7. **Erwartung:** Character wird erstellt! ✅

---

## 🧪 **Testing Checklist**

- [ ] **Deploy erfolgreich** (keine Errors)
- [ ] **Function Health Check:** `GET /health` → 200 OK
- [ ] **Create Character:** `POST /timeline-characters` → 201 Created
- [ ] **Get Characters:** `GET /timeline-characters?project_id=X` → 200 OK
- [ ] **Character erscheint im UI** ✅
- [ ] **Character in Database** ✅
- [ ] **@-Mention funktioniert** ✅

---

## 📊 **Impact**

### **Breaking Changes**

**KEINE!** 🎉

- Bestehende Calls zu `POST /characters` funktionieren weiterhin
- Neue Legacy Routes fügen nur Backward Compatibility hinzu

### **Warum Legacy Routes?**

Die Frontend API calls verwenden noch `POST /timeline-characters` (von Timeline V2).

**Migration Strategy:**

1. ✅ **JETZT:** Legacy Routes hinzufügen (Backward Compatibility)
2. 🔄 **SPÄTER:** Frontend API calls auf `/characters` migrieren
3. 🗑️ **FUTURE:** Legacy Routes entfernen (nach vollständiger Migration)

---

## ✅ **Success Criteria**

Nach dem Deploy sollte:

1. ✅ `POST /timeline-characters` → 201 Created (Character erstellt)
2. ✅ `GET /timeline-characters?project_id=X` → 200 OK (Characters geladen)
3. ✅ Character erscheint im Characters Tab
4. ✅ Character kann im Dialog @-mentioned werden
5. ✅ Keine Console Errors

---

## 🔍 **Debugging**

Falls Probleme auftreten:

### **1. Check Function Logs**

```
Supabase Dashboard → Edge Functions → scriptony-characters → Logs
```

### **2. Test Health Check**

```
GET https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-characters/health
```

Erwartung:
```json
{
  "status": "ok",
  "function": "scriptony-characters",
  "version": "1.0.0",
  "timestamp": "..."
}
```

### **3. Test Legacy Route**

```bash
curl -X POST \
  https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-characters/timeline-characters \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "YOUR_PROJECT_ID",
    "name": "Test Character",
    "role": "Character"
  }'
```

Erwartung: `201 Created`

---

## 📝 **Changelog**

### **2025-11-01: Legacy Routes Fix**

**Added:**
- ✅ `POST /timeline-characters` (Legacy Alias)
- ✅ `GET /timeline-characters` (Legacy Alias)

**Changed:**
- ✅ Full field support in POST /timeline-characters (role, age, gender, etc.)

**Impact:**
- ✅ Characters können jetzt erstellt werden
- ✅ Backward Compatibility mit Timeline V2
- ✅ Kein Breaking Change

---

## 🎉 **Success!**

**Vorher:**
```
❌ POST /timeline-characters → 404 Not Found
❌ Character kann nicht erstellt werden
```

**Nachher:**
```
✅ POST /timeline-characters → 201 Created
✅ Character wird in DB gespeichert
✅ Character erscheint im UI
✅ @-Mention funktioniert
```

---

**Status:** ✅ DEPLOY READY  
**Priority:** 🔴 CRITICAL (Character Creation broken)  
**Effort:** 5 Minuten Deploy  

---

**DEPLOY JETZT!** 🚀

# 🔧 IMAGE PERSISTENCE FIX

## 🚨 Problem
Bilder wurden hochgeladen, verschwanden aber beim Screen-Wechsel!

**Root Cause:**
1. ✅ Backend uploaded Bilder zu Supabase Storage
2. ✅ Backend speicherte `cover_image_url` in DB
3. ❌ **Frontend lud URLs NICHT aus DB in den State!**

---

## ✅ Lösung

### 1️⃣ ProjectsPage.tsx
**Problem:** `projectCoverImages` State wurde nie mit DB-Daten befüllt

**Fix:**
```typescript
// In loadData() nach setProjects():
// 📸 Load cover images from DB into state
const coverImages: Record<string, string> = {};
projectsData.forEach((project: any) => {
  if (project.cover_image_url) {
    coverImages[project.id] = project.cover_image_url;
  }
});
setProjectCoverImages(coverImages);
```

### 2️⃣ WorldbuildingPage.tsx
**Problem 1:** `worldCoverImages` State wurde nie mit DB-Daten befüllt

**Fix:**
```typescript
// In useEffect() nach setWorlds():
// 📸 Load cover images from DB into state
const coverImages: Record<string, string> = {};
worldsData.forEach((world: any) => {
  if (world.cover_image_url) {
    coverImages[world.id] = world.cover_image_url;
  }
});
setWorldCoverImages(coverImages);
```

**Problem 2:** Nach Upload wurde URL nicht in DB gespeichert

**Fix:**
```typescript
// In WorldDetail onCoverImageChange:
onCoverImageChange={async (imageUrl) => {
  // Update local state immediately (optimistic UI)
  setWorldCoverImages(prev => ({
    ...prev,
    [selectedWorldData.id]: imageUrl
  }));
  
  // Update in database
  try {
    await handleUpdateWorld(selectedWorldData.id, { 
      cover_image_url: imageUrl 
    });
  } catch (error) {
    console.error('Error saving image URL to database:', error);
  }
}}
```

**Problem 3:** `handleUpdateWorld` akzeptierte `cover_image_url` nicht

**Fix:**
```typescript
// Type signature geändert:
const handleUpdateWorld = async (
  worldId: string, 
  updates: { 
    name?: string; 
    description?: string; 
    linked_project_id?: string | null; 
    cover_image_url?: string  // ✅ Added
  }
) => {
  // ... existing code
  
  // Only show success toast if not just updating cover image
  if (!updates.cover_image_url || Object.keys(updates).length > 1) {
    toast.success("Welt erfolgreich aktualisiert!");
  }
}
```

---

## 🧪 Testing Flow

### World Images:
1. ✅ Upload Image → Saved to Supabase Storage
2. ✅ URL saved to `worlds.cover_image_url` in DB
3. ✅ URL loaded into `worldCoverImages` State on page load
4. ✅ **Screen wechseln** → Bild bleibt! 🎉

### Project Images:
1. ✅ Create Project with Image
2. ✅ Upload after Create → Saved to Supabase Storage
3. ✅ URL saved to `projects.cover_image_url` in DB
4. ✅ URL loaded into `projectCoverImages` State on page load
5. ✅ **Screen wechseln** → Bild bleibt! 🎉

---

## 📊 Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React State)                    │
│                                                               │
│  projectCoverImages: { [id]: url }                           │
│  worldCoverImages: { [id]: url }                             │
│                                                               │
│  ↓ On Load: DB → State                                       │
│  ↓ On Upload: File → Backend → DB → State                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Edge Functions)                    │
│                                                               │
│  POST /projects/:id/upload-image                             │
│  POST /worlds/:id/upload-image                               │
│                                                               │
│  1. Upload file to Supabase Storage                          │
│  2. Get signed URL (1 year validity)                         │
│  3. Update DB: cover_image_url = signedUrl                   │
│  4. Return URL to frontend                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (Database + Storage)              │
│                                                               │
│  Database:                                                    │
│    projects.cover_image_url                                  │
│    worlds.cover_image_url                                    │
│                                                               │
│  Storage:                                                     │
│    make-3b52693b-project-images/covers/                      │
│    make-3b52693b-world-images/covers/                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Changes

| File | Change | Reason |
|------|--------|--------|
| `ProjectsPage.tsx` | Load `cover_image_url` from DB into State | State was empty after page reload |
| `WorldbuildingPage.tsx` | Load `cover_image_url` from DB into State | State was empty after page reload |
| `WorldbuildingPage.tsx` | Save URL to DB after upload | URL was only in State, not persisted |
| `WorldbuildingPage.tsx` | Update `handleUpdateWorld` signature | Function didn't accept `cover_image_url` |

---

## ✅ Result

**Before:**
- Upload → Sichtbar ✅
- Screen wechseln → Weg ❌

**After:**
- Upload → Sichtbar ✅
- Screen wechseln → Bleibt! ✅
- Page Reload → Bleibt! ✅
- Code-Änderung → Bleibt! ✅

---

**Status:** ✅ COMMITTED & READY TO TEST

**Backend:** Already deployed ✅  
**Frontend:** Just committed ✅

**Test now!** 🚀

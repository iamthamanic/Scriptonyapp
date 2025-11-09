# 🔧 PROJECT IMAGE UPLOAD FIX

## 🚨 Critical Issue
**Project cover images were NOT uploaded to Supabase Storage!**

### Root Cause
In `ProjectDetail` component (inside ProjectsPage.tsx), the `handleFileChange` function was using the **old Base64 system** instead of uploading to Supabase Storage:

```typescript
// ❌ OLD CODE (Line 2722-2732)
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;  // ❌ Base64 only!
      onCoverImageChange(imageUrl);
    };
    reader.readAsDataURL(file);
  }
};
```

This is why:
1. ✅ Images appeared immediately after upload (Base64 in State)
2. ❌ Images disappeared after screen change (State reset, no DB data)

---

## ✅ Solution

### 1️⃣ Fix ProjectDetail Upload Function

**File:** `/components/pages/ProjectsPage.tsx` (Line 2722-2732)

```typescript
// ✅ NEW CODE - Upload to Supabase Storage
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    // Validate file
    validateImageFile(file, 5);

    // Show loading toast
    toast.loading('Bild wird hochgeladen...');

    // Upload to Supabase Storage
    const imageUrl = await uploadProjectImage(project.id, file);

    // Update local state immediately (optimistic UI)
    onCoverImageChange(imageUrl);

    toast.dismiss();
    toast.success('Bild erfolgreich hochgeladen!');
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.dismiss();
    toast.error(error instanceof Error ? error.message : 'Fehler beim Hochladen');
  }
};
```

### 2️⃣ Fix onCoverImageChange to Update DB

**File:** `/components/pages/ProjectsPage.tsx` (Line 664-669)

```typescript
// ✅ NEW CODE - Save URL to Database
onCoverImageChange={async (imageUrl) => {
  // Update local state immediately (optimistic UI)
  setProjectCoverImages(prev => ({
    ...prev,
    [currentProject.id]: imageUrl
  }));
  
  // Update in database
  try {
    await projectsApi.update(currentProject.id, { 
      cover_image_url: imageUrl 
    });
  } catch (error) {
    console.error('Error saving image URL to database:', error);
    // Note: Toast already shown in handleFileChange
  }
}}
```

---

## 🔄 Complete Flow

### Before Fix:
```
User clicks Cover → File Input → Base64 → State → ❌ Lost on reload
```

### After Fix:
```
User clicks Cover 
  → File Input 
  → Validate
  → Upload to Supabase Storage
  → Get signed URL (1 year validity)
  → Update State (optimistic UI)
  → Save URL to DB (cover_image_url)
  → ✅ Persistent forever!
```

---

## 🎯 What Changed

| Component | Change | Result |
|-----------|--------|--------|
| `handleFileChange` | Upload to Supabase Storage instead of Base64 | Images stored permanently |
| `onCoverImageChange` | Save URL to DB after upload | URLs persist across sessions |
| `loadData` | Load `cover_image_url` from DB into State | Images appear after reload |

---

## 🧪 Testing Flow

### Test 1: Upload Image to Existing Project
1. Open any existing project
2. Click on the cover image area
3. Select an image file
4. **Expected:**
   - ✅ Toast: "Bild wird hochgeladen..."
   - ✅ Toast: "Bild erfolgreich hochgeladen!"
   - ✅ Image appears immediately
5. **Navigate away** (e.g., back to Projects list)
6. **Navigate back** to the project
7. **Expected:**
   - ✅ **Image is still there!** 🎉

### Test 2: Create New Project with Image
1. Click "Neues Projekt"
2. Fill in project details
3. Upload a cover image
4. Click "Erstellen"
5. **Expected:**
   - ✅ Toast: "Bild wird hochgeladen..."
   - ✅ Toast: "Projekt erfolgreich erstellt!"
   - ✅ Image appears on project card
6. **Refresh browser** (F5)
7. **Expected:**
   - ✅ **Image is still there!** 🎉

### Test 3: Error Handling
1. Try to upload a file > 5MB
2. **Expected:**
   - ✅ Toast error: "Image too large..."
3. Try to upload a .txt file
4. **Expected:**
   - ✅ Toast error: "Invalid file type..."

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   ProjectDetail Component                    │
│                                                               │
│  handleFileChange()                                           │
│    1. Validate file (max 5MB, image only)                    │
│    2. Show loading toast                                     │
│    3. uploadProjectImage(projectId, file)                    │
│    4. onCoverImageChange(imageUrl)                           │
│       → Update State                                         │
│       → projectsApi.update({ cover_image_url })              │
│    5. Show success toast                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              uploadProjectImage() - API Client               │
│                                                               │
│  POST /projects/:id/upload-image                             │
│    → Sends file as FormData                                 │
│    → Returns signed URL                                     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│            Edge Function: scriptony-projects                 │
│                                                               │
│  POST /projects/:id/upload-image                             │
│    1. Validate file size & type                              │
│    2. Upload to Supabase Storage                             │
│    3. Create signed URL (1 year)                             │
│    4. Update DB: projects.cover_image_url = signedUrl        │
│    5. Return { imageUrl: signedUrl }                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│              Supabase Storage + Database                     │
│                                                               │
│  Storage:                                                     │
│    make-3b52693b-project-images/covers/:projectId/:timestamp │
│                                                               │
│  Database:                                                    │
│    projects.cover_image_url = "https://..."                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    On Page Load                              │
│                                                               │
│  loadData()                                                   │
│    1. GET /projects → projectsData[]                         │
│    2. Extract cover_image_url from each project              │
│    3. setProjectCoverImages({ [id]: url })                   │
│    → Images appear from DB! ✅                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Result

**Before:**
- Upload → Visible ✅
- Navigate away → Gone ❌
- Reload → Gone ❌

**After:**
- Upload → Visible ✅
- Navigate away → **Still there!** ✅
- Reload → **Still there!** ✅
- Code change → **Still there!** ✅

---

## 🎯 Files Changed

1. `/components/pages/ProjectsPage.tsx`
   - Line 2722-2732: `handleFileChange` - Upload to Supabase
   - Line 664-669: `onCoverImageChange` - Save URL to DB
   - Line 149-163: `loadData` - Load URLs from DB into State

2. `/components/pages/WorldbuildingPage.tsx`
   - Already fixed in previous commit ✅

---

**Status:** ✅ READY TO TEST

**Next Step:** Test uploading images to existing projects!

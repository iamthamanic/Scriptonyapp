# 👋 Welcome to Scriptony – Developer Onboarding

**Welcome! This doc gets you up to speed on Scriptony's architecture in 10 minutes.**

---

## 🎯 Core Principle: BFF Architecture

**Scriptony uses a strict 3-tier architecture:**

```
Frontend (React) → BFF (Edge Functions) → Supabase (Database)
```

**Golden Rule:** Frontend **NEVER** talks directly to Supabase (except Auth Adapter).

---

## 🚀 Quick Start

### 1. Need to fetch data?

```typescript
// ✅ DO THIS
import { apiClient } from '@/lib/api-client';

const projects = await apiClient.get('/projects');
```

```typescript
// ❌ NEVER DO THIS
import { supabase } from '@/utils/supabase/client';
const { data } = await supabase.from('projects').select('*'); // ESLint blocks this!
```

---

### 2. Need authentication?

```typescript
// ✅ DO THIS
import { getAuthClient } from '@/lib/auth/getAuthClient';
import { getAuthToken } from '@/lib/auth/getAuthToken';

// Login
const session = await getAuthClient().signInWithPassword(email, password);

// Get token for API calls
const token = await getAuthToken();
```

```typescript
// ❌ NEVER DO THIS
import { supabase } from '@/utils/supabase/client';
await supabase.auth.signInWithPassword({ email, password }); // ESLint blocks this!
```

---

### 3. Need to upload files?

```typescript
// ✅ DO THIS
import { uploadImage } from '@/utils/storage';

const { url } = await uploadImage(file, userId, 'avatars');
```

```typescript
// ❌ NEVER DO THIS
import { supabase } from '@/utils/supabase/client';
await supabase.storage.from('bucket').upload(...); // ESLint blocks this!
```

---

## 📚 Key Files to Know

### Frontend Entry Points

| File | Purpose | When to Use |
|------|---------|-------------|
| `/lib/auth/getAuthClient.ts` | Auth operations (login, logout, etc.) | Need to sign in/out users |
| `/lib/auth/getAuthToken.ts` | Get auth token for API calls | Making authenticated API requests |
| `/lib/api-client.ts` | Generic API client (GET, POST, PUT, DELETE) | Any database operation |
| `/utils/storage.tsx` | File upload/download | Uploading images, avatars, files |

### Backend Routes (BFF)

| File | Routes | Purpose |
|------|--------|---------|
| `/supabase/functions/server/index-postgres.tsx` | `/projects`, `/auth/*`, `/storage/*` | Main routes |
| `/supabase/functions/server/routes-worlds.tsx` | `/worlds/*` | Worldbuilding CRUD |
| `/supabase/functions/server/routes-characters.tsx` | `/characters/*` | Characters CRUD |
| `/supabase/functions/server/routes-episodes.tsx` | `/episodes/*` | Episodes CRUD |
| `/supabase/functions/server/routes-scenes.tsx` | `/scenes/*` | Scenes CRUD |
| `/supabase/functions/server/routes-acts.tsx` | `/acts/*` | Acts CRUD |
| `/supabase/functions/server/routes-sequences.tsx` | `/sequences/*` | Sequences CRUD |
| `/supabase/functions/server/routes-shots.tsx` | `/shots/*` | Shots CRUD |
| `/supabase/functions/server/routes-ai-chat.tsx` | `/ai/chat/*` | AI Chat System |

---

## 🔨 Adding a New Feature (Step-by-Step)

### Example: Add a "Notes" feature

#### Step 1: Create Backend Route

**File:** `/supabase/functions/server/routes-notes.tsx`

```typescript
import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Helper to get user ID from auth token
async function getUserId(c: any): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = c.get('supabase') as SupabaseClient;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  return error || !user ? null : user.id;
}

// GET /notes - List all notes
app.get("/make-server-3b52693b/notes", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get('supabase') as SupabaseClient;
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notes:', error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ notes: data });
});

// POST /notes - Create a note
app.post("/make-server-3b52693b/notes", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  
  // Validation
  if (!body.title || !body.content) {
    return c.json({ error: "Title and content are required" }, 400);
  }

  const supabase = c.get('supabase') as SupabaseClient;

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: body.title,
      content: body.content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ note: data }, 201);
});

// PUT /notes/:id - Update a note
app.put("/make-server-3b52693b/notes/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param('id');
  const body = await c.req.json();

  const supabase = c.get('supabase') as SupabaseClient;

  const { data, error } = await supabase
    .from('notes')
    .update({
      title: body.title,
      content: body.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId) // Security: only update own notes
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ note: data });
});

// DELETE /notes/:id - Delete a note
app.delete("/make-server-3b52693b/notes/:id", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param('id');
  const supabase = c.get('supabase') as SupabaseClient;

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId); // Security: only delete own notes

  if (error) {
    console.error('Error deleting note:', error);
    return c.json({ error: error.message }, 500);
  }

  return c.json({ success: true }, 200);
});

export default app;
```

---

#### Step 2: Register Route in Main Server

**File:** `/supabase/functions/server/index.tsx` (or `index-postgres.tsx`)

```typescript
// Add import at top
import notesRoutes from './routes-notes.tsx';

// Add route registration (around line 50-60 where other routes are)
app.route('/', notesRoutes);
```

---

#### Step 3: Create Frontend API Wrapper

**File:** `/lib/api/notes-api.ts`

```typescript
import { apiClient } from '../api-client';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Get all notes for current user
 */
export async function getNotes(): Promise<Note[]> {
  const response = await apiClient.get<{ notes: Note[] }>('/notes');
  return response.notes;
}

/**
 * Create a new note
 */
export async function createNote(title: string, content: string): Promise<Note> {
  const response = await apiClient.post<{ note: Note }>('/notes', { title, content });
  return response.note;
}

/**
 * Update a note
 */
export async function updateNote(id: string, patch: Partial<Note>): Promise<Note> {
  const response = await apiClient.put<{ note: Note }>(`/notes/${id}`, patch);
  return response.note;
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<void> {
  await apiClient.delete(`/notes/${id}`);
}
```

---

#### Step 4: Use in Frontend

**File:** `/components/pages/NotesPage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { getNotes, createNote, deleteNote } from '@/lib/api/notes-api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      await createNote('New Note', 'Content...');
      await loadNotes(); // Reload list
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      await loadNotes(); // Reload list
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <Button onClick={handleCreate}>Create Note</Button>
      
      <div className="mt-4 space-y-2">
        {notes.map(note => (
          <Card key={note.id} className="p-4">
            <h3>{note.title}</h3>
            <p>{note.content}</p>
            <Button onClick={() => handleDelete(note.id)}>Delete</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## 🛡️ ESLint Will Help You!

If you accidentally write:

```typescript
import { supabase } from '@/utils/supabase/client';
await supabase.from('projects').select('*');
```

**ESLint will show:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.from()' ist verboten!
→ Nutze stattdessen:
  • apiClient.get/post/put/delete() aus '@/lib/api-client'
```

**Just follow the error message!**

---

## 🧪 Testing Your Code

### Frontend Unit Test

```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { getNotes } from '@/lib/api/notes-api';

// Mock API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
  }
}));

test('getNotes returns notes', async () => {
  // Mock response
  (apiClient.get as any).mockResolvedValue({
    notes: [{ id: '1', title: 'Test', content: 'Content' }]
  });

  // Call function
  const notes = await getNotes();

  // Assertions
  expect(apiClient.get).toHaveBeenCalledWith('/notes');
  expect(notes).toHaveLength(1);
  expect(notes[0].title).toBe('Test');
});
```

### Manual Testing

1. Start dev server: `npm run dev`
2. Open browser console
3. Run:
```javascript
import { getNotes } from '/lib/api/notes-api';
const notes = await getNotes();
console.log(notes);
```

---

## 🐛 Common Issues

### Issue: "401 Unauthorized" when calling API

**Cause:** Not logged in, or auth token expired.

**Fix:**
```typescript
import { getAuthToken } from '@/lib/auth/getAuthToken';

const token = await getAuthToken();
console.log('Token:', token); // Should be a long JWT string

if (!token) {
  // User needs to login
  navigate('/login');
}
```

---

### Issue: "Cannot find module '@/lib/api-client'"

**Cause:** Wrong import path.

**Fix:**
```typescript
// Use relative imports:
import { apiClient } from '../../lib/api-client';

// Or configure tsconfig.json:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Issue: ESLint not blocking direct Supabase access

**Cause:** ESLint config not loaded, or file is in `excludedFiles`.

**Fix:**
1. Check `.eslintrc.json` exists
2. Restart ESLint server: `Cmd+Shift+P` → "ESLint: Restart ESLint Server"
3. Make sure file is NOT in `/supabase/functions/**` or `/lib/auth/**`

---

## 📚 Learn More

- **BFF Architecture Overview:** `/BFF_ARCHITECTURE.md`
- **Full BFF Guide:** `/BFF_ENFORCEMENT_GUIDE.md`
- **Quick Reference:** `/BFF_QUICK_REFERENCE.md`
- **Auth Guide:** `/lib/auth/README.md`
- **API Client Source:** `/lib/api-client.ts`

---

## ✅ Checklist: You're Ready When...

- [ ] You understand: Frontend → BFF → Supabase (no direct access)
- [ ] You know when to use `getAuthClient()` (auth) vs `apiClient` (data)
- [ ] You know how to create a new BFF route (3 steps)
- [ ] You know how to create a typed API wrapper
- [ ] You understand ESLint will block direct Supabase access
- [ ] You've tested creating a simple feature end-to-end

---

## 🎉 Welcome Aboard!

**You're now ready to build features in Scriptony!** 🚀

If you have questions:
1. Check the docs: `/BFF_*.md`
2. Look at existing code: `/lib/api/*.ts`, `/supabase/functions/server/routes-*.tsx`
3. Ask the team!

**Happy coding!** 💜

# 🛡️ BFF Enforcement Guide – Scriptony Architecture

**Status:** ✅ **Active & Enforced**  
**Confidence:** 100%

---

## 🎯 Ziel

**Scriptony nutzt eine strikte 3-Tier BFF (Backend-for-Frontend) Architektur:**

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ❌ Kein direkter Supabase-Zugriff (außer Adapter)      │
├─────────────────────────────────────────────────────────┤
│                  BFF LAYER (Edge Functions)              │
│  ✅ Auth, Database, Storage, Business Logic             │
├─────────────────────────────────────────────────────────┤
│              SUPABASE (Database, Auth, Storage)          │
│  ✅ Nur vom BFF aus zugänglich                          │
└─────────────────────────────────────────────────────────┘
```

**Dieser Guide erklärt, wie neue Features automatisch durch ESLint Guards über das BFF laufen müssen.**

---

## 🚨 Was ist verboten?

### ❌ NIEMALS im Frontend (außer Adapter):

```typescript
// ❌ VERBOTEN: Direkte Database-Zugriffe
import { supabase } from '@/utils/supabase/client';
const { data } = await supabase.from('projects').select('*');

// ❌ VERBOTEN: Direkte Storage-Zugriffe
const { data } = await supabase.storage.from('avatars').upload('file.png', file);

// ❌ VERBOTEN: Direkte Auth-Zugriffe
const { data } = await supabase.auth.getSession();

// ❌ VERBOTEN: RPC-Calls
const { data } = await supabase.rpc('my_function');

// ❌ VERBOTEN: Direkter Supabase SDK Import
import { createClient } from '@supabase/supabase-js';
```

**Warum verboten?**
1. **Sicherheit:** Frontend-Code ist für jeden einsehbar (Secrets können leaken)
2. **Austauschbarkeit:** Bei Provider-Wechsel (z.B. Auth0, Firebase) müsste man 100+ Dateien ändern
3. **Testing:** Mock-Tests sind unmöglich bei direkten Supabase-Zugriffen
4. **Business Logic:** Gehört ins Backend (z.B. Validierung, ACL, Rate Limiting)

---

## ✅ Was ist erlaubt?

### 1. **Auth (über Adapter)**

```typescript
// ✅ ERLAUBT: Auth Client für Login/Logout
import { getAuthClient } from '@/lib/auth/getAuthClient';

const session = await getAuthClient().signInWithPassword(email, password);
await getAuthClient().signOut();

// ✅ ERLAUBT: Token für API-Calls
import { getAuthToken } from '@/lib/auth/getAuthToken';

const token = await getAuthToken();
```

📖 **Siehe:** `/lib/auth/README.md`

---

### 2. **Database (über API Client)**

```typescript
// ✅ ERLAUBT: Generic API Client
import { apiClient } from '@/lib/api-client';

// GET Request
const projects = await apiClient.get('/projects');

// POST Request
const newProject = await apiClient.post('/projects', { title: 'Test' });

// PUT Request
await apiClient.put('/projects/123', { title: 'Updated' });

// DELETE Request
await apiClient.delete('/projects/123');
```

📖 **Siehe:** `/lib/api-client.ts`

---

### 3. **Storage (über Storage Helper)**

```typescript
// ✅ ERLAUBT: Storage Upload
import { uploadImage, getStorageUsage } from '@/utils/storage';

const { url, path } = await uploadImage(file, userId, 'avatars');
const usage = await getStorageUsage(userId);
```

📖 **Siehe:** `/utils/storage.tsx`

---

### 4. **Typed API Calls (Empfohlen)**

```typescript
// ✅ BEST PRACTICE: Typed API Wrapper
import { createProject } from '@/lib/api/projects-api';

const project = await createProject({
  title: 'My Film',
  genre: 'Action',
});
```

📖 **Siehe:** `/lib/api/timeline-api.ts`, `/lib/api/shots-api.ts`

---

## 🔨 Wie erstelle ich ein neues Feature?

### Schritt 1: Backend-Route erstellen

**Datei:** `/supabase/functions/server/routes-my-feature.tsx`

```typescript
import { Hono } from "npm:hono";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Nutze getUserId() für Auth
async function getUserId(c: any): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.replace("Bearer ", "");
  const supabase = c.get('supabase') as SupabaseClient;
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  return error || !user ? null : user.id;
}

// GET /my-feature
app.get("/make-server-3b52693b/my-feature", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const supabase = c.get('supabase') as SupabaseClient;
  
  // ✅ HIER darf supabase.from() genutzt werden!
  const { data, error } = await supabase
    .from('my_table')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

// POST /my-feature
app.post("/make-server-3b52693b/my-feature", async (c) => {
  const userId = await getUserId(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const supabase = c.get('supabase') as SupabaseClient;

  // Validierung
  if (!body.name) {
    return c.json({ error: "Name is required" }, 400);
  }

  // Insert
  const { data, error } = await supabase
    .from('my_table')
    .insert({
      user_id: userId,
      name: body.name,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data }, 201);
});

export default app;
```

---

### Schritt 2: Route in Main Server registrieren

**Datei:** `/supabase/functions/server/index.tsx`

```typescript
import myFeatureRoutes from './routes-my-feature.tsx';

// ... andere Imports

app.route('/', myFeatureRoutes);
```

---

### Schritt 3: Frontend API Wrapper erstellen

**Datei:** `/lib/api/my-feature-api.ts`

```typescript
import { apiClient } from '../api-client';

export interface MyFeature {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

/**
 * Get all features for current user
 */
export async function getMyFeatures(): Promise<MyFeature[]> {
  const response = await apiClient.get<{ data: MyFeature[] }>('/my-feature');
  return response.data;
}

/**
 * Create a new feature
 */
export async function createMyFeature(name: string): Promise<MyFeature> {
  const response = await apiClient.post<{ data: MyFeature }>('/my-feature', { name });
  return response.data;
}

/**
 * Update a feature
 */
export async function updateMyFeature(id: string, patch: Partial<MyFeature>): Promise<MyFeature> {
  const response = await apiClient.put<{ data: MyFeature }>(`/my-feature/${id}`, patch);
  return response.data;
}

/**
 * Delete a feature
 */
export async function deleteMyFeature(id: string): Promise<void> {
  await apiClient.delete(`/my-feature/${id}`);
}
```

---

### Schritt 4: Im Frontend nutzen

**Datei:** `/components/pages/MyFeaturePage.tsx`

```typescript
import { useState, useEffect } from 'react';
import { getMyFeatures, createMyFeature } from '@/lib/api/my-feature-api';

export function MyFeaturePage() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const data = await getMyFeatures();
      setFeatures(data);
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(name: string) {
    try {
      await createMyFeature(name);
      await loadFeatures(); // Reload
    } catch (error) {
      console.error('Failed to create feature:', error);
    }
  }

  // ... rest of component
}
```

---

## 🛡️ ESLint Guards

### Automatische Blockierung

Die `.eslintrc.json` blockiert automatisch:

1. ❌ `supabase.auth.*` → Nutze `getAuthClient()` / `getAuthToken()`
2. ❌ `supabase.from()` → Nutze `apiClient.get/post/put/delete()`
3. ❌ `supabase.storage.*` → Nutze `uploadImage()` / `getStorageUsage()`
4. ❌ `supabase.rpc()` → Erstelle BFF-Route
5. ❌ `import { supabase }` → Nutze Adapter/Client

**Ausnahmen (erlaubt):**
- `lib/auth/**` (Auth Adapter)
- `utils/supabase/client.tsx` (Client Factory)
- `supabase/functions/**` (Backend)

---

### Fehlerbeispiel

```typescript
// ❌ Dieser Code wird von ESLint blockiert:
import { supabase } from '@/utils/supabase/client';

const { data } = await supabase.from('projects').select('*');
```

**ESLint Fehler:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.from()' ist verboten!
→ Nutze stattdessen:
  • apiClient.get/post/put/delete() aus '@/lib/api-client'
  • Oder erstelle eine neue API-Route in /lib/api/
📖 Siehe: /BFF_ENFORCEMENT_GUIDE.md
```

---

## 📊 Architektur-Übersicht

### Aktuelle BFF-Layer

| Layer | Status | Beschreibung |
|-------|--------|--------------|
| **Auth** | ✅ Entkoppelt | Adapter Pattern (`/lib/auth/`) |
| **Database** | ✅ Entkoppelt | API Client (`/lib/api-client.ts`) + Routes |
| **Storage** | ✅ Entkoppelt | Storage Helper (`/utils/storage.tsx`) |
| **Business Logic** | ✅ Backend | BFF Routes (`/supabase/functions/server/`) |

### Alle BFF-Routen

| Route | Datei | Beschreibung |
|-------|-------|--------------|
| `/projects` | `index-postgres.tsx` | Projects CRUD |
| `/worlds` | `routes-worlds.tsx` | Worldbuilding |
| `/characters` | `routes-characters.tsx` | Characters CRUD |
| `/episodes` | `routes-episodes.tsx` | Episodes CRUD |
| `/scenes` | `routes-scenes.tsx` | Scenes CRUD |
| `/acts` | `routes-acts.tsx` | Acts CRUD |
| `/sequences` | `routes-sequences.tsx` | Sequences CRUD |
| `/shots` | `routes-shots.tsx` | Shots CRUD |
| `/ai/chat` | `routes-ai-chat.tsx` | AI Chat System |
| `/storage/*` | `index-postgres.tsx` | File Upload/Download |
| `/auth/signup` | `index-postgres.tsx` | User Registration |

---

## 🧪 Testing

### Unit Tests mit Mock API Client

```typescript
import { vi } from 'vitest';
import { apiClient } from '@/lib/api-client';

// Mock API Client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

test('loads projects', async () => {
  // Mock response
  (apiClient.get as any).mockResolvedValue({
    projects: [{ id: '1', title: 'Test' }]
  });

  // Test component
  const projects = await getProjects();
  
  expect(apiClient.get).toHaveBeenCalledWith('/projects');
  expect(projects).toHaveLength(1);
});
```

---

## 🔄 Migration Bestehender Features

Falls du **alten Code** findest mit direkten Supabase-Zugriffen:

### Vorher (Alt)

```typescript
import { supabase } from '@/utils/supabase/client';

const { data } = await supabase.from('projects').select('*');
```

### Nachher (Neu)

```typescript
import { apiClient } from '@/lib/api-client';

const { projects } = await apiClient.get('/projects');
```

---

## 🎁 Benefits

### 1. **Sicherheit**
- Kein Secret-Leak im Frontend
- Row-Level-Security im Backend
- Rate Limiting möglich

### 2. **Austauschbarkeit**
- Wechsel zu Firebase? → Nur BFF ändern
- Wechsel zu Auth0? → Nur Auth Adapter ändern
- Frontend bleibt unverändert

### 3. **Performance**
- Caching im BFF möglich
- Response-Optimierung (z.B. nur benötigte Felder)
- Batch-Requests möglich

### 4. **Testing**
- Mock API Client für Unit Tests
- Mock Auth Client für Auth Tests
- Keine echte DB nötig für Tests

### 5. **Business Logic**
- Validierung im Backend (sicher)
- Komplexe Queries im Backend
- Transaktionen im Backend

---

## 📝 Checkliste: Neues Feature

- [ ] Backend-Route erstellt (`/supabase/functions/server/routes-*.tsx`)
- [ ] Route in Main Server registriert (`index.tsx`)
- [ ] Frontend API Wrapper erstellt (`/lib/api/*-api.ts`)
- [ ] TypeScript Types definiert
- [ ] ESLint zeigt keine Violations
- [ ] Smoke Test durchgeführt
- [ ] Dokumentation aktualisiert

---

## 🚨 Troubleshooting

### Problem: ESLint zeigt keinen Fehler bei direktem Supabase-Zugriff

**Lösung:**
1. Check `.eslintrc.json` existiert
2. ESLint Server neu starten
3. Datei ist nicht in `excludedFiles`

---

### Problem: "Cannot find module '@/lib/api-client'"

**Lösung:**
```typescript
// Relative Imports nutzen:
import { apiClient } from '../../lib/api-client';

// Oder tsconfig.json konfigurieren:
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### Problem: 401 Unauthorized bei API-Calls

**Lösung:**
```typescript
// Check Token wird mitgesendet:
import { getAuthToken } from '@/lib/auth/getAuthToken';

const token = await getAuthToken();
console.log('Token:', token);

// Check apiClient sendet Header:
// In /lib/api-client.ts sollte stehen:
headers: {
  'Authorization': `Bearer ${token}`,
}
```

---

## ✅ Summary

**Scriptony nutzt eine strikte BFF-Architektur mit automatischen ESLint Guards.**

- ✅ **Auth:** Adapter Pattern (`/lib/auth/`)
- ✅ **Database:** API Client + BFF Routes
- ✅ **Storage:** Storage Helper
- ✅ **ESLint:** Blockiert direkte Supabase-Zugriffe im Frontend

**Neue Features MÜSSEN über das BFF laufen – ESLint erzwingt dies automatisch!** 🛡️

---

## 📚 Related Docs

- `/lib/auth/README.md` – Auth Client Usage
- `/AUTH_ADAPTER_REFACTOR_COMPLETE.md` – Auth Adapter Implementation
- `/lib/api-client.ts` – API Client Source Code
- `/utils/storage.tsx` – Storage Helper Source Code
- `/API_REFERENCE.md` – Alle verfügbaren API-Routen

---

**Questions?** Siehe diesen Guide oder frag im Team! 🚀

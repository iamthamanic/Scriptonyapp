# 🚀 BFF Quick Reference – Scriptony

**TLDR:** Frontend darf Supabase **nie** direkt nutzen. Nur über BFF (Backend-for-Frontend).

---

## ✅ DO THIS (Frontend)

```typescript
// ✅ Auth
import { getAuthClient } from '@/lib/auth/getAuthClient';
import { getAuthToken } from '@/lib/auth/getAuthToken';

const session = await getAuthClient().signInWithPassword(email, pass);
const token = await getAuthToken();

// ✅ Database
import { apiClient } from '@/lib/api-client';

const data = await apiClient.get('/projects');
await apiClient.post('/projects', { title: 'New' });
await apiClient.put('/projects/123', { title: 'Updated' });
await apiClient.delete('/projects/123');

// ✅ Storage
import { uploadImage, getStorageUsage } from '@/utils/storage';

const { url } = await uploadImage(file, userId, 'avatars');
const usage = await getStorageUsage(userId);

// ✅ Typed API
import { createProject } from '@/lib/api/projects-api';

const project = await createProject({ title: 'Test' });
```

---

## ❌ NEVER DO THIS (Frontend)

```typescript
// ❌ VERBOTEN – ESLint blockiert das!
import { supabase } from '@/utils/supabase/client';

await supabase.from('projects').select('*');      // ❌
await supabase.auth.getSession();                 // ❌
await supabase.storage.from('bucket').upload(...); // ❌
await supabase.rpc('my_function');                // ❌
```

---

## 🔨 Neues Feature? 3 Schritte:

### 1. Backend Route

**Datei:** `/supabase/functions/server/routes-my-feature.tsx`

```typescript
import { Hono } from "npm:hono";

const app = new Hono();

app.get("/make-server-3b52693b/my-feature", async (c) => {
  const supabase = c.get('supabase');
  
  // ✅ Hier ist supabase.from() erlaubt!
  const { data } = await supabase.from('my_table').select('*');
  
  return c.json({ data });
});

export default app;
```

### 2. Registrieren

**Datei:** `/supabase/functions/server/index.tsx`

```typescript
import myFeature from './routes-my-feature.tsx';
app.route('/', myFeature);
```

### 3. Frontend Wrapper

**Datei:** `/lib/api/my-feature-api.ts`

```typescript
import { apiClient } from '../api-client';

export async function getMyFeatures() {
  return await apiClient.get('/my-feature');
}
```

---

## 🛡️ ESLint Guards

ESLint blockiert automatisch:
- `supabase.auth.*` → Use `getAuthClient()`
- `supabase.from()` → Use `apiClient.get()`
- `supabase.storage.*` → Use `uploadImage()`
- `supabase.rpc()` → Create BFF route

**Ausnahmen:** Backend (`supabase/functions/**`), Auth Adapter (`lib/auth/**`)

---

## 📚 Docs

- **Vollständig:** `/BFF_ENFORCEMENT_GUIDE.md`
- **Auth:** `/lib/auth/README.md`
- **API Client:** `/lib/api-client.ts`

---

**That's it! Frontend → BFF → Supabase. Always.** 🚀

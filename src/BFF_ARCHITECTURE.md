# 🏗️ Scriptony BFF Architecture – Visual Guide

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                      (React + TypeScript)                        │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │   Pages    │  │ Components │  │   Hooks    │               │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘               │
│        │               │               │                        │
│        └───────────────┴───────────────┘                        │
│                        │                                        │
│         ┌──────────────┴──────────────┐                        │
│         │                              │                        │
│    ┌────▼────┐              ┌─────────▼────────┐              │
│    │  Auth   │              │   API Client     │              │
│    │ Adapter │              │  (apiClient)     │              │
│    └────┬────┘              └─────────┬────────┘              │
│         │                              │                        │
└─────────┼──────────────────────────────┼────────────────────────┘
          │                              │
          │ getAuthToken()              │ fetch + Bearer Token
          │                              │
┌─────────▼──────────────────────────────▼────────────────────────┐
│                          BFF LAYER                               │
│              (Supabase Edge Functions + Hono)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Auth Routes  │  │  API Routes  │  │Storage Routes│         │
│  │ /auth/*      │  │ /projects    │  │ /storage/*   │         │
│  │              │  │ /worlds      │  │              │         │
│  └──────┬───────┘  │ /characters  │  └──────┬───────┘         │
│         │          │ /episodes    │         │                  │
│         │          │ /scenes      │         │                  │
│         │          │ /acts        │         │                  │
│         │          │ /sequences   │         │                  │
│         │          │ /shots       │         │                  │
│         │          │ /ai/chat     │         │                  │
│         │          └──────┬───────┘         │                  │
│         │                 │                 │                  │
│         └─────────────────┴─────────────────┘                  │
│                           │                                     │
│                  supabase.auth.getUser(token)                  │
│                  supabase.from('table')                        │
│                  supabase.storage                              │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                      SUPABASE LAYER                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PostgreSQL   │  │   GoTrue     │  │   Storage    │         │
│  │  Database    │  │    Auth      │  │   Buckets    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Auth Flow

```
┌─────────────┐
│  Frontend   │  Login Button Click
│  Component  │────────────────────┐
└─────────────┘                    │
                                   ▼
                        ┌──────────────────────┐
                        │   getAuthClient()    │
                        │  .signInWithPassword │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │ SupabaseAuthAdapter  │
                        │  (ONLY place with    │
                        │   supabase.auth)     │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Supabase GoTrue     │
                        │   (Auth Service)     │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Return Session      │
                        │  { accessToken, ...} │
                        └──────────────────────┘
```

---

## 📊 Database Flow

```
┌─────────────┐
│  Frontend   │  Load Projects
│  Component  │────────────────────┐
└─────────────┘                    │
                                   ▼
                        ┌──────────────────────┐
                        │   apiClient.get()    │
                        │   '/projects'        │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │   getAuthToken()     │
                        │  (adds Bearer token) │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  BFF: /projects GET  │
                        │  (getUserId from     │
                        │   Bearer token)      │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │ supabase.from()      │
                        │  (ONLY in BFF!)      │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  PostgreSQL Query    │
                        │  + RLS Check         │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Return JSON         │
                        │  { projects: [...] } │
                        └──────────────────────┘
```

---

## 📁 Storage Flow

```
┌─────────────┐
│  Frontend   │  Upload Avatar
│  Component  │────────────────────┐
└─────────────┘                    │
                                   ▼
                        ┌──────────────────────┐
                        │   uploadImage()      │
                        │   (from utils)       │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │   getAuthToken()     │
                        │  + FormData          │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │ BFF: /storage/upload │
                        │  (getUserId from     │
                        │   Bearer token)      │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │ supabase.storage     │
                        │  .upload()           │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Supabase Storage    │
                        │  Bucket Write        │
                        └──────────┬───────────┘
                                   │
                        ┌──────────▼───────────┐
                        │  Return Signed URL   │
                        │  { url, path }       │
                        └──────────────────────┘
```

---

## 🛡️ ESLint Guard System

```
┌─────────────────────────────────────────────────────────┐
│                    Developer writes:                     │
│                                                          │
│  import { supabase } from '@/utils/supabase/client';    │
│  const data = await supabase.from('projects').select(); │
│                                                          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │        ESLint Parser           │
        │  (checks AST for violations)   │
        └────────────────┬───────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    Violation?                      No Violation?
         │                               │
         ▼                               ▼
┌────────────────┐              ┌────────────────┐
│  ❌ ERROR:     │              │  ✅ PASS       │
│                │              │                │
│  BFF VIOLATION │              │  Code is OK    │
│  Use apiClient │              │                │
│  instead!      │              └────────────────┘
└────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Developer sees red squiggly line      │
│  + error message with fix suggestion   │
└────────────────────────────────────────┘
```

---

## 📦 File Structure

```
scriptony/
├── components/           ← React Components (Frontend)
│   ├── pages/           ← Page Components
│   └── ...
│
├── lib/                 ← Frontend Libraries
│   ├── auth/            ← ✅ Auth Adapter (ONLY supabase.auth here)
│   │   ├── AuthClient.ts
│   │   ├── SupabaseAuthAdapter.ts
│   │   ├── getAuthClient.ts
│   │   └── getAuthToken.ts
│   │
│   ├── api/             ← ✅ Typed API Wrappers
│   │   ├── projects-api.ts
│   │   ├── timeline-api.ts
│   │   └── shots-api.ts
│   │
│   └── api-client.ts    ← ✅ Generic API Client
│
├── utils/
│   └── storage.tsx      ← ✅ Storage Helper (uses BFF)
│
├── supabase/
│   └── functions/
│       └── server/      ← ✅ BFF LAYER (Backend)
│           ├── index.tsx                ← Main server
│           ├── routes-projects-init.tsx ← Projects
│           ├── routes-worlds.tsx        ← Worlds
│           ├── routes-characters.tsx    ← Characters
│           ├── routes-episodes.tsx      ← Episodes
│           ├── routes-scenes.tsx        ← Scenes
│           ├── routes-acts.tsx          ← Acts
│           ├── routes-sequences.tsx     ← Sequences
│           ├── routes-shots.tsx         ← Shots
│           └── routes-ai-chat.tsx       ← AI Chat
│
└── .eslintrc.json       ← ✅ Guard Rules
```

---

## 🔄 Data Flow Comparison

### ❌ Old (Direct Supabase)

```
Frontend → Supabase SDK → Database
```

**Problems:**
- Secrets in Frontend (security risk)
- Hard to switch providers
- Can't add business logic
- Can't test easily

---

### ✅ New (BFF Architecture)

```
Frontend → Auth Adapter → BFF → Supabase → Database
Frontend → API Client   ─┘
Frontend → Storage Helper ─┘
```

**Benefits:**
- ✅ No secrets in Frontend
- ✅ Easy to switch providers
- ✅ Business logic in Backend
- ✅ Easy to test (mock adapters)
- ✅ Rate limiting possible
- ✅ Response optimization
- ✅ ESLint enforces architecture

---

## 🎯 Key Principles

### 1. **Single Entry Point**
Frontend hat **nur 3 Wege** zu Supabase:
1. `getAuthClient()` / `getAuthToken()` für Auth
2. `apiClient` für Database
3. `uploadImage()` für Storage

### 2. **No Direct Access**
Frontend darf **NIEMALS** direkt mit Supabase kommunizieren (außer Auth Adapter).

### 3. **ESLint Enforcement**
Neue Features werden **automatisch** durch ESLint Guards über BFF gezwungen.

### 4. **Backend Owns Business Logic**
Validierung, ACL, Rate Limiting = Backend, nicht Frontend!

---

## 📊 Security Comparison

### ❌ Without BFF

```typescript
// Frontend (UNSICHER!)
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId); // ← Kann manipuliert werden!
```

**Problem:** User kann `userId` ändern und andere Projekte sehen!

---

### ✅ With BFF

```typescript
// Frontend (SICHER!)
const projects = await apiClient.get('/projects');

// BFF (Backend)
app.get('/projects', async (c) => {
  const userId = await getUserId(c); // ← Aus Auth Token (sicher!)
  
  const { data } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId); // ← Kann NICHT manipuliert werden!
    
  return c.json({ projects: data });
});
```

**Vorteil:** User kann `userId` nicht manipulieren – kommt vom Server!

---

## 🧪 Testing Strategy

### Frontend Tests (Unit)

```typescript
// Mock API Client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ projects: [...] })
  }
}));

// Test Component
test('loads projects', async () => {
  render(<ProjectsPage />);
  expect(screen.getByText('My Project')).toBeInTheDocument();
});
```

### Backend Tests (Integration)

```typescript
// Test BFF Route directly
test('GET /projects returns user projects', async () => {
  const response = await fetch('/projects', {
    headers: { 'Authorization': `Bearer ${testToken}` }
  });
  
  const data = await response.json();
  expect(data.projects).toHaveLength(3);
});
```

---

## 🚀 Performance Benefits

### Caching

```typescript
// BFF can cache expensive queries
const cache = new Map();

app.get('/projects', async (c) => {
  const userId = await getUserId(c);
  
  if (cache.has(userId)) {
    return c.json({ projects: cache.get(userId) });
  }
  
  const { data } = await supabase.from('projects').select('*');
  cache.set(userId, data);
  
  return c.json({ projects: data });
});
```

### Response Optimization

```typescript
// BFF can optimize responses
app.get('/projects', async (c) => {
  // Only select needed fields
  const { data } = await supabase
    .from('projects')
    .select('id, title, created_at'); // ← Not all fields
    
  return c.json({ projects: data });
});
```

### Batch Requests

```typescript
// BFF can batch multiple requests
app.get('/dashboard', async (c) => {
  const [projects, characters, worlds] = await Promise.all([
    supabase.from('projects').select('*'),
    supabase.from('characters').select('*'),
    supabase.from('worlds').select('*'),
  ]);
  
  return c.json({ projects, characters, worlds });
});
```

---

## ✅ Summary

**Scriptony nutzt eine strikte 3-Tier BFF-Architektur:**

```
Frontend (React)
    ↓
Auth Adapter + API Client + Storage Helper
    ↓
BFF Layer (Supabase Edge Functions)
    ↓
Supabase (Database, Auth, Storage)
```

**ESLint Guards erzwingen diese Architektur automatisch!** 🛡️

---

**Questions?** See `/BFF_ENFORCEMENT_GUIDE.md` for full guide.

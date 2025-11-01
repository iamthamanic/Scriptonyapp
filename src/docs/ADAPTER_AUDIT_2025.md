# 🔍 SCRIPTONY ADAPTER AUDIT - Oktober 2025

**Analyse der Supabase-Kopplung nach Multi-Function Migration**

---

## 1. Executive Summary

**Status:** ✅ **SEHR GUT ENTKOPPELT** - Die Architektur hat eine **saubere BFF/API-Layer-Trennung** mit minimalem direkten Supabase-Zugriff im Frontend.

**Kurzfazit:**
- ✅ **API Gateway vorhanden** (`api-gateway.ts`) - routet zu 7 spezialisierten Edge Functions
- ✅ **Auth Adapter Pattern** implementiert - `AuthClient` Interface mit `SupabaseAuthAdapter`
- ✅ **Zentraler HTTP Client** (`api-client.ts`) - alle Backend-Calls gehen über einen Layer
- ⚠️ **1 Legacy Supabase Client** (`utils/supabase/client.tsx`) - nur für Auth Adapter genutzt
- ✅ **KEINE direkten DB-Calls** im Frontend (alle über Edge Functions)
- ✅ **KEIN Storage** direkter Zugriff im Frontend
- ✅ **KEIN Realtime** direkter Zugriff im Frontend

**Gesamtscore:** **1/5** (fast vollständig entkoppelt)

---

## 2. Struktur-Check (API/BFF/Adapter)

### ✅ **BFF/API Layer vorhanden:**

```
/lib/
├── api-gateway.ts          ← 🎯 MAIN ROUTER - leitet zu Edge Functions
├── api-client.ts           ← 🌐 HTTP CLIENT - zentraler API Wrapper
├── auth/
│   ├── AuthClient.ts       ← 📋 INTERFACE - Provider-agnostic
│   ├── SupabaseAuthAdapter.ts ← 🔌 ADAPTER - Supabase Implementation
│   ├── getAuthClient.ts    ← 🏭 FACTORY - erstellt Auth Client
│   └── getAuthToken.ts     ← 🔑 HELPER - holt Access Token
└── api/
    ├── timeline-api-v2.ts  ← 📦 DOMAIN API (Timeline)
    ├── timeline-api.ts     ← 📦 DOMAIN API (Legacy)
    └── shots-api.ts        ← 📦 DOMAIN API (Shots)
```

### 🏗️ **Edge Functions (Backend):**

```
/supabase/functions/
├── scriptony-auth/         ← 🔐 Auth & User Management
├── scriptony-projects/     ← 📁 Projects & Organizations
├── scriptony-timeline-v2/  ← 🎬 Film Timeline (Nodes)
├── scriptony-worldbuilding/ ← 🌍 Worlds, Characters, Locations
├── scriptony-assistant/    ← 🤖 AI Chat, RAG, Tools
├── scriptony-gym/          ← 💪 Creative Gym
└── scriptony-superadmin/   ← 👑 System Stats & Admin
```

### 📊 **Ports/Interfaces:**

| Interface | Implementierung | Zweck |
|-----------|----------------|-------|
| `AuthClient` | `SupabaseAuthAdapter` | Auth-Entkopplung |
| `api-gateway` | Route Mapping zu Functions | Request Routing |
| `api-client` | HTTP Wrapper | Zentraler API Zugriff |

---

## 3. Direktverwendung von Supabase im Frontend

### ✅ **SEHR GUT:** Nur 1 Stelle mit Supabase SDK Import!

#### 📍 **Fundstellen:**

| Datei | Import | Verwendung | Kontext |
|-------|--------|------------|---------|
| `/utils/supabase/client.tsx` | `createClient` | **Singleton** für Auth Adapter | ⚠️ NUR für Auth |

#### 📋 **Code:**

```typescript
// /utils/supabase/client.tsx
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      supabaseConfig.url,
      supabaseConfig.publicAnonKey
    );
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
```

**✅ VERWENDUNG:**
- Wird **NUR** von `SupabaseAuthAdapter.ts` importiert
- **KEINE** direkten `supabase.from()` Calls im Frontend!
- **KEINE** direkten `supabase.storage` Calls!

#### 🔍 **Supabase Usage im Frontend:**

```typescript
// /lib/auth/SupabaseAuthAdapter.ts (EINZIGE VERWENDUNG!)
import { supabase } from "../../utils/supabase/client";

export class SupabaseAuthAdapter implements AuthClient {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    // ... mapping zu AuthSession
  }
  
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    });
    // ...
  }
  
  // ... weitere Auth-Methoden
}
```

**✅ PERFEKT:** Alle `supabase.auth.*` Calls sind **gekapselt** im Adapter!

---

## 4. Auth-Fluss & Session-Handling

### 🔐 **Auth Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React Components)                │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │          useAuth Hook (Context)                  │   │
│  │  - signIn(), signOut(), getSession()            │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │        getAuthClient() - Factory                 │   │
│  │  - Returns AuthClient instance                   │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │     AuthClient Interface (Port)                  │   │
│  │  - getSession()                                  │   │
│  │  - signInWithPassword()                          │   │
│  │  - signOut()                                     │   │
│  │  - onAuthStateChange()                           │   │
│  └─────────────────┬───────────────────────────────┘   │
│                    │                                     │
│  ┌─────────────────▼───────────────────────────────┐   │
│  │   SupabaseAuthAdapter (Implementation)           │   │
│  │  ← EINZIGE Stelle mit supabase.auth.*           │   │
│  └─────────────────┬───────────────────────────────┘   │
└────────────────────┼─────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   Supabase GoTrue (Auth)   │
        │   - JWT Management         │
        │   - Session Handling       │
        └────────────────────────────┘
```

### 🔑 **Session/JWT Handling:**

**Quelle:** Supabase GoTrue (Auth Service)

**JWT Claims Auswertung:**
- ❌ **NICHT** direkt im UI
- ✅ **NUR** im Auth Adapter (`SupabaseAuthAdapter.ts`)
- ✅ User Metadata wird über `AuthSession.raw` weitergegeben

**Code:**
```typescript
// /hooks/useAuth.tsx
const session = await getAuthClient().getSession();

if (session && session.raw) {
  const rawSession = session.raw as any;
  const metadata = rawSession?.user?.user_metadata || {};
  
  setUser({
    id: session.userId!,
    email: rawSession?.user?.email || "",
    name: metadata?.name || "User",
    role: metadata?.role || "user",  // ← JWT Claim
    avatar: metadata?.avatar,
  });
}
```

### 🌐 **Redirect URIs:**

```typescript
// OAuth Redirect
signInWithOAuth(provider: 'google' | 'github') {
  await getAuthClient().signInWithOAuth(provider, {
    redirectTo: window.location.origin  // ← Dynamic
  });
}

// Password Reset Redirect
resetPassword(email: string) {
  await getAuthClient().resetPasswordForEmail(
    email,
    `${window.location.origin}/reset-password`  // ← /reset-password
  );
}
```

### 🔐 **ENV Variablen (Auth):**

Verwendet in `/lib/env.ts`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 5. Storage-Nutzung

### ✅ **PERFEKT:** Kein direkter Storage-Zugriff im Frontend!

**Fundstellen:** **0** 

Alle Storage-Operationen laufen über **Edge Functions**:

```typescript
// /supabase/functions/scriptony-auth/index.ts
// Storage wird NUR im Backend verwendet

// Upload (Server-Side)
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, file);

// Signed URLs (Server-Side)
const { data } = await supabase.storage
  .from('avatars')
  .createSignedUrl(filePath, 3600);
```

**✅ Frontend bekommt nur Signed URLs vom Backend!**

---

## 6. Realtime-Nutzung

### ✅ **PERFEKT:** Kein Realtime im Frontend!

**Fundstellen:** **0**

Keine Verwendung von:
- `supabase.channel()`
- `subscribe()`
- `postgres_changes`
- Presence
- Broadcast

**Status:** Realtime ist aktuell **nicht implementiert**.

Wenn nötig, würde es **über WebSocket im Backend** laufen und Events via REST/SSE an Frontend senden.

---

## 7. SQL & Policies (RLS)

### 📁 **SQL Migrations:**

```
/supabase/migrations/
├── 001_initial_schema.sql              ← Organizations, Worlds, Projects
├── 002_ai_chat_system_FIXED.sql        ← AI Chat System
├── 003_add_openrouter_support.sql      ← OpenRouter Provider
├── 004_add_conversation_system_prompt.sql
├── 005_mcp_tool_system_FIXED.sql       ← MCP Tools
├── 006_cleanup_triggers.sql
├── 007_add_deepseek_provider.sql       ← DeepSeek Provider
├── 008_009_COMBINED.sql                ← Acts, Sequences, Scenes, Shots
├── 010_shot_enhancements.sql
├── 011_fix_rag_sync_queue.sql
├── 012_fix_rag_sync_queue_user_id.sql
├── 013_timeline_nodes.sql              ← Generic Timeline Nodes
└── 014_add_template_to_projects.sql
```

### 🔒 **RLS Policies:**

**Vendor-Neutral:** ✅ Standard PostgreSQL (keine Supabase-Sonderfeatures)

**Beispiel:**
```sql
-- /supabase/migrations/001_initial_schema.sql

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read projects in their organization
CREATE POLICY "Users can read organization projects"
ON projects FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()
  )
);
```

### 🧩 **Extensions:**

| Extension | Version | Verwendung |
|-----------|---------|------------|
| `uuid-ossp` | Standard | UUID Generation |
| `pgvector` | ❓ | ⚠️ Für RAG (nicht in Migrations sichtbar) |

**Fundstellen:**
```sql
-- 001_initial_schema.sql:7
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 8. ENV/Config

### 🔐 **Environment Variables:**

**Definiert in `/lib/env.ts`:**

```typescript
export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  publicAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};
```

**Verwendete ENV:**
- `VITE_SUPABASE_URL` ← Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` ← Public Anon Key (für Auth)

**Importiert von:**
- `/lib/api-client.ts` (Line 8)
- `/lib/api-gateway.ts` (indirekt via `info.tsx`)
- `/hooks/useAuth.tsx` (Line 2)
- `/utils/supabase/client.tsx` (Line 1)

**Backend ENV (Edge Functions):**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` ← Für Admin Operations
- `SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY` ← AI Provider
- `OPENAI_API_KEY` ← AI Provider
- `OPENROUTER_API_KEY` ← AI Provider
- `DEEPSEEK_API_KEY` ← AI Provider

---

## 9. Kopplungs-Scores (0–5)

| Domäne | Score | Begründung |
|--------|-------|------------|
| **DB** | **0/5** | ✅ **Perfekt:** Keine direkten DB-Calls im Frontend. Alle Queries über Edge Functions. |
| **Auth** | **1/5** | ✅ **Sehr gut:** Auth ist über `AuthClient` Interface entkoppelt. `SupabaseAuthAdapter` ist **die einzige** Stelle mit `supabase.auth.*` Zugriff. Einfach austauschbar gegen Auth0/Clerk. |
| **Storage** | **0/5** | ✅ **Perfekt:** Keine direkten Storage-Calls. Alle Uploads/Downloads über Edge Functions. Frontend bekommt nur Signed URLs. |
| **Realtime** | **0/5** | ✅ **Perfekt:** Nicht verwendet. Wenn nötig, würde es über Backend laufen. |
| **Edge Functions** | **1/5** | ✅ **Sehr gut:** API Gateway routet zu 7 spezialisierten Functions. Klar definierte API Routes. Könnte theoretisch zu anderem Backend migriert werden. |

**Gesamt:** **0.4/5** (aufgerundet **1/5**)

**✅ FAZIT:** Die Architektur ist **exzellent entkoppelt**!

---

## 10. Data-Flow-Diagramm

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as useAuth / Context
    participant Gateway as API Gateway
    participant Client as API Client
    participant Adapter as Auth Adapter
    participant EdgeFn as Edge Function
    participant Supabase as Supabase (DB/Auth)

    %% AUTH FLOW
    rect rgb(200, 220, 255)
        Note over UI,Supabase: 🔐 AUTH FLOW (via Adapter)
        UI->>Hook: signIn(email, password)
        Hook->>Adapter: getAuthClient().signInWithPassword()
        Adapter->>Supabase: supabase.auth.signInWithPassword()
        Supabase-->>Adapter: { session, user }
        Adapter-->>Hook: AuthSession (mapped)
        Hook-->>UI: User logged in
    end

    %% DATA FLOW
    rect rgb(200, 255, 220)
        Note over UI,Supabase: 📊 DATA FLOW (via Edge Functions)
        UI->>Client: apiClient.get('/projects')
        Client->>Gateway: Determine Edge Function
        Gateway->>Gateway: Route: /projects → scriptony-projects
        Gateway->>EdgeFn: GET https://.../scriptony-projects/projects
        EdgeFn->>Supabase: supabase.from('projects').select()
        Supabase-->>EdgeFn: [projects...]
        EdgeFn-->>Gateway: { data: [...] }
        Gateway-->>Client: Response
        Client-->>UI: Projects data
    end

    %% STORAGE FLOW
    rect rgb(255, 240, 200)
        Note over UI,Supabase: 📦 STORAGE FLOW (via Backend)
        UI->>Client: apiClient.post('/storage/upload')
        Client->>EdgeFn: POST .../scriptony-auth/storage
        EdgeFn->>Supabase: supabase.storage.upload()
        Supabase-->>EdgeFn: { path }
        EdgeFn->>Supabase: supabase.storage.createSignedUrl()
        Supabase-->>EdgeFn: { signedUrl }
        EdgeFn-->>Client: { url: signedUrl }
        Client-->>UI: Signed URL
    end

    %% DIRECT COUPLING (NONE!)
    rect rgb(255, 200, 200)
        Note over UI,Adapter: ⚠️ EINZIGE direkte Kopplung
        Note over Adapter: SupabaseAuthAdapter verwendet<br/>supabase.auth.* (gekapselt!)
    end
```

### 📊 **Legende:**

- 🔵 **Blau:** Auth Flow (über Adapter Pattern)
- 🟢 **Grün:** Data Flow (über Edge Functions & API Gateway)
- 🟡 **Gelb:** Storage Flow (über Edge Functions)
- 🔴 **Rot:** Direkte Kopplung (nur Auth Adapter)

---

## 11. Konkrete Empfehlungen

### ✅ **Quick Wins (1-2 Tage):** NICHT NÖTIG!

Die Architektur ist bereits **exzellent**. Keine Quick Wins erforderlich.

### 🔮 **Optional: Weitere Entkopplung (3-5 Tage)**

#### **Option 1: DB Client Abstraction Layer**

Falls man später von Supabase zu z.B. PlanetScale/Neon wechseln will:

```typescript
// /lib/db/DbClient.ts (NEU)
export interface DbClient {
  query<T>(table: string, filters?: Record<string, any>): Promise<T[]>;
  insert<T>(table: string, data: T): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T>;
  delete(table: string, id: string): Promise<void>;
}

// /lib/db/SupabaseDbAdapter.ts (NEU)
export class SupabaseDbAdapter implements DbClient {
  // Implementierung mit supabase.from()
}

// Edge Functions würden dann DbClient verwenden statt direkt supabase
```

**Betroffene Dateien:**
- Alle 7 Edge Functions (`/supabase/functions/*/index.ts`)
- Risiko: **MITTEL** (viele DB Calls umzuschreiben)
- Test: Jede Function einzeln testen

#### **Option 2: Storage Client Abstraction**

Falls man später zu AWS S3/Cloudflare R2 wechseln will:

```typescript
// /lib/storage/StorageClient.ts (NEU)
export interface StorageClient {
  upload(bucket: string, path: string, file: File): Promise<string>;
  getSignedUrl(bucket: string, path: string, expiresIn: number): Promise<string>;
  delete(bucket: string, path: string): Promise<void>;
}

// /lib/storage/SupabaseStorageAdapter.ts (NEU)
export class SupabaseStorageAdapter implements StorageClient {
  // Implementierung mit supabase.storage
}
```

**Betroffene Dateien:**
- `/supabase/functions/scriptony-auth/index.ts` (Storage Routes)
- Risiko: **NIEDRIG** (wenige Storage Calls)
- Test: Upload/Download/Delete testen

### 🌐 **Option 3: Multi-Provider Support (1-2 Wochen)**

Für komplette Provider-Unabhängigkeit:

1. **Auth0 Integration:**
   ```typescript
   // /lib/auth/Auth0Adapter.ts (NEU)
   export class Auth0Adapter implements AuthClient {
     // Implementierung mit @auth0/auth0-spa-js
   }
   ```

2. **Clerk Integration:**
   ```typescript
   // /lib/auth/ClerkAdapter.ts (NEU)
   export class ClerkAdapter implements AuthClient {
     // Implementierung mit @clerk/clerk-react
   }
   ```

3. **Factory Pattern erweitern:**
   ```typescript
   // /lib/auth/getAuthClient.ts
   export function getAuthClient(): AuthClient {
     const provider = import.meta.env.VITE_AUTH_PROVIDER || 'supabase';
     
     switch (provider) {
       case 'supabase': return new SupabaseAuthAdapter();
       case 'auth0': return new Auth0Adapter();
       case 'clerk': return new ClerkAdapter();
       default: throw new Error(`Unknown provider: ${provider}`);
     }
   }
   ```

**Betroffene Dateien:**
- `/lib/auth/getAuthClient.ts`
- Neue Adapter-Dateien
- Risiko: **NIEDRIG** (Auth bereits entkoppelt)
- Test: Login/Logout/Session mit jedem Provider

---

## 12. Dateiliste mit Fundstellen

### 📋 **Supabase SDK Verwendung:**

| Datei | Bereich | Supabase API | Client/Server | Zeilen |
|-------|---------|--------------|---------------|--------|
| `/utils/supabase/client.tsx` | Singleton | `createClient` | **Client** | 1, 9, 25 |
| `/lib/auth/SupabaseAuthAdapter.ts` | Auth | `supabase.auth.*` | **Client** | 8, 25, 34, 52, 63, 70, 77, 87 |
| `/components/timeline/TimelineView.tsx` | Helper | `getUserAccessToken` | **Client** | 4 |
| `/supabase/functions/server/kv_store.tsx` | DB | `supabase.from()` | **Server** | 23, 35, 45, 54, 63, 73, 82 |
| `/supabase/functions/server/index.tsx` | DB/Auth | `supabase.from()`, `supabase.auth.*` | **Server** | 25, 57, 95, 132, 137, 482 |
| `/supabase/functions/scriptony-*/index.ts` | DB/Auth | `supabase.from()`, `supabase.auth.*` | **Server** | (alle Functions) |

### 📊 **Zusammenfassung:**

**Frontend:**
- ✅ **1 Supabase Client** (Singleton für Auth)
- ✅ **1 Auth Adapter** (einzige Verwendung von `supabase.auth.*`)
- ✅ **0 direkte DB Calls**
- ✅ **0 direkte Storage Calls**
- ✅ **0 direkte Realtime Subscriptions**

**Backend (Edge Functions):**
- 🟢 **7 Edge Functions** mit direktem Supabase Zugriff (korrekt!)
- 🟢 Alle DB Queries server-side
- 🟢 Alle Auth Checks server-side
- 🟢 Alle Storage Operationen server-side

---

## 🎯 FAZIT

**Die Scriptony Architektur ist EXZELLENT entkoppelt!**

**Highlights:**
1. ✅ **BFF Pattern:** API Gateway + 7 spezialisierte Edge Functions
2. ✅ **Adapter Pattern:** Auth ist über Interface entkoppelt
3. ✅ **Zentrale API:** Alle Backend-Calls über `api-client.ts`
4. ✅ **Keine DB-Kopplung:** Frontend macht KEINE direkten DB-Queries
5. ✅ **Keine Storage-Kopplung:** Alle Uploads über Backend
6. ✅ **Maintainability:** Klare Separation of Concerns

**Migration zu anderem Backend:**
- **Auth:** ✅ Easy (nur Adapter austauschen)
- **DB:** ✅ Mittel (Edge Functions umschreiben)
- **Storage:** ✅ Easy (nur Storage-Routes anpassen)
- **Realtime:** ✅ N/A (nicht verwendet)

**Score: 1/5 Kopplung = 9/10 Architektur-Qualität** 🎉

---

**Stand:** 25. Oktober 2025  
**Nach:** Multi-Function Migration (Monolith → 7 Edge Functions)  
**Audit durchgeführt von:** AI Assistant  
**Nächster Review:** Bei größeren Architektur-Änderungen

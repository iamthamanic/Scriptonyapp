# 🛡️ Scriptony BFF System – README

**Welcome to Scriptony's Backend-for-Frontend (BFF) Enforcement System!**

---

## 🎯 Was ist das?

**Scriptony nutzt eine strikte 3-Tier BFF-Architektur mit automatischen ESLint Guards:**

```
Frontend (React)
    ↓
Auth Adapter + API Client + Storage Helper
    ↓
BFF Layer (Supabase Edge Functions)
    ↓
Supabase (Database, Auth, Storage)
```

**Das System erzwingt, dass ALLE neuen Features über das BFF laufen – automatisch!**

---

## 🚀 Quick Start (30 Sekunden)

### Du willst Daten laden?

```typescript
// ✅ RICHTIG
import { apiClient } from '@/lib/api-client';

const projects = await apiClient.get('/projects');
```

```typescript
// ❌ FALSCH (ESLint blockiert das!)
import { supabase } from '@/utils/supabase/client';
const { data } = await supabase.from('projects').select('*');
```

---

### Du willst Authentifizierung?

```typescript
// ✅ RICHTIG
import { getAuthClient } from '@/lib/auth/getAuthClient';

const session = await getAuthClient().signInWithPassword(email, password);
```

```typescript
// ❌ FALSCH (ESLint blockiert das!)
import { supabase } from '@/utils/supabase/client';
await supabase.auth.signInWithPassword({ email, password });
```

---

### Du willst Dateien hochladen?

```typescript
// ✅ RICHTIG
import { uploadImage } from '@/utils/storage';

const { url } = await uploadImage(file, userId, 'avatars');
```

```typescript
// ❌ FALSCH (ESLint blockiert das!)
import { supabase } from '@/utils/supabase/client';
await supabase.storage.from('avatars').upload('file.png', file);
```

---

## 📚 Dokumentation (nach Zielgruppe)

### 🆕 Neue Entwickler (Start here!)
👉 **[`/NEW_DEVELOPER_ONBOARDING.md`](/NEW_DEVELOPER_ONBOARDING.md)**
- 10-Minuten Onboarding
- Schritt-für-Schritt Guide
- Vollständiges Code-Beispiel

---

### 🚀 Alle Entwickler (Daily Reference)
👉 **[`/BFF_QUICK_REFERENCE.md`](/BFF_QUICK_REFERENCE.md)**
- TLDR Cheatsheet (2 Minuten)
- DO THIS vs NEVER DO THIS
- Schnellreferenz zum Pinnen

---

### 🧠 Senior Entwickler (Deep Dive)
👉 **[`/BFF_ENFORCEMENT_GUIDE.md`](/BFF_ENFORCEMENT_GUIDE.md)**
- Vollständiger Guide (20 Minuten)
- Alle ESLint Rules erklärt
- Migration bestehender Features
- Testing Strategien

---

### 🏗️ Architekten (Architecture Review)
👉 **[`/BFF_ARCHITECTURE.md`](/BFF_ARCHITECTURE.md)**
- Visual System Diagrams (ASCII Art)
- Auth/Database/Storage Flows
- Security Comparison
- Performance Benefits

---

### 🔐 Auth-Spezifisch
👉 **[`/lib/auth/README.md`](/lib/auth/README.md)**
- Auth Client API Reference
- Alle Methoden dokumentiert
- Testing mit Mock Adapter

---

### 🧪 Testing & QA
👉 **[`/test-bff-guards.md`](/test-bff-guards.md)**
- Verification Tests (4 Tests)
- Manual Smoke Tests
- Troubleshooting Guide

---

### 📊 Status & Monitoring
👉 **[`/BFF_SYSTEM_STATUS.md`](/BFF_SYSTEM_STATUS.md)**
- Live Status Check
- Production Logs Analyse
- Checkliste

---

### 📖 Complete Overview
👉 **[`/BFF_SYSTEM_COMPLETE.md`](/BFF_SYSTEM_COMPLETE.md)**
- Komplette Implementierung
- Alle 9 neuen Dateien
- Benefits & KPIs
- Deployment Checklist

---

## 🛡️ ESLint Guards (5 aktiv)

Das System blockiert automatisch:

| Was | Warum verboten | Nutze stattdessen |
|-----|----------------|-------------------|
| `supabase.auth.*` | Secrets im Frontend | `getAuthClient()` |
| `supabase.from()` | Keine Business Logic | `apiClient.get/post/put/delete()` |
| `supabase.storage.*` | Keine Validierung | `uploadImage()` / `getStorageUsage()` |
| `supabase.rpc()` | Custom Logic fehlt | Erstelle BFF Route |
| `import { supabase }` | Direkter Zugriff | Nutze Adapter/Client |

**Alle Guards zeigen hilfreiche Fehlermeldungen mit exakter Lösung!**

---

## ✅ Status: Production Ready

- ✅ **5 ESLint Guards aktiv** (blockieren Violations)
- ✅ **Frontend ist 100% clean** (keine direkten Supabase-Zugriffe)
- ✅ **Auth über Adapter** (`getAuthClient()`)
- ✅ **Database über API Client** (`apiClient`)
- ✅ **Storage über Helper** (`uploadImage()`)
- ✅ **8 Guides dokumentiert**
- ✅ **App läuft in Production**

**Beweis:** Check deine Browser Logs:
```
[API Client] Initializing GET request
[API SUCCESS] GET /projects: [...]
```

---

## 🔨 Neues Feature erstellen (3 Schritte)

### Schritt 1: Backend Route
```typescript
// /supabase/functions/server/routes-notes.tsx
app.get("/make-server-3b52693b/notes", async (c) => {
  const userId = await getUserId(c);
  const { data } = await supabase.from('notes').select('*').eq('user_id', userId);
  return c.json({ notes: data });
});
```

### Schritt 2: Route registrieren
```typescript
// /supabase/functions/server/index.tsx
import notesRoutes from './routes-notes.tsx';
app.route('/', notesRoutes);
```

### Schritt 3: Frontend Wrapper
```typescript
// /lib/api/notes-api.ts
import { apiClient } from '../api-client';

export async function getNotes() {
  return await apiClient.get('/notes');
}
```

**Fertig!** Frontend kann jetzt `getNotes()` nutzen – ESLint erzwingt BFF automatisch!

---

## 🎁 Benefits

### 1. Sicherheit
- ✅ Keine Secrets im Frontend
- ✅ User-ID aus Auth Token (kann nicht manipuliert werden)
- ✅ Business Logic im Backend

### 2. Austauschbarkeit
```typescript
// Heute: Supabase
_client = new SupabaseAuthAdapter();

// Morgen: Auth0 (nur 1 Zeile!)
_client = new Auth0Adapter();

// Frontend bleibt unverändert!
```

### 3. Testing
```typescript
// Mock Auth Client
_client = new MockAuthAdapter();

// Mock API Client
vi.mock('@/lib/api-client');

// Keine echte DB nötig!
```

### 4. Performance
- ✅ Caching im BFF möglich
- ✅ Response-Optimierung
- ✅ Batch-Requests

---

## 🧪 Teste es selbst!

**Erstelle eine Test-Datei:**
```typescript
// test.tsx
import { supabase } from './utils/supabase/client';

const data = await supabase.from('test').select();
```

**ESLint sollte sofort anzeigen:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.from()' ist verboten!
→ Nutze stattdessen: apiClient.get/post/put/delete()
📖 Siehe: /BFF_ENFORCEMENT_GUIDE.md
```

**Wenn du den Fehler siehst:** ✅ **System funktioniert!**

---

## 📊 Architektur-Übersicht

### Entry Points (Frontend)

| File | Beschreibung | Nutze für |
|------|-------------|-----------|
| `/lib/auth/getAuthClient.ts` | Auth Adapter | Login, Logout, Signup |
| `/lib/auth/getAuthToken.ts` | Token Helper | Token für API Calls |
| `/lib/api-client.ts` | Generic API Client | GET, POST, PUT, DELETE |
| `/utils/storage.tsx` | Storage Helper | File Upload/Download |

### BFF Routes (Backend)

| Route | File | Beschreibung |
|-------|------|-------------|
| `/projects` | `index-postgres.tsx` | Projects CRUD |
| `/worlds/*` | `routes-worlds.tsx` | Worldbuilding |
| `/characters/*` | `routes-characters.tsx` | Characters CRUD |
| `/episodes/*` | `routes-episodes.tsx` | Episodes CRUD |
| `/scenes/*` | `routes-scenes.tsx` | Scenes CRUD |
| `/acts/*` | `routes-acts.tsx` | Acts CRUD |
| `/sequences/*` | `routes-sequences.tsx` | Sequences CRUD |
| `/shots/*` | `routes-shots.tsx` | Shots CRUD |
| `/ai/chat/*` | `routes-ai-chat.tsx` | AI Chat System |

---

## 🐛 Troubleshooting

### ESLint zeigt keine Fehler

**Lösung:**
```
Cmd+Shift+P → "ESLint: Restart ESLint Server"
```

### "Cannot find module '@/lib/api-client'"

**Lösung:**
```typescript
// Nutze relative Imports:
import { apiClient } from '../../lib/api-client';
```

### 401 Unauthorized bei API Calls

**Lösung:**
```typescript
import { getAuthToken } from '@/lib/auth/getAuthToken';

const token = await getAuthToken();
console.log('Token:', token); // Should be JWT string

if (!token) {
  // User needs to login
}
```

---

## 🎓 Für neue Team-Mitglieder

### Tag 1: Onboarding (15 Minuten)
1. Lies `/NEW_DEVELOPER_ONBOARDING.md` (10 Min)
2. Lies `/BFF_QUICK_REFERENCE.md` (2 Min)
3. Teste ESLint Guards (siehe `/test-bff-guards.md`)

### Tag 2: Erstes Feature (30 Minuten)
1. Erstelle Backend Route
2. Registriere Route im Server
3. Erstelle Frontend Wrapper
4. Nutze im Frontend

**Nach 1 Tag kannst du produktiv arbeiten!** 🚀

---

## 📝 Checkliste für neue Features

- [ ] Backend Route erstellt (`/supabase/functions/server/routes-*.tsx`)
- [ ] Route registriert (`index.tsx`)
- [ ] Frontend Wrapper erstellt (`/lib/api/*-api.ts`)
- [ ] TypeScript Types definiert
- [ ] ESLint zeigt keine Violations
- [ ] Smoke Test durchgeführt

---

## 📚 Alle Docs

| Doc | Zielgruppe | Lesezeit |
|-----|-----------|----------|
| `/NEW_DEVELOPER_ONBOARDING.md` | Neue Devs | 10 Min |
| `/BFF_QUICK_REFERENCE.md` | Alle | 2 Min |
| `/BFF_ENFORCEMENT_GUIDE.md` | Senior Devs | 20 Min |
| `/BFF_ARCHITECTURE.md` | Architekten | 15 Min |
| `/lib/auth/README.md` | Frontend Devs | 10 Min |
| `/test-bff-guards.md` | QA | 5 Min |
| `/BFF_SYSTEM_STATUS.md` | Monitoring | 5 Min |
| `/BFF_SYSTEM_COMPLETE.md` | Management | 15 Min |

---

## ✅ Summary

**Scriptony hat ein production-ready BFF Enforcement System!**

✅ **Frontend → BFF → Supabase** (strikte 3-Tier Architektur)  
✅ **ESLint Guards erzwingen BFF** (automatisch)  
✅ **Kein direkter Supabase-Zugriff möglich** (blockiert)  
✅ **Neue Features MÜSSEN über BFF laufen** (by design)  
✅ **Vollständig dokumentiert** (8 Guides)  
✅ **Production-ready** (läuft bereits)

**Das System ist zukunftssicher!** 🛡️

---

## 🎉 Quick Links

- 🆕 **Start here:** [`/NEW_DEVELOPER_ONBOARDING.md`](/NEW_DEVELOPER_ONBOARDING.md)
- 📖 **Cheatsheet:** [`/BFF_QUICK_REFERENCE.md`](/BFF_QUICK_REFERENCE.md)
- 🧠 **Deep Dive:** [`/BFF_ENFORCEMENT_GUIDE.md`](/BFF_ENFORCEMENT_GUIDE.md)
- 🧪 **Tests:** [`/test-bff-guards.md`](/test-bff-guards.md)

---

**Fragen? Alle Guides sind dokumentiert!** 📚

**Happy Coding!** 💜

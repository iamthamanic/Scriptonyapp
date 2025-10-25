# 🔐 AUTH & ACCOUNT MANAGEMENT - ARCHITECTURE

## 🎯 WIE LÄUFT AUTH & ACCOUNT MANAGEMENT?

**KURZE ANTWORT:**
- **Auth (Login/Signup/Logout)** → **Supabase GoTrue** (Managed Service, KEINE Edge Function)
- **User Profile** → **Frontend direkt** (über Auth Adapter)
- **Organization Management** → **make-server-3b52693b** (Monolith, sollte zu `scriptony-auth`)

---

## 🏗️ AKTUELLE ARCHITEKTUR

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Components:                                                     │
│  - AuthPage.tsx          → Login/Signup UI                      │
│  - SettingsPage.tsx      → User Profile, Organization           │
│  - ResetPasswordPage.tsx → Password Reset                        │
│                                                                  │
│  Auth Client (Adapter Pattern):                                 │
│  - getAuthClient()       → Singleton                             │
│  - getAuthToken()        → Get Access Token                      │
│  - SupabaseAuthAdapter   → Current Implementation               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE GoTrue AUTH                           │
│                   (MANAGED SERVICE)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Built-in Features:                                              │
│  ✅ Sign Up (Email + Password)                                  │
│  ✅ Sign In (Email + Password)                                  │
│  ✅ Sign Out                                                     │
│  ✅ OAuth (Google, GitHub, etc.)                                │
│  ✅ Password Reset                                               │
│  ✅ Email Confirmation                                           │
│  ✅ Session Management                                           │
│  ✅ JWT Token Generation                                         │
│  ✅ 2FA (Optional)                                               │
│                                                                  │
│  KEIN Code von uns - komplett managed!                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: make-server-3b52693b                 │
│              (MONOLITH - sollte migriert werden)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Routes:                                                         │
│  POST /signup                                                    │
│    → supabase.auth.admin.createUser()                           │
│    → getOrCreateUserOrganization()                              │
│                                                                  │
│  POST /create-demo-user                                          │
│    → Hardcoded demo user creation                                │
│    → Organization creation                                       │
│                                                                  │
│  Helper Functions:                                               │
│  - getOrCreateUserOrganization(userId)                          │
│    → Check if user has organization                              │
│    → Create default organization if not                          │
│    → Add user to organization_members                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE TABLES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  auth.users (Supabase managed)                                   │
│    - id (UUID)                                                   │
│    - email                                                       │
│    - encrypted_password                                          │
│    - email_confirmed_at                                          │
│    - created_at                                                  │
│                                                                  │
│  public.users (Custom)                                           │
│    - id (FK to auth.users.id)                                    │
│    - name                                                        │
│    - organization_id                                             │
│    - avatar_url                                                  │
│    - created_at                                                  │
│                                                                  │
│  public.organizations                                            │
│    - id (UUID)                                                   │
│    - name                                                        │
│    - created_at                                                  │
│                                                                  │
│  public.organization_members                                     │
│    - organization_id                                             │
│    - user_id                                                     │
│    - role (owner, member, guest)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 AUTH FLOW (Login/Signup)

### **1. SIGNUP FLOW**

```typescript
// FRONTEND (AuthPage.tsx)
import { getAuthClient } from './lib/auth/getAuthClient';

// User clicks "Sign Up"
await getAuthClient().signInWithPassword(email, password);

↓

// AUTH CLIENT (SupabaseAuthAdapter)
// Calls Supabase GoTrue directly (NO Edge Function!)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

↓

// SUPABASE GoTrue (Managed Service)
// - Validates credentials
// - Creates JWT token
// - Returns session

↓

// BACKEND (make-server-3b52693b)
// ONLY IF user is created via /signup endpoint
POST /signup
  → supabase.auth.admin.createUser({ email, password })
  → getOrCreateUserOrganization(userId)
  → Create default organization

↓

// DATABASE
// - auth.users created (by GoTrue)
// - public.users created (by backend)
// - organizations created (by backend)
// - organization_members created (by backend)
```

### **2. LOGIN FLOW**

```typescript
// FRONTEND
await getAuthClient().signInWithPassword(email, password);

↓

// Supabase GoTrue (Managed)
// - Validates credentials
// - Returns JWT token
// - NO backend call needed!

↓

// FRONTEND
// - Store session
// - Redirect to dashboard
```

### **3. OAUTH FLOW (Google, GitHub, etc.)**

```typescript
// FRONTEND
await getAuthClient().signInWithOAuth('google');

↓

// Supabase GoTrue (Managed)
// - Redirects to Google
// - User logs in
// - Redirects back with token
// - NO backend call needed!

↓

// BACKEND (Optional)
// If first login → getOrCreateUserOrganization()
```

---

## 📊 VERGLEICH: WAS LÄUFT WO?

| Feature | Wo läuft es? | Edge Function? |
|---------|--------------|----------------|
| **Sign Up** | Supabase GoTrue | ❌ Managed Service |
| **Sign In** | Supabase GoTrue | ❌ Managed Service |
| **Sign Out** | Supabase GoTrue | ❌ Managed Service |
| **OAuth (Google, etc.)** | Supabase GoTrue | ❌ Managed Service |
| **Password Reset** | Supabase GoTrue | ❌ Managed Service |
| **Email Confirmation** | Supabase GoTrue | ❌ Managed Service |
| **Session Management** | Supabase GoTrue | ❌ Managed Service |
| **JWT Token** | Supabase GoTrue | ❌ Managed Service |
| | | |
| **User Registration (custom)** | make-server-3b52693b | ✅ `/signup` |
| **Organization Creation** | make-server-3b52693b | ✅ `getOrCreateUserOrganization()` |
| **Demo User Creation** | make-server-3b52693b | ✅ `/create-demo-user` |
| | | |
| **User Profile Update** | Frontend direkt | ❌ Via Auth Client |
| **Organization Management** | make-server-3b52693b | ✅ Sollte migriert werden! |

---

## 🤔 SOLLTE ACCOUNT MANAGEMENT EINE EIGENE EDGE FUNCTION BEKOMMEN?

### **JA! EMPFEHLUNG:**

```
📦 scriptony-auth (NEUE Edge Function)

Routes:
  POST   /signup                    → Custom user registration
  POST   /create-demo-user          → Demo user
  
  GET    /profile                   → Get user profile
  PUT    /profile                   → Update user profile
  
  GET    /organizations             → Get user's organizations
  POST   /organizations             → Create organization
  PUT    /organizations/:id         → Update organization
  DELETE /organizations/:id         → Delete organization
  
  GET    /organizations/:id/members → List members
  POST   /organizations/:id/members → Invite member
  DELETE /organizations/:id/members/:user_id → Remove member
  
  POST   /avatar-upload             → Upload profile picture
```

---

## 🎯 WANN BRAUCHT AUTH EINE EIGENE EDGE FUNCTION?

### **✅ EIGENE FUNCTION wenn:**
1. **Custom User Registration** (Organization creation, etc.)
2. **Organization Management** (CRUD, Members)
3. **Profile Management** (Update, Avatar upload)
4. **Team Management** (Invites, Roles)
5. **Subscription Management** (Billing, Plans)

### **❌ KEINE EIGENE FUNCTION wenn:**
- Nur basic Auth (Login/Logout) → Supabase GoTrue reicht!
- Keine Organizations
- Keine Teams
- Keine Custom User Data

**BEI SCRIPTONY: JA, braucht eigene Function!** ✅

---

## 🚀 MIGRATION PLAN

### **Phase 1: Erstelle scriptony-auth Function**

```typescript
// /supabase/functions/scriptony-auth/index.ts

import { Hono } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// SIGNUP
app.post("/signup", async (c) => {
  const { email, password, name } = await c.req.json();
  
  // Create auth user
  const { data: { user } } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  
  // Create organization
  const orgId = await createOrganization(user.id, `${name}'s Organization`);
  
  // Create user profile
  await supabase.from("users").insert({
    id: user.id,
    name,
    organization_id: orgId,
  });
  
  return c.json({ success: true, user_id: user.id });
});

// PROFILE
app.get("/profile", async (c) => {
  const userId = await getUserFromAuth(c.req.header("Authorization"));
  
  const { data } = await supabase
    .from("users")
    .select("*, organizations(*)")
    .eq("id", userId)
    .single();
  
  return c.json({ profile: data });
});

app.put("/profile", async (c) => {
  const userId = await getUserFromAuth(c.req.header("Authorization"));
  const updates = await c.req.json();
  
  await supabase
    .from("users")
    .update(updates)
    .eq("id", userId);
  
  return c.json({ success: true });
});

// ORGANIZATIONS
app.get("/organizations", async (c) => {
  const userId = await getUserFromAuth(c.req.header("Authorization"));
  
  const { data } = await supabase
    .from("organization_members")
    .select("organizations(*)")
    .eq("user_id", userId);
  
  return c.json({ organizations: data });
});

// ... more routes

Deno.serve(app.fetch);
```

### **Phase 2: Update API Gateway**

```typescript
// /lib/api-gateway.ts

export const EDGE_FUNCTIONS = {
  // ... existing
  AUTH: 'scriptony-auth',
} as const;

const ROUTE_MAP: Record<string, string> = {
  // ... existing
  '/signup': EDGE_FUNCTIONS.AUTH,
  '/profile': EDGE_FUNCTIONS.AUTH,
  '/organizations': EDGE_FUNCTIONS.AUTH,
};
```

### **Phase 3: Update Frontend**

```typescript
// VORHER (direkt zu Supabase)
const { data } = await supabase.from("users").select("*");

// NACHHER (via API Gateway)
import { apiGet } from './lib/api-gateway';
const { profile } = await apiGet('/profile', token);
```

---

## 📋 ZUSAMMENFASSUNG

### **AKTUELL:**
```
✅ Auth (Login/Signup/Logout) → Supabase GoTrue (Managed)
✅ Session Management → Supabase GoTrue (Managed)
✅ User Profile Updates → Frontend direkt (Auth Adapter)
⚠️ Organization Management → make-server-3b52693b (Monolith)
⚠️ Custom Signup → make-server-3b52693b (Monolith)
```

### **EMPFOHLEN:**
```
✅ Auth (Login/Signup/Logout) → Supabase GoTrue (Managed)
✅ Session Management → Supabase GoTrue (Managed)
✅ User Profile → scriptony-auth (Neue Edge Function)
✅ Organization Management → scriptony-auth (Neue Edge Function)
✅ Custom Signup → scriptony-auth (Neue Edge Function)
```

---

## 🎯 VORTEILE DER MIGRATION

### **1. Klarheit**
```
Auth & Account Management = scriptony-auth
Projects = scriptony-projects
Timeline = scriptony-timeline-v2
etc.
```

### **2. Unabhängigkeit**
```
Organization Update deployen?
→ Nur scriptony-auth!
→ Timeline läuft weiter ✅
```

### **3. Skalierbarkeit**
```
Team Features hinzufügen?
→ Alles in scriptony-auth
→ Keine Vermischung mit Projects/Timeline
```

---

## 🤔 SOLL ICH DIR scriptony-auth ERSTELLEN?

Wenn ja, bekommst du:
- ✅ Complete Auth Edge Function
- ✅ Profile Management
- ✅ Organization CRUD
- ✅ Team Management (Invites, Roles)
- ✅ Avatar Upload
- ✅ API Gateway Integration
- ✅ Deploy Guide

**Soll ich starten?** 🚀

---

## 📚 WICHTIGE UNTERSCHEIDUNG

### **Supabase GoTrue** (MANAGED - kein Code von uns)
- Login/Logout
- Password Reset
- Email Confirmation
- OAuth
- Session Management
- JWT Tokens

### **scriptony-auth** (CUSTOM - unser Code)
- Organization Creation
- User Profile (extended)
- Team Management
- Invites
- Roles & Permissions
- Custom Signup Flow

**Beide arbeiten zusammen!** ✅

---

**Fragen? Soll ich dir scriptony-auth bauen?** 🎯

# Auth Client – Usage Guide

## 📚 Overview

This directory contains the **Auth Adapter Pattern** implementation for Scriptony.  
It provides a **provider-agnostic interface** for authentication that can work with Supabase, Auth0, Clerk, or any custom auth solution.

---

## 🎯 Quick Start

### Get Auth Token (Most Common)

```typescript
import { getAuthToken } from '@/lib/auth/getAuthToken';

// In API calls
const token = await getAuthToken();
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Use Auth Client Directly

```typescript
import { getAuthClient } from '@/lib/auth/getAuthClient';

// Sign in
const session = await getAuthClient().signInWithPassword(email, password);

// Sign out
await getAuthClient().signOut();

// Update user
await getAuthClient().updateUser({ data: { name: 'New Name' } });

// Listen for auth changes
const unsubscribe = getAuthClient().onAuthStateChange((session) => {
  if (session) {
    console.log('User signed in:', session.userId);
  } else {
    console.log('User signed out');
  }
});
```

---

## 📁 File Structure

```
lib/auth/
├── AuthClient.ts              # Interface definition
├── SupabaseAuthAdapter.ts     # Supabase implementation
├── getAuthClient.ts           # Factory (Singleton)
├── getAuthToken.ts            # Token helper
└── README.md                  # This file
```

---

## 🔧 Architecture

```
Frontend Components
       ↓
   getAuthToken() / getAuthClient()
       ↓
   AuthClient Interface
       ↓
   SupabaseAuthAdapter (current)
       ↓
   Supabase GoTrue
```

**Future:**
```
AuthClient Interface
    ↓
    ├── SupabaseAuthAdapter
    ├── Auth0Adapter
    ├── ClerkAdapter
    └── CustomAuthAdapter
```

---

## 📖 API Reference

### `getAuthToken()`

**Purpose:** Get the current user's access token.  
**Returns:** `Promise<string | null>`  
**Usage:**

```typescript
import { getAuthToken } from '@/lib/auth/getAuthToken';

const token = await getAuthToken();
if (token) {
  // User is authenticated
  console.log('Token:', token);
} else {
  // User is not authenticated
  console.log('No token');
}
```

---

### `getAuthClient()`

**Purpose:** Get the auth client singleton.  
**Returns:** `AuthClient`  
**Usage:**

```typescript
import { getAuthClient } from '@/lib/auth/getAuthClient';

const authClient = getAuthClient();
```

---

### `AuthClient` Interface

#### `getSession()`
```typescript
async getSession(): Promise<AuthSession | null>
```
Get the current session (includes token and userId).

#### `signInWithPassword(email, password)`
```typescript
async signInWithPassword(email: string, password: string): Promise<AuthSession>
```
Sign in with email and password.

#### `signInWithOAuth(provider, options?)`
```typescript
async signInWithOAuth(provider: string, options?: Record<string, any>): Promise<void>
```
Sign in with OAuth (Google, GitHub, etc.). Redirects to provider.

#### `signOut()`
```typescript
async signOut(): Promise<void>
```
Sign out the current user.

#### `updateUser(patch)`
```typescript
async updateUser(patch: Record<string, any>): Promise<void>
```
Update user metadata or password.

**Example:**
```typescript
await getAuthClient().updateUser({
  data: { name: 'New Name' },
  password: 'newpassword',
});
```

#### `resetPasswordForEmail(email, redirectTo?)`
```typescript
async resetPasswordForEmail(email: string, redirectTo?: string): Promise<void>
```
Send password reset email.

**Example:**
```typescript
await getAuthClient().resetPasswordForEmail(
  'user@example.com',
  'https://app.com/reset-password'
);
```

#### `onAuthStateChange(callback)`
```typescript
onAuthStateChange(cb: (session: AuthSession | null) => void): () => void
```
Listen for auth state changes. Returns unsubscribe function.

**Example:**
```typescript
const unsubscribe = getAuthClient().onAuthStateChange((session) => {
  if (session) {
    console.log('Signed in:', session.userId);
  } else {
    console.log('Signed out');
  }
});

// Later:
unsubscribe();
```

---

### `AuthSession` Type

```typescript
interface AuthSession {
  accessToken: string | null;
  userId: string | null;
  raw?: unknown; // Provider-specific session data
}
```

---

## 🚫 Anti-Patterns

### ❌ DON'T: Direct Supabase Auth Access

```typescript
// ❌ FORBIDDEN
import { supabase } from '@/utils/supabase/client';
const { data } = await supabase.auth.getSession();
```

**ESLint will block this!**

### ✅ DO: Use Auth Client

```typescript
// ✅ CORRECT
import { getAuthToken } from '@/lib/auth/getAuthToken';
const token = await getAuthToken();
```

---

## 🧪 Testing

### Mock Auth Client

```typescript
import { AuthClient, AuthSession } from '@/lib/auth/AuthClient';

class MockAuthAdapter implements AuthClient {
  async getSession(): Promise<AuthSession | null> {
    return { accessToken: 'mock-token', userId: 'mock-user-id' };
  }
  
  async signInWithPassword(email: string, password: string): Promise<AuthSession> {
    return { accessToken: 'mock-token', userId: 'mock-user-id' };
  }
  
  async signInWithOAuth(provider: string): Promise<void> {
    // No-op for tests
  }
  
  async signOut(): Promise<void> {
    // No-op for tests
  }
  
  async updateUser(patch: Record<string, any>): Promise<void> {
    // No-op for tests
  }
  
  async resetPasswordForEmail(email: string, redirectTo?: string): Promise<void> {
    // No-op for tests
  }
  
  onAuthStateChange(cb: (session: AuthSession | null) => void): () => void {
    return () => {}; // No-op unsubscribe
  }
}
```

**Usage in Tests:**
```typescript
import { resetAuthClient } from '@/lib/auth/getAuthClient';

// Before test
resetAuthClient();
_client = new MockAuthAdapter();

// Run tests
// ...

// After test
resetAuthClient();
```

---

## 🔄 Migration from Old Code

### Before (Old)
```typescript
import { supabase } from '@/utils/supabase/client';

// Get token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Sign out
await supabase.auth.signOut();
```

### After (New)
```typescript
import { getAuthClient } from '@/lib/auth/getAuthClient';
import { getAuthToken } from '@/lib/auth/getAuthToken';

// Get token
const token = await getAuthToken();

// Sign in
await getAuthClient().signInWithPassword(email, password);

// Sign out
await getAuthClient().signOut();
```

---

## 🚀 Future: Multi-Provider Support

### ENV Configuration (Planned)

```bash
# .env
NEXT_PUBLIC_AUTH_PROVIDER=supabase  # or 'auth0', 'clerk'
```

### Implementation (Planned)

```typescript
// lib/auth/getAuthClient.ts
const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'supabase';

switch (provider) {
  case 'auth0':
    _client = new Auth0Adapter();
    break;
  case 'clerk':
    _client = new ClerkAdapter();
    break;
  default:
    _client = new SupabaseAuthAdapter();
}
```

---

## 📝 Notes

- **Singleton Pattern:** `getAuthClient()` returns the same instance across the app
- **Token Caching:** Tokens are cached by the provider (Supabase handles this)
- **ESLint Guard:** Prevents direct `supabase.auth.*` access in frontend code
- **Backend Exception:** Backend routes (`supabase/functions/**`) CAN use `supabase.auth.*` directly

---

## ✅ Best Practices

1. **Always use `getAuthToken()`** for API calls
2. **Use `getAuthClient()`** for auth operations (login, logout, etc.)
3. **Never import `supabase` directly** for auth in frontend code
4. **Handle errors** from auth operations (they throw on failure)
5. **Unsubscribe** from `onAuthStateChange` when component unmounts

---

**Questions?** See `/AUTH_ADAPTER_REFACTOR_COMPLETE.md` for full documentation.

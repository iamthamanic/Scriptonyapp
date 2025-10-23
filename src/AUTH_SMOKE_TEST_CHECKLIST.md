# 🧪 Auth Adapter – Smoke Test Checklist

**Run these tests to verify the auth adapter refactor works correctly.**

---

## ✅ Pre-Deployment Checklist

### 1. File Verification

- [ ] `/lib/auth/AuthClient.ts` exists
- [ ] `/lib/auth/SupabaseAuthAdapter.ts` exists
- [ ] `/lib/auth/getAuthClient.ts` exists
- [ ] `/lib/auth/getAuthToken.ts` exists
- [ ] `/.eslintrc.json` exists

### 2. No Direct Supabase Auth Access (Frontend Only)

Run this command:
```bash
rg -n "supabase\.auth\." --glob "**/*.{ts,tsx}" \
  --glob "!supabase/functions/**" \
  --glob "!lib/auth/SupabaseAuthAdapter.ts"
```

**Expected Result:** No matches (or only comments)

---

## 🔐 Auth Flow Tests

### Test 1: Login with Email/Password

**Steps:**
1. Open app in browser
2. Go to login page
3. Enter email: `iamthamanic@gmail.com`
4. Enter password: `123456`
5. Click "Sign In"

**Expected:**
- [ ] Login succeeds
- [ ] User is redirected to home/dashboard
- [ ] User name appears in navigation
- [ ] No console errors related to auth

**Debug:**
```javascript
// Open console and run:
const token = await getAuthToken();
console.log('Token:', token);
// Should print a JWT token
```

---

### Test 2: Logout

**Steps:**
1. Ensure you're logged in
2. Click "Logout" / "Sign Out"

**Expected:**
- [ ] User is signed out
- [ ] Redirected to login page
- [ ] Navigation shows "Login" button
- [ ] No console errors

**Debug:**
```javascript
// After logout, run:
const token = await getAuthToken();
console.log('Token:', token);
// Should print: null
```

---

### Test 3: OAuth Sign In (Google)

**Steps:**
1. Go to login page
2. Click "Sign in with Google"

**Expected:**
- [ ] Redirects to Google OAuth
- [ ] After auth, returns to app
- [ ] User is logged in
- [ ] No console errors

**Note:** Requires Google OAuth to be configured in Supabase Dashboard.

---

### Test 4: Password Reset

**Steps:**
1. Go to login page
2. Click "Forgot Password"
3. Enter email: `iamthamanic@gmail.com`
4. Click "Send Reset Email"

**Expected:**
- [ ] Success message appears
- [ ] Email is sent (check inbox)
- [ ] Reset link works
- [ ] No console errors

---

### Test 5: Profile Update

**Steps:**
1. Login
2. Go to Settings/Profile page
3. Change name to "Test User Updated"
4. Click "Save"

**Expected:**
- [ ] Profile updates successfully
- [ ] Name changes in navigation
- [ ] No console errors

**Debug:**
```javascript
// In console:
import { getAuthClient } from '@/lib/auth/getAuthClient';
const session = await getAuthClient().getSession();
console.log('User metadata:', session?.raw?.user?.user_metadata);
// Should show updated name
```

---

## 🌐 API Integration Tests

### Test 6: API Client (Projects)

**Steps:**
1. Login
2. Go to Projects page
3. Open Network tab in DevTools
4. Reload page

**Expected:**
- [ ] Projects load successfully
- [ ] Network request has `Authorization: Bearer <token>` header
- [ ] Token is valid (not null or "undefined")
- [ ] No 401 Unauthorized errors

**Debug:**
```javascript
// In console:
import { getAuthToken } from '@/lib/auth/getAuthToken';
const token = await getAuthToken();
console.log('Token length:', token?.length);
// Should be > 100 characters
```

---

### Test 7: Storage Upload

**Steps:**
1. Login
2. Go to Upload/Profile page
3. Upload an avatar image

**Expected:**
- [ ] Upload succeeds
- [ ] Image appears
- [ ] Network request has `Authorization: Bearer <token>`
- [ ] No console errors

---

### Test 8: Timeline API

**Steps:**
1. Login
2. Go to Film Timeline page
3. Create a new Act/Scene/Shot

**Expected:**
- [ ] CRUD operations work
- [ ] All API requests include auth token
- [ ] No 401 errors
- [ ] No console errors

---

## 🛡️ ESLint Guard Tests

### Test 9: ESLint Prevents Direct Auth Access

**Steps:**
1. Create a new file: `/test-auth-violation.tsx`
2. Add this code:
```typescript
import { supabase } from './utils/supabase/client';

export async function testViolation() {
  const { data } = await supabase.auth.getSession();
  return data;
}
```
3. Run ESLint

**Expected:**
- [ ] ESLint shows error
- [ ] Error message mentions "use getAuthClient() or getAuthToken()"

**Cleanup:**
```bash
rm /test-auth-violation.tsx
```

---

## 🔄 Auth State Change Tests

### Test 10: onAuthStateChange Listener

**Steps:**
1. Open app
2. Open DevTools Console
3. Login

**Expected:**
- [ ] Console log: "Auth state changed: SIGNED_IN" or similar
- [ ] User state updates immediately
- [ ] No duplicate state updates

**Debug:**
Add this to a component:
```typescript
useEffect(() => {
  const unsubscribe = getAuthClient().onAuthStateChange((session) => {
    console.log('🔔 Auth changed:', session ? 'SIGNED_IN' : 'SIGNED_OUT');
  });
  return unsubscribe;
}, []);
```

---

## 📊 Performance Tests

### Test 11: Token Caching

**Steps:**
1. Login
2. Open Console
3. Run multiple times:
```javascript
console.time('getToken');
const token = await getAuthToken();
console.timeEnd('getToken');
```

**Expected:**
- [ ] First call: ~50-200ms
- [ ] Subsequent calls: <10ms (cached by Supabase)

---

## 🚨 Error Handling Tests

### Test 12: Invalid Credentials

**Steps:**
1. Try to login with:
   - Email: `wrong@example.com`
   - Password: `wrongpassword`

**Expected:**
- [ ] Error message appears
- [ ] Error is caught and displayed
- [ ] No uncaught exceptions in console

---

### Test 13: Expired Token

**Steps:**
1. Login
2. Wait 1 hour (or manually expire token in Supabase)
3. Make an API request

**Expected:**
- [ ] Token refresh is triggered automatically
- [ ] OR user is redirected to login
- [ ] No uncaught errors

---

## 🔬 Unit Test Examples (Optional)

### Test 14: Mock Auth Adapter

```typescript
import { AuthClient, AuthSession } from '@/lib/auth/AuthClient';

class MockAuthAdapter implements AuthClient {
  async getSession(): Promise<AuthSession | null> {
    return { accessToken: 'mock-token', userId: 'mock-id' };
  }
  // ... implement other methods
}

// Use in tests
test('API client uses auth token', async () => {
  const token = await getAuthToken();
  expect(token).toBe('mock-token');
});
```

---

## ✅ Final Verification

### All Tests Passing?

- [ ] All login/logout flows work
- [ ] All API calls include auth tokens
- [ ] Profile updates work
- [ ] Password reset works
- [ ] OAuth (if configured) works
- [ ] ESLint blocks direct supabase.auth access
- [ ] No console errors during normal usage
- [ ] No 401 Unauthorized errors (except for invalid creds)

---

## 🐛 Troubleshooting

### Problem: "getAuthToken is not a function"

**Solution:**
```typescript
// Make sure you import correctly:
import { getAuthToken } from '@/lib/auth/getAuthToken';
// NOT from './lib/auth/getAuthToken' (wrong path)
```

---

### Problem: ESLint not blocking direct auth access

**Solution:**
1. Check `.eslintrc.json` exists
2. Restart ESLint server
3. Check file is not in `excludedFiles`

---

### Problem: Token is always null

**Solution:**
```typescript
// Debug in console:
import { getAuthClient } from '@/lib/auth/getAuthClient';
const session = await getAuthClient().getSession();
console.log('Session:', session);
// If null, user is not logged in
```

---

### Problem: 401 Unauthorized on API calls

**Solution:**
```typescript
// Check token is being sent:
const token = await getAuthToken();
console.log('Token:', token);

// Check API client is using token:
// In lib/api-client.ts, add:
console.log('Sending request with token:', token?.substring(0, 20));
```

---

## 🎉 Success Criteria

**Auth adapter refactor is successful if:**

✅ All smoke tests pass  
✅ No breaking changes to existing auth flows  
✅ ESLint prevents new direct supabase.auth usage  
✅ Token is correctly passed to all API calls  
✅ No console errors in production build  

---

**Ready for Production!** 🚀

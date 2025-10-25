# 🧪 BFF Guards – Verification Test

**Nutze diesen Guide um zu testen, ob die ESLint Guards aktiv sind.**

---

## ✅ Test 1: Direkter Supabase Import

**Erstelle eine temporäre Test-Datei:**

```typescript
// test-guards.tsx
import { supabase } from './utils/supabase/client';

export async function testFunction() {
  const { data } = await supabase.from('projects').select('*');
  return data;
}
```

**Erwartetes Ergebnis:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.from()' ist verboten!
→ Nutze stattdessen:
  • apiClient.get/post/put/delete() aus '@/lib/api-client'
```

**Wenn du den Fehler siehst:** ✅ **Guard funktioniert!**

---

## ✅ Test 2: Auth Zugriff

```typescript
// test-auth.tsx
import { supabase } from './utils/supabase/client';

export async function testAuth() {
  const session = await supabase.auth.getSession();
  return session;
}
```

**Erwartetes Ergebnis:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.auth' ist verboten!
→ Nutze stattdessen:
  • getAuthClient() aus '@/lib/auth/getAuthClient'
```

**Wenn du den Fehler siehst:** ✅ **Guard funktioniert!**

---

## ✅ Test 3: Storage Zugriff

```typescript
// test-storage.tsx
import { supabase } from './utils/supabase/client';

export async function testStorage(file: File) {
  const { data } = await supabase.storage.from('avatars').upload('test.png', file);
  return data;
}
```

**Erwartetes Ergebnis:**
```
❌ BFF VIOLATION: Direkter Zugriff auf 'supabase.storage' ist verboten!
→ Nutze stattdessen:
  • uploadImage() aus '@/utils/storage'
```

**Wenn du den Fehler siehst:** ✅ **Guard funktioniert!**

---

## ✅ Test 4: Richtige Nutzung (sollte funktionieren)

```typescript
// test-correct.tsx
import { apiClient } from './lib/api-client';
import { getAuthClient } from './lib/auth/getAuthClient';
import { uploadImage } from './utils/storage';

export async function testCorrect() {
  // ✅ Database
  const projects = await apiClient.get('/projects');
  
  // ✅ Auth
  const session = await getAuthClient().signInWithPassword('test@test.com', 'password');
  
  // ✅ Storage
  const file = new File(['test'], 'test.png');
  const { url } = await uploadImage(file, 'user-123', 'avatars');
  
  return { projects, session, url };
}
```

**Erwartetes Ergebnis:**
```
✅ Keine ESLint-Fehler!
```

**Wenn kein Fehler erscheint:** ✅ **Richtige Patterns funktionieren!**

---

## 🔍 Manual Verification

### 1. Check ESLint Config existiert

```bash
ls -la .eslintrc.json
```

**Erwartung:** File existiert

---

### 2. Check Frontend ist clean

```bash
# Search für direkte Supabase-Zugriffe im Frontend
grep -r "supabase\.from\|supabase\.auth\|supabase\.storage" \
  components/ lib/ hooks/ utils/ \
  --exclude-dir=supabase \
  --include="*.tsx" \
  --include="*.ts"
```

**Erwartung:** Nur erlaubte Matches:
- `lib/auth/SupabaseAuthAdapter.ts` (Auth Adapter)
- `utils/supabase/client.tsx` (Client Factory)

---

### 3. Check ESLint läuft

**In deinem Editor (VS Code):**
1. Öffne eine `.tsx` Datei
2. Schreibe: `import { supabase } from './utils/supabase/client'`
3. Schau ob eine rote Wellenlinie erscheint

**Erwartung:** ✅ **Rote Wellenlinie + Fehlermeldung**

---

### 4. Check Production Logs

**In deinen Browser Logs:**
```
[API Client] Initializing GET request
[API] Starting GET /projects
[API SUCCESS] GET /projects: [...]
```

**Erwartung:** ✅ **Frontend nutzt API Client, nicht direkt Supabase**

---

## 📊 Ergebnis-Matrix

| Test | Sollte | Ist | Status |
|------|--------|-----|--------|
| Test 1 (supabase.from) | ❌ Error | ? | ? |
| Test 2 (supabase.auth) | ❌ Error | ? | ? |
| Test 3 (supabase.storage) | ❌ Error | ? | ? |
| Test 4 (correct usage) | ✅ Pass | ? | ? |
| ESLint Config | ✅ Exists | ? | ? |
| Frontend Clean | ✅ 0 Violations | ? | ? |
| Production Logs | ✅ API Client | ? | ? |

**Wenn alle Tests ✅ sind:** **BFF System funktioniert perfekt!** 🎉

---

## 🐛 Troubleshooting

### Problem: ESLint zeigt keine Fehler

**Lösung 1:** ESLint Server neu starten
```
Cmd+Shift+P → "ESLint: Restart ESLint Server"
```

**Lösung 2:** Check `.eslintrc.json` ist korrekt
```bash
cat .eslintrc.json | grep "no-restricted-syntax"
```

**Sollte enthalten:** `no-restricted-syntax` mit 4 Selektoren

---

### Problem: ESLint zeigt Fehler in erlaubten Dateien

**Lösung:** Check `excludedFiles` in `.eslintrc.json`:
```json
"excludedFiles": [
  "lib/auth/**",
  "utils/supabase/client.tsx",
  "supabase/functions/**"
]
```

Diese Dateien **dürfen** direkten Supabase-Zugriff haben!

---

### Problem: Production verwendet noch direkten Supabase-Zugriff

**Lösung:** Check deine Logs:
```javascript
console.log('Logs should show:');
console.log('[API Client] Initializing GET request');

// NOT:
console.log('[Supabase] Direct query');
```

Wenn direkte Queries erscheinen → Refactor noch nicht deployed.

---

## ✅ Smoke Test Checklist

Manueller Test im Browser:

- [ ] Login funktioniert (via `getAuthClient()`)
- [ ] Projects laden (via `apiClient.get()`)
- [ ] File Upload funktioniert (via `uploadImage()`)
- [ ] Keine Console Errors
- [ ] Browser Logs zeigen `[API Client]` Meldungen
- [ ] ESLint zeigt Fehler bei falschem Code (Test 1-3)
- [ ] ESLint zeigt KEINE Fehler bei richtigem Code (Test 4)

**Wenn alle ✅:** **System ist production-ready!** 🚀

---

**Questions?** See `/BFF_ENFORCEMENT_GUIDE.md` or `/BFF_QUICK_REFERENCE.md`

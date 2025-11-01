# 🔧 FIX: Authorization Header Problem

## 🚨 PROBLEM

```
{"code":401,"message":"Missing authorization header"}
```

Supabase Edge Functions erwarten standardmäßig einen Authorization Header!

---

## ✅ LÖSUNG

### **Option 1: Test mit ANON_KEY (SCHNELLSTE!)**

```javascript
// Im Browser Console:
fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-auth/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0a291enRhc3R5aXJqeXdpZHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc0MjExNzgsImV4cCI6MjA0Mjk5NzE3OH0.Q8xUbNDwp5JdEf6vJw4gQ4xXFAC1GHxYNE-VCovxdPc'
  }
})
  .then(r => r.json())
  .then(data => console.log('Health Check:', data))
  .catch(err => console.error('Error:', err));
```

**WICHTIG:** Das ist dein `publicAnonKey` aus `/utils/supabase/info.tsx`!

---

### **Option 2: Supabase Dashboard Einstellung ändern**

1. **Dashboard öffnen:**
   ```
   https://supabase.com/dashboard/project/ctkouztastyirjywiduc
   ```

2. **Edge Functions → scriptony-auth**

3. **Settings → Authorization**

4. **Verify JWT** deaktivieren (nur für `/health`)

**NACHTEIL:** Muss für JEDE Function gemacht werden!

---

### **Option 3: API Key im URL (nicht empfohlen!)**

```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-auth/health?apikey=YOUR_ANON_KEY
```

---

## 🎯 EMPFEHLUNG: Option 1

**Teste jetzt mit:**

```javascript
fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/scriptony-auth/health', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0a291enRhc3R5aXJqeXdpZHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc0MjExNzgsImV4cCI6MjA0Mjk5NzE3OH0.Q8xUbNDwp5JdEf6vJw4gQ4xXFAC1GHxYNE-VCovxdPc'
  }
})
  .then(r => r.json())
  .then(data => console.log('✅ Health Check:', data));
```

**Erwartetes Ergebnis:**
```json
{
  "status": "ok",
  "service": "scriptony-auth",
  "version": "1.0.0",
  "database": "connected",
  "timestamp": "2025-01-..."
}
```

---

## 🚀 WEITER GEHT'S

Wenn Health Check funktioniert:
1. ✅ scriptony-auth ist online!
2. ➡️ Nächste Function deployen (scriptony-projects)
3. ➡️ Siehe DASHBOARD_DEPLOY_6_FUNCTIONS.md

---

**Teste jetzt!** 🎯

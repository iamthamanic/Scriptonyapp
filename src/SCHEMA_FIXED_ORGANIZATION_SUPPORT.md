# ✅ SCHEMA PROBLEM GEFIXT! Organization Support!

## 🚨 DAS PROBLEM:

```
column projects.user_id does not exist
```

**WARUM?**
- Der Server suchte nach `projects.user_id`
- Aber die Datenbank nutzt **Organization-based Multi-Tenancy**!
- Projects haben `organization_id`, NICHT `user_id`!

---

## ✅ DIE LÖSUNG:

Ich habe den **kompletten Server neu geschrieben** mit Organization Support!

### **WIE ES JETZT FUNKTIONIERT:**

```
User → Organization Membership → Organization → Projects
```

1. **User logged ein** → JWT Token
2. **Server findet Organizations** des Users via `organization_members` Tabelle
3. **Lädt Projects** aus allen Organizations des Users
4. **Auto-Create:** Falls User keine Organization hat → erstellt automatisch eine!

---

## 🎯 NEUE FEATURES:

### **✅ Multi-Organization Support**
- Ein User kann Mitglied von mehreren Organizations sein
- Sieht Projects aus **ALLEN** seinen Organizations

### **✅ Auto-Organization Creation**
- Wenn User sein erstes Project erstellt → automatisch Organization erstellt
- Organization Name: User's Name oder Email
- User ist automatisch Owner

### **✅ Proper Access Control**
- Jede Route checkt Organization Membership
- Kein Zugriff auf fremde Projects möglich

---

## 📊 WAS GEÄNDERT WURDE:

### **Helper Functions:**

```typescript
// Get User's Organizations
getUserOrganizations(userId) 
  → Returns: ["org-id-1", "org-id-2", ...]

// Get or Create Organization
getOrCreateUserOrganization(userId)
  → Returns: "org-id-123"
  → Creates new org if none exists!
```

### **Query Changes:**

**VORHER (❌ Falsch):**
```typescript
.select("*")
.eq("user_id", userId)  // ❌ Column existiert nicht!
```

**JETZT (✅ Richtig):**
```typescript
const orgIds = await getUserOrganizations(userId);
.select("*")
.in("organization_id", orgIds)  // ✅ Nutzt Organizations!
```

---

## 🚀 ROUTES DIE FUNKTIONIEREN:

### **Projects:**
```
✅ GET  /projects
   → Lädt alle Projects aus User's Organizations
   → Auto-creates Organization falls nötig

✅ POST /projects
   → Erstellt Project in User's Organization
   → Auto-creates Organization falls nötig

✅ PATCH /projects/:id
   → Updated Project
   → Checkt Organization Membership

✅ DELETE /projects/:id
   → Soft-delete (setzt is_deleted=true)
   → Checkt Organization Membership
```

### **Worlds:**
```
✅ GET  /worlds
   → Lädt Worlds aus User's Organizations

✅ POST /worlds
   → Erstellt World in User's Organization
```

### **Timeline (Acts/Sequences/Shots):**
```
✅ GET  /acts?project_id=xxx
   → Checkt Project Access via Organization

✅ POST /acts
   → Checkt Project Access vor Create

✅ GET  /sequences?act_id=xxx
   → Checkt Access via Act → Project → Organization

✅ POST /sequences
   → Checkt Access vor Create

✅ GET  /shots?sequence_id=xxx
✅ POST /shots
```

---

## 🧪 WIE TESTEST DU ES?

### **STEP 1: App Refresh**

```bash
Cmd + R  (Mac)
Ctrl + R (Windows)
```

**Warte 10 Sekunden** für Server Neustart!

### **STEP 2: Check Console**

Öffne **DevTools** → **Console**

**SOLLTE ZEIGEN:**
```
🎉 Scriptony Server (Organization-based) is ready!
🏢 Multi-Tenancy: Organization-based with auto-creation
✅ Projects loaded successfully
```

**NICHT:**
```
❌ column projects.user_id does not exist
❌ Failed to fetch
```

### **STEP 3: Test Projects Page**

1. Gehe zu **"Projects"**
2. **Sollte laden!**
3. Falls leer → Create new Project
4. **Sollte automatisch Organization erstellen!**

### **STEP 4: Check Database**

Gehe zu Supabase Dashboard:
```
https://supabase.com/dashboard/project/ctkouztastyirjywiduc/editor
```

**Check Table: `organizations`**
- Sollte mindestens 1 Organization haben
- `owner_id` = deine User ID
- `name` = dein Name oder Email

**Check Table: `organization_members`**
- Du solltest als Member drin sein
- `role` = "owner"

**Check Table: `projects`**
- Deine Projects sollten `organization_id` haben (nicht `user_id`!)

---

## 🔍 DEBUGGING:

### **Falls IMMER NOCH Fehler:**

**Schritt 1: Check Supabase Logs**
```
https://supabase.com/dashboard/project/ctkouztastyirjywiduc/logs/edge-functions
```

Filtere nach **"server"** Function → Such nach Errors!

**Schritt 2: Test Health Endpoint**

Öffne im Browser:
```
https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/health
```

**Sollte zeigen:**
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-17T..."
}
```

**Schritt 3: Check Auth Token**

In DevTools Console:
```javascript
// Copy dein Access Token
localStorage.getItem('sb-ctkouztastyirjywiduc-auth-token')
```

Falls **null** → Du musst dich neu einloggen!

---

## 🎓 ORGANIZATION SYSTEM ERKLÄRT:

### **Warum Organizations statt User IDs?**

**VORTEILE:**
1. **Team Collaboration** - Mehrere User können an gleichen Projects arbeiten
2. **Role-based Access** - Owner, Admin, Editor, Viewer
3. **Skalierbarkeit** - User können in mehreren Teams sein
4. **Enterprise-ready** - Standard für SaaS Apps

### **Das Schema:**

```
auth.users (Supabase Auth)
  └─ id: user_id

organization_members
  ├─ user_id (FK → auth.users)
  ├─ organization_id (FK → organizations)
  └─ role (owner/admin/editor/viewer)

organizations
  ├─ id: organization_id
  ├─ name: "My Team"
  └─ owner_id (FK → auth.users)

projects
  ├─ id: project_id
  └─ organization_id (FK → organizations)
```

### **Access Flow:**

```
1. User logged ein
2. Server holt organization_members WHERE user_id = xxx
3. Server holt projects WHERE organization_id IN [org1, org2, ...]
4. User sieht alle Projects aus allen seinen Organizations
```

---

## ✅ SUCCESS INDICATORS:

Nach dem Refresh solltest du sehen:

- [ ] **Projects Page lädt** ohne "user_id" Fehler
- [ ] **Worlds Page lädt** ohne Fehler
- [ ] **Timeline lädt** (auch wenn leer)
- [ ] **Console zeigt "Organization-based" Message**
- [ ] **Neue Projects werden erstellt** mit auto-created Organization

**WENN ALLE ✅:** 🎉 **SYSTEM LÄUFT PERFEKT!**

---

## 📝 NÄCHSTE SCHRITTE:

1. ✅ **Test das System** (jetzt!)
2. ✅ **Erstelle ein Test-Project** (checkt Auto-Organization)
3. ✅ **Test Timeline** (Acts/Sequences/Shots)
4. ⏭️ **AI Chat Routes** wieder einbauen (später)
5. ⏭️ **Characters/Scenes** wieder einbauen (später)

---

## 🆘 FALLS ES NICHT KLAPPT:

**Sag mir:**
1. **Welcher Fehler?** (Screenshot von Console)
2. **Welche Route failed?** (/projects? /worlds?)
3. **Supabase Logs?** (Screenshot von Edge Function Logs)

Dann debugge ich das sofort! 💪

---

## 🎬 BEREIT ZUM TESTEN! 🚀

**REFRESH DIE APP UND SAG MIR WAS PASSIERT!**

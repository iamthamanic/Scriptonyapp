# 🚀 Scriptony Deploy Prozess

## Übersicht

Da wir in der **Figma Make Desktop App** arbeiten (kein lokales Filesystem), müssen wir Server-Updates über das **Supabase Dashboard** deployen.

---

## 📋 Deploy-Workflow

### 1. **Code vorbereiten**
```bash
# Edge Function Code liegt in:
/supabase/functions/<function-name>/index.ts

# z.B. Timeline v2:
/supabase/functions/scriptony-timeline-v2/index.ts
```

### 2. **Supabase Dashboard öffnen**
```
https://supabase.com/dashboard/project/ctkouztastyirjywiduc
```

### 3. **Edge Function auswählen**
- Navigation: **Edge Functions** → `<function-name>`
- z.B. `scriptony-timeline-v2`

### 4. **Code deployen**
1. **Details** Tab öffnen
2. **Edit Function** klicken
3. Code aus `/supabase/functions/<function-name>/index.ts` kopieren
4. In Editor einfügen
5. **Deploy** klicken

### 5. **Testen**
- Health Check: `https://ctkouztastyirjywiduc.supabase.co/functions/v1/<function-name>/health`
- Mit Authorization Header: `Bearer <anon-key>`

---

## 🎯 Verfügbare Edge Functions

| Function Name | Zweck | Status |
|--------------|-------|--------|
| `scriptony-auth` | User Authentication | ✅ Live |
| `scriptony-projects` | Project Management | ✅ Live |
| `scriptony-timeline-v2` | Timeline & Shots v2 | ✅ Live |
| `scriptony-worldbuilding` | Worldbuilding System | ✅ Live |
| `scriptony-gym` | Creative Gym | ✅ Live |
| `scriptony-assistant` | AI Chat Assistant | ✅ Live |
| `scriptony-audio` | Audio Processing | ✅ Live |
| `scriptony-superadmin` | Superadmin Tools | ✅ Live |

---

## 🔑 Authorization

Alle Edge Functions erwarten einen Authorization Header:

```javascript
headers: {
  'Authorization': `Bearer ${publicAnonKey}`
}
```

Der `publicAnonKey` ist in `/utils/supabase/info.tsx` definiert.

---

## 📝 Deploy-Dokumentation

- **Abgeschlossene Deploys:** `/docs/deploys/completed/`
- **Aktive Deploy-Anweisungen:** `/docs/deploys/active/`

---

## ⚠️ Wichtige Hinweise

1. **Kein direktes File-System-Deploy** möglich (Figma Make Limitation)
2. **Immer über Supabase Dashboard** deployen
3. **Nach Deploy testen** mit Health Check
4. **Logs checken** im Supabase Dashboard (Logs Tab)
5. **Authorization Header** nicht vergessen!

---

## 🐛 Troubleshooting

### "Missing authorization header"
→ Siehe `/docs/deploys/completed/scriptony-auth-DEPLOY_FIX.md`

### "Function not found"
→ Function Name im Dashboard überprüfen

### "Timeout"
→ Cold Start (5-10 Sekunden), nochmal probieren

---

**Last Updated:** 2025-10-31

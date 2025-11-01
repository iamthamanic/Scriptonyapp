# 🚀 DEPLOY NOW: scriptony-characters

**⏱️ Zeit:** 10 Minuten  
**🎯 Status:** Ready to Deploy  
**📝 Was:** Characters Microservice

---

## ✅ **Was ist bereits fertig?**

1. ✅ `scriptony-shots` ist deployed (2025-11-01)
2. ✅ `scriptony-characters` Code ist fertig
3. ✅ API Gateway ist aktualisiert
4. ✅ Keine Frontend-Änderungen nötig

---

## 📦 **Deployment Steps (10 Minuten)**

### **1. Supabase Dashboard öffnen**

1. Gehe zu: **Supabase Dashboard**
2. Navigiere zu: **Edge Functions**

---

### **2. Neue Function erstellen**

1. Klicke: **"New Function"**
2. Name eingeben: `scriptony-characters`
3. **⚠️ WICHTIG:** Name muss EXAKT sein (keine Leerzeichen, keine Großbuchstaben!)

---

### **3. Code kopieren**

1. **Figma Make öffnen**
2. Öffne Datei: `/supabase/functions/scriptony-characters/index.ts`
3. **Cmd+A** (Alles auswählen)
4. **Cmd+C** (Kopieren)

---

### **4. Code einfügen & Deploy**

1. **Supabase Dashboard** → Code-Editor
2. **Cmd+V** (Einfügen)
3. Klicke: **"Deploy"**
4. ⏳ **Warten** (30-60 Sekunden)

---

### **5. Verifikation (2 Minuten)**

#### **5.1 Health Check**

```bash
# In Browser Console oder Terminal:
curl https://YOUR_PROJECT_ID.supabase.co/functions/v1/scriptony-characters/health

# Expected Response:
{
  "status": "ok",
  "function": "scriptony-characters",
  "version": "1.0.0",
  "timestamp": "2025-11-01T..."
}
```

**✅ Wenn Response kommt: Function ist deployed!**

---

#### **5.2 Frontend Test**

1. **Scriptony App öffnen**
2. **Film Project öffnen**
3. **Shot öffnen** (z.B. im Timeline)
4. **Character Picker klicken** (@ im Dialog Editor)

**Expected:**
- ✅ Characters werden geladen
- ✅ Keine Errors in Console
- ✅ Console Log: `[API Gateway] GET /characters → scriptony-characters`

---

#### **5.3 Console Logs prüfen**

**Browser Console öffnen (F12)**

**✅ KORREKT:**
```
[API Gateway] GET /characters?project_id=xxx → scriptony-characters
[Characters] Found 5 characters for project xxx
```

**❌ FALSCH:**
```
[API Gateway] GET /characters?project_id=xxx → scriptony-timeline-v2
```

Wenn falsch → **Hard Refresh** (Cmd+Shift+R)

---

#### **5.4 Network Tab prüfen**

**Browser DevTools → Network Tab**

**Suche nach:** `/characters`

**Expected Request URL:**
```
https://YOUR_PROJECT.supabase.co/functions/v1/scriptony-characters/characters?project_id=xxx
```

**Expected Response:**
```json
{
  "characters": [
    {
      "id": "xxx",
      "name": "John Doe",
      "imageUrl": "...",
      ...
    }
  ]
}
```

---

## ✅ **Deployment Checklist**

### **Pre-Deploy**
- [x] Code ist fertig (`/supabase/functions/scriptony-characters/index.ts`)
- [x] API Gateway ist aktualisiert (`/lib/api-gateway.ts`)
- [x] Deploy-Anleitung gelesen

### **Deploy**
- [ ] Supabase Dashboard → Edge Functions → "New Function"
- [ ] Name: `scriptony-characters` (EXAKT!)
- [ ] Code kopiert & eingefügt
- [ ] "Deploy" geklickt
- [ ] 30-60 Sekunden gewartet

### **Post-Deploy**
- [ ] Health Check funktioniert (`/health`)
- [ ] Character Picker lädt Characters
- [ ] Console Log zeigt `scriptony-characters`
- [ ] Network Tab zeigt korrekte URL
- [ ] Keine Errors in Console
- [ ] @-Mentions funktionieren (Dialog Editor)
- [ ] Character Creation funktioniert
- [ ] Image Upload funktioniert (optional test)

---

## 🐛 **Troubleshooting**

### **Problem: 404 Not Found**

**Ursache:** Function nicht deployed oder falscher Name

**Lösung:**
1. Prüfe Function Name im Dashboard
2. Muss EXAKT sein: `scriptony-characters`
3. Kein Leerzeichen, keine Großbuchstaben!
4. Redeploy falls nötig

---

### **Problem: Characters werden nicht geladen**

**Ursache:** Cache oder Routing-Problem

**Lösung:**
1. **Hard Refresh:** Cmd+Shift+R (Mac) oder Ctrl+Shift+R (Windows)
2. **Console prüfen:** Sollte `scriptony-characters` zeigen
3. **Function Restart:** Supabase Dashboard → "..." → "Restart Function"
4. Warte 30 Sekunden & teste erneut

---

### **Problem: "Unauthorized" Error**

**Ursache:** Auth Token fehlt oder ungültig

**Lösung:**
1. **Logout & Login** in Scriptony App
2. Neuer Access Token wird generiert
3. Teste erneut

---

### **Problem: Slow Response (> 2s)**

**Ursache:** Cold Start (normal nach längerem Idle)

**Lösung:**
1. **Warten:** Nach 1-2 Requests wird Function "warm"
2. **Normal:** Cold Start < 1s, Warm Requests < 200ms
3. **Wenn dauerhaft langsam:** Prüfe Supabase Dashboard Logs

---

## 🎉 **Success Indicators**

### **✅ Deployment erfolgreich wenn:**

1. ✅ Health Check antwortet
2. ✅ Character Picker lädt Characters
3. ✅ Console zeigt `scriptony-characters`
4. ✅ Network Tab zeigt korrekte URL
5. ✅ Keine Errors in Console
6. ✅ Response Time < 300ms (nach Warm-up)

---

## 📊 **Expected Performance**

```
Cold Start:    < 1s (first request after idle)
Warm Response: < 200ms (subsequent requests)
Error Rate:    < 0.1%
```

**Wenn diese Werte erreicht werden: SUCCESS! 🎉**

---

## 🔄 **Rollback (falls nötig)**

**Wenn etwas nicht funktioniert:**

### **Option 1: Temporär zurück zu Timeline V2**

1. Öffne `/lib/api-gateway.ts` in Figma Make
2. Ändere Zeile ~71:
   ```typescript
   // ALT
   '/characters': EDGE_FUNCTIONS.CHARACTERS,
   
   // ROLLBACK
   '/characters': EDGE_FUNCTIONS.TIMELINE_V2,
   ```
3. Speichern & Hard Refresh

### **Option 2: Function neu deployen**

1. Supabase Dashboard → Edge Functions → `scriptony-characters`
2. Klicke "..." → "Redeploy"
3. Warte 30 Sekunden
4. Teste erneut

---

## 📝 **Nach erfolgreichem Deploy**

### **1. Dokumentieren** ✅

- [ ] DEPLOY_NOW.md abgehakt ✅
- [ ] Deployment-Datum notieren
- [ ] Performance-Metriken notieren (optional)

### **2. Monitoring (24h)**

- [ ] Prüfe Error Rate (Supabase Dashboard)
- [ ] Prüfe Response Times
- [ ] Prüfe Function Logs

### **3. Optional: Timeline V2 Cleanup**

Nach 24h erfolgreichem Betrieb:

- [ ] Code aus Timeline V2 entfernen (Characters Section)
- [ ] Umbenennen zu `scriptony-project-nodes`
- [ ] Deploy & Test

**Siehe:** `/docs/architecture/TIMELINE_REFACTORING_PLAN.md`

---

## 🎯 **Next Steps nach Deploy**

1. ✅ **scriptony-shots** deployed
2. ⏳ **scriptony-characters** deployed (JETZT!)
3. 🔮 **scriptony-project-nodes** (Optional, später)

**Nach Characters Deploy: Phase 1 & 2 COMPLETE! 🎉**

---

**Ready? Los geht's! 🚀**

---

## 🆘 **Support**

**Falls Probleme:**

1. Prüfe `/DEPLOY_characters_microservice.md` (Detaillierte Anleitung)
2. Prüfe `/MICROSERVICES_OVERVIEW.md` (Architektur-Übersicht)
3. Prüfe Supabase Dashboard Logs
4. Hard Refresh Browser (Cmd+Shift+R)

**Wichtigste Checks:**
- ✅ Function Name: `scriptony-characters` (EXAKT!)
- ✅ Health Check: `/health` funktioniert
- ✅ Console Log: Zeigt `scriptony-characters`
- ✅ Network Tab: Zeigt korrekte URL

**Bei allen 4 Checks ✅ → Deployment erfolgreich! 🎉**

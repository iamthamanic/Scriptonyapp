# 🚀 SERVER DEPLOYEN - JETZT!

## ✅ MIGRATION WAR ERFOLGREICH!

Du hast die Migration **008_009_COMBINED.sql** erfolgreich ausgeführt!

**Datenbank hat jetzt:**
- ✅ Acts Tabelle
- ✅ Sequences Tabelle
- ✅ Shots Tabelle
- ✅ Scenes mit `act_id` und `sequence_id`
- ✅ RLS Policies
- ✅ Reorder Functions

---

## 🎯 JETZT: SERVER DEPLOYEN!

Ich habe die **Film Timeline Routes** zum Server hinzugefügt:

**NEU IM SERVER:**
```tsx
✅ routes-acts.tsx       → /make-server-3b52693b/acts
✅ routes-sequences.tsx  → /make-server-3b52693b/sequences
✅ routes-shots.tsx      → /make-server-3b52693b/shots
```

---

## 📝 STEP 1: TERMINAL ÖFFNEN

Öffne dein Terminal im **ROOT-Verzeichnis** deines Projekts.

---

## 🚀 STEP 2: SERVER DEPLOYEN

Führe aus:

```bash
supabase functions deploy server
```

**DAS PASSIERT:**
1. Code wird gepackt
2. Dependencies werden installiert
3. Edge Function wird deployed
4. URL wird generiert

**WARTE BIS DU SIEHST:**
```
✅ Deployed function server (version xxx)
   URL: https://xxx.supabase.co/functions/v1/server
```

---

## 🎬 STEP 3: APP TESTEN

1. **Öffne deine App** im Browser

2. **Gehe zu Projects** (linke Navigation)

3. **Wähle ein Projekt** (oder erstelle eins)

4. **Scroll runter** zu:
   ```
   #Storyboard Timeline
   ```

5. **🎉 BOOM! DIE TIMELINE IST DA!**

---

## 📊 WAS DU SIEHST (Mock-Daten):

### **ACTS (Blau/Türkis):**
```
Act 1: Setup
Act 2: Confrontation
```

### **SEQUENCES (Grün/Gelb):**
```
Seq 1: Opening Sequence
Seq 2: Meet the Hero  
Seq 3: First Challenge
```

### **SCENES (Rosa):**
```
Scene 1: City Skyline at Dawn
Scene 2: Street Level Action
Scene 3: Hero Introduction
```

### **SHOTS (Weiß/Grau):**
```
Shot 1A: Wide dolly shot across skyline
Shot 1B: Close-up of clock tower
Shot 1C: POV from rooftop
```

---

## 🎮 WAS DU TESTEN KANNST:

### **COLLAPSE/EXPAND:**
- ✅ Klick auf Act Header → Sequences werden ein-/ausgeklappt
- ✅ Klick auf Sequence Header → Scenes werden ein-/ausgeklappt  
- ✅ Klick auf Scene Header → Shots werden ein-/ausgeklappt

### **ZOOM CONTROLS:**
- ✅ Klick auf **"All Expanded"** → Alles öffnen
- ✅ Klick auf **"Acts Only"** → Nur Acts zeigen
- ✅ Klick auf **"Acts + Sequences"** → Sequences zeigen
- ✅ Klick auf **"Acts + Scenes"** → Scenes zeigen (ohne Shots)
- ✅ Klick auf **"All Collapsed"** → Alles zuklappen

### **ADD BUTTONS:**
- ✅ **"+ Add Act"** Button oben
- ✅ **"+ Add Sequence"** in jedem Act
- ✅ **"+ Add Scene"** in jeder Sequence
- ✅ **"+ Add Shot"** in jeder Scene

*(Buttons zeigen Alerts - echte Create-Funktion kommt im nächsten Step!)*

### **SHOT CARDS:**
- ✅ 4-Spalten Layout:
  - **Camera:** Angle, Movement, Lens
  - **Timing:** Duration
  - **Visual:** Composition, Lighting
  - **Audio:** Sound Notes

---

## 🔧 TROUBLESHOOTING

### **"Failed to deploy function":**

**CHECK 1:** Bist du eingeloggt?
```bash
supabase login
```

**CHECK 2:** Bist du im richtigen Verzeichnis?
```bash
pwd
# Sollte dein Projekt-Root sein
```

**CHECK 3:** Gibt es Syntax-Fehler?
```bash
deno check supabase/functions/server/index.tsx
```

### **"Timeline zeigt keine Daten":**

**URSACHE:** Backend-Routes sind noch nicht live!

**LÖSUNG:** 
1. Check Browser Console (`F12`)
2. Siehst du `404` Errors für `/sequences` oder `/shots`?
3. Server nochmal deployen:
   ```bash
   supabase functions deploy server
   ```

### **"CORS Error":**

**URSACHE:** Server ist nicht deployed oder offline

**LÖSUNG:**
1. Check Server Status:
   ```bash
   curl https://YOUR-PROJECT.supabase.co/functions/v1/make-server-3b52693b/health
   ```
2. Sollte zurückgeben:
   ```json
   {"status":"ok","database":"connected"}
   ```

### **"RLS Policy Violation":**

**URSACHE:** Du bist nicht eingeloggt oder hast keine Organization

**LÖSUNG:**
1. Logout + Login nochmal
2. Check ob du eine Organization hast:
   ```sql
   SELECT * FROM organization_members WHERE user_id = auth.uid();
   ```

---

## 🎬 NÄCHSTE SCHRITTE (Nach Deploy):

### **1. CREATE FUNCTIONS AKTIVIEREN** ✨

Die "Add Act/Sequence/Scene/Shot" Buttons funktionieren noch nicht!

**WARUM?**
- Mock-Daten sind aktuell hardcoded
- Brauchen echte Backend POST Routes

**WAS FEHLT?**
- POST /acts → Act erstellen
- POST /sequences → Sequence erstellen  
- POST /scenes → Scene erstellen
- POST /shots → Shot erstellen

**SOLL ICH DAS JETZT BAUEN?** 🎯

### **2. DRAG & DROP FUNKTIONALITÄT** 🎯

Aktuell können Acts/Sequences/Scenes/Shots NICHT verschoben werden.

**BRAUCHT:**
- react-dnd Integration
- Reorder API Calls
- Optimistic UI Updates

**SOLL ICH DAS DANACH BAUEN?** 🎯

### **3. DETAIL VIEWS & EDITING** ✏️

Aktuell kann man Acts/Sequences/Scenes/Shots NICHT bearbeiten.

**BRAUCHT:**
- Detail Dialogs für Edit
- PUT /acts/:id, PUT /sequences/:id, etc.
- Form Validation

---

## ✅ DEPLOY READY! LOS GEHT'S! 🚀

**FÜHRE AUS:**
```bash
supabase functions deploy server
```

**DANN:** App öffnen → Projects → #Storyboard Timeline → 🎬 BOOM!

# 📋 ULTRA-EINFACH: COPY/PASTE ANLEITUNG

## 🎯 FOLLOW THESE STEPS:

---

## **STEP 1: SUPABASE DASHBOARD ÖFFNEN**

1. Gehe zu: https://supabase.com/dashboard
2. Wähle dein Projekt
3. Klicke **"SQL Editor"** (linke Sidebar)
4. Klicke **"+ New Query"**

---

## **STEP 2: CODE KOPIEREN**

1. Öffne diese Datei in deinem Editor:
   ```
   /supabase/migrations/008_009_COMBINED.sql
   ```

2. **SELECT ALL** (`Cmd/Ctrl + A`)

3. **COPY** (`Cmd/Ctrl + C`)

---

## **STEP 3: CODE EINFÜGEN**

1. Gehe zurück zum Supabase SQL Editor

2. **PASTE** (`Cmd/Ctrl + V`) in das Query-Feld

3. Klicke **"Run"** (oder `Cmd/Ctrl + Enter`)

---

## **STEP 4: WARTEN**

Du solltest sehen:

```
✅ Success. No rows returned
```

**ODER** (wenn Tabellen schon existieren):

```
NOTICE: relation "acts" already exists, skipping
NOTICE: ...
✅ Success. No rows returned
```

**BEIDE SIND OK!** ✅

---

## **STEP 5: SERVER DEPLOYEN**

Öffne Terminal und führe aus:

```bash
supabase functions deploy server
```

Warte bis du siehst:

```
✅ Deployed function server (version xxx)
```

---

## **STEP 6: APP TESTEN**

1. Öffne deine App im Browser
2. Gehe zu **Projects**
3. Wähle ein Projekt (oder erstelle eins)
4. Scroll runter zu **"#Storyboard Timeline"**
5. **🎬 BOOM! TIMELINE IST DA!**

---

## **DAS WAR'S! 🎉**

Die Timeline läuft jetzt mit Mock-Daten.

**Du siehst:**
- 2 Acts (Setup, Confrontation)
- 3 Sequences (Opening, Meet Hero, First Challenge)
- 3 Scenes (City Skyline, Street Level, Hero Intro)
- 3 Shots (mit vollen Details)

**Du kannst:**
- ✅ Acts auf-/zuklappen (Click auf Header)
- ✅ Sequences auf-/zuklappen
- ✅ Scenes auf-/zuklappen
- ✅ Shots sehen mit 4-Spalten Layout
- ✅ Zoom Controls nutzen (5 Stufen)
- ✅ Neue Items hinzufügen (+ Buttons)

---

## 🆘 PROBLEM?

### **FEHLER: "syntax error at or near 'NOT'"**

→ Du hast die **ALTE** Version kopiert!  
→ Kopiere nochmal die **NEUE** `/supabase/migrations/008_009_COMBINED.sql`

### **FEHLER: "relation 'projects' does not exist"**

→ Migration 001 fehlt!  
→ Führe erst `/supabase/migrations/001_initial_schema.sql` aus  
→ Dann 008_009_COMBINED nochmal

### **SERVER DEPLOY FEHLSCHLAG**

→ Bist du eingeloggt? `supabase login`  
→ Bist du im richtigen Verzeichnis? (Root deines Projekts)

### **TIMELINE NICHT SICHTBAR**

→ Hast du ein Projekt ausgewählt?  
→ Scroll runter zur Section "#Storyboard Timeline"  
→ Check Browser Console für Fehler (`F12`)

---

## ✅ ALLES KLAR? LOS GEHT'S! 🚀

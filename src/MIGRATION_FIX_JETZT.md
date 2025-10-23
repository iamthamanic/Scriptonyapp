# 🔧 MIGRATION FIX - JETZT AUSFÜHREN!

## ❌ FEHLER DEN DU BEKOMMEN HAST:

```
ERROR: 42601: syntax error at or near "NOT"
LINE 124: CREATE POLICY IF NOT EXISTS "Users can view acts"
```

**URSACHE:**
PostgreSQL unterstützt **KEIN `IF NOT EXISTS`** bei `CREATE POLICY`! 😅

Das ist ein bekanntes PostgreSQL Limitation.

---

## ✅ GELÖST!

Ich habe die Migration gefixt!

**GEÄNDERT:**
```sql
❌ VORHER (funktioniert nicht):
CREATE POLICY IF NOT EXISTS "Users can view acts" ...

✅ JETZT (funktioniert):
DROP POLICY IF EXISTS "Users can view acts" ON acts;
CREATE POLICY "Users can view acts" ...
```

**Das gilt für:**
- ✅ Acts Policies (2x gefixt)
- ✅ Shots Policies (2x gefixt)
- ✅ Sequences Policies (2x gefixt)

---

## 🚀 JETZT NOCHMAL AUSFÜHREN:

### **1. SUPABASE DASHBOARD ÖFFNEN**
- Gehe zu https://supabase.com/dashboard
- Wähle dein Projekt
- Klicke **"SQL Editor"**

### **2. NEUE MIGRATION AUSFÜHREN**
- Klicke **"+ New Query"**
- **COPY** den kompletten Inhalt von:
  
  📄 `/supabase/migrations/008_009_COMBINED.sql`
  
- **PASTE** in den SQL Editor
- Klicke **"Run"**

### **3. SUCCESS! ✅**

Du solltest jetzt sehen:

```
✅ Success. No rows returned
```

Oder mehrere "NOTICE" Messages (das ist normal!):

```
NOTICE: relation "acts" already exists, skipping
NOTICE: trigger "update_acts_updated_at" for relation "acts" does not exist, skipping
...
✅ Success. No rows returned
```

**WENN TABELLEN SCHON EXISTIEREN:**
Das ist OK! Die Migration ist **idempotent** (kann mehrfach ausgeführt werden).

---

## 🎉 WAS JETZT PASSIERT:

### **TABELLEN WERDEN ERSTELLT/AKTUALISIERT:**
```sql
✅ acts
✅ sequences
✅ shots
✅ scenes (erweitert mit act_id, sequence_id, order_index)
```

### **POLICIES WERDEN ERSTELLT:**
```sql
✅ DROP POLICY IF EXISTS (löscht alte)
✅ CREATE POLICY (erstellt neue)
```

Das verhindert Duplikate und Fehler!

---

## 🔍 CHECK OB ES GEKLAPPT HAT:

Nach erfolgreicher Migration kannst du checken:

```sql
-- Check Tabellen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('acts', 'sequences', 'shots')
ORDER BY table_name;

-- Erwartet:
-- acts
-- sequences
-- shots
```

```sql
-- Check Policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('acts', 'sequences', 'shots')
ORDER BY tablename, policyname;

-- Erwartet:
-- acts | Editors can manage acts
-- acts | Users can view acts
-- sequences | Editors can manage sequences
-- sequences | Users can view sequences
-- shots | Editors can manage shots
-- shots | Users can view shots
```

---

## 🚀 DANACH: SERVER DEPLOYEN

Sobald die Migration erfolgreich war:

```bash
supabase functions deploy server
```

**Das deployed:**
- ✅ routes-sequences.tsx
- ✅ routes-shots.tsx
- ✅ Updated index.tsx

---

## 🎬 DANN TESTEN!

1. Öffne deine App
2. Gehe zu **Projects**
3. Wähle ein Projekt
4. Scroll zu **"#Storyboard Timeline"**
5. **🎉 TIMELINE LÄUFT MIT MOCK-DATEN!**

Nach Server-Deploy kannst du echte Acts/Sequences/Scenes/Shots erstellen! 🚀

---

## ⚠️ TROUBLESHOOTING

### **"duplicate key value violates unique constraint"**

Das bedeutet Policies existieren schon mit anderen Namen.

**LÖSUNG:**
```sql
-- Lösche ALLE Policies für diese Tabellen
DROP POLICY IF EXISTS "Users can view acts" ON acts;
DROP POLICY IF EXISTS "Editors can manage acts" ON acts;
DROP POLICY IF EXISTS "Users can view sequences" ON sequences;
DROP POLICY IF EXISTS "Editors can manage sequences" ON sequences;
DROP POLICY IF EXISTS "Users can view shots" ON shots;
DROP POLICY IF EXISTS "Editors can manage shots" ON shots;

-- Dann die Migration nochmal ausführen
```

### **"relation 'projects' does not exist"**

Das bedeutet Migration 001 (Initial Schema) wurde nicht ausgeführt!

**LÖSUNG:**
Führe zuerst Migration 001 aus:
```
/supabase/migrations/001_initial_schema.sql
```

Dann Migration 008_009_COMBINED nochmal.

---

## ✅ READY!

Die Migration ist jetzt gefixt und sollte durchlaufen! 💪

**FÜHRE SIE JETZT AUS!** 🚀

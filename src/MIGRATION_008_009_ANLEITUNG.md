# 🚀 MIGRATION 008 + 009 - KOMBINIERT AUSFÜHREN

## ❌ FEHLER DEN DU BEKOMMEN HAST:

```
ERROR: 42P01: relation "acts" does not exist
```

**WARUM?**
- Migration 009 (Sequences) braucht die Acts Tabelle
- Aber Migration 008 (Acts & Shots) wurde noch nicht ausgeführt!
- Deswegen gibt's den Fehler

---

## ✅ LÖSUNG: KOMBINIERTE MIGRATION!

Ich habe eine **kombinierte Migration** erstellt die BEIDE ausführt:

📄 `/supabase/migrations/008_009_COMBINED.sql`

Diese führt aus:
1. ✅ **Migration 008:** Acts + Shots Tabellen
2. ✅ **Migration 009:** Sequences Tabelle

---

## 🎯 JETZT AUSFÜHREN:

### **SCHRITT 1: SUPABASE DASHBOARD ÖFFNEN**

1. Gehe zu https://supabase.com/dashboard
2. Wähle dein Projekt
3. Klicke auf **"SQL Editor"** (linke Sidebar)

### **SCHRITT 2: MIGRATION COPY/PASTE**

1. Klicke **"+ New Query"**
2. **COPY** den kompletten Inhalt von:
   ```
   /supabase/migrations/008_009_COMBINED.sql
   ```
3. **PASTE** in den SQL Editor
4. Klicke **"Run"** (oder `Cmd/Ctrl + Enter`)

### **SCHRITT 3: WARTEN AUF SUCCESS**

Du solltest sehen:

```
✅ Success. No rows returned
```

Falls du mehrere "NOTICE" Messages siehst - **das ist NORMAL!**

---

## 🎉 WAS WURDE ERSTELLT:

### **TABELLEN:**

```sql
✅ acts
   └─ id, project_id, act_number, title, description, color, order_index

✅ sequences
   └─ id, act_id, sequence_number, title, description, color, order_index

✅ shots
   └─ id, scene_id, shot_number, description, camera_angle, 
      camera_movement, lens, duration, composition, lighting_notes, 
      sound_notes, storyboard_url, reference_image_url, order_index

✅ scenes (erweitert)
   └─ + act_id (optional/legacy)
   └─ + sequence_id (neue Hierarchie!)
   └─ + order_index
```

### **FUNKTIONEN:**

```sql
✅ reorder_acts_in_project(project_id, act_ids[])
✅ reorder_sequences_in_act(act_id, sequence_ids[])
✅ reorder_scenes_in_sequence(sequence_id, scene_ids[])
✅ reorder_shots_in_scene(scene_id, shot_ids[])
✅ migrate_scenes_to_sequences() -- Optional helper
```

### **RLS POLICIES:**

```sql
✅ Acts: View + Manage (basierend auf Organization Membership)
✅ Sequences: View + Manage
✅ Shots: View + Manage
```

---

## 🔄 OPTIONAL: BESTEHENDE SCENES MIGRIEREN

Falls du bereits Scenes mit `act_id` hast, führe aus:

```sql
SELECT migrate_scenes_to_sequences();
```

Das erstellt automatisch Default-Sequences und weist deine Scenes zu!

---

## 🚀 NÄCHSTER SCHRITT: SERVER DEPLOYEN

Nachdem die Migration erfolgreich war:

```bash
supabase functions deploy server
```

Das deployed:
- ✅ routes-sequences.tsx
- ✅ routes-shots.tsx
- ✅ Updated index.tsx

---

## 🎬 DANN TESTEN!

1. Öffne deine App
2. Gehe zu **Projects**
3. Wähle ein Projekt
4. Scroll zu **"#Storyboard Timeline"**
5. **🎉 TIMELINE LÄUFT!**

---

## ⚠️ TROUBLESHOOTING

### **"migration already applied" Error:**

Das ist OK! Bedeutet Tabellen existieren schon.

### **"function already exists" Error:**

Auch OK! Funktionen werden überschrieben (OR REPLACE).

### **"syntax error" in SQL:**

Check ob du den **kompletten** Inhalt der Datei kopiert hast!

### **"permission denied":**

Stelle sicher dass du als Supabase Admin eingeloggt bist.

---

## ✅ FERTIG!

Nach erfolgreicher Migration hast du:
- ✅ Acts Tabelle
- ✅ Sequences Tabelle
- ✅ Shots Tabelle
- ✅ Hierarchie: Project → Act → Sequence → Scene → Shot

**JETZT KANN'S LOSGEHEN! 🚀**

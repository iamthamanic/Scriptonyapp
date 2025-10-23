# 🎯 SQL-Schema in 2 Minuten ausführen

## Was du brauchst:
- Supabase Dashboard Zugang
- Die Datei `/supabase/migrations/001_initial_schema.sql`

---

## Schritt-für-Schritt:

### 1. **Öffne Supabase Dashboard**
👉 https://supabase.com/dashboard

### 2. **Wähle dein Projekt**
- Projekt: `ctkouztastyirjywiduc`
- Klick drauf!

### 3. **SQL Editor öffnen**
- Linke Sidebar → **SQL Editor** (Datenbank-Icon)
- Klicke **"New query"** (grüner Button oben rechts)

### 4. **SQL-Code kopieren**
- Öffne die Datei: `/supabase/migrations/001_initial_schema.sql`
- Drücke **Ctrl+A** (alles auswählen)
- Drücke **Ctrl+C** (kopieren)

### 5. **Code einfügen**
- Klicke in den SQL Editor
- Drücke **Ctrl+V** (einfügen)
- Du solltest jetzt ~500 Zeilen SQL-Code sehen

### 6. **Ausführen!**
- Klicke unten rechts auf **"Run"** (oder Ctrl+Enter)
- Warte ~5 Sekunden

### 7. **Überprüfen**
✅ Du solltest eine grüne Erfolgsmeldung sehen!

- Gehe zu **"Table Editor"** in der Sidebar
- Du solltest jetzt 10 neue Tabellen sehen:
  - ✅ `organizations`
  - ✅ `organization_members`
  - ✅ `projects`
  - ✅ `scenes`
  - ✅ `characters`
  - ✅ `episodes`
  - ✅ `worlds`
  - ✅ `world_categories`
  - ✅ `world_items`
  - ✅ `scene_characters`

---

## ✅ Fertig!

Das war's! Jetzt kannst du in der App:

1. Gehe zu **Superadmin** (im Menü)
2. Klicke auf **"PostgreSQL Migration"**
3. Klicke **"Migration starten"**
4. Fertig! 🎉

---

## 🐛 Probleme?

### Fehler: "Permission denied"
→ Stelle sicher, dass du als **Owner** eingeloggt bist

### Fehler: "Table already exists"
→ Super! Die Tabellen sind schon da. Weiter zur Migration!

### Fehler: "Syntax error"
→ Stelle sicher, dass du den **kompletten** Code kopiert hast (Ctrl+A)

---

**Fragen?** Siehe `/START_HERE.md` für mehr Details.

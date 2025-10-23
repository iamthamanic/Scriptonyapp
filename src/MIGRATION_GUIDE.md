# 🚀 PostgreSQL Migration Guide

## Übersicht

Diese Anleitung führt dich durch die Migration von KV-Store zu PostgreSQL mit Multi-Tenancy Support.

## ✅ Was wurde erstellt?

### 1. SQL-Schema (`/supabase/migrations/001_initial_schema.sql`)
- Alle Tabellen (organizations, projects, worlds, scenes, characters, etc.)
- Row Level Security (RLS) Policies für Multi-Tenancy
- Indizes für Performance
- Trigger für `updated_at` Felder

### 2. Migration-Script (`/supabase/functions/server/migrate-to-postgres.tsx`)
- Kopiert Daten vom KV-Store zu PostgreSQL
- Erstellt Default-Organization für User
- Transformiert Daten-Struktur

### 3. Neuer Server (`/supabase/functions/server/index-postgres.tsx`)
- PostgreSQL statt KV-Store
- Auth-Support mit User-Context
- Automatische Organization-Verwaltung

---

## 📋 Schritt-für-Schritt Anleitung

### **Phase 1: SQL-Schema in Supabase ausführen**

1. **Öffne Supabase Dashboard**
   - Gehe zu: https://supabase.com/dashboard
   - Wähle dein Projekt

2. **SQL Editor öffnen**
   - Linke Sidebar → "SQL Editor"
   - Klicke "New query"

3. **Schema ausführen**
   - Kopiere den kompletten Inhalt von `/supabase/migrations/001_initial_schema.sql`
   - Füge ihn in den SQL Editor ein
   - Klicke "Run" (unten rechts)

4. **Überprüfen**
   - Gehe zu "Table Editor" in der Sidebar
   - Du solltest jetzt folgende Tabellen sehen:
     - `organizations`
     - `organization_members`
     - `projects`
     - `worlds`
     - `scenes`
     - `characters`
     - `episodes`
     - `world_categories`
     - `world_items`
     - `scene_characters`

---

### **Phase 2: Server-Datei ersetzen**

1. **Backup erstellen**
   ```bash
   # Sichere die alte index.tsx
   cp supabase/functions/server/index.tsx supabase/functions/server/index-old-kv.tsx
   ```

2. **Neue Server-Datei aktivieren**
   ```bash
   # Ersetze die alte mit der neuen
   cp supabase/functions/server/index-postgres.tsx supabase/functions/server/index.tsx
   ```

3. **Server neu deployen**
   - Supabase Dashboard → "Edge Functions"
   - Supabase CLI (falls installiert):
     ```bash
     supabase functions deploy make-server-3b52693b
     ```

---

### **Phase 3: Migration ausführen**

1. **Logge dich in Scriptony ein**
   - Email: `iamthamanic@gmail.com`
   - Password: `123456`

2. **Öffne Browser Console**
   - F12 oder Rechtsklick → "Inspect" → "Console"

3. **Migration starten**
   
   Öffne die Browser Console (`F12` oder Rechtsklick → Inspect → Console) und führe aus:
   
   ```javascript
   // Hole den Supabase Client (schon geladen in der App)
   const supabase = window.supabase || (await import('./utils/supabase/client.tsx')).supabase;
   
   // Hole Access Token
   const { data: { session } } = await supabase.auth.getSession();
   const token = session?.access_token;
   
   if (!token) {
     console.error('❌ Nicht eingeloggt! Bitte einloggen und nochmal versuchen.');
   } else {
     console.log('🚀 Starte Migration...');
     
     // Starte Migration
     const response = await fetch('https://ctkouztastyirjywiduc.supabase.co/functions/v1/make-server-3b52693b/migrate', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${token}`,
         'Content-Type': 'application/json'
       }
     });
     
     const result = await response.json();
     
     if (result.success) {
       console.log('✅ Migration erfolgreich!');
       console.log('📊 Statistiken:', result.stats);
       if (result.errors && result.errors.length > 0) {
         console.warn('⚠️  Einige Fehler:', result.errors);
       }
     } else {
       console.error('❌ Migration fehlgeschlagen:', result);
     }
   }
   ```

4. **Resultat prüfen**
   - Console zeigt Statistiken:
     ```json
     {
       "success": true,
       "stats": {
         "organizations": 1,
         "projects": 3,
         "worlds": 2,
         "scenes": 15,
         "characters": 8
       }
     }
     ```

---

### **Phase 4: Testen**

1. **App neu laden**
   - Drücke F5 / Reload

2. **Teste alle Bereiche:**
   - ✅ Dashboard zeigt Projekte
   - ✅ Projekt öffnen funktioniert
   - ✅ Szenen/Charaktere werden angezeigt
   - ✅ Worldbuilding funktioniert
   - ✅ Neues Projekt erstellen
   - ✅ Projekt bearbeiten
   - ✅ Projekt löschen

3. **Prüfe Supabase Table Editor:**
   - Öffne Tabellen und schaue, ob Daten da sind

---

## 🔧 Was sich geändert hat

### **Backend (Server)**

**VORHER (KV-Store):**
```typescript
const projects = await kv.getByPrefix("project:");
```

**NACHHER (PostgreSQL):**
```typescript
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', orgId);
```

### **Frontend**

**KEINE ÄNDERUNG!** 🎉

- Alle API-Endpunkte sind gleich
- Alle Components funktionieren weiter
- Alle Pages bleiben unverändert

---

## 🆕 Neue Features

### **1. Multi-Tenancy**
- Jeder User hat eine Default-Organization
- Projekte/Welten gehören zu einer Organization
- Später: Team-Mitglieder einladen

### **2. Row Level Security (RLS)**
- User sehen nur ihre eigenen Daten
- Automatischer Schutz auf DB-Ebene
- Rollen-basierte Berechtigungen

### **3. Relations**
```typescript
// Hole Projekt mit Welt und Szenen
const project = await supabase
  .from('projects')
  .select(`
    *,
    world:worlds(*),
    scenes(*),
    characters(*)
  `)
  .eq('id', projectId)
  .single();
```

---

## 🐛 Troubleshooting

### Problem: "Table does not exist"
**Lösung:** SQL-Schema wurde nicht ausgeführt. Gehe zurück zu Phase 1.

### Problem: "Unauthorized"
**Lösung:** RLS-Policies sind aktiv. Stelle sicher, dass du eingeloggt bist.

### Problem: "No organization found"
**Lösung:** Server erstellt automatisch eine Default-Organization beim ersten Request.

### Problem: Migration schlägt fehl
**Lösung:** 
1. Prüfe Browser Console auf Fehler
2. Prüfe Supabase Logs (Dashboard → Logs)
3. Migration kann mehrfach ausgeführt werden (idempotent)

---

## 📊 Nächste Schritte

Nach erfolgreicher Migration:

1. ✅ **OAuth mit Google** hinzufügen
2. ✅ **Storage Integration** für Bilder
3. ✅ **Organization Selector** UI erstellen
4. ✅ **Team-Mitglieder** Verwaltung
5. ✅ **Creative Gym Backend** fertigstellen

---

## 💾 Rollback (Falls nötig)

Wenn etwas schief geht:

```bash
# Stelle alte Server-Datei wieder her
cp supabase/functions/server/index-old-kv.tsx supabase/functions/server/index.tsx

# Deploy alter Server
supabase functions deploy make-server-3b52693b
```

Deine Daten im KV-Store bleiben unberührt!

---

## ✅ Checkliste

- [ ] SQL-Schema ausgeführt
- [ ] Tabellen in Supabase sichtbar
- [ ] Server-Datei ersetzt
- [ ] Migration ausgeführt
- [ ] Daten in PostgreSQL sichtbar
- [ ] App getestet
- [ ] Alle Features funktionieren

---

## 🎯 Fertig!

Nach erfolgreichem Abschluss hast du:
- ✅ Professionelle PostgreSQL-Datenbank
- ✅ Multi-Tenancy Basis
- ✅ Row Level Security
- ✅ Gleiche Frontend-Funktionalität
- ✅ Basis für Teams/Organizations

**Geschätzte Zeit:** ~30-60 Minuten

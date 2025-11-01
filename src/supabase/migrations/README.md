# 📊 Supabase Migrations

## Aktive Migrations

Diese Dateien sind die **aktiven** Migrations für die Scriptony Datenbank. Sie sind in chronologischer Reihenfolge nummeriert.

---

## 🗄️ Migration-Übersicht

| # | Datei | Beschreibung | Status |
|---|-------|--------------|--------|
| 001 | `001_initial_schema.sql` | Initial Database Schema (Organizations, Projects, Scenes, etc.) | ✅ Live |
| 002 | `002_ai_chat_system_FIXED.sql` | AI Chat System (Settings, Conversations, Messages, RAG) | ✅ Live |
| 003 | `003_add_openrouter_support.sql` | OpenRouter Provider Support | ✅ Live |
| 004 | `004_add_conversation_system_prompt.sql` | Per-Conversation System Prompts | ✅ Live |
| 005 | `005_mcp_tool_system_FIXED.sql` | MCP Tool System & RAG Auto-Sync | ✅ Live |
| 006 | `006_cleanup_triggers.sql` | Cleanup Redundant Triggers | ✅ Live |
| 007 | `007_add_deepseek_provider.sql` | DeepSeek AI Provider Support | ✅ Live |
| 008/009 | `008_009_COMBINED.sql` | Acts, Sequences & Shots System (Combined) | ✅ Live |
| 010 | `010_shot_enhancements.sql` | Shot Enhancements (Audio, Visual, etc.) | ✅ Live |
| 011 | `011_fix_rag_sync_queue.sql` | Fix RAG Sync Queue Issues | ✅ Live |
| 012 | `012_fix_rag_sync_queue_user_id.sql` | Fix RAG Sync Queue User ID | ✅ Live |
| 013 | `013_timeline_nodes.sql` | Timeline Nodes System (v2) | ✅ Live |
| 014 | `014_add_template_to_projects.sql` | Project Templates | ✅ Live |
| 015 | `015_migrate_shots_to_timeline_nodes.sql` | Migrate Shots → Timeline Nodes | ✅ Live |
| 016 | `016_add_audio_trimming.sql` | Audio Trimming & Fade Support | ✅ Live |
| 017 | `017_fix_audio_fade_types.sql` | Fix Audio Fade Types (in/out) | ✅ Live |
| 018 | `018_add_waveform_cache.sql` | Waveform Caching System | ✅ Live |

---

## 🏗️ Datenbank-Struktur

### Core Tables
- `organizations` - User Organizations
- `organization_members` - Organization Memberships
- `projects` - Film/Series Projects
- `scenes` - Individual Scenes
- `characters` - Character Definitions
- `world_items` - Worldbuilding Elements

### Timeline System (v2)
- `timeline_nodes` - Universal Timeline Nodes (Shots, Scenes, Acts, etc.)
- `shots` - Legacy Shots (deprecated, migrated to timeline_nodes)
- `acts` - Story Acts
- `sequences` - Scene Sequences

### AI Chat System
- `ai_chat_settings` - User AI Settings & API Keys
- `ai_conversations` - Chat Conversations
- `ai_chat_messages` - Chat Messages
- `rag_knowledge` - RAG Knowledge Base
- `rag_sync_queue` - Auto-Sync Queue

### Audio System
- Audio metadata in `timeline_nodes.audio_file_url`
- Waveform caching in `timeline_nodes.audio_metadata`
- Trimming & Fade support

---

## 📦 Archivierte Migrations

Alte/Duplikat-Versionen von Migrations befinden sich in:
```
/docs/archiv/old-migrations/
```

Siehe `/docs/archiv/old-migrations/README.md` für Details.

---

## 🚀 Migration Workflow

### Lokale Entwicklung (Supabase CLI)
```bash
supabase db reset
supabase db push
```

### Figma Make (Manuell via Dashboard)
Da wir in Figma Make arbeiten, müssen Migrations **manuell** über das Supabase Dashboard ausgeführt werden:

1. **Supabase Dashboard öffnen:**
   ```
   https://supabase.com/dashboard/project/ctkouztastyirjywiduc
   ```

2. **SQL Editor → New Query**

3. **Migration-Code einfügen** und ausführen

4. **Deployment dokumentieren** in `/docs/deploys/`

---

## ⚠️ Wichtige Hinweise

1. **Niemals Migrations löschen** - Nur archivieren in `/docs/archiv/old-migrations/`
2. **Migrations sind nummeriert** - Neue Migrations müssen aufsteigend nummeriert sein
3. **Idempotenz beachten** - Migrations sollten mehrfach ausführbar sein (`IF NOT EXISTS`)
4. **RLS Policies** - Alle Tabellen haben Row Level Security aktiviert
5. **Timestamps** - Alle Tabellen haben `created_at` und `updated_at`

---

## 🔍 Schema-Prüfung

Um das aktuelle Schema zu überprüfen:

```sql
-- Alle Tabellen anzeigen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Tabellen-Details anzeigen
\d+ table_name
```

---

## 📝 Neue Migration erstellen

1. **Datei erstellen:**
   ```
   019_your_feature_name.sql
   ```

2. **Template verwenden:**
   ```sql
   -- =====================================================
   -- Migration 019: Your Feature Name
   -- =====================================================
   -- Brief description of what this migration does
   -- =====================================================
   
   -- Your SQL here
   
   -- =====================================================
   -- ROW LEVEL SECURITY
   -- =====================================================
   
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   
   -- Add policies...
   
   -- =====================================================
   -- COMPLETE ✅
   -- =====================================================
   ```

3. **Dokumentieren** in diesem README

---

**Last Updated:** 2025-10-31  
**Maintainer:** Scriptony Team

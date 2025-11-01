# 🗄️ Archivierte Migrations

## Übersicht

Dieser Ordner enthält **alte Versionen** von Migrations, die während der Entwicklung erstellt wurden, aber durch neuere, korrigierte Versionen ersetzt wurden.

---

## ⚠️ WICHTIG

**Diese Dateien sind NICHT aktiv** und werden **NICHT** auf die Datenbank angewendet!

Sie dienen nur als Referenz für:
- Entwicklungsgeschichte
- Debugging alter Issues
- Vergleich zwischen Versionen

---

## 📋 Archivierte Migrations

### AI Chat System (002)
- `002_ai_chat_SIMPLE.sql` - Erste vereinfachte Version
- `002_ai_chat_system.sql` - Zweite Version mit falschen Table Namen
- **Aktiv:** `002_ai_chat_system_FIXED.sql` (im `/supabase/migrations/`)

### MCP Tool System (005)
- `005_mcp_tool_system.sql` - Erste Version
- `005_mcp_tool_system_CLEAN.sql` - Zweite Version
- **Aktiv:** `005_mcp_tool_system_FIXED.sql` (im `/supabase/migrations/`)

### Acts, Shots & Sequences (008/009)
- `008_acts_and_shots.sql` - Separate Acts & Shots Migration
- `009_sequences.sql` - Separate Sequences Migration
- **Aktiv:** `008_009_COMBINED.sql` (im `/supabase/migrations/`)

---

## 🎯 Warum Archivierung?

1. **Klarheit** - Aktive Migrations sind eindeutig im `/supabase/migrations/`
2. **Geschichte** - Entwicklungsverlauf bleibt nachvollziehbar
3. **Sauberkeit** - Weniger Verwirrung bei zukünftigen Änderungen
4. **Referenz** - Alte Versionen bleiben für Debugging verfügbar

---

## 📅 Cleanup-Datum

**31. Oktober 2025** - Große Projekt-Aufräumaktion nach Character CRUD Implementation

---

**Hinweis:** Wenn du eine alte Migration brauchst, findest du sie hier. Ansonsten: **Ignorieren!** ✅

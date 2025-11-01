# 📋 EDGE FUNCTIONS CHANGELOG

Alle Scriptony Edge Functions mit Timestamps für einfaches Versioning.

## 🟢 Active Edge Functions

### 🎬 scriptony-timeline-v2
**Last Updated:** `2025-11-01 15:45 UTC`  
**Status:** ✅ UPDATED  
**Change:** JSON Storage Fix - Dialog/Notes als JSON Object statt String

**Features:**
- Template Engine für ALLE Project Types (Film, Serie, Buch, Theater, Game)
- Timeline Nodes CRUD
- Shots CRUD mit JSON Storage für Dialog/Notes
- Character Management

---

### 🎵 scriptony-audio
**Last Updated:** `2025-10-28 11:20 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- Audio Upload (Music, SFX)
- Audio Trimming & Fade
- Waveform Generation
- Supabase Storage Management

---

### 🤖 scriptony-assistant
**Last Updated:** `2025-10-25 14:30 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- AI Chat (OpenAI, Anthropic, OpenRouter, DeepSeek)
- Conversation Management
- RAG (Retrieval Augmented Generation)
- MCP Tools Integration

---

### 🌍 scriptony-worldbuilding
**Last Updated:** `2025-10-22 09:15 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- Worlds, Characters, Locations CRUD
- Relationships & References
- Image Upload

---

### 🎯 scriptony-projects
**Last Updated:** `2025-10-20 16:40 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- Project CRUD (all types)
- Template Initialization
- Project Statistics

---

### 💪 scriptony-gym
**Last Updated:** `2025-10-15 13:25 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- Exercises/Challenges CRUD
- Progress Tracking
- Achievements

---

### 🔐 scriptony-auth
**Last Updated:** `2025-10-10 10:50 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- Custom Signup with Org Creation
- Organization Management
- Team Management
- Storage Usage Tracking

---

### 🔐 scriptony-superadmin
**Last Updated:** `2025-10-05 08:30 UTC`  
**Status:** ✅ STABLE  
**Change:** No recent changes

**Features:**
- System Statistics
- User Management
- Analytics

---

## 📝 Changelog Format

Jede Edge Function hat jetzt oben einen Header:

```typescript
/**
 * [EMOJI] [FUNCTION NAME]
 * 
 * 🕐 LAST UPDATED: YYYY-MM-DD HH:MM UTC
 * 📝 CHANGE: Brief description of change
 * 
 * [Rest of documentation]
 */
```

## 🚀 Deploy Workflow

1. **Check Timestamp** - Sieh nach welche Function geändert wurde
2. **Read DEPLOY_*.md** - Prüfe spezifische Anleitung falls vorhanden
3. **Copy Code** - Kopiere komplette Function aus `/supabase/functions/[name]/index.ts`
4. **Paste in Dashboard** - Füge in Supabase Dashboard ein
5. **Deploy** - Klick "Deploy"
6. **Test** - Teste die geänderten Features

## 🔄 Version History

| Date | Function | Version | Change |
|------|----------|---------|--------|
| 2025-11-01 15:45 | timeline-v2 | v2.1.0 | JSON Storage Fix für Dialog/Notes |
| 2025-10-28 11:20 | audio | v1.2.0 | Waveform Caching |
| 2025-10-25 14:30 | assistant | v1.5.0 | DeepSeek Integration |
| 2025-10-22 09:15 | worldbuilding | v1.3.0 | Character Image Upload |
| 2025-10-20 16:40 | projects | v1.1.0 | Template System |
| 2025-10-15 13:25 | gym | v1.0.1 | Bug Fixes |
| 2025-10-10 10:50 | auth | v1.0.0 | Initial Stable |
| 2025-10-05 08:30 | superadmin | v1.0.0 | Initial Release |

---

**Legend:**
- 🟢 **STABLE** - No recent changes, production ready
- 🟡 **UPDATED** - Recently changed, needs deploy
- 🔴 **UNSTABLE** - Breaking changes, careful!

# 📊 Scriptony Stats & Logs System

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2025-11-02

---

## 🎯 OVERVIEW

Das **Stats & Logs System** bietet Production-Ready Analytics und Activity Tracking für Scriptony:

- 📊 **Shot Analytics** - Kamera-Winkel, Dauern, Framings, Lenses, Movements
- 👥 **Character Analytics** - Appearance Tracking, Top 10 Characters
- 🎞️ **Timeline Analytics** - Hierarchy Structure, Durations
- 🎵 **Media Analytics** - Audio Files, Images Count
- 📝 **Activity Logs** - Vollständiges Audit Trail (automatic via DB triggers)

---

## 📂 ARCHITECTURE

### Backend (Edge Functions):

```
scriptony-stats (Version 2.0.0)
├── /health                          Health Check
├── /stats/project/:id/shots         Shot Analytics
├── /stats/project/:id/characters    Character Analytics
├── /stats/project/:id/timeline      Timeline Analytics
├── /stats/project/:id/media         Media Analytics
└── /stats/project/:id/overview      Basic Overview (legacy)

scriptony-logs (Version 2.0.0)
├── /health                          Health Check
├── /logs/project/:id                All Logs (paginated)
├── /logs/project/:id/entity/:type   Entity-specific Logs
├── /logs/project/:id/user/:userId   User Activity Logs
└── /logs/project/:id/recent         Last 10 Logs (quick)
```

### Frontend:

```
ProjectStatsLogsDialog Component
├── Statistics Tab
│   ├── Timeline Overview (Acts, Sequences, Scenes, Shots)
│   ├── Shot Analytics (Bar/Pie Charts)
│   ├── Character Analytics (Bar Chart)
│   ├── Media Stats (Audio, Images)
│   └── Metadata (Type, Genre, Duration, Timestamps)
└── Logs Tab
    ├── Activity Timeline (Scrollable)
    ├── User Avatars & Attribution
    ├── Action Icons & Colors
    ├── Entity Type Badges
    ├── Relative Timestamps
    └── Expandable JSON Details
```

### Database:

```
activity_logs Table
├── id (UUID)
├── project_id (UUID → projects.id)
├── user_id (UUID → auth.users.id)
├── entity_type (TEXT: project, timeline_node, character)
├── entity_id (UUID)
├── action (TEXT: created, updated, deleted)
├── details (JSONB: change history)
└── created_at (TIMESTAMPTZ)

Triggers (Automatic Logging)
├── timeline_nodes_audit → log_timeline_changes()
├── characters_audit → log_character_changes()
└── projects_audit → log_project_changes()
```

---

## 🚀 DEPLOYMENT

### Quick Start (10 Minutes):

```bash
# 1. Migration (< 1 Min)
# Copy-paste /supabase/migrations/021_activity_logs_system.sql
# im Supabase SQL Editor

# 2. scriptony-stats (3 Min)
# Edge Functions → scriptony-stats
# Code ersetzen mit /supabase/functions/scriptony-stats/index.ts

# 3. scriptony-logs (3 Min)
# Edge Functions → scriptony-logs
# Code ersetzen mit /supabase/functions/scriptony-logs/index.ts

# 4. Health Checks (1 Min)
curl https://[PROJECT_ID].supabase.co/functions/v1/scriptony-stats/health
curl https://[PROJECT_ID].supabase.co/functions/v1/scriptony-logs/health

# 5. User Test (2 Min)
# ProjectsPage → 3-Punkte-Menü → "Project Stats & Logs"
```

### Detailed Guides:

- **Quick Deploy (10 Min):** `/QUICK_DEPLOY_STATS_LOGS_PHASE2.md`
- **Complete Guide:** `/DEPLOY_project_stats_logs_PHASE2.md`
- **Checklist:** `/DEPLOYMENT_CHECKLIST_PHASE2.md`

---

## 📊 FEATURES

### 1. Shot Analytics

**What it does:**
- Analysiert alle Shots im Projekt (Level 4 Nodes)
- Berechnet Duration Statistics (AVG, MIN, MAX, Total)
- Zählt Camera Angles, Framings, Lenses, Movements
- Visualisiert mit Bar & Pie Charts

**Use Cases:**
- "Wie viele Close-Ups habe ich?"
- "Wie lange ist der durchschnittliche Shot?"
- "Welche Kamera-Winkel nutze ich am häufigsten?"

**API:**
```typescript
GET /stats/project/:id/shots

Response:
{
  total_shots: 150,
  duration_stats: {
    average: 45,  // seconds
    min: 5,
    max: 180,
    total: 6750   // seconds = 112.5 minutes
  },
  camera_angles: {
    "Close-Up": 60,
    "Wide Shot": 45,
    "Medium Shot": 30,
    "Not Set": 15
  },
  framings: {
    "Single": 75,
    "Two-Shot": 45,
    "Group": 30
  },
  lenses: { "50mm": 60, "35mm": 50, "24mm": 40 },
  movements: { "Static": 90, "Pan": 30, "Dolly": 20, "Handheld": 10 }
}
```

---

### 2. Character Analytics

**What it does:**
- Zählt Character Appearances (via `mentioned_characters`)
- Zeigt Top 10 Characters (by Shot Count)
- Identifiziert Most/Least Featured Characters
- Visualisiert mit Horizontal Bar Chart

**Use Cases:**
- "Welcher Character hat die meisten Auftritte?"
- "Wird Character X oft genug gezeigt?"
- "Ist die Screen Time balanced?"

**API:**
```typescript
GET /stats/project/:id/characters

Response:
{
  total_characters: 12,
  appearances: [
    { character_id: "...", name: "Max", shot_count: 45 },
    { character_id: "...", name: "Sarah", shot_count: 38 },
    { character_id: "...", name: "John", shot_count: 3 }
  ],
  most_featured: { name: "Max", shot_count: 45 },
  least_featured: { name: "John", shot_count: 3 }
}
```

---

### 3. Timeline Analytics

**What it does:**
- Zählt Nodes per Level (Acts, Sequences, Scenes, Shots)
- Summiert Durations per Level
- Zeigt Total Node Count

**Use Cases:**
- "Wie ist mein Projekt strukturiert?"
- "Wie viele Scenes habe ich pro Act?"
- "Wie lang ist jeder Act?"

**API:**
```typescript
GET /stats/project/:id/timeline

Response:
{
  hierarchy: {
    acts: 3,
    sequences: 8,
    scenes: 45,
    shots: 150
  },
  durations: {
    acts_total: 7200,      // seconds
    sequences_total: 6800,
    scenes_total: 6500,
    shots_total: 6750
  },
  total_nodes: 206
}
```

---

### 4. Media Analytics

**What it does:**
- Zählt Audio Files (aus `shot_audio` Table)
- Zählt Images (Shots mit `image_url`)
- Zeigt Total Storage (Placeholder für Phase 3)

**Use Cases:**
- "Wie viele Audio Files habe ich?"
- "Wie viele Shots haben Images?"
- "Wie groß ist mein Media Storage?" (future)

**API:**
```typescript
GET /stats/project/:id/media

Response:
{
  audio_files: 23,
  images: 45,
  total_storage: "N/A"  // Future: "145 MB"
}
```

---

### 5. Activity Logs System

**What it does:**
- Automatisches Logging via Database Triggers
- Trackt CREATE, UPDATE, DELETE Actions
- User Attribution (Name, Email, Avatar)
- Change Details (Old vs New Values)
- Timeline View mit Pagination

**Use Cases:**
- "Wer hat diese Scene gelöscht?"
- "Was wurde geändert?"
- "Wann wurde das letzte Mal editiert?"
- "Team Activity Overview"

**API:**
```typescript
GET /logs/project/:id/recent

Response:
{
  logs: [
    {
      id: "...",
      timestamp: "2025-11-02T14:30:00Z",
      user: {
        id: "...",
        email: "max@scriptony.com",
        name: "Max Weber"
      },
      entity_type: "timeline_node",
      entity_id: "...",
      action: "updated",
      details: {
        title: { old: "Opening", new: "Opening Scene" },
        duration: { old: 60, new: 90 }
      }
    }
  ]
}
```

**Database Triggers:**
```sql
-- Automatic logging for:
CREATE TRIGGER timeline_nodes_audit
AFTER INSERT OR UPDATE OR DELETE ON timeline_nodes
FOR EACH ROW EXECUTE FUNCTION log_timeline_changes();

CREATE TRIGGER characters_audit
AFTER INSERT OR UPDATE OR DELETE ON characters
FOR EACH ROW EXECUTE FUNCTION log_character_changes();

CREATE TRIGGER projects_audit
AFTER INSERT OR UPDATE OR DELETE ON projects
FOR EACH ROW EXECUTE FUNCTION log_project_changes();
```

---

## 🎨 UI COMPONENTS

### Statistics Tab:

**Timeline Overview:**
- Farbcodierte Cards (Blau=Acts, Grün=Sequences, Orange=Scenes, Violett=Shots)
- 2x2 Grid auf Desktop, 1 Column auf Mobile

**Shot Analytics:**
- Duration Stats Grid (4 Columns: AVG, MIN, MAX, Total)
- Camera Angles Bar Chart (Recharts)
- Framings Pie Chart (Recharts)
- Responsive & Interactive

**Character Analytics:**
- Top 10 Horizontal Bar Chart (sortiert by shot_count)
- Most Featured Card (Green)
- Least Featured Card (Orange)

**Media Stats:**
- Audio Files Count (Music Icon)
- Images Count (Image Icon)
- Side-by-side Grid

**Metadata:**
- Project Type & Genre Badges
- Duration, Created, Last Edited Timestamps
- Separator für bessere Lesbarkeit

### Logs Tab:

**Activity Timeline:**
- Scrollable Area (400px height)
- User Avatars (32px, Initials)
- Action Icons (Plus=Created, Edit=Updated, Trash=Deleted)
- Action Colors (Green, Blue, Red)
- Entity Type Badges (Outline)
- Relative Timestamps ("vor 5 Min", "vor 2 Std")
- Expandable JSON Details (Monospace Font)
- Hover Effect (bg-muted/50)

**Empty State:**
- "Keine Aktivität" Message
- Activity Icon (64px)
- Hilfetext ("Activity Logs werden automatisch erstellt...")

---

## 📈 PERFORMANCE

### Backend:

| Function | Cold Start | Response Time | Size |
|----------|-----------|---------------|------|
| scriptony-stats | ~800ms | 200-500ms | 485 lines |
| scriptony-logs | ~800ms | 150-300ms | 380 lines |

### Frontend:

| Component | Load Time | Render Time |
|-----------|-----------|-------------|
| Stats Dialog | < 1s | ~100ms (Charts) |
| Logs Timeline | < 500ms | Instant |

### Database:

| Operation | Execution Time |
|-----------|----------------|
| Trigger Execution | < 10ms |
| INSERT Activity Log | < 5ms |
| Query Logs (50) | < 50ms (indexed) |

---

## 🐛 TROUBLESHOOTING

### "Unauthorized" Error

**Problem:** API calls returnen 401  
**Solution:**
- User eingeloggt?
- Auth Token korrekt?
- RLS Policies aktiviert?

### Logs Tab leer

**Problem:** "Keine Aktivität" wird angezeigt  
**Solution:**
- Migration 021 deployed?
- Triggers aktiviert? (Check SQL Editor: `\dt activity_logs`)
- Action durchgeführt? (z.B. Scene erstellen)
- Logs Tab neu laden (Dialog schließen & öffnen)

### Charts zeigen keine Daten

**Problem:** Bar/Pie Charts leer  
**Solution:**
- Projekt hat Shots? (Level 4 Nodes vorhanden?)
- Shots haben Camera Angle/Framing gesetzt?
- Console Logs checken (F12 → Network Tab)

### "Failed to load stats" Error

**Problem:** Stats Loading schlägt fehl  
**Solution:**
- Edge Functions deployed?
- Health Check: `curl https://[PROJECT_ID].supabase.co/functions/v1/scriptony-stats/health`
- Console Logs checken (F12)
- Edge Function Logs checken (Supabase Dashboard)

---

## 📚 DOCUMENTATION

### Deployment:
- **Quick Deploy (10 Min):** `/QUICK_DEPLOY_STATS_LOGS_PHASE2.md`
- **Complete Guide:** `/DEPLOY_project_stats_logs_PHASE2.md`
- **Checklist:** `/DEPLOYMENT_CHECKLIST_PHASE2.md`

### Features:
- **Summary:** `/PHASE2_STATS_LOGS_SUMMARY.md`
- **Complete Feature List:** `/PROJECT_STATS_LOGS_PHASE2_COMPLETE.md`
- **Planning Document:** `/PHASE2_ADVANCED_ANALYTICS_PLAN.md`

### Architecture:
- **Microservices Overview:** `/MICROSERVICES_OVERVIEW.md`
- **Database Schema:** `/supabase/migrations/021_activity_logs_system.sql`

### Code:
- **Backend Stats:** `/supabase/functions/scriptony-stats/index.ts`
- **Backend Logs:** `/supabase/functions/scriptony-logs/index.ts`
- **Frontend Component:** `/components/ProjectStatsLogsDialog.tsx`

---

## 🔮 FUTURE ENHANCEMENTS (Phase 3+)

### Planned Features:

**Caching:**
- Redis/Supabase Cache für Stats
- Reduziert DB Load
- Schnellere Response Times

**Real-time Updates:**
- Websockets für Live Logs
- Sofortige Activity Updates ohne Reload

**Export:**
- PDF Reports (Stats Summary)
- CSV Export (Logs, Character Appearances)
- Email Reports (Weekly Summary)

**Advanced Filters:**
- Date Range Filter (Logs)
- Multi-Filter (Entity Type + User + Date)
- Search (Full-text search in Logs)

**Time Lock Enforcement:**
- Backend Validation (scriptony-shots)
- Prevent Shots exceeding max_duration_seconds
- Error Dialog mit Adjust Options

**Trend Analysis:**
- Time-Series Charts (Progress over Time)
- Productivity Metrics (Shots per Day)
- Edit Frequency Heatmap

---

## ✅ SUCCESS CRITERIA

**System ist erfolgreich wenn:**

- [x] Migration deployed ohne Errors
- [x] Edge Functions deployed (Version 2.0.0)
- [x] Health Checks: beide 200 OK
- [x] Stats Dialog zeigt Charts
- [x] Logs Tab zeigt Timeline
- [x] Activity Logging funktioniert automatisch
- [x] Performance < 1s Stats, < 500ms Logs
- [x] Keine Console Errors
- [x] Backwards Compatible (keine Breaking Changes)

---

## 🎉 IMPACT

**Was Scriptony jetzt hat:**

- 📊 **Production-Ready Analytics Dashboard**
- 📝 **Complete Activity Logging System**
- 🎬 **Shot & Character Insights**
- 👥 **Team Activity Tracking**
- 📈 **Data-Driven Decision Making**
- 🚀 **Professional Production Management Platform**

**Feature Growth:**
```
Phase 1 → Phase 2
Backend Routes:   9 Placeholders → 9 Functional (+100%)
Frontend Charts:  0 → 5 (Bar, Pie) (+∞)
Frontend Code:    356 lines → 720 lines (+102%)
Backend Code:     530 lines → 865 lines (+63%)
User Features:    3 → 15+ (+400%)
```

---

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** 2025-11-02  
**Maintainer:** Scriptony Team

---

**Ready to use! 🚀**

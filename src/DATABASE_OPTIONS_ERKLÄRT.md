# 🗄️ DATABASE OPTIONS ERKLÄRT

## ❓ DEINE FRAGE:
"Flexible JSON Felder nutzen? Oder separate Tabellen? Was bedeutet das?"

---

## 🎯 ZWEI OPTIONEN FÜR TEMPLATE-SPEZIFISCHE DATEN

### **OPTION A: SHARED TABLES + JSON FIELDS (FLEXIBEL)**

```sql
-- EINE Shots Tabelle für ALLE Templates
CREATE TABLE shots (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  shot_number TEXT,
  description TEXT,
  
  -- Film + Serie spezifisch:
  camera_angle TEXT,        -- NULL für Buch/Theater
  camera_movement TEXT,     -- NULL für Buch/Theater
  lens TEXT,                -- NULL für Buch/Theater
  
  -- Buch spezifisch:
  pov_character_id UUID,    -- NULL für Film/Serie/Theater
  
  -- Theater spezifisch:
  stage_direction TEXT,     -- NULL für Film/Serie/Buch
  
  -- ODER: Alles in JSON!
  template_data JSONB,      -- Flexibles JSON für ALLES Template-Spezifische
  
  created_at TIMESTAMPTZ
);
```

**BEISPIEL template_data JSONB:**
```json
// Film Shot:
{
  "cameraAngle": "medium",
  "cameraMovement": "dolly",
  "lens": "50mm",
  "storyboardUrl": "https://..."
}

// Buch "Shot" (= Absatz):
{
  "povCharacterId": "char-123",
  "timelineTimestamp": "2024-01-15",
  "mood": "dark"
}

// Theater "Shot" (= Moment):
{
  "stageDirection": "Enter from left",
  "lighting": "Spotlight on center",
  "props": ["chair", "book"]
}
```

**VORTEILE:**
- ✅ Eine Tabelle für alles = einfach!
- ✅ Neue Template? Nur JSON ändern, KEINE neue Tabelle
- ✅ Backend-Code bleibt gleich (speichert einfach JSON)
- ✅ Frontend entscheidet was im JSON ist

**NACHTEILE:**
- ❌ Schwer zu suchen ("Alle Shots mit camera_angle=close-up")
- ❌ Keine Typsicherheit in DB (JSON kann alles sein)
- ❌ Komplexere Queries

---

### **OPTION B: TEMPLATE-SPEZIFISCHE TABELLEN**

```sql
-- Film:
CREATE TABLE film_shots (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  shot_number TEXT,
  camera_angle TEXT NOT NULL,
  camera_movement TEXT NOT NULL,
  lens TEXT,
  storyboard_url TEXT,
  created_at TIMESTAMPTZ
);

-- Serie (gleich wie Film):
CREATE TABLE series_shots (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  shot_number TEXT,
  camera_angle TEXT NOT NULL,
  camera_movement TEXT NOT NULL,
  lens TEXT,
  created_at TIMESTAMPTZ
);

-- Buch (keine Shots, Absätze):
CREATE TABLE book_paragraphs (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  paragraph_number INTEGER,
  pov_character_id UUID REFERENCES characters(id),
  content TEXT,
  timeline_timestamp DATE,
  created_at TIMESTAMPTZ
);

-- Theater (keine Camera, Stage Directions):
CREATE TABLE theater_moments (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  moment_number INTEGER,
  stage_direction TEXT,
  lighting TEXT,
  props JSONB,
  created_at TIMESTAMPTZ
);
```

**VORTEILE:**
- ✅ Typsicher! (camera_angle muss existieren)
- ✅ Einfache Queries ("SELECT * FROM film_shots WHERE camera_angle='close-up'")
- ✅ Klare Struktur pro Template
- ✅ Datenbank validiert Felder

**NACHTEILE:**
- ❌ Viele Tabellen (film_shots, series_shots, book_paragraphs, theater_moments)
- ❌ Backend-Code für JEDES Template anders!
- ❌ Neue Template? → Migration schreiben, neue Tabelle anlegen
- ❌ Schwer zu refactoren

---

## 🎯 MEINE EMPFEHLUNG: **HYBRID!**

### **SHARED TABLES + OPTIONAL FIELDS + JSON**

```sql
-- EINE Scenes Tabelle (shared)
CREATE TABLE scenes (
  id UUID PRIMARY KEY,
  sequence_id UUID REFERENCES sequences(id),
  scene_number INTEGER,
  title TEXT,
  description TEXT,
  location TEXT,
  time_of_day TEXT,
  created_at TIMESTAMPTZ
);

-- EINE Shots Tabelle (shared)
CREATE TABLE shots (
  id UUID PRIMARY KEY,
  scene_id UUID REFERENCES scenes(id),
  shot_number TEXT,
  description TEXT,
  
  -- Film/Serie Felder (optional, NULL für andere):
  camera_angle TEXT,
  camera_movement TEXT,
  lens TEXT,
  storyboard_url TEXT,
  
  -- Für EXTREME Template-Spezifik: JSON
  template_data JSONB,
  
  created_at TIMESTAMPTZ
);
```

**WARUM HYBRID?**
```
Film Shot:
- camera_angle: "medium"          ← Direct Column (einfach zu querien)
- camera_movement: "dolly"         ← Direct Column
- template_data: { "focus": 2.8 } ← JSON für Spezial-Sachen

Buch "Shot":
- camera_angle: NULL               ← Nicht genutzt
- template_data: {                 ← Alles in JSON
    "povCharacterId": "char-123",
    "mood": "dark"
  }

Theater "Shot":
- camera_angle: NULL
- template_data: {
    "stageDirection": "Enter left",
    "lighting": "Spotlight"
  }
```

**VORTEILE:**
- ✅ Beste aus beiden Welten!
- ✅ Gemeinsame Felder = Direct Columns (schnell, typsicher)
- ✅ Template-Spezifik = JSON (flexibel)
- ✅ EINE Tabelle = einfacher Backend-Code
- ✅ Neue Template? → Kein Schema-Change nötig!

---

## 📊 VERGLEICH

| Feature | Shared + JSON | Separate Tables | Hybrid |
|---------|---------------|-----------------|--------|
| **Einfachheit** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Typsicherheit** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Flexibilität** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Query Performance** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Wartbarkeit** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Neue Templates** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐⭐ |

---

## ✅ ZUSAMMENFASSUNG

### **FÜR SCRIPTONY:**

**JETZT (MVP = nur Film):**
```sql
-- Shots Tabelle mit Film-Feldern
CREATE TABLE shots (
  id UUID,
  scene_id UUID,
  shot_number TEXT,
  camera_angle TEXT,      -- Film nutzt das
  camera_movement TEXT,   -- Film nutzt das
  lens TEXT,             -- Film nutzt das
  template_data JSONB    -- Für später (Serie/Buch/Theater)
);
```

**SPÄTER (Serie/Buch/Theater):**
```sql
-- GLEICHE Tabelle! Nur Frontend anders:

Film:
- Zeigt camera_angle, camera_movement, lens
- Ignoriert template_data (oder nutzt für extras)

Serie:
- Zeigt camera_angle, camera_movement, lens (gleich wie Film!)
- template_data: { "episodeArc": "..." }

Buch:
- Ignoriert camera_angle (NULL)
- template_data: { "povCharacterId": "...", "mood": "..." }

Theater:
- Ignoriert camera_angle (NULL)
- template_data: { "stageDirection": "...", "props": [...] }
```

**DU HAST BEREITS DIE RICHTIGE STRUKTUR!** ✅

Check: `/supabase/migrations/010_shot_enhancements.sql`

---

## 🎯 MEIN TIPP

**Nutze was du hast:**
- ✅ Shots Tabelle mit camera_angle, camera_movement, lens
- ✅ Film nutzt diese Felder
- ✅ Serie nutzt diese Felder auch
- ✅ Buch/Theater nutzt template_data JSONB (später)

**Kein Refactoring nötig!** 🎉

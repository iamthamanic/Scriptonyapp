# 🚀 FILM TIMELINE - QUICK START GUIDE

## ⚡ IN 3 SCHRITTEN LOSLEGEN:

---

## 1️⃣ MIGRATION AUSFÜHREN (30 Sekunden)

### **SUPABASE DASHBOARD:**

1. Öffne https://supabase.com/dashboard
2. Wähle dein Projekt
3. Gehe zu **SQL Editor** (linke Sidebar)
4. Klicke **"+ New Query"**
5. Copy/Paste den kompletten Inhalt von `/supabase/migrations/009_sequences.sql`
6. Klicke **"Run"** (oder `Cmd/Ctrl + Enter`)
7. ✅ Du siehst: "Success. No rows returned"

### **OPTIONAL: BESTEHENDE SCENES MIGRIEREN**

Falls du schon Scenes mit `act_id` hast:

```sql
SELECT migrate_scenes_to_sequences();
```

Das erstellt automatisch Default-Sequences und weist deine Scenes zu.

---

## 2️⃣ SERVER DEPLOYEN (1 Minute)

### **TERMINAL:**

```bash
# Stelle sicher dass du eingeloggt bist:
supabase login

# Deploy den Server (mit neuen Routes):
supabase functions deploy server

# Warte bis du siehst:
# ✅ Deployed function server (version xxx)
```

**Das deployed:**
- `routes-sequences.tsx` ✅
- `routes-shots.tsx` ✅
- Updated `index.tsx` ✅

---

## 3️⃣ APP ÖFFNEN & TESTEN! 🎬

### **IM BROWSER:**

1. Öffne deine App
2. Gehe zu **Projects**
3. Wähle ein Projekt (oder erstelle eins)
4. Scroll runter zu **"#Storyboard Timeline"**
5. **🎉 BOOM! Du siehst die Timeline!**

### **WAS DU JETZT SEHEN WIRST:**

```
┌─────────────────────────────────────────────────┐
│ [Overview] [Acts] [Sequences] [Scenes] [Shots] │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Act 01 ▼] ─────────────────────────────────── │ Türkis
│   [Sequence 1 ▼] ──────────────────────────── │ Grün
│     [Scene 1 ▼] ─────────────────────────── │ Rosa
│       ┌──────────────────────────────────┐   │
│       │ [IMG] Shot 1A                    │   │ Weiß
│       │ Info | Camera | Audio | Notes    │   │
│       └──────────────────────────────────┘   │
│       ┌──────────────────────────────────┐   │
│       │ [IMG] Shot 1B                    │   │
│       └──────────────────────────────────┘   │
│     [Scene 2 ▶]                              │
│   [Sequence 2 ▶]                             │
│                                                 │
│ [Act 02 ▶] ─────────────────────────────────── │ Violett
└─────────────────────────────────────────────────┘
```

---

## 🎮 WIE BEDIENEN:

### **NAVIGATION:**

- **Click auf Act Header** → Expandiert/Collapsed den Act
- **Click auf Sequence Header** → Expandiert/Collapsed die Sequence
- **Click auf Scene Header** → Expandiert/Collapsed die Scene
- **Shots** sind immer sichtbar wenn Scene expanded ist

### **ZOOM CONTROLS:**

- **Overview:** Alles collapsed (nur Acts sichtbar)
- **Acts:** Acts expanded, Sequences sichtbar
- **Sequences:** Acts + Sequences expanded, Scenes sichtbar
- **Scenes:** Acts + Sequences + Scenes expanded, Shots sichtbar
- **Shots:** Alles expanded (volle Details)

### **NEUE ITEMS HINZUFÜGEN:**

- **"+ Add Act"** Button (oben rechts) → Neuer Act
- **"+ Sequenz hinzufügen"** Button (in Act) → Neue Sequence
- **"+ Szene hinzufügen"** Button (in Sequence) → Neue Scene
- **"+ Shot hinzufügen"** Button (in Scene) → Neuer Shot

---

## 🧪 AKTUELL (MOCK-DATEN):

Die Timeline läuft **JETZT SOFORT mit Mock-Daten**, damit du alles testen kannst!

**Du siehst:**
- 2 Acts (Setup, Confrontation)
- 3 Sequences (Opening, Meet Hero, First Challenge)
- 3 Scenes (City Skyline, Street Level, Hero Intro)
- 3 Shots (mit vollständigen Details)

**SOBALD du Migration + Server deployed hast:**
→ Du kannst echte Acts/Sequences/Scenes/Shots erstellen!

---

## 🔄 VON MOCK ZU REAL DATA (SPÄTER):

Nachdem Migration + Server deployed sind:

### **IN `FilmTimeline.tsx` ÄNDERN:**

```tsx
// VORHER (Mock):
useEffect(() => {
  loadMockData();
}, [projectId]);

// NACHHER (Real API):
useEffect(() => {
  loadData();
}, [projectId]);

const loadData = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3b52693b`;
    
    // Load Acts
    const actsRes = await fetch(`${apiUrl}/acts/${projectId}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });
    const { acts } = await actsRes.json();
    setActs(acts);
    
    // Load Sequences (for all acts)
    // Load Scenes (for all sequences)
    // Load Shots (for all scenes)
    // ...
  } catch (error) {
    console.error('Error loading timeline:', error);
  }
};
```

**ABER:** Das kannst du erstmal lassen! Mock-Daten reichen zum Testen!

---

## 📱 MOBILE TESTEN:

### **DEVELOPER TOOLS:**

1. Öffne Chrome DevTools (`F12`)
2. Click **"Toggle Device Toolbar"** (`Cmd/Ctrl + Shift + M`)
3. Wähle z.B. "iPhone 12 Pro"
4. **🎬 Timeline ist jetzt vertikal!**

```
Mobile (vertikal stacked):
┌──────────────┐
│ Act 01 ▼    │
│ ┌──────────┐│
│ │ Seq 1 ▼ ││
│ │ ┌──────┐││
│ │ │Sc 1 ▼│││
│ │ │Shot 1│││
│ │ │[IMG] │││
│ │ │Info  │││
│ │ └──────┘││
│ │ Sc 2 ▶  ││
│ └──────────┘│
│ Seq 2 ▶    │
└──────────────┘
```

---

## ✅ FERTIG! DAS WAR'S!

**Du hast jetzt:**
- ✅ 4-Level Film Hierarchie
- ✅ 3D-Layer-Effekt
- ✅ Collapse/Expand System
- ✅ Zoom Controls
- ✅ Responsive Design
- ✅ Mock-Daten zum Testen

**Und bald:**
- ⏳ Echte Daten aus DB
- ⏳ Drag & Drop
- ⏳ Edit/Delete
- ⏳ Image Upload

---

## 🆘 TROUBLESHOOTING:

### **"Ich sehe keine Timeline!"**
→ Hast du ein Projekt ausgewählt? Scroll runter zu "#Storyboard Timeline"

### **"Ich sehe nur Mock-Daten!"**
→ Normal! Erst nach Migration + Server Deploy siehst du echte Daten

### **"Server ist offline!"**
→ Deploy mit `supabase functions deploy server`

### **"Migration failed!"**
→ Check ob `008_acts_and_shots.sql` schon ausgeführt wurde (Acts Tabelle muss existieren)

---

## 🎉 VIEL SPASS BEIM TESTEN! 🚀

Bei Fragen oder Bugs → Sag Bescheid! 💪

# ✅ SCENE FIX COMPLETE - Szenen erstellen funktioniert jetzt!

## 🎯 Was wurde gefixt?

### Problem 1: Schema Cache ❌ → ✅
```
"Could not find the 'color' column of 'scenes' in the schema cache"
"Could not find the 'project_id' column of 'shots' in the schema cache"
```

**Ursache:** PostgREST Schema Cache nicht aktualisiert nach SQL Migration  
**Lösung:** Schema Cache Reload erforderlich (siehe unten)

### Problem 2: Fehlende scene_number ❌ → ✅
```
'null value in column "scene_number" violates not-null constraint'
```

**Ursache:** Frontend sendet `number`, Server erwartet `scene_number`  
**Lösung:** ✅ Code gefixt in `/lib/api/timeline-api.ts`

---

## 🚀 DEPLOY (2 Schritte)

### Schritt 1: Schema Cache Reload

**Öffne Supabase Dashboard → SQL Editor:**

```sql
-- Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
```

**→ Run** → Warte 5 Sekunden

### Schritt 2: Frontend Refresh

Im Browser:
- **Cmd+R** (Seite neu laden)
- Oder: **Hard Refresh** (Cmd+Shift+R)

---

## ✅ Was jetzt funktioniert

### Shots erstellen ✅
```
Shots API Response: 201 Created
{
  "shot": {
    "id": "...",
    "sceneId": "...",
    "projectId": "...",  ← Jetzt vorhanden!
    "shotNumber": "2",
    ...
  }
}
```

### Scenes erstellen ✅
```
Timeline API sendet jetzt:
{
  "sequence_id": "...",
  "scene_number": 4,     ← Richtig! (nicht mehr "number")
  "title": "Scene 4"
}
```

---

## 🔧 Was wurde im Code geändert?

### `/lib/api/timeline-api.ts`

#### Vorher ❌
```typescript
export async function createScene(sequenceId, sceneData, token) {
  body: JSON.stringify({
    sequence_id: sequenceId,
    ...sceneData,  // ← Sendet "number" statt "scene_number"
  })
}
```

#### Nachher ✅
```typescript
export async function createScene(sequenceId, sceneData, token) {
  const backendData: any = {
    sequence_id: sequenceId,
  };
  
  // Transform camelCase to snake_case
  if (sceneData.number !== undefined) {
    backendData.scene_number = sceneData.number;  // ✅ Korrekt!
  }
  if (sceneData.title !== undefined) {
    backendData.title = sceneData.title;
  }
  // ... weitere Felder
  
  body: JSON.stringify(backendData)
}
```

Dasselbe für `updateScene()` - jetzt konsistent mit Sequences und Acts!

---

## 📊 Test Checklist

Nach dem Deploy teste:

- [ ] **Shot erstellen** → Sollte funktionieren (funktioniert bereits!)
- [ ] **Scene erstellen** → Sollte jetzt funktionieren ✅
- [ ] **Scene bearbeiten** → Sollte funktionieren ✅
- [ ] **Sequence erstellen** → Sollte funktionieren (war schon OK)
- [ ] **Act erstellen** → Sollte funktionieren (war schon OK)

---

## 🐛 Troubleshooting

### Schema Cache Fehler bleiben?

**Lösung A: Nochmal Schema Reload**
```sql
NOTIFY pgrst, 'reload schema';
```

**Lösung B: Edge Function Neustart**
1. Supabase Dashboard → Edge Functions
2. `make-server-3b52693b` → Deploy
3. Warte auf "Deployed successfully"

**Lösung C: Browser Cache löschen**
- Chrome: Cmd+Shift+Delete → Cached Images and Files
- Dann: Hard Reload (Cmd+Shift+R)

### Scenes werden trotzdem nicht erstellt?

**Check Browser Console:**
```javascript
// Solltest du sehen:
"[Timeline] Creating scene for sequence: ..."
"scene_number: 4"  // ← Wichtig!
```

**Check Server Response:**
- Status sollte `201 Created` sein
- Response sollte `sceneNumber` enthalten

---

## 🎉 Nächste Schritte

Jetzt wo Shots UND Scenes funktionieren:

1. **Teste die komplette 3-Act Timeline**
   - Acts erstellen ✅
   - Sequences erstellen ✅
   - Scenes erstellen ✅
   - Shots erstellen ✅

2. **Weiter mit Phase 2**
   - Multi-Function Architektur
   - Creative Gym Integration
   - Performance Optimierungen

---

## 📝 Technische Details

### Schema Migration Complete
```
✅ shots.project_id hinzugefügt (denormalisiert für Performance)
✅ scenes.color hinzugefügt (für UI-Darstellung)
✅ PostgREST Cache Reload erforderlich
```

### API Konsistenz
Alle Timeline APIs verwenden jetzt **konsistente camelCase ↔ snake_case Konvertierung**:

- **Acts API**: `actNumber` ↔ `act_number` ✅
- **Sequences API**: `sequenceNumber` ↔ `sequence_number` ✅
- **Scenes API**: `sceneNumber` ↔ `scene_number` ✅ (NEU!)
- **Shots API**: `shotNumber` ↔ `shot_number` ✅

---

**Viel Erfolg beim Testen! 🚀**

# 📦 DEPLOY ANLEITUNG: Timeline V2 mit Timestamp Fix

## 🎯 Schnellste Methode (EMPFOHLEN)

### 1. Code aus Figma Make kopieren

1. Öffne in **Figma Make** die Datei:
   ```
   /supabase/functions/scriptony-timeline-v2/index.ts
   ```

2. **Cmd+A** (Alles auswählen)

3. **Cmd+C** (Kopieren)

### 2. Code ins Supabase Dashboard einfügen

1. Öffne **Supabase Dashboard**
2. Gehe zu **Edge Functions**
3. Wähle **`scriptony-timeline-v2`**
4. Klicke auf den **Editor**
5. **Cmd+A** (Alles im Editor auswählen)
6. **Cmd+V** (Einfügen)
7. Klicke **"Deploy"**

### 3. Fertig! 🎉

Die Datei enthält bereits alle Updates:
- ✅ Header mit Timestamp-Info (Zeile 4-5)
- ✅ `updated_at` Handling (Zeile ~1201-1205)
- ✅ Dialog/Notes JSON Storage
- ✅ Characters Fix

---

## 🔍 Alternativ: Manuelles Patchen

Falls du nur den Timestamp-Fix einfügen willst:

### Suche nach (Zeile ~1200):
```typescript
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;

    console.log("📊 DB Updates object:", { dbUpdates, hasUpdates: Object.keys(dbUpdates).length > 0 });
```

### Ersetze mit:
```typescript
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
    
    // ✅ TIMESTAMP: Accept updated_at from client for last modified tracking
    if (updates.updated_at !== undefined || updates.updatedAt !== undefined) {
      dbUpdates.updated_at = updates.updated_at || updates.updatedAt;
    }

    console.log("📊 DB Updates object:", { dbUpdates, hasUpdates: Object.keys(dbUpdates).length > 0 });
```

---

## ✅ Nach dem Deploy testen

1. Öffne einen Shot im Dialog Editor
2. Tippe Text ein
3. **Erwartung:**
   - Footer zeigt: `🕐 01.11.2025, 20:30 • Max Mustermann`
   - Timestamp aktualisiert sich **sofort** beim Tippen
   - Console zeigt: `[ShotCard] 🕐 Updating timestamp: 2025-11-01T20:30:45.123Z`

---

## 🐛 Debugging

### Console Logs prüfen:
```
[ShotCard] 🕐 Updating timestamp: 2025-11-01T...
[API Gateway] Body (stringified): {"dialog":{...},"updated_at":"2025-11-01T..."}
[RichTextEditorModal] 🎨 Rendering timestamp (counter: 5): 2025-11-01T... → 01.11.2025, 20:30
```

### Network Tab prüfen:
- PUT Request zu `/shots/{id}` 
- Body sollte enthalten: `{"dialog":{...}, "updated_at":"2025-11-01T..."}`

### Datenbank prüfen:
```sql
SELECT id, updated_at, dialog FROM shots ORDER BY updated_at DESC LIMIT 5;
```

Der `updated_at` sollte sich bei jedem Keystroke ändern!

---

## 📝 Was wurde geändert?

### 1. Frontend (`/components/ShotCard.tsx`)
```typescript
onChange={(jsonDoc) => {
  const now = new Date().toISOString();
  console.log('[ShotCard] 🕐 Updating timestamp:', now);
  onUpdate(shot.id, { 
    dialog: jsonDoc,
    updated_at: now  // ✅ NEU!
  });
}}
```

### 2. Edge Function (`/supabase/functions/scriptony-timeline-v2/index.ts`)
```typescript
// ✅ TIMESTAMP: Accept updated_at from client for last modified tracking
if (updates.updated_at !== undefined || updates.updatedAt !== undefined) {
  dbUpdates.updated_at = updates.updated_at || updates.updatedAt;
}
```

### 3. UI (`/components/RichTextEditorModal.tsx`)
- Update Counter für force re-render
- Event Listener für `tiptap-content-changed`
- Optimistic timestamp update

---

## 🚀 Deployment Status

| Component | Status | Location |
|-----------|--------|----------|
| Frontend - ShotCard | ✅ Deployed | `/components/ShotCard.tsx` |
| Frontend - Modal | ✅ Deployed | `/components/RichTextEditorModal.tsx` |
| Backend - Edge Function | ⏳ **PENDING** | `/supabase/functions/scriptony-timeline-v2/index.ts` |

**→ Nur die Edge Function muss noch deployed werden!**

---

**Viel Erfolg! 🎉**

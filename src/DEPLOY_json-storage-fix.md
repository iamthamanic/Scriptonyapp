# 🚀 DEPLOY: JSON Storage Fix für Dialog & Notes

**🕐 Deploy Date: 2025-11-01 15:45 UTC**  
**📦 Affected Function: scriptony-timeline-v2**  
**🎯 Version: v2.1.0 - JSON Storage Fix**

## Problem
Dialog & Notes wurden **doppelt serialisiert** als `JSON.stringify(JSON)` → String statt direktes JSON Objekt.

## Lösung implementiert

### 1. Frontend Fix (ShotCard.tsx)
```typescript
// ❌ VORHER:
onChange={(jsonDoc) => {
  onUpdate(shot.id, { dialog: JSON.stringify(jsonDoc) }); // Doppelte Serialisierung!
}}

// ✅ JETZT:
onChange={(jsonDoc) => {
  onUpdate(shot.id, { dialog: jsonDoc }); // Direktes JSON Objekt!
}}
```

### 2. Backend Fix (scriptony-timeline-v2/index.ts)

**WICHTIG:** Füge diesen Code in die `PUT /shots/:id` Route ein (ca. Zeile 1167-1171):

```typescript
    // ✅ DIALOG & NOTES: Accept both JSON object and string (backward compatibility)
    if (updates.dialog !== undefined) {
      let dialog = updates.dialog;
      // If it's a string, try to parse it (legacy data)
      if (typeof dialog === 'string') {
        try {
          dialog = JSON.parse(dialog);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      dbUpdates.dialog = dialog;
    }
    
    if (updates.notes !== undefined) {
      let notes = updates.notes;
      // If it's a string, try to parse it (legacy data)
      if (typeof notes === 'string') {
        try {
          notes = JSON.parse(notes);
        } catch {
          // Keep as string if not valid JSON
        }
      }
      dbUpdates.notes = notes;
    }
```

**Ersetze die alten zwei Zeilen:**
```typescript
// ❌ ALT (entfernen):
if (updates.dialog !== undefined) dbUpdates.dialog = updates.dialog;
if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
```

### 3. Display Fix (ShotCard.tsx)

Dialog & Notes werden jetzt mit **ReadonlyTiptapView** angezeigt:
- ✅ Blaue Character Pills (@name)
- ✅ Rich Text Formatting
- ✅ Keine Plain Text Textarea mehr

## Deploy Anleitung

### Option A: Supabase Dashboard
1. Öffne Supabase Dashboard → Edge Functions → `scriptony-timeline-v2`
2. Suche nach Zeile ~1170 (nach `reference_image_url`)
3. Ersetze die zwei alten Zeilen durch den neuen Code oben
4. Klick "Deploy"

### Option B: Deployment File
Die komplette Datei liegt bereit in:
```
/supabase/functions/scriptony-timeline-v2/index.ts
```

Kopiere den **gesamten Inhalt** und füge ihn im Supabase Dashboard ein.

## Backwards Compatibility ✅

Der Fix ist **100% abwärtskompatibel**:
- Alte String-Daten werden automatisch geparsed
- Neue JSON-Objekte werden direkt gespeichert
- Keine Migration nötig!

## Testing

Nach dem Deploy teste:

1. **Neuen Dialog erstellen** → Speichern → Reload → Character Pills sichtbar? ✅
2. **Zweites @ tippen** → Dropdown öffnet sofort? ✅
3. **Alten Dialog öffnen** → Wird korrekt angezeigt? ✅

## Was wurde gefixt

✅ Keine doppelte JSON Serialisierung mehr
✅ Backend akzeptiert beide Formate (String + Object)
✅ Character Pills werden in ShotCard angezeigt
✅ Maximize Buttons neben Labels
✅ @ Dropdown öffnet instant (auch zweites @)
✅ Normale Spaces statt NBSP (kein Matcher-Problem mehr)

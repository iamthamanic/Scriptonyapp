# 🕐 DEPLOY: Timeline V2 mit Timestamp Feature

**Datum:** 2025-11-01 20:00 UTC  
**Feature:** Last Modified Timestamp Tracking

## 📋 Deployment Anleitung

### 1. Code kopieren

Da die Edge Function sehr groß ist (>2000 Zeilen), musst du den Code direkt aus dem Editor kopieren:

1. Öffne in Figma Make: `/supabase/functions/scriptony-timeline-v2/index.ts`
2. Cmd+A (Alles auswählen)
3. Cmd+C (Kopieren)

### 2. Code deployen

1. Öffne Supabase Dashboard
2. Gehe zu Edge Functions → `scriptony-timeline-v2`
3. Cmd+A (Alles auswählen im Editor)
4. Cmd+V (Einfügen)
5. Deploy klicken

## ✅ Was geändert wurde

Die aktuelle Datei enthält bereits ALLE Fixes:

### Header (Zeile 4-5)
```typescript
 * 🕐 LAST UPDATED: 2025-11-01 20:00 UTC
 * 📝 CHANGE: Last Modified Timestamp - Accept updated_at from client
```

### Shot Update Route (Zeile ~1201-1205)
```typescript
    if (updates.orderIndex !== undefined) dbUpdates.order_index = updates.orderIndex;
    
    // ✅ TIMESTAMP: Accept updated_at from client for last modified tracking
    if (updates.updated_at !== undefined || updates.updatedAt !== undefined) {
      dbUpdates.updated_at = updates.updated_at || updates.updatedAt;
    }

    console.log("📊 DB Updates object:", { dbUpdates, hasUpdates: Object.keys(dbUpdates).length > 0 });
```

## 🧪 Test nach Deploy

1. Öffne Shot Dialog Editor
2. Tippe Text ein
3. **Erwartung:**
   - Footer zeigt: `🕐 01.11.2025, 20:15 • Max Mustermann`
   - Timestamp aktualisiert sich sofort
   - Console: `[ShotCard] 🕐 Updating timestamp: 2025-11-01T20:15:23.456Z`
   - Network: Request Body enthält `{"dialog":{...}, "updated_at":"..."}`

## 📝 Changelog

- ✅ Frontend sendet `updated_at` im Request Body (ShotCard.tsx)
- ✅ Edge Function akzeptiert `updated_at` Parameter
- ✅ UI aktualisiert sich optimistic mit Force Re-Render

## 🔍 Wenn es nicht funktioniert

1. **Check Console:**
   ```
   [ShotCard] 🕐 Updating timestamp: ...
   [API Gateway] Body: {"dialog":{...},"updated_at":"..."}
   ```

2. **Check Network Tab:**
   - PUT `/shots/{id}` sollte `updated_at` im Body haben

3. **Check DB:**
   ```sql
   SELECT id, updated_at FROM shots ORDER BY updated_at DESC LIMIT 5;
   ```

## 📌 Wichtig

Die komplette Edge Function wurde bereits in `/supabase/functions/scriptony-timeline-v2/index.ts` aktualisiert!

**Du musst sie nur noch ins Supabase Dashboard kopieren.**

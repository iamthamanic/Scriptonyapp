# 🔧 SHOTS CAMELCASE FIX - DEPLOY ANLEITUNG

## ❗ PROBLEM
Die Shots werden erstellt, aber das Frontend kann sie nicht lesen, weil:
- Server gibt `snake_case` zurück (`scene_id`, `shot_number`)
- Frontend erwartet `camelCase` (`sceneId`, `shotNumber`)

## ✅ LÖSUNG
Die `/supabase/functions/server/routes-shots.tsx` wurde gefixt mit camelCase Transformation!

## 📋 WIE DEPLOYEN?

### Option 1: Server komplett neu deployen (EMPFOHLEN)

Da die `routes-shots.tsx` in der `index.tsx` importiert wird, musst du die komplette Edge Function neu deployen.

**ABER:** Das Dashboard unterstützt keine Module/Imports!

### Option 2: Komplette inline Version (Dashboard-kompatibel)

Ich erstelle eine neue `DASHBOARD-TIMELINE-COMPLETE.ts` Datei die:
- Alle Timeline-Routes (Acts, Sequences, Scenes, Shots) enthält
- Alle Transformationen inline hat
- KEINE Imports nutzt
- Im Dashboard einfügbar ist

##⚠️ WICHTIG

Die Timeline-Routes wurden NOCH NICHT ins Dashboard deployed!

Das bedeutet:
- ✅ Lokal in `index.tsx` funktioniert es
- ❌ Im Supabase Dashboard ist es NICHT deployed

## 🚀 NÄCHSTER SCHRITT

Ich erstelle jetzt eine **komplette inline Version** für dich zum Copy & Paste!


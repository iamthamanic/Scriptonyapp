# 🚨 MANUELLE UMBENENNUNG ERFORDERLICH

## Problem
Die Datei `/components/FilmTimeline.tsx` (2407 Zeilen) ist zu groß für das automatische write_tool in Figma Make.

## Warum diese Umbenennung wichtig ist
**KI-Verständnis & Precision**: Wenn die Datei `FilmTimeline.tsx` heißt, aber die Komponente `FilmDropdown` heißt, führt das zu Missverständnissen bei zukünftigen Anweisungen wie "ändere FilmTimeline".

## Was bereits geändert wurde ✅
- ✅ Komponente heißt: `FilmDropdown`  
- ✅ Interface heißt: `FilmDropdownProps`
- ✅ Alle Logs: `[FilmDropdown]`
- ✅ Import in ProjectsPage: `import { FilmDropdown } from "../FilmDropdown"`

## ⚠️ Was noch fehlt
- ❌ Datei heißt noch: `/components/FilmTimeline.tsx`
- ❌ Import funktioniert nicht, weil Datei fehlt: `/components/FilmDropdown.tsx`

## 📝 Manuelle Schritte (in Figma Make Desktop App)

### Option 1: Im Code Editor
1. Öffne `/components/FilmTimeline.tsx`
2. Kopiere den **kompletten Inhalt** (alle 2407 Zeilen)
3. Erstelle eine neue Datei `/components/FilmDropdown.tsx`
4. Füge den Inhalt ein
5. Lösche `/components/FilmTimeline.tsx`

### Option 2: Im Filesystem (falls verfügbar)
```bash
mv /components/FilmTimeline.tsx /components/FilmDropdown.tsx
```

## Status nach Umbenennung
```
✅ Datei: /components/FilmDropdown.tsx
✅ Export: FilmDropdown
✅ Import: import { FilmDropdown } from "../FilmDropdown"
✅ Usage: <FilmDropdown projectId={...} />
```

## Verification
Nach der Umbenennung sollte die App ohne Fehler laufen und der Import in `ProjectsPage.tsx` sollte funktionieren.

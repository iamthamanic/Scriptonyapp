# 🔧 FIX: Projekt-Titel wird nicht gespeichert

**Problem:** Wenn der Titel eines Projekts geändert wird, speichert er zwar im Backend, aber sobald man aus dem Projekt raus geht, ist wieder der alte Name sichtbar.

## 🔍 Ursache

Das Problem tritt auf, weil:

1. ✅ Der Titel wird erfolgreich im Backend gespeichert (API Call funktioniert)
2. ❌ Der lokale `projects` State wird NICHT aktualisiert nach dem Save
3. ❌ Beim Verlassen und Zurückkehren wird der alte State-Wert angezeigt (aus dem Cache)

## 🛠️ LÖSUNG

Es gibt **2 mögliche Ansätze**:

### Option A: State nach Update refreshen (Empfohlen)

Nach jedem Project-Update den kompletten `projects` State neu laden:

```typescript
const handleUpdateProjectTitle = async (projectId: string, newTitle: string) => {
  try {
    // Update im Backend
    await projectsApi.update(projectId, { title: newTitle });
    
    // ✅ WICHTIG: Projects neu laden um State zu synchronisieren
    await loadData();
    
    toast.success("Projekt gespeichert");
  } catch (error) {
    console.error("Error updating project:", error);
    toast.error("Fehler beim Speichern");
  }
};
```

### Option B: State lokal optimistisch updaten (Schneller)

Den State sofort lokal aktualisieren, ohne auf Backend Response zu warten:

```typescript
const handleUpdateProjectTitle = async (projectId: string, newTitle: string) => {
  try {
    // ✅ Optimistic Update: State sofort aktualisieren
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === projectId 
          ? { ...p, title: newTitle, updated_at: new Date().toISOString() }
          : p
      )
    );
    
    // Backend Update (async)
    await projectsApi.update(projectId, { title: newTitle });
    
    toast.success("Projekt gespeichert");
  } catch (error) {
    console.error("Error updating project:", error);
    
    // ❌ Bei Fehler: State zurückrollen
    await loadData();
    
    toast.error("Fehler beim Speichern");
  }
};
```

## 📝 WO ÄNDERN?

In `/components/pages/ProjectsPage.tsx`:

1. **Finde** die Funktion, die den Projekt-Titel updated (wahrscheinlich in der Project Detail Sektion)
2. **Füge hinzu:** Entweder `await loadData()` ODER optimistic State-Update mit `setProjects()`

## 🧪 TEST

Nach dem Fix:

1. Öffne ein Projekt
2. Ändere den Titel
3. Speichere
4. Verlasse das Projekt (zurück zur Projektliste)
5. **ERWARTUNG:** Der neue Titel sollte in der Liste sichtbar sein
6. Öffne das Projekt erneut
7. **ERWARTUNG:** Der neue Titel sollte immer noch da sein

## ⚡ QUICK FIX (Wenn du die genaue Stelle nicht findest)

**Temporärer Workaround:** Cache deaktivieren

In `ProjectsPage.tsx`, ändere:

```typescript
// Vor dem Fix: Cache verhindert Reload
const dataLoadedRef = useRef(false);

useEffect(() => {
  if (!dataLoadedRef.current) {
    loadData();
    dataLoadedRef.current = true;
  }
}, []);
```

Nach dem Fix: Immer neu laden (kein Cache):

```typescript
useEffect(() => {
  // TEMPORARY: Immer neu laden, kein Cache
  loadData();
}, [selectedProject]); // Reload wenn selectedProject ändert
```

**Hinweis:** Dieser Workaround ist weniger performant, funktioniert aber sofort!

## 🎯 BESTE LÖSUNG (Kombination)

```typescript
// 1. Optimistic Update für instant Feedback
const handleUpdateProject = async (projectId: string, updates: any) => {
  // Optimistic: Sofort updaten
  setProjects(prev => prev.map(p => 
    p.id === projectId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
  ));
  
  try {
    // Backend update
    const updated = await projectsApi.update(projectId, updates);
    
    // Sync mit Backend-Response (falls Backend Daten transformiert)
    setProjects(prev => prev.map(p => 
      p.id === projectId ? updated : p
    ));
    
    toast.success("Gespeichert");
  } catch (error) {
    // Rollback bei Fehler
    await loadData();
    toast.error("Fehler beim Speichern");
  }
};
```

## ✅ ERWARTETES ERGEBNIS

Nach dem Fix:
- ✅ Titel ändert sich im Backend
- ✅ Titel ändert sich sofort in der UI (optimistic)
- ✅ Titel bleibt nach Verlassen/Zurückkehren erhalten
- ✅ Titel ist korrekt nach Seiten-Refresh

---

**Erstellt:** 2025-11-02  
**Priorität:** HOCH (User Experience Problem)  
**Zeitaufwand:** 5-10 Minuten

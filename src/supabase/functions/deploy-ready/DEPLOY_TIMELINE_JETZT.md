# 🚀 DEPLOY TIMELINE JETZT - SCHRITT FÜR SCHRITT

## ❗ DAS PROBLEM

Der deployed Server im Supabase Dashboard hat **ALTE** Shots-Code ohne camelCase Conversion!

**Error:**
```
POST /shots 400 (Bad Request)
{"error":"scene_id and shot_number are required"}
```

**Ursache:** Server erwartet `shot_number` (snake_case), aber Frontend sendet `shotNumber` (camelCase)

---

## ✅ DIE LÖSUNG

Ich habe eine **komplette Timeline-Only Version** erstellt die:
- ✅ Alle Timeline-Routes hat (Acts, Sequences, Scenes, Shots)
- ✅ **BEIDE** Formate akzeptiert: `shotNumber` UND `shot_number`
- ✅ **IMMER** camelCase zurückgibt
- ✅ Keine Imports - alles inline
- ✅ Dashboard-ready (kein lokales Filesystem needed)

---

## 📋 DEPLOY SCHRITTE

### **Schritt 1: Code kopieren**

1. Öffne `/supabase/functions/deploy-ready/DASHBOARD-TIMELINE-ONLY.ts`
2. **Cmd+A** (alles markieren)
3. **Cmd+C** (kopieren)

### **Schritt 2: Dashboard öffnen**

1. Gehe zu: https://supabase.com/dashboard/project/ctkouztastyirjywiduc
2. Linke Sidebar → **Edge Functions**
3. Klicke auf **make-server-3b52693b**

### **Schritt 3: Code einfügen**

1. Lösche den **kompletten** alten Code im Editor
2. **Cmd+V** (neuen Code einfügen)
3. Klicke auf **Save & Deploy** (unten rechts)

### **Schritt 4: Warten**

- ⏳ Deployment dauert ~30-60 Sekunden
- ✅ Du siehst "Deployment successful"

### **Schritt 5: Testen**

1. **Cmd+R** in Figma Make Desktop App
2. Gehe zu einem Project → Timeline
3. Klicke auf **"Ersten Shot hinzufügen"**
4. ✅ Shot sollte jetzt erstellt werden!

---

## 🎯 WAS DER NEUE CODE MACHT

### **Input-Seite (Frontend → Server):**
```typescript
// Akzeptiert BEIDE Formate:
const scene_id = body.scene_id || body.sceneId;
const shot_number = body.shot_number || body.shotNumber;
const camera_angle = body.camera_angle || body.cameraAngle;
```

### **Output-Seite (Server → Frontend):**
```typescript
// Gibt IMMER camelCase zurück:
{
  id: data.id,
  sceneId: data.scene_id,     // ✅ camelCase
  shotNumber: data.shot_number,  // ✅ camelCase
  cameraAngle: data.camera_angle, // ✅ camelCase
  ...
}
```

---

## ⚠️ WICHTIG

### **Was ist in dieser Version enthalten:**
- ✅ Timeline-Routes (Acts, Sequences, Scenes, Shots)
- ✅ Projects Init (3-Act Structure)
- ✅ Health Check

### **Was ist NICHT enthalten:**
- ❌ AI Chat
- ❌ Worlds
- ❌ Characters
- ❌ Episodes
- ❌ Shot Images Upload
- ❌ Shot Audio Upload

**Wenn du diese Features brauchst, musst du die vollständige Version deployen!**

Aber für Timeline-Funktionalität **reicht diese Version!**

---

## 🐛 TROUBLESHOOTING

### **"Deployment failed"**
→ Stelle sicher, dass du den **kompletten** Code kopiert hast (1144 Zeilen)

### **"Still getting 400 error"**
→ Warte 1-2 Minuten nach Deployment (Edge Function Cache)
→ Dann **Cmd+R** in der App

### **"404 Not Found"**
→ Stelle sicher, dass die Function **make-server-3b52693b** heißt

### **"Unauthorized"**
→ Logout → Login in der App

---

## ✅ NACH DEM DEPLOY

Du solltest sehen:
```
[Timeline] handleAddShot called with sceneId: xxx
[Timeline] Got token: yes
[Timeline] Creating shot for scene: xxx Current shots: 0
[Shots API] Creating shot: {...}
[Shots API] Response status: 201  ← ✅ 201 statt 400!
[Shots API] Success result: {...}
[Timeline] Shot created: {id: 'xxx', sceneId: 'xxx', shotNumber: '1', ...}
```

---

## 🚀 LOS GEHT'S!

1. Öffne `DASHBOARD-TIMELINE-ONLY.ts`
2. Cmd+A → Cmd+C
3. Gehe zu Supabase Dashboard
4. Einfügen → Save & Deploy
5. Warten
6. Testen!

**5 Minuten und dein Shot-Problem ist gelöst!** 💪

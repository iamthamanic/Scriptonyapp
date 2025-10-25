# ⚡ QUICK DECISIONS - BEANTWORTE DIESE 10 FRAGEN

## 🎯 ZWECK
Schnelle Entscheidungen treffen um voranzukommen!

---

## 📝 FRAGEN (1-10)

### **1. MVP Template:**
```
□ Nur Film (alles andere später)
□ Film + Serie (beide im MVP)
□ Alle Templates gleichzeitig
```

---

### **2. Serie Struktur:**
```
□ Staffeln → Episoden → Acts → Sequences → Scenes → Shots (wie Film pro Episode)
□ Staffeln → Episoden → Scenes → Shots (flacher)
□ Anderes: _____________
```

---

### **3. Buch Struktur:**
```
□ Kapitel → Szenen (kein Timeline)
□ Kapitel → Szenen → "Beats" (statt Shots)
□ Kapitel → Absätze (sehr simpel)
□ Später entscheiden (nicht im MVP)
```

---

### **4. Datenbank Ansatz:**
```
□ Eine Tabelle für alles (projects + template_type field)
□ Template-spezifische Tabellen (film_projects, series_projects, etc.)
□ Hybrid (shared + template-specific)
```

---

### **5. Edge Functions Aufteilung:**
```
□ Option A: Feature-basiert (projects, timeline, worldbuilding, ai)
□ Option B: Template-basiert (film, series, book, theater)
□ Option C: Hybrid (core + template-extensions)
```

---

### **6. MVP Feature-Scope (Film):**
```
Welche MÜSSEN ins MVP?

□ Shot Creation ← KRITISCH (aktueller Bug!)
□ Shot Editing
□ Shot Image Upload
□ Shot Audio Upload
□ Character Assignment to Shots
□ Timeline View (Acts → Seqs → Scenes → Shots)
□ AI Assistant
□ Export (PDF)
□ Worldbuilding Integration
□ Storyboard View

Check alles was MUSS. Rest = Post-MVP.
```

---

### **7. Deployment Strategie:**
```
□ Jetzt Shot-Bug fixen (Monolith), später Multi-Function
□ Jetzt Multi-Function aufbauen, dann Shot-Bug
□ Beides parallel (riskant!)
```

---

### **8. Template Selection:**
```
User erstellt Project:

□ "Neues Projekt" → Template wählen (Film/Serie/Buch)
□ "Neuer Film" Button (separater Button pro Template)
□ Erstmal ohne Template, später zuweisen
```

---

### **9. Was blockiert JETZT am meisten?**
```
Priorisiere 1-5:

___ Shot Bug (kann keine Shots erstellen)
___ Deployment Chaos (404 Errors bei Updates)
___ Architektur-Unsicherheit (wie soll das alles werden?)
___ Feature-Entwicklung (neue Sachen bauen ist zu langsam)
___ Performance (App ist zu langsam)
```

---

### **10. Next 3 Priorities (nach Shot-Fix):**
```
1. _____________
2. _____________
3. _____________
```

---

## 🎯 BASIEREND AUF DEINEN ANTWORTEN PLANE ICH:

1. **Edge Function Architektur** (Monolith vs Multi-Function vs Hybrid)
2. **Database Schema** (Template-Support)
3. **Frontend Struktur** (Template Components)
4. **MVP Roadmap** (was jetzt, was später)
5. **Deployment Strategy** (wie wir vorankommen)

---

## ⚡ MEINE EMPFEHLUNG (wenn du unsicher bist):

**MVP:**
- ✅ Nur Film Template
- ✅ Shot Bug fixen (Monolith) → JETZT!
- ✅ Multi-Function Architektur → DANACH in Ruhe

**Post-MVP:**
- ✅ Serie Template (nächstes großes Feature)
- ✅ Buch/Theater später

**Edge Functions:**
- ✅ Feature-basiert (projects, timeline, worldbuilding, ai)
- ✅ Template-Logic INNERHALB der Functions (nicht separate Functions)

**Begründung:**
- 🎯 MVP = Film nur → Fokus!
- 🚀 Shot Bug = JETZT critical → Fix sofort!
- 🏗️ Architektur = später mit mehr Klarheit
- 📈 Erst Film fertig, dann sehen wir was Serie braucht

**Einverstanden? Oder andere Meinung?**

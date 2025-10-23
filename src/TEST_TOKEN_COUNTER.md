# 🧪 Token Counter - Testing Guide

## Quick Test Checklist

### ✅ **Test 1: Backend Token Counting (OpenAI)**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-3b52693b/ai/count-tokens \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog",
    "model": "gpt-4o"
  }'
```

**Erwartetes Ergebnis:**
```json
{
  "tokens": 9,
  "characters": 43,
  "model": "gpt-4o"
}
```

---

### ✅ **Test 2: Backend Token Counting (Claude)**

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/make-server-3b52693b/ai/count-tokens \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog",
    "model": "claude-3-5-sonnet-20241022"
  }'
```

**Erwartetes Ergebnis:**
```json
{
  "tokens": 13,
  "characters": 43,
  "model": "claude-3-5-sonnet-20241022"
}
```

*Note: 13 ist Estimation (~95% genau)*

---

### ✅ **Test 3: Frontend Live Token Counting**

**Schritte:**
1. Öffne App in Browser
2. Klicke auf Floating Chat Button (unten rechts)
3. Tippe langsam: "Hello world"
4. **Beobachte Context Window:**
   - Instant: "~4 / 200K" erscheint
   - Nach 500ms: "4 / 200K" (ohne ~)

**Expected Behavior:**
- Token Count steigt während du tippst
- "~" Symbol verschwindet nach Backend Call
- Progress Bar füllt sich minimal

---

### ✅ **Test 4: Chat Message Token Tracking**

**Schritte:**
1. Öffne Chat
2. Sende Message: "Tell me a joke"
3. Warte auf AI Response
4. **Check Context Window:**
   - Input Tokens: ~5
   - Output Tokens: ~30-50
   - Total: ~35-55

**Expected Behavior:**
- Token Count erhöht sich nach AI Response
- Progress Bar zeigt größeren Prozentsatz
- Keine "~" mehr (exakte Werte vom Backend)

---

### ✅ **Test 5: Model Switch Updates Context**

**Schritte:**
1. Öffne Chat Settings (⚙️ Button)
2. Aktives Modell: "GPT-4o" → Context: 128K
3. Wechsle zu: "Claude 3.5 Sonnet" → Context: 200K
4. Wechsle zu: "Gemini 1.5 Pro" → Context: 2M

**Expected Behavior:**
- Context Window ändert sich sofort
- Token Count bleibt gleich
- Progress Bar % passt sich an

---

### ✅ **Test 6: Warning States**

**Schritte:**
1. Erstelle langes Prompt (copy-paste viel Text)
2. Paste ~100K chars in Input
3. **Check Context Window:**
   - Progress Bar wird **ORANGE** bei >80%
   - Progress Bar wird **ROT** bei >100%

**Expected Behavior:**
- Orange = Warning (near limit)
- Rot = Error (over limit)
- "~" verschwindet nach 500ms

---

### ✅ **Test 7: New Chat Resets Tokens**

**Schritte:**
1. Chat mit ~500 tokens
2. Klicke "New Chat" Button
3. **Check Context Window:**
   - Token Count = 0
   - Progress Bar leer

**Expected Behavior:**
- Counter komplett zurückgesetzt
- Keine Tokens mehr angezeigt

---

## Expected Console Output

### Backend Logs (bei Message Send):

```
[Token Count] Input: 150 tokens (120 user + 30 assistant)
[OpenAI Tokens] Input: 148, Output: 52, Total: 200
```

### Frontend Logs:

```
Token counter initialized: { contextWindow: 200000 }
Counting input tokens (debounced): "Hello world"
Backend token count: 3
Updated from response: { input: 148, output: 52, total: 200 }
```

---

## Troubleshooting

### ❌ "Module not found: gpt-tokenizer"
**Fix:**
```bash
cd supabase/functions
deno cache --reload server/token-counter.tsx
```

### ❌ Token Count immer 0
**Check:**
1. Browser Console für Errors
2. Backend Logs: `supabase functions logs`
3. API Key vorhanden?

### ❌ "~" verschwindet nicht
**Check:**
1. Backend erreichbar?
2. Timeout erhöhen: `debounceMs: 1000`
3. Network Tab: POST /ai/count-tokens erfolgreich?

### ❌ Sehr ungenaue Zahlen
**Expected:**
- OpenAI: ±1 token Differenz = OK
- Claude/Gemini: ±10-20% Differenz = OK (Estimation)

---

## Performance Benchmarks

**Erwartete Zeiten:**

| Operation | Time | Notes |
|-----------|------|-------|
| Local Estimation | <1ms | Instant |
| Backend Call | 50-200ms | Network + Compute |
| gpt-tokenizer | 5-15ms | Pure JS |
| Debounce Delay | 500ms | Configurable |

---

## Edge Cases

### ✅ **Sehr langer Text (100K+ chars)**

**Expected:**
- Frontend: Instant estimation
- Backend: ~100-500ms
- Still responsive UI

### ✅ **Emojis & Unicode**

```typescript
countTokens("Hello 👋 世界", "gpt-4o")
// Should work correctly
```

### ✅ **Empty Input**

```typescript
countTokens("", "gpt-4o")
// Returns: 0 (no error)
```

### ✅ **Rapid Typing**

**Expected:**
- Debouncing works
- Only 1 backend call per 500ms
- No API spam

---

## Success Criteria

✅ Token counting funktioniert ohne Errors
✅ OpenAI: 99%+ Accuracy
✅ Claude/Gemini: ~95% Accuracy
✅ UI responsive (keine Lags)
✅ Debouncing verhindert API Spam
✅ Model Switch updated Context Window
✅ New Chat resettet Counter
✅ Progress Bar färbt sich bei Warning/Error
✅ Backend Logs zeigen Token Details

---

## Next Steps

Wenn alle Tests ✅ sind:

1. **Phase 4 ist DONE** 🎉
2. Optional: **Phase 5 (RAG Upgrade)** starten
3. Oder: Production Deployment vorbereiten

---

**Viel Erfolg beim Testen! 🚀**

Bei Problemen: Check Browser Console + Backend Logs

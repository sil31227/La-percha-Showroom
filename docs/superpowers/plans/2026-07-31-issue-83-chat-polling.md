# Issue #83: useChatStore polling fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar la race condition en `stopPolling` y hacer que `startPolling` haga fetch inmediato de mensajes en `useChatStore`.

**Architecture:** Un solo archivo (`src/store/useChatStore.ts`). `stopPolling` usa un updater funcional de Zustand que hace `clearInterval` y borra la key en el mismo snapshot. `startPolling` llama `fetchMensajes` al inicio y registra el interval como hoy.

**Tech Stack:** Zustand, TypeScript, Next.js. Sin test runner en el proyecto — verificar con `npx tsc --noEmit` y `npm run lint`.

**Repo / issue:** GitHub `sil31227/La-percha-Showroom` — issue #83  
**Worktree:** `.worktrees/fix-issue-83-chat-polling` (branch `fix/issue-83-chat-polling` from `main`)  
**Spec:** `docs/superpowers/specs/2026-07-31-issue-83-chat-polling-design.md`

## Global Constraints

- Solo modificar `src/store/useChatStore.ts` (más docs de spec/plan si se comitean)
- No agregar dependencias ni test framework
- Intervalo sigue en 20000 ms
- Commits: conventional (`fix: ...`)
- Trabajar solo dentro del worktree indicado

---

### Task 1: Fix startPolling + stopPolling

**Files:**
- Modify: `src/store/useChatStore.ts` (funciones `startPolling` y `stopPolling`, ~líneas 77–96)
- Spec/plan already under `docs/superpowers/`

**Interfaces:**
- Consumes: `get`, `set`, `fetchMensajes(conversacionId, token)`
- Produces: mismas firmas públicas  
  - `startPolling: (conversacionId: string, token: string) => void`  
  - `stopPolling: (conversacionId: string) => void`

- [ ] **Step 1: Replace `startPolling` and `stopPolling`**

Reemplazar las dos funciones por:

```ts
  startPolling: (conversacionId, token) => {
    const existing = get().pollingIntervals[conversacionId]
    if (existing) return
    get().fetchMensajes(conversacionId, token)
    const interval = setInterval(() => {
      get().fetchMensajes(conversacionId, token)
    }, 20000)
    set(s => ({
      pollingIntervals: { ...s.pollingIntervals, [conversacionId]: interval },
    }))
  },

  stopPolling: (conversacionId) => {
    set(s => {
      const interval = s.pollingIntervals[conversacionId]
      if (!interval) return s
      clearInterval(interval)
      const next = { ...s.pollingIntervals }
      delete next[conversacionId]
      return { pollingIntervals: next }
    })
  },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`  
Expected: exit 0

- [ ] **Step 3: Lint**

Run: `npm run lint`  
Expected: exit 0 (o sin errores nuevos en este archivo)

- [ ] **Step 4: Commit**

```bash
git add src/store/useChatStore.ts \
  docs/superpowers/specs/2026-07-31-issue-83-chat-polling-design.md \
  docs/superpowers/plans/2026-07-31-issue-83-chat-polling.md
git commit -m "$(cat <<'EOF'
fix: atomic stopPolling and immediate fetch on startPolling

Closes #83
EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Atomic stopPolling via functional set | Task 1 |
| fetchMensajes at start of startPolling | Task 1 |
| Only useChatStore.ts | Task 1 |
| tsc + lint | Task 1 steps 2–3 |

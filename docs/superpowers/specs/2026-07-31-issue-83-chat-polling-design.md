# Issue #83: useChatStore polling — Design

**Repo / issue:** GitHub `sil31227/La-percha-Showroom` — #83  
**Date:** 2026-07-31  
**Status:** Approved (approach A)

## Problem

In `src/store/useChatStore.ts`:

1. **`stopPolling` race:** `get()` then later `set()` are not atomic. If `startPolling` runs between them, an interval can stay alive while its reference is dropped (or a new interval’s ref is wiped).
2. **`startPolling` cold start:** Only schedules `setInterval` (20s). No immediate `fetchMensajes`, so callers that only call `startPolling` wait up to 20s for messages.

## Goals

- Atomic stop: clear interval and remove map entry in one Zustand updater.
- Immediate fetch when polling starts.
- Minimal change: only `useChatStore.ts` behavior for `startPolling` / `stopPolling`.
- No new deps, no test framework (project has none for stores).

## Non-goals

- Moving timers to a module-level `Map` (approach B).
- Changing `ChatWindow` (already fetches then polls; extra fetch from store is fine).
- Realtime/WebSocket chat.

## Approach (A — minimal fix)

### `stopPolling(conversacionId)`

Use a single functional `set`:

- Read `interval` from `s.pollingIntervals[conversacionId]`.
- If missing, return `s` (no-op).
- `clearInterval(interval)`, clone map, delete key, return `{ pollingIntervals: next }`.

Side effects (`clearInterval`) inside the updater are intentional so clear + state update share one snapshot.

### `startPolling(conversacionId, token)`

1. If `get().pollingIntervals[conversacionId]` already set → return (no duplicate intervals).
2. Call `get().fetchMensajes(conversacionId, token)` immediately (fire-and-forget; same as interval callback).
3. Create `setInterval` every 20000ms calling `fetchMensajes`.
4. `set` to store the interval handle under `conversacionId`.

Optional hardening (same file, still YAGNI-safe): create the interval inside a functional `set` that no-ops if the key already exists, so concurrent double-`startPolling` cannot register two timers. Preferred if easy; not required beyond the issue text if the early `get()` guard matches current call sites.

## Data flow

```
ChatWindow mount
  → fetchConversacion → fetchMensajes → startPolling
       startPolling → fetchMensajes (immediate) + setInterval(20s)
unmount / close
  → stopPolling → clearInterval + delete key (atomic)
```

## Error handling

Unchanged: `fetchMensajes` returns on non-OK; no throw. Polling continues on failures.

## Testing / verification

- `npx tsc --noEmit`
- `npm run lint` (or project lint script)
- Manual reasoning: stop then start in quick succession leaves at most one live interval with a stored ref; open chat loads messages without waiting 20s from store alone.

## Files

| File | Change |
|------|--------|
| `src/store/useChatStore.ts` | Fix `startPolling` + `stopPolling` only |

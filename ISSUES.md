# Phase 3 Review — Known Issues

Issues identified after completing Phase 3. Organized by severity. Address before or during the phase each issue first affects.

---

## Critical

### 1. `useSampler` is missing `clipBank` integration

**Affects:** Phase 4 (`ClipManager.jsx`)

**Description:**
`clipBank.js` was fully implemented and tested in Phase 2, but it is never instantiated anywhere in Phase 3. `useSampler` only exposes a raw `loadClip(buffer)` method that pushes an `AudioBuffer` directly into the sampler with no naming, no slot tracking, and no React state for the UI to render from.

`ClipManager.jsx` needs to:
- Display the 5 named clip slots and update when they change
- Let the user upload a file, decode it, and save it under a name
- Let the user click a saved clip to make it the active one
- Let the user delete a saved clip

None of this has a hook surface to land on. `decodeAudioFile` already handles the decode step, but everything after that is missing.

**How to fix:**
In `useSampler.js`, inside the `useEffect` that sets up the audio graph, also call `createClipBank()` and store the result in a ref. Add the following React state and methods:

- `clipSlots` state (array of 5 `{ name, buffer } | null`) — initialize from `clipBank.getSlots()`, update whenever slots change
- `currentClipName` state (string | null) — tracks which clip is loaded into the sampler
- `addClip(name, buffer)` — calls `clipBank.add(name, buffer)`, updates `clipSlots` state; returns false if bank is full or name is duplicate
- `selectClip(name)` — calls `clipBank.select(name)`, passes the buffer to `sampler.loadClip()`, sets `currentClipName`
- `removeClip(name)` — calls `clipBank.remove(name)`, updates `clipSlots` state; if the removed clip was the active one, also clears `currentClipName`

The existing `loadClip` method can remain for internal or programmatic use, but `selectClip` is what `ClipManager.jsx` should call.

Update `useSampler.test.js` to cover all four new methods and the `clipSlots`/`currentClipName` state transitions.

---

## Medium

### 2. Active notes orphaned when `useKeyboard` is disabled

**Affects:** Phase 6 (`Learn.jsx`, mode switching in `App.jsx`)

**Description:**
`useKeyboard` removes its `keydown`/`keyup` listeners when `enabled` flips to `false`. If the user is physically holding one or more keys at that exact moment (e.g. while switching from Free Play to Learn mode), the `keyup` events are never caught. The sampler's voices continue looping indefinitely with no way to stop them through normal interaction. React's `activeNotes` state also stays stale, showing those keys as still held on the keyboard UI.

**How to fix:**
Add a `releaseAll()` method to `useSampler` that calls `sampler.release(note)` for every note in `activeNotes` and then clears the `activeNotes` state. The implementation would look roughly like:

```js
const releaseAll = useCallback(() => {
  if (!samplerRef.current) return
  for (const note of activeNotes) {
    samplerRef.current.release(note)
  }
  setActiveNotes(new Set())
}, [activeNotes])
```

In Phase 6, wherever mode switching happens (likely `App.jsx` or `FreePlay.jsx`), call `releaseAll()` before setting `enabled: false` on `useKeyboard`. This ensures no voice is left hanging during a transition.

Add a test to `useSampler.test.js` verifying that `releaseAll` clears all active notes and delegates to `sampler.release` for each.

---

### 3. Keyboard press as the first user gesture silently does nothing

**Affects:** Phase 4 (`Keyboard.jsx`), Phase 7 (`main.jsx`)

**Description:**
`useKeyboard` calls `trigger(note)` on keydown. `trigger` in `useSampler` silently no-ops when `samplerRef.current` is null (i.e. before the AudioContext has been initialized). A keyboard press is a valid user gesture for `AudioContext` creation, but the current code requires a prior click or some other interaction to have already called `initAudioContext()`. If a keyboard press is the very first thing the user does, no sound plays and there is no feedback.

**How to fix — two options:**

**Option A (simpler):** In Phase 4, build a visible "Click or press a key to start" overlay in the app shell that must be dismissed before the keyboard is usable. Wire that overlay's dismiss handler to `initAudioContext()`. This is the most user-friendly pattern and clearly communicates the audio-requires-gesture constraint. `useKeyboard` itself does not need to change.

**Option B:** Pass `initAudioContext` into `useKeyboard` and call it inside `handleKeyDown` before calling `trigger`:

```js
const handleKeyDown = (event) => {
  if (event.repeat) return
  const note = KEY_MAP[event.key.toLowerCase()]
  if (!note) return
  initAudioContext()  // safe to call repeatedly — no-ops after first call
  trigger(note)
}
```

Option A is recommended because it makes the "audio not started" state explicit to the user rather than silently fixing it mid-keypress.

---

### 4. `useAudioContext` singleton state not broadcast to all consumers

**Affects:** Phase 7 (`App.jsx`, `main.jsx`)

**Description:**
`useState(sharedContext)` initializes with whatever `sharedContext` holds at mount time. After that, only the specific component instance that calls `initAudioContext()` gets its `audioContext` state updated via `setAudioContext`. Any other component that also calls `useAudioContext()` independently (e.g. `App.jsx` watching for audio readiness to show/hide an overlay) will permanently see `audioContext === null`, even after another component has initialized it.

This is a consequence of using module-level state alongside component-local `useState` — the state is shared but the update signal is not.

**How to fix:**
The simplest safe fix for this app: do not have `App.jsx` call `useAudioContext()` independently. Instead, call `useSampler()` at the `App` or `FreePlay` level (wherever it makes sense as the single owner) and pass `isReady` or `initAudioContext` down as props to any component that needs it. This avoids the broadcast problem entirely without adding a Context.

If multiple truly independent consumers of `audioContext` state are needed, the proper fix is to wrap the singleton in a React Context provider in `main.jsx` so that `initAudioContext` calls `setAudioContext` on the Context value, propagating to all subscribers.

---

## Low

### 5. `activeNotes` React state can go stale if a voice ends unexpectedly

**Affects:** Phase 4 (`Keyboard.jsx` visual highlights)

**Description:**
In `sampler.js`, the `source.onended` callback deletes the note from `activeVoices` when a voice ends for any reason. However, it has no way to call `setActiveNotes` in `useSampler`, so React's `activeNotes` state is not updated. The visual keyboard highlight would show a key as still held even though the sampler has already cleaned up that voice internally.

In normal use this is very unlikely to trigger: `source.loop = true` means voices do not end on their own unless `release()` is called (which does update `activeNotes` correctly). The risk is only if a clip has some unusual configuration or if a browser implementation fires `onended` before the loop restarts.

**How to fix (if it becomes an issue):**
Pass an optional `onVoiceEnd` callback into `createSampler` that fires when `onended` removes a note from `activeVoices`. In `useSampler`, supply a callback that calls `setActiveNotes(samplerRef.current.getActiveNotes())`. This keeps the sampler module decoupled while allowing the hook to stay in sync.

Alternatively, `getActiveNotes()` could be polled on each animation frame in `Spectrogram.jsx` (which already reads the analyser on every frame), and the result passed to `Keyboard.jsx`. This avoids adding a callback to the sampler entirely and the spectrogram loop is already running.

---

## Summary Table

| # | Issue | Severity | Fix Before |
|---|-------|----------|------------|
| 1 | `useSampler` missing `clipBank` integration | Critical | Phase 4 starts |
| 2 | Orphaned notes on mode switch | Medium | Phase 6 starts |
| 3 | Keyboard-as-first-gesture silently fails | Medium | Phase 4 starts |
| 4 | `useAudioContext` state not broadcast to all consumers | Medium | Phase 7 starts |
| 5 | `activeNotes` stale on unexpected voice end | Low | Phase 8 final checks |

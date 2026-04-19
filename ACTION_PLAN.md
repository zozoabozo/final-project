## Sampler App — Amp Action Plan

---

### ~~Phase 1: Project Setup~~
1. ~~Scaffold a Vite + React project~~
2. ~~Install dependencies: Tone.js (or Web Audio API), Vitest, Lamejs (MP3 export)~~
3. ~~Create the full directory structure as specified~~
4. ~~Configure Vitest with a jsdom environment~~
5. ~~Create `tests/mocks/audioContext.js` with a stubbed Web Audio API~~

---

### ~~Phase 2: Audio Core~~
1. ~~**`pitchUtils.js`**~~
   - ~~Implement `semitoneToRate(n)` and `noteToSemitone(note)`~~
   - ~~Write and pass tests for both functions~~

2. ~~**`clipBank.js`**~~
   - ~~Implement storage for up to 5 named clips~~
   - ~~Implement add, remove, and select methods~~
   - ~~Write and pass tests~~

3. ~~**`sampler.js`**~~
   - ~~Implement `loadClip(audioBuffer)`~~
   - ~~Implement `trigger(note)` with correct playback rate via `pitchUtils`~~
   - ~~Implement `release(note)` with loop/hold behavior for held keys~~
   - ~~Support simultaneous voices (polyphony)~~
   - ~~Write and pass tests using the mock AudioContext~~

4. ~~**`recorder.js`**~~
   - ~~Implement `startRecording()` and `stopRecording()` using MediaRecorder~~
   - ~~Implement export to `.wav` and `.mp3`~~
   - ~~Write and pass tests~~

---

### ~~Phase 3: Hooks~~
1. ~~**`useAudioContext.js`** — singleton, initialized on first user gesture~~
2. ~~**`useSampler.js`** — connects `sampler.js` to React state~~
3. ~~**`useKeyboard.js`** — maps keydown/keyup events to note trigger/release, suppresses key repeat~~

---

### Phase 4: Core UI Components
1. ~~**`Keyboard.jsx`**~~
   - ~~Render full chromatic keyboard (at minimum C3–C5)~~
   - ~~Handle mouse and keyboard input~~
   - ~~Visually highlight held keys~~

2. ~~**`Spectrogram.jsx`**~~
   - ~~Connect an `AnalyserNode` to the audio graph~~
   - ~~Render real-time frequency data to a canvas element~~
   - ~~Write a test asserting dominant frequency bin matches expected Hz ±5% after a note trigger~~

3. ~~**`ClipManager.jsx`**~~
   - ~~Upload audio file and pass to `clipBank.js`~~
   - ~~Display up to 5 saved clips with select and delete~~

4. ~~**`Recorder.jsx`**~~
   - ~~Start/stop recording controls~~
   - ~~Choose export format (`.wav` / `.mp3`)~~
   - ~~Trigger download on export~~

5. ~~**`Controls.jsx`**~~
   - ~~Compose `ClipManager` and `Recorder` into a single control bar~~

**Note — redundant `onVoiceEnd` on normal release:** `sampler.js` fires `onVoiceEnd` from `source.onended`, which the browser also dispatches when `source.stop()` is called during a normal `release()`. This means every deliberate release triggers `onVoiceEnd` in addition to the explicit `setActiveNotes` call already made by `useSampler.release`. The result is a second `setActiveNotes` call with an identical value — React bails out and no extra render occurs, so behavior is correct. No fix is needed, but be aware of this if profiling or debugging double-state-update warnings.

---

### Phase 5: Song Data
1. Delete `src/songs/furElise.js` and `src/songs/odeToJoy.js` — replaced by `.txt` files
2. **Song format:** plain `.txt` files in `src/songs/`. Each token is `<key><duration>` (e.g., `g2`, `h3`) where the key is a physical keyboard key matching `KEY_MAP` in `useKeyboard.js` and the duration is a positive integer multiplier of a fixed base unit (`BASE_DURATION_MS = 250`ms). Whitespace and empty lines are ignored.
3. Load `.txt` files via Vite's `?raw` import (e.g., `import raw from './odeToJoy.txt?raw'`) — no runtime fetch needed
4. **`src/songs/parseSong.js`** — implement and export `parseSong(raw)` which takes a raw `.txt` string and returns an array of `{ key, duration }` objects; invalid tokens are skipped with a console warning
5. Write `tests/songs.test.js` — validator that:
   - Imports each `.txt` file via `?raw` and runs `parseSong` on it
   - Asserts every token matches the pattern `/^[a-zA-Z0-9]\d+$/`
   - Asserts every key exists in `KEY_MAP`
   - Asserts every duration is a positive integer
6. The user (not the agent) creates and populates all `.txt` song files

---

### Phase 6: Modes

**Shared layout:** Extract a `PlayLayout.jsx` component that composes `Keyboard`, `Controls`, and `Spectrogram`. Both `FreePlay` and `Learn` (on its play screen) render `PlayLayout` — `Learn` simply slots the song panel above the keyboard inside that layout.

1. **`PlayLayout.jsx`** — shared base: `Keyboard` + `Controls` + `Spectrogram`. Accepts an optional `topPanel` prop rendered above the keyboard.

2. **`FreePlay.jsx`** — renders `PlayLayout` with no `topPanel`. No other changes.

3. **`Learn.jsx`** — two internal views managed by local state:

   **Song Selection View:**
   - Lists all `.txt` song files from `src/songs/` (imported statically via `?raw`)
   - Each song entry shows:
     - Song name
     - **Play button** — plays the full song through using a built-in default audio sample (a short sine-wave tone or similar bundled asset; no user clip required). Toggles to a **Stop button** while playback is active. Stopping early halts playback immediately.
     - **Learn button** — navigates to the Learn Play View for that song
   - The built-in preview sample must be bundled with the app (e.g., placed in `public/assets/samples/`) so no upload is needed

   **Learn Play View** (navigated to after clicking Learn on a song):
   - Renders `PlayLayout` (identical to Free Play: full clip upload, clip manager, recorder, spectrogram, keyboard)
   - Adds a **scrollable song panel** above the keyboard (via `PlayLayout`'s `topPanel` prop) displaying the raw `.txt` file content of the selected song. The panel has a fixed max-height so it doesn't dominate the screen; overflow scrolls vertically.
   - Adds a **Help button** (e.g., a `?` button near the song panel header) that opens a modal or inline overlay explaining the token syntax (`<key><duration>`, base unit, valid keys, etc.)
   - Adds a **Play Song button** near the song panel that triggers full playback of the song using the currently loaded user clip (same playback engine as the preview, but using the user's clip). Toggles to Stop while playing.
   - Adds a **Back button** that returns to the Song Selection View

---

### Phase 7: App Shell
1. **`App.jsx`** — mode switcher (Free Play / Learn) with nav; Explore is removed
2. **`main.jsx`** — mount app, ensure `AudioContext` is not initialized before user gesture

---

### Phase 8: Final Checks
1. Run full test suite — iterate until all tests pass
2. Test polyphony (chords, overlapping notes)
3. Test hold behavior (no clip restart while key is held)
4. Test clip switching mid-session
5. Test recording export in both formats
6. Verify spectrogram reflects correct frequencies across octaves

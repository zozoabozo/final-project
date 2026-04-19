## Sampler App — Amp Action Plan

---

### Phase 1: Project Setup
1. Scaffold a Vite + React project
2. Install dependencies: Tone.js (or Web Audio API), Vitest, Lamejs (MP3 export)
3. Create the full directory structure as specified
4. Configure Vitest with a jsdom environment
5. Create `tests/mocks/audioContext.js` with a stubbed Web Audio API

---

### Phase 2: Audio Core
1. **`pitchUtils.js`**
   - Implement `semitoneToRate(n)` and `noteToSemitone(note)`
   - Write and pass tests for both functions

2. **`clipBank.js`**
   - Implement storage for up to 5 named clips
   - Implement add, remove, and select methods
   - Write and pass tests

3. **`sampler.js`**
   - Implement `loadClip(audioBuffer)`
   - Implement `trigger(note)` with correct playback rate via `pitchUtils`
   - Implement `release(note)` with loop/hold behavior for held keys
   - Support simultaneous voices (polyphony)
   - Write and pass tests using the mock AudioContext

4. **`recorder.js`**
   - Implement `startRecording()` and `stopRecording()` using MediaRecorder
   - Implement export to `.wav` and `.mp3`
   - Write and pass tests

---

### Phase 3: Hooks
1. **`useAudioContext.js`** — singleton, initialized on first user gesture
2. **`useSampler.js`** — connects `sampler.js` to React state
3. **`useKeyboard.js`** — maps keydown/keyup events to note trigger/release, suppresses key repeat

---

### Phase 4: Core UI Components
1. **`Keyboard.jsx`**
   - Render full chromatic keyboard (at minimum C3–C5)
   - Handle mouse and keyboard input
   - Visually highlight held keys

2. **`Spectrogram.jsx`**
   - Connect an `AnalyserNode` to the audio graph
   - Render real-time frequency data to a canvas element
   - Write a test asserting dominant frequency bin matches expected Hz ±5% after a note trigger

3. **`ClipManager.jsx`**
   - Upload audio file and pass to `clipBank.js`
   - Display up to 5 saved clips with select and delete

4. **`Recorder.jsx`**
   - Start/stop recording controls
   - Choose export format (`.wav` / `.mp3`)
   - Trigger download on export

5. **`Controls.jsx`**
   - Compose `ClipManager` and `Recorder` into a single control bar

**Note — redundant `onVoiceEnd` on normal release:** `sampler.js` fires `onVoiceEnd` from `source.onended`, which the browser also dispatches when `source.stop()` is called during a normal `release()`. This means every deliberate release triggers `onVoiceEnd` in addition to the explicit `setActiveNotes` call already made by `useSampler.release`. The result is a second `setActiveNotes` call with an identical value — React bails out and no extra render occurs, so behavior is correct. No fix is needed, but be aware of this if profiling or debugging double-state-update warnings.

---

### Phase 5: Song Data
1. Define a song data format: array of `{ note, duration }` objects
2. Implement `furElise.js`
3. Implement `odeToJoy.js`
4. Write a validator test that checks all song files conform to the format

---

### Phase 6: Modes
1. **`FreePlay.jsx`** — compose `Keyboard`, `Controls`, and `Spectrogram`

2. **`Learn.jsx`**
   - Song selection menu
   - Sheet/key guide overlay on `Keyboard` showing next notes
   - Playback engine that steps through the song data and triggers notes
   - Play/pause/stop controls

3. **`Explore.jsx`**
   - Display list of user-shared songs (mock data initially)
   - Download clip button per entry
   - Share form: upload `.mp3`/`.wav` + song metadata

---

### Phase 7: App Shell
1. **`App.jsx`** — mode switcher (Free Play / Learn / Explore) with nav
2. **`main.jsx`** — mount app, ensure `AudioContext` is not initialized before user gesture

---

### Phase 8: Final Checks
1. Run full test suite — iterate until all tests pass
2. Test polyphony (chords, overlapping notes)
3. Test hold behavior (no clip restart while key is held)
4. Test clip switching mid-session
5. Test recording export in both formats
6. Verify spectrogram reflects correct frequencies across octaves
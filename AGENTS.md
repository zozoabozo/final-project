# AGENTS.md

---

## Project Overview

This is a React + Vite web application that functions as a sampler instrument. Users upload short audio clips, map them across a keyboard, play notes (including chords and held notes), record their sessions, and export audio.

---

## Project Structure

```
sampler-app/
├── public/
│   └── assets/
│       └── samples/              # default audio clips
├── src/
│   ├── audio/
│   │   ├── sampler.js            # core: load clip, pitch-shift, trigger/release
│   │   ├── recorder.js           # MediaRecorder + WAV/MP3 export
│   │   ├── clipBank.js           # manage up to 5 saved clips
│   │   └── pitchUtils.js         # semitone math, playback rate calculation
│   ├── components/
│   │   ├── Keyboard.jsx          # visual keyboard + input handling
│   │   ├── Controls.jsx          # composes ClipManager and Recorder
│   │   ├── ClipManager.jsx       # upload, name, switch between 5 clips
│   │   ├── Spectrogram.jsx       # real-time canvas frequency visualizer
│   │   └── Recorder.jsx          # record, format select, export/download
│   ├── hooks/
│   │   ├── useAudioContext.js    # singleton AudioContext, first-gesture init
│   │   ├── useSampler.js         # bridge between sampler.js and React state
│   │   └── useKeyboard.js        # keydown/keyup → note trigger/release
│   ├── modes/
│   │   ├── PlayLayout.jsx        # shared base: Keyboard + Controls + Spectrogram; accepts optional topPanel prop
│   │   ├── FreePlay.jsx          # renders PlayLayout with no topPanel
│   │   └── Learn.jsx             # song selection view + learn play view (PlayLayout + song panel + help + playback)
│   ├── songs/
│   │   ├── parseSong.js          # parses raw .txt song string into { key, duration } array
│   │   ├── furElise.txt          # song data in <key><duration> token format
│   │   ├── maryHadALittleLamb.txt
│   │   ├── odeToJoy.txt
│   │   └── twinkleTwinkleLittleStar.txt
│   ├── App.jsx                   # mode switcher + nav (Free Play / Learn)
│   └── main.jsx                  # app entry point
├── tests/
│   ├── mocks/
│   │   └── audioContext.js       # stubbed Web Audio API for Vitest
│   ├── pitchUtils.test.js
│   ├── clipBank.test.js
│   ├── sampler.test.js
│   ├── recorder.test.js
│   └── spectrogram.test.js
├── AGENTS.md
├── package.json
└── README.md
```

Do not deviate from this structure without permission. See the **File Rules** section below.

---

## File Rules

- **Do not create any new files without first asking for permission.** Describe what file you want to create, where it will live, and why it is needed. Wait for approval before proceeding.
- **Do not create `.md` files** unless explicitly instructed to do so.
- If a task can be completed by modifying an existing file, always prefer that over creating a new one.

---

## After Every Implementation

After completing any implementation — whether a new feature, a new module, or a bug fix — you must do all of the following, in order:

### 1. Start and Run the Application
Boot the development server and confirm the app loads without errors in the browser. Check the browser console for runtime errors. Do not mark an implementation as complete if the app fails to start or throws errors on load.

```bash
npm run dev
```

### 2. Write a Summary of What Changed
Write a short summary of exactly what you did. Keep it simple — assume the reader is not a developer. Follow this format:

**What changed:** One sentence describing the feature or fix.

**Files modified:** A plain list of every file you touched and one sentence per file explaining what you changed in it.

**Why it matters:** One to two sentences explaining what the user can now do that they couldn't before, or what problem was fixed.

Example:

> **What changed:** Added the pitch calculation utility so the app knows what playback speed to use for each note.
>
> **Files modified:**
> - `src/audio/pitchUtils.js` — Created this file. It contains two functions: one that converts a note name like "C#4" into a number, and one that converts that number into a playback speed.
> - `tests/pitchUtils.test.js` — Created this file. It checks that the math is correct for a set of known notes.
>
> **Why it matters:** The keyboard can now correctly play back the audio clip at the right pitch for each key pressed.

---

## Testing Rules

### Write Tests for Every Implementation
Every time you implement something new — a module, a component, a hook, a song file — you must write a corresponding test file or add tests to an existing relevant test file. No implementation is complete without tests.

### Test Location
All test files live in `tests/`. Mock files live in `tests/mocks/`. Match the name of the module being tested (e.g., `clipBank.js` → `clipBank.test.js`).

### Run All Tests After Every Implementation
After finishing an implementation and writing its tests, run the full test suite — not just the new tests:

```bash
npm test
```

### Fix Failing Tests Before Moving On
If any test fails — including tests from a previous implementation — stop and fix it before proceeding. Do not skip or comment out failing tests. Follow this cycle:

1. Run all tests
2. If a test fails, identify why
3. Fix the root cause in the source code or the test itself (whichever is wrong)
4. Re-run all tests
5. Repeat until every test passes

Do not consider any implementation done until the full suite is green.

### Test Timeout Rule
If any test or the test suite as a whole takes longer than **1 minute** to complete, stop the run and diagnose the cause before continuing. Common causes to check:

- An `AudioContext` or other Web API object being instantiated at module load time instead of lazily
- A mock that never resolves (hanging promise)
- A test that is waiting on a real timer instead of using fake timers
- A feedback loop or infinite retry in async logic

Fix the root cause, then re-run. Do not raise the timeout threshold as a workaround.

### Audio Testing Approach
The Web Audio API is not available in the Vitest/jsdom environment. Use the mock in `tests/mocks/audioContext.js` for all audio module tests. The mock must stub at minimum: `createBufferSource`, `createGain`, `createAnalyser`, `connect`, `start`, `stop`, and `destination`.

For the spectrogram, after a note trigger, assert that the dominant frequency bin from `getFloatFrequencyData` is within ±5% of the expected Hz for the triggered note.

---

## General Behavior Rules

- **Never modify `AGENTS.md`** unless explicitly instructed.
- **Prefer small, focused changes.** Do not refactor unrelated code while implementing a feature.
- **Do not install new dependencies** without asking first. State what the package is, why it's needed, and whether anything in the existing stack could serve the same purpose.
- **Do not touch song data files** (`furElise.js`, `odeToJoy.js`, etc.) while working on audio or UI tasks, and vice versa.
- **The `AudioContext` singleton must not initialize before a user gesture.** Browsers block audio until interaction. Enforce this in `useAudioContext.js`.
- When implementing polyphony, each triggered note must be an independent voice. Triggering one note must not cut off another that is already playing.
- When implementing hold behavior, the audio clip must not restart while the key is held. The note should loop or sustain at pitch, and stop cleanly on key release.

# Vibe Coding Final Project - super sound samplr
## CS 3960 HW 5 | Zoe Linn

### Week 14
### super sound samplr overview

#### What is this project?

super sound samplr is a browser-based sampler instrument. You upload any short audio clip — a dog bark, a voice recording, a sound effect, anything — and the app maps it across a full chromatic keyboard, letting you play it at any pitch. Press multiple keys at once for chords, hold keys to sustain notes, and record your session to download as a `.wav` or `.mp3`. There is also a Learn mode that lets you preview and follow along with built-in songs using your own uploaded sounds. To see what this looks like in action, follow this link --> https://youtu.be/iK0FWzlodVg.
NOTE: unfortunately you can't hear the sounds *sad face* in the video. Follow this link --> https://youtu.be/aTU_QekLKAQ to see the entire application in action.

#### How to boot up the application

1. Make sure you have [Node.js](https://nodejs.org/) installed (v18 or later recommended).
2. Clone or download this repository.
3. In your terminal, navigate to the project folder and install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open the local URL shown in the terminal (e.g. `http://localhost:5173`) in your browser. Click anywhere on the page first — browsers require a user gesture before audio can play.

#### How to use the application

**Free Play mode**
- Click **+ Upload** in the Clips panel to load an audio file. Files longer than 1 second will open a cropping tool — drag the handles to select the portion you want, then click Confirm.
- Up to 5 clips can be saved at once. Click a clip name to make it the active sound; click × to remove it.
- Play notes using your keyboard (see the on-screen keyboard for key mappings) or click the keys directly with your mouse. Keys can be held and played simultaneously.
- Use the **Record** button to capture your session, then export it as `.wav` or `.mp3`.

**Learn mode**
- Browse the list of built-in songs. Hit **Play** to preview a song using a default tone, or **Learn** to open the song in the play view.
- In the Learn play view, the song's note tokens are displayed in a scrollable panel. Load your own clip and use the **Play Song** button to hear the song played with your sound. Hit **?** for a guide to the token syntax.
- The Back button returns you to the song list. Your loaded clips carry over between Free Play and Learn.

#### Special features

- **Audio cropping tool** — Any clip longer than 1 second opens an interactive cropper with a waveform visualization. Drag the start and end handles to select exactly the part you want (0.5–1.0 seconds). Preview your selection before confirming.
- **Polyphony** — Multiple notes (up to two) can play simultaneously. Every key press is its own independent voice, so chords and overlapping notes work naturally.
- **Clip bank** — Save up to 5 different sounds in a session and switch between them on the fly. Clips persist across Free Play and Learn mode.
- **Real-time spectrogram** — A live frequency visualizer reacts to every note you play.
- **Dancing dog** — ???

#### Deviation from Proposal
This project deviates from my proposal in, honestly, not that many ways. A lot of what I planned worked out besides getting the clips to hold rather than repeat when keys are held. 

---

### Week 13

So far in my project, I've...
1. Created an AGENTS.md file applicable to this project, specifying aspects like how to go about testing, interactions with the terminal and files, etc. 
2. Created an action plan that detailed how to setup the project, the specific structure and modularity of the program, each specific file's role and necessary elements, UI details, and more
3. Implementing said action plan through executing phases 1 and 2, which are setting up the various files, installing node.js and other necessary elements, and filling in the audio files like clipBank.js, pitchUtils.js, recorder.js, and sampler.js, which do the following:

' pitchUtils.js — semitoneToRate and noteToSemitone use the standard 2^(n/12) formula. The note string format ("C4", "C#4", "Bb3") is consistent with what the keyboard (Phase 4) and song data (Phase 5) will produce. The spectrogram test in Phase 4 will also use noteToSemitone to calculate expected Hz — the formula is correct for that.

clipBank.js — getSlots() returns all five slots (filled or null), which is exactly what ClipManager.jsx (Phase 4) needs to render the clip list. add/remove/select cover every action the UI needs. No issues.

sampler.js — The outputNode (GainNode) is intentionally not auto-connected to ctx.destination. In Phase 3, useSampler.js will wire: sampler.outputNode → AnalyserNode → destination and sampler.outputNode → recorder.inputNode. Both branches need to tap the same output node, which this design supports cleanly. getActiveNotes() returns a fresh Set copy on each call — Keyboard.jsx will call this to highlight held keys without risking mutation of internal state. loop = true on each voice is correct per AGENTS.md ("loop or sustain at pitch").

recorder.js — The inputNode (MediaStreamDestination) is created once at construction time, not on each startRecording(). This is intentional: the audio graph connection (sampler.outputNode.connect(recorder.inputNode)) only needs to be made once in Phase 3, then start/stop can be called freely without rewiring. FileReader is used instead of Blob.arrayBuffer() because jsdom's Blob implementation doesn't expose that method when the blob is constructed from other Blobs — in a real browser both work, but FileReader is the safer path. '

I also find it important to note that due to strange amp issues and not being able to connect the ide to amp, I've resorted to using Claude Code. So far I find it successful in its implementations up to this point, though I do notice that it takes longer than Amp to implement code. I also chose to begin with Amp as I felt that at this current moment, Claude might be more applicable in my future since I see it more commonly mentioned and used within the field, despite Amp being a stronger coding agent. I'm eager to see how it jumps hurdles later on since I'm sure we'll run into some issues with implementation later on in future phases.

Currently, I haven't seen Claude do anything dumb or strange. I hope that's an okay answer since it's an honest one. I did get worried that it might have missed something in a previous step of the action plan and asked for it to look over all code one more time before finishing up phase 2, and it managed to catch a specific aspect related to ux where if a user were to add two audio clips of the same name, it would take both of them or overwrite one of them. Since it caught this, it asked how to handle the situation, where I specified to just not allow duplicates. I found it helpful that it managed to already catch a potential future bug and suggest fixing it so early on. I'm hoping that this flow continues on in the next week.

### Proposal (Week 12)

The application I'm proposing to create is essentially a sampler instrument application. The user will be able to upload a short sound clip. The user will then be able to use the sound clip on a keyboard, which will map the sound clip to the different pitches (c d e f g a b and their sharps and flats). For example the user could upload a clip of their dog barking and use their dog bark to create a song using a keyboard interface.

There are a few additional features I will want added to this application. 
- I want the user to be able to record their playing, which can be saved onto their computer as a .mp3 or .wav. 
- Sound clips can be saved within the program, meaning that up to five sound effects can be used and interchanged.
- - The user should be able to play multiple notes at a time, like chords (meaning notes can overlap)
- Notes should be able to be held, meaning that if a note needs to be held, the sound clip should be modifiable within the code so that if the user is holding a key it holds a pitch and doesn’t keep repeating the audio clip.
- Allotted time after everything else is complete, I want the user to be able to create and download "sheet music", which will just be text based off of the keyboard letters (notes on keyboard). Based on certain syntax of this typed sheet music, the program will be able to playback different songs with varying rhythms, pitches, and more.

When creating this program, my current plan is to spend tons of time with Amp on necessary organization and planning to make sure everything works out the way I want to. I learned a ton from the text editor in how to create a concise prompt and early planning to make organization and structure creation smooth, including creating stuff like an AGENTS.md file and creating a file structure early on. In terms of feedback mechanisms, I'll have Amp write tons of tests and execute them with each new prompt that's fed to it. I myself will have to do a lot of manual testing since there's a decent chance not everything will go to plan with the audio, but the good thing is that once the general audio kinks are figured out the rest will be up to amp and its hijinks.

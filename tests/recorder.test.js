import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createRecorder } from '../src/audio/recorder.js'
import { createMockAudioContext } from './mocks/audioContext.js'

// lamejs relies on globals defined only inside its UMD bundle (lame.min.js).
// When Vitest resolves the package it hits the unbundled source files instead,
// so those globals are never set up.  Mock the encoder — the test only verifies
// the returned Blob's MIME type, not the encoded bytes.
vi.mock('lamejs', () => ({
  default: {
    Mp3Encoder: class {
      encodeBuffer() { return new Int8Array(0) }
      flush() { return new Int8Array([0xff, 0xfb, 0x90, 0x00]) }
    },
  },
}))

// MediaRecorder is not available in jsdom — provide a synchronous mock.
// stop() immediately fires ondataavailable then onstop so Promise-based
// tests resolve without needing fake timers.
class MockMediaRecorder {
  constructor(stream) {
    this.stream = stream
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
    this.start = vi.fn(() => {
      this.state = 'recording'
    })
    this.stop = vi.fn(() => {
      this.state = 'inactive'
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['audio-chunk'], { type: 'audio/webm' }) })
      }
      if (this.onstop) this.onstop()
    })
  }
}

describe('recorder', () => {
  let ctx, recorder
  const savedMediaRecorder = global.MediaRecorder

  beforeEach(() => {
    global.MediaRecorder = MockMediaRecorder
    ctx = createMockAudioContext()
    recorder = createRecorder(ctx)
  })

  afterEach(() => {
    global.MediaRecorder = savedMediaRecorder
  })

  it('startRecording: initializes MediaRecorder and begins recording', () => {
    expect(recorder.isRecording()).toBe(false)
    recorder.startRecording()
    expect(recorder.isRecording()).toBe(true)
  })

  it('stopRecording: stops the MediaRecorder and collects chunks into a Blob', async () => {
    recorder.startRecording()
    const blob = await recorder.stopRecording()
    expect(blob).toBeInstanceOf(Blob)
    expect(recorder.isRecording()).toBe(false)
  })

  it('stopRecording: resolves null when called without an active recording', async () => {
    const result = await recorder.stopRecording()
    expect(result).toBeNull()
  })

  it('exportWav: returns a Blob with audio/wav MIME type', async () => {
    recorder.startRecording()
    await recorder.stopRecording()
    const wav = await recorder.exportWav()
    expect(wav).toBeInstanceOf(Blob)
    expect(wav.type).toBe('audio/wav')
  })

  it('exportWav: throws if called before any recording', async () => {
    await expect(recorder.exportWav()).rejects.toThrow()
  })

  it('exportMp3: returns a Blob with audio/mpeg MIME type', async () => {
    recorder.startRecording()
    await recorder.stopRecording()
    const mp3 = await recorder.exportMp3()
    expect(mp3).toBeInstanceOf(Blob)
    expect(mp3.type).toBe('audio/mpeg')
  })

  it('exportMp3: throws if called before any recording', async () => {
    await expect(recorder.exportMp3()).rejects.toThrow()
  })

  it('startRecording: resets chunks from a previous recording', async () => {
    recorder.startRecording()
    await recorder.stopRecording()
    // Second recording session should produce a fresh blob, not a combined one
    recorder.startRecording()
    const blob2 = await recorder.stopRecording()
    expect(blob2).toBeInstanceOf(Blob)
  })
})

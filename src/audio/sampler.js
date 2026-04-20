import { semitoneToRate, noteToSemitone } from './pitchUtils.js'

/**
 * Sampler core — loads an AudioBuffer and triggers pitched voices.
 * Supports polyphony (each note is an independent voice).
 * Supports hold behavior (no restart while key is held).
 *
 * Audio graph:
 *   BufferSource(s) → outputNode (GainNode)
 *
 * Wire outputNode into your graph (analyser, destination, etc.) externally.
 * In Phase 3, useSampler.js handles that connection.
 */

// The clip plays at rate 1.0 when this note is triggered.
const BASE_NOTE = 'C4'

// Semitone range to pre-render (covers C3–C5 keyboard range relative to C4 base).
const SEMITONE_RANGE = Array.from({ length: 25 }, (_, i) => i - 12)

// Pre-render the buffer pitched to `rate` using an OfflineAudioContext.
// The rendered buffer has the same duration as the original so all notes
// loop at the same wall-clock speed.
async function preRenderAtRate(sampleRate, numberOfChannels, length, originalBuffer, rate) {
  const offlineCtx = new OfflineAudioContext(numberOfChannels, length, sampleRate)
  const src = offlineCtx.createBufferSource()
  src.buffer = originalBuffer
  src.playbackRate.value = rate
  src.loop = true // wrap content to fill the full duration when rate > 1
  src.connect(offlineCtx.destination)
  src.start(0)
  return offlineCtx.startRendering()
}

export function createSampler(audioContext, { onVoiceEnd } = {}) {
  let buffer = null
  let preRenderedBuffers = new Map() // semitone offset → pre-rendered AudioBuffer
  const activeVoices = new Map() // note string → BufferSourceNode

  // All voices route through this node so downstream processors
  // (AnalyserNode, MediaStreamDestination, etc.) can tap one output.
  const outputNode = audioContext.createGain()

  return {
    /**
     * The master output GainNode. Connect this into your audio graph.
     * e.g. outputNode.connect(analyserNode); analyserNode.connect(ctx.destination)
     */
    outputNode,

    /**
     * Store the decoded AudioBuffer and pre-render a pitch-shifted variant for
     * every semitone in SEMITONE_RANGE. Returns a Promise that resolves when all
     * variants are ready; triggers fall back to rate-changed playback until then.
     * @param {AudioBuffer} audioBuffer
     * @returns {Promise<void>}
     */
    async loadClip(audioBuffer) {
      buffer = audioBuffer
      preRenderedBuffers = new Map()
      const { numberOfChannels, length, sampleRate } = audioBuffer
      await Promise.all(
        SEMITONE_RANGE.map(async (s) => {
          const rate = semitoneToRate(s)
          const rendered = await preRenderAtRate(sampleRate, numberOfChannels, length, audioBuffer, rate)
          preRenderedBuffers.set(s, rendered)
        })
      )
    },

    /**
     * Trigger a note. Creates an independent voice (polyphony).
     * Silently ignored if no clip is loaded or the note is already held.
     * @param {string} note - e.g. "C4", "F#3", "Bb5"
     */
    trigger(note) {
      if (!buffer) return
      if (activeVoices.has(note)) return // hold: no restart while key is held

      const semitones = noteToSemitone(note) - noteToSemitone(BASE_NOTE)
      const source = audioContext.createBufferSource()

      // Use the pre-rendered buffer (same duration, different pitch) so the clip
      // plays at the same speed on every key. Falls back to rate-changed playback
      // while pre-rendering is still in progress.
      const preRendered = preRenderedBuffers.get(semitones)
      if (preRendered) {
        source.buffer = preRendered
        source.playbackRate.value = 1.0
      } else {
        source.buffer = buffer
        source.playbackRate.value = semitoneToRate(semitones)
      }
      source.loop = true // sustain pitch while key is held
      source.connect(outputNode)
      source.start()

      // Safety cleanup if the source ends for any reason other than release()
      source.onended = () => {
        activeVoices.delete(note)
        onVoiceEnd?.()
      }
      activeVoices.set(note, source)
    },

    /**
     * Release a held note and stop its voice cleanly.
     * Silently ignored if the note is not currently active.
     * @param {string} note
     */
    release(note) {
      const source = activeVoices.get(note)
      if (!source) return
      activeVoices.delete(note)
      try { source.stop() } catch (_) {
        // InvalidStateError: source already stopped or context suspended
      }
    },

    /**
     * Returns the set of currently active (held) note names.
     * Used by Keyboard.jsx to visually highlight held keys.
     * @returns {Set<string>}
     */
    getActiveNotes() {
      return new Set(activeVoices.keys())
    },
  }
}

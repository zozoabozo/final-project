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

export function createSampler(audioContext) {
  let buffer = null
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
     * Store the decoded AudioBuffer that will be pitched and played.
     * @param {AudioBuffer} audioBuffer
     */
    loadClip(audioBuffer) {
      buffer = audioBuffer
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
      source.buffer = buffer
      source.playbackRate.value = semitoneToRate(semitones)
      source.loop = true // sustain pitch while key is held
      source.connect(outputNode)
      source.start()

      // Safety cleanup if the source ends for any reason other than release()
      source.onended = () => activeVoices.delete(note)
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
      source.stop()
      activeVoices.delete(note)
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

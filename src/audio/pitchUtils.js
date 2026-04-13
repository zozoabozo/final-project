/**
 * Convert a semitone offset to a playback rate multiplier.
 * 0 semitones = 1.0 (no pitch shift), 12 semitones = 2.0 (one octave up).
 * @param {number} n - Semitone offset from base note
 * @returns {number} Playback rate
 */
export function semitoneToRate(n) {
  return Math.pow(2, n / 12)
}

const NOTE_INDICES = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
}

/**
 * Convert a note name (e.g. "C4", "C#4", "Bb3") to a semitone number
 * relative to C0.
 * @param {string} note - Note name with octave (e.g. "C4", "C#4", "Bb3")
 * @returns {number} Semitone number relative to C0
 */
export function noteToSemitone(note) {
  const match = note.match(/^([A-G][b#]?)(-?\d+)$/)
  if (!match) throw new Error(`Invalid note: ${note}`)
  const [, name, octaveStr] = match
  const index = NOTE_INDICES[name]
  if (index === undefined) throw new Error(`Unknown note name: ${name}`)
  return parseInt(octaveStr, 10) * 12 + index
}

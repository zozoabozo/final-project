import { useEffect } from 'react'

// Physical key → note mapping covering C3–C5.
// Lower block (z row) = C3–B3, upper block (q row) = C4–C5.
export const KEY_MAP = {
  // C3 octave — white keys on z row, black keys on a row
  z: 'C3', s: 'C#3', x: 'D3', d: 'D#3', c: 'E3',
  v: 'F3', f: 'F3', g: 'F#3', b: 'G3', h: 'G#3', n: 'A3',
  j: 'A#3', m: 'B3',
  // C4 octave — white keys on q row, black keys on number row
  q: 'C4', 2: 'C#4', w: 'D4', 3: 'D#4', e: 'E4',
  r: 'F4', 5: 'F#4', t: 'G4', 6: 'G#4', y: 'A4',
  7: 'A#4', u: 'B4', i: 'C5',
}

/**
 * Attaches keyboard listeners that map physical keys to note trigger/release.
 * Key repeat is suppressed so holding a key doesn't retrigger the note.
 *
 * @param {object} params
 * @param {(note: string) => void} params.trigger
 * @param {(note: string) => void} params.release
 * @param {boolean} [params.enabled=true] - set false to detach listeners (e.g. during Learn playback)
 */
export function useKeyboard({ trigger, release, initAudioContext, enabled = true }) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event) => {
      if (event.repeat) return
      const note = KEY_MAP[event.key.toLowerCase()]
      if (!note) return
      initAudioContext?.()
      trigger(note)
    }

    const handleKeyUp = (event) => {
      const note = KEY_MAP[event.key.toLowerCase()]
      if (note) release(note)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [trigger, release, initAudioContext, enabled])
}

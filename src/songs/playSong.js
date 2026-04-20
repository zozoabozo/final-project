/**
 * Schedules playback of a token sequence through trigger/release callbacks.
 * Returns a cancel function that immediately stops all scheduled and active notes.
 *
 * @param {Array<{note: string, duration: number}>} tokens - from parseSong()
 * @param {Function} trigger - (note: string) => void
 * @param {Function} release - (note: string) => void
 * @param {Function} releaseAll - () => void  — stops all currently active voices
 * @param {Function} onDone - called when the last note has been released
 * @returns {Function} cancel — call to stop playback immediately
 */
export function playSong(tokens, trigger, release, releaseAll, onDone) {
  let cancelled = false
  const timeouts = []
  let elapsed = 0

  for (const { note, duration } of tokens) {
    const start = elapsed
    timeouts.push(setTimeout(() => { if (!cancelled) trigger(note) }, start))
    timeouts.push(setTimeout(() => { if (!cancelled) release(note) }, start + duration))
    elapsed += duration
  }

  timeouts.push(setTimeout(() => { if (!cancelled) onDone() }, elapsed))

  return () => {
    cancelled = true
    timeouts.forEach(clearTimeout)
    releaseAll()
  }
}

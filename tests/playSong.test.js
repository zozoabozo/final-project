import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { playSong } from '../src/songs/playSong.js'

describe('playSong', () => {
  let trigger, release, releaseAll, onDone

  beforeEach(() => {
    vi.useFakeTimers()
    trigger = vi.fn()
    release = vi.fn()
    releaseAll = vi.fn()
    onDone = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers notes at the correct elapsed times', () => {
    const tokens = [
      { note: 'C4', duration: 250 },
      { note: 'D4', duration: 500 },
    ]
    playSong(tokens, trigger, release, releaseAll, onDone)

    vi.advanceTimersByTime(0)
    expect(trigger).toHaveBeenCalledWith('C4')
    expect(trigger).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(250)
    expect(release).toHaveBeenCalledWith('C4')
    expect(trigger).toHaveBeenCalledWith('D4')
    expect(trigger).toHaveBeenCalledTimes(2)
  })

  it('releases each note after its duration', () => {
    const tokens = [
      { note: 'C4', duration: 250 },
      { note: 'D4', duration: 500 },
    ]
    playSong(tokens, trigger, release, releaseAll, onDone)

    vi.advanceTimersByTime(750)
    expect(release).toHaveBeenCalledWith('C4')
    expect(release).toHaveBeenCalledWith('D4')
  })

  it('calls onDone after the last note release', () => {
    const tokens = [{ note: 'C4', duration: 250 }]
    playSong(tokens, trigger, release, releaseAll, onDone)

    vi.advanceTimersByTime(249)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('cancel before any timeout fires prevents all triggers and calls releaseAll', () => {
    const tokens = [
      { note: 'C4', duration: 250 },
      { note: 'D4', duration: 250 },
    ]
    const cancel = playSong(tokens, trigger, release, releaseAll, onDone)

    cancel()

    vi.advanceTimersByTime(10000)
    expect(trigger).not.toHaveBeenCalled()
    expect(release).not.toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
    expect(releaseAll).toHaveBeenCalledTimes(1)
  })

  it('cancel mid-song stops remaining timeouts and calls releaseAll', () => {
    const tokens = [
      { note: 'C4', duration: 250 },
      { note: 'D4', duration: 250 },
      { note: 'E4', duration: 250 },
    ]
    const cancel = playSong(tokens, trigger, release, releaseAll, onDone)

    // Let first note trigger
    vi.advanceTimersByTime(0)
    expect(trigger).toHaveBeenCalledWith('C4')
    expect(trigger).toHaveBeenCalledTimes(1)

    cancel()
    expect(releaseAll).toHaveBeenCalledTimes(1)

    // No further triggers or releases or onDone should fire
    vi.advanceTimersByTime(10000)
    expect(trigger).toHaveBeenCalledTimes(1)
    expect(release).not.toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('cancel after all notes fire is a no-op for timers but still calls releaseAll', () => {
    const tokens = [{ note: 'C4', duration: 250 }]
    const cancel = playSong(tokens, trigger, release, releaseAll, onDone)

    vi.advanceTimersByTime(250)
    expect(onDone).toHaveBeenCalledTimes(1)

    cancel()
    expect(releaseAll).toHaveBeenCalledTimes(1)
    // No extra onDone
    vi.advanceTimersByTime(10000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('handles empty token list — calls onDone immediately and cancel is safe', () => {
    const cancel = playSong([], trigger, release, releaseAll, onDone)

    vi.advanceTimersByTime(0)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(trigger).not.toHaveBeenCalled()

    cancel()
    expect(releaseAll).toHaveBeenCalledTimes(1)
  })

  it('second cancel call is a no-op', () => {
    const tokens = [{ note: 'C4', duration: 250 }]
    const cancel = playSong(tokens, trigger, release, releaseAll, onDone)

    cancel()
    cancel()
    expect(releaseAll).toHaveBeenCalledTimes(2) // releaseAll called each time — harmless
    vi.advanceTimersByTime(10000)
    expect(trigger).not.toHaveBeenCalled()
  })
})

describe('playSong — releaseAll integration with useSampler', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('releaseAll captured before triggers fires correctly at cancel time', () => {
    // Simulates the stale-closure scenario: releaseAll is captured once
    // when startSongPlayback is first created, then notes are triggered later.
    const activeNotes = new Set()
    const sampler = {
      trigger: vi.fn((note) => activeNotes.add(note)),
      release: vi.fn((note) => activeNotes.delete(note)),
      getActiveNotes: vi.fn(() => new Set(activeNotes)),
    }

    // releaseAll reads from sampler at call-time (not captured state)
    const releaseAll = () => {
      for (const note of sampler.getActiveNotes()) {
        sampler.release(note)
      }
    }

    const tokens = [
      { note: 'C4', duration: 500 },
      { note: 'E4', duration: 500 },
    ]

    const cancel = playSong(tokens, sampler.trigger, sampler.release, releaseAll, vi.fn())

    // Advance so first note triggers
    vi.advanceTimersByTime(0)
    expect(activeNotes.has('C4')).toBe(true)

    // Advance so second note triggers too (before either releases)
    vi.advanceTimersByTime(500)
    expect(activeNotes.has('E4')).toBe(true)

    // Cancel — releaseAll must stop both active notes
    cancel()
    expect(activeNotes.size).toBe(0)
    expect(sampler.release).toHaveBeenCalledWith('C4')
    expect(sampler.release).toHaveBeenCalledWith('E4')
  })
})

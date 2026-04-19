import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useKeyboard } from '../src/hooks/useKeyboard.js'

function fireKey(type, key, extra = {}) {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, ...extra }))
}

describe('useKeyboard', () => {
  let trigger
  let release

  beforeEach(() => {
    trigger = vi.fn()
    release = vi.fn()
  })

  it('triggers the correct note on keydown', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => fireKey('keydown', 'z'))
    expect(trigger).toHaveBeenCalledWith('C3')
  })

  it('releases the correct note on keyup', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => fireKey('keyup', 'z'))
    expect(release).toHaveBeenCalledWith('C3')
  })

  it('suppresses key repeat on keydown', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => fireKey('keydown', 'z', { repeat: true }))
    expect(trigger).not.toHaveBeenCalled()
  })

  it('ignores keys not in the map', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => {
      fireKey('keydown', 'F1')
      fireKey('keydown', 'Escape')
      fireKey('keydown', 'p')
    })
    expect(trigger).not.toHaveBeenCalled()
  })

  it('maps uppercase input (caps lock) to the same note', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => fireKey('keydown', 'Z'))
    expect(trigger).toHaveBeenCalledWith('C3')
  })

  it('maps number row keys to sharps in C4 octave', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    act(() => fireKey('keydown', '2'))
    expect(trigger).toHaveBeenCalledWith('C#4')
    act(() => fireKey('keydown', '5'))
    expect(trigger).toHaveBeenCalledWith('F#4')
  })

  it('covers the full C3–C5 range without gaps in white keys', () => {
    renderHook(() => useKeyboard({ trigger, release }))
    const whiteKeys = [
      ['z', 'C3'], ['x', 'D3'], ['c', 'E3'], ['v', 'F3'],
      ['b', 'G3'], ['n', 'A3'], ['m', 'B3'],
      ['q', 'C4'], ['w', 'D4'], ['e', 'E4'], ['r', 'F4'],
      ['t', 'G4'], ['y', 'A4'], ['u', 'B4'], ['i', 'C5'],
    ]
    act(() => whiteKeys.forEach(([key]) => fireKey('keydown', key)))
    whiteKeys.forEach(([, note]) => {
      expect(trigger).toHaveBeenCalledWith(note)
    })
  })

  it('does not attach listeners when enabled is false', () => {
    renderHook(() => useKeyboard({ trigger, release, enabled: false }))
    act(() => fireKey('keydown', 'z'))
    expect(trigger).not.toHaveBeenCalled()
  })

  it('detaches listeners when enabled switches to false', () => {
    let enabled = true
    const { rerender } = renderHook(() =>
      useKeyboard({ trigger, release, enabled })
    )

    act(() => fireKey('keydown', 'z'))
    expect(trigger).toHaveBeenCalledTimes(1)

    enabled = false
    rerender()

    act(() => fireKey('keydown', 'z'))
    expect(trigger).toHaveBeenCalledTimes(1) // no new call
  })

  it('removes listeners on unmount', () => {
    const { unmount } = renderHook(() => useKeyboard({ trigger, release }))
    unmount()
    act(() => fireKey('keydown', 'z'))
    expect(trigger).not.toHaveBeenCalled()
  })

  it('calls initAudioContext on keydown when provided', () => {
    const initAudioContext = vi.fn()
    renderHook(() => useKeyboard({ trigger, release, initAudioContext }))
    act(() => fireKey('keydown', 'z'))
    expect(initAudioContext).toHaveBeenCalledTimes(1)
  })

  it('does not call initAudioContext for unmapped keys', () => {
    const initAudioContext = vi.fn()
    renderHook(() => useKeyboard({ trigger, release, initAudioContext }))
    act(() => fireKey('keydown', 'F1'))
    expect(initAudioContext).not.toHaveBeenCalled()
  })

  it('does not call initAudioContext on key repeat', () => {
    const initAudioContext = vi.fn()
    renderHook(() => useKeyboard({ trigger, release, initAudioContext }))
    act(() => fireKey('keydown', 'z', { repeat: true }))
    expect(initAudioContext).not.toHaveBeenCalled()
  })
})

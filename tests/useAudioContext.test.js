import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMockAudioContext } from './mocks/audioContext.js'

// Reset the module between tests so the module-level singleton is cleared.
beforeEach(() => {
  vi.resetModules()
  window.AudioContext = vi.fn(() => createMockAudioContext())
})

describe('useAudioContext', () => {
  it('returns null audioContext before init is called', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const { result } = renderHook(() => useAudioContext())
    expect(result.current.audioContext).toBeNull()
  })

  it('exposes initAudioContext as a function', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const { result } = renderHook(() => useAudioContext())
    expect(typeof result.current.initAudioContext).toBe('function')
  })

  it('creates an AudioContext after initAudioContext is called', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const { result } = renderHook(() => useAudioContext())

    act(() => { result.current.initAudioContext() })

    expect(result.current.audioContext).not.toBeNull()
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
  })

  it('returns the same singleton on repeated initAudioContext calls', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const { result } = renderHook(() => useAudioContext())

    let first, second
    act(() => { first = result.current.initAudioContext() })
    act(() => { second = result.current.initAudioContext() })

    expect(first).toBe(second)
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
  })

  it('resumes a suspended context instead of creating a new one', async () => {
    const mockCtx = createMockAudioContext()
    mockCtx.state = 'suspended'
    window.AudioContext = vi.fn(() => mockCtx)

    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const { result } = renderHook(() => useAudioContext())

    act(() => { result.current.initAudioContext() })  // creates, state = 'suspended'
    act(() => { result.current.initAudioContext() })  // should resume, not recreate

    expect(mockCtx.resume).toHaveBeenCalledTimes(1)
    expect(window.AudioContext).toHaveBeenCalledTimes(1)
  })

  it('does not create AudioContext at module load time', async () => {
    await import('../src/hooks/useAudioContext.js')
    expect(window.AudioContext).not.toHaveBeenCalled()
  })

  it('broadcasts audioContext to all mounted consumers when initAudioContext is called', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const consumer1 = renderHook(() => useAudioContext())
    const consumer2 = renderHook(() => useAudioContext())

    act(() => { consumer1.result.current.initAudioContext() })

    expect(consumer1.result.current.audioContext).not.toBeNull()
    expect(consumer2.result.current.audioContext).not.toBeNull()
  })

  it('provides existing context immediately to a consumer that mounts after init', async () => {
    const { useAudioContext } = await import('../src/hooks/useAudioContext.js')
    const consumer1 = renderHook(() => useAudioContext())
    act(() => { consumer1.result.current.initAudioContext() })

    const consumer2 = renderHook(() => useAudioContext())
    expect(consumer2.result.current.audioContext).not.toBeNull()
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createMockAudioContext } from './mocks/audioContext.js'

vi.mock('../src/hooks/useAudioContext.js')
vi.mock('../src/audio/sampler.js')
vi.mock('../src/audio/recorder.js')
vi.mock('../src/audio/clipBank.js')

import { useAudioContext } from '../src/hooks/useAudioContext.js'
import { createSampler } from '../src/audio/sampler.js'
import { createRecorder } from '../src/audio/recorder.js'
import { createClipBank } from '../src/audio/clipBank.js'
import { useSampler } from '../src/hooks/useSampler.js'

function makeMockSampler(ctx) {
  const held = new Set()
  return {
    held,
    outputNode: ctx.createGain(),
    loadClip: vi.fn(),
    trigger: vi.fn((note) => held.add(note)),
    release: vi.fn((note) => held.delete(note)),
    getActiveNotes: vi.fn(() => new Set(held)),
  }
}

function makeMockRecorder() {
  return {
    inputNode: { connect: vi.fn(), disconnect: vi.fn() },
    startRecording: vi.fn(),
    stopRecording: vi.fn(() => Promise.resolve(new Blob())),
    exportWav: vi.fn(() => Promise.resolve(new Blob(['wav'], { type: 'audio/wav' }))),
    exportMp3: vi.fn(() => Promise.resolve(new Blob(['mp3'], { type: 'audio/mpeg' }))),
    isRecording: vi.fn(() => false),
  }
}

function makeMockClipBank() {
  const slots = Array(5).fill(null)
  return {
    getSlots: vi.fn(() => [...slots]),
    add: vi.fn((name, buffer) => {
      const isDuplicate = slots.some((s) => s !== null && s.name === name)
      if (isDuplicate) return false
      const idx = slots.findIndex((s) => s === null)
      if (idx === -1) return false
      slots[idx] = { name, buffer }
      return true
    }),
    remove: vi.fn((name) => {
      const idx = slots.findIndex((s) => s !== null && s.name === name)
      if (idx === -1) return false
      slots[idx] = null
      return true
    }),
    select: vi.fn((name) => {
      const slot = slots.find((s) => s !== null && s.name === name)
      return slot ? slot.buffer : null
    }),
  }
}

describe('useSampler', () => {
  let mockCtx
  let mockInitAudioContext
  let mockSampler
  let mockRecorder
  let mockClipBank
  let capturedOnVoiceEnd

  beforeEach(() => {
    vi.clearAllMocks()
    mockCtx = createMockAudioContext()
    mockInitAudioContext = vi.fn(() => mockCtx)
    mockSampler = makeMockSampler(mockCtx)
    mockRecorder = makeMockRecorder()
    mockClipBank = makeMockClipBank()

    vi.mocked(createSampler).mockImplementation((_ctx, opts) => {
      capturedOnVoiceEnd = opts?.onVoiceEnd
      return mockSampler
    })
    vi.mocked(createRecorder).mockReturnValue(mockRecorder)
    vi.mocked(createClipBank).mockReturnValue(mockClipBank)

    vi.mocked(useAudioContext).mockReturnValue({
      audioContext: null,
      initAudioContext: mockInitAudioContext,
    })
  })

  it('isReady is false before AudioContext is available', () => {
    const { result } = renderHook(() => useSampler())
    expect(result.current.isReady).toBe(false)
  })

  it('passes through initAudioContext from useAudioContext', () => {
    const { result } = renderHook(() => useSampler())
    expect(result.current.initAudioContext).toBe(mockInitAudioContext)
  })

  it('activeNotes is empty before any triggers', () => {
    const { result } = renderHook(() => useSampler())
    expect(result.current.activeNotes.size).toBe(0)
  })

  describe('after AudioContext becomes available', () => {
    async function setupReady() {
      const rendered = renderHook(() => useSampler())
      vi.mocked(useAudioContext).mockReturnValue({
        audioContext: mockCtx,
        initAudioContext: mockInitAudioContext,
      })
      await act(async () => { rendered.rerender() })
      return rendered
    }

    it('creates sampler and recorder with the AudioContext', async () => {
      await setupReady()
      expect(createSampler).toHaveBeenCalledWith(mockCtx, expect.objectContaining({ onVoiceEnd: expect.any(Function) }))
      expect(createRecorder).toHaveBeenCalledWith(mockCtx)
    })

    it('wires sampler.outputNode → analyser → destination', async () => {
      await setupReady()
      const analyser = mockCtx.createAnalyser.mock.results[0].value
      expect(mockSampler.outputNode.connect).toHaveBeenCalledWith(analyser)
      expect(analyser.connect).toHaveBeenCalledWith(mockCtx.destination)
    })

    it('wires sampler.outputNode → recorder.inputNode', async () => {
      await setupReady()
      expect(mockSampler.outputNode.connect).toHaveBeenCalledWith(mockRecorder.inputNode)
    })

    it('isReady becomes true and analyserNode is exposed', async () => {
      const { result } = await setupReady()
      expect(result.current.isReady).toBe(true)
      expect(result.current.analyserNode).not.toBeNull()
    })

    it('does not recreate the graph on subsequent rerenders', async () => {
      const { rerender } = await setupReady()
      await act(async () => { rerender() })
      expect(createSampler).toHaveBeenCalledTimes(1)
    })

    it('trigger calls sampler.trigger and updates activeNotes', async () => {
      const { result } = await setupReady()
      act(() => { result.current.trigger('C4') })
      expect(mockSampler.trigger).toHaveBeenCalledWith('C4')
      expect(result.current.activeNotes.has('C4')).toBe(true)
    })

    it('release calls sampler.release and updates activeNotes', async () => {
      const { result } = await setupReady()
      act(() => { result.current.trigger('C4') })
      act(() => { result.current.release('C4') })
      expect(mockSampler.release).toHaveBeenCalledWith('C4')
      expect(result.current.activeNotes.has('C4')).toBe(false)
    })

    it('releaseAll releases every active note and clears activeNotes', async () => {
      const { result } = await setupReady()
      act(() => { result.current.trigger('C4') })
      act(() => { result.current.trigger('E4') })
      act(() => { result.current.trigger('G4') })
      act(() => { result.current.releaseAll() })
      expect(mockSampler.release).toHaveBeenCalledWith('C4')
      expect(mockSampler.release).toHaveBeenCalledWith('E4')
      expect(mockSampler.release).toHaveBeenCalledWith('G4')
      expect(result.current.activeNotes.size).toBe(0)
    })

    it('releaseAll is a no-op when no notes are active', async () => {
      const { result } = await setupReady()
      act(() => { result.current.releaseAll() })
      expect(mockSampler.release).not.toHaveBeenCalled()
      expect(result.current.activeNotes.size).toBe(0)
    })

    it('onVoiceEnd callback syncs activeNotes when a voice ends unexpectedly', async () => {
      const { result } = await setupReady()
      act(() => { result.current.trigger('C4') })
      expect(result.current.activeNotes.has('C4')).toBe(true)
      // Simulate unexpected voice end (browser fires onended before release is called)
      mockSampler.held.delete('C4')
      act(() => { capturedOnVoiceEnd() })
      expect(result.current.activeNotes.has('C4')).toBe(false)
    })

    it('loadClip delegates to sampler.loadClip', async () => {
      const { result } = await setupReady()
      const fakeBuffer = {}
      act(() => { result.current.loadClip(fakeBuffer) })
      expect(mockSampler.loadClip).toHaveBeenCalledWith(fakeBuffer)
    })

    it('startRecording delegates to recorder and sets isRecording true', async () => {
      const { result } = await setupReady()
      act(() => { result.current.startRecording() })
      expect(mockRecorder.startRecording).toHaveBeenCalledTimes(1)
      expect(result.current.isRecording).toBe(true)
    })

    it('stopRecording delegates to recorder and sets isRecording false', async () => {
      const { result } = await setupReady()
      act(() => { result.current.startRecording() })
      await act(async () => { await result.current.stopRecording() })
      expect(mockRecorder.stopRecording).toHaveBeenCalledTimes(1)
      expect(result.current.isRecording).toBe(false)
    })

    it('isRecording is false initially', async () => {
      const { result } = await setupReady()
      expect(result.current.isRecording).toBe(false)
    })

    it('exportWav and exportMp3 delegate to recorder', async () => {
      const { result } = await setupReady()
      act(() => { result.current.exportWav() })
      expect(mockRecorder.exportWav).toHaveBeenCalledTimes(1)
      act(() => { result.current.exportMp3() })
      expect(mockRecorder.exportMp3).toHaveBeenCalledTimes(1)
    })

    it('decodeAudioFile decodes a file using the AudioContext', async () => {
      const { result } = await setupReady()
      const fakeBuffer = new ArrayBuffer(8)
      const fakeFile = { arrayBuffer: vi.fn(() => Promise.resolve(fakeBuffer)) }
      await act(async () => { await result.current.decodeAudioFile(fakeFile) })
      expect(mockCtx.decodeAudioData).toHaveBeenCalledWith(fakeBuffer)
    })

    describe('clipBank integration', () => {
      it('creates a clipBank on initialization', async () => {
        await setupReady()
        expect(createClipBank).toHaveBeenCalledTimes(1)
      })

      it('initializes clipSlots from clipBank.getSlots()', async () => {
        const { result } = await setupReady()
        expect(result.current.clipSlots).toEqual(Array(5).fill(null))
      })

      it('currentClipName is null initially', async () => {
        const { result } = await setupReady()
        expect(result.current.currentClipName).toBeNull()
      })

      it('addClip adds a clip and updates clipSlots', async () => {
        const { result } = await setupReady()
        const fakeBuffer = {}
        let added
        act(() => { added = result.current.addClip('kick', fakeBuffer) })
        expect(added).toBe(true)
        expect(mockClipBank.add).toHaveBeenCalledWith('kick', fakeBuffer)
        expect(result.current.clipSlots[0]).toEqual({ name: 'kick', buffer: fakeBuffer })
      })

      it('addClip returns false for duplicate name', async () => {
        const { result } = await setupReady()
        const fakeBuffer = {}
        act(() => { result.current.addClip('kick', fakeBuffer) })
        let added
        act(() => { added = result.current.addClip('kick', fakeBuffer) })
        expect(added).toBe(false)
      })

      it('addClip returns false before AudioContext is available', () => {
        const { result } = renderHook(() => useSampler())
        let added
        act(() => { added = result.current.addClip('kick', {}) })
        expect(added).toBe(false)
      })

      it('selectClip loads buffer into sampler and sets currentClipName', async () => {
        const { result } = await setupReady()
        const fakeBuffer = {}
        act(() => { result.current.addClip('kick', fakeBuffer) })
        act(() => { result.current.selectClip('kick') })
        expect(mockClipBank.select).toHaveBeenCalledWith('kick')
        expect(mockSampler.loadClip).toHaveBeenCalledWith(fakeBuffer)
        expect(result.current.currentClipName).toBe('kick')
      })

      it('selectClip does nothing for unknown clip name', async () => {
        const { result } = await setupReady()
        mockSampler.loadClip.mockClear() // clear the default-buffer call from setup
        act(() => { result.current.selectClip('nonexistent') })
        expect(mockSampler.loadClip).not.toHaveBeenCalled()
        expect(result.current.currentClipName).toBeNull()
      })

      it('removeClip removes a clip and updates clipSlots', async () => {
        const { result } = await setupReady()
        const fakeBuffer = {}
        act(() => { result.current.addClip('kick', fakeBuffer) })
        let removed
        act(() => { removed = result.current.removeClip('kick') })
        expect(removed).toBe(true)
        expect(mockClipBank.remove).toHaveBeenCalledWith('kick')
        expect(result.current.clipSlots[0]).toBeNull()
      })

      it('removeClip clears currentClipName when the active clip is removed', async () => {
        const { result } = await setupReady()
        const fakeBuffer = {}
        act(() => { result.current.addClip('kick', fakeBuffer) })
        act(() => { result.current.selectClip('kick') })
        expect(result.current.currentClipName).toBe('kick')
        act(() => { result.current.removeClip('kick') })
        expect(result.current.currentClipName).toBeNull()
      })

      it('removeClip does not change currentClipName when a different clip is removed', async () => {
        const { result } = await setupReady()
        const buf1 = {}
        const buf2 = {}
        act(() => { result.current.addClip('kick', buf1) })
        act(() => { result.current.addClip('snare', buf2) })
        act(() => { result.current.selectClip('kick') })
        act(() => { result.current.removeClip('snare') })
        expect(result.current.currentClipName).toBe('kick')
      })

      it('removeClip returns false before AudioContext is available', () => {
        const { result } = renderHook(() => useSampler())
        let removed
        act(() => { removed = result.current.removeClip('kick') })
        expect(removed).toBe(false)
      })
    })
  })

  it('trigger is a no-op before AudioContext is available', () => {
    const { result } = renderHook(() => useSampler())
    expect(() => act(() => { result.current.trigger('C4') })).not.toThrow()
    expect(mockSampler.trigger).not.toHaveBeenCalled()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { createSampler } from '../src/audio/sampler.js'
import { createMockAudioContext } from './mocks/audioContext.js'

describe('sampler', () => {
  let ctx, sampler, buffer

  beforeEach(() => {
    ctx = createMockAudioContext()
    sampler = createSampler(ctx)
    buffer = { duration: 1, sampleRate: 44100, numberOfChannels: 1, length: 44100 }
    sampler.loadClip(buffer)
  })

  it('loadClip: stores the AudioBuffer', () => {
    sampler.trigger('C4')
    const source = ctx.createBufferSource.mock.results[0].value
    expect(source.buffer).toBe(buffer)
  })

  it('trigger: starts a BufferSource at the correct playback rate', () => {
    sampler.trigger('C5') // one octave up from C4 base → rate 2.0
    const source = ctx.createBufferSource.mock.results[0].value
    expect(source.playbackRate.value).toBeCloseTo(2.0)
    expect(source.start).toHaveBeenCalled()
  })

  it('trigger: base note C4 plays at rate 1.0', () => {
    sampler.trigger('C4')
    const source = ctx.createBufferSource.mock.results[0].value
    expect(source.playbackRate.value).toBeCloseTo(1.0)
  })

  it('trigger: note below base plays at rate < 1.0', () => {
    sampler.trigger('C3') // one octave down → rate 0.5
    const source = ctx.createBufferSource.mock.results[0].value
    expect(source.playbackRate.value).toBeCloseTo(0.5)
  })

  it('trigger: multiple notes play as independent voices (polyphony)', () => {
    sampler.trigger('C4')
    sampler.trigger('E4')
    sampler.trigger('G4')
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(3)
    ctx.createBufferSource.mock.results.forEach(({ value: src }) => {
      expect(src.start).toHaveBeenCalled()
    })
  })

  it('trigger: does not restart a note that is already held', () => {
    sampler.trigger('C4')
    sampler.trigger('C4') // should be ignored
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1)
  })

  it('trigger: loop is enabled for hold behavior', () => {
    sampler.trigger('C4')
    const source = ctx.createBufferSource.mock.results[0].value
    expect(source.loop).toBe(true)
  })

  it('trigger: silently ignores when no clip is loaded', () => {
    const emptyCtx = createMockAudioContext()
    const emptySampler = createSampler(emptyCtx)
    expect(() => emptySampler.trigger('C4')).not.toThrow()
    expect(emptyCtx.createBufferSource).not.toHaveBeenCalled()
  })

  it('release: stops the voice for the given note', () => {
    sampler.trigger('C4')
    const source = ctx.createBufferSource.mock.results[0].value
    sampler.release('C4')
    expect(source.stop).toHaveBeenCalled()
  })

  it('release: does not stop voices for other notes', () => {
    sampler.trigger('C4')
    sampler.trigger('E4')
    const [c4Src, e4Src] = ctx.createBufferSource.mock.results.map((r) => r.value)
    sampler.release('C4')
    expect(c4Src.stop).toHaveBeenCalled()
    expect(e4Src.stop).not.toHaveBeenCalled()
  })

  it('release: silently ignores a note that is not active', () => {
    expect(() => sampler.release('C4')).not.toThrow()
  })

  it('getActiveNotes: reflects held notes after trigger and release', () => {
    sampler.trigger('C4')
    sampler.trigger('E4')
    expect(sampler.getActiveNotes()).toEqual(new Set(['C4', 'E4']))
    sampler.release('C4')
    expect(sampler.getActiveNotes()).toEqual(new Set(['E4']))
    sampler.release('E4')
    expect(sampler.getActiveNotes()).toEqual(new Set())
  })
})

import { describe, it, expect } from 'vitest'
import { semitoneToRate, noteToSemitone } from '../src/audio/pitchUtils.js'

describe('semitoneToRate', () => {
  it('0 semitones returns 1.0', () => {
    expect(semitoneToRate(0)).toBe(1.0)
  })

  it('12 semitones returns 2.0 (one octave up)', () => {
    expect(semitoneToRate(12)).toBeCloseTo(2.0)
  })

  it('-12 semitones returns 0.5 (one octave down)', () => {
    expect(semitoneToRate(-12)).toBeCloseTo(0.5)
  })

  it('7 semitones returns a perfect fifth ratio (~1.498)', () => {
    expect(semitoneToRate(7)).toBeCloseTo(1.4983, 3)
  })
})

describe('noteToSemitone', () => {
  it('C4 returns 48', () => {
    expect(noteToSemitone('C4')).toBe(48)
  })

  it('C#4 and Db4 are enharmonic equivalents', () => {
    expect(noteToSemitone('C#4')).toBe(noteToSemitone('Db4'))
    expect(noteToSemitone('C#4')).toBe(49)
  })

  it('octave changes increment by 12', () => {
    expect(noteToSemitone('C5') - noteToSemitone('C4')).toBe(12)
    expect(noteToSemitone('A4') - noteToSemitone('A3')).toBe(12)
  })

  it('C0 returns 0', () => {
    expect(noteToSemitone('C0')).toBe(0)
  })

  it('A4 returns 57', () => {
    expect(noteToSemitone('A4')).toBe(57)
  })

  it('Bb3 returns 46', () => {
    expect(noteToSemitone('Bb3')).toBe(46)
  })
})

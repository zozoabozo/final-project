import { describe, it, expect } from 'vitest'
import { getDominantFrequencyHz } from '../src/components/Spectrogram'

describe('getDominantFrequencyHz', () => {
  it('returns Hz within ±5% of A4 (440 Hz) when that bin peaks', () => {
    const sampleRate = 44100
    const fftSize = 2048
    const binCount = fftSize / 2  // 1024

    // Which bin corresponds to 440 Hz?
    // frequency resolution = sampleRate / fftSize ≈ 21.53 Hz/bin
    // target bin = round(440 / 21.53) = 20
    const freqResolution = sampleRate / fftSize
    const targetBin = Math.round(440 / freqResolution)

    const data = new Float32Array(binCount).fill(-Infinity)
    data[targetBin] = -10  // loud peak at the A4 bin

    const dominantHz = getDominantFrequencyHz(data, sampleRate)

    expect(dominantHz).toBeGreaterThan(440 * 0.95)
    expect(dominantHz).toBeLessThan(440 * 1.05)
  })

  it('returns Hz within ±5% of C4 (261.63 Hz) when that bin peaks', () => {
    const sampleRate = 44100
    const fftSize = 2048
    const binCount = fftSize / 2

    const freqResolution = sampleRate / fftSize
    const targetBin = Math.round(261.63 / freqResolution)

    const data = new Float32Array(binCount).fill(-Infinity)
    data[targetBin] = -10

    const dominantHz = getDominantFrequencyHz(data, sampleRate)

    expect(dominantHz).toBeGreaterThan(261.63 * 0.95)
    expect(dominantHz).toBeLessThan(261.63 * 1.05)
  })
})

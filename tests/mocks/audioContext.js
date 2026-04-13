import { vi } from 'vitest'

/**
 * Creates a stubbed Web Audio API AudioContext suitable for use in
 * Vitest / jsdom tests. All node-factory methods return mock objects
 * whose methods are tracked with vi.fn() so tests can assert on calls.
 */
export function createMockAudioContext() {
  const createNode = () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  })

  const mockBufferSource = () => ({
    ...createNode(),
    buffer: null,
    loop: false,
    loopStart: 0,
    loopEnd: 0,
    playbackRate: { value: 1 },
    onended: null,
    start: vi.fn(),
    stop: vi.fn(),
  })

  const mockGainNode = () => ({
    ...createNode(),
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
  })

  const mockAnalyserNode = () => ({
    ...createNode(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    smoothingTimeConstant: 0.8,
    getFloatFrequencyData: vi.fn((array) => array.fill(-Infinity)),
    getByteFrequencyData: vi.fn((array) => array.fill(0)),
    getFloatTimeDomainData: vi.fn((array) => array.fill(0)),
  })

  const mockStreamDestination = {
    stream: {
      getTracks: vi.fn(() => [{ stop: vi.fn() }]),
    },
  }

  const ctx = {
    sampleRate: 44100,
    currentTime: 0,
    state: 'running',
    destination: { ...createNode() },

    createBufferSource: vi.fn(mockBufferSource),
    createGain: vi.fn(mockGainNode),
    createAnalyser: vi.fn(mockAnalyserNode),
    createMediaStreamDestination: vi.fn(() => mockStreamDestination),

    decodeAudioData: vi.fn((_buffer) =>
      Promise.resolve({
        duration: 1,
        sampleRate: 44100,
        numberOfChannels: 1,
        length: 44100,
        getChannelData: vi.fn(() => new Float32Array(44100)),
      })
    ),

    resume: vi.fn(() => Promise.resolve()),
    suspend: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  }

  return ctx
}

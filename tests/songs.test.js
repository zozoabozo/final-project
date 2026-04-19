import { describe, it, expect } from 'vitest'
import { parseSong, BASE_DURATION_MS } from '../src/songs/parseSong.js'
import { KEY_MAP } from '../src/hooks/useKeyboard.js'
import furEliseRaw from '../src/songs/furElise.txt?raw'
import odeToJoyRaw from '../src/songs/odeToJoy.txt?raw'

const TOKEN_RE = /^([a-zA-Z0-9])(\d+)$/

function validateRaw(raw, songName) {
  const tokens = raw.split(/\s+/).filter(Boolean)

  it(`${songName}: every token matches <key><digits> format`, () => {
    tokens.forEach((token) => {
      expect(token, `bad token: "${token}"`).toMatch(TOKEN_RE)
    })
  })

  it(`${songName}: every key exists in KEY_MAP`, () => {
    tokens.forEach((token) => {
      const key = token.match(TOKEN_RE)?.[1].toLowerCase()
      expect(KEY_MAP, `unmapped key "${key}" in token "${token}"`).toHaveProperty(key)
    })
  })

  it(`${songName}: every duration is a positive integer`, () => {
    tokens.forEach((token) => {
      const dur = parseInt(token.match(TOKEN_RE)?.[2], 10)
      expect(dur).toBeGreaterThan(0)
    })
  })
}

describe('Song file validation', () => {
  validateRaw(furEliseRaw, 'furElise')
  validateRaw(odeToJoyRaw, 'odeToJoy')
})

describe('parseSong', () => {
  it('returns correct key, note, and duration for a single token', () => {
    const result = parseSong('g2')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ key: 'g', note: KEY_MAP['g'], duration: 2 * BASE_DURATION_MS })
  })

  it('parses multiple tokens from a line', () => {
    const result = parseSong('g2 h2 j2')
    expect(result).toHaveLength(3)
    expect(result.map(r => r.key)).toEqual(['g', 'h', 'j'])
  })

  it('ignores empty lines and extra whitespace', () => {
    const result = parseSong('g2\n\nf2\n   j2')
    expect(result).toHaveLength(3)
  })

  it('skips invalid tokens with a console warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = parseSong('g2 ??? j2')
    expect(result).toHaveLength(2)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('???'))
    warn.mockRestore()
  })

  it('skips tokens with unknown keys', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = parseSong('p2 g2')
    expect(result).toHaveLength(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"p"'))
    warn.mockRestore()
  })

  it('handles uppercase keys (normalizes to lowercase)', () => {
    const result = parseSong('G2')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('g')
  })

  it('parses all tokens from the odeToJoy song file', () => {
    const result = parseSong(odeToJoyRaw)
    expect(result.length).toBeGreaterThan(0)
    result.forEach(({ key, note, duration }) => {
      expect(key).toMatch(/^[a-z0-9]$/)
      expect(note).toBeTruthy()
      expect(duration).toBeGreaterThan(0)
    })
  })

  it('parses all tokens from the furElise song file', () => {
    const result = parseSong(furEliseRaw)
    expect(result.length).toBeGreaterThan(0)
    result.forEach(({ key, note, duration }) => {
      expect(key).toMatch(/^[a-z0-9]$/)
      expect(note).toBeTruthy()
      expect(duration).toBeGreaterThan(0)
    })
  })
})

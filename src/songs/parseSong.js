import { KEY_MAP } from '../hooks/useKeyboard.js'

export const BASE_DURATION_MS = 250

const TOKEN_RE = /^([a-zA-Z0-9])(\d+)$/

/**
 * Parses a raw song string into an array of note events.
 * @param {string} raw - contents of a .txt song file
 * @returns {{ key: string, note: string, duration: number }[]}
 *   key: physical keyboard key, note: musical note string, duration: ms
 */
export function parseSong(raw) {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((token) => {
      const match = token.match(TOKEN_RE)
      if (!match) {
        console.warn(`parseSong: skipping invalid token "${token}"`)
        return []
      }
      const key = match[1].toLowerCase()
      const duration = parseInt(match[2], 10) * BASE_DURATION_MS
      const note = KEY_MAP[key]
      if (!note) {
        console.warn(`parseSong: skipping unknown key "${key}" in token "${token}"`)
        return []
      }
      return [{ key, note, duration }]
    })
}

import { describe, it, expect } from 'vitest'
import { createClipBank } from '../src/audio/clipBank.js'

describe('clipBank', () => {
  it('starts with all slots empty', () => {
    const bank = createClipBank()
    expect(bank.getSlots()).toEqual([null, null, null, null, null])
  })

  it('add: stores a clip by name in the next free slot', () => {
    const bank = createClipBank()
    const buffer = { duration: 1 }
    const result = bank.add('dog', buffer)
    expect(result).toBe(true)
    expect(bank.getSlots()[0]).toEqual({ name: 'dog', buffer })
  })

  it('add: fills slots in order', () => {
    const bank = createClipBank()
    bank.add('a', {})
    bank.add('b', {})
    const slots = bank.getSlots()
    expect(slots[0].name).toBe('a')
    expect(slots[1].name).toBe('b')
  })

  it('add: rejects a 6th clip when all 5 slots are full', () => {
    const bank = createClipBank()
    for (let i = 0; i < 5; i++) {
      expect(bank.add(`clip${i}`, {})).toBe(true)
    }
    expect(bank.add('overflow', {})).toBe(false)
  })

  it('remove: clears the named slot', () => {
    const bank = createClipBank()
    bank.add('dog', {})
    const result = bank.remove('dog')
    expect(result).toBe(true)
    expect(bank.getSlots()[0]).toBeNull()
  })

  it('remove: returns false when clip not found', () => {
    const bank = createClipBank()
    expect(bank.remove('nonexistent')).toBe(false)
  })

  it('remove: freed slot can be reused', () => {
    const bank = createClipBank()
    bank.add('dog', {})
    bank.remove('dog')
    const newBuffer = { duration: 2 }
    bank.add('cat', newBuffer)
    expect(bank.getSlots()[0]).toEqual({ name: 'cat', buffer: newBuffer })
  })

  it('select: returns the buffer for the named clip', () => {
    const bank = createClipBank()
    const buffer = { duration: 2 }
    bank.add('cat', buffer)
    expect(bank.select('cat')).toBe(buffer)
  })

  it('select: returns null for an unknown name', () => {
    const bank = createClipBank()
    expect(bank.select('nonexistent')).toBeNull()
  })

  it('add: rejects a duplicate name', () => {
    const bank = createClipBank()
    expect(bank.add('dog', {})).toBe(true)
    expect(bank.add('dog', {})).toBe(false)
    // Only one slot should be filled
    expect(bank.getSlots().filter((s) => s !== null)).toHaveLength(1)
  })
})

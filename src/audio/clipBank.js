/**
 * ClipBank manages up to 5 named audio clips.
 * Each slot holds { name, buffer } or null.
 */

const MAX_CLIPS = 5

export function createClipBank() {
  const slots = Array(MAX_CLIPS).fill(null)

  return {
    /** Returns a shallow copy of the slots array. */
    getSlots() {
      return [...slots]
    },

    /**
     * Store a named clip in the next free slot.
     * @param {string} name - Identifier for the clip
     * @param {AudioBuffer} buffer - Decoded audio data
     * @returns {boolean} true if added, false if all slots are full
     */
    add(name, buffer) {
      const isDuplicate = slots.some((slot) => slot !== null && slot.name === name)
      if (isDuplicate) return false
      const freeIndex = slots.findIndex((slot) => slot === null)
      if (freeIndex === -1) return false
      slots[freeIndex] = { name, buffer }
      return true
    },

    /**
     * Clear the slot holding the named clip.
     * @param {string} name
     * @returns {boolean} true if found and removed, false if not found
     */
    remove(name) {
      const index = slots.findIndex((slot) => slot !== null && slot.name === name)
      if (index === -1) return false
      slots[index] = null
      return true
    },

    /**
     * Return the buffer for the named clip, or null if not found.
     * @param {string} name
     * @returns {AudioBuffer|null}
     */
    select(name) {
      const slot = slots.find((slot) => slot !== null && slot.name === name)
      return slot ? slot.buffer : null
    },
  }
}

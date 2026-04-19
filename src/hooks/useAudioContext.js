import { useState, useCallback, useEffect } from 'react'

let sharedContext = null
const subscribers = new Set()

export function useAudioContext() {
  const [audioContext, setAudioContext] = useState(sharedContext)

  useEffect(() => {
    if (sharedContext !== null) setAudioContext(sharedContext)
    subscribers.add(setAudioContext)
    return () => subscribers.delete(setAudioContext)
  }, [])

  const initAudioContext = useCallback(() => {
    if (!sharedContext) {
      sharedContext = new AudioContext()
      subscribers.forEach((setter) => setter(sharedContext))
    } else if (sharedContext.state === 'suspended') {
      sharedContext.resume()
    }
    return sharedContext
  }, [])

  return { audioContext, initAudioContext }
}

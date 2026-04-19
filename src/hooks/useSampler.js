import { useState, useEffect, useRef, useCallback } from 'react'
import { useAudioContext } from './useAudioContext.js'
import { createSampler } from '../audio/sampler.js'
import { createRecorder } from '../audio/recorder.js'
import { createClipBank } from '../audio/clipBank.js'

function createSineBuffer(ctx) {
  const duration = 2
  const length = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  const freq = 261.63 // C4
  for (let i = 0; i < length; i++) {
    const t = i / ctx.sampleRate
    const fadeStart = duration * 0.7
    const amp = t > fadeStart ? 1 - (t - fadeStart) / (duration - fadeStart) : 1
    data[i] = Math.sin(2 * Math.PI * freq * t) * amp * 0.4
  }
  return buffer
}

export function useSampler() {
  const { audioContext, initAudioContext } = useAudioContext()
  const samplerRef = useRef(null)
  const recorderRef = useRef(null)
  const clipBankRef = useRef(null)
  const audioContextRef = useRef(null)
  const currentClipNameRef = useRef(null)
  const [analyserNode, setAnalyserNode] = useState(null)
  const [activeNotes, setActiveNotes] = useState(new Set())
  const [clipSlots, setClipSlots] = useState(Array(5).fill(null))
  const [currentClipName, setCurrentClipName] = useState(null)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => { currentClipNameRef.current = currentClipName }, [currentClipName])

  // Wire the full audio graph once an AudioContext is available.
  // sampler.outputNode → analyser → destination
  // sampler.outputNode → recorder.inputNode
  useEffect(() => {
    if (!audioContext || samplerRef.current) return
    audioContextRef.current = audioContext

    const onVoiceEnd = () => {
      if (samplerRef.current) setActiveNotes(samplerRef.current.getActiveNotes())
    }
    const sampler = createSampler(audioContext, { onVoiceEnd })
    const recorder = createRecorder(audioContext)
    const clipBank = createClipBank()
    const analyser = audioContext.createAnalyser()

    sampler.outputNode.connect(analyser)
    analyser.connect(audioContext.destination)
    sampler.outputNode.connect(recorder.inputNode)

    sampler.loadClip(createSineBuffer(audioContext))

    samplerRef.current = sampler
    recorderRef.current = recorder
    clipBankRef.current = clipBank
    setAnalyserNode(analyser)
    setClipSlots(clipBank.getSlots())
  }, [audioContext])

  const trigger = useCallback((note) => {
    if (!samplerRef.current) return
    samplerRef.current.trigger(note)
    setActiveNotes(samplerRef.current.getActiveNotes())
  }, [])

  const release = useCallback((note) => {
    if (!samplerRef.current) return
    samplerRef.current.release(note)
    setActiveNotes(samplerRef.current.getActiveNotes())
  }, [])

  const releaseAll = useCallback(() => {
    if (!samplerRef.current) return
    for (const note of activeNotes) {
      samplerRef.current.release(note)
    }
    setActiveNotes(new Set())
  }, [activeNotes])

  const loadClip = useCallback((audioBuffer) => {
    samplerRef.current?.loadClip(audioBuffer)
  }, [])

  const addClip = useCallback((name, buffer) => {
    if (!clipBankRef.current) return false
    const added = clipBankRef.current.add(name, buffer)
    if (added) setClipSlots(clipBankRef.current.getSlots())
    return added
  }, [])

  const selectClip = useCallback((name) => {
    if (!clipBankRef.current || !samplerRef.current) return
    const buffer = clipBankRef.current.select(name)
    if (!buffer) return
    samplerRef.current.loadClip(buffer)
    setCurrentClipName(name)
  }, [])

  const removeClip = useCallback((name) => {
    if (!clipBankRef.current) return false
    const removed = clipBankRef.current.remove(name)
    if (removed) {
      if (currentClipNameRef.current === name && samplerRef.current && audioContextRef.current) {
        samplerRef.current.loadClip(createSineBuffer(audioContextRef.current))
      }
      setClipSlots(clipBankRef.current.getSlots())
      setCurrentClipName((prev) => (prev === name ? null : prev))
    }
    return removed
  }, [])

  const decodeAudioFile = useCallback(async (file) => {
    const ctx = initAudioContext()
    if (!ctx) return null
    const arrayBuffer = await file.arrayBuffer()
    return ctx.decodeAudioData(arrayBuffer)
  }, [initAudioContext])

  const startRecording = useCallback(() => {
    recorderRef.current?.startRecording()
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(async () => {
    const blob = await recorderRef.current?.stopRecording()
    setIsRecording(false)
    return blob
  }, [])

  const exportWav = useCallback(() => recorderRef.current?.exportWav(), [])
  const exportMp3 = useCallback(() => recorderRef.current?.exportMp3(), [])

  return {
    initAudioContext,
    isReady: !!analyserNode,
    trigger,
    release,
    loadClip,
    addClip,
    selectClip,
    removeClip,
    releaseAll,
    decodeAudioFile,
    activeNotes,
    analyserNode,
    clipSlots,
    currentClipName,
    startRecording,
    stopRecording,
    exportWav,
    exportMp3,
    isRecording,
  }
}

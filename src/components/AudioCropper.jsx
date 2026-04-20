import { useRef, useState, useEffect } from 'react'
import './AudioCropper.css'

const MIN_SEL = 0.5
const MAX_SEL = 1.0
const HANDLE_HIT_PX = 10 // hit zone in canvas pixels

export default function AudioCropper({ audioBuffer, initAudioContext, onConfirm, onCancel }) {
  const canvasRef = useRef(null)
  const draggingRef = useRef(null) // 'start' | 'end' | null
  const playSourceRef = useRef(null)

  // Use refs alongside state so mousemove handler always sees current values
  const startRef = useRef(0)
  const endRef = useRef(Math.min(audioBuffer.duration, MAX_SEL))

  const [startTime, setStartTimeState] = useState(startRef.current)
  const [endTime, setEndTimeState] = useState(endRef.current)
  const [isPlaying, setIsPlaying] = useState(false)

  function setStartTime(t) { startRef.current = t; setStartTimeState(t) }
  function setEndTime(t)   { endRef.current   = t; setEndTimeState(t) }

  const totalDuration = audioBuffer.duration

  // Redraw canvas whenever selection changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    const mid = H / 2

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Merge all channels for peak display
    const numCh = audioBuffer.numberOfChannels
    const totalSamples = audioBuffer.length
    const samplesPerPixel = Math.max(1, Math.ceil(totalSamples / W))

    for (let x = 0; x < W; x++) {
      const t = (x / W) * totalDuration
      const inSel = t >= startTime && t <= endTime
      const sStart = Math.floor((x / W) * totalSamples)
      const sEnd = Math.min(sStart + samplesPerPixel, totalSamples)

      let min = 0, max = 0
      for (let ch = 0; ch < numCh; ch++) {
        const data = audioBuffer.getChannelData(ch)
        for (let i = sStart; i < sEnd; i++) {
          if (data[i] < min) min = data[i]
          if (data[i] > max) max = data[i]
        }
      }

      ctx.strokeStyle = inSel ? '#60a5fa' : '#334155'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x + 0.5, mid + min * mid * 0.88)
      ctx.lineTo(x + 0.5, mid + max * mid * 0.88)
      ctx.stroke()
    }

    // Selection overlay tint
    const startX = (startTime / totalDuration) * W
    const endX   = (endTime   / totalDuration) * W
    ctx.fillStyle = 'rgba(59, 130, 246, 0.10)'
    ctx.fillRect(startX, 0, endX - startX, H)

    // Handles
    function drawHandle(x) {
      ctx.fillStyle = '#3b82f6'
      ctx.fillRect(x - 2, 0, 4, H)
      ctx.beginPath()
      ctx.moveTo(x - 7, 0)
      ctx.lineTo(x + 7, 0)
      ctx.lineTo(x, 12)
      ctx.closePath()
      ctx.fill()
    }
    drawHandle(startX)
    drawHandle(endX)

    // Labels
    ctx.font = '11px monospace'
    ctx.fillStyle = '#94a3b8'
    ctx.fillText(`${startTime.toFixed(2)}s`, Math.min(startX + 6, W - 46), H - 6)
    ctx.fillText(`${endTime.toFixed(2)}s`, Math.max(endX - 42, 0), 14)

    const sel = endTime - startTime
    const valid = sel >= MIN_SEL && sel <= MAX_SEL
    ctx.font = 'bold 12px monospace'
    ctx.fillStyle = valid ? '#4ade80' : '#f87171'
    const label = `${sel.toFixed(2)}s`
    ctx.fillText(label, W / 2 - (label.length * 3.5), mid + 4)
  }, [audioBuffer, startTime, endTime, totalDuration])

  function getCanvasTime(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const canvasX = (e.clientX - rect.left) * scaleX
    return Math.max(0, Math.min(totalDuration, (canvasX / canvas.width) * totalDuration))
  }

  function handleMouseDown(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const cx = (e.clientX - rect.left) * scaleX
    const startX = (startRef.current / totalDuration) * canvas.width
    const endX   = (endRef.current   / totalDuration) * canvas.width
    const hit = HANDLE_HIT_PX * scaleX

    if (Math.abs(cx - startX) <= hit) {
      draggingRef.current = 'start'
    } else if (Math.abs(cx - endX) <= hit) {
      draggingRef.current = 'end'
    }
  }

  function handleMouseMove(e) {
    if (!draggingRef.current) return
    const t  = getCanvasTime(e)
    const st = startRef.current
    const et = endRef.current

    if (draggingRef.current === 'start') {
      const minStart = Math.max(0, et - MAX_SEL)
      const maxStart = et - MIN_SEL
      setStartTime(Math.max(minStart, Math.min(maxStart, t)))
    } else {
      const minEnd = st + MIN_SEL
      const maxEnd = Math.min(totalDuration, st + MAX_SEL)
      setEndTime(Math.max(minEnd, Math.min(maxEnd, t)))
    }
  }

  function handleMouseUp() {
    draggingRef.current = null
  }

  function stopPlayback() {
    if (playSourceRef.current) {
      try { playSourceRef.current.stop() } catch (_) {}
      playSourceRef.current = null
    }
    setIsPlaying(false)
  }

  function handlePreview() {
    if (isPlaying) { stopPlayback(); return }
    const audioCtx = initAudioContext()
    if (!audioCtx) return

    const source = audioCtx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(audioCtx.destination)
    source.onended = () => { playSourceRef.current = null; setIsPlaying(false) }
    playSourceRef.current = source
    setIsPlaying(true)
    source.start(0, startRef.current, endRef.current - startRef.current)
  }

  function cropBuffer() {
    const sr = audioBuffer.sampleRate
    const s0 = Math.floor(startRef.current * sr)
    const s1 = Math.floor(endRef.current   * sr)
    const cropped = new AudioBuffer({
      numberOfChannels: audioBuffer.numberOfChannels,
      length: s1 - s0,
      sampleRate: sr,
    })
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
      cropped.getChannelData(ch).set(audioBuffer.getChannelData(ch).subarray(s0, s1))
    }
    return cropped
  }

  function handleConfirm() {
    stopPlayback()
    onConfirm(cropBuffer())
  }

  function handleCancel() {
    stopPlayback()
    onCancel()
  }

  const selDuration = endTime - startTime
  const isValid = selDuration >= MIN_SEL && selDuration <= MAX_SEL

  return (
    <div
      className="cropper-overlay"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="cropper-modal" onMouseMove={(e) => e.stopPropagation()} onMouseUp={(e) => e.stopPropagation()}>
        <h2 className="cropper-title">Crop Audio Clip</h2>
        <p className="cropper-hint">Drag the handles to select between 0.5s and 1.0s of audio.</p>
        <p className="cropper-tip">Tip: start your selection right when the sound begins, or at the most important part of the clip.</p>

        <canvas
          ref={canvasRef}
          className="cropper-canvas"
          width={600}
          height={120}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="cropper-info">
          <span>Start: {startTime.toFixed(3)}s</span>
          <span className={isValid ? 'cropper-dur--ok' : 'cropper-dur--err'}>
            Duration: {selDuration.toFixed(3)}s
          </span>
          <span>End: {endTime.toFixed(3)}s</span>
        </div>

        <div className="cropper-actions">
          <button className="cropper-btn cropper-btn--preview" onClick={handlePreview}>
            {isPlaying ? '■ Stop' : '▶ Preview'}
          </button>
          <div className="cropper-actions__right">
            <button className="cropper-btn cropper-btn--cancel" onClick={handleCancel}>Cancel</button>
            <button
              className="cropper-btn cropper-btn--confirm"
              onClick={handleConfirm}
              disabled={!isValid}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

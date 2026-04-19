import { useState, useRef, useEffect } from 'react'
import './Recorder.css'

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Recorder({
  startRecording,
  stopRecording,
  exportWav,
  exportMp3,
  isRecording,
}) {
  const [hasRecording, setHasRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState(null)
  const [format, setFormat] = useState('wav')
  const [filename, setFilename] = useState('recording')
  const [exporting, setExporting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playTime, setPlayTime] = useState({ current: 0, duration: 0 })
  const audioRef = useRef(null)

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  async function handleToggle() {
    if (isRecording) {
      audioRef.current?.pause()
      audioRef.current = null
      setIsPlaying(false)
      setPlayTime({ current: 0, duration: 0 })
      const blob = await stopRecording()
      setRecordedBlob(blob)
      setHasRecording(true)
    } else {
      setHasRecording(false)
      setRecordedBlob(null)
      setPlayTime({ current: 0, duration: 0 })
      startRecording()
    }
  }

  function handlePlayback() {
    if (!recordedBlob) return
    if (isPlaying) {
      audioRef.current?.pause()
      audioRef.current = null
      setIsPlaying(false)
      setPlayTime({ current: 0, duration: 0 })
    } else {
      const url = URL.createObjectURL(recordedBlob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onloadedmetadata = () => {
        setPlayTime((p) => ({ ...p, duration: audio.duration }))
      }
      audio.ontimeupdate = () => {
        setPlayTime((p) => ({ ...p, current: audio.currentTime }))
      }
      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
        setPlayTime({ current: 0, duration: 0 })
        URL.revokeObjectURL(url)
      }
      audio.play()
      setIsPlaying(true)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const blob = format === 'wav' ? await exportWav() : await exportMp3()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename || 'recording'}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const showPostRecording = hasRecording && !isRecording

  return (
    <div className="recorder">
      <div className="recorder__title">Recorder</div>

      <div className="recorder__row">
        <button
          className={`recorder__record-btn${isRecording ? ' recorder__record-btn--recording' : ''}`}
          onClick={handleToggle}
        >
          {isRecording ? 'Stop' : 'Record'}
        </button>
        {isRecording && <span className="recorder__indicator" />}
        {showPostRecording && (
          <button
            className={`recorder__play-btn${isPlaying ? ' recorder__play-btn--playing' : ''}`}
            onClick={handlePlayback}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        )}
        {isPlaying && (
          <span className="recorder__timer">
            {formatTime(playTime.current)}/{formatTime(playTime.duration)}
          </span>
        )}
      </div>

      {showPostRecording && (
        <>
          <div className="recorder__row">
            <div className="recorder__format">
              {['wav', 'mp3'].map((f) => (
                <button
                  key={f}
                  className={`recorder__format-btn${format === f ? ' recorder__format-btn--active' : ''}`}
                  onClick={() => setFormat(f)}
                >
                  .{f}
                </button>
              ))}
            </div>
          </div>

          <div className="recorder__row">
            <input
              className="recorder__filename"
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="filename"
              aria-label="File name"
            />
            <button
              className="recorder__export-btn"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

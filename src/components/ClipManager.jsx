import { useRef, useState } from 'react'
import './ClipManager.css'

export default function ClipManager({
  clipSlots,
  currentClipName,
  selectClip,
  removeClip,
  addClip,
  decodeAudioFile,
  initAudioContext,
}) {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pendingRemove, setPendingRemove] = useState(null)
  const fileInputRef = useRef(null)

  const usedCount = clipSlots.filter(Boolean).length
  const isFull = usedCount === 5

  async function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return

    setError(null)
    setLoading(true)
    try {
      const buffer = await decodeAudioFile(file)
      if (!buffer) {
        setError('Could not decode audio file.')
        return
      }
      const name = file.name.replace(/\.[^.]+$/, '')
      const added = addClip(name, buffer)
      if (!added) {
        setError(`"${name}" already exists or all slots are full.`)
        return
      }
      selectClip(name)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="clip-manager">
      <div className="clip-manager__header">
        <span className="clip-manager__title">
          Clips <span className="clip-manager__count">{usedCount}/5</span>
        </span>
        <button
          className="clip-manager__upload-btn"
          onClick={() => fileInputRef.current.click()}
          disabled={isFull || loading}
        >
          {loading ? 'Loading…' : '+ Upload'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {error && <p className="clip-manager__error">{error}</p>}

      <ul className="clip-manager__slots">
        {clipSlots.map((slot, i) => {
          const isActive = slot?.name === currentClipName
          return (
            <li
              key={i}
              className={[
                'clip-manager__slot',
                slot ? 'clip-manager__slot--filled' : '',
                isActive ? 'clip-manager__slot--active' : '',
              ].filter(Boolean).join(' ')}
            >
              {slot ? (
                pendingRemove === slot.name ? (
                  <div className="clip-manager__confirm">
                    <span className="clip-manager__confirm-text">
                      Are you sure you want to remove this sound clip?
                    </span>
                    <div className="clip-manager__confirm-btns">
                      <button
                        className="clip-manager__confirm-yes"
                        onClick={() => { removeClip(slot.name); setPendingRemove(null) }}
                      >Yes</button>
                      <button
                        className="clip-manager__confirm-no"
                        onClick={() => setPendingRemove(null)}
                      >No</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      className="clip-manager__slot-name"
                      onClick={() => selectClip(slot.name)}
                      title={isActive ? 'Currently active' : 'Click to select'}
                    >
                      {slot.name}
                    </button>
                    <button
                      className="clip-manager__slot-remove"
                      onClick={() => setPendingRemove(slot.name)}
                      aria-label={`Remove ${slot.name}`}
                    >
                      ×
                    </button>
                  </>
                )
              ) : (
                <span className="clip-manager__slot-empty">empty</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

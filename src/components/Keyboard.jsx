import { useRef, useEffect } from 'react'
import { useKeyboard } from '../hooks/useKeyboard'
import './Keyboard.css'

const WHITE_WIDTH = 40
const BLACK_WIDTH = 24

const KEYS = [
  { note: 'C3',  isBlack: false, key: 'z', whiteIndex: 0 },
  { note: 'C#3', isBlack: true,  key: 's', leftWhiteIndex: 0 },
  { note: 'D3',  isBlack: false, key: 'x', whiteIndex: 1 },
  { note: 'D#3', isBlack: true,  key: 'd', leftWhiteIndex: 1 },
  { note: 'E3',  isBlack: false, key: 'c', whiteIndex: 2 },
  { note: 'F3',  isBlack: false, key: 'v', whiteIndex: 3 },
  { note: 'F#3', isBlack: true,  key: 'g', leftWhiteIndex: 3 },
  { note: 'G3',  isBlack: false, key: 'b', whiteIndex: 4 },
  { note: 'G#3', isBlack: true,  key: 'h', leftWhiteIndex: 4 },
  { note: 'A3',  isBlack: false, key: 'n', whiteIndex: 5 },
  { note: 'A#3', isBlack: true,  key: 'j', leftWhiteIndex: 5 },
  { note: 'B3',  isBlack: false, key: 'm', whiteIndex: 6 },
  { note: 'C4',  isBlack: false, key: 'q', whiteIndex: 7 },
  { note: 'C#4', isBlack: true,  key: '2', leftWhiteIndex: 7 },
  { note: 'D4',  isBlack: false, key: 'w', whiteIndex: 8 },
  { note: 'D#4', isBlack: true,  key: '3', leftWhiteIndex: 8 },
  { note: 'E4',  isBlack: false, key: 'e', whiteIndex: 9 },
  { note: 'F4',  isBlack: false, key: 'r', whiteIndex: 10 },
  { note: 'F#4', isBlack: true,  key: '5', leftWhiteIndex: 10 },
  { note: 'G4',  isBlack: false, key: 't', whiteIndex: 11 },
  { note: 'G#4', isBlack: true,  key: '6', leftWhiteIndex: 11 },
  { note: 'A4',  isBlack: false, key: 'y', whiteIndex: 12 },
  { note: 'A#4', isBlack: true,  key: '7', leftWhiteIndex: 12 },
  { note: 'B4',  isBlack: false, key: 'u', whiteIndex: 13 },
  { note: 'C5',  isBlack: false, key: 'i', whiteIndex: 14 },
]

const WHITE_KEYS = KEYS.filter(k => !k.isBlack)
const BLACK_KEYS = KEYS.filter(k => k.isBlack)

export default function Keyboard({ trigger, release, activeNotes = new Set(), initAudioContext }) {
  const isMouseDownRef = useRef(false)
  const hoveredNoteRef = useRef(null)

  useKeyboard({ trigger, release, initAudioContext, enabled: true })

  // Release the hovered note if mouse button is lifted outside any key
  useEffect(() => {
    function onWindowMouseUp() {
      if (!isMouseDownRef.current) return
      isMouseDownRef.current = false
      if (hoveredNoteRef.current) {
        release(hoveredNoteRef.current)
        hoveredNoteRef.current = null
      }
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [release])

  function handleMouseDown(note, e) {
    e.preventDefault()
    isMouseDownRef.current = true
    hoveredNoteRef.current = note
    initAudioContext?.()
    trigger(note)
  }

  function handleMouseEnter(note) {
    hoveredNoteRef.current = note
    if (isMouseDownRef.current) trigger(note)
  }

  function handleMouseLeave(note) {
    if (hoveredNoteRef.current === note) hoveredNoteRef.current = null
    if (isMouseDownRef.current) release(note)
  }

  function renderKey(keyData) {
    const isActive = activeNotes.has(keyData.note)
    const style = keyData.isBlack
      ? { left: (keyData.leftWhiteIndex + 1) * WHITE_WIDTH - BLACK_WIDTH / 2 }
      : {}

    const className = [
      'key',
      keyData.isBlack ? 'key--black' : 'key--white',
      isActive ? 'key--active' : '',
    ].filter(Boolean).join(' ')

    return (
      <div
        key={keyData.note}
        className={className}
        style={style}
        onMouseDown={(e) => handleMouseDown(keyData.note, e)}
        onMouseEnter={() => handleMouseEnter(keyData.note)}
        onMouseLeave={() => handleMouseLeave(keyData.note)}
      >
        <span className="key__note">{keyData.note}</span>
        <span className="key__shortcut">{keyData.key}</span>
      </div>
    )
  }

  return (
    <div className="keyboard">
      {WHITE_KEYS.map(renderKey)}
      {BLACK_KEYS.map(renderKey)}
    </div>
  )
}

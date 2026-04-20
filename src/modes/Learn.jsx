import { useState, useRef, useCallback } from 'react'
import { KEY_MAP } from '../hooks/useKeyboard'
import { parseSong } from '../songs/parseSong'
import { playSong } from '../songs/playSong'
import PlayLayout from './PlayLayout'
import furEliseRaw from '../songs/furElise.txt?raw'
import odeToJoyRaw from '../songs/odeToJoy.txt?raw'
import maryHadALittleLambRaw from '../songs/maryHadALittleLamb.txt?raw'
import twinkleTwinkleLittleStarRaw from '../songs/twinkleTwinkleLittleStar.txt?raw'
import happyBirthdayRaw from '../songs/happyBirthday.txt?raw'
import jingleBellsRaw from '../songs/jingleBells.txt?raw'
import sevenNationArmyRaw from '../songs/sevenNationArmy.txt?raw'
import youAreMySunshineRaw from '../songs/youAreMySunshine.txt?raw'
import symphonyNo5Raw from '../songs/symphonyNo5.txt?raw'
import rowYourBoatRaw from '../songs/rowYourBoat.txt?raw'
import './Learn.css'

const SONGS = [
  { name: 'Fur Elise', raw: furEliseRaw },
  { name: 'Ode to Joy', raw: odeToJoyRaw },
  { name: 'Mary Had a Little Lamb', raw: maryHadALittleLambRaw },
  { name: 'Twinkle Twinkle Little Star', raw: twinkleTwinkleLittleStarRaw },
  { name: 'Happy Birthday', raw: happyBirthdayRaw },
  { name: 'Jingle Bells', raw: jingleBellsRaw },
  { name: 'Seven Nation Army', raw: sevenNationArmyRaw },
  { name: 'You Are My Sunshine', raw: youAreMySunshineRaw },
  { name: 'Symphony No. 5', raw: symphonyNo5Raw },
  { name: 'Row Your Boat', raw: rowYourBoatRaw },
]

export default function Learn({ sampler }) {
  const {
    trigger, release, releaseAll, initAudioContext, activeNotes,
    analyserNode, decodeAudioFile, addClip, selectClip, removeClip,
    clipSlots, currentClipName,
    startRecording, stopRecording, exportWav, exportMp3, isRecording,
  } = sampler

  const [view, setView] = useState('selection')
  const [selectedSong, setSelectedSong] = useState(null)
  const [playingSongName, setPlayingSongName] = useState(null)
  const [isPlayingLearn, setIsPlayingLearn] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const cancelPlayRef = useRef(null)

  const startSongPlayback = useCallback((tokens, onDone) => {
    return playSong(tokens, trigger, release, releaseAll, onDone)
  }, [trigger, release, releaseAll])

  const handlePreviewPlay = useCallback((song) => {
    if (playingSongName === song.name) {
      cancelPlayRef.current?.()
      cancelPlayRef.current = null
      setPlayingSongName(null)
      return
    }
    cancelPlayRef.current?.()
    cancelPlayRef.current = null
    initAudioContext()
    const tokens = parseSong(song.raw)
    setPlayingSongName(song.name)
    cancelPlayRef.current = startSongPlayback(tokens, () => {
      setPlayingSongName(null)
      cancelPlayRef.current = null
    })
  }, [playingSongName, initAudioContext, startSongPlayback])

  const handleLearnPlay = useCallback(() => {
    if (isPlayingLearn) {
      cancelPlayRef.current?.()
      cancelPlayRef.current = null
      setIsPlayingLearn(false)
      return
    }
    const tokens = parseSong(selectedSong.raw)
    setIsPlayingLearn(true)
    cancelPlayRef.current = startSongPlayback(tokens, () => {
      setIsPlayingLearn(false)
      cancelPlayRef.current = null
    })
  }, [isPlayingLearn, selectedSong, startSongPlayback])

  const handleLearnSong = useCallback((song) => {
    cancelPlayRef.current?.()
    cancelPlayRef.current = null
    setPlayingSongName(null)
    setSelectedSong(song)
    setView('learn')
  }, [])

  const handleBack = useCallback(() => {
    cancelPlayRef.current?.()
    cancelPlayRef.current = null
    setIsPlayingLearn(false)
    setShowHelp(false)
    setView('selection')
    setSelectedSong(null)
  }, [])

  if (view === 'learn') {
    const songPanel = (
      <div className="learn__song-panel">
        <div className="learn__song-panel-header">
          <h3 className="learn__song-title">{selectedSong.name}</h3>
          <div className="learn__panel-actions">
            <button className="learn__play-btn" onClick={handleLearnPlay}>
              {isPlayingLearn ? 'Stop' : 'Play Song'}
            </button>
            <button className="learn__help-btn" onClick={() => setShowHelp(v => !v)}>?</button>
            <button className="learn__back-btn" onClick={handleBack}>Back</button>
          </div>
        </div>
        <pre className="learn__song-content">{selectedSong.raw}</pre>
        {showHelp && (
          <div className="learn__help-overlay" onClick={() => setShowHelp(false)}>
            <div className="learn__help-modal" onClick={e => e.stopPropagation()}>
              <h4 className="learn__help-title">Song Token Syntax</h4>
              <p>Each token is <strong>key</strong> + <strong>duration</strong>, e.g. <code>g2</code> or <code>h3</code>.</p>
              <ul>
                <li><strong>key</strong> — one physical keyboard key from the table below</li>
                <li><strong>duration</strong> — positive integer; 1 unit = 250 ms (e.g. <code>4</code> = 1 second)</li>
              </ul>
              <p>Whitespace and blank lines are ignored. Unknown tokens are skipped.</p>
              <table className="learn__key-table">
                <thead><tr><th>Key</th><th>Note</th></tr></thead>
                <tbody>
                  {Object.entries(KEY_MAP).map(([k, n]) => (
                    <tr key={k}><td><code>{k}</code></td><td>{n}</td></tr>
                  ))}
                </tbody>
              </table>
              <button className="learn__help-close" onClick={() => setShowHelp(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    )

    return (
      <PlayLayout
        trigger={trigger}
        release={release}
        activeNotes={activeNotes}
        initAudioContext={initAudioContext}
        analyserNode={analyserNode}
        decodeAudioFile={decodeAudioFile}
        addClip={addClip}
        selectClip={selectClip}
        removeClip={removeClip}
        clipSlots={clipSlots}
        currentClipName={currentClipName}
        startRecording={startRecording}
        stopRecording={stopRecording}
        exportWav={exportWav}
        exportMp3={exportMp3}
        isRecording={isRecording}
        topPanel={songPanel}
      />
    )
  }

  return (
    <div className="learn">
      <h2 className="learn__heading">Choose a Song</h2>
      <ul className="learn__song-list">
        {SONGS.map(song => (
          <li key={song.name} className="learn__song-item">
            <span className="learn__song-name">{song.name}</span>
            <div className="learn__song-btns">
              <button
                className={`learn__preview-btn${playingSongName === song.name ? ' learn__preview-btn--stop' : ''}`}
                onClick={() => handlePreviewPlay(song)}
              >
                {playingSongName === song.name ? 'Stop' : 'Play'}
              </button>
              <button
                className="learn__learn-btn"
                onClick={() => handleLearnSong(song)}
              >
                Learn
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

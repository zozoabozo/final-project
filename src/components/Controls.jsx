import ClipManager from './ClipManager'
import Recorder from './Recorder'
import './Controls.css'

export default function Controls({
  clipSlots,
  currentClipName,
  selectClip,
  removeClip,
  addClip,
  decodeAudioFile,
  initAudioContext,
  startRecording,
  stopRecording,
  exportWav,
  exportMp3,
  isRecording,
}) {
  return (
    <div className="controls">
      <ClipManager
        clipSlots={clipSlots}
        currentClipName={currentClipName}
        selectClip={selectClip}
        removeClip={removeClip}
        addClip={addClip}
        decodeAudioFile={decodeAudioFile}
        initAudioContext={initAudioContext}
      />
      <Recorder
        startRecording={startRecording}
        stopRecording={stopRecording}
        exportWav={exportWav}
        exportMp3={exportMp3}
        isRecording={isRecording}
      />
    </div>
  )
}

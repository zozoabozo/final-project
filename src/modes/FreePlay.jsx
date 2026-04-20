import PlayLayout from './PlayLayout'
import dogGif from '../assets/dogdancinggif.gif'

function DancingDog({ isPlaying }) {
  return (
    <div className="dancing-dog">
      {isPlaying && (
        <img src={dogGif} alt="dancing dog" className="dancing-dog__img" />
      )}
    </div>
  )
}

export default function FreePlay({ sampler }) {
  const {
    trigger, release, activeNotes, initAudioContext,
    analyserNode, decodeAudioFile, addClip, selectClip, removeClip,
    clipSlots, currentClipName,
    startRecording, stopRecording, exportWav, exportMp3, isRecording,
  } = sampler

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
      bottomPanel={<DancingDog isPlaying={activeNotes.size > 0} />}
    />
  )
}

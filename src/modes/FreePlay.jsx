import { useSampler } from '../hooks/useSampler'
import PlayLayout from './PlayLayout'

export default function FreePlay() {
  const {
    trigger, release, activeNotes, initAudioContext,
    analyserNode, decodeAudioFile, addClip, selectClip, removeClip,
    clipSlots, currentClipName,
    startRecording, stopRecording, exportWav, exportMp3, isRecording,
  } = useSampler()

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
    />
  )
}

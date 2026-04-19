import { useSampler } from '../hooks/useSampler'
import Keyboard from '../components/Keyboard'
import Spectrogram from '../components/Spectrogram'
import Controls from '../components/Controls'
import './FreePlay.css'

export default function FreePlay() {
  const {
    trigger, release, activeNotes, initAudioContext,
    analyserNode, decodeAudioFile, addClip, selectClip, removeClip,
    clipSlots, currentClipName,
    startRecording, stopRecording, exportWav, exportMp3, isRecording,
  } = useSampler()

  return (
    <div className="freeplay">
      <Spectrogram analyserNode={analyserNode} width={600} height={150} />
      <Keyboard
        trigger={trigger}
        release={release}
        activeNotes={activeNotes}
        initAudioContext={initAudioContext}
      />
      <Controls
        clipSlots={clipSlots}
        currentClipName={currentClipName}
        selectClip={selectClip}
        removeClip={removeClip}
        addClip={addClip}
        decodeAudioFile={decodeAudioFile}
        initAudioContext={initAudioContext}
        startRecording={startRecording}
        stopRecording={stopRecording}
        exportWav={exportWav}
        exportMp3={exportMp3}
        isRecording={isRecording}
      />
    </div>
  )
}

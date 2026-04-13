import lamejs from 'lamejs'

/**
 * Recorder — captures audio output via MediaRecorder.
 * Supports export to .wav and .mp3 (via lamejs).
 *
 * Audio graph:
 *   sampler.outputNode → recorder.inputNode (MediaStreamDestination)
 *
 * Wire inputNode externally (useSampler / Recorder component in Phase 3/4).
 */

export function createRecorder(audioContext) {
  // All captured audio enters through this node.
  const streamDest = audioContext.createMediaStreamDestination()

  let mediaRecorder = null
  let chunks = []
  let recordedBlob = null

  return {
    /**
     * The MediaStreamDestination node.
     * Connect your audio graph output here to feed the recorder.
     * e.g. sampler.outputNode.connect(recorder.inputNode)
     */
    inputNode: streamDest,

    /** True while a recording is actively in progress. */
    isRecording() {
      return mediaRecorder !== null && mediaRecorder.state === 'recording'
    },

    /**
     * Begin capturing audio. Resets any previously recorded data.
     */
    startRecording() {
      chunks = []
      recordedBlob = null
      mediaRecorder = new MediaRecorder(streamDest.stream)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.start()
    },

    /**
     * Stop capturing and collect all chunks into a single Blob.
     * @returns {Promise<Blob>} Resolves with the recorded audio blob.
     */
    stopRecording() {
      return new Promise((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          resolve(null)
          return
        }
        mediaRecorder.onstop = () => {
          recordedBlob = new Blob(chunks, { type: 'audio/webm' })
          resolve(recordedBlob)
        }
        mediaRecorder.stop()
      })
    },

    /**
     * Decode the recorded audio and return it as a WAV Blob (16-bit PCM).
     * Must be called after stopRecording() resolves.
     * @returns {Promise<Blob>}
     */
    async exportWav() {
      if (!recordedBlob) throw new Error('No recording available. Call stopRecording() first.')
      const arrayBuffer = await blobToArrayBuffer(recordedBlob)
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const wav = encodeWav(audioBuffer)
      return new Blob([wav], { type: 'audio/wav' })
    },

    /**
     * Decode the recorded audio and return it as an MP3 Blob (128 kbps via lamejs).
     * Must be called after stopRecording() resolves.
     * @returns {Promise<Blob>}
     */
    async exportMp3() {
      if (!recordedBlob) throw new Error('No recording available. Call stopRecording() first.')
      const arrayBuffer = await blobToArrayBuffer(recordedBlob)
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      const mp3 = encodeMp3(audioBuffer)
      return new Blob([mp3], { type: 'audio/mpeg' })
    },
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Read a Blob as an ArrayBuffer using FileReader.
 * More broadly supported than Blob.arrayBuffer() across jsdom and older browsers.
 * @param {Blob} blob
 * @returns {Promise<ArrayBuffer>}
 */
function blobToArrayBuffer(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Encode an AudioBuffer as a 16-bit PCM WAV ArrayBuffer.
 * Channels are interleaved: [L0 R0 L1 R1 ...].
 * @param {AudioBuffer} audioBuffer
 * @returns {ArrayBuffer}
 */
function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const numSamples = audioBuffer.length
  const bitDepth = 16
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample
  const byteCount = numSamples * numChannels * bytesPerSample

  const arrayBuffer = new ArrayBuffer(44 + byteCount)
  const view = new DataView(arrayBuffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  // RIFF header
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + byteCount, true)
  writeStr(8, 'WAVE')
  // fmt chunk
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)               // chunk length
  view.setUint16(20, 1, true)                // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true) // byte rate
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  // data chunk
  writeStr(36, 'data')
  view.setUint32(40, byteCount, true)

  // Interleave channel data as 16-bit signed integers
  const channelData = []
  for (let c = 0; c < numChannels; c++) channelData.push(audioBuffer.getChannelData(c))

  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channelData[c][i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }
  }

  return arrayBuffer
}

/**
 * Encode an AudioBuffer as MP3 at 128 kbps using lamejs.
 * @param {AudioBuffer} audioBuffer
 * @returns {Uint8Array}
 */
function encodeMp3(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const BLOCK_SIZE = 1152 // samples per MP3 frame

  const toInt16 = (floats) => {
    const out = new Int16Array(floats.length)
    for (let i = 0; i < floats.length; i++) {
      const s = Math.max(-1, Math.min(1, floats[i]))
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return out
  }

  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, 128)
  const mp3Chunks = []

  if (numChannels === 1) {
    const samples = toInt16(audioBuffer.getChannelData(0))
    for (let i = 0; i < samples.length; i += BLOCK_SIZE) {
      const encoded = encoder.encodeBuffer(samples.subarray(i, i + BLOCK_SIZE))
      if (encoded.length > 0) mp3Chunks.push(new Uint8Array(encoded))
    }
  } else {
    const left = toInt16(audioBuffer.getChannelData(0))
    const right = toInt16(audioBuffer.getChannelData(1))
    for (let i = 0; i < left.length; i += BLOCK_SIZE) {
      const encoded = encoder.encodeBuffer(
        left.subarray(i, i + BLOCK_SIZE),
        right.subarray(i, i + BLOCK_SIZE),
      )
      if (encoded.length > 0) mp3Chunks.push(new Uint8Array(encoded))
    }
  }

  const flushed = encoder.flush()
  if (flushed.length > 0) mp3Chunks.push(new Uint8Array(flushed))

  const totalLength = mp3Chunks.reduce((acc, c) => acc + c.length, 0)
  const result = new Uint8Array(totalLength)
  let pos = 0
  for (const chunk of mp3Chunks) { result.set(chunk, pos); pos += chunk.length }
  return result
}

import { useRef, useEffect } from 'react'
import './Spectrogram.css'

// Exported for testing: finds the Hz of the loudest bin in a Float32 frequency array.
export function getDominantFrequencyHz(frequencyData, sampleRate) {
  let maxVal = -Infinity
  let maxBin = 0
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > maxVal) {
      maxVal = frequencyData[i]
      maxBin = i
    }
  }
  const fftSize = frequencyData.length * 2
  return maxBin * (sampleRate / fftSize)
}

export default function Spectrogram({ analyserNode, width = 600, height = 150 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Draw silent placeholder when there's no node yet
    if (!analyserNode) {
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)
      return
    }

    const bufferLength = analyserNode.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    // Show lower half of bins (~0–11 kHz at 44100 Hz sample rate)
    const binsToShow = Math.floor(bufferLength / 2)
    const barWidth = width / binsToShow

    function draw() {
      rafRef.current = requestAnimationFrame(draw)
      analyserNode.getByteFrequencyData(dataArray)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < binsToShow; i++) {
        const amplitude = dataArray[i] / 255
        if (amplitude === 0) continue

        const barHeight = amplitude * height
        // Blue at low amplitude → yellow at high amplitude
        const hue = 220 - amplitude * 180
        const lightness = 40 + amplitude * 25
        ctx.fillStyle = `hsl(${hue}, 85%, ${lightness}%)`
        ctx.fillRect(
          Math.floor(i * barWidth),
          height - barHeight,
          Math.max(1, Math.ceil(barWidth) - 1),
          barHeight,
        )
      }
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyserNode, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="spectrogram" />
}

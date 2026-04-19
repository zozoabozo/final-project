import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import Controls from '../src/components/Controls'

function makeProps(overrides = {}) {
  return {
    clipSlots: Array(5).fill(null),
    currentClipName: null,
    selectClip: vi.fn(),
    removeClip: vi.fn(),
    addClip: vi.fn(),
    decodeAudioFile: vi.fn(),
    initAudioContext: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(() => Promise.resolve(null)),
    exportWav: vi.fn(() => Promise.resolve(new Blob())),
    exportMp3: vi.fn(() => Promise.resolve(new Blob())),
    isRecording: false,
    ...overrides,
  }
}

describe('Controls', () => {
  it('renders ClipManager and Recorder', () => {
    render(<Controls {...makeProps()} />)
    expect(screen.getByText(/Clips/i)).toBeInTheDocument()
    expect(screen.getByText('Recorder')).toBeInTheDocument()
  })

  it('renders all 5 clip slots', () => {
    render(<Controls {...makeProps()} />)
    expect(screen.getAllByText('empty')).toHaveLength(5)
  })

  it('calls startRecording when Record is clicked', () => {
    const startRecording = vi.fn()
    render(<Controls {...makeProps({ startRecording })} />)
    fireEvent.click(screen.getByText('Record'))
    expect(startRecording).toHaveBeenCalledOnce()
  })

  it('calls stopRecording when Stop is clicked while recording', async () => {
    const stopRecording = vi.fn(() => Promise.resolve(null))
    render(<Controls {...makeProps({ isRecording: true, stopRecording })} />)
    await act(async () => { fireEvent.click(screen.getByText('Stop')) })
    expect(stopRecording).toHaveBeenCalledOnce()
  })

  it('shows upload button in ClipManager', () => {
    render(<Controls {...makeProps()} />)
    expect(screen.getByText('+ Upload')).toBeInTheDocument()
  })

  it('shows a filled clip slot when clipSlots has an entry', () => {
    const clipSlots = [{ name: 'my-beat' }, null, null, null, null]
    render(<Controls {...makeProps({ clipSlots, currentClipName: 'my-beat' })} />)
    expect(screen.getByText('my-beat')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Post-recording UI (Play button, format selector, filename input, export)
// ---------------------------------------------------------------------------

describe('Controls — after recording', () => {
  let mockAudio
  let origCreateObjectURL
  let origRevokeObjectURL

  beforeEach(() => {
    mockAudio = { play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), onended: null }
    vi.stubGlobal('Audio', vi.fn(() => mockAudio))
    origCreateObjectURL = URL.createObjectURL
    origRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob:mock')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = origCreateObjectURL
    URL.revokeObjectURL = origRevokeObjectURL
    vi.unstubAllGlobals()
  })

  // Simulate the full stop-recording flow:
  // 1. Render with isRecording:true → click Stop → internal hasRecording becomes true
  // 2. Rerender with isRecording:false so the post-recording UI is visible
  async function renderAndStop(extraProps = {}) {
    const stopRecording = vi.fn(() => Promise.resolve(new Blob(['x'], { type: 'audio/webm' })))
    const recordingProps = { isRecording: true, stopRecording, ...extraProps }
    const { rerender } = render(<Controls {...makeProps(recordingProps)} />)
    await act(async () => { fireEvent.click(screen.getByText('Stop')) })
    rerender(<Controls {...makeProps({ isRecording: false, stopRecording, ...extraProps })} />)
    return stopRecording
  }

  it('Play button is not shown before any recording', () => {
    render(<Controls {...makeProps()} />)
    expect(screen.queryByText('Play')).not.toBeInTheDocument()
  })

  it('Play button appears after stopping a recording', async () => {
    await renderAndStop()
    expect(screen.getByText('Play')).toBeInTheDocument()
  })

  it('clicking Play starts audio playback', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    expect(mockAudio.play).toHaveBeenCalledOnce()
  })

  it('Play button label changes to Stop during playback', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    // Record button still says Record; the playback control now says Stop
    expect(screen.getByText('Record')).toBeInTheDocument()
    expect(screen.getAllByText('Stop')).toHaveLength(1)
  })

  it('clicking Stop during playback pauses audio', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    fireEvent.click(screen.getByText('Stop'))
    expect(mockAudio.pause).toHaveBeenCalledOnce()
  })

  it('filename input appears with default value "recording"', async () => {
    await renderAndStop()
    expect(screen.getByDisplayValue('recording')).toBeInTheDocument()
  })

  it('filename input updates when the user types', async () => {
    await renderAndStop()
    fireEvent.change(screen.getByDisplayValue('recording'), { target: { value: 'my-song' } })
    expect(screen.getByDisplayValue('my-song')).toBeInTheDocument()
  })

  it('format buttons and Export button are shown', async () => {
    await renderAndStop()
    expect(screen.getByText('.wav')).toBeInTheDocument()
    expect(screen.getByText('.mp3')).toBeInTheDocument()
    expect(screen.getByText('Export')).toBeInTheDocument()
  })

  it('shows playback timer when playing', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    expect(screen.getByText('0:00/0:00')).toBeInTheDocument()
  })

  it('timer reflects loaded duration and current time', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    act(() => {
      mockAudio.duration = 49
      mockAudio.onloadedmetadata?.()
    })
    act(() => {
      mockAudio.currentTime = 33
      mockAudio.ontimeupdate?.()
    })
    expect(screen.getByText('0:33/0:49')).toBeInTheDocument()
  })

  it('timer is removed when playback is stopped', async () => {
    await renderAndStop()
    await act(async () => { fireEvent.click(screen.getByText('Play')) })
    fireEvent.click(screen.getByText('Stop'))
    expect(screen.queryByText(/\d:\d\d\/\d:\d\d/)).not.toBeInTheDocument()
  })
})

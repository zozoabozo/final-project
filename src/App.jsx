import React, { useState } from 'react'

function App() {
  const [mode, setMode] = useState('freeplay')

  return (
    <div>
      <nav>
        <button onClick={() => setMode('freeplay')}>Free Play</button>
        <button onClick={() => setMode('learn')}>Learn</button>
        <button onClick={() => setMode('explore')}>Explore</button>
      </nav>
      <main>
        {mode === 'freeplay' && <div>Free Play mode — coming soon</div>}
        {mode === 'learn' && <div>Learn mode — coming soon</div>}
        {mode === 'explore' && <div>Explore mode — coming soon</div>}
      </main>
    </div>
  )
}

export default App
